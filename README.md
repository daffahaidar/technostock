# Technorider

Technorider adalah platform hardware technology berbasis microservices. Monorepo ini terdiri dari 4 service utama yang berkomunikasi satu sama lain melalui REST API, WebSocket, dan gRPC.

## Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / WebSocket
┌──────────────────────────▼──────────────────────────────────┐
│                   frontend  :3000  (Next.js)                 │
└──────┬──────────────────┬──────────────────┬────────────────┘
       │ HTTP :8000        │ WebSocket :8001   │ HTTP :8002
       │ gRPC :50051       │                   │
┌──────▼──────┐    ┌───────▼───────┐   ┌──────▼──────────────┐
│  auth-service  │    │ rust-message  │   │   fiber-product      │
│  :8000      │◄───│  :8001        │   │   :8002  (Go/Fiber)  │
│  :50051     │    │  (Rust/Axum)  │   └──────────────────────┘
│  (Rust)     │    └───────┬───────┘
└──────┬──────┘            │
       │                   │
┌──────▼───────────────────▼──────────────────────────────────┐
│              Infrastructure                                   │
│   PostgreSQL :5433 │ Redis :6379 │ RabbitMQ :5672 │ MinIO :9000 │
└─────────────────────────────────────────────────────────────┘
```

## Daftar Service

| Service | Stack | Port | Deskripsi |
|---|---|---|---|
| `frontend` | Next.js 15 | 3000 | UI utama aplikasi |
| `auth-service` | Rust + Axum | 8000, 50051 | Autentikasi, JWT, OAuth (gRPC server) |
| `rust-message` | Rust + Axum | 8001 | Real-time chat via WebSocket (gRPC client) |
| `fiber-product` | Go + Fiber | 8002 | Manajemen produk & pembayaran Midtrans |

## Prerequisites

### Untuk Docker (Direkomendasikan)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) v24+
- [Docker Compose](https://docs.docker.com/compose/) v2.20+
- Minimal RAM: **8 GB** (Rust compile butuh memory besar)

### Untuk Manual
- [Node.js](https://nodejs.org/) v20+ & npm
- [Rust](https://rustup.rs/) 1.75+ & Cargo
- [Go](https://go.dev/) 1.21+
- [sqlx-cli](https://github.com/launchbadge/sqlx/tree/main/sqlx-cli) untuk migrasi Rust
- [protoc](https://grpc.io/docs/protoc-installation/) (Protocol Buffer compiler)
- PostgreSQL, Redis, RabbitMQ, MinIO berjalan secara lokal

---

## Cara Menjalankan

### ✅ Opsi 1: Docker (Semua Service Sekaligus) — Direkomendasikan

Cara termudah untuk menjalankan seluruh stack sekaligus.

**1. Clone repository**
```bash
git clone https://github.com/daffahaidar/technorider.git
cd technorider
```

**2. Siapkan environment variables**

Setiap service membutuhkan file `.env` masing-masing. Lihat bagian [Environment Variables](#environment-variables) di bawah untuk detail lengkapnya.

```bash
# Salin template (opsional, untuk referensi)
cp .env.example .env.example.local
```

**3. Jalankan mode Development** (hot-reload aktif)
```bash
make dev
# atau
docker compose -f docker-compose.dev.yml up --build
```

**4. Jalankan mode Production** (optimized build)
```bash
make prod
# atau
docker compose -f docker-compose.prod.yml up --build
```

**5. Jalankan di background**
```bash
make dev-d    # development background
make prod-d   # production background
```

**Perintah Makefile lainnya:**
```bash
make down-dev          # Hentikan semua service dev
make down-prod         # Hentikan semua service prod
make logs-dev          # Tail logs dev
make logs-prod         # Tail logs prod
make ps-dev            # Status container dev
make down-dev-volumes  # Hentikan + hapus semua data volume dev
```

> **Catatan pertama kali**: Build Rust service akan memakan waktu 10–20 menit karena compile dari scratch. Build selanjutnya jauh lebih cepat berkat layer cache Docker dan named volume untuk `target/`.

**Akses setelah semua service running:**

| URL | Service |
|---|---|
| http://localhost:3000 | Frontend |
| http://localhost:8000 | auth-service API |
| http://localhost:8001 | rust-message WebSocket |
| http://localhost:8002 | fiber-product API |
| http://localhost:15672 | RabbitMQ Management UI |
| http://localhost:9001 | MinIO Console |
| `localhost:5433` | PostgreSQL |

---

### ⚙️ Opsi 2: Manual (Per Service)

Cocok untuk development fokus pada satu service tertentu.

#### 2.1 Jalankan Infrastructure Terlebih Dahulu

Gunakan tools yang sudah tersedia:

```bash
# PostgreSQL
cd tools/postgres && docker compose up -d && cd ../..

# Redis
cd tools/redis && docker compose up -d && cd ../..

# RabbitMQ
cd tools/rabbitmq && docker compose up -d && cd ../..

# MinIO
cd tools/minio && docker compose up -d && cd ../..
```

#### 2.2 auth-service

```bash
cd auth-service

# 1. Buat file .env (lihat bagian Environment Variables)
cp .env.example .env   # edit sesuai kebutuhan

# 2. Jalankan migrasi database
sqlx database create    # jika database belum ada
sqlx migrate run

# 3. Jalankan service
cargo run

# atau dengan hot-reload:
cargo watch -c -x run
```

Service berjalan di:
- HTTP: `http://localhost:8000`
- gRPC: `localhost:50051`

#### 2.3 rust-message

```bash
cd rust-message

# 1. Buat file .env
cp .env.example .env   # edit sesuai kebutuhan

# 2. Jalankan migrasi database
sqlx migrate run

# 3. Jalankan service
cargo run

# atau dengan hot-reload:
cargo watch -c -x run
```

Service berjalan di: `http://localhost:8001`

#### 2.4 fiber-product

```bash
cd fiber-product

# 1. Buat file .env
cp .env.example .env   # edit sesuai kebutuhan

# 2. Download dependencies
go mod download

# 3. Jalankan service
go run ./cmd/api/main.go

# atau dengan hot-reload (Air):
air
```

Service berjalan di: `http://localhost:8002`

#### 2.5 frontend

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Buat file .env.development (untuk dev) atau .env.production (untuk prod)
# Lihat bagian Environment Variables

# 3. Jalankan development server
npm run dev

# atau build production:
npm run build
npm start
```

Frontend berjalan di: `http://localhost:3000`

---

## Environment Variables

> ⚠️ **Jangan commit file `.env`** — sudah di-exclude oleh `.gitignore`. File `.env.example` di root bisa dijadikan referensi.

### `auth-service/.env`

```env
# ─── Database ─────────────────────────────────────────────────
DATABASE_URL=postgres://postgres:admin@localhost:5433/technorider

# ─── JWT Keys (RSA) ───────────────────────────────────────────
# Generate dengan: openssl genrsa -out private.pem 2048 && openssl rsa -in private.pem -pubout -out public.pem
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# ─── Logging ──────────────────────────────────────────────────
RUST_LOG=info

# ─── OAuth — GitHub ───────────────────────────────────────────
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/oauth-callback?provider=github

# ─── OAuth — Google ───────────────────────────────────────────
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/oauth-callback?provider=google

# ─── MinIO (Object Storage) ───────────────────────────────────
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=daffahaidar
MINIO_SECRET_KEY=daffahaidarnz27
MINIO_BUCKET=technorider

# ─── RabbitMQ ─────────────────────────────────────────────────
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=daffahaidar
RABBITMQ_PASS=daffahaidarnz27

# ─── Redis ────────────────────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=daffahaidarnz27
```

### `rust-message/.env`

> Sama dengan `auth-service/.env` di atas. Pastikan `JWT_PUBLIC_KEY` sama persis dengan yang ada di `auth-service` karena rust-message memverifikasi token yang dibuat oleh auth-service.

```env
DATABASE_URL=postgres://postgres:admin@localhost:5433/technorider
JWT_PRIVATE_KEY="..."
JWT_PUBLIC_KEY="..."
RUST_LOG=info
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/oauth-callback?provider=github
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/oauth-callback?provider=google
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=daffahaidar
MINIO_SECRET_KEY=daffahaidarnz27
MINIO_BUCKET=technorider
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=daffahaidar
RABBITMQ_PASS=daffahaidarnz27
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=daffahaidarnz27
```

### `fiber-product/.env`

```env
# ─── Database ─────────────────────────────────────────────────
DATABASE_URL=postgres://postgres:admin@localhost:5433/technorider

# ─── Server ───────────────────────────────────────────────────
PORT=8002

# ─── gRPC ke auth-service ────────────────────────────────────────
AUTH_GRPC_URL=localhost:50051

# ─── Midtrans Payment Gateway ─────────────────────────────────
# Dapatkan dari: https://dashboard.midtrans.com → Settings → Access Keys
MIDTRANS_MERCHANT_ID=
MIDTRANS_CLIENT_KEY=
MIDTRANS_SERVER_KEY=
```

### `frontend/.env.development` & `frontend/.env.production`

```env
# ─── Better Auth ──────────────────────────────────────────────
# Generate dengan: openssl rand -base64 32
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

# ─── API URLs (Client-side, diakses dari browser) ─────────────
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_API_URL=ws://localhost:8001
NEXT_PUBLIC_GOLANG_API=http://localhost:8002
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ─── Database (dipakai oleh Better Auth server-side) ──────────
DATABASE_URL=postgres://postgres:admin@localhost:5433/technorider

# ─── JWT Public Key (untuk verifikasi token dari auth-service) ───
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# ─── OAuth — GitHub ───────────────────────────────────────────
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

---

## Generate JWT Keys (RSA)

Semua service yang menggunakan JWT membutuhkan sepasang RSA key yang sama. Generate sekali, gunakan di semua service:

```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -pubout -out public.pem

# Lihat hasilnya dalam format satu baris (untuk dimasukkan ke .env)
cat private.pem | awk '{printf "%s\\n", $0}' | sed 's/\\n$//'
cat public.pem  | awk '{printf "%s\\n", $0}' | sed 's/\\n$//'
```

---

## Setup OAuth (Google & GitHub)

### Google OAuth
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project → **APIs & Services** → **Credentials**
3. Buat **OAuth 2.0 Client ID** (tipe: Web Application)
4. Tambahkan Authorized redirect URI: `http://localhost:3000/api/auth/oauth-callback?provider=google`
5. Copy **Client ID** dan **Client Secret** ke `.env`

### GitHub OAuth
1. Buka [GitHub Developer Settings](https://github.com/settings/developers)
2. **New OAuth App**
3. Authorization callback URL: `http://localhost:3000/api/auth/oauth-callback?provider=github`
4. Copy **Client ID** dan **Client Secret** ke `.env`

---

## Struktur Monorepo

```
technorider/
├── docker-compose.dev.yml    # Unified dev (semua service + infra)
├── docker-compose.prod.yml   # Unified prod
├── Makefile                  # Shortcut: make dev, make prod, dst.
├── .env.example              # Template env vars
├── .dockerignore             # Exclude dari Docker build context
│
├── frontend/                 # Next.js 15 App
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod
│   ├── .env.development      # ← perlu diisi
│   └── .env.production       # ← perlu diisi
│
├── auth-service/                # Rust Auth Service
│   ├── Dockerfile.dev
│   ├── Dockerfile.unified.dev  # Dipakai oleh root compose
│   ├── Dockerfile.prod
│   ├── migrations/
│   ├── .env                  # ← perlu diisi (tidak di-commit)
│   └── src/
│
├── rust-message/             # Rust Message Service
│   ├── Dockerfile.dev
│   ├── Dockerfile.unified.dev
│   ├── Dockerfile.prod
│   ├── migrations/
│   ├── .env                  # ← perlu diisi (tidak di-commit)
│   └── src/
│
├── fiber-product/            # Go Product Service
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod
│   ├── .env                  # ← perlu diisi (tidak di-commit)
│   └── cmd/
│
├── proto/                    # Shared Protobuf definitions
│   └── user.proto
│
└── tools/                    # Docker configs untuk infra lokal
    ├── postgres/
    ├── redis/
    ├── rabbitmq/
    └── minio/
```

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Better Auth |
| Auth Service | Rust, Axum, sqlx, tonic (gRPC), JWT RS256 |
| Message Service | Rust, Axum, WebSocket, RabbitMQ, sqlx |
| Product Service | Go, Fiber, GORM, Midtrans |
| Database | PostgreSQL 17 |
| Cache | Redis 7 |
| Message Broker | RabbitMQ 3 |
| Object Storage | MinIO |
| Container | Docker, Docker Compose |
