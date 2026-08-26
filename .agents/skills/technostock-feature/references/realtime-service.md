# Resep: `realtime-service` (chat) — ⏸️ ON-HOLD

**Pengembangan fitur chat sedang on-hold.** Fokus repo saat ini adalah user +
subscription. Baca dulu `docs/operations.md → Status Pengembangan` sebelum
mengerjakan apa pun di sini, dan konfirmasi ke user bahwa pekerjaan ini memang
diinginkan.

Dua keputusan arsitektur yang sudah diambil dan mempengaruhi cara menulis kode
di sini:

1. **Lapisan event akan pindah dari RabbitMQ ke Kafka.** Jangan menambah
   producer atau consumer RabbitMQ baru.
2. **RabbitMQ akan dipakai `notification-service`** yang belum dibuat. Worker
   `notification_worker.rs` yang ada sekarang **bukan** cikal bakalnya — ia
   hanya placeholder.

## Fakta struktural

- `realtime-service` **tidak memakai `shared-core`**. Ia menduplikasi `User`,
  `Role`, `UserStatus`, `AppError`, `JwtService`, `Database`. Versi `User`-nya
  **tidak punya** `discord_username`.
- Service ini **tidak pernah** query tabel user — selalu lewat gRPC
  `GetUsers` / `UpdateLastRead` ke `grpc-service:50051`.
- Dead code: `src/api.rs` dan `src/mod.rs` **tidak pernah di-compile** (sisa
  copy-paste dari auth-service, merujuk modul yang tidak ada). Router aktif:
  `src/routes/api.rs`.
- Port `0.0.0.0:8001` hard-coded di `main.rs`.
- `/api/v1/chat/*` **belum ter-route di gateway** — lihat
  `docs/operations.md → Isu 1`.

## Router aktif

`src/routes/api.rs`, di-nest di `/api/v1`:

| Method | Path | Handler |
|---|---|---|
| GET | `/chat/history` | `get_chat_history` |
| POST | `/chat/upload` | `upload_image` |
| GET | `/chat/unread-count` | `get_unread_count` |
| POST | `/chat/read` | `mark_as_read` |
| GET | `/chat/ws` | `chat_ws_handler` |

## Menambah handler HTTP

Pola sama dengan auth-service, dengan tiga perbedaan:

```rust
pub async fn my_handler(
    State(state): State<AppState>,
    auth_user: AuthUser,          // extractor lokal: infrastructure/auth/middleware.rs
) -> Result<impl IntoResponse, AppError> {
    let user_id = auth_user.claims.claims.sub;
    // ...
    Ok(crate::utils::response::success_response_one(data))
}
```

- `AppError` diimpor dari `crate::infrastructure::errors` (bukan `shared_core`).
- Error repository perlu dipetakan **manual**:
  `.map_err(|_| AppError::InternalServerError)?` — `MessageRepositoryError`
  tidak punya `From`/`IntoResponse`, jadi `Unauthorized`/`NotFound` dari repo
  hilang jadi 500 bila tidak ditangani sendiri.
- Trait `MessageRepository` wajib di-`use` agar method-nya terlihat
  (`AppState` menyimpan struct konkret, bukan `dyn`).
- Daftarkan route di `src/routes/api.rs`.

## Menambah event WebSocket

Dua enum, **tag-nya asimetris** — ini konvensi yang harus diikuti:

```rust
// Masuk (client → server) — handlers/chat.rs
#[serde(tag = "event_type")]           // tag: "event_type"
pub enum IncomingMessage {
    #[serde(rename = "message")] Message { ... },   // nilai lowercase
    #[serde(rename = "typing")]  Typing,
    ...
}

// Keluar (server → client) — infrastructure/websocket/broadcaster.rs
#[serde(tag = "type")]                 // tag: "type"
pub enum ServerMessage {
    NewMessage(MessageWithSender),      // nilai PascalCase apa adanya
    UserTyping { user_id: Uuid, user_name: String },
    ...
}
```

Menambah event:
1. Varian di `IncomingMessage` (+ `#[serde(rename = "...")]` lowercase).
2. Arm `match payload` di `handle_socket`.
3. Varian di `ServerMessage` bila server perlu membalas.
4. Update tipe di frontend: `src/app/maintainer/discussion/types/chat.ts` dan
   handler di `_queries/chat-websocket.ts`.

**Fan-out wajib lewat Redis, bukan broadcaster langsung:**

```rust
let server_msg = ServerMessage::Xxx { ... };
let json = serde_json::to_string(&server_msg).unwrap();
state.redis_service.publish_message(&group_id, &json).await;
```

Broadcaster in-memory **tidak pernah** di-`send` dari handler — satu-satunya
penulisnya adalah task `psubscribe("chat:group:*")` di `main.rs`. Melewati Redis
akan memecah multi-instance.

## Repository & sqlx

`src/infrastructure/repositories/postgres_message_repository.rs`.

Service ini **satu-satunya** yang memakai makro compile-time
`sqlx::query!`/`query_as!`.

> **Wajib:** setiap kali menambah atau mengubah makro tersebut, jalankan
> `cargo sqlx prepare` dan **commit** file `realtime-service/.sqlx/query-*.json`
> yang baru. `Dockerfile.unified.prod` memakai `SQLX_OFFLINE=true`, jadi build
> prod pecah kalau cache-nya basi. Perintah ini tidak ada di Makefile mana pun.

Pola yang ada:
- Tabel selalu berprefix `message.`.
- Otorisasi lewat SQL: `WHERE id = $1 AND sender_id = $2`, lalu bila 0 baris,
  probe `SELECT id FROM message.messages WHERE id = $1` untuk membedakan
  `Unauthorized` dari `NotFound`.
- Toggle reaksi = DELETE dulu, INSERT bila `rows_affected() == 0`. Tanpa
  transaksi.
- Anotasi nullability: `COUNT(user_id) as "count!"`, `array_agg(user_id) as "user_ids!"`.
- `get_recent_history` mengambil DESC lalu `.reverse()` di Rust.

## WebSocket & autentikasi

`chat_ws_handler` **tidak** memakai extractor `AuthUser` — browser tidak bisa
mengirim header `Authorization` pada constructor `WebSocket`. Token dibaca dari
query param dan diverifikasi manual:

```rust
let token = params.get("token").ok_or(AppError::InvalidToken)?;
let group_id = params.get("group_id").cloned().unwrap_or_else(|| "general".to_string());
let claims = state.jwt_service.verify_token(token).map_err(|_| AppError::InvalidToken)?;
```

> Handler ini **tidak** mengecek `token_type == "access"` (berbeda dari
> extractor `AuthUser`). Bila menambah handler WS baru, tambahkan cek itu.

## State non-relasional

| Sistem | Key/objek | Catatan |
|---|---|---|
| Redis | `chat:group:{id}` (pub/sub), `group:{id}` (SET online), `typing:group:{id}:{user}` (TTL 5s) | Key `typing:*` ditulis tapi **tidak pernah dibaca** |
| RabbitMQ | Exchange `chat.events` (topic, durable), 3 queue durable ke routing key `chat.message.created` | **Jangan tambah** — akan pindah ke Kafka |
| MinIO | `chat-images/{uuid}.{ext}`, maks 10 MiB | URL dirakit manual dari `MINIO_ENDPOINT` — lihat isu R6 di `docs/PRD.md` |

Hanya event `message` yang dipublish ke RabbitMQ. `edit`, `delete`, `react`,
`typing` **tidak**.

## Worker

`workers/{notification,analytics,moderation}_worker.rs` — ketiganya **placeholder**:
`tracing::info!` + `tokio::time::sleep` + `ack`. Tidak menyentuh DB, Redis, gRPC,
FCM, atau AI. Berjalan di dalam proses `realtime-service`, bukan container
terpisah.

Jangan memperlakukan mereka sebagai implementasi yang berfungsi, dan jangan
membangun fitur di atasnya sebelum keputusan Kafka dieksekusi.

## Verifikasi

```bash
cd realtime-service && cargo check
```

Butuh `DATABASE_URL` hidup saat compile bila `SQLX_OFFLINE` tidak diset —
makro `query!` menembak Postgres saat compile. Alternatif:
`SQLX_OFFLINE=true cargo check` (memakai `.sqlx/`).
