# Panduan Instalasi dan Menjalankan Technostock

Dokumentasi ini menjelaskan langkah-langkah **sangat rinci** untuk menjalankan proyek Technostock di tiga sistem operasi berbeda (macOS, Windows, Linux) baik menggunakan Docker (sangat direkomendasikan) maupun tanpa Docker (manual murni).

---

## 📋 Langkah Persiapan (Wajib untuk Semua OS)

Sebelum masuk ke panduan spesifik OS, lakukan langkah-langkah berikut di terminal Anda:

### 1. Clone Repository
```bash
git clone https://github.com/daffahaidar/technostock.git
cd technostock
```

### 2. Persiapkan Environment Variables (`.env`)
Anda harus membuat file `.env` di masing-masing direktori service dengan meng-copy dari template:
```bash
# Untuk Auth Service
cp .env.example auth-service/.env

# Untuk Realtime Service
cp .env.example realtime-service/.env

# Untuk gRPC Service (Gateway)
cp .env.example grpc-service/.env

# Untuk Main Service
cp .env.example main-service/.env

# Untuk Frontend
cp .env.example frontend/.env.development
```
*Catatan: Edit isi file `.env` tersebut dan hapus bagian yang tidak relevan dengan service tersebut.*

### 3. Generate JWT Keys (Hanya 1x)
Semua service Rust membutuhkan sepasang kunci RSA. Generate dengan OpenSSL:
```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -pubout -out public.pem

# Salin output private key ke JWT_PRIVATE_KEY di .env
cat private.pem | awk '{printf "%s\\n", $0}' | sed 's/\\n$//'

# Salin output public key ke JWT_PUBLIC_KEY di .env
cat public.pem  | awk '{printf "%s\\n", $0}' | sed 's/\\n$//'
```
*Pastikan `JWT_PUBLIC_KEY` dan `JWT_PRIVATE_KEY` disamakan pada file `.env` di `auth-service`, `realtime-service`, dan `grpc-service`.*

---

## 🍏 1. MacOS dengan Docker (Direkomendasikan)

**Langkah Instalasi:**
1. Unduh dan install [Docker Desktop untuk Mac](https://www.docker.com/products/docker-desktop/).
2. Buka aplikasi Docker Desktop dan tunggu hingga statusnya *Running*.
3. Buka terminal (Terminal.app atau iTerm2).

**Menjalankan Proyek:**
Pastikan Anda berada di root folder `technostock`.
```bash
# Build dan jalankan seluruh container
docker compose -f docker-compose.dev.yml up --build
```
Proses pertama kali akan memakan waktu karena akan men-download image dan me-compile Rust dari awal. Setelah selesai, seluruh service dan infrastruktur akan berjalan.

---

## 🍏 2. MacOS Tanpa Docker (Manual)

**Langkah Instalasi Infrastruktur:**
Gunakan [Homebrew](https://brew.sh/):
```bash
# 1. Install PostgreSQL, Redis, RabbitMQ, dan MinIO
brew install postgresql redis rabbitmq minio/stable/minio

# 2. Jalankan service infrastruktur di background
brew services start postgresql
brew services start redis
brew services start rabbitmq

# 3. Jalankan MinIO (buka terminal tab baru khusus untuk MinIO)
mkdir -p ~/minio-data
minio server ~/minio-data --console-address ":9001"

# 4. Siapkan Database PostgreSQL
psql postgres -c "CREATE USER postgres WITH PASSWORD 'admin';"
psql postgres -c "CREATE DATABASE technostock OWNER postgres;"
```

**Langkah Instalasi Bahasa Pemrograman:**
```bash
# Install Node.js, Go, dan Rust
brew install node go
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Protoc (wajib untuk gRPC) dan SQLx CLI (untuk migrasi Rust)
brew install protobuf
cargo install sqlx-cli --no-default-features --features postgres
```

**Menjalankan Service Secara Berurutan:**
*(Buka 5 tab terminal terpisah, pastikan sudah di root folder `technostock`)*

1. **Auth Service (Terminal 1)**
```bash
cd auth-service
sqlx migrate run
cargo run
```
2. **Realtime Service (Terminal 2)**
```bash
cd realtime-service
sqlx migrate run
cargo run
```
3. **Main Service (Terminal 3)**
```bash
cd main-service
go mod download
go run cmd/api/main.go
```
4. **gRPC Gateway (Terminal 4)**
```bash
cd grpc-service
cargo run
```
5. **Frontend (Terminal 5)**
```bash
cd frontend
npm install
npm run dev
```

---

## 🪟 3. Windows dengan Docker (Direkomendasikan)

**Langkah Instalasi:**
1. Install [WSL 2](https://learn.microsoft.com/en-us/windows/wsl/install) (Windows Subsystem for Linux). Buka PowerShell sebagai Administrator dan jalankan: `wsl --install`
2. Restart komputer Anda.
3. Unduh dan install [Docker Desktop untuk Windows](https://www.docker.com/products/docker-desktop/).
4. Buka Docker Desktop dan pastikan opsi "Use the WSL 2 based engine" tercentang di Settings.

**Menjalankan Proyek:**
Buka terminal (PowerShell atau WSL Ubuntu).
```powershell
docker compose -f docker-compose.dev.yml up --build
```
Biarkan Docker yang mengurus instalasi dan kompilasi semuanya.

---

## 🪟 4. Windows Tanpa Docker (Manual)

*Catatan: Menginstall semua infrastruktur secara native di Windows sangat kompleks (terutama Redis yang tidak support native Windows). Kami merekomendasikan menggunakan WSL 2 Ubuntu, lalu jalankan instruksi Linux di bawah.*
Namun, jika Anda ingin menggunakan Windows murni:

**Langkah Instalasi Infrastruktur:**
1. **PostgreSQL**: Unduh installer dari [situs resmi EDB](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads). Saat instalasi, set password user `postgres` menjadi `admin`, dan buat database `technostock` melalui pgAdmin.
2. **Redis**: Gunakan [Memurai](https://www.memurai.com/) (Redis-compatible untuk Windows) atau jalankan redis via WSL.
3. **RabbitMQ**: Install [Erlang](https://www.erlang.org/downloads) terlebih dahulu, kemudian install [RabbitMQ Server](https://www.rabbitmq.com/install-windows.html).
4. **MinIO**: Unduh file `.exe` dari [situs resmi MinIO](https://min.io/download#/windows). Jalankan di command prompt:
```cmd
minio.exe server C:\minio-data --console-address ":9001"
```

**Langkah Instalasi Bahasa Pemrograman:**
1. Install [Node.js (LTS)](https://nodejs.org/en/download/).
2. Install [Go](https://go.dev/dl/).
3. Install [Rust via rustup-init.exe](https://rustup.rs/). Pastikan Anda menginstall *C++ Build Tools for Visual Studio*.
4. Install [Protoc](https://github.com/protocolbuffers/protobuf/releases) (ekstrak dan masukkan folder `bin` ke System PATH).
5. Install `sqlx-cli` via Cargo: `cargo install sqlx-cli --no-default-features --features postgres`

**Menjalankan Service Secara Berurutan:**
Sama seperti cara MacOS di atas, buka 5 jendela PowerShell yang berbeda, navigasi ke setiap direktori service, dan jalankan perintah: `cargo run`, `go run cmd/api/main.go`, dan `npm run dev`.

---

## 🐧 5. Linux (Ubuntu/Debian) dengan Docker (Direkomendasikan)

**Langkah Instalasi:**
1. Install Docker Engine dan Docker Compose V2:
```bash
sudo apt update
sudo apt install ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```
2. Tambahkan user Anda ke grup docker agar tidak perlu `sudo`:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

**Menjalankan Proyek:**
```bash
make dev
# atau
docker compose -f docker-compose.dev.yml up --build
```

---

## 🐧 6. Linux (Ubuntu/Debian) Tanpa Docker (Manual)

**Langkah Instalasi Infrastruktur:**
```bash
# 1. Install PostgreSQL & Redis
sudo apt update
sudo apt install postgresql postgresql-contrib redis-server

# 2. Setup PostgreSQL
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'admin';"
sudo -u postgres createdb technostock

# 3. Install RabbitMQ
sudo apt install rabbitmq-server
sudo systemctl enable rabbitmq-server
sudo systemctl start rabbitmq-server

# 4. Install MinIO
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/
mkdir -p ~/minio-data
# Jalankan MinIO (di tab baru)
minio server ~/minio-data --console-address ":9001"
```

**Langkah Instalasi Bahasa Pemrograman:**
```bash
# 1. Node.js (via NVM atau apt)
sudo apt install nodejs npm

# 2. Go
sudo apt install golang-go

# 3. Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# 4. Protoc & Build tools
sudo apt install protobuf-compiler build-essential pkg-config libssl-dev

# 5. SQLx CLI
cargo install sqlx-cli --no-default-features --features postgres
```

**Menjalankan Service Secara Berurutan:**
*(Buka 5 tab terminal terpisah, pastikan sudah di root folder `technostock`)*

1. **Auth Service (Terminal 1)**
```bash
cd auth-service
sqlx migrate run
cargo run
```
2. **Realtime Service (Terminal 2)**
```bash
cd realtime-service
sqlx migrate run
cargo run
```
3. **Main Service (Terminal 3)**
```bash
cd main-service
go mod download
go run cmd/api/main.go
```
4. **gRPC Gateway (Terminal 4)**
```bash
cd grpc-service
cargo run
```
5. **Frontend (Terminal 5)**
```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Akses Layanan Setelah Running

- **Frontend UI:** `http://localhost:3000`
- **API Gateway:** `http://localhost:8080` (untuk seluruh API HTTP maupun WebSocket)
- **MinIO Console (Storage):** `http://localhost:9001` (Login menggunakan kredensial di `.env`)
- **RabbitMQ Admin (Opsional):** `http://localhost:15672` (Gunakan username & password di `.env`)
