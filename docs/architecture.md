# Arsitektur

Monorepo microservices: satu frontend Next.js, satu API Gateway yang sekaligus
menjadi server gRPC, dan tiga backend service. Domain yang tercakup:
**autentikasi & manajemen user**, **subscription + voucher + pembayaran
Midtrans**, dan **forum chat realtime**.

Komunikasi antar service memakai REST, WebSocket, dan gRPC.

> **Fokus pengembangan saat ini adalah manajemen user dan subscription.**
> `realtime-service` sudah berjalan tetapi pengembangan fitur chat **on-hold**.
> Rencana yang sudah disepakati untuk service tersebut dicatat di
> [operations.md → Status Pengembangan](operations.md#status-pengembangan);
> dokumen ini tetap menjelaskan kode sebagaimana adanya sekarang.

## Peta Service

```text
                                  Browser
                                     │
                 ┌───────────────────┴───────────────────┐
                 │ :3000                                 │ :8080
                 ▼                                       ▼
        ┌──────────────────┐               ┌───────────────────────────────┐
        │  frontend        │               │  grpc-service                 │
        │  Next.js 16      │◄──fallback────│  :8080  HTTP + WS Gateway     │
        │  :3000           │               │  :50051 gRPC UserService      │
        └────────┬─────────┘               └──┬─────────┬──────────────┬───┘
                 │ SERVER_API_URL             │         │              │
                 │ SERVER_GATEWAY_URL         │ /api/v1 │ /api/v1      │ /ws
                 │ (server-side fetch)        │  /auth  │  /main       │
                 │                            │  /users │              │
                 ▼                            ▼         ▼              ▼
        ┌─────────────────────┐   ┌──────────────────┐  ┌─────────────────────┐
        │  auth-service       │   │  main-service    │  │  realtime-service   │
        │  :8000 HTTP         │   │  :8002 HTTP      │  │  :8001 HTTP + WS    │
        │  Rust / Axum        │   │  Go / Fiber v3   │  │  Rust / Axum        │
        └─────────────────────┘   └────────┬─────────┘  └──────────┬──────────┘
                                           │                       │
                                           └── gRPC UserService ───┤
                                               ke grpc-service:50051
                                                                   │
      ┌────────────────────────────────────────────────────────────┴──────────┐
      │ PostgreSQL :5433 │ Redis :6379 │ RabbitMQ :5672 │ MinIO :9000 │ Kafka :9092 │
      └───────────────────────────────────────────────────────────────────────┘
```

> **Penting:** server gRPC `UserService` dijalankan oleh **`grpc-service`** pada
> port `50051` ([`grpc-service/src/main.rs`](../grpc-service/src/main.rs)), bukan
> oleh `auth-service`. `auth-service` hanya melayani HTTP `:8000`. Variabel
> `AUTH_GRPC_URL` di `main-service` dan `realtime-service` harus menunjuk ke
> `grpc-service:50051`.

> **Kafka sudah disediakan tetapi belum dipakai kode mana pun.** Broker berjalan
> di [`docker-compose.dev.yml`](../docker-compose.dev.yml) dan
> [`tools/kafka/docker-compose.yml`](../tools/kafka/docker-compose.yml) sebagai
> persiapan migrasi event `realtime-service` dari RabbitMQ ke Kafka. Sampai
> migrasi itu dikerjakan, event chat tetap lewat RabbitMQ. Lihat
> [operations.md → Status Pengembangan](operations.md#status-pengembangan).

## Daftar Service

| Service | Stack | Port | Tanggung jawab |
|---|---|---|---|
| `frontend` | Next.js 16, React 19, Tailwind 4 | 3000 | UI + BFF auth (cookie session) |
| `grpc-service` | Rust, Axum, tonic | 8080 (gateway), 50051 (gRPC) | Reverse proxy HTTP/WS **dan** server gRPC `UserService` |
| `auth-service` | Rust, Axum, sqlx | 8000 | Sign-up/in/refresh, OAuth GitHub & Google, CRUD user |
| `realtime-service` | Rust, Axum, sqlx | 8001 | Chat WebSocket, Redis pub/sub, worker RabbitMQ, upload MinIO — **on-hold** |
| `main-service` | Go, Fiber v3, GORM | 8002 | Account type, subscription plan, voucher, member, Midtrans |
| `shared-core` | Rust library crate | — | `User` entity, `JwtService`, pool Postgres, `PostgresUserRepository` |

Service yang direncanakan tetapi **belum ada di repo**: `notification-service`
— nantinya jadi satu-satunya konsumen RabbitMQ.

`shared-core` dipakai bersama oleh `auth-service` dan `grpc-service` (path
dependency, bukan crate yang dipublish). Port service Rust di-hardcode di kode
dan tidak bisa diubah lewat env; hanya `main-service` yang membaca `PORT`.

## Alur Request HTTP

Browser hanya bicara ke dua origin: `localhost:3000` (Next.js) dan
`localhost:8080` (gateway). Routing gateway ada di
[`grpc-service/src/gateway.rs`](../grpc-service/src/gateway.rs):

| Pola route di gateway | Diteruskan ke | Transformasi path |
|---|---|---|
| `/api/v1/auth` dan `/api/v1/auth/*` | `AUTH_SERVICE_URL` | tidak diubah |
| `/api/v1/users` dan `/api/v1/users/*` | `AUTH_SERVICE_URL` | tidak diubah |
| `/api/v1/main` dan `/api/v1/main/*` | `MAIN_SERVICE_URL` | prefix `/api/v1/main` → `/api/v1` |
| `/ws` dan `/ws/*` (GET saja) | `REALTIME_SERVICE_WS_URL` | tidak diubah (bridge WebSocket dua arah) |
| selain di atas (fallback) | `FRONTEND_URL` | tidak diubah |

Gateway memasang `CorsLayer::permissive()`, meneruskan seluruh header kecuali
`Host`, dan mem-stream body request maupun response.

## Autentikasi

JWT **RS256**. Satu pasang kunci RSA dipakai bersama semua service lewat env
`JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY`.

Umur token ditetapkan di
[`shared-core/src/infrastructure/auth/jwt.rs`](../shared-core/src/infrastructure/auth/jwt.rs):
`access_token` **15 menit**, `refresh_token` **7 hari**. Isi claim:
`sub`, `name`, `email`, `phone`, `role`, `avatar_url`, `discord_username`,
`exp`, `iat`, `token_type` (`"access"` / `"refresh"`).

Alurnya:

1. `auth-service` menerbitkan `access_token` dan `refresh_token`.
2. Frontend menyimpan keduanya sebagai **httpOnly cookie** melalui route BFF
   [`/api/auth/[...all]`](../frontend/src/app/api/auth/%5B...all%5D/route.ts).
   Route ini ditulis tangan meniru bentuk API better-auth — paket `better-auth`
   sendiri hanya dipakai untuk `createAuthClient` di sisi client.
3. Refresh token dijalankan otomatis di dua tempat: `GET /api/auth/get-session`
   dan [`frontend/src/proxy.ts`](../frontend/src/proxy.ts) (proxy/middleware
   Next.js).

Verifikasi token berbeda per konsumen:

| Konsumen | Cara verifikasi |
|---|---|
| `main-service` | gRPC `ValidateToken` ke `grpc-service:50051` ([`middleware/auth.go`](../main-service/infrastructure/middleware/auth.go)) |
| `realtime-service` | Verifikasi RS256 lokal, lalu gRPC `GetUsers` untuk enrich nama/avatar/role pengirim |
| Frontend route handler `/api/auth/*` | `jwtVerify` dengan `JWT_PUBLIC_KEY`. Bila env kosong, jatuh ke decode tanpa verifikasi tanda tangan |
| Frontend `proxy.ts` | Hanya `decodeJwt`, **tanpa** verifikasi tanda tangan dan **tanpa** cek `exp` — kedaluwarsa ditangani lewat `maxAge` cookie yang disamakan dengan `expires_in` |

Karena `proxy.ts` mengandalkan cookie httpOnly yang expired sendiri, begitu
`access_token` hilang tapi `refresh_token` masih ada, proxy memanggil
`POST /api/v1/auth/refresh` dan menuliskan ulang kedua cookie.

WebSocket tidak bisa mengirim header `Authorization` dari browser, jadi
`/api/v1/chat/ws` menerima token lewat query param `token`.

## Role

Nilai role yang valid di database: `User`, `Member`, `Maintainer`, `Admin`,
`SuperAdmin` (CHECK constraint pada `users.users`).

> Enum `Role` di
> [`shared-core/src/domain/entities/user.rs`](../shared-core/src/domain/entities/user.rs)
> memuat kelimanya. `SuperAdmin` diperlakukan setara `Admin` di seluruh lapisan
> otorisasi (Rust, Go, `proxy.ts`); endpoint Maintainer-only tetap
> Maintainer-only. Lihat [database.md](database.md#role-superadmin).

Proteksi route frontend diatur di [`frontend/src/proxy.ts`](../frontend/src/proxy.ts):

| Prefix path | Role yang diizinkan |
|---|---|
| `/admin` | `Admin`, `SuperAdmin` |
| `/maintainer` | `Maintainer` |
| `/forum` | `Maintainer`, `Admin`, `SuperAdmin`, `Member` |
| `/user` | semua role yang sudah login (tanpa cek role) |

Role yang ditolak dialihkan ke dashboard-nya sendiri: `Maintainer` →
`/maintainer/dashboard`, `Admin`/`SuperAdmin` → `/admin/dashboard`, `Member` →
`/forum/dashboard`, `User` → `/`.

Otorisasi di `main-service` memakai `RequireRole("Admin", "SuperAdmin",
"Maintainer")` untuk seluruh endpoint tulis dan endpoint admin.

## Perubahan Role Lintas Service

Role user disimpan di `users.users` (milik Rust) tetapi diubah oleh Go:

- Pembayaran settle → `main-service` memanggil gRPC `UpdateUserRole` dengan
  `Member`, plus `UpdateDiscordUsername` bila diisi saat checkout.
- Langganan kedaluwarsa → background worker
  [`subscription_worker.go`](../main-service/infrastructure/workers/subscription_worker.go)
  menurunkan role kembali ke `User`.

Worker tersebut jalan sekali saat startup, lalu setiap **10 menit**.

## Chat Realtime

> Pengembangan fitur ini **on-hold**. Bagian di bawah menjelaskan kode yang
> sudah ada, bukan target akhirnya.

[`realtime-service/src/handlers/chat.rs`](../realtime-service/src/handlers/chat.rs)
menangani satu koneksi WebSocket per user per `group_id`. Fan-out pesan
memakai dua lapis:

1. **Redis pub/sub** — setiap event dipublish ke channel `chat:group:{group_id}`.
   Semua instance `realtime-service` melakukan `psubscribe("chat:group:*")` saat
   startup, jadi pesan dari instance lain ikut sampai ke klien lokal.
2. **Broadcaster in-memory** ([`broadcaster.rs`](../realtime-service/src/infrastructure/websocket/broadcaster.rs))
   — satu `tokio::sync::broadcast` channel per group untuk klien di instance ini.

Pesan baru juga dipublish ke RabbitMQ exchange `chat.events` dengan routing key
`chat.message.created`, dikonsumsi tiga worker (notification, analytics,
moderation) yang berjalan di dalam proses `realtime-service` itu sendiri.
Detail queue ada di [database.md → RabbitMQ](database.md#rabbitmq--event-pesan).

> Lapisan event ini akan **dipindah ke Kafka** saat pengembangan chat
> dilanjutkan. RabbitMQ dialokasikan untuk `notification-service` yang terpisah.

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui + Radix, TanStack Query, Zustand, Tiptap, AG Grid |
| API Gateway | Rust, Axum, reqwest, tokio-tungstenite |
| Auth | Rust, Axum, sqlx, JWT RS256, OAuth2 (GitHub, Google) |
| Realtime | Rust, Axum WebSocket, Redis pub/sub, RabbitMQ (lapin), MinIO via AWS SDK S3 |
| Subscription & Payment | Go, Fiber v3, GORM, Midtrans (Snap + Core API) |
| RPC | gRPC — tonic (Rust), google.golang.org/grpc (Go) |
| Database | PostgreSQL 17 |
| Cache / Pub-Sub | Redis 7 |
| Message Broker | RabbitMQ 3 (dipakai sekarang) — Kafka 3.9 sudah tersedia, belum dipakai kode |
| Object Storage | MinIO |
| Container | Docker, Docker Compose (kompatibel Podman) |

## Struktur Monorepo

```
technostock/
├── docker-compose.dev.yml    # Unified dev (semua service + infra)
├── docker-compose.prod.yml   # Unified prod (build lokal)
├── docker-compose.hub.yml    # Deploy dari image Docker Hub
├── Makefile
├── .env.example
├── docs/                     # Dokumentasi (folder ini)
│
├── frontend/                 # Next.js 16
│   ├── src/app/              # App Router: (root), auth, admin, maintainer, forum, user, checkout, api
│   ├── src/modules/          # Fitur per domain: account-type, subscription-plan, member, voucher
│   ├── src/proxy.ts          # Proteksi route berbasis role
│   ├── src/libs/axios.ts     # Instance messageBackend (chat)
│   └── Dockerfile.dev / Dockerfile.prod
│
├── grpc-service/             # API Gateway + gRPC UserService
│   ├── src/gateway.rs        # Reverse proxy HTTP & bridge WebSocket
│   └── src/server/           # Implementasi UserService
│
├── auth-service/             # Rust — auth & user
│   ├── migrations/           # 13 migrasi sqlx
│   └── src/{handlers,usecases,infrastructure,routes}/
│
├── realtime-service/         # Rust — chat realtime (on-hold)
│   ├── migrations/           # 11 migrasi sqlx (subset dari auth-service)
│   └── src/{handlers,workers,infrastructure,domain}/
│
├── main-service/             # Go — subscription, voucher, member, payment
│   └── {cmd,handlers,usecases,domain,infrastructure,routes,pb}/
│
├── shared-core/              # Rust crate bersama (auth-service + grpc-service)
├── proto/                    # user.proto — kontrak gRPC UserService
└── tools/                    # Compose terpisah: postgres, redis, rabbitmq, minio, kafka
```
