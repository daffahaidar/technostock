---
name: angeltrade-ops
description: Menjalankan, membangun, men-deploy, dan mendiagnosis repo AngelTrade — Makefile dan compose Docker/Podman (dev, prod, hub), 14 Dockerfile dan kapan varian unified dipakai, env per service, push/pull image ke Docker Hub, serta troubleshooting gejala umum (gagal connect gRPC, panic OAuth, OOM saat build Go, migrasi sqlx gagal, chat tidak ter-route). Gunakan saat diminta menjalankan atau membangun project, mengubah compose/Dockerfile/env, men-deploy, atau saat sebuah service gagal start atau error saat runtime.
---

# Operasional AngelTrade

Prasyarat: skill `angeltrade-overview`. Referensi lengkap:
`docs/setup.md`, `docs/operations.md`, `docs/environment.md`.

## Menjalankan

```bash
make dev              # semua service + infra, foreground, hot-reload
make dev-d            # background
make down-dev         # stop
make down-dev-volumes # stop + hapus semua volume (RESET DATA)
make logs-dev
make ps-dev
make validate         # cek syntax ketiga compose root
make help
```

Engine default: **podman di Windows, docker di macOS/Linux** (dipilih dari
`$(OS)` di Makefile, bukan auto-detect). Override: `make dev ENGINE=docker`,
`make docker:dev`, `make podman:dev`.

Set prod identik polanya: `prod`, `prod-d`, `down-prod`, `down-prod-volumes`,
`logs-prod`, `ps-prod`.

### Tanpa Docker

Urutan penting — `grpc-service` harus jalan **lebih dulu** (menyediakan gRPC
`:50051`):

```bash
cd grpc-service     && cargo run   # :8080 + :50051
cd auth-service     && cargo run   # :8000
cd main-service     && go run ./cmd/api/main.go   # :8002
cd frontend         && npm run dev # :3000
cd realtime-service && cargo run   # :8001 (opsional, chat on-hold)
```

Infra bisa dijalankan per komponen dari `tools/{postgres,redis,rabbitmq,minio,kafka}/`.
Untuk kerja user+subscription cukup `postgres`.

### Makefile per service

`auth-service`, `grpc-service`, `realtime-service`, `main-service` punya target
seragam: `dev, start, build, build-dev, test, test-verbose, fmt, check, clean,
help` (+ `migrate` bila punya migrations). **Tidak ada** Makefile di `frontend/`
maupun `shared-core/`, dan **tidak ada** target lint/clippy di mana pun.

> `make test` berjalan di atas **nol test case** — repo ini tidak punya test.
> `make migrate` sudah memakai `--ignore-missing` (wajib karena
> `_sqlx_migrations` dipakai bersama auth-service & realtime-service).

## Verifikasi perubahan

| Stack | Perintah |
|---|---|
| Rust | `cd <service> && cargo check` — clippy tidak dikonfigurasi |
| Go | `cd main-service && go vet ./... && go build ./...` |
| Frontend | `cd frontend && npx tsc --noEmit && npm run lint` |
| Compose | `make validate` |

## Peta compose & Dockerfile

| Compose | Fungsi |
|---|---|
| `docker-compose.dev.yml` | Dev. Semua service + infra + Kafka. Source di-mount, hot-reload |
| `docker-compose.prod.yml` | Prod, build lokal dari `Dockerfile.*.prod`. Tanpa Kafka |
| `docker-compose.hub.yml` | Deploy di server dari image Docker Hub, tanpa build. Tanpa Kafka |
| `tools/*/docker-compose.yml` | Satu komponen infra saja, untuk mode manual |
| `<service>/docker-compose.*.yml` | **Peninggalan** mode "infra di host" (`host.docker.internal`) |

### Varian Dockerfile

| Aspek | `Dockerfile.dev` / `.prod` | `Dockerfile.unified.*` |
|---|---|---|
| Build context | folder service | **root repo** (`context: .`) |
| Akses `proto/` & `shared-core/` | tidak bisa | bisa |
| Source di image (dev) | `COPY . .` | tidak ada COPY — semua via volume |
| Migrasi di dev | tidak | `sqlx migrate run --ignore-missing` di CMD |
| Watcher | `cargo watch -c -x run` | `cargo watch --poll -c -x run` |
| Runner prod | `debian:bookworm-slim` | `ubuntu:24.04` |
| Dipakai oleh | compose per-service | **compose root** |

**Aturan:** service Rust yang butuh `proto/` atau `shared-core/` **wajib**
varian unified + `context: .`. Go dan Next.js cukup varian biasa dengan
`context: ./<service>`.

> `auth-service/docker-compose.*.yml` dan `realtime-service/docker-compose.*.yml`
> **gagal build** — context-nya terlalu sempit untuk `../shared-core` dan
> `../proto`. Pakai compose root. `main-service/` dan `frontend/` per-service
> masih berfungsi.

Satu-satunya image dengan non-root user: `frontend/Dockerfile.prod`
(`nextjs:nodejs`, uid 1001). Sisanya root.

## Environment

Enam file `.env` terpisah — template ada di `.env.example`, tabel lengkap di
`docs/environment.md`.

Yang membuat service **gagal start** bila kosong:

| Service | Wajib |
|---|---|
| `auth-service` | `DATABASE_URL`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, **keenam** var OAuth |
| `grpc-service` | `DATABASE_URL`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY` |
| `realtime-service` | `DATABASE_URL`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET` |
| `main-service` | `DATABASE_URL`, `AUTH_GRPC_URL`, `MIDTRANS_SERVER_KEY` |

Yang sering salah:
- `AUTH_GRPC_URL` harus `grpc-service:50051` — **bukan** `auth-service`. Di Go
  **tanpa** skema `http://`; di Rust **dengan** `http://`.
- `FRONTEND_URL` harus `http://frontend:3000` di dalam container (default
  `localhost` menunjuk ke gateway sendiri). Sudah di-set di compose root.
- `JWT_PUBLIC_KEY` harus **identik** di auth, grpc, realtime, dan frontend.
  Format satu baris dengan `\n` ter-escape; semua service melakukan
  `.replace("\\n", "\n")`.
- Server-side memakai nama service internal; `NEXT_PUBLIC_*` tetap `localhost`
  karena diakses browser.
- Postgres: host `:5433`, internal `:5432`.

Menambah env baru → `.env` service + blok `environment:` di
`docker-compose.dev.yml` & `.prod.yml` + `.env.example` + `docs/environment.md`.

## Deploy via Docker Hub

Image: `daffahaidarnz/angeltrade:<service>-<VERSION>`, default `latest`.

```bash
# dari mesin developer
make push                  # build & push semua
make push VERSION=1.0.0
make push-auth             # atau push-grpc / push-realtime / push-main / push-frontend

# dari server
make pull
make deploy                # docker-compose.hub.yml, detached
make deploy-update         # pull terbaru + restart
make logs-deploy
make deploy-down
```

Sebelum deploy: siapkan `.env` tiap service di server dan **ganti seluruh
kredensial infrastruktur** — password Postgres/Redis/RabbitMQ/MinIO/Kafka
di-hardcode di file compose untuk dev.

Perbedaan `hub.yml` yang perlu diketahui: port gateway `8080` **tidak
dipublish** (hanya `50051`), dan `grpc-service` hanya menerima `DATABASE_URL`
dari compose — sisanya harus datang dari `./grpc-service/.env`.

## Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| `realtime-service` panic `Failed to connect to GRPC` | `grpc-service` belum jalan, atau `AUTH_GRPC_URL` salah. Harus `grpc-service:50051` |
| `main-service` selalu 500 "Failed to validate token via gRPC" | Sama seperti di atas; di Go URL-nya **tanpa** `http://` |
| `auth-service` panic saat start walau tidak pakai OAuth | Keenam var OAuth wajib diisi — isi nilai dummy |
| Gateway membalas request non-API dengan error/loop | `FRONTEND_URL` belum `http://frontend:3000` |
| `main-service` dev: `compile: signal: killed` → `/app/tmp/main: not found` | `mem_limit` terlalu kecil; compiler Go butuh ~600MB. Compose dev sudah menaikkan ke 1G |
| Container Rust OOM saat `cargo watch` | Beri RAM lebih ke VM: `podman machine set --memory 8192` |
| Login sukses lalu langsung balik ke sign-in | `JWT_PUBLIC_KEY` frontend tidak cocok dengan auth-service |
| Migrasi sqlx gagal `VersionMissing` | Sudah ditangani `ignore_missing`. Bila muncul, pastikan memakai `sqlx migrate run --ignore-missing`, bukan `make migrate` |
| Migrasi gagal karena checksum | Isi file migrasi yang sudah ter-apply diubah. Kembalikan isinya atau `make down-dev-volumes` |
| Build prod `realtime-service` gagal di makro sqlx | `.sqlx/` basi. Jalankan `cargo sqlx prepare` dan commit hasilnya |
| Hot reload tidak jalan | Bind mount host→VM tidak meneruskan inotify. Sudah diakali `--poll` (cargo watch), `poll = true` (air), `CHOKIDAR_USEPOLLING` (Next). Pastikan tidak dimatikan |
| Podman Windows: `unknown file mode ?rw-rw-rw-` saat build | `.claude/`/`.agents/` berisi junction. Root `.dockerignore` sudah mengecualikannya — jangan hapus baris itu |
| `entrypoint.sh`: `bad interpreter: /bin/sh^M` | Checkout CRLF. `.gitattributes` sudah memaksa LF — periksa konfigurasi git lokal |
| Chat `/api/v1/chat/*` mengembalikan HTML frontend | Belum ter-route di gateway. Arahkan `NEXT_PUBLIC_WS_API_URL` / `NEXT_PUBLIC_MESSAGE_API_URL` langsung ke `:8001`. Lihat `docs/operations.md` Isu 1 |
| Gambar chat tidak muncul di browser | Set `MINIO_PUBLIC_URL` ke URL yang bisa dibuka browser (mis. `http://localhost:9000`) |

## Hal yang perlu diingat

- Kafka berjalan di compose dev tapi **belum dipakai kode mana pun** (~512 MB).
  Aman dimatikan selama chat on-hold.
- Healthcheck hanya ada di postgres, redis, rabbitmq. MinIO, Kafka, dan
  **semua service aplikasi** tidak punya.
- Tidak ada CI (`.github/` tidak ada) dan tidak ada test.
- Toolchain sebagian besar tidak dipin: `rust:latest`, `golang:alpine`,
  `node:lts-alpine`, `alpine:latest`, `quay.io/minio/minio` (tanpa tag). Yang
  dipin: `postgres:17-alpine`, `redis:7-alpine`, `rabbitmq:3-management`,
  `apache/kafka:3.9.0`, `cargo-watch 8.4.1`.
- `frontend/package.json` memakai `npm install`, bukan `npm ci`, meski
  `package-lock.json` ada.
