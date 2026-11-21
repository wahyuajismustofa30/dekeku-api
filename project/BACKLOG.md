# BACKLOG — DEKEKU API Gateway

*Catatan Acuan*: Rincian progres fitur ada di [PROGRESS.md](PROGRESS.md). Rekomendasi teknis dan kriteria penerimaan ada di [RECOMMENDATIONS.md](RECOMMENDATIONS.md).

## High Priority (Security & Reliability)
- [x] Perbaikan Temuan Kode Write Engine (F-01 s/d F-04) - COMPLETED & VERIFIED.
- [x] Penyesuaian Tes Legacy Core (18/18 PASS in `test/github-core.test.js`) - COMPLETED & VERIFIED.
- [x] **P0 — R-001:** Pembatasan origin Tester Dashboard untuk mencegah pengiriman JWT ke origin eksternal — IMPLEMENTED.
- [x] **P1 — R-004:** Hardening validasi wildcard CORS — IMPLEMENTED.
- [x] **P1 — R-005:** Pemisahan test lokal dan remote Development — IMPLEMENTED.
- [ ] **P1 — R-006:** Verifikasi konfigurasi Cloudflare WAF rate limiting untuk `POST /api/v1/admin/login` (NOT VERIFIED sampai ada bukti runtime).
- [ ] Failed-login Audit Logging (R-007), tanpa merekam secret atau data sensitif.
- [x] **P1 — R-002:** Dashboard Tester mengikuti kontrak respons login `access_token` — IMPLEMENTED.
- [x] **P1 — R-003:** Header JSON dan penanganan submit Guestbook Dashboard — IMPLEMENTED.

## Medium Priority (Features & Refinements)
- [x] Phase 2.3: Guestbook Module (`POST /api/v1/public/submit`) - COMPLETED & VERIFIED (PR #7 MERGED).
- [x] Automatic SHA retrieval for Write Engine Tester (authenticated lookup endpoint + tester integration; regression tests added, verification pending).
- [ ] Integrasi Frontend Statis dengan endpoint publik.
- [ ] JWT Revocation.
- [ ] Reduksi Metadata Public Endpoints.
- [ ] Validasi Tipe Konten File.
- [ ] GitHub Client Retry Logic.

## Low Priority (Maintenance)
- [x] **R-008:** Sinkronisasi dokumentasi test, status fitur, changelog, dan checkpoint berdasarkan laporan hasil tes terbaru; provenance dicatat sebagai laporan pengguna.
- [ ] **R-009:** Dokumentasikan prosedur rotasi secret dan persyaratan password admin.
- [ ] **R-010:** Evaluasi migrasi Personal Access Token ke GitHub App.
- [ ] **R-011:** Evaluasi Workers Analytics Engine untuk metrik agregat.
- [ ] Structured Logging.
- [ ] API Versioning Strategy.

## Status Implementasi R-001 s/d R-005 (2026-11-21)
- Source changes telah diterapkan pada `src/modules/tester/index.js` dan `public/tester.html`.
- Regression test baru ditambahkan pada `test/tester-dashboard.test.js` dan dimasukkan ke script `npm test`.
- Isolated JavaScript harness terhadap Dashboard aktual: PASS untuk same-origin, pemisahan JWT publik/admin, login `access_token`, penanganan 401, JSON Guestbook, dan double-submit.
- CORS isolated harness: PASS untuk exact origin, wildcard subdomain, apex exclusion, dan 9 kelas origin yang ditolak.
- R-005: `npm test` memakai daftar suite lokal eksplisit; `npm run test:remote` terpisah. Global fetch mocks dipulihkan melalui `afterEach`/`finally`.
- `npm run check`: PASS dan `npm test`: 149 PASS, 0 FAIL, 0 SKIP berdasarkan laporan pengguna (21-11-2026, branch `dev`, commit `a6a089d`). Remote test: NOT RUN. Deployment/runtime Development: NOT VERIFIED. R-001 s/d R-005 ditutup pada sisi implementasi; verifikasi runtime tetap terpisah.

## Catatan Status
- Item yang belum dicentang adalah pekerjaan yang belum dinyatakan selesai.
- Persetujuan keputusan arsitektur tidak sama dengan bukti konfigurasi runtime telah diterapkan.
- Jangan menandai item selesai hanya berdasarkan rekomendasi atau dokumentasi; wajib ada bukti implementasi dan tes.


## RBAC Program — Approved Tasks (2026-11-21)
See [RBAC_PLAN.md](RBAC_PLAN.md) for approved architecture, endpoint inventory, acceptance criteria, and full task breakdown.
- [ ] **RBAC-01** — Private account storage and repository mapping in `dekeku-db`.
- [ ] **RBAC-02** — Role, audience, and ownership middleware (Admin/User isolation).
- [x] **RBAC-03** — Admin account and repository management endpoints (IMPLEMENTED — NOT VERIFIED).
- [x] **RBAC-04** — User login and 30-minute User JWT (IMPLEMENTED — NOT VERIFIED).
- [x] **RBAC-05** — User CRUD restricted to owned repositories under `assets/data/` (IMPLEMENTED — NOT VERIFIED).
- [ ] **RBAC-06** — Enforce private/public data boundary and close unintended public reads.
- [ ] **RBAC-07** — Route Guestbook submissions to each mapped website repository.
- [ ] **RBAC-08** — Browser User session using sessionStorage and safe logout/401 cleanup.
- [ ] **RBAC-09** — Security, regression, and isolation review.
- **Latest status**: RBAC-01 through RBAC-05 are IMPLEMENTED — NOT VERIFIED. RBAC-06 is the next implementation stage. Design approval is not implementation evidence.
- **Verification at initial checkpoint**: `npm test` NOT RUN per user instruction; syntax checks NOT RUN; Development runtime NOT VERIFIED. See subsequent stage records.



## RBAC-01 Progress (2026-11-21)
- [x] Add private account and repository-mapping document schemas with strict validation.
- [x] Add exact private path allowlist and GitHub Contents API read/create/update helpers with SHA concurrency.
- [x] Add focused storage/schema test file and register it in local test script.
- [ ] Run RBAC-01 tests and syntax/static checks when test execution is authorized/resumed.
- [ ] Verify private storage access against Development configuration without writing real account data.
- **Stage status**: IMPLEMENTED — NOT VERIFIED. RBAC-02 is recorded below.


## RBAC-02 Progress (2026-11-21)
- [x] Separate Admin JWT audience/role validation and preserve legacy Admin middleware export.
- [x] Add User JWT audience/role validation and active-account status check against private storage.
- [x] Add repository ownership middleware based on private mapping ID; never trust client owner/repo/branch.
- [x] Add focused RBAC auth isolation tests and register in local test script.
- [ ] Run RBAC tests and syntax/static checks when authorized/resumed.
- [ ] Verify middleware against Development runtime after User login/routes exist.
- **Stage status**: IMPLEMENTED — NOT VERIFIED. Next: RBAC-04. RBAC-01/02/03 runtime verification remains pending.


## RBAC-03 Progress (2026-11-21)
- [x] Add Admin create/list/detail User account endpoints.
- [x] Add User status enable/disable and password reset endpoints.
- [x] Add repository mapping create/list and soft-disable/update endpoints.
- [x] Protect all management routes with existing Admin JWT middleware.
- [x] Add bounded JSON parsing, exact field allowlists, PBKDF2 hashing, schema validation, and SHA concurrency.
- [x] Add focused Admin route authentication tests and register in local test script.
- [ ] Run RBAC tests and syntax/static checks when authorized/resumed.
- [ ] Verify Dev runtime with non-production test fixtures; do not create real records without explicit instruction.
- Stage status: IMPLEMENTED — NOT VERIFIED. Next: RBAC-05 User data CRUD. RBAC-01–04 runtime verification remains pending.


## RBAC-04 Progress (2026-11-21)
- [x] Add public POST /api/v1/user/login route.
- [x] Read accounts only from fixed private users.json storage.
- [x] Verify PBKDF2-SHA256 password hashes and reject disabled accounts.
- [x] Issue dekeku-user audience / user role JWT with 30-minute expiry.
- [x] Use generic authentication failure and dummy PBKDF2 verification for unknown usernames.
- [x] Add 16 KiB bounded JSON parser, content-type/UTF-8 validation, and exact request-field allowlist.
- [x] Add and register test/rbac-user-login.test.js.
- [ ] Run RBAC tests and syntax/static checks when authorized/resumed.
- [ ] Verify Development login with a dedicated non-production fixture account.
- [ ] Verify WAF/IP rate limiting before production exposure.
- Stage status: IMPLEMENTED — NOT VERIFIED. Next: RBAC-05 User data CRUD under assets/data/. RBAC-01–04 runtime verification remains pending.


## RBAC-05 Progress (2026-11-21)
- [x] Add User repository listing endpoint protected by User JWT.
- [x] Add User GET/POST/PUT/DELETE data endpoints.
- [x] Resolve repositoryId against private mapping and enforce mapping ownership against JWT subject.
- [x] Derive owner/repo/branch exclusively from private storage.
- [x] Restrict relative file paths to server-prefixed assets/data/ and JSON files; reject traversal/encoding/hidden segments.
- [x] Enforce 1 MiB JSON file limit, bounded streamed request body, strict UTF-8, and SHA requirements for update/delete.
- [x] Add and register test/rbac-user-data.test.js.
- [ ] Run RBAC tests and syntax/static checks when permitted; npm test remains NOT RUN per explicit instruction.
- [ ] Verify Development behavior with isolated fixtures and confirm ownership isolation against a second account.
- [ ] Review public reader and private/assets data boundaries (RBAC-06).
- Stage status: IMPLEMENTED — NOT VERIFIED. Next: RBAC-06. RBAC-01–05 runtime verification remains pending.
