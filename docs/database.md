# Database

Referensi skema data yang **saat ini benar-benar ada di kode**. Diturunkan
langsung dari file migrasi sqlx dan struct GORM, bukan dari rancangan.

- **Engine:** PostgreSQL 17
- **Nama database:** `technostock`
- **Koneksi dev:** `postgres://postgres:admin@localhost:5433/technostock` (dari
  host) atau `@postgres:5432` (dari dalam container)

---

## Ringkasan

Satu database dipakai bersama oleh tiga service, dipisahkan lewat **schema
PostgreSQL**. Tidak ada database terpisah per service.

| Schema | Tabel | Dikelola oleh | Cara dibuat |
|---|---|---|---|
| `users` | `users` | `auth-service` | migrasi sqlx |
| `message` | `messages`, `message_reactions` | `realtime-service` | migrasi sqlx |
| `main` | `account_types`, `subscription_plans`, `user_subscriptions`, `transactions`, `vouchers` | `main-service` | GORM `AutoMigrate` |
| `public` | `_sqlx_migrations` | sqlx | otomatis |

Total **8 tabel aplikasi** + 1 tabel bookkeeping migrasi.

Siapa membaca/menulis apa:

| Tabel | Penulis | Pembaca lain |
|---|---|---|
| `users.users` | `auth-service` | `grpc-service` (via `shared-core`), `realtime-service` (via gRPC, bukan SQL langsung) |
| `message.messages` | `realtime-service` | — |
| `message.message_reactions` | `realtime-service` | — |
| `main.*` | `main-service` | — |

`grpc-service` dan `auth-service` memakai repository yang sama dari crate
`shared-core`, jadi keduanya bisa menulis ke `users.users`.

---

## Diagram Relasi

```mermaid
erDiagram
    USERS ||--o{ MESSAGES : "sender_id"
    USERS ||--o{ MESSAGE_REACTIONS : "user_id"
    MESSAGES ||--o{ MESSAGE_REACTIONS : "message_id"
    MESSAGES ||--o{ MESSAGES : "reply_to_id"

    ACCOUNT_TYPES ||--o{ SUBSCRIPTION_PLANS : "account_type_id"
    SUBSCRIPTION_PLANS ||--o{ USER_SUBSCRIPTIONS : "subscription_plan_id"
    SUBSCRIPTION_PLANS ||--o{ TRANSACTIONS : "plan_id"
    VOUCHERS ||--o{ TRANSACTIONS : "voucher_id"

    USERS {
        uuid id PK
        varchar email UK
        varchar role
        varchar status
    }
    MESSAGES {
        uuid id PK
        uuid sender_id FK
        uuid reply_to_id FK
        text content
    }
    MESSAGE_REACTIONS {
        uuid id PK
        uuid message_id FK
        uuid user_id FK
        varchar emoji
    }
    ACCOUNT_TYPES {
        uuid id PK
        varchar name UK
        jsonb benefits
    }
    SUBSCRIPTION_PLANS {
        uuid id PK
        uuid account_type_id FK
        int duration_months
        numeric price
        int quota
    }
    USER_SUBSCRIPTIONS {
        uuid id PK
        varchar user_id "bukan FK"
        uuid subscription_plan_id FK
        varchar status
    }
    TRANSACTIONS {
        uuid id PK
        varchar user_id "bukan FK"
        uuid plan_id FK
        uuid voucher_id FK
        varchar external_id UK
        varchar status
    }
    VOUCHERS {
        uuid id PK
        varchar code UK
        numeric discount_percentage
        int quota
    }
```

> `user_subscriptions.user_id` dan `transactions.user_id` bertipe `varchar(255)`
> dan **tidak** punya foreign key ke `users.users`. Lihat
> [Catatan Integritas Data](#catatan-integritas-data).

---

## Schema `users`

### `users.users`

Sumber tunggal identitas user. Menampung akun email/password sekaligus akun
OAuth.

| Kolom | Tipe | Null | Default | Keterangan |
|---|---|---|---|---|
| `id` | `UUID` | ✗ | `uuid_generate_v4()` | Primary key |
| `name` | `VARCHAR(255)` | ✗ | — | |
| `phone` | `VARCHAR(20)` | ✓ | — | |
| `email` | `VARCHAR(255)` | ✗ | — | **UNIQUE** |
| `password_hash` | `TEXT` | ✓ | — | Nullable sejak migrasi OAuth — user GitHub/Google tidak punya password |
| `role` | `VARCHAR(50)` | ✗ | — | CHECK: `Admin`, `SuperAdmin`, `User`, `Maintainer`, `Member` |
| `status` | `VARCHAR(20)` | ✗ | `'Active'` | CHECK: `Active`, `Suspended` |
| `github_id` | `BIGINT` | ✓ | — | **UNIQUE** |
| `google_id` | `VARCHAR(255)` | ✓ | — | **UNIQUE** |
| `avatar_url` | `TEXT` | ✓ | — | Diisi dari profil OAuth |
| `discord_username` | `VARCHAR(255)` | ✓ | — | Diisi `main-service` via gRPC setelah checkout |
| `last_read_at` | `TIMESTAMPTZ` | ✓ | `NOW()` | Basis perhitungan unread count chat |
| `created_at` | `TIMESTAMPTZ` | ✓ | `CURRENT_TIMESTAMP` | |
| `updated_at` | `TIMESTAMPTZ` | ✓ | `CURRENT_TIMESTAMP` | Di-maintain trigger |

**Index & constraint:** PK `id`; UNIQUE pada `email`, `github_id`, `google_id`.

**Trigger:** `update_user_updated_at` — `BEFORE UPDATE FOR EACH ROW`, memanggil
fungsi `public.update_updated_at_column()` yang men-set `updated_at = NOW()`.

**Kode terkait:**
[`shared-core/src/domain/entities/user.rs`](../shared-core/src/domain/entities/user.rs),
[`postgres_user_repository.rs`](../shared-core/src/infrastructure/repositories/postgres_user_repository.rs)

---

## Schema `message`

### `message.messages`

Seluruh pesan chat. Struktur flat — tidak ada tabel channel/room, lihat
[catatan `group_id`](#group_id-tidak-dipersist).

| Kolom | Tipe | Null | Default | Keterangan |
|---|---|---|---|---|
| `id` | `UUID` | ✗ | `gen_random_uuid()` | Primary key |
| `sender_id` | `UUID` | ✗ | — | FK → `users.users(id)` **ON DELETE CASCADE** |
| `content` | `TEXT` | ✗ | — | |
| `reply_to_id` | `UUID` | ✓ | — | FK self-referencing → `message.messages(id)` **ON DELETE SET NULL** |
| `image_url` | `TEXT` | ✓ | — | URL objek MinIO, lihat [Object Storage](#minio--object-storage) |
| `is_edited` | `BOOLEAN` | ✗ | `FALSE` | |
| `created_at` | `TIMESTAMPTZ` | ✗ | `CURRENT_TIMESTAMP` | |

**Index:** `idx_messages_created_at` pada `(created_at DESC)` — dipakai
pagination history yang berbasis cursor.

Menghapus user akan **menghapus seluruh pesannya** (cascade).

### `message.message_reactions`

Reaksi emoji per pesan. Satu baris = satu user memberi satu emoji ke satu pesan.

| Kolom | Tipe | Null | Default | Keterangan |
|---|---|---|---|---|
| `id` | `UUID` | ✗ | — | Primary key. **Tanpa default DB** — di-generate aplikasi |
| `message_id` | `UUID` | ✗ | — | FK → `message.messages(id)` **ON DELETE CASCADE** |
| `user_id` | `UUID` | ✗ | — | FK → `users.users(id)` **ON DELETE CASCADE** |
| `emoji` | `VARCHAR(255)` | ✗ | — | |
| `created_at` | `TIMESTAMPTZ` | ✓ | `CURRENT_TIMESTAMP` | |

**Constraint:** `UNIQUE(message_id, user_id, emoji)` — toggle reaksi
diimplementasikan sebagai `DELETE` lalu `INSERT`.
**Index:** `idx_message_reactions_message_id` pada `(message_id)`.

**Kode terkait:**
[`postgres_message_repository.rs`](../realtime-service/src/infrastructure/repositories/postgres_message_repository.rs)

---

## Schema `main`

Dibuat oleh GORM `AutoMigrate` saat `main-service` start
([`cmd/api/main.go`](../main-service/cmd/api/main.go)). Prefix schema `main.`
diatur lewat `NamingStrategy` di
[`infrastructure/database/postgres.go`](../main-service/infrastructure/database/postgres.go),
yang juga menjalankan `CREATE SCHEMA IF NOT EXISTS main`.

Semua tabel memakai konvensi GORM: `created_at` dan `updated_at` diisi otomatis.

### `main.account_types`

Tingkatan akun yang bisa dilanggan (dipakai landing page & halaman pricing).

| Kolom | Tipe | Null | Default | Keterangan |
|---|---|---|---|---|
| `id` | `uuid` | ✗ | `gen_random_uuid()` | Primary key |
| `name` | `varchar(255)` | ✗ | — | **UNIQUE index** |
| `description` | `text` | ✓ | — | |
| `benefits` | `jsonb` | ✓ | — | Disimpan sebagai array JSON |
| `is_recommended` | `boolean` | ✓ | `false` | Menandai kartu "recommended" di UI. Update yang men-set `true` mematikan flag ini pada baris lain |
| `created_at` | `timestamptz` | ✓ | — | |
| `updated_at` | `timestamptz` | ✓ | — | |
| `deleted_at` | `timestamptz` | ✓ | — | **Soft delete** GORM, ter-index |

Field `UserCount` pada struct ditandai read-only (`gorm:"->"`) — nilainya tidak
pernah ditulis GORM, hanya diisi subquery `COUNT(DISTINCT user_id)` atas
langganan `Active` saat `GET`
([`account_type_usecase.go`](../main-service/usecases/account_type_usecase.go)).

### `main.subscription_plans`

Varian harga & durasi untuk sebuah account type.

| Kolom | Tipe | Null | Default | Keterangan |
|---|---|---|---|---|
| `id` | `uuid` | ✗ | `gen_random_uuid()` | Primary key |
| `account_type_id` | `uuid` | ✗ | — | FK → `main.account_types(id)` |
| `name` | `varchar(255)` | ✗ | — | |
| `description` | `text` | ✓ | — | |
| `duration_months` | `integer` | ✗ | — | **`0` berarti lifetime** |
| `price` | `numeric(10,2)` | ✗ | — | |
| `quota` | `integer` | ✓ | — | **`NULL` berarti tanpa batas** |
| `used_quota` | `integer` | ✗ | `0` | Dinaikkan saat checkout, diturunkan saat transaksi gagal/kedaluwarsa |
| `created_at` | `timestamptz` | ✓ | — | |
| `updated_at` | `timestamptz` | ✓ | — | |
| `deleted_at` | `timestamptz` | ✓ | — | Soft delete, ter-index |

**Index tambahan:** `idx_unique_lifetime_plan` — partial unique index
`ON main.subscription_plans (account_type_id) WHERE duration_months = 0`,
dibuat manual lewat `db.Exec` di `cmd/api/main.go`. Efeknya: satu account type
hanya boleh punya satu plan lifetime.

Seperti `account_types`, struct ini juga punya field read-only `UserCount`.

### `main.user_subscriptions`

Langganan aktif/historis milik user.

| Kolom | Tipe | Null | Default | Keterangan |
|---|---|---|---|---|
| `id` | `uuid` | ✗ | `gen_random_uuid()` | Primary key |
| `user_id` | `varchar(255)` | ✗ | — | UUID user dalam bentuk string. **Ter-index, bukan FK** |
| `subscription_plan_id` | `uuid` | ✗ | — | FK → `main.subscription_plans(id)` |
| `status` | `varchar(50)` | ✗ | — | `Active`, `Expired`, `Cancelled` |
| `start_date` | `timestamptz` | ✗ | — | |
| `end_date` | `timestamptz` | ✓ | — | **`NULL` berarti lifetime** |
| `created_at` | `timestamptz` | ✓ | — | |
| `updated_at` | `timestamptz` | ✓ | — | |
| `deleted_at` | `timestamptz` | ✓ | — | Soft delete, ter-index |

Transisi `Active` → `Expired` dijalankan background worker
[`subscription_worker.go`](../main-service/infrastructure/workers/subscription_worker.go)
setiap 10 menit, sekaligus menurunkan role user ke `User` via gRPC.

Aktivasi langganan baru pada account type yang **sama** menumpuk `end_date`
alih-alih membuat baris baru. Account type berbeda → langganan lama jadi
`Cancelled`.

### `main.transactions`

Percobaan pembayaran Midtrans. Satu baris per checkout.

| Kolom | Tipe | Null | Default | Keterangan |
|---|---|---|---|---|
| `id` | `uuid` | ✗ | `gen_random_uuid()` | Primary key |
| `user_id` | `varchar(255)` | ✗ | — | Ter-index, bukan FK |
| `plan_id` | `uuid` | ✗ | — | FK → `main.subscription_plans(id)`, ter-index |
| `voucher_id` | `uuid` | ✓ | — | FK → `main.vouchers(id)`, ter-index |
| `payment_token` | `varchar(255)` | ✗ | — | Snap token Midtrans. **UNIQUE index**. Untuk transaksi gratis diisi `FREE-<external_id>` |
| `external_id` | `varchar(255)` | ✗ | — | `order_id` Midtrans, format `SUB-<8 char plan id>-<unix ts>`. **UNIQUE index** — dipakai webhook untuk mencocokkan transaksi |
| `amount` | `numeric(10,2)` | ✗ | — | Harga **setelah** diskon |
| `discount_amount` | `numeric(10,2)` | ✗ | `0` | |
| `status` | `varchar(20)` | ✗ | `'PENDING'` | Nilai yang ditulis kode: `pending`, `settlement`, `failed`, `expired` |
| `invoice_url` | `text` | ✓ | — | Redirect URL Snap |
| `discord_username` | `varchar(255)` | ✓ | — | Dikumpulkan saat checkout |
| `created_at` | `timestamptz` | ✓ | — | |
| `updated_at` | `timestamptz` | ✓ | — | |

Satu-satunya tabel `main` **tanpa** `deleted_at` — penghapusan bersifat permanen.

Transaksi `pending` yang lebih tua dari **2 jam** ditandai `expired` oleh
`subscription_worker`, sekaligus mengembalikan kuota plan dan voucher.

> Default `'PENDING'` (huruf besar) tidak pernah terpakai karena kode selalu
> mengisi `status` secara eksplisit dengan huruf kecil.

### `main.vouchers`

Kode diskon yang bisa dipakai saat checkout.

| Kolom | Tipe | Null | Default | Keterangan |
|---|---|---|---|---|
| `id` | `uuid` | ✗ | `gen_random_uuid()` | Primary key |
| `code` | `varchar(50)` | ✗ | — | **UNIQUE index** |
| `discount_percentage` | `numeric(5,2)` | ✗ | — | Persen diskon dari harga plan |
| `max_discount_amount` | `numeric(10,2)` | ✗ | — | Batas atas nilai diskon ("up to") |
| `expires_at` | `timestamptz` | ✗ | — | |
| `quota` | `integer` | ✓ | — | **`NULL` berarti tanpa batas** |
| `used_quota` | `integer` | ✗ | `0` | Pola naik/turun sama seperti kuota plan |
| `created_at` | `timestamptz` | ✓ | — | |
| `updated_at` | `timestamptz` | ✓ | — | |
| `deleted_at` | `timestamptz` | ✓ | — | Soft delete agar histori transaksi tetap utuh |

Perhitungan diskon: `min(price × discount_percentage / 100, max_discount_amount)`,
harga akhir tidak pernah negatif.

---

## Referensi Nilai Enum

| Domain | Nilai valid | Ditegakkan di |
|---|---|---|
| Role user | `Admin`, `SuperAdmin`, `User`, `Maintainer`, `Member` | CHECK constraint DB |
| Status user | `Active`, `Suspended` | CHECK constraint DB |
| Status langganan | `Active`, `Expired`, `Cancelled` | Konstanta Go saja |
| Status transaksi | `pending`, `settlement`, `failed`, `expired` | Konstanta Go saja |

---

## Migrasi

### auth-service — 13 migrasi sqlx

| Versi | Perubahan |
|---|---|
| `20240101000000` | Buat `users`, ekstensi `uuid-ossp`, fungsi + trigger `updated_at` |
| `20240102000000` | Tambah `users.status` |
| `20240103000000` | `password_hash` jadi nullable; tambah `github_id`, `avatar_url` |
| `20240104000000` | Tambah `google_id` |
| `20240105000000` | Buat `messages` + index `created_at DESC` |
| `20260221141053` | Buat `message_reactions` |
| `20260221220909` | Tambah `messages.reply_to_id` |
| `20260228063318` | Tambah `messages.is_edited` |
| `20260301092611` | Tambah `messages.image_url` |
| `20260307161500` | Tambah `users.last_read_at` |
| `20260418000000` | **Pemisahan schema** — pindahkan tabel ke schema `users` dan `message` |
| `20260823055723` | Tambah role `Member` ke CHECK constraint |
| `20260823163501` | Tambah `users.discord_username` |

### realtime-service — 11 migrasi sqlx

Sebelas file pertama **identik byte-per-byte** dengan milik auth-service. Dua
migrasi terakhir (`20260823055723`, `20260823163501`) tidak ada di sini.

### Cara migrasi diterapkan

| Service | Mekanisme |
|---|---|
| `auth-service` | `sqlx::migrate!("./migrations")` dengan `set_ignore_missing(true)` saat startup ([`main.rs`](../auth-service/src/main.rs)). Compose dev dan [`entrypoint.sh`](../auth-service/entrypoint.sh) juga menjalankan `sqlx migrate run --ignore-missing` lebih dulu |
| `realtime-service` | Sama seperti di atas ([`main.rs`](../realtime-service/src/main.rs), [`entrypoint.sh`](../realtime-service/entrypoint.sh)) |
| `main-service` | GORM `AutoMigrate` saat startup — tidak ada file migrasi, skema mengikuti struct |
| `grpc-service` | Tidak menjalankan migrasi. Hanya membaca/menulis `users.users` lewat `shared-core` |

### `_sqlx_migrations` yang dipakai bersama

`auth-service` dan `realtime-service` memakai `DATABASE_URL` yang sama, jadi
keduanya berbagi satu tabel `public._sqlx_migrations`.

Secara default sqlx 0.8 menolak start bila menemukan migrasi yang sudah
ter-apply di database tetapi tidak ada di direktori migrasi lokalnya
(`MigrateError::VersionMissing`). Karena `auth-service` punya 2 migrasi yang
tidak dimiliki `realtime-service`, kondisi itu pasti terjadi.

**Sudah ditangani** dengan `set_ignore_missing(true)` di kedua `main.rs` dan
flag `--ignore-missing` pada perintah CLI di compose serta `entrypoint.sh`.
Konsekuensinya: kedua direktori migrasi **tidak perlu** disinkronkan, tetapi
sqlx juga tidak lagi memperingatkan bila ada migrasi yang benar-benar hilang.
Checksum migrasi yang namanya sama tetap divalidasi — jangan mengubah isi file
migrasi yang sudah ter-apply.

---

## Catatan Integritas Data

### Batas schema `main` tidak punya FK ke user

`user_subscriptions.user_id` dan `transactions.user_id` menyimpan UUID sebagai
`varchar(255)` tanpa foreign key ke `users.users`. Konsekuensinya:

- Menghapus user **tidak** menghapus langganan atau transaksinya — baris yatim
  akan tertinggal.
- Tidak ada jaminan `user_id` menunjuk ke user yang benar-benar ada.
- Validasi user dilakukan di lapisan aplikasi lewat gRPC `ValidateToken` /
  `GetUsers` / `GetAllUsers` ke `grpc-service:50051`.

Ini konsisten dengan pemisahan service (Go tidak menyentuh tabel milik Rust),
tetapi berarti integritas referensial lintas schema adalah tanggung jawab
aplikasi.

### `group_id` tidak dipersist

WebSocket chat menerima query param `group_id` (default `"general"`), tetapi
**tidak ada kolom `group_id` di `message.messages`**. Nilai itu hanya dipakai
untuk routing channel Redis pub/sub dan broadcaster in-memory.

Artinya: semua pesan dari semua "group" masuk ke satu tabel yang sama, dan
`GET /api/v1/chat/history` mengembalikan riwayat global tanpa filter group.
Fitur multi-group memerlukan kolom baru plus migrasi.

### Role `SuperAdmin` tidak bisa di-decode Rust

CHECK constraint DB mengizinkan `SuperAdmin`, dan `main-service`
memperlakukannya sebagai role admin yang valid. Namun enum `Role` di
[`shared-core/src/domain/entities/user.rs`](../shared-core/src/domain/entities/user.rs)
hanya berisi `Maintainer`, `Admin`, `Member`, `User`. Baris user dengan
`role = 'SuperAdmin'` akan gagal di-decode saat sqlx memetakannya ke struct
`User`.

`realtime-service` juga memetakan role dari string gRPC secara manual dan
memperlakukan apa pun selain `Admin`/`Maintainer`/`Member` sebagai `User`.

### Unread count bersifat global

`get_unread_count` menghitung
`COUNT(*) FROM message.messages WHERE created_at > last_read_at AND sender_id != $user`.
Karena `last_read_at` adalah satu kolom timestamp di `users.users`, penanda baca
berlaku untuk seluruh chat sekaligus, bukan per group atau per percakapan.

---

## Penyimpanan Non-Relasional

Sebagian state chat berada di luar PostgreSQL dan **tidak persisten**. Seluruh
bagian ini menyangkut `realtime-service`, yang pengembangannya sedang
[on-hold](operations.md#status-pengembangan).

### Redis — state efemeral

| Pola key | Tipe | TTL | Isi |
|---|---|---|---|
| `chat:group:{group_id}` | Pub/Sub channel | — | Fan-out pesan antar instance `realtime-service` |
| `group:{group_id}` | Set | — | Daftar user_id yang sedang online, untuk online count |
| `typing:group:{group_id}:{user_id}` | String | 5 detik | Indikator "sedang mengetik" |

`realtime-service` melakukan `psubscribe("chat:group:*")` saat startup agar
pesan dari instance lain ikut diteruskan ke WebSocket lokal.

Set `group:{group_id}` tidak punya TTL — bila proses mati tanpa sempat
menjalankan `srem`, online count bisa tertinggal terlalu tinggi sampai Redis
di-flush.

### RabbitMQ — event pesan

Exchange **`chat.events`** (topic, durable). Tiga queue durable, semuanya
di-bind ke routing key `chat.message.created`:

| Queue | Consumer |
|---|---|
| `notification_queue` | [`notification_worker.rs`](../realtime-service/src/workers/notification_worker.rs) |
| `analytics_queue` | [`analytics_worker.rs`](../realtime-service/src/workers/analytics_worker.rs) |
| `moderation_queue` | [`moderation_worker.rs`](../realtime-service/src/workers/moderation_worker.rs) |

Ketiga consumer berjalan di dalam proses `realtime-service`, bukan service
terpisah.

> **Rencana:** topologi di atas akan dipindah ke Kafka, dan RabbitMQ dialihkan
> ke `notification-service` yang belum dibuat. Lihat
> [operations.md → Status Pengembangan](operations.md#status-pengembangan).

### Kafka

Broker Kafka 3.9 (KRaft, SASL/PLAIN) sudah berjalan di compose dev sebagai
persiapan migrasi tersebut, tetapi **belum ada kode yang memproduksi atau
mengonsumsi topic apa pun** — jadi belum ada topic, partisi, atau consumer group
yang bisa didokumentasikan.

### MinIO — object storage

- Bucket: dari env `MINIO_BUCKET` (default dev: `technostock`)
- Key gambar chat: `chat-images/{uuid}.{ext}`
- URL publik hasil upload disimpan di `message.messages.image_url`, dibentuk
  `{http|https}://{MINIO_ENDPOINT}:{MINIO_PORT}/{bucket}/{key}`
- Batas ukuran upload: **10 MiB** per file

> Karena URL dibentuk dari `MINIO_ENDPOINT`, nilai env tersebut harus bisa
> diakses **dari browser**. Di compose dev nilainya `minio` (nama service), jadi
> URL yang tersimpan tidak bisa dibuka langsung dari host.

---

## Inspeksi Cepat

```bash
# Masuk ke psql (container dev)
docker exec -it postgres psql -U postgres -d technostock

# Dari host
psql postgres://postgres:admin@localhost:5433/technostock
```

```sql
-- Daftar semua tabel aplikasi beserta schema-nya
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema IN ('users', 'message', 'main')
ORDER BY table_schema, table_name;

-- Migrasi sqlx yang sudah diterapkan
SELECT version, description, success, installed_on
FROM _sqlx_migrations ORDER BY version;

-- Struktur satu tabel
\d users.users
\d message.messages
\d main.transactions

-- Semua foreign key beserta aksi ON DELETE
SELECT tc.table_schema, tc.table_name, kcu.column_name,
       ccu.table_schema AS ref_schema, ccu.table_name AS ref_table,
       rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema IN ('users', 'message', 'main');
```

Reset total data pada environment dev:

```bash
make down-dev-volumes   # hentikan container + hapus semua volume
make dev                # migrasi dijalankan ulang dari nol
```
