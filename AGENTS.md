# AGENTS.md — AngelTrade

Panduan untuk AI coding agent (Claude Code, Codex, Antigravity, Cursor, Copilot,
dll.) yang bekerja di repo ini. **Baca ini sebelum menyentuh kode.**

Semua isi di bawah diverifikasi terhadap kode yang ada. Bila kode dan dokumen
bertentangan, kode yang benar — dan dokumennya harus diperbaiki.

---

## 1. Apa ini

Monorepo microservices untuk **AngelTrade**, platform langganan edukasi trading
saham Indonesia. Lima service berjalan: satu frontend Next.js, satu API Gateway
yang sekaligus server gRPC, dan tiga backend.

**Fokus pengembangan saat ini: manajemen user + subscription.**
Fitur forum chat (`realtime-service`) on-hold — boleh dijalankan, bukan
prioritas.

| Service | Bahasa / framework | Port | Tanggung jawab |
|---|---|---|---|
| `frontend/` | Next.js 16, React 19, TS, Tailwind 4 | 3000 | UI + BFF auth (cookie session) |
| `grpc-service/` | Rust, Axum, tonic | 8080 gateway, 50051 gRPC | Reverse proxy HTTP/WS **dan** server gRPC `UserService` |
| `auth-service/` | Rust, Axum, sqlx | 8000 | Sign-up/in/refresh, OAuth, CRUD user |
| `realtime-service/` | Rust, Axum, sqlx | 8001 | Chat WS, Redis, RabbitMQ, MinIO — **on-hold** |
| `main-service/` | Go 1.25.3, Fiber v3, GORM | 8002 | Account type, plan, voucher, member, Midtrans |
| `shared-core/` | Rust lib crate | — | `User`, `Role`, `JwtService`, pool Postgres, `PostgresUserRepository` |

Infra: PostgreSQL 17 (`:5433` di host), Redis 7, RabbitMQ 3, MinIO, Kafka 3.9
(idle). Dokumen lengkap ada di [`docs/`](docs/) — mulai dari
[docs/README.md](docs/README.md) dan [docs/PRD.md](docs/PRD.md).

---

## 2. Aturan yang tidak boleh dilanggar

1. **Batas kepemilikan data.** `users.users` milik Rust. `main.*` milik Go.
   Go **tidak pernah** query tabel user — selalu lewat gRPC ke
   `grpc-service:50051`. Karena itu `user_id` di schema `main` bertipe
   `varchar(255)` tanpa foreign key. Jangan "perbaiki" dengan menambah FK.
2. **Server gRPC ada di `grpc-service`, bukan `auth-service`.** Env
   `AUTH_GRPC_URL` di `main-service` dan `realtime-service` harus menunjuk
   `grpc-service:50051`. Nama variabelnya menyesatkan; jangan diubah artinya.
3. **Otorisasi ditegakkan di backend.** `frontend/src/proxy.ts` hanya UX.
   Endpoint baru wajib punya guard sendiri.
4. **Browser hanya bicara ke `:3000` dan `:8080`.** Endpoint baru yang dipanggil
   browser harus menembus gateway — lihat
   [`grpc-service/src/gateway.rs`](grpc-service/src/gateway.rs). Prefix yang
   sudah ter-route: `/api/v1/auth`, `/api/v1/users`, `/api/v1/main`, `/ws`.
   Sisanya jatuh ke fallback frontend.
5. **Prefix schema wajib di raw SQL.** Rust: `users.users`, `message.messages`.
   Go: setiap `Table()`/`Joins()`/`Exec()` harus menulis `main.` eksplisit —
   `NamingStrategy{TablePrefix:"main."}` hanya berlaku untuk operasi model.
6. **Jangan menambah producer/consumer RabbitMQ di `realtime-service`.** Lapisan
   event itu akan dipindah ke Kafka. RabbitMQ dialokasikan untuk
   `notification-service` yang belum dibuat.
7. **Jangan edit `main-service/pb/*.go`** — generated, `// DO NOT EDIT`.
8. **Jangan commit `.env`.** Hanya `.env.example` yang ter-track.

---

## 3. Jebakan yang sering membuat agent salah

| Jebakan | Fakta |
|---|---|
| Middleware Next.js | Namanya **`src/proxy.ts`** (konvensi Next 16), bukan `middleware.ts` |
| Cargo workspace | **Tidak ada.** 4 crate berdiri sendiri, dihubungkan `path = "../shared-core"`. Jalankan `cargo` dari dalam folder crate |
| `realtime-service` dan `shared-core` | `realtime-service` **tidak memakai** `shared-core` — ia menduplikasi `User`, `Role`, `AppError`, `JwtService`. Versi `User`-nya **tidak punya** `discord_username` |
| Dead code | `realtime-service/src/api.rs` dan `src/mod.rs` tidak pernah di-compile. Router aktif = `src/routes/api.rs` |
| Port | Port service Rust **hard-coded** di `main.rs` (8000/8001/8080/50051). Hanya `main-service` yang membaca `PORT` |
| Dua folder migrations | `auth-service/migrations` (13) dan `realtime-service/migrations` (11) berbagi satu tabel `_sqlx_migrations`. Keduanya jalan dengan `ignore_missing` |
| `.sqlx/` | Hanya `realtime-service` memakai makro `sqlx::query!`. Ubah makro → **wajib** `cargo sqlx prepare` + commit `.sqlx/query-*.json`, atau build prod pecah |
| Build context Docker | Service Rust di-build dari **root repo** (`context: .`) karena butuh `proto/` dan `shared-core/`. Varian `Dockerfile.unified.*` yang dipakai compose root |
| Compose per-service | `auth-service/docker-compose.*.yml` dan `realtime-service/docker-compose.*.yml` **gagal build** (context terlalu sempit). Pakai compose root |
| Role lintas bahasa | Rust mengirim role sebagai `format!("{:?}", role)` → PascalCase. Go menghapus tanda kutip sebelum membandingkan. String tak dikenal di `UpdateUserRole` → **downgrade diam-diam ke `User`** |
| `SuperAdmin` | Valid di DB CHECK dan di Go, **tidak ada** di enum Rust `Role`. Baris user `SuperAdmin` gagal di-decode sqlx |
| `duration_months = 0` | Berarti **lifetime**, bukan nol bulan |
| `last_read_at` di proto | Dikomentari "Unix timestamp" tapi nilainya **milidetik** |
| Test | **Tidak ada satu pun test di repo.** Target `make test` ada tapi jalan di atas nol test case |
| `.dockerignore` root | Mengecualikan `.claude/` dan `.agents/` — isinya junction/symlink yang bikin Podman Windows gagal |
| Axum path param | Sintaks Axum 0.8: `{id}`, bukan `:id`. Fiber tetap `:id` |

---

## 4. Cara menjalankan

```bash
make dev              # semua service + infra (foreground, hot-reload)
make dev-d            # background
make down-dev         # stop
make down-dev-volumes # stop + reset semua data
make logs-dev
make validate         # cek syntax compose
make help
```

Engine default: **podman di Windows, docker di macOS/Linux**. Override:
`make dev ENGINE=docker` atau `make docker:dev` / `make podman:dev`.

Per service (tanpa Docker) — `grpc-service` harus jalan **lebih dulu**:

```bash
cd grpc-service     && cargo run   # :8080 + :50051
cd auth-service     && cargo run   # :8000
cd main-service     && go run ./cmd/api/main.go   # :8002
cd frontend         && npm run dev # :3000
cd realtime-service && cargo run   # :8001 (opsional, chat on-hold)
```

Setiap folder service Rust/Go punya Makefile dengan target seragam:
`dev, start, build, build-dev, test, test-verbose, fmt, check, clean, help`
(+ `migrate` bila punya migrations). Frontend: `npm run dev|build|start|lint`.

Verifikasi sebelum menyatakan selesai:

| Stack | Perintah |
|---|---|
| Rust | `cd <service> && cargo check` (`cargo clippy` **tidak** dikonfigurasi) |
| Go | `cd main-service && go vet ./... && go build ./...` |
| Frontend | `cd frontend && npx tsc --noEmit && npm run lint` |

Setup lengkap per OS: [docs/setup.md](docs/setup.md).

---

## 5. Konvensi per stack

### Rust (`auth-service`, `grpc-service`, `shared-core`)

Layer: `handlers/` → `usecases/` → repository (`shared-core`). Handler ekstrak +
validasi + panggil usecase; usecase memegang otorisasi & logika; repository
memegang SQL.

- Usecase generic atas trait: `struct XUseCase<R: UserRepository>`, dibuat
  **per-request** di handler (`XUseCase::new(state.user_repository.clone())`).
- Satu tipe error mengalir tanpa di-wrap ulang: `AppError` dari
  `shared-core/src/infrastructure/errors.rs`, `?` di semua layer.
- Envelope response seragam:
  `{"meta":{"status","message"},"results":<data|null>}`. Sukses selalu **200**.
- Auth per-handler lewat extractor `AuthUser` (bukan tower layer). Kehadiran
  argumen `auth_user: AuthUser` = endpoint terproteksi.
- Role diambil dari **DB**, bukan dari claim JWT:
  `state.user_repository.find_by_id(auth_user.claims.claims.sub)`.
- Validasi request memakai `validator` di struct request lokal handler, lalu
  `validate_request(&payload)?`.

### Go (`main-service`)

Layer: `routes/` → `handlers/` → `usecases/` → GORM. **Tidak ada** repository
layer, DTO package, atau library validasi.

- Handler tidak pernah menyentuh `*gorm.DB`; usecase tidak pernah menyentuh
  `fiber.Ctx`.
- Konstruktor: `NewXUseCase(db *gorm.DB) *XUseCase`,
  `NewXHandler(uc *usecases.XUseCase) *XHandler`. Field unexported, tanpa
  interface.
- Getter by-ID: `ErrRecordNotFound` → `return nil, nil`; handler yang memutuskan
  404.
- Error handler: `fiber.Map{"error": ...}`. Bentuk sukses tidak seragam
  (`results` / `data` / `message` / entity telanjang) — **tiru endpoint
  tetangga**, jangan bikin gaya baru.
- Reservasi kuota atomik:
  `Where("id = ? AND used_quota < quota").Update("used_quota", gorm.Expr("used_quota + 1"))`
  lalu cek `RowsAffected == 0`.
- Sebelum `tx.Save` pada entity yang FK-nya diganti, **kosongkan struct
  relasinya** (`existing.SubscriptionPlan = entities.SubscriptionPlan{}`).
- PK dibuat Postgres (`default:gen_random_uuid()`), bukan `uuid.New()` di Go.
- `UserID` selalu `string` — berasal dari auth-service, jangan di-`uuid.Parse`.
- Bahasa pesan error: **Indonesia** untuk yang dilihat end-user (validasi bisnis,
  pembayaran), **Inggris** untuk teknis/admin.
- Route didaftarkan dua kali (`""` dan `"/"`) agar trailing slash aman.

### Frontend (`frontend/`)

Satu pola saja: **route-scoped di `src/app/<route>/`**. `src/modules/` sudah
dihapus — jangan dibuat lagi. Template: **`src/app/admin/members/`**.

```
_queries/<domain>.ts        query<Domain>(accessToken) → {queryKey, queryFn} + hook use<Get…>()
_mutations/<domain>.ts      use<Aksi>({ onSuccess, onError, accessToken }) → useMutation
_schemas/<domain>.ts        zod + type (form), atau type bentuk response
_table/_column/<domain>.tsx ColDef[] AG Grid
_table/_components/…        "use client": <domain>-table, add-<domain>, button-add-<domain>
_components/…               komponen client lain milik route ini
page.tsx                    Server Component: getSession → prefetchQuery → <HydrationBoundary>
```

Untuk form dengan dropdown relasi tiru `subscriptions/plans`; untuk PATCH &
field array tiru `subscriptions/account-types`.

Aturan lain:
- **Semua data fetching lewat TanStack Query + axios** (`gatewayAPI` /
  `messageBackend` dari `@/libs/axios`) — tidak ada `fetch()` mentah dan tidak
  ada server action untuk ambil/kirim data. Pengecualian: plumbing auth
  (`src/app/api/auth/**`, `src/proxy.ts`), ping ketersediaan backend
  (`mode: "no-cors"` di `_mutations/sign-in.ts` & `sign-up.ts` — tidak bisa
  lewat axios), dan server action yang memang harus menyentuh cookie httpOnly
  (`checkout/status/actions.ts`).
- URL selalu dari `src/endpoint/index.ts`, jangan di-hardcode di query/mutation.
- Query key `["get-<plural-kebab>"]` **tanpa token**, supaya hasil prefetch di
  server terpakai ulang saat hydrate di client. Mutation key `["<verb>-<domain>"]`.
- Token di-drill, bukan diambil interceptor: client `authClient.useSession()`,
  server `getSession()`, lalu dikirim ke `query…(token)` /
  `use…({ accessToken })` sebagai header `Authorization`.
- `gatewayAPI` memilih base URL sendiri: `SERVER_GATEWAY_URL` saat jalan di
  server, `NEXT_PUBLIC_API_URL` di browser. Jangan bangun URL absolut manual.
- Prefetch di Server Component: `getQueryClient()` + `prefetchQuery` +
  `<HydrationBoundary>`. Pakai `fetchQuery` bila hasilnya menentukan
  `redirect()` — lihat `src/app/checkout/page.tsx`.
- **Satu-satunya cara revalidate: `useRevalidateQuery()`** dari
  `@/hooks/use-revalidate`, dipanggil di `onSuccess` mutation dengan query key
  yang datanya jadi basi — `revalidate(["get-x"], ["get-y"])`. Jangan pakai
  `revalidateTag`/`revalidatePath`/server action atau `router.refresh()` untuk
  data. Ingat efek lintas fitur: CRUD account type & plan → `["get-public-pricing"]`;
  promote/extend/revoke member & pembayaran sukses → `["get-subscription-plans"]`
  + `["get-public-pricing"]` (kuota ikut berubah).
- Logout wajib memanggil `useClearQueryCache()` dari hook yang sama **sebelum**
  redirect — cache TanStack hidup di browser dan akan terbawa ke sesi user
  berikutnya kalau tidak dibuang.
- Toast: `sonner`. Konfirmasi hapus: `confirm()` bawaan browser.
- Pakai token warna `gold-*` dari `globals.css`, bukan hex mentah baru.

---

## 6. Resep menambah fitur

Ringkasan; langkah detail per file ada di skill
[`.agents/skills/angeltrade-feature/`](.agents/skills/angeltrade-feature/).

**Resource CRUD baru di `main-service`** → 4 file baru + 2 diedit:
`domain/entities/x.go` → `usecases/x_usecase.go` → `handlers/x_handler.go` →
blok route di `routes/subscription_routes.go` (setelah deklarasi `adminRole`) →
`cmd/api/main.go` (AutoMigrate + wiring + argumen `SetupSubscriptionRoutes`).

**Endpoint baru di `auth-service`** →
(opsional `shared-core` dto/trait/impl) → `usecases/<modul>.rs` →
`handlers/<modul>.rs` → `routes/api.rs` → (`main.rs` hanya bila butuh dependency
atau method HTTP baru di CorsLayer).

**RPC baru** → `proto/user.proto` → (`shared-core` repo method) →
`grpc-service/src/server/user_service_impl.rs` (nama method snake_case) →
regenerate `main-service/pb/*.go` dengan `protoc` **dari root repo** → pakai di
Go via `authClient.GetClient()`.

**Halaman admin baru** → `src/endpoint/index.ts` →
`src/app/admin/<route>/{_queries,_mutations,_schemas,_table}` →
`src/app/admin/<route>/page.tsx` (Server Component, `SidebarLayout` +
`Suspense` + prefetch/`HydrationBoundary`) → entri di
`src/constants/admin-menu.ts`. Tidak perlu menyentuh `proxy.ts`.

**Kolom DB baru pada user** → migrasi di `auth-service/migrations/`
(`<UTCTIMESTAMP>_<nama>.sql`, qualify `users.`) → field di
`shared-core/src/domain/entities/user.rs` → konstanta `USER_COLUMNS` →
**semua** tempat `User { ... }` dikonstruksi.

---

## 7. Peta dokumen

| Butuh tahu | Baca |
|---|---|
| Produk, persona, status tiap fitur | [docs/PRD.md](docs/PRD.md) |
| Cara service saling bicara, auth, role | [docs/architecture.md](docs/architecture.md) |
| Kontrak endpoint HTTP/WS/gRPC | [docs/api.md](docs/api.md) |
| Skema tabel, migrasi, Redis/RabbitMQ/MinIO | [docs/database.md](docs/database.md) |
| Env per service | [docs/environment.md](docs/environment.md) |
| Instalasi & menjalankan | [docs/setup.md](docs/setup.md) |
| Makefile, deploy, isu diketahui, troubleshooting | [docs/operations.md](docs/operations.md) |

Skill agent (progressive disclosure) ada di [`.agents/skills/`](.agents/skills/):
`angeltrade-overview`, `angeltrade-feature`, `angeltrade-database`,
`angeltrade-ops`.

---

## 8. Saat menyelesaikan pekerjaan

- Ikuti pola tetangga; jangan memperkenalkan library/layer/gaya baru tanpa
  alasan yang dinyatakan.
- Endpoint baru: pastikan bisa ditembus dari browser lewat gateway.
- Menyentuh uang atau kuota: reservasi atomik, idempoten, lepas kuota saat gagal
  — tiru `BuySubscription` di `main-service/usecases/user_subscription_usecase.go`.
- Ubah kontrak, skema, atau status fitur → **perbarui dokumen di `docs/`** pada
  commit yang sama.
- Tidak ada test harness di repo. Bila menambah logika non-trivial, jelaskan cara
  memverifikasinya secara manual.
- Laporkan apa adanya: bila ada bagian yang tidak dikerjakan atau tidak
  terverifikasi, katakan.
