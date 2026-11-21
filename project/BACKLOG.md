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
- [ ] **RBAC-03** — Admin account and repository management endpoints.
- [ ] **RBAC-04** — User login and 30-minute User JWT.
- [ ] **RBAC-05** — User CRUD restricted to owned repositories under `assets/data/`.
- [ ] **RBAC-06** — Enforce private/public data boundary and close unintended public reads.
- [ ] **RBAC-07** — Route Guestbook submissions to each mapped website repository.
- [ ] **RBAC-08** — Browser User session using sessionStorage and safe logout/401 cleanup.
- [ ] **RBAC-09** — Security, regression, and isolation review.
- **Latest status**: RBAC-01 and RBAC-02 foundations are IMPLEMENTED — NOT VERIFIED; RBAC-03 is the next implementation stage. Design approval is not implementation evidence.
- **Verification**: `npm test` NOT RUN per user instruction; syntax checks NOT RUN; Development runtime NOT VERIFIED.



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
- **Stage status**: IMPLEMENTED — NOT VERIFIED. Next: RBAC-03 / RBAC-04. RBAC-01 verification remains pending.
