---
name: technostock-database
description: Panduan skema dan migrasi database repo Technostock — satu PostgreSQL 17 dipakai bersama tiga service, dipisah lewat schema (users milik auth-service via migrasi sqlx, message milik realtime-service via sqlx, main milik main-service via GORM AutoMigrate). Menjelaskan cara menambah kolom/tabel di tiap jalur, aturan _sqlx_migrations bersama, kewajiban cargo sqlx prepare, prefix schema di raw SQL, dan jebakan integritas data lintas service. Gunakan saat menambah atau mengubah tabel, kolom, index, migrasi, atau menulis query di repo technostock.
---

# Database Technostock

Prasyarat: skill `technostock-overview`. Referensi kolom lengkap:
`docs/database.md`.

## Peta kepemilikan

Satu database `technostock`, tiga schema, tiga pemilik berbeda.

| Schema | Tabel | Pemilik | Cara dibuat |
|---|---|---|---|
| `users` | `users` | `auth-service` | migrasi sqlx (13 file) |
| `message` | `messages`, `message_reactions` | `realtime-service` | migrasi sqlx (11 file) |
| `main` | `account_types`, `subscription_plans`, `user_subscriptions`, `transactions`, `vouchers` | `main-service` | GORM `AutoMigrate` |
| `public` | `_sqlx_migrations` | sqlx | otomatis |

**Aturan mutlak:** Go tidak pernah menyentuh `users.*` atau `message.*`; Rust
tidak pernah menyentuh `main.*`. Lintas batas selalu lewat gRPC. Itu sebabnya
`user_id` di schema `main` bertipe `varchar(255)` **tanpa foreign key** — ini
disengaja, jangan "diperbaiki".

Koneksi dev: `postgres://postgres:admin@localhost:5433/technostock` (host) atau
`@postgres:5432` (dalam container).

## Prefix schema wajib di raw SQL

| Bahasa | Aturan |
|---|---|
| Rust | Tulis `users.users` / `message.messages` di setiap query. Tidak ada `search_path` yang diset |
| Go | `NamingStrategy{TablePrefix: "main."}` hanya berlaku untuk operasi berbasis model. Setiap `Table()`, `Joins()`, `Exec()`, dan subquery **wajib** menulis `main.` sendiri |

Contoh Go yang benar:

```go
u.db.Table("main.user_subscriptions").
    Joins("JOIN main.subscription_plans ON main.subscription_plans.id = main.user_subscriptions.subscription_plan_id").
    Where("main.subscription_plans.account_type_id = main.account_types.id")
```

---

## Jalur 1 — Tabel/kolom di schema `main` (Go, GORM)

Tidak ada file migrasi. Skema mengikuti struct.

1. Ubah/tambah struct di `main-service/domain/entities/`.
2. Daftarkan entity baru di `db.AutoMigrate(...)` pada
   `main-service/cmd/api/main.go`.
3. Index khusus (partial/unique kondisional) **tidak bisa** lewat AutoMigrate —
   tambahkan `db.Exec("CREATE ... IF NOT EXISTS ...")` setelahnya, dengan
   `log.Printf` warning (bukan `log.Fatal`). Contoh yang ada:

```go
err = db.Exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_lifetime_plan ON main.subscription_plans (account_type_id) WHERE duration_months = 0").Error
if err != nil {
    log.Printf("Warning: Failed to create partial unique index: %v", err)
}
```

Konvensi tag GORM di repo ini:

| Kebutuhan | Tag |
|---|---|
| PK | `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"` |
| Soft delete | `DeletedAt gorm.DeletedAt \`gorm:"index" json:"-"\`` |
| Unik | `gorm:"type:varchar(255);not null;uniqueIndex"` |
| Uang | `gorm:"type:numeric(10,2);not null"` |
| Persentase | `gorm:"type:numeric(5,2);not null"` |
| Nullable opsional | pointer: `Quota *int` (nil = unlimited) |
| Field read-only hasil subquery | `gorm:"->;column:user_count"` |
| FK ke user (lintas service) | `UserID string \`gorm:"type:varchar(255);not null;index"\`` — **string, bukan uuid; tanpa FK** |
| Relasi internal | `AccountTypeID uuid.UUID` + `AccountType AccountType \`gorm:"foreignKey:AccountTypeID"\`` |

> **AutoMigrate tidak menghapus atau mengubah kolom** yang sudah ada dan tidak
> menangani rename. Perubahan destruktif harus dijalankan manual lewat SQL.

> `Transaction` sengaja **tanpa** soft delete — histori pembayaran permanen.

## Jalur 2 — Kolom/tabel di schema `users` (Rust, sqlx)

Migrasi tinggal di `auth-service/migrations/`, format nama persis:
`<UTCTIMESTAMP>_<nama_snake_case>.sql`, contoh
`20260823163501_add_discord_username.sql`.

```sql
ALTER TABLE users.users ADD COLUMN nickname VARCHAR(255);
```

Qualify `users.` — tabel sudah dipindah schema oleh migrasi `20260418000000`.

**Menambah kolom pada `User` berarti mengubah empat tempat, semuanya wajib:**

1. File migrasi baru.
2. Field di `shared-core/src/domain/entities/user.rs → struct User`.
3. Konstanta `USER_COLUMNS` di
   `shared-core/src/infrastructure/repositories/postgres_user_repository.rs`.
4. **Semua** tempat `User { ... }` dikonstruksi:
   `auth-service/src/usecases/auth.rs` (3 lokasi) dan
   `auth-service/src/usecases/user_management.rs` (1 lokasi).

Lupa salah satu → compile error atau kolom diam-diam tidak pernah terisi.

> `realtime-service/src/domain/entities/user.rs` punya salinan `struct User`
> sendiri yang **sudah tidak sinkron** (tanpa `discord_username`). Itu tidak
> masalah karena realtime-service tidak pernah query tabel user — jangan
> tergoda menyinkronkannya tanpa alasan.

Kolom yang dipakai gRPC juga perlu ditambahkan ke `proto/user.proto` dan
mapping di `grpc-service/src/server/user_service_impl.rs` — lihat skill
`technostock-feature` → `references/grpc-proto.md`.

## Jalur 3 — Schema `message` (Rust, sqlx) — on-hold

Migrasi di `realtime-service/migrations/`. Fitur chat sedang on-hold; konfirmasi
dulu sebelum mengubah.

**Wajib bila menyentuh makro `sqlx::query!`/`query_as!`:**

```bash
cd realtime-service
cargo sqlx prepare        # butuh DATABASE_URL hidup
git add .sqlx/
```

`realtime-service` adalah **satu-satunya** crate yang memakai makro
compile-time. `Dockerfile.unified.prod` memakai `SQLX_OFFLINE=true`, jadi cache
`.sqlx/query-*.json` yang basi = build prod pecah. Perintah ini tidak ada di
Makefile mana pun.

`auth-service`, `grpc-service`, dan `shared-core` memakai
`sqlx::query_as::<_, User>(&format!(...))` + `.bind()` (runtime-checked) — tidak
butuh `.sqlx/`.

---

## `_sqlx_migrations` yang dipakai bersama

`auth-service` dan `realtime-service` memakai `DATABASE_URL` yang sama, jadi
berbagi satu tabel `public._sqlx_migrations`. `auth-service` punya 2 migrasi
yang tidak dimiliki `realtime-service`.

Sudah ditangani dengan `set_ignore_missing(true)` di kedua `main.rs`, plus flag
`--ignore-missing` pada CLI di `entrypoint.sh` dan `command:` compose dev.

Konsekuensinya:
- Kedua direktori migrasi **tidak perlu** disinkronkan.
- sqlx tidak lagi memperingatkan bila ada migrasi yang benar-benar hilang.
- **Checksum tetap divalidasi.** Jangan pernah mengubah isi file migrasi yang
  sudah ter-apply — buat file baru.

> Target `make migrate` di `auth-service/Makefile` dan
> `realtime-service/Makefile` sudah memakai `--ignore-missing`.

## Konvensi nilai

| Nilai | Arti |
|---|---|
| `duration_months = 0` | Lifetime |
| `end_date = NULL` | Lifetime |
| `quota = NULL` | Tanpa batas |
| Role | `Admin`, `SuperAdmin`, `User`, `Maintainer`, `Member` (CHECK constraint) |
| Status user | `Active`, `Suspended` (CHECK constraint) |
| Status langganan | `Active`, `Expired`, `Cancelled` — **konstanta Go saja**, tanpa CHECK |
| Status transaksi | `pending`, `settlement`, `failed`, `expired` (huruf kecil) — konstanta Go saja. Kolom punya `default:'PENDING'` yang tidak pernah terpakai |

## Jebakan integritas

| Jebakan | Akibat |
|---|---|
| Tidak ada FK dari `main.*` ke `users.users` | Hapus user meninggalkan langganan & transaksi yatim |
| `group_id` chat tidak pernah dipersist | Semua pesan masuk satu tabel; history global tanpa filter group |
| `last_read_at` satu kolom | Unread count berlaku global, bukan per group |
| `message.messages.sender_id` ON DELETE CASCADE | Menghapus user menghapus **semua** pesannya |
| `DeleteAccountType` | Account type **hard delete** (`Unscoped`), plan-nya soft delete |

## Inspeksi cepat

```bash
docker exec -it postgres psql -U postgres -d technostock
# atau dari host:
psql postgres://postgres:admin@localhost:5433/technostock
```

```sql
SELECT table_schema, table_name FROM information_schema.tables
WHERE table_schema IN ('users','message','main') ORDER BY 1,2;

SELECT version, description, success, installed_on FROM _sqlx_migrations ORDER BY version;

\d users.users
\d main.transactions
```

Reset total data dev:

```bash
make down-dev-volumes && make dev
```

## Checklist

- [ ] Schema yang benar sesuai pemiliknya (`users` Rust / `main` Go / `message` Rust)
- [ ] Raw SQL memakai prefix schema
- [ ] Go: entity terdaftar di `AutoMigrate`; index khusus lewat `db.Exec`
- [ ] Rust: file migrasi baru (bukan mengubah yang lama), nama `<UTCTIMESTAMP>_<nama>.sql`
- [ ] Kolom `User` baru → migrasi + `struct User` + `USER_COLUMNS` + semua konstruksi `User { ... }`
- [ ] Makro `sqlx::query!` berubah → `cargo sqlx prepare` + commit `.sqlx/`
- [ ] `docs/database.md` diperbarui
