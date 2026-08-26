# PRD — Technostock

**Product Requirements Document.** Dokumen ini menyatukan *apa yang dibangun*,
*untuk siapa*, dan *sejauh mana sudah jadi*. Setiap klaim tentang status
diturunkan dari kode yang ada di repo, bukan dari rencana.

| | |
|---|---|
| Nama produk (user-facing) | **Technostock** — "Platform Edukasi Trading Saham" ([`frontend/src/app/layout.tsx`](../frontend/src/app/layout.tsx)) |
| Nama paket npm | `dimentorin` ([`frontend/package.json`](../frontend/package.json)) — sisa nama proyek lama, **jangan** dipakai di teks user |
| Nama repo | `technostock` |
| Domain di copy | `hello@technostock.id` ([`cta-section.tsx`](../frontend/src/app/%28root%29/_components/cta-section.tsx)) |
| Bahasa UI | Indonesia |
| Mata uang | IDR, `Intl.NumberFormat("id-ID")` |
| Status | Pre-launch. Fokus aktif: **manajemen user + subscription**. Chat on-hold. |

Dokumen pendamping: [architecture.md](architecture.md) (bagaimana sistem
bekerja), [api.md](api.md) (kontrak), [database.md](database.md) (data),
[setup.md](setup.md) (menjalankan), [operations.md](operations.md) (deploy &
isu). Panduan untuk AI agent: [`AGENTS.md`](../AGENTS.md) di root.

---

## 1. Ringkasan Produk

Technostock menjual **langganan berbayar ke komunitas edukasi trading saham**.
Yang benar-benar diproses sistem hari ini: *akses berbayar bertingkat (tipe akun
× durasi) yang, setelah lunas, menaikkan role user menjadi `Member` dan mencatat
Discord username untuk pemberian akses grup*.

Materi kelas, video, modul, kuis, dan sertifikat **dijanjikan di copy landing
page tetapi tidak punya entitas backend apa pun**. Katalog kelas di
[`product-showcase.tsx`](../frontend/src/app/%28root%29/_components/product-showcase.tsx)
adalah array statis, bukan data. Ini adalah gap produk terbesar, dicatat di
[§7 Gap](#7-gap-antara-janji-ui-dan-kode).

### Proposisi nilai menurut copy yang ada di kode

| Klaim | Sumber |
|---|---|
| "Edukasi Trading Saham #1 di Indonesia" | `hero-section.tsx` |
| "Kuasai Pasar Saham Bersama Ahli" | `hero-section.tsx` |
| Kurikulum terstruktur, mentor berpengalaman, komunitas eksklusif, live trading | `features-section.tsx` |
| Kelas pemula, analisa teknikal, mentoring privat | `services-section.tsx` |
| "Investasi Cerdas untuk Masa Depan Anda" | `pricing-section.tsx` |

> Angka `50.000+ Trader Terlatih` dan `90% Win Rate Analisa` di hero adalah
> array hard-coded, bukan metrik nyata. Perlakukan sebagai placeholder
> marketing.

### Identitas visual

Palet emas di atas hitam mewah, didefinisikan di
[`frontend/src/styles/globals.css`](../frontend/src/styles/globals.css):
`--color-gold-500 #D4AF37`, `--color-gold-400 #F3CA52`, `--color-gold-300
#F9E596`, `.bg-luxury-black #0a0a0a`, plus utility `.text-gradient-gold`,
`.bg-gradient-gold`, `.glass-card-gold`. Logo = SVG petir inline (tidak ada
file logo). Font `Geist` (next/font/google).

> Banyak komponen memakai hex mentah `#D4AF37` alih-alih token `gold-*`. Saat
> menambah UI, **pakai token**, jangan tambah hex baru.

---

## 2. Persona & Role

Role tersimpan di `users.users.role`. Enum Rust:
`Maintainer | Admin | Member | User`
([`shared-core/src/domain/entities/user.rs`](../shared-core/src/domain/entities/user.rs)).
DB CHECK juga mengizinkan `SuperAdmin`, tetapi enum Rust tidak punya varian itu
— lihat [§8 Risiko](#8-risiko-teknis-yang-mempengaruhi-produk).

| Persona | Role | Landing dashboard | Yang bisa dilakukan hari ini |
|---|---|---|---|
| **Pengunjung / calon pembeli** | `User` | `/` | Lihat landing + pricing, sign up, checkout, bayar |
| **Member berbayar** | `Member` | `/forum/dashboard` | Lihat sisa masa aktif langganan. Menu "Market News" ada tapi halamannya belum dibuat |
| **Admin bisnis** | `Admin` | `/admin/dashboard` | Kelola tipe akun, plan, voucher, dan member (promote/extend/revoke/ban) |
| **Maintainer / internal** | `Maintainer` | `/maintainer/dashboard` | Akses forum chat (satu-satunya role yang bisa), dashboard masih stub |

Proteksi route ada di [`frontend/src/proxy.ts`](../frontend/src/proxy.ts):
`/admin` → `Admin`; `/maintainer` → `Maintainer`; `/forum` → `Maintainer`,
`Admin`, `Member`; `/user` → semua yang login. Otorisasi backend Go memakai
`RequireRole("Admin", "SuperAdmin", "Maintainer")`.

> Admin dan Maintainer diperlakukan "sudah punya akses penuh" di UI pricing —
> mereka tidak perlu membeli.

---

## 3. Lingkup

### Di dalam lingkup (sudah berjalan)

| # | Kapabilitas | Service |
|---|---|---|
| F1 | Registrasi & login email/password | `auth-service` |
| F2 | Login OAuth GitHub & Google | `auth-service` |
| F3 | Sesi JWT RS256 di httpOnly cookie + auto-refresh | `frontend` BFF + `proxy.ts` |
| F4 | CRUD user & suspend/aktifkan | `auth-service` |
| F5 | Kelola tipe akun (tier) | `main-service` |
| F6 | Kelola paket langganan (durasi × harga × kuota) | `main-service` |
| F7 | Kelola voucher diskon | `main-service` |
| F8 | Checkout & pembayaran Midtrans Snap | `main-service` + `frontend` |
| F9 | Aktivasi langganan + promosi role otomatis | `main-service` via gRPC |
| F10 | Kedaluwarsa langganan & transaksi otomatis | `main-service` worker |
| F11 | Manajemen member oleh admin | `main-service` |
| F12 | Halaman pricing publik dinamis | `frontend` |

### Di dalam repo tapi on-hold

| # | Kapabilitas | Catatan |
|---|---|---|
| F13 | Forum chat realtime (WS, reply, edit, delete, reaksi, typing, online count, upload gambar) | Backend lengkap. UI hanya di `/maintainer/discussion`. Belum ter-route di gateway |

### Di luar lingkup saat ini (belum ada kode)

Kursus/video/modul/kuis/sertifikat · Market news · Halaman `/user/*` selain
profile · Form kontak fungsional · Integrasi Discord otomatis · Notifikasi ·
`notification-service` · Multi-group chat · Refund · Invoice PDF · Analytics.

---

## 4. Requirement Fungsional

Format: **ID · Requirement · Status · Bukti kode**.
Status: ✅ jalan · 🟡 sebagian · ⛔ belum ada · ⏸️ on-hold.

### 4.1 Autentikasi & Sesi

| ID | Requirement | Status | Bukti |
|---|---|---|---|
| F1.1 | User dapat mendaftar dengan nama, email, password (min 8 karakter), phone opsional | ✅ | `auth-service/src/handlers/auth.rs` |
| F1.2 | Password di-hash Argon2id sebelum disimpan | ✅ | `infrastructure/auth/password.rs` |
| F1.3 | Email harus unik; duplikat → HTTP 409 | ✅ | `postgres_user_repository.rs` (kode `23505`) |
| F1.4 | Sign-up **tidak** langsung login — user diarahkan ke halaman sign-in | 🟡 | `_components/sign-up.tsx`. Akibatnya `callbackUrl` ke checkout hilang di jalur sign-up |
| F2.1 | Login email/password menerbitkan access token (15 mnt) + refresh token (7 hari) | ✅ | `shared-core/src/infrastructure/auth/jwt.rs` |
| F2.2 | User berstatus `Suspended` ditolak login | ✅ | `usecases/auth.rs` `LoginUseCase` |
| F2.3 | User OAuth-only (tanpa password) ditolak login email | ✅ | `LoginUseCase` |
| F2.4 | Refresh token **tidak** memeriksa status suspend | 🟡 | `RefreshTokenUseCase` — user yang di-suspend tetap bisa refresh sampai token kedaluwarsa |
| F3.1 | Login GitHub & Google, redirect URI menunjuk ke frontend | ✅ | `infrastructure/auth/{github,google}.rs` |
| F3.2 | Akun OAuth dengan email yang sama di-link ke user existing | ✅ | `GitHubCallbackUseCase`, `GoogleCallbackUseCase` |
| F3.3 | Alur OAuth memakai parameter `state`/PKCE anti-CSRF | ⛔ | Tidak ada di `get_authorize_url()` kedua provider |
| F4.1 | Token disimpan sebagai httpOnly cookie, bukan localStorage | ✅ | `api/auth/[...all]/route.ts` |
| F4.2 | Access token kedaluwarsa di-refresh otomatis tanpa user login ulang | ✅ | `proxy.ts` + `GET /api/auth/get-session` |
| F4.3 | Route handler memverifikasi tanda tangan RS256 | 🟡 | Ya bila `JWT_PUBLIC_KEY` diisi; **fallback decode tanpa verifikasi** bila kosong |
| F4.4 | `proxy.ts` memverifikasi tanda tangan token | ⛔ | Hanya `decodeJwt`, tanpa verifikasi dan tanpa cek `exp` |
| F5.1 | Ada mekanisme revocation / logout global | ⛔ | Refresh token stateless, tidak ada blacklist |

### 4.2 Manajemen User (Admin)

| ID | Requirement | Status | Bukti |
|---|---|---|---|
| F6.1 | Admin & Maintainer dapat melihat daftar user | ✅ | `GetUsersUseCase` |
| F6.2 | Admin & Maintainer dapat membuat user beserta role-nya | ✅ | `CreateUserUseCase` |
| F6.3 | Hanya Maintainer yang boleh update & delete user | ✅ | `UpdateUserUseCase`, `DeleteUserUseCase` |
| F6.4 | User tidak boleh menghapus akunnya sendiri | ✅ | `AppError::CannotDeleteSelf` |
| F6.5 | Admin & Maintainer dapat mengubah status `Active`/`Suspended` | ✅ | `UpdateUserStatusUseCase` |
| F6.6 | UI untuk update & delete user | ⛔ | Frontend hanya memakai `PATCH /users/:id/status` |
| F6.7 | Daftar user ter-paginasi | ⛔ | `find_all()` tanpa `LIMIT`/`ORDER BY` |
| F6.8 | Non-admin yang mengakses daftar user mendapat 403 | 🟡 | Mendapat **401** — usecase mengembalikan `InvalidToken`, bukan `Forbidden` |

### 4.3 Katalog Langganan

| ID | Requirement | Status | Bukti |
|---|---|---|---|
| F7.1 | Admin dapat membuat tipe akun dengan nama, deskripsi, dan daftar benefit | ✅ | `account_type_usecase.go` |
| F7.2 | Nama tipe akun unik | ✅ | `uniqueIndex` pada `name` |
| F7.3 | Hanya satu tipe akun boleh ditandai "recommended" | ✅ | Ditegakkan di usecase create & update, bukan di DB |
| F7.4 | Tipe akun tidak boleh dihapus bila masih ada langganan aktif | ✅ | Guard `activeUserCount` |
| F7.5 | Menghapus tipe akun ikut menghapus paket-paketnya | ✅ | Plan soft-delete, tipe akun **hard delete** |
| F7.6 | Admin dapat membuat paket: durasi bulan, harga, kuota opsional | ✅ | `subscription_plan_usecase.go` |
| F7.7 | `duration_months = 0` berarti lifetime | ✅ | Konvensi lintas backend & frontend |
| F7.8 | Paket lifetime **wajib** punya kuota | ✅ | Divalidasi di usecase Go dan schema zod frontend |
| F7.9 | Satu tipe akun hanya boleh punya satu paket lifetime | ✅ | Partial unique index `idx_unique_lifetime_plan` |
| F7.10 | Paket berdurasi > 0 dipaksa tanpa kuota | ✅ | `plan.Quota = nil` di `CreatePlan` |
| F7.11 | Paket tidak boleh dihapus bila masih ada langganan aktif | ✅ | Guard `Count` |
| F7.12 | Endpoint update paket dapat mengubah kuota & tipe akun | ⛔ | `UpdatePlan` hanya menyalin `Name`, `Description`, `DurationMonths`, `Price` |
| F7.13 | Katalog tampil di landing page tanpa login | ✅ | `get-public-pricing.ts` + `/public/*` |

### 4.4 Voucher

| ID | Requirement | Status | Bukti |
|---|---|---|---|
| F8.1 | Admin dapat membuat voucher: kode, persen diskon, batas nominal, kedaluwarsa, kuota | ✅ | `voucher_usecase.go` |
| F8.2 | Kode voucher unik | ✅ | Dicek di usecase + `uniqueIndex` |
| F8.3 | Diskon = `min(harga × persen / 100, max_discount_amount)` | ✅ | `BuySubscription` |
| F8.4 | Voucher kedaluwarsa / kuota habis ditolak | ✅ | `CheckVoucher` + `BuySubscription` |
| F8.5 | User dapat memvalidasi kode sebelum bayar | ✅ | `GET /public/vouchers/check/:code` |
| F8.6 | Voucher dihapus secara soft agar histori transaksi utuh | ✅ | `DeleteVoucher` |
| F8.7 | Endpoint update voucher | ⛔ | `UpdateVoucher` ada di usecase tapi **tidak di-route** |
| F8.8 | Voucher dibatasi per user / per plan | ⛔ | Tidak ada relasi pembatas |

### 4.5 Checkout & Pembayaran

| ID | Requirement | Status | Bukti |
|---|---|---|---|
| F9.1 | User memilih paket dari pricing → diarahkan ke `/checkout?planId=` | ✅ | `pricing-section.tsx` |
| F9.2 | Belum login → diarahkan sign-in dengan `callbackUrl` | ✅ | `pricing-section.tsx` |
| F9.3 | Checkout meminta **Discord username** (wajib) | ✅ | `checkout-client.tsx` — untuk pemberian akses komunitas |
| F9.4 | Checkout menerima kode voucher opsional | ✅ | `checkVoucher` server action |
| F9.5 | Pembayaran memakai Midtrans Snap, kedaluwarsa 1 jam | ✅ | `BuySubscription` |
| F9.6 | Checkout **idempoten** — transaksi pending untuk plan yang sama mengembalikan token lama | ✅ | Guard di `BuySubscription` |
| F9.7 | User dengan lifetime aktif untuk tipe akun tsb. ditolak membeli lagi | ✅ | Double purchase protection |
| F9.8 | Kuota paket & voucher dipesan secara atomik saat checkout | ✅ | `UPDATE ... WHERE used_quota < quota` + cek `RowsAffected` |
| F9.9 | Harga akhir 0 (diskon penuh) langsung settle tanpa Midtrans | ✅ | Jalur `finalPrice == 0` |
| F9.10 | Webhook Midtrans memperbarui status & mengaktifkan langganan | ✅ | `HandleMidtransWebhook` |
| F9.11 | Webhook mengonfirmasi status langsung ke Midtrans, tidak percaya body | ✅ | `coreapi.CheckTransaction` |
| F9.12 | Webhook idempoten — settle dua kali tidak menggandakan langganan | ✅ | Guard `oldStatus != settlement` |
| F9.13 | Transaksi gagal/kedaluwarsa mengembalikan kuota | ✅ | Webhook + worker |
| F9.14 | Halaman status dapat memaksa sinkronisasi bila webhook telat | ✅ | `POST /subscriptions/transactions/:order_id/sync` |
| F9.15 | Signature webhook Midtrans diverifikasi | ⛔ | Tidak ada verifikasi `signature_key`; keamanan bersandar pada `CheckTransaction` |
| F9.16 | Environment Midtrans dapat dikonfigurasi | ⛔ | `midtrans.Sandbox` **hard-coded** |
| F9.17 | Halaman status memakai URL gateway | ⛔ | `status-content.tsx` **hard-code** `http://localhost:8002/...` dan salah prefix — lihat [§8](#8-risiko-teknis-yang-mempengaruhi-produk) |

### 4.6 Siklus Hidup Langganan

| ID | Requirement | Status | Bukti |
|---|---|---|---|
| F10.1 | Pembayaran lunas menaikkan role user menjadi `Member` | ✅ | gRPC `UpdateUserRole` dari `activateSubscription` |
| F10.2 | Discord username disimpan ke profil user setelah lunas | ✅ | gRPC `UpdateDiscordUsername` |
| F10.3 | Membeli paket pada tipe akun **sama** menambah masa aktif (akumulasi) | ✅ | `activateSubscription` |
| F10.4 | Membeli paket pada tipe akun **berbeda** membatalkan langganan lama | ✅ | `activateSubscription` |
| F10.5 | Langganan lifetime tidak pernah kedaluwarsa | ✅ | `end_date IS NULL` diabaikan worker |
| F10.6 | Langganan lewat `end_date` otomatis jadi `Expired` dan role turun ke `User` | ✅ | `subscription_worker.go`, tick 10 menit |
| F10.7 | Transaksi `pending` > 2 jam otomatis `expired` + kuota dilepas | ✅ | `processExpiredTransactions` |
| F10.8 | Member melihat hitung mundur masa aktif | ✅ | `subscription-countdown.tsx` |
| F10.9 | Kegagalan gRPC saat update role membatalkan transaksi DB | ⛔ | Sengaja best-effort: hanya di-log. Role bisa tidak sinkron dengan langganan |

### 4.7 Manajemen Member (Admin)

| ID | Requirement | Status | Bukti |
|---|---|---|---|
| F11.1 | Admin melihat daftar member beserta paket & masa aktifnya | ✅ | `member_usecase.go` — gabung gRPC `GetAllUsers` + query langganan |
| F11.2 | Admin dapat mempromosikan user jadi Member tanpa pembayaran | ✅ | `PromoteToMember` |
| F11.3 | Admin dapat memperpanjang langganan | ✅ | `ExtendSubscription` |
| F11.4 | Admin dapat mencabut keanggotaan (role turun ke `User`) | ✅ | `RevokeMembership` |
| F11.5 | Admin dapat mem-ban/unban user | ✅ | Lewat `PATCH /api/v1/users/:id/status` |
| F11.6 | Daftar member ter-paginasi & terurut | ⛔ | Iterasi map Go, urutan non-deterministik |
| F11.7 | Aksi promote/extend berjalan atomik | 🟡 | `PromoteToMember` **tanpa transaksi**; `ExtendSubscription` pakai transaksi |

### 4.8 Forum Chat — ⏸️ On-hold

| ID | Requirement | Status | Bukti |
|---|---|---|---|
| F12.1 | Chat realtime lewat WebSocket dengan autentikasi token | ✅ | `chat_ws_handler` |
| F12.2 | Riwayat pesan ter-paginasi berbasis cursor | ✅ | `get_recent_history` |
| F12.3 | Balas, edit, hapus pesan (hanya milik sendiri) | ✅ | Difilter `sender_id` di SQL |
| F12.4 | Reaksi emoji dengan toggle | ✅ | `toggle_reaction` |
| F12.5 | Indikator mengetik & jumlah user online | ✅ | Redis |
| F12.6 | Upload gambar ke MinIO (maks 10 MiB) | ✅ | `storage_service.rs` |
| F12.7 | Hitungan pesan belum dibaca | ✅ | Berbasis `users.last_read_at` |
| F12.8 | Fan-out lintas instance | ✅ | Redis pub/sub `chat:group:*` |
| F12.9 | Event pesan diterbitkan ke message broker | 🟡 | Ke **RabbitMQ**; rencananya pindah ke Kafka |
| F12.10 | Worker notification/analytics/moderation memproses event | ⛔ | Ketiganya **placeholder** — hanya `tracing::info!` + `sleep` + `ack` |
| F12.11 | Member dapat mengakses chat | ⛔ | UI hanya di `/maintainer/discussion`, diblokir `proxy.ts` untuk non-Maintainer |
| F12.12 | Chat dapat diakses lewat gateway `:8080` | ⛔ | `/api/v1/chat/*` tidak ter-route |
| F12.13 | Multi-group / channel | ⛔ | `group_id` tidak pernah dipersist |

---

## 5. Requirement Non-Fungsional

| Area | Target / kondisi sekarang |
|---|---|
| **Autentikasi** | JWT RS256, satu keypair dibagi semua service. Access 15 menit, refresh 7 hari. Cookie httpOnly + `sameSite=lax`, `secure` hanya di production |
| **Otorisasi** | Dua lapis: `proxy.ts` (UX, tidak aman sendirian) + backend per-endpoint (sumber kebenaran). **Jangan** pernah menaruh otorisasi hanya di frontend |
| **Password** | Argon2id, parameter default crate `argon2` 0.5.3 |
| **Transport** | Semua HTTP/gRPC **tanpa TLS** di dev. gRPC memakai `insecure.NewCredentials()` |
| **Rahasia** | Kredensial infra di-hardcode di file compose. Wajib diganti sebelum deploy |
| **Ketersediaan** | Single instance per service. Tidak ada healthcheck untuk service aplikasi di compose mana pun |
| **Skalabilitas** | Chat sudah siap multi-instance (Redis pub/sub). Sisanya belum diuji horizontal |
| **Batas memori prod** | auth/grpc/realtime 64M, main 64M, frontend 128M ([`docker-compose.prod.yml`](../docker-compose.prod.yml)) |
| **Pool DB** | `max_connections(5)`, `acquire_timeout 3s` per service Rust |
| **Observability** | `tracing` (Rust) + Fiber `logger` (Go). **Tidak ada** metrics, tracing terdistribusi, atau error reporting |
| **Testing** | **Tidak ada satu pun test di repo** — nol `#[test]`, nol `_test.go`, nol `*.test.ts`, tidak ada CI |
| **Aksesibilitas** | Belum diaudit |
| **i18n** | Tidak ada. UI Indonesia hard-coded; pesan error backend campur ID/EN |

---

## 6. Model Domain

Detail kolom ada di [database.md](database.md). Ringkas konseptualnya:

```
users.users ──< (via gRPC, tanpa FK) ── main.user_subscriptions >── main.subscription_plans
                                                                          │
                                    main.transactions >───────────────────┤
                                             │                            │
                                             └──> main.vouchers    main.account_types
```

| Istilah | Arti |
|---|---|
| **Account Type** | Tingkatan produk (tier) yang dijual, mis. "Basic", "Pro". Punya benefit & flag rekomendasi |
| **Subscription Plan** | Varian harga × durasi dari satu account type. `duration_months = 0` = lifetime |
| **Quota** | Batas jumlah pembelian sebuah plan/voucher. `NULL` = tanpa batas. Dipesan saat checkout, dilepas saat gagal |
| **User Subscription** | Langganan aktif/historis milik user. `end_date = NULL` = lifetime |
| **Transaction** | Satu percobaan checkout. `external_id` = `order_id` Midtrans |
| **Voucher** | Diskon persentase dengan batas nominal, kedaluwarsa, dan kuota |
| **Member** | Role user setelah langganan aktif — bukan entitas terpisah |

**Batas kepemilikan data:** `users.users` milik Rust; `main.*` milik Go. Go
**tidak boleh** menyentuh tabel Rust — semua akses lewat gRPC. Itu sebabnya
`user_id` di schema `main` bertipe `varchar(255)` tanpa foreign key.

---

## 7. Gap antara Janji UI dan Kode

Dicatat agar tidak ada yang mengira fitur ini ada.

### UI menjanjikan, backend belum ada

| Janji | Di mana | Backend |
|---|---|---|
| Kelas, video, modul, kuis, sertifikat | `product-showcase.tsx`, `how-it-works-section.tsx` | ⛔ Tidak ada entitas apa pun |
| Market News | Menu member `constants/main-menu.ts` → `/forum/market-news` | ⛔ Halaman & endpoint tidak ada |
| Change password, billing, transaction, subscription, 2FA | `constants/profile-menu.ts` → `/user/*` | ⛔ Semua halaman tidak ada |
| Form kontak | `cta-section.tsx` | ⛔ Tanpa `onSubmit`, murni dekorasi |
| Integrasi Discord otomatis | Username dikumpulkan saat checkout | ⛔ Nol referensi ke API Discord. Pemberian role masih manual |
| Link About Us, FAQ, ToS, Privacy, sosial media | Footer & auth layout | ⛔ Semua `href="#"` |

### Backend ada, UI belum menjangkau

| Kapabilitas | Kenapa tidak terjangkau |
|---|---|
| Seluruh fitur chat | UI hanya di `/maintainer/discussion`; Member diblokir `proxy.ts` |
| `POST /subscriptions/subscribe` | Frontend hanya memakai `/buy` |
| `PUT` & `DELETE /users/:id` | Tidak ada UI edit/hapus user |
| `UpdateVoucher` | Tidak di-route |
| gRPC `GetUsers`, `UpdateLastRead` | Tidak dipakai `main-service` |

### Halaman placeholder

| Path | Isi nyata |
|---|---|
| `/maintainer/dashboard` | `<div>MaintainerDashboard</div>` |
| `/user/profile` | `<div>Test</div>` |
| `/admin/dashboard` | Satu kartu profil user. Nol metrik bisnis |
| `/forum/dashboard` | Sapaan + countdown. Variabel `pricingData` diambil lalu tidak dirender |

---

## 8. Risiko Teknis yang Mempengaruhi Produk

| # | Risiko | Dampak produk | Bukti |
|---|---|---|---|
| R1 | `status-content.tsx` hard-code `http://localhost:8002` dan **salah prefix** (`/api/v1/...` alih-alih `/api/v1/main/...`) | Sinkronisasi status pembayaran **gagal di luar mesin dev**. User yang webhook-nya telat melihat status salah | `frontend/src/app/checkout/status/status-content.tsx` |
| R2 | Midtrans terkunci mode Sandbox | Tidak bisa menerima pembayaran nyata tanpa ubah kode | `user_subscription_usecase.go` |
| R3 | Signature webhook tidak diverifikasi | Endpoint webhook publik; mitigasi hanya `CheckTransaction` ke Midtrans | idem |
| R4 | Role `SuperAdmin` valid di DB & Go tapi tidak ada di enum Rust | Baris user `SuperAdmin` **gagal di-decode** → 500 di seluruh jalur Rust | `shared-core/.../user.rs` vs migrasi `20260823055723` |
| R5 | `UpdateUserRole` gRPC memetakan role tak dikenal ke `Role::User` secara diam-diam | Typo pada string role = user **di-downgrade** tanpa error | `user_service_impl.rs` |
| R6 | URL gambar chat memakai hostname internal `minio` | Gambar tidak bisa dibuka dari browser | `storage_service.rs` |
| R7 | Tidak ada test dan tidak ada CI | Setiap perubahan berisiko regresi diam-diam | Seluruh repo |
| R8 | Kredensial dev hard-coded di compose | Bocor bila di-deploy apa adanya | Semua compose |
| R9 | Kegagalan gRPC saat aktivasi hanya di-log | Langganan aktif tapi role tetap `User` → member tidak dapat akses | `activateSubscription` |
| R10 | Refresh token tidak cek suspend & tidak bisa dicabut | User yang di-ban tetap punya sesi hingga 7 hari | `RefreshTokenUseCase` |

Isu operasional (chat belum ter-route, Kafka idle, dll.) ada di
[operations.md → Isu yang Diketahui](operations.md#isu-yang-diketahui).

---

## 9. Arah Pengembangan

Status resmi ada di
[operations.md → Status Pengembangan](operations.md#status-pengembangan).

**Sedang dikerjakan:** manajemen user dan subscription.

**Keputusan arsitektur yang sudah diambil untuk nanti:**

| Keputusan | Konsekuensi bagi pekerjaan hari ini |
|---|---|
| Event `realtime-service` akan pindah dari RabbitMQ ke **Kafka** | Jangan menambah producer/consumer RabbitMQ baru di `realtime-service` |
| **RabbitMQ** akan dipakai `notification-service` yang belum dibuat | Worker notification yang ada sekarang bukan cikal bakalnya |
| Fitur chat **on-hold** | Boleh dijalankan & dites, tetapi bukan prioritas. Kontraknya belum final |

**Kandidat pekerjaan berikutnya (belum dijadwalkan, urut dampak):**

1. Perbaiki R1 — checkout status tidak berfungsi di luar dev.
2. Jadikan environment Midtrans konfigurabel + verifikasi signature (R2, R3).
3. Selaraskan `SuperAdmin` antara DB, Go, dan enum Rust (R4, R5).
4. Isi halaman placeholder: dashboard admin (metrik), profil user.
5. Halaman `/user/*` yang sudah ada di menu tapi belum dibuat.
6. Paginasi daftar user & member (F6.7, F11.6).
7. Test pertama untuk jalur pembayaran — bagian paling berisiko dan paling tidak terlindungi.

---

## 10. Kriteria Penerimaan untuk Fitur Baru

Setiap perubahan pada repo ini dianggap selesai bila:

1. **Mengikuti pola yang sudah ada.** Jangan memperkenalkan library, layer, atau
   gaya baru tanpa alasan. Pola per stack ada di skill
   [`technostock-feature`](../.agents/skills/technostock-feature/SKILL.md).
2. **Otorisasi ditegakkan di backend**, bukan hanya di `proxy.ts`.
3. **Batas kepemilikan data dihormati** — Go tidak menyentuh `users.users`;
   Rust tidak menyentuh `main.*`.
4. **Endpoint baru yang dipanggil browser dapat menembus gateway** — tambahkan
   route di `gateway.rs` bila perlu, atau pakai prefix yang sudah ter-route.
5. **Uang dan kuota diperlakukan hati-hati** — reservasi atomik, idempotensi,
   dan pelepasan kuota saat gagal. Tiru `BuySubscription`.
6. **Dokumen ikut diperbarui** bila kontrak, skema, atau status fitur berubah.
7. **Perubahan `sqlx::query!` di `realtime-service` disertai `cargo sqlx
   prepare`** dan file `.sqlx/*.json` ikut di-commit, atau build prod pecah.
