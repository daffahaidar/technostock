---
name: angeltrade-feature
description: Resep langkah-per-langkah menambah atau mengubah fitur di repo AngelTrade — resource CRUD baru di main-service (Go/Fiber v3/GORM), endpoint baru di auth-service (Rust/Axum/sqlx), RPC baru di UserService (proto + tonic + regenerate pb Go), modul CRUD admin baru di frontend (Next.js 16 App Router, TanStack Query, AG Grid, react-hook-form + zod), dan handler chat di realtime-service. Berisi file apa saja yang harus dibuat, urutannya, boilerplate wajib, dan checklist verifikasi. Gunakan saat diminta menambah fitur, endpoint, halaman, tabel admin, RPC, atau resource baru di repo angeltrade.
---

# Menambah Fitur di AngelTrade

Prasyarat: baca skill `angeltrade-overview` dulu (peta service + invarian).

Prinsip: **tiru pola tetangga.** Repo ini punya gaya yang konsisten per stack.
Jangan memperkenalkan library, layer, atau abstraksi baru tanpa alasan yang
dinyatakan eksplisit.

## Pilih resep

| Yang diminta | Baca |
|---|---|
| Resource CRUD baru (produk, artikel, promo, dst.) di backend Go | [references/go-main-service.md](references/go-main-service.md) |
| Endpoint auth/user baru di Rust | [references/rust-auth-service.md](references/rust-auth-service.md) |
| RPC baru antar service | [references/grpc-proto.md](references/grpc-proto.md) |
| Halaman admin + tabel CRUD di frontend | [references/nextjs-frontend.md](references/nextjs-frontend.md) |
| Handler atau event chat | [references/realtime-service.md](references/realtime-service.md) |
| Kolom/tabel database | skill `angeltrade-database` |

Fitur end-to-end biasanya menyentuh **tiga** resep: database → backend →
frontend, plus route gateway bila dipanggil browser.

## Urutan kerja fitur end-to-end

1. **Tentukan pemilik data.** Domain bisnis (langganan, katalog, pembayaran) →
   `main-service` (Go, schema `main`). Identitas user → `auth-service` +
   `shared-core` (Rust, schema `users`). Chat → `realtime-service` (schema
   `message`, tapi **on-hold**).
2. **Skema dulu.** Go: tambah struct + daftarkan di `AutoMigrate`. Rust: tulis
   file migrasi sqlx.
3. **Backend:** entity/usecase/handler/route.
4. **Gateway:** bila browser memanggilnya, pastikan path-nya ter-route di
   `grpc-service/src/gateway.rs`. Prefix yang sudah ada: `/api/v1/auth`,
   `/api/v1/users`, `/api/v1/main`, `/ws`. Endpoint `main-service` otomatis
   aman bila dipanggil sebagai `/api/v1/main/<path>`.
5. **Frontend:** folder route-scoped (`_queries`/`_mutations`/`_schemas`/`_table`)
   + halaman + entri menu. Tidak ada `src/modules/`.
6. **Dokumen:** perbarui `docs/api.md`, `docs/database.md`, dan `docs/PRD.md`
   bila kontrak/skema/status berubah.

## Aturan lintas stack

- **Otorisasi wajib di backend.** `proxy.ts` hanya UX.
- **Endpoint admin** memakai `RequireRole("Admin", "SuperAdmin", "Maintainer")`
  (Go) atau cek `Role` di usecase (Rust).
- **Uang & kuota:** reservasi atomik, idempoten, lepas kuota saat gagal. Rujukan
  kanonik: `main-service/usecases/user_subscription_usecase.go → BuySubscription`.
- **Efek samping gRPC** (update role, discord) bersifat best-effort: log bila
  gagal, jangan batalkan transaksi DB. Ini pola yang sudah ada — ikuti agar
  konsisten, dan sebutkan risikonya bila relevan.
- **Bahasa pesan error:** Indonesia untuk yang dilihat end-user, Inggris untuk
  teknis/admin.

## Checklist sebelum menyatakan selesai

- [ ] Pola mengikuti file tetangga (bukan gaya baru)
- [ ] Otorisasi ada di backend, bukan hanya frontend
- [ ] Raw SQL memakai prefix schema (`main.`, `users.`, `message.`)
- [ ] Endpoint browser dapat ditembus lewat gateway `:8080`
- [ ] Compile bersih: `cargo check` / `go vet ./... && go build ./...` / `npx tsc --noEmit && npm run lint && npm run build`
- [ ] Makro `sqlx::query!` di `realtime-service` berubah → `cargo sqlx prepare` + commit `.sqlx/*.json`
- [ ] Kolom baru pada `User` → ditambahkan juga ke `USER_COLUMNS` dan semua tempat `User { ... }` dikonstruksi
- [ ] RPC baru → `main-service/pb/*.go` diregenerate dan di-commit
- [ ] Dokumen di `docs/` diperbarui bila kontrak berubah
- [ ] Cara verifikasi manual dijelaskan (repo tidak punya test)
