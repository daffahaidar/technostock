# Operasional

Perintah harian, deployment, status pengembangan, dan daftar perilaku yang
belum berfungsi.

## Status Pengembangan

| Area | Status | Catatan |
|---|---|---|
| Autentikasi & manajemen user | **Aktif dikembangkan** | `auth-service`, `grpc-service`, halaman admin |
| Subscription, voucher, member, pembayaran | **Aktif dikembangkan** | `main-service`, halaman checkout & admin |
| Forum chat realtime | **On-hold** | `realtime-service` jalan dan bisa dites, tapi tidak sedang dikerjakan |
| `notification-service` | **Belum dibuat** | Direncanakan sebagai konsumen RabbitMQ |

### Rencana message broker

Saat ini **RabbitMQ** menangani event chat dari `realtime-service`, dan
**Kafka** sudah berjalan di compose dev tanpa satu pun producer/consumer.
Pembagian yang direncanakan:

| Broker | Sekarang | Rencana |
|---|---|---|
| Kafka | tidak dipakai kode | Event `realtime-service` (chat) — menggantikan RabbitMQ |
| RabbitMQ | Event chat: exchange `chat.events`, 3 worker in-process | Dipakai `notification-service` saja |

Konsekuensi praktis selama chat masih on-hold:

- Jangan menambah producer/consumer RabbitMQ baru di `realtime-service` —
  bagian itu akan dibongkar saat migrasi ke Kafka.
- Kafka boleh dimatikan di compose dev untuk menghemat ~512 MB RAM selama belum
  ada kode yang memakainya.
- Ketiga worker (`notification`, `analytics`, `moderation`) di
  [`realtime-service/src/workers/`](../realtime-service/src/workers/) berjalan
  di dalam proses `realtime-service`, bukan service terpisah. Worker
  notification di sana **bukan** cikal bakal `notification-service`.

## Compose File

| File | Kegunaan |
|---|---|
| [`docker-compose.dev.yml`](../docker-compose.dev.yml) | Development. Semua service + infra, source di-mount, hot-reload (`cargo watch`, `air`, `next dev`) |
| [`docker-compose.prod.yml`](../docker-compose.prod.yml) | Production, **build lokal** dari `Dockerfile.*.prod` multi-stage |
| [`docker-compose.hub.yml`](../docker-compose.hub.yml) | Deploy di server dari image Docker Hub, tanpa build |
| [`tools/*/docker-compose.yml`](../tools/) | Satu komponen infra saja (postgres, redis, rabbitmq, minio, kafka) — untuk mode manual |

Perbedaan penting dev vs prod:

- Dev menjalankan `sqlx migrate run --ignore-missing` lewat `command:`; prod
  memakai `entrypoint.sh` di dalam image.
- Dev mem-build dari root project (`context: .`) agar `proto/` dan
  `shared-core/` ikut tersedia bagi `build.rs`.
- `mem_limit` service Rust dinonaktifkan di dev (`cargo watch` butuh banyak
  memori); `main-service` diberi 1 GB karena kompiler Go dijalankan di dalam
  container.
- Kafka hanya ada di compose dev.

## Perintah Makefile

```bash
make help              # daftar lengkap
make engine            # engine & compose yang terpakai
```

### Development

| Perintah | Aksi |
|---|---|
| `make dev` | Start semua service (foreground) |
| `make dev-d` | Start semua service (background) |
| `make down-dev` | Stop container dev |
| `make down-dev-volumes` | Stop dev + hapus semua volume (**reset data**) |
| `make logs-dev` | Tail logs |
| `make ps-dev` | Status container |

### Production (build lokal)

`make prod`, `make prod-d`, `make down-prod`, `make down-prod-volumes`,
`make logs-prod`, `make ps-prod` — pola sama dengan dev.

### Pemilihan engine

`make docker:dev`, `make podman:dev`, `make docker:prod`, `make podman:prod`,
atau `make <target> ENGINE=docker`.

### Utilitas

```bash
make validate   # cek syntax ketiga compose file
```

## Deploy via Docker Hub

Image di-publish ke `daffahaidarnz/angeltrade` dengan tag
`<service>-<VERSION>`, default `VERSION=latest`.

Dari mesin developer:

```bash
make push                  # build & push semua service (tag: latest)
make push VERSION=1.0.0    # tag spesifik
make push-auth             # satu service saja
# push-grpc, push-realtime, push-main, push-frontend
```

Dari server/VPS:

```bash
make pull                  # tarik semua image
make deploy                # jalankan docker-compose.hub.yml (detached)
make deploy-update         # pull terbaru + restart
make logs-deploy
make deploy-down
make deploy-down-volumes
```

Sebelum `make deploy`, siapkan file `.env` untuk setiap service di server dan
ganti seluruh kredensial infrastruktur — lihat
[environment.md](environment.md#kredensial-infrastruktur).

## Reset Data Development

```bash
make down-dev-volumes   # hapus volume pgdata, redis_data, rabbitmq_data, minio_data, kafka_data
make dev                # migrasi dijalankan ulang dari nol
```

---

## Isu yang Diketahui

Hal-hal berikut ada di dalam kode tetapi belum berfungsi. Didokumentasikan agar
tidak menyesatkan saat dikembangkan.

Isu 1 dan 3 hanya menyangkut fitur chat yang statusnya
[on-hold](#status-pengembangan) — bukan blocker untuk pengembangan user dan
subscription yang sedang berjalan.

### 1. Endpoint chat belum ter-route di gateway

Frontend memanggil chat pada path `/api/v1/chat/*` — WebSocket di
[`chat-websocket.ts`](../frontend/src/app/maintainer/discussion/_queries/chat-websocket.ts)
dan REST via `messageBackend` di [`libs/axios.ts`](../frontend/src/libs/axios.ts)
— dengan base URL gateway `:8080`. Gateway hanya mengenal `/ws` dan `/ws/*`
untuk WebSocket, sehingga `/api/v1/chat/*` jatuh ke fallback dan diteruskan ke
frontend, bukan ke `realtime-service`.

**Workaround:** arahkan `NEXT_PUBLIC_WS_API_URL` / `NEXT_PUBLIC_MESSAGE_API_URL`
langsung ke `realtime-service` (`ws://localhost:8001` dan
`http://localhost:8001`).

**Perbaikan permanen:** tambahkan route `/api/v1/chat` ke `gateway.rs` —
`get(proxy_ws)` untuk `/api/v1/chat/ws` dan `any(proxy_realtime)` untuk sisanya.

### 2. Voucher tidak bisa diubah lewat API

`VoucherUseCase.UpdateVoucher` ada di
[`voucher_usecase.go`](../main-service/usecases/voucher_usecase.go) tetapi tidak
punya handler maupun route. Voucher hanya bisa dibuat dan dihapus.

### 3. Kafka berjalan tanpa satu pun producer/consumer

Broker Kafka 3.9 (KRaft, SASL/PLAIN) berjalan di compose dev dan memakan
~512 MB. Ini **disengaja** — infrastrukturnya disiapkan lebih dulu untuk
migrasi event `realtime-service` dari RabbitMQ ke Kafka (lihat
[Status Pengembangan](#status-pengembangan)). Selama chat masih on-hold, service
`kafka` di [`docker-compose.dev.yml`](../docker-compose.dev.yml) aman dimatikan.

### 4. Kredensial development di-hardcode

Password Postgres, Redis, RabbitMQ, MinIO, dan Kafka tertulis langsung di file
compose. Nilai-nilai tersebut hanya untuk development lokal — ganti seluruhnya
sebelum deploy.

### 5. Tidak ada test dan tidak ada CI

Nol `#[test]`, nol `_test.go`, nol `*.test.ts`, tidak ada `.github/`. Target
`make test` ada di lima Makefile tetapi berjalan di atas nol test case.

### 6. Catatan tingkat database

Dua hal — `group_id` chat yang tidak pernah dipersist dan tidak adanya foreign
key dari schema `main` ke `users.users` — dijelaskan di
[database.md → Catatan Integritas Data](database.md#catatan-integritas-data).

---

## Isu yang Sudah Ditutup

Dicatat agar tidak dilaporkan ulang.

| Isu | Perbaikan |
|---|---|
| `frontend/.env.*` di-**negasikan** di `.gitignore` & root `.dockerignore` padahal memuat `GITHUB_CLIENT_SECRET` / `BETTER_AUTH_SECRET` | Negasi dihapus di kedua file |
| Halaman status pembayaran hard-code `http://localhost:8002` + salah prefix | Lewat `NEXT_PUBLIC_API_URL` + `ENDPOINT.GOLANG_API.TRANSACTION_SYNC` |
| Midtrans terkunci mode Sandbox | Env `MIDTRANS_ENV` (`sandbox`/`production`), divalidasi saat startup |
| URL gambar chat memakai hostname internal `minio` | Env `MINIO_PUBLIC_URL`, fallback ke perilaku lama |
| `SuperAdmin` tidak ada di enum Rust → gagal decode sqlx | Varian ditambahkan di `shared-core` + `realtime-service`, setara `Admin` di semua lapisan otorisasi |
| gRPC `UpdateUserRole` mendowngrade role tak dikenal ke `User` diam-diam | Kini `Status::invalid_argument` |
| Refresh token tidak memeriksa status suspend | Ditolak dengan `Forbidden`, sama seperti login |
| WebSocket chat tidak memeriksa `token_type` | Refresh token kini ditolak membuka WS |
| `GET /users` membalas 401 untuk non-admin | Kini 403 (`AppError::Forbidden`) |
| `PATCH /users/:id/status` membalas 500 bila user tidak ada | Kini 404 |
| `PATCH` tidak terdaftar di CorsLayer auth-service | Ditambahkan |
| `ExtendSubscription` memanggil `Commit()` setelah `Rollback()` | Rollback sekali, lalu fallback `SubscribeUser` |
| `GetMembers` membuang error query DB | Error dikembalikan |
| `build.rs` memakai path absolut mesin developer untuk `protoc` | Urutan: env `PROTOC` → PATH → vendored |
| `realtime-service/build.rs` tanpa `rerun-if-changed` | Ditambahkan |
| `realtime-service/src/{api,mod}.rs` dead code yang tidak bisa di-compile | Dihapus |
| `auth-service/Cargo.lock` di-ignore, tiga crate lain di-track | Kini ikut di-track |
| Zod v4: `required_error` bikin `tsc` gagal | Diganti `error` |
| ESLint error `set-state-in-effect` + 2 warning React Compiler | `useState`-during-render & `useWatch` |
| Dead code frontend (`use-query`, `use-mutate`, `externalBackend`, `sidebar-dispatcher`, `getQueryClient`) | Dihapus |
| Class CSS `hide-arrow` dipakai tapi tidak pernah didefinisikan | Didefinisikan di `globals.css` |
| `EXPOSE 8000` di `grpc-service/Dockerfile.unified.dev` (gateway di 8080) | Diperbaiki |
| `sqlx-cli` di-install di image grpc prod tapi tak pernah dipakai; `shared-core` di-copy ke image realtime yang tidak memakainya; `protoc` di-install di image auth yang tak punya `build.rs` | Ketiganya dihapus |
| `make migrate` per service tanpa `--ignore-missing` → gagal di DB bersama | Flag ditambahkan |
| `.PHONY` root Makefile tidak lengkap | Dilengkapi |

---

## Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| `realtime-service` mati saat start dengan `Failed to connect to GRPC` | `grpc-service` belum jalan atau `AUTH_GRPC_URL` salah. Harus menunjuk `grpc-service:50051`, bukan `auth-service` |
| `main-service` selalu balas 500 "Failed to validate token via gRPC" | Sama seperti di atas — `AUTH_GRPC_URL` di Go **tanpa** skema `http://` |
| `auth-service` panic saat start walau tidak pakai OAuth | Keenam variabel OAuth wajib diisi. Isi nilai dummy |
| Gateway membalas request non-API dengan error/loop | `FRONTEND_URL` belum di-set ke `http://frontend:3000` di dalam container |
| `main-service` gagal build di dev: `compile: signal: killed` | `mem_limit` terlalu kecil. Compose dev sudah menaikkannya ke 1 GB |
| Container Rust kena OOM saat `cargo watch` | Beri RAM lebih ke VM Docker/Podman: `podman machine set --memory 8192` |
| Login berhasil tapi langsung dialihkan ke sign-in | `JWT_PUBLIC_KEY` di frontend tidak cocok dengan milik `auth-service` |
| Migrasi sqlx gagal karena checksum | Isi file migrasi yang sudah ter-apply berubah. Kembalikan isinya, atau reset volume dengan `make down-dev-volumes` |
