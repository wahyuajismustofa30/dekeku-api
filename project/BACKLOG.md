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

## Workstream PUB-DATA — Extensible Public Data API (ACTIVE, owner-approved 2026-11-23)

Rincian kontrak, desain, acceptance criteria, keamanan, dan batas operasional: `project/PUBLIC_DATA_API_PLAN.md`.

- [x] **PUB-DATA-001 — API Contract.** IMPLEMENTED on GitHub; implementation present on dev. Definisikan `POST /api/v1/public/data/{resource}`, request/response, status/error contract.
- [x] **PUB-DATA-002 — Resource Registry.** IMPLEMENTED on GitHub; focused Termux validation owner-reported PASS (14/14); tested SHA pending confirmation. Server-side allowlist, enabled flag, validator, fixed storage path, JSON shape, per-resource limits.
- [x] **PUB-DATA-003 — Shared Storage Engine.** IMPLEMENTED on GitHub; Termux validation pending. Bounded body parsing, Origin enforcement, Project Origin resolver, repository validation, GitHub write, SHA concurrency, safe errors.
- [x] **PUB-DATA-004 — Guestbook Migration.** IMPLEMENTED on GitHub; Termux validation pending. Jadikan Guestbook resource pertama dengan kompatibilitas payload dan storage berdasarkan source aktual.
- [x] **PUB-DATA-005 — Legacy Compatibility.** IMPLEMENTED on GitHub; Termux validation pending. Pertahankan `POST /api/v1/public/submit` sebagai alias ke handler Guestbook yang sama.
- [x] **PUB-DATA-006 — Security & Integration Tests.** OWNER-REPORTED Termux PASS: 14/14 focused tests; exact tested SHA not supplied, so PR candidate validation gate remains pending. Uji validasi, Origin, limits, resolver, repository, concurrency, alias, dan public no-JWT flow menggunakan mock/fixture.
- [x] **PUB-DATA-007 — Documentation & Checkpoint.** IMPLEMENTED on GitHub. Documentation synchronized; owner-reported focused validation recorded.

Historical planning note from before implementation. Superseded by the current status in `project/PROGRESS.md` and the validation evidence `PUBDATA-TERMUX-02` in `project/EVIDENCE.md`.
Tidak ada GET API publik baru pada fase awal; website membaca file langsung dari repository publik/CDN.

## Status Selanjutnya
Prioritas aktif adalah PUB-DATA-001 s.d. PUB-DATA-007. Admin Dashboard ADM-001..ADM-008 dijeda sementara sesuai keputusan terbaru pemilik; seluruh pekerjaan yang sudah ada dipertahankan dan tidak dihapus.

## Workstream ADM — Centralized Admin Dashboard (PAUSED 2026-11-23)

Workstream ini dijeda sementara oleh instruksi eksplisit pemilik yang lebih baru. Seluruh implementasi, test, dokumen, dan blocker yang tercatat di bawah tetap dipertahankan sebagai status historis/terakhir; jangan hapus atau lanjutkan perubahan Dashboard selama PUB-DATA menjadi prioritas aktif kecuali diminta pemilik.


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


### PUB-DATA implementation status — 2026-11-23

PUB-DATA-001..005 and PUB-DATA-007 are implemented on GitHub branch `dev`. PUB-DATA-006 focused tests are owner-reported PASS (14/14) from Termux; 7 source syntax checks also passed. Exact tested local SHA is unknown and must be matched against PR #29 head before treating that PR candidate as test-verified. Full suite, remote integration, live write, Worker runtime, and deployment remain NOT VERIFIED. PR #29 exists and remains unmerged. Admin Dashboard remains paused.
