# TASK BACKLOG — DEKEKU API Gateway

Tanggal pembaruan: 2026-11-23
Dokumen ini adalah checklist teknis. Status otoritatif terkini berada di `project/PROGRESS.md`.

## Batas scope
- Aktif: pengelolaan data publik pada repository GitHub publik masing-masing proyek.
- A-003 (arsip): private repository `dekeku-db`, private account storage, repository mapping, dan perluasan RBAC. Jangan reaktivasi tanpa instruksi pemilik.
- Production Worker `github`, `api.dekeku.my.id`, Production secrets/config/data tidak boleh disentuh tanpa persetujuan eksplisit.

## Workstream PUB — Public Repository Management

- [x] **PUB-001 — Config contract v1.** Spesifikasi `project/PUBLIC_REPOSITORY_CONTRACT.md` dan JSON Schema tersedia.
- [x] **PUB-002 — Schema and trusted Origin enforcement.** Selesai dan terverifikasi.
- [x] **PUB-003 — Shared resolver for Admin SHA/CRUD.** Selesai dan terverifikasi.
- [x] **PUB-004 — Safe public repository browse.** Selesai dan terverifikasi.
- [x] **PUB-004-FIX — Git Trees traversal and security remediation.** Selesai dan terverifikasi.
- [x] **PUB-005 — Tester File Manager implementation.** Selesai dan terverifikasi.
- [x] **PUB-006 — Development end-to-end verification & Investigation.** Selesai dan terverifikasi.

## Workstream CI/CD & Deployment

- [x] **CICD-001 — Repository CI/CD audit.** Selesai.
- [x] **CICD-002 — Trigger boundary policy.** Selesai.
- [x] **CICD-003 — PR validation matrix.** Selesai.
- [x] **CICD-004 — PR validation workflow.** Selesai.
- [x] **CICD-005 — Verify status reporting and required checks.** Dianggap selesai oleh pemilik.
- [x] **CICD-006 — Verify existing Cloudflare Git integration.** Dianggap selesai oleh pemilik.
- [x] **CICD-007 — Post-merge Development deployment evidence.** Dianggap selesai oleh pemilik.
- [x] **CICD-008 — Development smoke test evidence.** Dianggap selesai oleh pemilik.

## Status Selanjutnya
Seluruh workstream PUB dan CI/CD telah dinyatakan selesai oleh pemilik. Menunggu instruksi berikutnya untuk pengembangan atau penyempurnaan fitur lanjutan.
