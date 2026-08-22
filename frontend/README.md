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
  Aplikasi akan menggunakan akses `localhost` untuk terhubung ke database dan microservices lainnya.
- **Di Dalam Docker:**
  Container Docker secara otomatis memiliki konfigurasi `extra_hosts` agar alamat `host.docker.internal` me-resolve ke mesin host kamu. Ini mencegah isu _connection refused_ seperti saat login dengan Google (OAuth server side fetch).

### Daftar Environment Variables yang Wajib Diisi

Pastikan kamu memiliki file `.env.development` (untuk lokal) dan `.env.production` (untuk production). Berikut penjelasan nilai variabel di dalamnya:

#### 1. Konfigurasi Auth (Better Auth & OAuth)

| Variabel               | Penjelasan                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`   | Secret key (string acak/base64) untuk mengamankan session enkripsi auth.                      |
| `BETTER_AUTH_URL`      | URL aplikasi frontend (misal: `http://localhost:3000`).                                       |
| `GITHUB_CLIENT_ID`     | Client ID dari aplikasi GitHub OAuth.                                                         |
| `GITHUB_CLIENT_SECRET` | Client Secret dari aplikasi GitHub OAuth.                                                     |
| `JWT_PUBLIC_KEY`       | Public key (format PEM RS256) untuk validasi token yang digenerate oleh layanan backend Rust. |

#### 2. Endpoints Backend Microservices

Variabel dengan awalan `NEXT_PUBLIC_` terekspos ke browser (client-side).
| Variabel | Penjelasan |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Base URL public dari frontend (misal: `http://localhost:3000`). Digunakan untuk callback & redirect absolut. |
| `NEXT_PUBLIC_API_URL` | URL backend Auth & Message (Rust). Misal: `http://localhost:8000`. |
| `NEXT_PUBLIC_WS_API_URL` | URL Web Socket (Rust). Misal: `ws://localhost:8001`. |
| `NEXT_PUBLIC_GOLANG_API`| URL backend Product (Golang). Misal: `http://localhost:8002`. |

#### 3. Database & Payment Gateway

| Variabel       | Penjelasan                                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` | Connection string ke database PostgreSQL. Di Docker env, nilainya akan di-override otomatis menjadi `host.docker.internal`. |
