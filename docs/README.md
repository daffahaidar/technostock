# Dokumentasi Technostock

Seluruh dokumentasi proyek ada di folder ini. Isinya diturunkan dari kode yang
benar-benar ada di repo saat ini — bukan dari rancangan atau rencana.

**Fokus pengembangan saat ini: manajemen user dan subscription.** Fitur forum
chat (`realtime-service`) sedang on-hold, dan `notification-service` belum
dibuat. Ringkasannya ada di
[operations.md → Status Pengembangan](operations.md#status-pengembangan).

| Dokumen | Isi |
|---|---|
| [PRD.md](PRD.md) | Produk, persona, lingkup, requirement fungsional per fitur beserta statusnya, dan daftar risiko |
| [architecture.md](architecture.md) | Peta service, routing gateway, alur autentikasi, role, dan komunikasi antar service |
| [setup.md](setup.md) | Instalasi & cara menjalankan — Docker/Podman dan manual, per sistem operasi |
| [environment.md](environment.md) | Daftar environment variable per service, mana yang wajib, dan default-nya |
| [api.md](api.md) | Referensi endpoint HTTP, WebSocket, gRPC, dan route BFF frontend |
| [database.md](database.md) | Skema PostgreSQL, migrasi, serta state di Redis / RabbitMQ / MinIO |
| [operations.md](operations.md) | Status pengembangan, perintah Makefile, deploy via Docker Hub, dan daftar isu yang diketahui |

## Mulai dari mana

- Baru pertama kali menjalankan repo → [setup.md](setup.md)
- Ingin paham produk & status tiap fitur → [PRD.md](PRD.md)
- Ingin paham cara service saling bicara → [architecture.md](architecture.md)
- Mengintegrasikan frontend/klien lain → [api.md](api.md)
- Menambah kolom atau tabel → [database.md](database.md)

## Untuk AI coding agent

[`AGENTS.md`](../AGENTS.md) di root adalah titik masuk untuk Claude Code, Codex,
Antigravity, Cursor, dan Copilot: peta service, invarian, jebakan, konvensi per
stack, dan resep menambah fitur. [`CLAUDE.md`](../CLAUDE.md) hanya menunjuk ke
sana plus catatan khusus Claude Code.

Skill yang lebih dalam ada di [`.agents/skills/`](../.agents/skills/) dan
ter-link ke `.claude/skills/`:

| Skill | Untuk |
|---|---|
| `technostock-overview` | Orientasi awal — baca sebelum menyentuh kode |
| `technostock-feature` | Menambah fitur/endpoint/halaman di stack mana pun |
| `technostock-database` | Skema, migrasi, query |
| `technostock-ops` | Menjalankan, build, deploy, troubleshooting |

## Konvensi

- Setiap tabel dan angka di dokumen ini menunjuk ke file kode yang jadi
  sumbernya. Kalau kode berubah, dokumen yang menyebut file tersebut ikut
  diperbarui.
- Perilaku yang **belum** berfungsi dicatat eksplisit di
  [operations.md → Isu yang Diketahui](operations.md#isu-yang-diketahui), bukan
  ditulis seolah sudah jalan.
- Rencana ke depan (migrasi broker, service baru) hanya ditulis di
  [operations.md → Status Pengembangan](operations.md#status-pengembangan) dan
  ditandai jelas sebagai rencana. Dokumen lain menjelaskan kode apa adanya.
