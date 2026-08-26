# Referensi API

Semua path di bawah diturunkan langsung dari file router masing-masing service.
Browser sebaiknya mengakses lewat gateway `:8080`; port service adalah detail
internal.

Ringkasan pemetaan gateway ada di
[architecture.md → Alur Request HTTP](architecture.md#alur-request-http).

## Bentuk Response

**Service Rust** (`auth-service`, `realtime-service`) memakai envelope dari
[`utils/response.rs`](../auth-service/src/utils/response.rs):

```json
{
  "meta": { "status": "Success", "message": "Success Retrieve All Data" },
  "results": {}
}
```

**main-service (Go)** tidak memakai envelope seragam. Bergantung handler-nya,
response berupa `{"results": ...}`, `{"data": ...}`, `{"message": "..."}`, atau
`{"error": "..."}`. Kolom mana yang dipakai dicatat per endpoint di bawah.

---

## auth-service — `:8000`

Router: [`auth-service/src/routes/api.rs`](../auth-service/src/routes/api.rs),
di-nest di bawah `/api/v1`. Via gateway pathnya sama persis.

| Method | Path | Keterangan |
|---|---|---|
| POST | `/api/v1/auth/sign-up` | Registrasi email/password |
| POST | `/api/v1/auth/sign-in` | Mengembalikan `access_token`, `refresh_token`, `token_type`, `expires_in` |
| POST | `/api/v1/auth/refresh` | Body: `{ "refresh_token": "..." }` |
| GET | `/api/v1/auth/github` | Redirect ke halaman otorisasi GitHub |
| GET | `/api/v1/auth/github/callback` | Query: `code` |
| GET | `/api/v1/auth/google` | Redirect ke halaman otorisasi Google |
| GET | `/api/v1/auth/google/callback` | Query: `code` |
| GET | `/api/v1/users` | List user |
| POST | `/api/v1/users` | Buat user |
| PUT | `/api/v1/users/{id}` | Update user |
| DELETE | `/api/v1/users/{id}` | Hapus user |
| PATCH | `/api/v1/users/{id}/status` | Ubah status `Active` / `Suspended` |

Contoh `results` dari `sign-in`:

```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 900
}
```

Redirect URI OAuth menunjuk ke **frontend**, bukan ke auth-service — frontend
menerima `code`, menukarnya ke `/api/v1/auth/{provider}/callback`, lalu men-set
cookie. Lihat [setup.md → Setup OAuth](setup.md#setup-oauth).

---

## realtime-service — `:8001`

> **Status: on-hold.** Endpoint di bawah sudah berjalan dan bisa dites, tetapi
> fitur chat tidak sedang dikembangkan dan kontraknya belum final. Lihat
> [operations.md → Status Pengembangan](operations.md#status-pengembangan).

Router: [`realtime-service/src/routes/api.rs`](../realtime-service/src/routes/api.rs),
di-nest di bawah `/api/v1`. Semua endpoint butuh JWT.

| Method | Path | Keterangan |
|---|---|---|
| GET | `/api/v1/chat/history` | Query: `cursor` (UUID pesan), `limit` (default `20`) |
| POST | `/api/v1/chat/upload` | Multipart field `file`, maks **10 MiB**, disimpan ke MinIO |
| GET | `/api/v1/chat/unread-count` | `{ "count": n }` berdasarkan `users.last_read_at` |
| POST | `/api/v1/chat/read` | Set `last_read_at = NOW()` via gRPC `UpdateLastRead` |
| GET | `/api/v1/chat/ws` | Upgrade WebSocket. Query: `token` (wajib), `group_id` (default `general`) |

> Endpoint ini **belum ter-route di gateway** — lihat
> [operations.md → Isu yang Diketahui](operations.md#1-endpoint-chat-belum-ter-route-di-gateway).

Pagination `history` berbasis cursor: kirim `id` pesan **paling awal** dari
halaman sebelumnya sebagai `cursor` untuk mengambil pesan yang lebih lama.

### Event WebSocket dari client

Tagged union pada field `event_type`
([`handlers/chat.rs`](../realtime-service/src/handlers/chat.rs)):

| `event_type` | Field tambahan |
|---|---|
| `message` | `content`, `reply_to_id` (opsional), `image_url` (opsional) |
| `typing` | — |
| `react` | `message_id`, `emoji` |
| `edit` | `message_id`, `content` |
| `delete` | `message_id` |

```json
{ "event_type": "message", "content": "halo", "reply_to_id": null, "image_url": null }
```

### Event WebSocket dari server

Tagged union pada field `type`
([`broadcaster.rs`](../realtime-service/src/infrastructure/websocket/broadcaster.rs)):

| `type` | Payload |
|---|---|
| `NewMessage` | Objek pesan lengkap dengan data pengirim & reaksi |
| `MessageEdited` | Objek pesan yang sama, `is_edited = true` |
| `MessageDeleted` | `message_id` |
| `ReactionUpdate` | `message_id`, `reactions[]` |
| `UserTyping` | `user_id`, `user_name` |
| `OnlineUsersCount` | `count` |

`edit` dan `delete` hanya berlaku untuk pesan milik user sendiri — repository
memfilter dengan `sender_id`.

---

## main-service — `:8002`

Router: [`main-service/routes/subscription_routes.go`](../main-service/routes/subscription_routes.go).
Semua path di bawah relatif terhadap `/api/v1`; **via gateway pakai prefix
`/api/v1/main`** (contoh: `/api/v1/main/account-types`).

Peran `adminRole` = `Admin`, `SuperAdmin`, atau `Maintainer`.

### Account type

| Method | Path | Akses | Response |
|---|---|---|---|
| GET | `/account-types` | login | `results` |
| POST | `/account-types` | adminRole | `results` |
| PATCH | `/account-types/:id` | adminRole | `results` |
| DELETE | `/account-types/:id` | adminRole | `message` |

`GET` menyertakan field turunan `user_count` — subquery
`COUNT(DISTINCT user_id)` atas langganan berstatus `Active` pada account type
tersebut. `PATCH` dengan `is_recommended: true` otomatis mematikan flag yang
sama pada account type lain (hanya satu yang bisa "recommended").

### Subscription plan

| Method | Path | Akses |
|---|---|---|
| GET | `/subscription-plans` | login |
| GET | `/subscription-plans/account-type/:accountTypeId` | login |
| POST | `/subscription-plans` | adminRole |
| PATCH | `/subscription-plans/:id` | adminRole |
| DELETE | `/subscription-plans/:id` | adminRole |

`duration_months = 0` berarti **lifetime**. Hanya boleh ada satu plan lifetime
per account type — ditegakkan partial unique index `idx_unique_lifetime_plan`
yang dibuat di [`cmd/api/main.go`](../main-service/cmd/api/main.go).

### Voucher

| Method | Path | Akses |
|---|---|---|
| GET | `/vouchers` | adminRole |
| GET | `/vouchers/:id` | adminRole |
| POST | `/vouchers` | adminRole |
| DELETE | `/vouchers/:id` | adminRole (soft delete) |

Body `POST /vouchers`:

```json
{
  "code": "HEMAT50",
  "discount_percentage": 50,
  "max_discount_amount": 100000,
  "expires_at": "2026-12-31T23:59:59Z",
  "quota": 100
}
```

`quota: null` berarti tanpa batas. Tidak ada endpoint update voucher —
`VoucherUseCase.UpdateVoucher` ada di kode tetapi belum di-route.

### Public (tanpa autentikasi)

| Method | Path | Keterangan |
|---|---|---|
| GET | `/public/account-types` | Dipakai landing page & halaman pricing |
| GET | `/public/subscription-plans` | |
| GET | `/public/subscription-plans/:id` | |
| GET | `/public/vouchers/check/:code` | Validasi kode: cek ada, belum kedaluwarsa, kuota tersisa |
| POST | `/public/subscription/midtrans-webhook` | Webhook Midtrans |

Webhook membaca `order_id` dari body, mengonfirmasi status langsung ke Midtrans
Core API (`CheckTransaction`), lalu mencocokkan baris berdasarkan `external_id`.
Payload yang tidak dikenali dibalas **200 OK** agar Midtrans tidak retry —
termasuk "Test notification" dari dashboard.

### Subscription milik user

| Method | Path | Akses | Keterangan |
|---|---|---|---|
| POST | `/subscriptions/subscribe` | login | Aktifkan langganan **tanpa pembayaran** dan naikkan role ke `Member` |
| POST | `/subscriptions/buy` | login | Checkout Midtrans Snap |
| GET | `/subscriptions/my-active` | login | `{"data": ...}`, `data: null` bila tidak ada |
| POST | `/subscriptions/transactions/:order_id/sync` | login | Paksa sinkronisasi status ke Midtrans, dipakai halaman `/checkout/status` |

Body `subscribe` dan `buy` memakai struct yang sama:

```json
{
  "plan_id": "uuid",
  "discord_username": "user#1234",
  "return_url": "http://localhost:3000/checkout/status",
  "voucher_code": "HEMAT50"
}
```

Response `buy`: `{ "token": "<snap-token>", "redirect_url": "<snap-url>" }`.

Perilaku `buy` ([`user_subscription_usecase.go`](../main-service/usecases/user_subscription_usecase.go)):

- **Idempoten** — bila sudah ada transaksi `pending` untuk kombinasi
  user + plan yang sama, token lama dikembalikan tanpa memakan kuota lagi.
- **Proteksi beli ganda** — ditolak bila user sudah punya langganan lifetime
  aktif untuk account type tersebut.
- **Reservasi kuota atomik** — `used_quota` plan dan voucher dinaikkan lewat
  `UPDATE ... WHERE used_quota < quota`; gagal berarti kuota habis.
- **Diskon** — `price × discount_percentage / 100`, dibatasi
  `max_discount_amount`.
- **Harga akhir 0** — tidak memanggil Midtrans; transaksi langsung
  `settlement` dan langganan diaktifkan.
- Transaksi Snap kedaluwarsa dalam **1 jam**; Midtrans dipanggil di mode
  **Sandbox** (di-hardcode).

Aktivasi langganan menumpuk bila account type-nya sama: `end_date` lama
ditambah durasi plan baru. Bila account type berbeda, langganan lama menjadi
`Cancelled` dan dibuat baris baru.

### Manajemen member (admin)

| Method | Path | Akses |
|---|---|---|
| GET | `/admin/members` | adminRole |
| POST | `/admin/members/:id/promote` | adminRole |
| POST | `/admin/members/:id/extend` | adminRole |
| POST | `/admin/members/:id/revoke` | adminRole |

`GET` menggabungkan data user dari gRPC `GetAllUsers` (mengecualikan role
`Admin` dan `Maintainer`) dengan langganan aktif di database. `promote` dan
`extend` menerima `{ "plan_id": "uuid", "discord_username": "..." }`.

---

## gRPC `UserService` — `grpc-service:50051`

Kontrak: [`proto/user.proto`](../proto/user.proto). Implementasi:
[`grpc-service/src/server/user_service_impl.rs`](../grpc-service/src/server/user_service_impl.rs).

| RPC | Request | Response | Dipakai oleh |
|---|---|---|---|
| `GetUsers` | `user_ids[]` | `map<string, User>` | `realtime-service` (enrich pengirim pesan) |
| `GetAllUsers` | `exclude_roles[]` | `map<string, User>` | `main-service` (daftar member) |
| `UpdateLastRead` | `user_id` | `Empty` | `realtime-service` (`POST /chat/read`) |
| `ValidateToken` | `token` | `is_valid`, `user_id`, `role`, `error_message` | `main-service` (middleware auth) |
| `UpdateUserRole` | `user_id`, `role` | `Empty` | `main-service` (settle & expiry) |
| `UpdateDiscordUsername` | `user_id`, `discord_username` | `Empty` | `main-service` (setelah checkout) |

Pesan `User`: `id`, `name`, `role`, `avatar_url?`, `last_read_at?` (Unix
timestamp), `discord_username?`, `email`, `status`.

> `role` dan `status` dikirim sebagai string hasil `format!("{:?}", ...)` Rust.
> `main-service` menghapus tanda kutip yang mungkin ikut terbawa sebelum
> membandingkan role ([`middleware/auth.go`](../main-service/infrastructure/middleware/auth.go)).

---

## Frontend BFF — `:3000`

[`frontend/src/app/api/auth/[...all]/route.ts`](../frontend/src/app/api/auth/%5B...all%5D/route.ts)
dan [`oauth-callback/route.ts`](../frontend/src/app/api/auth/oauth-callback/route.ts).

| Method | Path | Keterangan |
|---|---|---|
| POST | `/api/auth/sign-in/email` | Proxy ke `auth-service`, set cookie `access_token` + `refresh_token` |
| POST | `/api/auth/sign-out` | Hapus kedua cookie |
| GET | `/api/auth/get-session` | Verifikasi token; bila kedaluwarsa, refresh otomatis dan tulis ulang cookie |
| GET | `/api/auth/oauth-callback?provider=&code=` | Tukar `code` ke auth-service, set cookie, redirect ke `oauth_callback_url` atau dashboard sesuai role |

Cookie: `httpOnly`, `sameSite=lax`, `path=/`, `secure` hanya di production.
`access_token` memakai `maxAge = expires_in`; `refresh_token` 7 hari.
Path selain di atas dibalas 404.
