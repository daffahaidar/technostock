# Technostock Frontend

Aplikasi frontend Next.js untuk ekosistem Technostock. Frontend ini telah dikonfigurasi untuk berjalan di local menggunakan Node.js maupun secara terisolasi menggunakan Docker.

## Prasyarat

Untuk menjalankan project ini, pastikan sistem kamu memiliki:

- **Node.js** (versi LTS terbaru) direkomendasikan jika menjalankan tanpa Docker.
- **Docker** & **Docker Compose** jika ingin menjalankan menggunakan container.

---

## 1. Menjalankan Tanpa Docker (Native)

Pastikan file environment sudah disiapkan:

- `.env.development` (untuk mode Dev)
- `.env.production` (untuk mode Prod)

### Development Mode

Perintah ini akan menjalankan development server Next.js dengan fitur _Hot Reloading_. Server akan otomatis membaca file `.env.development`.

```bash
# 1. Install dependencies
npm install

# 2. Jalankan dev server
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`.

### Production Mode

Perintah ini akan mem-build aplikasi agar siap untuk production. Server akan otomatis membaca file `.env.production`.

```bash
# 1. Install dependencies
npm install

# 2. Build aplikasi (standalone output)
npm run build

# 3. Jalankan server production
npm start
```

Aplikasi akan berjalan di `http://localhost:3000`.

---

## 2. Menjalankan Menggunakan Docker

Kami telah menyediakan skrip NPM khusus untuk mempermudah menjalankan Docker Compose.

### Development Mode

Menjalankan container Docker dengan _volume mount_ sehingga setiap perubahan kode di komputer kamu (host) akan langsung merubah tampilan tanpa perlu mematikan container (_Hot Reload_ berjalan sempurna).

```bash
# Build dan jalankan Docker Dev (menggunakan docker-compose.dev.yml)
npm run docker:dev

# Untuk menghentikan container Dev
npm run docker:down:dev
```

Aplikasi akan berjalan di `http://localhost:3000`.

### Production Mode

Menjalankan _multi-stage build_ Docker di mana source code akan di-compile, dan hanya file-file `standalone` Next.js yang dikemas (sehingga image sangat kecil dan tidak bergantung pada `node_modules` host).

```bash
# Build dan jalankan Docker Prod (menggunakan docker-compose.prod.yml)
npm run docker:prod

# Untuk menghentikan container Prod
npm run docker:down:prod
```

Aplikasi akan berjalan di `http://localhost:3000`.

---

## Catatan Tentang Environment Variables

- **Di Luar Docker:**
  Aplikasi menggunakan `localhost` untuk terhubung ke microservices lainnya.
- **Di Dalam Docker (compose di folder ini):**
  Container dikonfigurasi dengan `extra_hosts` agar `host.docker.internal` me-resolve ke mesin host. Ini dipakai untuk skenario "frontend di Docker, backend di host", dan mencegah _connection refused_ pada fetch server-side (misalnya callback OAuth).
- **Di Dalam Docker (compose unified di root repo):**
  Frontend berada satu network dengan backend, jadi `SERVER_API_URL` memakai nama service (`http://auth-service:8000`) alih-alih `host.docker.internal`.

### Daftar Environment Variables

Siapkan `.env.development` (mode dev) dan `.env.production` (mode prod). Variabel berawalan `NEXT_PUBLIC_` terekspos ke browser.

#### 1. Wajib

| Variabel | Penjelasan |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL API Gateway yang diakses browser. Misal `http://localhost:8080`. |
| `NEXT_PUBLIC_WS_API_URL` | URL WebSocket gateway. Misal `ws://localhost:8080`. Juga jadi dasar base URL REST chat bila `NEXT_PUBLIC_MESSAGE_API_URL` tidak diisi. |
| `NEXT_PUBLIC_APP_URL` | Base URL publik frontend. Dipakai untuk redirect absolut pada callback OAuth. |
| `JWT_PUBLIC_KEY` | Public key PEM RS256 milik `auth-service`. Dipakai `jwtVerify` di route handler `/api/auth/*`. Bila kosong, token hanya di-decode **tanpa verifikasi tanda tangan**. |

#### 2. Opsional

| Variabel | Default | Penjelasan |
|---|---|---|
| `SERVER_API_URL` | `NEXT_PUBLIC_API_URL`, lalu `http://localhost:8000` | Base URL untuk fetch **server-side** (route handler `/api/auth/*` dan `oauth-callback`). |
| `NEXT_PUBLIC_MESSAGE_API_URL` | diturunkan dari `NEXT_PUBLIC_WS_API_URL` (`ws://` → `http://`), lalu `http://localhost:8001` | Override base URL REST chat pada instance axios `messageBackend`. |
| `BETTER_AUTH_URL` | `http://localhost:3000` | `baseURL` untuk `createAuthClient`. |
| `GOLANG_GRPC_URL` | `localhost:50052` | Hanya dipakai modul `product-category` / `product-plan` yang sudah mati — digantikan `account-type` / `subscription-plan` yang memakai REST lewat gateway. `main-service` tidak meregistrasi service gRPC apa pun di port tersebut. |

#### 3. Variabel yang tidak dibaca kode

`DATABASE_URL` dan `BETTER_AUTH_SECRET` masih diset di `docker-compose.dev.yml` / `docker-compose.prod.yml`, tetapi tidak dibaca oleh kode frontend mana pun. Frontend tidak terhubung langsung ke database; seluruh akses data lewat API Gateway. Variabel OAuth (`GITHUB_CLIENT_ID`, `GOOGLE_CLIENT_ID`, dan pasangan secret-nya) juga bukan milik frontend — tempatnya di `auth-service/.env`.
