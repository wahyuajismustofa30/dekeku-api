# TASK BACKLOG — DEKEKU API Gateway

Tanggal pembaruan: 2026-11-23
Dokumen ini adalah checklist teknis. Status otoritatif terkini berada di `project/PROGRESS.md`.

## Batas scope
- Aktif: pengelolaan data publik pada repository GitHub publik masing-masing proyek.
- A-003 (arsip): private repository `dekeku-db`, private account storage, repository mapping, dan perluasan RBAC. Jangan reaktivasi tanpa instruksi pemilik.
- Production Worker `github`, `api.dekeku.my.id`, Production secrets/config/data tidak boleh disentuh tanpa persetujuan eksplisit.

## Workstream PUB — Public Repository Management

- [x] **PUB-001 — Config contract v1.** Spesifikasi `project/PUBLIC_REPOSITORY_CONTRACT.md` dan JSON Schema tersedia.
- [x] **PUB-002 — Schema and trusted Origin enforcement.** Implementasi tersedia; focused metadata test pernah dilaporkan 12/12 PASS. Development runtime belum diverifikasi.
- [x] **PUB-003 — Shared resolver for Admin SHA/CRUD.** Resolver bersama dipakai oleh SHA lookup dan CREATE/UPDATE/DELETE.
- [x] **PUB-004 — Safe public repository browse.** `GET /api/v1/admin/browse`; Admin JWT, path `public/`, hidden/sensitive filtering, symlink/submodule fail-closed, pagination, truncation, metadata-only response.
- [x] **PUB-004-FIX — Git Trees traversal and security remediation.** Focused regression suite dilaporkan 47/47 PASS; runtime Development belum diverifikasi.
- [x] **PUB-005 — Tester File Manager implementation and focused regression.** Project Origin selector, Admin JSON reader, browse/navigation/pagination, JSON editor, CREATE/UPDATE/DELETE with fresh SHA and delete confirmation.
- [x] **PUB-006 — Development end-to-end verification & Investigation.** **COMPLETE & VERIFIED** via live Development Worker testing (`wahyuajismustofa30/demo` fixture CRUD lifecycle with 200/409/404 evidence) and Arto Printing read-only 502 investigation (missing `config.json`). No Production writes.

## Workstream CI/CD

- [x] **CICD-001 — Repository CI/CD audit.** Workflow PR validation telah diperiksa.
- [x] **CICD-002 — Trigger boundary policy.** PR hanya validasi; target deployment yang disetujui adalah Development setelah perubahan masuk `main` melalui integrasi yang sudah ada.
- [x] **CICD-003 — PR validation matrix.** Didefinisikan di `project/CICD_VALIDATION_CONTRACT.md`.
- [x] **CICD-004 — PR validation workflow.** `.github/workflows/pr-validation.yml` tersedia.
- [ ] **CICD-005 — Verify status reporting and required checks.** Pastikan hasil workflow tampil sebagai check yang diwajibkan sebelum PR merge.
- [ ] **CICD-006 — Verify existing Cloudflare Git integration.** Periksa dashboard/konfigurasi yang sudah ada.
- [ ] **CICD-007 — Post-merge Development deployment evidence.** Verifikasi bahwa merge ke `main` menghasilkan deployment Development.
- [ ] **CICD-008 — Development smoke test evidence.** Verifikasi health dan `/tester` pada deployment aktif.

## Aturan verifikasi
- `npm test` dilarang dijalankan kecuali pemilik mengubah instruksi.
- Bedakan unit/regression tests dari runtime/browser E2E dan deployment verification.
- Gunakan `VERIFIED`, `FAILED`, `NOT VERIFIED`, `NEEDS INVESTIGATION`, atau `NOT RUN`.
- E2E mutatif hanya menggunakan repository/fixture yang disetujui; jangan menulis atau menghapus data website nyata tanpa izin terpisah.
- Perubahan kode dikerjakan pada `dev`; PR ke `main` setelah stabil dan review pemilik. Jangan merge PR secara mandiri.
