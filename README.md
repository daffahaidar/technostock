# AngelTrade

Monorepo microservices: satu frontend Next.js, satu API Gateway yang sekaligus
menjadi server gRPC, dan tiga backend service.

**Fokus pengembangan saat ini: manajemen user dan subscription.**
`realtime-service` (forum chat) sudah ada di repo dan bisa dijalankan, tetapi
pengembangannya **on-hold** — lihat
[docs/operations.md → Status Pengembangan](docs/operations.md#status-pengembangan).

| Service | Stack | Port | Tanggung jawab |
|---|---|---|---|
| `frontend` | Next.js 16, React 19, Tailwind 4 | 3000 | UI + BFF auth (cookie session) |
| `grpc-service` | Rust, Axum, tonic | 8080, 50051 | Reverse proxy HTTP/WS **dan** server gRPC `UserService` |
| `auth-service` | Rust, Axum, sqlx | 8000 | Sign-up/in/refresh, OAuth GitHub & Google, CRUD user |
| `realtime-service` | Rust, Axum, sqlx | 8001 | Chat WebSocket, Redis pub/sub, worker RabbitMQ, upload MinIO — **on-hold** |
| `main-service` | Go, Fiber v3, GORM | 8002 | Account type, subscription plan, voucher, member, Midtrans |
| `shared-core` | Rust library crate | — | `User` entity, `JwtService`, pool Postgres, repository user |

Infrastruktur: PostgreSQL 17, Redis 7, RabbitMQ 3, MinIO, Kafka 3.9.
Kafka disiapkan untuk `realtime-service` (menggantikan RabbitMQ), dan RabbitMQ
akan dialihkan ke `notification-service` yang belum dibuat.

## Cara cepat

```bash
git clone https://github.com/daffahaidar/angeltrade.git
cd angeltrade
# siapkan .env tiap service — lihat docs/setup.md
make dev
```

Frontend di http://localhost:3000, API Gateway di http://localhost:8080.

## Dokumentasi

Seluruh dokumentasi ada di [`docs/`](docs/):

| Dokumen | Isi |
|---|---|
| [docs/PRD.md](docs/PRD.md) | Produk, persona, requirement per fitur + statusnya, risiko |
| [docs/setup.md](docs/setup.md) | Instalasi & cara menjalankan, per sistem operasi |
| [docs/architecture.md](docs/architecture.md) | Peta service, routing gateway, autentikasi, role |
| [docs/environment.md](docs/environment.md) | Environment variable per service |
| [docs/api.md](docs/api.md) | Endpoint HTTP, WebSocket, gRPC, dan BFF frontend |
| [docs/database.md](docs/database.md) | Skema PostgreSQL, migrasi, Redis/RabbitMQ/MinIO |
| [docs/operations.md](docs/operations.md) | Makefile, deploy, isu yang diketahui, troubleshooting |

Bekerja dengan AI coding agent (Claude Code, Codex, Antigravity, Cursor,
Copilot)? Mulai dari [AGENTS.md](AGENTS.md).
