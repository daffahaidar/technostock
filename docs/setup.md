# Instalasi & Menjalankan

Panduan menjalankan AngelTrade di macOS, Windows, dan Linux — baik dengan
container (direkomendasikan) maupun manual.

## Prerequisites

### Dengan container

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) v24+ dan
  [Docker Compose](https://docs.docker.com/compose/) v2.20+, **atau**
  [Podman](https://podman-desktop.io/) 4.7+
- RAM minimal **8 GB**. Limit memory untuk service Rust di compose dev sengaja
  dinonaktifkan agar `cargo watch` tidak kena OOM/`SIGKILL`.

### Manual

- [Node.js](https://nodejs.org/) v20+ & npm
- [Rust](https://rustup.rs/) 1.75+ & Cargo
- [Go](https://go.dev/) 1.21+
- [sqlx-cli](https://github.com/launchbadge/sqlx/tree/main/sqlx-cli) —
  `cargo install sqlx-cli --no-default-features --features postgres`
- [protoc](https://grpc.io/docs/protoc-installation/) — dibutuhkan `build.rs` di
  `grpc-service` dan `realtime-service`
- PostgreSQL, Redis, RabbitMQ, dan MinIO berjalan lokal

---

## Langkah Persiapan (semua OS)

### 1. Clone repository

```bash
git clone https://github.com/daffahaidar/angeltrade.git
cd angeltrade
```

### 2. Siapkan file `.env`

[`.env.example`](../.env.example) di root sudah dikelompokkan per service —
salin blok yang relevan ke masing-masing file:

```bash
touch auth-service/.env
touch grpc-service/.env
touch realtime-service/.env
touch main-service/.env
touch frontend/.env.development   # dan frontend/.env.production untuk mode prod
```

Tabel lengkap beserta default ada di [environment.md](environment.md).
Ringkasan variabel yang membuat service **gagal start** bila kosong:

| Service | Wajib diisi |
|---|---|
| `auth-service` | `DATABASE_URL`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, **keenam** variabel OAuth GitHub & Google |
| `grpc-service` | `DATABASE_URL`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY` |
| `realtime-service` | `DATABASE_URL`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET` |
| `main-service` | `DATABASE_URL`, `AUTH_GRPC_URL`, `MIDTRANS_SERVER_KEY` |

> `auth-service` panic saat startup bila variabel OAuth kosong, walaupun Anda
> tidak berencana memakai login Google/GitHub. Isi dengan nilai dummy bila hanya
> ingin mencoba login email.

> `AUTH_GRPC_URL` di `main-service` dan `realtime-service` menunjuk ke
> **`grpc-service`**, bukan `auth-service`. Server gRPC dijalankan gateway.

### 3. Generate JWT keys (satu kali)

```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

cat private.pem | awk '{printf "%s\\n", $0}' | sed 's/\\n$//'
cat public.pem  | awk '{printf "%s\\n", $0}' | sed 's/\\n$//'
```

- `JWT_PRIVATE_KEY` **dan** `JWT_PUBLIC_KEY` → `auth-service`, `grpc-service`,
  `realtime-service` (nilai identik di ketiganya)
- `JWT_PUBLIC_KEY` saja → `frontend`

---

## Menjalankan dengan Container

Semua compose file kompatibel dengan **Docker maupun Podman** — syntax
`<engine> compose` identik, jadi tidak ada file terpisah untuk Podman.

```bash
make dev      # development, hot-reload, foreground
make dev-d    # development, background
make prod     # production build, foreground
make prod-d   # production build, background
```

Engine default: **podman di Windows, docker di macOS/Linux**
([Makefile](../Makefile) memilih berdasarkan variabel `$(OS)`). Override:

```bash
make engine              # cek engine yang dipakai
make docker:dev          # paksa docker
make podman:dev          # paksa podman
make dev ENGINE=docker   # bentuk panjang
```

Daftar perintah lengkap ada di [operations.md](operations.md).

> Build pertama kali memakan 10–20 menit karena Rust dikompilasi dari nol. Build
> berikutnya jauh lebih cepat berkat layer cache dan named volume untuk
> `target/`.

### Catatan Podman

- Butuh Podman **4.7+**. `podman compose` mendelegasikan ke provider eksternal
  (`docker-compose` atau `podman-compose`) — salah satu harus terpasang.
- Di Windows/macOS jalankan `podman machine start` dulu. Beri VM RAM cukup untuk
  compile Rust: `podman machine set --memory 8192` (default 2 GB terlalu kecil).
- Rootless Podman menghormati `mem_limit`, jadi limit memori di compose tetap
  berlaku.

### Catatan `make` di Windows

Dari PowerShell/cmd, GNU Make memakai `cmd.exe` sebagai shell sehingga output
`@echo` tampil dengan tanda kutip. Itu kosmetik saja — recipe-nya tetap
berjalan normal. Untuk output bersih, jalankan `make` dari Git Bash.

---

## Menjalankan Manual

**Urutan start penting.** `grpc-service` menyediakan server gRPC `:50051`.
Tanpa itu `realtime-service` gagal start (`Failed to connect to GRPC`) dan
`main-service` tidak bisa memvalidasi token.

### 1. Infrastruktur

Cara tercepat, pakai compose per komponen di [`tools/`](../tools/):

```bash
cd tools/postgres && docker compose up -d && cd ../..
cd tools/redis    && docker compose up -d && cd ../..
cd tools/rabbitmq && docker compose up -d && cd ../..
cd tools/minio    && docker compose up -d && cd ../..
```

`tools/kafka/` juga tersedia, tetapi belum dibutuhkan service mana pun — Kafka
baru akan dipakai saat event `realtime-service` dimigrasi dari RabbitMQ.

Kalau hanya mengerjakan user & subscription (fokus saat ini), `redis`,
`rabbitmq`, `minio`, dan `kafka` tidak wajib dijalankan — cukup `postgres`,
lalu lewati `realtime-service` di langkah berikutnya.

Instalasi native per OS ada di [bawah](#instalasi-infrastruktur-native).

### 2–6. Service (5 terminal terpisah)

```bash
# Terminal 1 — grpc-service: gateway :8080 + gRPC :50051
cd grpc-service && cargo run

# Terminal 2 — auth-service :8000
cd auth-service && cargo run

# Terminal 3 — realtime-service :8001 (opsional, fitur chat on-hold)
cd realtime-service && cargo run

# Terminal 4 — main-service :8002
cd main-service && go mod download && go run ./cmd/api/main.go

# Terminal 5 — frontend :3000
cd frontend && npm install && npm run dev
```

Untuk hot-reload: `cargo watch -c -x run` (Rust), `air` (Go).

**Migrasi tidak perlu dijalankan manual.** `auth-service` dan
`realtime-service` menerapkan migrasi sqlx-nya sendiri saat startup (dengan
`ignore_missing`), dan `main-service` memakai GORM `AutoMigrate`. Bila database
belum ada, jalankan `sqlx database create` sekali dari `auth-service/`. Detail
mekanismenya ada di [database.md → Migrasi](database.md#migrasi).

### Frontend mode production

```bash
cd frontend
npm install
npm run build     # output standalone
npm start         # menyalin public/ + .next/static, lalu menjalankan server.js
```

`npm run dev` membaca `.env.development`; `npm run build`/`npm start` membaca
`.env.production`.

---

## URL Setelah Semua Service Running

| URL | Keterangan |
|---|---|
| http://localhost:3000 | Frontend |
| http://localhost:8080 | API Gateway — satu-satunya endpoint yang dipanggil browser |
| http://localhost:8000 | auth-service (internal) |
| http://localhost:8001 | realtime-service, HTTP + WebSocket (internal) |
| http://localhost:8002 | main-service (internal) |
| `localhost:50051` | gRPC `UserService`, dilayani `grpc-service` (internal) |
| http://localhost:15672 | RabbitMQ Management — login `RABBITMQ_USER` / `RABBITMQ_PASS` |
| http://localhost:9001 | MinIO Console — login `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` |
| `localhost:9092` | Kafka (SASL_PLAINTEXT) — belum dipakai kode, disiapkan untuk `realtime-service` |
| `localhost:5433` | PostgreSQL |

> Endpoint chat (`/api/v1/chat/*`) belum ter-route di gateway dan harus diakses
> langsung ke `realtime-service` di port `8001` — fitur chat sedang
> [on-hold](operations.md#status-pengembangan).

---

## Setup OAuth

Redirect URI mengarah ke **frontend**, bukan ke auth-service. Frontend menerima
`code`, menukarnya ke auth-service, lalu men-set cookie.

### Google

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Buat OAuth 2.0 Client ID (Web Application)
3. Authorized redirect URI:
   `http://localhost:3000/api/auth/oauth-callback?provider=google`

### GitHub

1. [GitHub Developer Settings](https://github.com/settings/developers) → New OAuth App
2. Authorization callback URL:
   `http://localhost:3000/api/auth/oauth-callback?provider=github`

Isi client id/secret ke `auth-service/.env` — bukan ke frontend.

---

## Instalasi Infrastruktur Native

Hanya diperlukan bila tidak memakai container sama sekali.

### macOS (Homebrew)

```bash
brew install postgresql redis rabbitmq minio/stable/minio
brew services start postgresql
brew services start redis
brew services start rabbitmq

mkdir -p ~/minio-data
minio server ~/minio-data --console-address ":9001"   # terminal terpisah

psql postgres -c "CREATE USER postgres WITH PASSWORD 'admin';"
psql postgres -c "CREATE DATABASE angeltrade OWNER postgres;"

# Toolchain
brew install node go protobuf
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install sqlx-cli --no-default-features --features postgres
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib redis-server rabbitmq-server
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'admin';"
sudo -u postgres createdb angeltrade
sudo systemctl enable --now rabbitmq-server

wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio && sudo mv minio /usr/local/bin/
mkdir -p ~/minio-data
minio server ~/minio-data --console-address ":9001"   # terminal terpisah

# Toolchain
sudo apt install nodejs npm golang-go protobuf-compiler build-essential pkg-config libssl-dev
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh && source $HOME/.cargo/env
cargo install sqlx-cli --no-default-features --features postgres
```

Untuk Docker Engine di Ubuntu, ikuti
[panduan resmi Docker](https://docs.docker.com/engine/install/ubuntu/), lalu:

```bash
sudo usermod -aG docker $USER && newgrp docker
```

### Windows

Instalasi native penuh di Windows rumit — Redis tidak punya build native resmi.
**Rekomendasi: pakai WSL 2 Ubuntu** dan ikuti langkah Linux di atas.

```powershell
wsl --install     # PowerShell sebagai Administrator, lalu restart
```

Bila tetap ingin Windows murni:

1. **PostgreSQL** — installer [EDB](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads).
   Set password user `postgres` = `admin`, buat database `angeltrade`.
2. **Redis** — [Memurai](https://www.memurai.com/) atau jalankan lewat WSL.
3. **RabbitMQ** — install [Erlang](https://www.erlang.org/downloads) dulu, lalu
   [RabbitMQ Server](https://www.rabbitmq.com/install-windows.html).
4. **MinIO** — unduh `.exe`, jalankan
   `minio.exe server C:\minio-data --console-address ":9001"`.
5. **Toolchain** — [Node.js LTS](https://nodejs.org/en/download/),
   [Go](https://go.dev/dl/), [rustup](https://rustup.rs/) (+ *C++ Build Tools
   for Visual Studio*), [protoc](https://github.com/protocolbuffers/protobuf/releases)
   (masukkan folder `bin` ke PATH), dan `sqlx-cli`.
