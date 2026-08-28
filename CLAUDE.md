# CLAUDE.md

Panduan project untuk Claude Code. Isi utamanya ada di `AGENTS.md` — file yang
sama dibaca agent lain (Codex, Antigravity, Cursor, Copilot), jadi hanya ada
satu sumber kebenaran.

@AGENTS.md

## Khusus Claude Code

Skill project tersedia di `.agents/skills/` dan ter-link ke `.claude/skills/`:

| Skill | Pakai saat |
|---|---|
| `angeltrade-overview` | Orientasi awal di repo ini — peta service, invarian, jebakan |
| `angeltrade-feature` | Menambah/mengubah fitur di stack mana pun (Go, Rust, Next.js, gRPC) |
| `angeltrade-database` | Menyentuh skema, migrasi, atau query |
| `angeltrade-ops` | Menjalankan, build, deploy, atau mendiagnosis service |

Bila `.claude/skills/` kosong setelah clone (junction tidak ikut ter-commit),
buat ulang linknya:

```powershell
# Windows
Get-ChildItem .agents\skills -Directory | ForEach-Object {
  New-Item -ItemType Junction -Path ".claude\skills\$($_.Name)" -Target $_.FullName
}
```

```bash
# macOS / Linux
mkdir -p .claude/skills
for d in .agents/skills/*/; do ln -sfn "../../$d" ".claude/skills/$(basename "$d")"; done
```

Catatan: root `.dockerignore` sengaja mengecualikan `.claude/` dan `.agents/` —
tar-writer Podman di Windows gagal meng-encode reparse point. Jangan hapus baris
itu.
