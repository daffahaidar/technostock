# Resep: RPC baru di `UserService` (proto + Rust + Go)

Kontrak: `proto/user.proto`, satu package `user`, satu service `UserService`,
6 RPC saat ini.

Pembagian peran:
- **Server** = `grpc-service` (`build_server(true)`, `build_client(false)`)
- **Client Rust** = `realtime-service` (`build_server(false)`, `build_client(true)`)
- **Client Go** = `main-service` lewat `pb/` yang di-commit

## Langkah 1 — `proto/user.proto`

```proto
service UserService {
    ...
    rpc SuspendUser (SuspendUserRequest) returns (Empty);
}

message SuspendUserRequest {
    string user_id = 1;
    string reason = 2;
}
```

Aturan:
- **Jangan pernah pakai ulang nomor field** pada message yang sudah ada —
  tambah nomor baru di akhir. Tidak ada `reserved` di file ini, jadi disiplinnya
  manual.
- `optional` hanya bila perlu membedakan "tidak dikirim" dari "kosong".
  Saat ini `optional` dipakai pada `avatar_url`(4), `last_read_at`(5),
  `discord_username`(6).
- Reuse `Empty` (didefinisikan lokal, bukan `google.protobuf.Empty`) untuk
  response tanpa data.
- `option go_package = "main-service/pb;pb"` **hardcode ke main-service**.
  Service Go lain tidak bisa memakai output yang sama tanpa regenerasi terpisah.

### Kontrak tak tertulis yang harus diikuti

| Hal | Aturan nyata |
|---|---|
| `role` (string) | Nilai sah = `format!("{:?}", Role)` → `Maintainer` \| `Admin` \| `Member` \| `User`. **PascalCase, case-sensitive** |
| `status` (string) | `Active` \| `Suspended` |
| `last_read_at` | Dikomentari "Unix timestamp" tapi nilainya **milidetik** (`timestamp_millis()` / `from_timestamp_millis`) |
| `exclude_roles` | Difilter di aplikasi dengan perbandingan string persis, bukan di SQL |
| `ValidateToken` | Tidak pernah mengembalikan `Err(Status)` — kegagalan jadi `Ok` dengan `is_valid: false` |

## Langkah 2 — (bila perlu) method repository di `shared-core`

Lihat [rust-auth-service.md](rust-auth-service.md) Langkah 2. Ringkas: tambah
signature ke trait `UserRepository`, implementasikan di
`postgres_user_repository.rs` dengan runtime query + `.bind()` (bukan makro,
jadi tidak perlu `.sqlx/`). Tabel selalu `users.users`.

## Langkah 3 — Implementasi server di `grpc-service`

`grpc-service/src/server/user_service_impl.rs`

```rust
async fn suspend_user(
    &self,
    request: Request<SuspendUserRequest>,
) -> Result<Response<Empty>, Status> {
    let req = request.into_inner();
    let user_id = uuid::Uuid::parse_str(&req.user_id)
        .map_err(|_| Status::invalid_argument("Invalid user_id format"))?;

    self.user_repository
        .suspend_user(user_id, req.reason)
        .await
        .map_err(|_| Status::internal("Failed to suspend user"))?;

    Ok(Response::new(Empty {}))
}
```

Aturan:
- **Nama method = snake_case dari nama RPC** (`SuspendUser` → `suspend_user`).
  Salah nama → "not all trait items implemented".
- UUID: `Uuid::parse_str(...).map_err(|_| Status::invalid_argument("Invalid user_id format"))?`
- Error repo: `.map_err(|_| Status::internal("<pesan>"))?` — error asli dibuang,
  tidak di-log. Ini gaya yang ada di semua RPC.
- Enum → string keluar: `format!("{:?}", value)`.
- String → enum masuk: `match s { "Admin" => Role::Admin, ..., _ => <default> }`.
  > **Hati-hati:** `UpdateUserRole` memetakan string tak dikenal ke `Role::User`
  > secara diam-diam dan RPC tetap sukses. Untuk RPC baru, lebih baik
  > kembalikan `Status::invalid_argument` untuk nilai tak dikenal.
- Timestamp keluar: `.map(|ts| ts.timestamp_millis())`.
- Type request bisa lewat `use user_proto::{...}` atau path panjang — dua-duanya
  dipakai di file ini.
- `build.rs` tidak perlu diubah; sudah ada `cargo:rerun-if-changed=../proto/user.proto`.

## Langkah 4 — (hanya bila `realtime-service` memakainya) wrapper client Rust

`realtime-service/src/infrastructure/grpc_client.rs`

```rust
pub async fn suspend_user(&self, user_id: String, reason: String)
    -> Result<(), Box<dyn std::error::Error>>
{
    let mut client = self.client.clone();   // WAJIB clone — butuh &mut self
    client
        .suspend_user(tonic::Request::new(SuspendUserRequest { user_id, reason }))
        .await?;
    Ok(())
}
```

Tambahkan type-nya ke `use user_proto::{...}`.

> `realtime-service/build.rs` **tidak punya** `rerun-if-changed`. Bila codegen
> terasa basi setelah mengubah proto: `cargo clean -p realtime-service`.

## Langkah 5 — Regenerate `pb/` Go

**Tidak ada Makefile target, script, atau go:generate untuk ini.** File
`main-service/pb/*.go` di-commit manual.

Versi generator yang tercatat di header file saat ini (cocokkan agar diff
bersih):

- `user.pb.go` → `protoc-gen-go v1.36.12`, `protoc v7.34.1`
- `user_grpc.pb.go` → `protoc-gen-go-grpc v1.6.2`, `protoc v7.34.1`

Dari **root repo**:

```bash
protoc --go_out=. --go_opt=module=main-service \
       --go-grpc_out=. --go-grpc_opt=module=main-service \
       -I proto proto/user.proto
```

Dua file berubah dan **keduanya wajib di-commit** — kalau tidak, build Go pecah:
`main-service/pb/user.pb.go` dan `main-service/pb/user_grpc.pb.go`.

Sanity check tanpa menjalankan apa pun:

```bash
grep -n "SuspendUser" main-service/pb/user_grpc.pb.go
```

Harus memunculkan konstanta `UserService_SuspendUser_FullMethodName =
"/user.UserService/SuspendUser"`, method di `UserServiceClient`, entri di
`UserServiceServer`, dan handler di `UserService_ServiceDesc`.

## Langkah 6 — Pakai dari Go

Akses selalu lewat `AuthClient`
(`main-service/infrastructure/grpc/auth_client.go`).

**Pola A — `GetClient()` langsung** (paling umum; dipakai `member_usecase.go`,
`user_subscription_usecase.go`, `subscription_worker.go`,
`user_subscription_handler.go`):

```go
_, err := u.authClient.GetClient().SuspendUser(context.Background(), &pb.SuspendUserRequest{
    UserId: userID,
    Reason: reason,
})
```

**Pola B — wrapper method** (seperti `ValidateToken` yang sudah ada):

```go
func (c *AuthClient) SuspendUser(ctx context.Context, userID, reason string) error {
    _, err := c.client.SuspendUser(ctx, &pb.SuspendUserRequest{UserId: userID, Reason: reason})
    return err
}
```

Catatan:
- Casing Go: `user_id` → `UserId`, `discord_username` → `DiscordUsername`.
- Koneksi: `grpc.NewClient(url, insecure.NewCredentials())`, `http://` di-strip.
  **Tanpa TLS, tanpa retry, tanpa deadline.** Semua call site memakai
  `context.Background()` telanjang — konsisten walau tidak ideal.
- `AUTH_GRPC_URL` menunjuk `grpc-service:50051`, **bukan** `auth-service`.
- Efek samping (update role/discord) bersifat best-effort: bila gagal, log saja,
  jangan batalkan transaksi DB.

## Checklist

- [ ] `proto/user.proto` — RPC + message, nomor field tidak reuse
- [ ] `shared-core` trait + impl bila butuh operasi DB baru
- [ ] `grpc-service/src/server/user_service_impl.rs` — method snake_case
- [ ] `realtime-service/.../grpc_client.rs` — **hanya bila** dipakai di sana
- [ ] `protoc` regenerate → commit **kedua** file `main-service/pb/*.go`
- [ ] Call site Go
- [ ] `cd grpc-service && cargo check` dan `cd main-service && go build ./...`
- [ ] `docs/api.md` bagian gRPC diperbarui
