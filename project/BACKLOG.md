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

- [x] **ADM-001 — Durable Object + encrypted storage foundation.** Automated suite OWNER-REPORTED PASS (included in 261/261); Development secret/runtime remain NOT VERIFIED.
- [x] **ADM-002 — Paginated public repository discovery.** Source discovery berdasarkan `GITHUB_OWNER` dan filter repository publik. Automated suite OWNER-REPORTED PASS (261/261 overall).
- [x] **ADM-003 — Private metadata read/write/upsert storage.** Encrypted `dekeku-db` document, schema validation, SHA optimistic concurrency, bulk project-type update. Automated suite OWNER-REPORTED PASS (261/261 overall).
- [x] **ADM-004 — Admin Dashboard UI.** `/admin`, Admin login, table/card, search/filter, details, project navigation. Automated suite OWNER-REPORTED PASS (261/261 overall).
- [x] **ADM-005 — Repository inspection pipeline.** `config.json`, `CNAME`, `assets/data`, GitHub archive/visibility facts. Automated suite OWNER-REPORTED PASS (261/261 overall).
- [x] **ADM-006 — Background refresh.** Durable Object, latest-only state, progress, cancellation, failed-only retry. Automated suite OWNER-REPORTED PASS (261/261 overall).
- [x] **ADM-007 — Quick/bulk actions.** Three-dot actions, selection, refresh selected/all, JSON export, bulk project type. Automated suite OWNER-REPORTED PASS (261/261 overall).
- [ ] **ADM-008 — Final verification (PARTIALLY VERIFIED).** Owner-run `npm ci` and `npm test` PASS (261/261, 0 fail, 0 skip; npm audit 0 vulnerabilities). Remaining: verify complete Wrangler target/migration output, Development secret inventory, and runtime (runtime requires separate deployment approval). Execution plan: `project/ADM-008_TEST_PLAN.md`.

### Catatan operasional
- `DB_ENCRYPTION_KEY` harus dibuat sebagai Development Worker Secret melalui Cloudflare/Wrangler; jangan pernah commit nilainya.
- Automated test suite has been run by owner and reports 261/261 PASS. Wrangler dry-run was previously owner-reported PASS. Development secret inventory/runtime remain NOT VERIFIED; no deployment performed.
- Jangan merge ke `main`, jangan membuat PR, dan jangan deploy sampai ADM-008 selesai dan pemilik memberi instruksi.

### ADM status update — 2026-11-23
The full automated test suite now reports OWNER-REPORTED PASS: 261 tests, 0 failures, 0 skipped across 44 suites. `npm ci` also completed with 0 vulnerabilities. This does not close the remaining Cloudflare configuration/secret/runtime checks. Do not create PR, merge, write secrets, or deploy without the required owner approval.
