# Technostock

Monorepo microservices yang terdiri dari 5 service: satu frontend Next.js, satu API Gateway, dan tiga backend service. Domain yang tercakup saat ini adalah **autentikasi & manajemen user**, **subscription + pembayaran Midtrans**, dan **forum chat realtime**.

Komunikasi antar service memakai REST, WebSocket, dan gRPC.

## Arsitektur

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
                 │ (server-side fetch)        │ /api/v1 │ /api/v1      │ /ws
                 │                            │  /auth  │  /main       │
                 ▼                            ▼         ▼              ▼
        ┌─────────────────────┐   ┌──────────────────┐  ┌─────────────────────┐
        │  auth-service       │   │  main-service    │  │  realtime-service   │
        │  :8000 HTTP         │   │  :8002 HTTP      │  │  :8001 HTTP + WS    │
        │  Rust / Axum        │   │  Go / Fiber v3   │  │  Rust / Axum        │
        └─────────────────────┘   └────────┬─────────┘  └──────────┬──────────┘
                                           │                       │
                                           └── gRPC ValidateToken ─┤
                                               GetUsers, dll.      │
                                               ke grpc-service:50051
                                                                   │
        ┌──────────────────────────────────────────────────────────┴──────────┐
        │  PostgreSQL :5433   │   Redis :6379   │  RabbitMQ :5672  │ MinIO :9000 │
        └─────────────────────────────────────────────────────────────────────┘
```

> **Penting:** server gRPC `UserService` dijalankan oleh **`grpc-service`** pada port `50051`, bukan oleh `auth-service`. `auth-service` hanya melayani HTTP `:8000`. Variabel `AUTH_GRPC_URL` di `main-service` dan `realtime-service` harus menunjuk ke `grpc-service:50051`.

## Daftar Service

| Service | Stack | Port | Tanggung jawab |
|---|---|---|---|
| `frontend` | Next.js 16, React 19, Tailwind 4 | 3000 | UI + BFF auth (cookie session) |
| `grpc-service` | Rust, Axum, tonic | 8080 (gateway), 50051 (gRPC) | Reverse proxy HTTP/WS **dan** server gRPC `UserService` |
| `auth-service` | Rust, Axum, sqlx | 8000 | Sign-up/in/refresh, OAuth GitHub & Google, CRUD user |
| `realtime-service` | Rust, Axum, sqlx | 8001 | Chat WebSocket, Redis pub/sub, worker RabbitMQ, upload MinIO |
| `main-service` | Go, Fiber v3, GORM | 8002 (+50052, lihat catatan) | Account type, subscription plan, langganan user, Midtrans |
| `shared-core` | Rust library crate | — | `User` entity, `JwtService`, pool Postgres, `PostgresUserRepository` |

`shared-core` dipakai bersama oleh `auth-service` dan `grpc-service` (path dependency, bukan crate yang dipublish).

---

## Alur Request

### HTTP dari browser

Browser hanya bicara ke dua origin: `localhost:3000` (Next.js) dan `localhost:8080` (gateway). Routing gateway ada di [`grpc-service/src/gateway.rs`](grpc-service/src/gateway.rs):

| Pola route di gateway | Diteruskan ke | Transformasi path |
|---|---|---|
| `/api/v1/auth` dan `/api/v1/auth/*` | `AUTH_SERVICE_URL` | tidak diubah |
| `/api/v1/main` dan `/api/v1/main/*` | `MAIN_SERVICE_URL` | prefix `/api/v1/main` → `/api/v1` |
| `/ws` dan `/ws/*` | `REALTIME_SERVICE_WS_URL` | tidak diubah (bridge WebSocket dua arah) |
| selain di atas (fallback) | `FRONTEND_URL` | tidak diubah |

### Autentikasi

JWT **RS256**. Satu pasang kunci RSA dipakai bersama oleh semua service lewat env `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY`.

1. `auth-service` menerbitkan `access_token` (± 15 menit) dan `refresh_token` (7 hari).
2. Frontend menyimpan keduanya sebagai **httpOnly cookie** melalui route BFF [`/api/auth/[...all]`](frontend/src/app/api/auth/%5B...all%5D/route.ts). Route ini ditulis tangan meniru bentuk API better-auth — paket `better-auth` sendiri hanya dipakai untuk `createAuthClient` di sisi client.
3. Refresh token dijalankan otomatis di dua tempat: `GET /api/auth/get-session` dan [`frontend/src/proxy.ts`](frontend/src/proxy.ts) (proxy/middleware Next.js).
4. Verifikasi token berbeda per konsumen:
   - **main-service** → gRPC `ValidateToken` ke `grpc-service:50051`
   - **realtime-service** → verifikasi RS256 lokal, lalu gRPC `GetUsers` untuk enrich nama/avatar/role pengirim
   - **frontend route handler** → `jwtVerify` dengan `JWT_PUBLIC_KEY`
   - **frontend `proxy.ts` dan server action `getSession()`** → hanya `decodeJwt` + cek `exp`, tanpa verifikasi tanda tangan (mengandalkan cookie httpOnly)

### Role

Nilai role yang valid di database: `User`, `Member`, `Maintainer`, `Admin`, `SuperAdmin`.

Proteksi route frontend diatur di [`frontend/src/proxy.ts`](frontend/src/proxy.ts):

| Prefix path | Role yang diizinkan |
|---|---|
| `/admin` | `Admin` |
| `/maintainer` | `Maintainer` |
| `/forum` | `Maintainer`, `Admin`, `Member` |
| `/user` | semua role yang sudah login |

---

## Prerequisites

### Untuk Docker (direkomendasikan)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) v24+ dan [Docker Compose](https://docs.docker.com/compose/) v2.20+
- RAM minimal **8 GB**. Limit memory pada service Rust di compose dev sengaja dinonaktifkan agar `cargo watch` tidak kena OOM/`SIGKILL`.

### Untuk manual
- [Node.js](https://nodejs.org/) v20+ & npm
- [Rust](https://rustup.rs/) 1.75+ & Cargo
- [Go](https://go.dev/) 1.21+
- [sqlx-cli](https://github.com/launchbadge/sqlx/tree/main/sqlx-cli) — `cargo install sqlx-cli --no-default-features --features postgres`
- [protoc](https://grpc.io/docs/protoc-installation/) — dibutuhkan oleh `build.rs` di `grpc-service` dan `realtime-service`
- PostgreSQL, Redis, RabbitMQ, MinIO berjalan lokal

Panduan instalasi per sistem operasi ada di [SETUP.md](SETUP.md).

---

## Cara Menjalankan

### Opsi 1 — Docker (semua service sekaligus)

```bash
git clone https://github.com/daffahaidar/technostock.git
cd technostock
```

Siapkan file `.env` untuk setiap service (lihat [Environment Variables](#environment-variables)), lalu:

```bash
make dev      # development, hot-reload, foreground
make dev-d    # development, background
make prod     # production build, foreground
make prod-d   # production build, background
```

Perintah lain:

```bash
make down-dev          # hentikan service dev
make down-dev-volumes  # hentikan dev + hapus semua volume (reset data)
make logs-dev          # tail logs
make ps-dev            # status container
make validate          # cek syntax semua compose file
make help              # daftar lengkap
```

Tersedia juga shortcut engine: `make docker:dev`, `make podman:dev`, `make docker:prod`, `make podman:prod`.

> Build pertama kali memakan 10–20 menit karena Rust dikompilasi dari nol. Build berikutnya jauh lebih cepat berkat layer cache dan named volume untuk `target/`.

**URL setelah semua service running:**

| URL | Keterangan |
|---|---|
| http://localhost:3000 | Frontend |
| http://localhost:8080 | API Gateway — satu-satunya endpoint yang dipanggil browser |
| http://localhost:8000 | auth-service (internal) |
| http://localhost:8001 | realtime-service (internal) |
| http://localhost:8002 | main-service (internal) |
| `localhost:50051` | gRPC `UserService` (internal, dilayani `grpc-service`) |
| http://localhost:15672 | RabbitMQ Management UI |
| http://localhost:9001 | MinIO Console |
| `localhost:5433` | PostgreSQL |

### Opsi 2 — Manual (per service)

**Urutan start penting**: `grpc-service` harus jalan lebih dulu, karena `main-service` gagal memvalidasi token dan `realtime-service` gagal start (`Failed to connect to GRPC`) tanpa gRPC `:50051`.

**1. Infrastruktur**

```bash
cd tools/postgres && docker compose up -d && cd ../..
cd tools/redis    && docker compose up -d && cd ../..
cd tools/rabbitmq && docker compose up -d && cd ../..
cd tools/minio    && docker compose up -d && cd ../..
```

**2. grpc-service** (gateway + gRPC)

```bash
cd grpc-service
cargo run          # :8080 dan :50051
```

**3. auth-service**

```bash
cd auth-service
sqlx database create   # jika database belum ada
sqlx migrate run
cargo run              # atau: cargo watch -c -x run
```

**4. realtime-service**

```bash
cd realtime-service
cargo run              # atau: cargo watch -c -x run
```

Migrasi realtime-service dijalankan otomatis saat startup. Lihat [Database & Migrasi](#database--migrasi) sebelum menjalankan `sqlx migrate run` manual di sini.

**5. main-service**

```bash
cd main-service
go mod download
go run ./cmd/api/main.go   # atau: air
```

**6. frontend**

```bash
cd frontend
npm install
npm run dev                # atau: npm run build && npm start
```

---

## Environment Variables

> Jangan commit file `.env` — sudah di-exclude oleh `.gitignore`. Template lengkap ada di [.env.example](.env.example).

Kolom **Wajib** berarti service akan gagal start (panic / `log.Fatal`) jika variabel tidak diisi.

### `auth-service/.env` → HTTP `:8000`

| Variabel | Wajib | Default | Keterangan |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | `postgres://postgres:admin@localhost:5433/technostock` |
| `JWT_PRIVATE_KEY` | ✅ | — | PEM RSA, `\n` di-escape |
| `JWT_PUBLIC_KEY` | ✅ | — | PEM RSA, `\n` di-escape |
| `GITHUB_CLIENT_ID` | ✅ | — | Service panic jika kosong, meski OAuth GitHub tidak dipakai |
| `GITHUB_CLIENT_SECRET` | ✅ | — | |
| `GITHUB_REDIRECT_URI` | ✅ | — | `http://localhost:3000/api/auth/oauth-callback?provider=github` |
| `GOOGLE_CLIENT_ID` | ✅ | — | Service panic jika kosong, meski OAuth Google tidak dipakai |
| `GOOGLE_CLIENT_SECRET` | ✅ | — | |
| `GOOGLE_REDIRECT_URI` | ✅ | — | `http://localhost:3000/api/auth/oauth-callback?provider=google` |
| `RUST_LOG` | — | `rust_auth=debug,tower_http=debug,sqlx=info` | |

### `grpc-service/.env` → gateway `:8080` + gRPC `:50051`

| Variabel | Wajib | Default | Keterangan |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | Dipakai oleh `UserService` gRPC |
| `JWT_PRIVATE_KEY` | ✅ | — | |
| `JWT_PUBLIC_KEY` | ✅ | — | Dipakai untuk `ValidateToken` |
| `AUTH_SERVICE_URL` | — | `http://localhost:8000` | Target proxy `/api/v1/auth/*` |
| `MAIN_SERVICE_URL` | — | `http://localhost:8002` | Target proxy `/api/v1/main/*` |
| `REALTIME_SERVICE_WS_URL` | — | `ws://localhost:8001` | Target bridge `/ws/*` |
| `FRONTEND_URL` | — | `http://localhost:3000` | Target fallback. **Di Docker wajib di-set ke `http://frontend:3000`** — default `localhost` menunjuk ke dalam container gateway sendiri |
| `RUST_LOG` | — | `grpc_service=debug,sqlx=info` | |

### `realtime-service/.env` → HTTP + WS `:8001`

`JWT_PUBLIC_KEY` harus identik dengan milik `auth-service`. `JWT_PRIVATE_KEY` juga wajib diisi karena dibutuhkan konstruktor `JwtService`, walaupun service ini hanya memverifikasi token.

| Variabel | Wajib | Default | Keterangan |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | |
| `JWT_PRIVATE_KEY` | ✅ | — | |
| `JWT_PUBLIC_KEY` | ✅ | — | |
| `AUTH_GRPC_URL` | — | `http://127.0.0.1:50051` | **Menunjuk ke `grpc-service`**, bukan `auth-service` |
| `MINIO_ACCESS_KEY` | ✅ | — | |
| `MINIO_SECRET_KEY` | ✅ | — | |
| `MINIO_BUCKET` | ✅ | — | `technostock` |
| `MINIO_ENDPOINT` | — | `localhost` | |
| `MINIO_PORT` | — | `9000` | |
| `MINIO_USE_SSL` | — | `false` | |
| `REDIS_HOST` | — | `localhost` | |
| `REDIS_PORT` | — | `6379` | |
| `REDIS_PASSWORD` | — | *(kosong)* | |
| `RABBITMQ_HOST` | — | `localhost` | |
| `RABBITMQ_PORT` | — | `5672` | |
| `RABBITMQ_USER` | — | `guest` | |
| `RABBITMQ_PASS` | — | `guest` | |
| `RUST_LOG` | — | `rust_axum=debug,tower_http=debug,sqlx=info` | |

### `main-service/.env` → HTTP `:8002`

| Variabel | Wajib | Default | Keterangan |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | Skema dibuat via GORM `AutoMigrate` |
| `AUTH_GRPC_URL` | ✅ | — | `grpc-service:50051` (tanpa skema `http://`) |
| `MIDTRANS_SERVER_KEY` | ✅ | — | Dari dashboard Midtrans → Settings → Access Keys |
| `MIDTRANS_CLIENT_KEY` | — | *(kosong)* | |
| `PORT` | — | `8002` | |

### `frontend/.env.development` dan `frontend/.env.production`

| Variabel | Wajib | Keterangan |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | URL gateway dari browser — `http://localhost:8080` |
| `NEXT_PUBLIC_WS_API_URL` | ✅ | URL WebSocket gateway — `ws://localhost:8080` |
| `NEXT_PUBLIC_APP_URL` | ✅ | `http://localhost:3000`, dipakai untuk redirect absolut OAuth |
| `JWT_PUBLIC_KEY` | ✅ | Verifikasi RS256 di route handler. Tanpa ini token hanya di-decode tanpa verifikasi |
| `SERVER_API_URL` | — | Base URL yang dipakai fetch **server-side**. Di Docker: `http://auth-service:8000`. Fallback ke `NEXT_PUBLIC_API_URL` |
| `NEXT_PUBLIC_MESSAGE_API_URL` | — | Override base URL REST chat. Default: `NEXT_PUBLIC_WS_API_URL` dengan skema `ws→http` |
| `BETTER_AUTH_URL` | — | `baseURL` untuk `createAuthClient`. Fallback `http://localhost:3000` |
| `GOLANG_GRPC_URL` | — | Default `localhost:50052`. Hanya dipakai modul `product-category` / `product-plan` yang sudah mati — lihat [Status Fitur](#status-fitur--catatan-teknis). Ikut hilang bila modul itu dihapus |

`DATABASE_URL` dan `BETTER_AUTH_SECRET` **tidak dibaca oleh kode frontend mana pun**, meski masih diset di `frontend/docker-compose.*.yml`.

---

## Generate JWT Keys (RSA)

Generate satu kali, pakai nilai yang sama di `auth-service`, `grpc-service`, `realtime-service`, dan (public key saja) di `frontend`:

```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Ubah jadi satu baris untuk ditempel ke .env
cat private.pem | awk '{printf "%s\\n", $0}' | sed 's/\\n$//'
cat public.pem  | awk '{printf "%s\\n", $0}' | sed 's/\\n$//'
```

Semua service melakukan `.replace("\\n", "\n")` saat membaca env, jadi format satu-baris di atas sudah benar.

---

## Setup OAuth

Redirect URI mengarah ke **frontend**, bukan ke auth-service. Frontend menerima `code`, menukarnya ke auth-service, lalu men-set cookie.

### Google
1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Buat OAuth 2.0 Client ID (Web Application)
3. Authorized redirect URI: `http://localhost:3000/api/auth/oauth-callback?provider=google`

### GitHub
1. [GitHub Developer Settings](https://github.com/settings/developers) → New OAuth App
2. Authorization callback URL: `http://localhost:3000/api/auth/oauth-callback?provider=github`

---

## Database & Migrasi

PostgreSQL 17, database `technostock`, satu database dipakai bersama tiga service dan dipisahkan lewat schema:

| Schema | Tabel | Dibuat oleh |
|---|---|---|
| `users` | `users` | migrasi sqlx `auth-service` |
| `message` | `messages`, `message_reactions` | migrasi sqlx `realtime-service` |
| `main` | `account_types`, `subscription_plans`, `user_subscriptions`, `transactions` | GORM `AutoMigrate` `main-service` |

Pemisahan schema `users` dan `message` dilakukan migrasi `20260418000000_schema_separation.sql`. Prefix schema `main.` diatur lewat `NamingStrategy` GORM di [`main-service/infrastructure/database/postgres.go`](main-service/infrastructure/database/postgres.go).

**📖 Dokumentasi skema lengkap — kolom, tipe, constraint, index, relasi, dan state di Redis/RabbitMQ/MinIO — ada di [DATABASE.md](DATABASE.md).**

**Catatan penting soal migrasi sqlx:**

`auth-service` dan `realtime-service` sama-sama menjalankan migrasi ke database yang sama dan berbagi satu tabel `_sqlx_migrations`. Direktori `realtime-service/migrations/` berisi 11 file yang **identik byte-per-byte** dengan 11 file pertama di `auth-service/migrations/`, tetapi `auth-service` punya 2 migrasi tambahan yang tidak ada di `realtime-service`:

- `20260823055723_add_member_role.sql`
- `20260823163501_add_discord_username.sql`

sqlx 0.8 menolak start bila menemukan migrasi ter-apply di database yang tidak dikenal oleh migrator lokal (`MigrateError::VersionMissing`). Artinya, setelah `auth-service` menerapkan 2 migrasi ekstra tersebut, `realtime-service` berisiko gagal start. Sinkronkan kedua direktori migrasi bila hal ini terjadi.

---

## Referensi API

### auth-service — `:8000`, diakses via gateway `:8080`

| Method | Path | Keterangan |
|---|---|---|
| POST | `/api/v1/auth/sign-up` | |
| POST | `/api/v1/auth/sign-in` | Mengembalikan `access_token`, `refresh_token`, `expires_in` |
| POST | `/api/v1/auth/refresh` | Body: `{ "refresh_token": "..." }` |
| GET | `/api/v1/auth/github` | Redirect ke halaman otorisasi GitHub |
| GET | `/api/v1/auth/github/callback` | |
| GET | `/api/v1/auth/google` | Redirect ke halaman otorisasi Google |
| GET | `/api/v1/auth/google/callback` | |
| GET / POST | `/api/v1/users` | List / create user |
| PUT / DELETE | `/api/v1/users/{id}` | |
| PATCH | `/api/v1/users/{id}/status` | |

### realtime-service — `:8001`

| Method | Path | Keterangan |
|---|---|---|
| GET | `/api/v1/chat/history` | Query: `cursor`, `limit` |
| POST | `/api/v1/chat/upload` | Multipart, upload gambar ke MinIO |
| GET | `/api/v1/chat/unread-count` | |
| POST | `/api/v1/chat/read` | |
| GET | `/api/v1/chat/ws` | WebSocket. Query: `token`, `group_id` |

Event WebSocket dari client (tagged union pada field `event_type`): `message`, `typing`, `react`, `edit`, `delete`.

### main-service — `:8002`, diakses via gateway sebagai `/api/v1/main/*`

| Method | Path | Akses |
|---|---|---|
| GET | `/api/v1/account-types` | login |
| POST / PATCH / DELETE | `/api/v1/account-types[/:id]` | `Admin`, `SuperAdmin`, `Maintainer` |
| GET | `/api/v1/subscription-plans` | login |
| GET | `/api/v1/subscription-plans/account-type/:accountTypeId` | login |
| POST / PATCH / DELETE | `/api/v1/subscription-plans[/:id]` | `Admin`, `SuperAdmin`, `Maintainer` |
| GET | `/api/v1/public/account-types` | publik |
| GET | `/api/v1/public/subscription-plans` | publik |
| GET | `/api/v1/public/subscription-plans/:id` | publik |
| POST | `/api/v1/public/subscription/midtrans-webhook` | publik (webhook Midtrans) |
| POST | `/api/v1/subscriptions/subscribe` | login |
| POST | `/api/v1/subscriptions/buy` | login |
| GET | `/api/v1/subscriptions/my-active` | login |

### gRPC `UserService` — `grpc-service:50051`

Kontrak di [`proto/user.proto`](proto/user.proto): `GetUsers`, `UpdateLastRead`, `ValidateToken`, `UpdateUserRole`, `UpdateDiscordUsername`.

### Frontend BFF — `:3000`

| Method | Path | Keterangan |
|---|---|---|
| POST | `/api/auth/sign-in/email` | Proxy ke auth-service, set cookie |
| POST | `/api/auth/sign-out` | Hapus cookie |
| GET | `/api/auth/get-session` | Verifikasi token, auto-refresh bila kedaluwarsa |
| GET | `/api/auth/oauth-callback?provider=&code=` | Tukar `code` ke auth-service, set cookie, redirect ke dashboard sesuai role |

---

## Struktur Monorepo

```
technostock/
├── docker-compose.dev.yml    # Unified dev (semua service + infra)
├── docker-compose.prod.yml   # Unified prod (build lokal)
├── docker-compose.hub.yml    # Deploy dari image Docker Hub
├── Makefile
├── .env.example
├── SETUP.md                  # Panduan instalasi per OS
├── DATABASE.md               # Skema database lengkap
│
├── frontend/                 # Next.js 16
│   ├── src/app/              # App Router: (root), auth, admin, maintainer, forum, user, checkout, api
│   ├── src/modules/          # Fitur per domain: account-type, subscription-plan, product-*
│   ├── src/proxy.ts          # Proteksi route berbasis role
│   ├── Dockerfile.dev / Dockerfile.prod
│   └── .env.development / .env.production
│
├── grpc-service/             # API Gateway + gRPC UserService
│   ├── src/gateway.rs        # Reverse proxy HTTP & bridge WebSocket
│   └── src/server/           # Implementasi UserService
│
├── auth-service/             # Rust — auth & user
│   ├── migrations/           # 13 migrasi sqlx
│   └── src/{handlers,usecases,infrastructure,routes}/
│
├── realtime-service/         # Rust — chat realtime
│   ├── migrations/           # 11 migrasi sqlx (subset dari auth-service)
│   └── src/{handlers,workers,infrastructure,domain}/
│
├── main-service/             # Go — subscription & payment
│   └── {cmd,handlers,usecases,domain,infrastructure,routes,pb}/
│
├── shared-core/              # Rust crate bersama (auth-service + grpc-service)
├── proto/                    # user.proto (aktif) + product_*.proto (mati, tidak dikompilasi)
└── tools/                    # Compose terpisah: postgres, redis, rabbitmq, minio
```

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui + Radix, TanStack Query, Zustand, Tiptap, AG Grid |
| API Gateway | Rust, Axum, reqwest, tokio-tungstenite |
| Auth | Rust, Axum, sqlx, JWT RS256, OAuth2 (GitHub, Google) |
| Realtime | Rust, Axum WebSocket, Redis pub/sub, RabbitMQ (lapin), MinIO via AWS SDK S3 |
| Subscription & Payment | Go, Fiber v3, GORM, Midtrans |
| RPC | gRPC — tonic (Rust), google.golang.org/grpc (Go), @grpc/grpc-js (Node) |
| Database | PostgreSQL 17 |
| Cache / Pub-Sub | Redis 7 |
| Message Broker | RabbitMQ 3 |
| Object Storage | MinIO |
| Container | Docker, Docker Compose (kompatibel Podman) |

---

## Status Fitur & Catatan Teknis

Hal-hal berikut ada di dalam kode tetapi belum berfungsi. Didokumentasikan agar tidak menyesatkan saat dikembangkan.

**1. `product-category` / `product-plan` adalah kode mati — sudah digantikan `account-type` / `subscription-plan`.**

Keduanya peninggalan iterasi lama dengan bentuk data yang hampir sama:

| Dihapus (lama) | Pengganti (aktif) |
|---|---|
| `ProductCategory { id, name, slug, description }` | `AccountType { id, name, description, benefits, is_recommended }` |
| `ProductPlan { id, category_id, name, slug, description, price }` | `SubscriptionPlan { id, account_type_id, name, description, duration_months, price }` |

Yang lama memakai gRPC ke `main-service:50052`, yang baru memakai REST lewat gateway (`/api/v1/main/account-types`, `/api/v1/main/subscription-plans`).

Bukti bahwa modul lama sudah tidak terpakai:

- Tidak ada satu pun halaman atau komponen di luar kedua modul itu yang mengimpornya. Sebaliknya, `account-type` / `subscription-plan` diimpor oleh `/admin/subscriptions/*`, `/forum/dashboard`, dan landing page.
- `main-service` membuka server gRPC di `:50052` tetapi **tidak meregistrasi satu service pun** ([`cmd/api/main.go`](main-service/cmd/api/main.go)), jadi seluruh panggilan client-nya akan mengembalikan `Unimplemented`.
- `proto/product_category.proto` dan `proto/product_plan.proto` tidak dikompilasi oleh `build.rs` mana pun — keduanya hanya memuat `user.proto`. Salinan di `frontend/src/modules/*/grpc/proto/` identik byte-per-byte dengan yang di root.
- Konstanta `PRODUCT_CATEGORY`, `PRODUCT_PLAN`, `PUBLIC_PRODUCT_PLAN`, `PUBLIC_PRODUCT_PLAN_DETAIL`, `BUY_PRODUCT` di [`src/endpoint/index.ts`](frontend/src/endpoint/index.ts) tidak direferensikan file mana pun, dan route-nya tidak ada di `main-service`.

Total **20 file / ±1.700 baris** yang bisa dihapus:

```
proto/product_category.proto                    proto/product_plan.proto
main-service/pb/product_category.pb.go          main-service/pb/product_plan.pb.go
main-service/pb/product_category_grpc.pb.go     main-service/pb/product_plan_grpc.pb.go
frontend/src/modules/product-category/  (7 file)
frontend/src/modules/product-plan/      (7 file)
+ 5 konstanta PRODUCT_* di frontend/src/endpoint/index.ts
```

`main-service/pb/user.pb.go` dan `user_grpc.pb.go` **tetap dipakai** — jangan ikut dihapus.

**2. Endpoint chat belum ter-route di gateway.**
Frontend memanggil chat pada path `/api/v1/chat/*` — WebSocket di [`chat-websocket.ts`](frontend/src/app/maintainer/discussion/_queries/chat-websocket.ts) dan REST via `messageBackend` di [`libs/axios.ts`](frontend/src/libs/axios.ts) — dengan base URL gateway `:8080`. Gateway hanya mengenal `/ws` dan `/ws/*` untuk WebSocket, sehingga `/api/v1/chat/*` jatuh ke fallback dan diteruskan ke frontend, bukan ke `realtime-service`. Sampai routing gateway ditambahkan, arahkan `NEXT_PUBLIC_WS_API_URL` / `NEXT_PUBLIC_MESSAGE_API_URL` langsung ke `realtime-service` (`ws://localhost:8001` dan `http://localhost:8001`).

**3. `FRONTEND_URL` belum diset di compose.**
Route fallback gateway memakai default `http://localhost:3000`, yang di dalam container menunjuk ke gateway itu sendiri. Set `FRONTEND_URL=http://frontend:3000` bila fallback proxy ini ingin dipakai.

**4. Kredensial development di-hardcode.**
Password Postgres, Redis, RabbitMQ, dan MinIO tertulis langsung di file compose. Nilai-nilai tersebut hanya untuk development lokal — ganti seluruhnya sebelum deploy.

**5. Catatan tingkat database.**
Tiga hal lain — `group_id` chat yang tidak pernah dipersist, role `SuperAdmin` yang tidak bisa di-decode enum Rust, dan tidak adanya foreign key dari schema `main` ke `users.users` — dijelaskan di [DATABASE.md → Catatan Integritas Data](DATABASE.md#catatan-integritas-data).
