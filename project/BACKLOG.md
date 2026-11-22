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

## Workstream ADM — Centralized Admin Dashboard (owner-approved 2026-11-23)

Instruksi pemilik: implementasikan seluruh ADM-001..ADM-007 terlebih dahulu; jalankan pengujian menyeluruh setelah implementasi selesai pada ADM-008. Jangan menandai kode sebagai VERIFIED sebelum test aktual.

- [x] **ADM-001 — Durable Object + encrypted storage foundation.** Source, binding dan migration sudah ditambahkan ke `dev`; `DB_ENCRYPTION_KEY` Dev belum diverifikasi. IMPLEMENTED — NOT TESTED.
- [x] **ADM-002 — Paginated public repository discovery.** Source discovery berdasarkan `GITHUB_OWNER` dan filter repository publik. IMPLEMENTED — NOT TESTED.
- [x] **ADM-003 — Private metadata read/write/upsert storage.** Encrypted `dekeku-db` document, schema validation, SHA optimistic concurrency, bulk project-type update. IMPLEMENTED — NOT TESTED.
- [x] **ADM-004 — Admin Dashboard UI.** `/admin`, Admin login, table/card, search/filter, details, project navigation. IMPLEMENTED — NOT TESTED.
- [x] **ADM-005 — Repository inspection pipeline.** `config.json`, `CNAME`, `assets/data`, GitHub archive/visibility facts. IMPLEMENTED — NOT TESTED.
- [x] **ADM-006 — Background refresh.** Durable Object, latest-only state, progress, cancellation, failed-only retry. IMPLEMENTED — NOT TESTED.
- [x] **ADM-007 — Quick/bulk actions.** Three-dot actions, selection, refresh selected/all, JSON export, bulk project type. IMPLEMENTED — NOT TESTED.
- [ ] **ADM-008 — Final verification (READY / NOT RUN).** Security review, unit/integration/regression tests, Wrangler dry-run/build, Dev secret/binding/runtime verification, evidence index. Execution plan: `project/ADM-008_TEST_PLAN.md`.

### Catatan operasional
- `DB_ENCRYPTION_KEY` harus dibuat sebagai Development Worker Secret melalui Cloudflare/Wrangler; jangan pernah commit nilainya.
- Test dan deployment belum dilakukan. Status seluruh ADM-001..ADM-007 tetap NOT TESTED.
- Jangan merge ke `main`, jangan membuat PR, dan jangan deploy sampai ADM-008 selesai dan pemilik memberi instruksi.