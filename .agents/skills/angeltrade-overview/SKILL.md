---
name: angeltrade-overview
description: Orientasi wajib untuk repo AngelTrade — monorepo microservices Rust (auth-service, grpc-service, shared-core, realtime-service) + Go (main-service, Fiber v3 + GORM) + Next.js 16 (frontend), dengan PostgreSQL, Redis, RabbitMQ, MinIO, Kafka, gRPC, JWT RS256, dan pembayaran Midtrans. Berisi peta service, invarian arsitektur, batas kepemilikan data, dan daftar jebakan yang membuat agent salah. Gunakan skill ini SEBELUM membaca atau mengubah kode apa pun di repo angeltrade — termasuk saat diminta "tambah fitur", "perbaiki bug", "kenapa error", atau saat bingung file mana yang harus disentuh.
---

# AngelTrade — Orientasi

Baca ini lebih dulu. Setelah paham peta di bawah, lanjut ke skill yang sesuai
tugasnya: `angeltrade-feature`, `angeltrade-database`, atau `angeltrade-ops`.

Semua isi diverifikasi terhadap kode. Bila kode dan skill ini bertentangan,
kode yang benar — perbaiki skill-nya.

## Produk

Platform langganan edukasi trading saham Indonesia. Yang benar-benar diproses
sistem: **akses berbayar bertingkat (tipe akun × durasi)** yang setelah lunas
menaikkan role user jadi `Member` dan mencatat Discord username. Materi kelas /
video / sertifikat hanya copy marketing — **tidak ada entitas backend-nya**.

Fokus pengembangan saat ini: **manajemen user + subscription**.
Forum chat (`realtime-service`) **on-hold**.

Detail produk & status tiap fitur: `docs/PRD.md`.

## Peta service

```
                       Browser
                          │
        ┌─────────────────┴──────────────────┐
        │ :3000                              │ :8080
        ▼                                    ▼
   frontend (Next.js 16)  ◄──fallback──  grpc-service
        │                                :8080 gateway HTTP/WS
        │ SERVER_API_URL                 :50051 gRPC UserService
        │ SERVER_GATEWAY_URL                  │
        ▼                    ┌────────────────┼────────────────┐
   auth-service :8000        │                │                │
   Rust/Axum/sqlx      /api/v1/auth      /api/v1/main         /ws
                       /api/v1/users           │                │
                            │                  ▼                ▼
                            └──────────  main-service     realtime-service
                                          :8002 Go          :8001 Rust
                                               │                │
                                               └─ gRPC ──────────┘
                                                  ke grpc-service:50051
```

| Service | Stack | Port | Isi |
|---|---|---|---|
| `frontend/` | Next.js 16, React 19, Tailwind 4, TanStack Query, AG Grid, shadcn | 3000 | UI + BFF auth |
| `grpc-service/` | Rust, Axum, tonic | 8080 + 50051 | Gateway **dan** server gRPC |
| `auth-service/` | Rust, Axum, sqlx | 8000 | Auth, OAuth, CRUD user |
| `realtime-service/` | Rust, Axum, sqlx | 8001 | Chat WS (on-hold) |
| `main-service/` | Go 1.25.3, Fiber v3, GORM | 8002 | Subscription, voucher, member, Midtrans |
| `shared-core/` | Rust lib | — | `User`, `Role`, `JwtService`, pool, `PostgresUserRepository` |

Infra: PostgreSQL 17 (host `:5433`, internal `:5432`), Redis 7, RabbitMQ 3,
MinIO, Kafka 3.9 (**belum dipakai kode mana pun**).

## Sembilan invarian

Melanggar salah satu = bug arsitektur, bukan sekadar gaya.

1. **`users.users` milik Rust; `main.*` milik Go.** Go tidak pernah query tabel
   user — selalu gRPC. Itu sebabnya `user_id` di schema `main` bertipe
   `varchar(255)` tanpa FK. Jangan "perbaiki" dengan menambah FK.
2. **Server gRPC ada di `grpc-service`, bukan `auth-service`.** `AUTH_GRPC_URL`
   harus menunjuk `grpc-service:50051`. Namanya menyesatkan; artinya tetap.
3. **Otorisasi ditegakkan di backend.** `frontend/src/proxy.ts` hanya UX.
4. **Browser hanya bicara ke `:3000` dan `:8080`.** Endpoint baru untuk browser
   harus menembus gateway (`grpc-service/src/gateway.rs`). Prefix ter-route:
   `/api/v1/auth`, `/api/v1/users`, `/api/v1/main` (di-rewrite jadi `/api/v1`),
   `/ws`. Sisanya jatuh ke fallback frontend.
5. **Prefix schema wajib di raw SQL.** Rust: `users.users`, `message.messages`.
   Go: setiap `Table()`/`Joins()`/`Exec()` menulis `main.` eksplisit.
6. **JWT RS256, satu keypair untuk semua service.** Access 15 menit, refresh
   7 hari, cookie httpOnly. Claim: `sub, name, email, phone, role, avatar_url,
   discord_username, exp, iat, token_type`.
7. **Role adalah string PascalCase lintas bahasa.** Rust mengirim
   `format!("{:?}", role)`; Go men-`strings.Trim(role, "\"")` sebelum
   membandingkan.
8. **Jangan menambah producer/consumer RabbitMQ di `realtime-service`** —
   lapisan itu akan pindah ke Kafka; RabbitMQ dialokasikan untuk
   `notification-service` yang belum dibuat.
9. **Jangan edit `main-service/pb/*.go`** — generated, `// DO NOT EDIT`.

## Jebakan

| Jebakan | Fakta |
|---|---|
| Middleware Next.js | Namanya **`src/proxy.ts`** (Next 16), bukan `middleware.ts` |
| Nama paket frontend | `package.json` = **`angeltrade`** (nama lama). Teks user = **AngelTrade** |
| Cargo workspace | **Tidak ada.** 4 crate berdiri sendiri via `path = "../shared-core"`. Jalankan `cargo` dari dalam folder crate |
| `realtime-service` | **Tidak** memakai `shared-core` — menduplikasi `User`, `Role`, `AppError`, `JwtService`. Versi `User`-nya tanpa `discord_username` |
| Router realtime | Router aktif = `realtime-service/src/routes/api.rs` (bukan `src/api.rs`, yang sudah dihapus) |
| Port | Hard-coded di `main.rs` (8000/8001/8080/50051). Hanya `main-service` membaca `PORT` |
| Dua folder migrations | `auth-service/migrations` (13) & `realtime-service/migrations` (11) berbagi satu `_sqlx_migrations`, keduanya `ignore_missing` |
| `.sqlx/` | Hanya `realtime-service` pakai makro `sqlx::query!`. Ubah makro → wajib `cargo sqlx prepare` + commit, atau build prod pecah |
| Build context Docker | Service Rust di-build dari **root repo** (`context: .`). Varian `Dockerfile.unified.*` |
| Compose per-service | `auth-service/docker-compose.*.yml` & `realtime-service/docker-compose.*.yml` **gagal build** — context terlalu sempit. Pakai compose root |
| `SuperAdmin` | Ada di semua lapisan dan diperlakukan setara `Admin`. Endpoint Maintainer-only tetap Maintainer-only |
| `UpdateUserRole` | String role harus PascalCase persis; nilai tak dikenal ditolak `Status::invalid_argument` |
| `duration_months = 0` | Berarti **lifetime** |
| `end_date = NULL` | Berarti **lifetime** |
| `quota = NULL` | Berarti **tanpa batas** |
| `last_read_at` (proto) | Dikomentari "Unix timestamp" tapi nilainya **milidetik** |
| Axum path param | Axum 0.8 pakai `{id}`, bukan `:id`. Fiber tetap `:id` |
| Test | **Tidak ada satu pun test di repo.** `make test` jalan di atas nol test case |
| `.dockerignore` root | Mengecualikan `.claude/` & `.agents/` (junction bikin Podman Windows gagal). Jangan hapus |

## Tiga alur yang perlu dipahami

**Login →** `POST /api/auth/sign-in/email` (BFF Next.js) → proxy ke
`auth-service` → verifikasi RS256 → set cookie httpOnly. Refresh otomatis di
`proxy.ts` dan `GET /api/auth/get-session`.

**Checkout →** `/checkout?planId=` → server action `processCheckout` →
`POST /api/v1/main/subscriptions/buy` → guard idempotensi + double-purchase +
reservasi kuota atomik + voucher → Midtrans Snap → user bayar → webhook
`/public/subscription/midtrans-webhook` → `CheckTransaction` ke Midtrans →
`activateSubscription` → gRPC `UpdateUserRole("Member")` +
`UpdateDiscordUsername`.

**Kedaluwarsa →** `subscription_worker.go` tiap 10 menit: langganan lewat
`end_date` jadi `Expired` + role turun ke `User`; transaksi `pending` > 2 jam
jadi `expired` + kuota dilepas.

## Perintah

```bash
make dev              # semua service + infra, hot-reload
make down-dev-volumes # reset total data
make logs-dev
make help
```

Engine default: podman di Windows, docker di macOS/Linux. Override
`ENGINE=docker`.

Verifikasi perubahan:

| Stack | Perintah |
|---|---|
| Rust | `cd <service> && cargo check` (clippy tidak dikonfigurasi) |
| Go | `cd main-service && go vet ./... && go build ./...` |
| Frontend | `cd frontend && npx tsc --noEmit && npm run lint` |

## Ke mana selanjutnya

| Tugas | Skill / dokumen |
|---|---|
| Menambah fitur atau endpoint | skill `angeltrade-feature` |
| Menyentuh skema / migrasi / query | skill `angeltrade-database` |
| Menjalankan, build, deploy, debug | skill `angeltrade-ops` |
| Kontrak endpoint | `docs/api.md` |
| Status produk & daftar risiko | `docs/PRD.md` |
| Isu yang diketahui | `docs/operations.md` |
