# Environment Variables

> Jangan commit file `.env` — sudah di-exclude oleh `.gitignore`. Template
> lengkap yang bisa disalin per blok ada di [`.env.example`](../.env.example).

Setiap service membaca `.env` di direktorinya sendiri:

```
auth-service/.env      grpc-service/.env      realtime-service/.env
main-service/.env      frontend/.env.development      frontend/.env.production
```

Kolom **Wajib** berarti service gagal start (panic Rust / `log.Fatal` Go) bila
variabel tidak diisi.

Nilai `host` pada contoh memakai nama service Docker. Untuk menjalankan manual
di host, ganti ke `localhost` — Postgres dipetakan ke port **5433** di host,
bukan 5432.

Port HTTP/gRPC service Rust di-hardcode di kode (`8000`, `8001`, `8080`,
`50051`) dan tidak bisa diubah lewat env. Hanya `main-service` yang membaca
`PORT`.

---

## `auth-service/.env` → HTTP `:8000`

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

Sumber: [`auth-service/src/main.rs`](../auth-service/src/main.rs).

## `grpc-service/.env` → gateway `:8080` + gRPC `:50051`

| Variabel | Wajib | Default | Keterangan |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | Dipakai `UserService` gRPC |
| `JWT_PRIVATE_KEY` | ✅ | — | |
| `JWT_PUBLIC_KEY` | ✅ | — | Dipakai untuk `ValidateToken` |
| `AUTH_SERVICE_URL` | — | `http://localhost:8000` | Target proxy `/api/v1/auth/*` dan `/api/v1/users/*` |
| `MAIN_SERVICE_URL` | — | `http://localhost:8002` | Target proxy `/api/v1/main/*` |
| `REALTIME_SERVICE_WS_URL` | — | `ws://localhost:8001` | Target bridge `/ws/*` |
| `FRONTEND_URL` | — | `http://localhost:3000` | Target fallback. Di Docker **harus** `http://frontend:3000` — default `localhost` menunjuk ke dalam container gateway sendiri. Sudah di-set di compose dev/prod/hub |
| `RUST_LOG` | — | `grpc_service=debug,sqlx=info` | |

Sumber: [`grpc-service/src/main.rs`](../grpc-service/src/main.rs),
[`gateway.rs`](../grpc-service/src/gateway.rs).

## `realtime-service/.env` → HTTP + WS `:8001`

> Fitur chat sedang [on-hold](operations.md#status-pengembangan). Variabel
> RabbitMQ di bawah akan diganti konfigurasi Kafka saat pengembangan dilanjutkan.

`JWT_PUBLIC_KEY` harus identik dengan milik `auth-service`. `JWT_PRIVATE_KEY`
juga wajib diisi karena dibutuhkan konstruktor `JwtService`, walaupun service
ini hanya memverifikasi token.

| Variabel | Wajib | Default | Keterangan |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | |
| `JWT_PRIVATE_KEY` | ✅ | — | |
| `JWT_PUBLIC_KEY` | ✅ | — | |
| `MINIO_ACCESS_KEY` | ✅ | — | |
| `MINIO_SECRET_KEY` | ✅ | — | |
| `MINIO_BUCKET` | ✅ | — | `technostock` |
| `AUTH_GRPC_URL` | — | `http://127.0.0.1:50051` | **Menunjuk ke `grpc-service`**, bukan `auth-service` |
| `MINIO_ENDPOINT` | — | `localhost` | Endpoint **internal** S3 (koneksi service → MinIO) |
| `MINIO_PUBLIC_URL` | — | endpoint internal | Base URL publik gambar chat — **harus bisa dibuka browser**. Di Docker isi `http://localhost:9000`; tanpa ini URL memakai host internal `minio` |
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

Sumber: [`realtime-service/src/main.rs`](../realtime-service/src/main.rs),
[`storage_service.rs`](../realtime-service/src/infrastructure/storage_service.rs).

## `main-service/.env` → HTTP `:8002`

| Variabel | Wajib | Default | Keterangan |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | Skema dibuat via GORM `AutoMigrate` |
| `AUTH_GRPC_URL` | ✅ | — | `grpc-service:50051` (tanpa skema `http://`) |
| `MIDTRANS_SERVER_KEY` | ✅ | — | Dari dashboard Midtrans → Settings → Access Keys |
| `MIDTRANS_CLIENT_KEY` | — | *(kosong)* | Dibaca `LoadConfig` tetapi **belum dipakai** kode mana pun |
| `MIDTRANS_ENV` | — | `sandbox` | `sandbox` atau `production`. Nilai lain → `log.Fatal` saat startup |
| `PORT` | — | `8002` | |

Sumber: [`main-service/config/config.go`](../main-service/config/config.go).

## `frontend/.env.development` dan `frontend/.env.production`

Variabel berawalan `NEXT_PUBLIC_` terekspos ke browser; sisanya hanya terbaca
di server (route handler dan server action).

| Variabel | Wajib | Default | Keterangan |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | — | URL gateway dari browser — `http://localhost:8080` |
| `NEXT_PUBLIC_WS_API_URL` | ✅ | — | URL WebSocket gateway — `ws://localhost:8080` |
| `NEXT_PUBLIC_APP_URL` | ✅ | URL request | Base URL untuk redirect absolut pada `oauth-callback` |
| `JWT_PUBLIC_KEY` | ✅ | — | Verifikasi RS256 di route handler `/api/auth/*`. Tanpa ini token hanya di-decode tanpa verifikasi tanda tangan |
| `SERVER_API_URL` | — | `NEXT_PUBLIC_API_URL`, lalu `http://localhost:8000` | Base URL fetch **server-side** ke auth-service. Di Docker: `http://auth-service:8000` |
| `SERVER_GATEWAY_URL` | — | `NEXT_PUBLIC_API_URL` | Base URL fetch **server-side** ke gateway (checkout & public pricing). Di Docker: `http://grpc-service:8080` |
| `NEXT_PUBLIC_MESSAGE_API_URL` | — | dari `NEXT_PUBLIC_WS_API_URL` (`ws→http`), lalu `http://localhost:8001` | Override base URL REST chat pada instance axios `messageBackend` |
| `BETTER_AUTH_URL` | — | `http://localhost:3000` | `baseURL` untuk `createAuthClient` |

Env yang dibaca kode frontend hanya kesembilan di atas plus `NODE_ENV`.
`DATABASE_URL` dan `BETTER_AUTH_SECRET` masih diset di beberapa file compose
tetapi **tidak dibaca kode frontend mana pun** — frontend tidak pernah
terhubung langsung ke database. Variabel OAuth (`GITHUB_CLIENT_ID`,
`GOOGLE_CLIENT_ID`, dan pasangan secret-nya) juga bukan milik frontend;
tempatnya di `auth-service/.env`.

---

## Generate JWT Keys (RSA)

Generate satu kali, pakai nilai yang sama di `auth-service`, `grpc-service`,
`realtime-service`, dan (public key saja) di `frontend`:

```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Ubah jadi satu baris untuk ditempel ke .env
cat private.pem | awk '{printf "%s\\n", $0}' | sed 's/\\n$//'
cat public.pem  | awk '{printf "%s\\n", $0}' | sed 's/\\n$//'
```

Semua service melakukan `.replace("\\n", "\n")` saat membaca env, jadi format
satu-baris di atas sudah benar.

---

## Kredensial Infrastruktur

Password Postgres, Redis, RabbitMQ, MinIO, dan Kafka **ditulis langsung di file
compose**, bukan diambil dari `.env`. Nilai tersebut hanya untuk development
lokal:

| Layanan | User | Password |
|---|---|---|
| PostgreSQL | `postgres` | `admin` |
| Redis | — | `daffahaidarnz27` |
| RabbitMQ | `daffahaidar` | `daffahaidarnz27` |
| MinIO | `daffahaidar` | `daffahaidarnz27` |
| Kafka (SASL/PLAIN) | `daffahaidar` | `daffahaidarnz27` |

Kafka belum punya variabel env di service mana pun — kredensialnya inline di
JAAS config `docker-compose.dev.yml` dan baru akan dibaca kode saat
`realtime-service` dimigrasi dari RabbitMQ.

Ganti seluruhnya sebelum deploy ke lingkungan mana pun yang bisa diakses dari
luar.
