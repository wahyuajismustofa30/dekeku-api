# BACKLOG — DEKEKU API Gateway

*Catatan Acuan*: Rincian progres fitur ada di [PROGRESS.md](PROGRESS.md). Rekomendasi teknis dan kriteria penerimaan ada di [RECOMMENDATIONS.md](RECOMMENDATIONS.md).

> **Penting:** bagian prioritas dan checklist historis di bawah bukan antrean kerja aktif. Status tunggal ada di `PROGRESS.md`; satu-satunya urutan kerja aktif ada di `EXECUTION_POLICY.md`. Item yang tidak aktif atau diarsipkan tidak boleh dilanjutkan otomatis.

## High Priority (Security & Reliability)
- [x] Perbaikan Temuan Kode Write Engine (F-01 s/d F-04) - COMPLETED & VERIFIED.
- [x] Penyesuaian Tes Legacy Core (18/18 PASS in `test/github-core.test.js`) - COMPLETED & VERIFIED.
- [x] **P0 — R-001:** Pembatasan origin Tester Dashboard untuk mencegah pengiriman JWT ke origin eksternal — IMPLEMENTED.
- [x] **P1 — R-004:** Hardening validasi wildcard CORS — IMPLEMENTED.
- [x] **P1 — R-005:** Pemisahan test lokal dan remote Development — IMPLEMENTED.
- [DEFERRED] **P1 — R-006:** Verifikasi Cloudflare WAF rate limiting ditunda atas keputusan pemilik proyek. Jangan konfigurasi atau verifikasi sebelum diminta.
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
- [x] **RBAC-01** — Private account storage and repository mapping in `dekeku-db`.
- [x] **RBAC-02** — Role, audience, and ownership middleware (Admin/User isolation).
- [x] **RBAC-03** — Admin account and repository management endpoints (IMPLEMENTED — NOT VERIFIED).
- [x] **RBAC-04** — User login and 30-minute User JWT (IMPLEMENTED — NOT VERIFIED).
- [x] **RBAC-05** — User CRUD restricted to owned repositories under `assets/data/` (IMPLEMENTED — NOT VERIFIED).
- [x] **RBAC-06** — Enforce private/public data boundary and close unintended public reads (IMPLEMENTED — NOT VERIFIED; regression suite added, not run).
- [x] **RBAC-07** — Route Guestbook submissions to each mapped website repository.
- [x] **RBAC-08** — Browser User session using sessionStorage and safe logout/401 cleanup (IMPLEMENTED — NOT VERIFIED).
- [x] **RBAC-09** — Security, regression, and isolation test cases added (TESTS ADDED — NOT VERIFIED); verification tasks remain open.
- **Latest status**: RBAC-01 through RBAC-08 are IMPLEMENTED — NOT VERIFIED. RBAC-09 regression tests are already added; the current stage is syntax/static and Development verification, not feature implementation. Design approval is not implementation evidence.
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


## RBAC-06 Progress (2026-11-21)
- [x] Review public file reader and confirm validation is enforced before GitHub upstream access.
- [x] Confirm exact private storage allowlist remains separate from public reader.
- [x] Confirm User `assets/data/` operations use separate User JWT + ownership routes and cannot be reached through public reader.
- [x] Add `test/rbac-boundary.test.js` for private/assets path denial, traversal/hidden paths, and Admin/User/Guest route separation.
- [x] Register the boundary regression suite in `package.json`.
- [ ] Run the new suite and syntax/static checks; `npm test` remains NOT RUN per explicit instruction.
- [ ] Verify Development runtime without modifying Production.
- Stage status: IMPLEMENTED — NOT VERIFIED. Next: RBAC-07 Guestbook per mapped website repository.


## RBAC-07 Progress (2026-11-21)
- [x] Resolve request Origin through the shared HTTPS allowlist.
- [x] Read and validate private user/mapping documents from central `dekeku-db`.
- [x] Require an active exact Origin mapping; reject unregistered Origin.
- [x] Derive destination owner/repository/branch exclusively from private mapping; reject client-supplied destination fields.
- [x] Verify mapped target repository exists and is public for static Guestbook reads.
- [x] Write only to fixed `assets/data/bukutamu.json`; keep legacy `public/data/{hostname}/bukutamu.json` untouched.
- [x] Preserve strict JSON/UTF-8 validation, 15 KiB request cap, 1 MiB stored file cap, SHA concurrency, and maximum three conflict attempts.
- [x] Expand `test/public-submission.test.js`; existing npm test script already includes this file.
- [ ] Run Guestbook/RBAC regression tests and syntax/static checks; `npm test` remains NOT RUN per explicit instruction.
- [ ] Verify Development runtime with an isolated mapped public repository; do not write to real website data without approval.
- [ ] Verify/configure Cloudflare WAF rate limiting for `POST /api/v1/public/submit` in Development. Origin is spoofable and is not authentication.
- Stage status: IMPLEMENTED — NOT VERIFIED. Next: RBAC-09 Security & Regression Review.


## RBAC-08 Progress (2026-11-21)
- [x] Add User login UI calling `POST /api/v1/user/login`.
- [x] Persist User JWT only in `sessionStorage` under `dekeku_user_access_token`; restore on same-tab reload.
- [x] Add isolated User Bearer helper; public requests strip Authorization and Admin continues to use its separate in-memory token.
- [x] Add User logout and clear User token on 401 from User-authenticated requests.
- [x] Add User repository listing action as an authenticated session use.
- [x] Update generated Worker Tester and static `public/tester.html` copies.
- [x] Update `test/tester-dashboard.test.js` for User session storage and role-specific Authorization behavior.
- [ ] Run syntax/static checks and dashboard tests; `npm test` remains NOT RUN per explicit instruction.
- [ ] Verify session persistence/logout/401 behavior in Development browser without Production changes.
- Stage status: IMPLEMENTED — NOT VERIFIED. Next: RBAC-09 security and regression review.


## RBAC-09 Security Review (2026-11-21)
- [x] Review router, JWT role/audience checks, account status, repository ownership, private/public storage boundaries, User path validation, Guestbook mapping, CORS, and browser token handling.
- [x] Add cross-User mapping/IDOR regression scenario; assert no target repository request occurs.
- [x] Add server-authoritative repository coordinates regression scenario.
- [x] Add rejection of client-supplied owner/repo/branch fields.
- [x] Add disabled-account and expired-token regression scenarios.
- [x] Register `test/rbac-security-review.test.js` in package.json.
- [ ] Run syntax/static checks; do not run `npm test` per explicit instruction.
- [DEFERRED] WAF Development verification for User Login and Guestbook POST; owner requested to skip for now.
- [ ] Verify `assets` retrieval freshness with timestamp cache-busting query parameter; confirm CDN cache key honors query string or bypasses cache.
- [x] Owner decision R-013: immediate revocation of all pre-reset User JWTs APPROVED (D-023, 2026-11-21).
- [x] Add backward-compatible per-user tokenVersion validation/default semantics in private User records; new accounts start at version 0.
- [x] Include tokenVersion in newly issued User JWTs and validate it against the authoritative private User record in User auth and ownership middleware.
- [x] Increment tokenVersion during successful Admin password reset in the SHA-guarded users document write; reject overflow and surface SHA conflicts without overwrite.
- [x] Add focused regression tests for pre-reset token rejection, post-reset login/token acceptance, existing-record compatibility, SHA conflict handling, malformed claims, and Admin JWT non-impact. Test execution NOT RUN; do not run npm test.
- Status: TESTS ADDED — NOT VERIFIED.


## Authoritative Current Queue (2026-11-21)
The ordered execution queue is in [EXECUTION_POLICY.md](EXECUTION_POLICY.md); `PROGRESS.md` is the single source of current status.
- [x] Documentation reconciliation to the owner-approved R-013 decision and latest owner-reported verification status.
- [x] R-013 source implementation and focused regression coverage are present on `dev`.
- [x] Owner-reported Termux verification: native `node --check` PASS for all RBAC source/test files; focused `node --test test/rbac-token-version.test.js` PASS (6 PASS, 0 FAIL).
- [x] `npm test` remains NOT RUN as explicitly instructed.
- [DEFERRED / ARCHIVED] WAF and CDN/cache follow-ups are not active; do not resume archived work without explicit owner direction.
- [x] Owner selected Development CI/CD after documentation reconciliation; CICD-001 and CICD-002 are complete. See the current queue in `EXECUTION_POLICY.md`.
- Development runtime/deployment: NOT VERIFIED. Production untouched.


## Owner Decision — WAF / Assets Cache Strategy (2026-11-21)
- WAF setup/verification is deferred; do not configure it now.
- `assets` reads must return current data. Use a timestamp query parameter on every request to avoid reusing a cached URL.
- Confirm query-string cache-key handling; timestamp parameters alone are insufficient if the CDN ignores query strings.


## R-013 — Immediate User JWT Revocation (Decision Approved 2026-11-21)
- [x] Owner approved immediate invalidation of every User JWT issued before a successful password reset.
- [x] Add a backward-compatible per-user token/session version field to private account storage.
- [x] Include version in new User JWTs and compare with the authoritative account record on every authenticated User request.
- [x] Increment version as part of successful password reset using SHA-safe write/concurrency handling.
- [x] Add focused regression coverage: old token rejected immediately, new login works, legacy records remain compatible, conflict handling is safe, Admin JWTs unaffected.
- **Status saat ini**: SOURCE IMPLEMENTED on dev; owner-reported `node --check` PASS and focused test PASS (6 PASS, 0 FAIL). Development runtime/deployment NOT VERIFIED. The deployed Worker has not been verified as updated; do not assume immediate revocation is active in the deployed runtime.
- **Constraints**: work on dev only; npm test remains NOT RUN; no Production changes or deployment without explicit approval.


## R-013 Implementation Status (2026-11-21)
- [x] Backward-compatible tokenVersion field validation and version-zero behavior for legacy records.
- [x] New User creation initializes version zero; User login signs the version into User JWT.
- [x] User auth and repository ownership middleware enforce current version from private storage.
- [x] Admin password reset increments version in the same SHA-guarded account write as the new password hash.
- [x] Focused regression tests added and registered in package.json.
- [x] Owner-reported native `node --check` and focused test execution PASS (6 PASS, 0 FAIL); do not run `npm test`.
- Status: SOURCE IMPLEMENTED; focused verification PASS by owner report; integrated RBAC and Development runtime remain NOT VERIFIED; Production untouched.


## R-013 Verification Update (2026-11-21) — Current
- [x] Owner reports native `node --check` PASS for all RBAC source/test files in Termux.
- [x] Owner reports focused `node --test test/rbac-token-version.test.js`: 6 PASS, 0 FAIL.
- [x] `npm test` remains NOT RUN, per explicit instruction.
- [ ] Development runtime/deployment verification remains pending and requires explicit approval.
- [ ] Guestbook CDN/cache freshness verification remains pending.
- [DEFERRED] Development WAF verification remains deferred by owner.
- Evidence qualification: test results are recorded from the owner's report; they were not independently re-executed in this session.


## CI/CD Development Automation — Owner-Approved Tasks (2026-11-21)

**Target workflow:** local/repository development on `dev` → Pull Request to `main` after stable → PR validation → merge/update `main` → automatic deployment to Development Worker `dekeku-api-dev` only.

- [x] **CICD-001 — Audit deployment target and Wrangler configuration (CRITICAL).** READ-ONLY audit complete at dev HEAD `09df42e24ab911efa5ed2541f7e80ddb665c20b7`: no workflow files; Worker `dekeku-api-dev`; no named Wrangler environment or deploy script; Actions secrets/settings NOT VERIFIED; branch metadata says dev/main `protected=false`. Read-only audit of `wrangler.jsonc`, Worker name/environment, deployment command, and current GitHub Actions state. Confirm the exact Development target; do not modify Cloudflare or Production.
- [x] **CICD-002 — Reconcile branch policy (HIGH).** Reviewed AGENTS.md, MASTER.md, README.md, D-025, and GitHub branch metadata. Policy consistent: work on `dev`, PR to `main`, no direct commits/pushes to `main`. Branch protection is not active per branch metadata; no settings changed. Ensure all current instructions consistently state that development occurs on `dev`, PR target is `main`, and direct commits/pushes to `main` are prohibited.
- [x] **CICD-003 — Define PR validation contract (HIGH).** COMPLETE — DEFINED. Normative contract: `project/CICD_VALIDATION_CONTRACT.md`. Required/blocking: `npm ci`, syntax checks for relevant JS under `src/` and `test/`, Wrangler `deploy --dry-run`, and mapped focused tests for changed code. Initial warnings: `npm audit --audit-level=high` and unmapped test coverage. `npm test` and remote tests remain excluded.
- [x] **CICD-004 — Add PR validation workflow (HIGH).** Implemented `.github/workflows/pr-validation.yml` on `dev`: PR `dev` → `main` only, no deployment, read-only permissions, pinned actions, dependency install, JS syntax, Development-target Wrangler dry-run, mapped focused tests, warning-only npm audit. Actual PR run NOT VERIFIED; no PR created and no branch protection changes.
- [ ] **CICD-005 — Add main-to-Development deployment workflow (CRITICAL).** On updates to `main`, deploy only to `dekeku-api-dev` using an explicit Development target. Do not deploy Production.
- [ ] **CICD-006 — Isolate Development credentials (CRITICAL).** Use dedicated GitHub Actions secrets/variables for Development only. Never reuse or expose Production credentials. Confirm required values without printing secret contents.
- [ ] **CICD-007 — Add deployment safety controls (HIGH).** Serialize/cancel overlapping deployments safely, restrict workflow permissions, verify target identity, record commit SHA and deployment result, and fail closed on ambiguity.
- [ ] **CICD-008 — Validate workflow behavior (HIGH).** Verify PR validation pass/fail behavior, main deployment success/failure handling, missing Development credentials, wrong-target rejection, and concurrency behavior using safe CI evidence.
- [ ] **CICD-009 — Verify Development deployment (HIGH).** Confirm the deployed version and Development URL/health response after CI deployment. Do not probe or modify Production.
- [ ] **CICD-010 — Close documentation and checkpoint (MEDIUM).** Update policy, workflow instructions, progress, checkpoint, and changelog using actual CI evidence.

**Execution order:** CICD-001 → CICD-002 → CICD-003 → CICD-004/CICD-006/CICD-007 → CICD-005 → CICD-008 → CICD-009 → CICD-010.

**Current status:** CICD-001 through CICD-004 implementation COMPLETE; CICD-004 CI run NOT VERIFIED. CICD-006 is next active task, followed by CICD-007 safeguards; CICD-005 deployment workflow remains gated on those tasks. CICD-005..010 remain PLANNED / NOT STARTED. This task list does not authorize Production changes or deployment before the Development-only workflow is implemented and verified.

## Owner Update — Branch Sync & Existing Cloudflare Deployment (2026-11-22)

- [x] Keep repository branch inventory to exactly `main` and `dev`.
- [x] Fast-forward `dev` to `main` at `1649701419f6d1b03b5f659c76f02d02b4355ad8`; comparison confirmed identical after synchronization.
- [x] Confirm `.github/workflows/pr-validation.yml` is present and has no deployment step.
- [ ] Trigger and inspect an actual PR validation run using a documentation-only PR.
- [ ] Verify Cloudflare Workers GitHub integration from the authorized dashboard: connected repository, development/production branch mapping, target Worker name, deployment version and health. Owner reports setup and successful deployment, but independent evidence is not yet recorded.
- [ ] Reassess CICD-005..010 after confirming the existing Cloudflare integration. Avoid creating a duplicate GitHub Actions deployment workflow.
- **Safety:** do not create a third branch; do not merge PR independently; do not touch Production; do not run `npm test` or remote tests.
