# Resep: endpoint baru di `auth-service` (Rust)

Stack: Rust 2021, Axum 0.8.1, sqlx 0.8.3 (runtime-checked, **tanpa** makro),
`shared-core` sebagai path dependency.

## Struktur layer

```
routes/api.rs → handlers/ → usecases/ → shared-core repository → Postgres (schema users)
```

| Layer | Tugas | Tidak boleh |
|---|---|---|
| `handlers/` | Ekstrak Axum, validasi, ambil requester dari DB, panggil usecase, bungkus envelope | Logika bisnis |
| `usecases/` | Otorisasi berbasis `Role`, hashing, komposisi entity, panggil repository | Tahu Axum atau HTTP status |
| `shared-core/.../repositories/` | SQL | Logika bisnis |
| `utils/` | Envelope sukses + adapter validator | — |

`auth-service/src/config/mod.rs` **kosong dan tidak ter-declare** — env dibaca
langsung di `main.rs`. Jangan pakai folder itu.

## Langkah 1 — (opsional) DTO di `shared-core`

`shared-core/src/domain/dtos.rs` — semua DTO ada di satu file.

```rust
#[derive(Debug, Deserialize)]
pub struct CreateArticleDto { pub title: String }

#[derive(Debug, Serialize, Deserialize)]
pub struct ArticleResponseDto { pub id: Uuid, pub title: String }
```

Jangan taruh `#[derive(Validate)]` di sini — validasi hidup di struct request
per-handler.

## Langkah 2 — (opsional) Method repository

Trait: `shared-core/src/domain/repositories/user_repository.rs`

```rust
async fn suspend_user(&self, user_id: Uuid, reason: String) -> Result<(), AppError>;
```

> Menambah method ke trait memecah build **semua** implementor. Saat ini hanya
> ada satu (`PostgresUserRepository`), tapi cek dulu.

Impl: `shared-core/src/infrastructure/repositories/postgres_user_repository.rs`

```rust
async fn suspend_user(&self, user_id: Uuid, reason: String) -> Result<(), AppError> {
    sqlx::query("UPDATE users.users SET status = $1, updated_at = NOW() WHERE id = $2")
        .bind(UserStatus::Suspended)
        .bind(user_id)
        .execute(&self.pool)
        .await
        .map_err(AppError::DatabaseError)?;
    Ok(())
}
```

Aturan repository:
- Tabel **selalu** `users.users`.
- Query yang mengembalikan `User`: `format!("SELECT {} FROM users.users WHERE ...", USER_COLUMNS)`
  + `sqlx::query_as::<_, User>(&query)`. `USER_COLUMNS` = konstanta di baris ~18.
- Executor: `fetch_optional` (find-one) · `fetch_all` (list) · `fetch_one`
  (INSERT/UPDATE `RETURNING`) · `execute` (void).
- Selalu `.map_err(AppError::DatabaseError)?`.
- Ada UNIQUE constraint → tangani kode sqlx `"23505"` → `AppError::EmailAlreadyExists`
  (atau varian baru).
- **Runtime-checked, bukan makro** — jadi `auth-service`/`shared-core` tidak
  butuh `.sqlx/`.

## Langkah 3 — (opsional) Varian error baru

`shared-core/src/infrastructure/errors.rs`: tambah varian + arm di `match self`
pada `into_response` (status + message). Bila status HTTP-nya di luar
404/400/401/403/409, tambahkan juga ke `match status` agar `meta.status` tidak
jatuh ke `"Error"`.

## Langkah 4 — Usecase

`auth-service/src/usecases/<modul>.rs`. Boilerplate wajib, identik di 10 usecase
yang ada:

```rust
use std::sync::Arc;
use shared_core::domain::entities::user::Role;
use shared_core::domain::repositories::user_repository::UserRepository;
use shared_core::infrastructure::errors::AppError;

pub struct SuspendUserUseCase<R: UserRepository> {
    user_repository: Arc<R>,
}

impl<R: UserRepository> SuspendUserUseCase<R> {
    pub fn new(user_repository: Arc<R>) -> Self {
        Self { user_repository }
    }

    pub async fn execute(&self, requester_role: Role, user_id: Uuid, reason: String)
        -> Result<(), AppError>
    {
        match requester_role {
            Role::Admin | Role::Maintainer => {}
            _ => return Err(AppError::Forbidden),
        }

        self.user_repository.suspend_user(user_id, reason).await?;
        Ok(())
    }
}
```

- Generic atas trait `R: UserRepository`, **dibuat ulang per-request** di handler
  — tidak disimpan di `AppState`.
- Otorisasi hidup di sini, bukan di handler.
- Error tidak pernah di-wrap ulang — `?` saja.
- Modul baru → daftarkan di `auth-service/src/usecases/mod.rs`.

## Langkah 5 — Handler

`auth-service/src/handlers/<modul>.rs`

```rust
use axum::{extract::{Path, State}, response::IntoResponse};
use serde::Deserialize;
use uuid::Uuid;
use validator::Validate;

use shared_core::domain::repositories::user_repository::UserRepository; // WAJIB agar find_by_id resolve
use shared_core::infrastructure::errors::AppError;

use crate::infrastructure::auth::middleware::AuthUser;
use crate::utils::validation::validate_request;
use crate::AppState;

#[derive(Deserialize, Validate)]
pub struct SuspendUserRequest {
    #[validate(length(min = 1, message = "Reason is required"))]
    pub reason: String,
}

pub async fn suspend_user(
    State(state): State<AppState>,
    auth_user: AuthUser,                    // hapus baris ini bila endpoint publik
    Path(user_id): Path<Uuid>,
    axum::Json(payload): axum::Json<SuspendUserRequest>,  // WAJIB argumen TERAKHIR
) -> Result<impl IntoResponse, AppError> {
    validate_request(&payload)?;

    let requester = state
        .user_repository
        .find_by_id(auth_user.claims.claims.sub)
        .await?
        .ok_or(AppError::UserNotFound)?;

    let usecase = SuspendUserUseCase::new(state.user_repository.clone());
    usecase.execute(requester.role, user_id, payload.reason).await?;

    Ok(crate::utils::response::success_response((), "User suspended"))
}
```

Aturan handler:
- `Json` / body extractor **harus argumen terakhir** (aturan Axum).
- Role diambil dari **DB**, bukan dari claim JWT — pola `find_by_id(...).ok_or(UserNotFound)?`
  berulang di semua handler user-management.
- `auth_user.claims.claims.sub` — dua level `.claims` karena `TokenData<Claims>`.
- Return `Result<impl IntoResponse, AppError>`. Sukses selalu **200**; tidak ada
  `StatusCode` eksplisit di handler mana pun.
- Envelope: `success_response(data, msg)` / `success_response_all(data)` /
  `success_response_one(data)`.
- Import yang sering terlupa: trait `UserRepository`, `validate_request`,
  `AuthUser`.
- Modul baru → daftarkan di `auth-service/src/handlers/mod.rs`.

## Langkah 6 — Route

`auth-service/src/routes/api.rs`

```rust
.route("/users/{id}/suspend", post(suspend_user))
```

- Sintaks path param **Axum 0.8**: `{id}`, bukan `:id`.
- Method berbeda pada path sama digabung: `.route("/x", get(a).post(b))`.
- Router di-nest di `/api/v1` oleh `main.rs`, jadi path final =
  `/api/v1/users/{id}/suspend`.
- Gateway sudah meneruskan `/api/v1/users/*` ke auth-service — tidak perlu ubah
  `gateway.rs`.

## Langkah 7 — `main.rs` (hanya bila perlu)

Sentuh hanya jika:
- Butuh dependency baru → tambah field ke `struct AppState`, baca `env::var`,
  konstruksi `Arc<...>`, masukkan ke literal `AppState { ... }`.
- Memakai method HTTP di luar GET/POST/PUT/DELETE → tambahkan ke
  `.allow_methods([...])` pada `CorsLayer`.
  > **Catatan:** `PATCH` saat ini **tidak** terdaftar di CorsLayer walau route
  > `PATCH /users/{id}/status` ada.

## Aliran error

```
sqlx::Error → AppError::DatabaseError   (di repository, eksplisit)
            → `?` di usecase (+ error domain: Forbidden, UserNotFound, ...)
            → `?` di handler
            → AppError::into_response()
            → (StatusCode, Json{meta:{status,message}, results:null})
```

Satu tipe error dari sqlx sampai HTTP. **Jangan wrap ulang antar layer.**

Jalur yang **tidak** lewat `AppError`: body JSON invalid → 422 teks polos;
`Path<Uuid>` bukan UUID → 400 teks polos. Tidak ada custom rejection handler.

## Kolom baru pada `User`

Empat tempat harus diubah, semuanya wajib:

1. Migrasi `auth-service/migrations/<UTCTIMESTAMP>_<nama>.sql` — qualify
   `users.` (tabel sudah dipindah schema oleh migrasi `20260418000000`).
2. Field di `shared-core/src/domain/entities/user.rs → struct User`.
3. Konstanta `USER_COLUMNS` di `postgres_user_repository.rs`.
4. **Semua** tempat `User { ... }` dikonstruksi: `usecases/auth.rs` (3 lokasi),
   `usecases/user_management.rs` (1 lokasi).

> `realtime-service` punya salinan `struct User` sendiri yang **tidak** ikut
> berubah. Itu memang sudah tidak sinkron (`discord_username` tidak ada di sana)
> dan tidak masalah selama realtime-service tidak query tabel user.

## Verifikasi

```bash
cd auth-service && cargo check
```

Dev container memakai `cargo watch --poll`. `cargo clippy` tidak dikonfigurasi
di repo ini.
