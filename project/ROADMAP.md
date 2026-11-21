# ROADMAP — DEKEKU API Gateway

> Current status is maintained only in [PROGRESS.md](PROGRESS.md). The ordered work queue and safety rules are in [EXECUTION_POLICY.md](EXECUTION_POLICY.md). Phase 2.x completion statements below are historical milestone records and do not imply current RBAC/runtime verification.

*Catatan Acuan*: Untuk status detail, riwayat pengujian, dan daftar isu aktif, lihat [PROGRESS.md](PROGRESS.md) sebagai sumber status tunggal proyek.

## Phase 1: Foundation & GitHub Core
- **Status**: COMPLETED.
- **Hasil**: Runtime Cloudflare Workers, GitHub Client read-only, router core, dan public access policy untuk `public/`.

## Phase 2.1: Authentication & Authorization
- **Tujuan**: Menjamin keamanan operasi administratif.
- **Ruang Lingkup**: JWT Middleware, Admin Login (`POST /api/v1/admin/login`), Secret Management (`JWT_SECRET`, `ADMIN_PASSWORD_HASH`), PBKDF2 hashing.
- **Status**: COMPLETED & VERIFIED.

## Phase 2.2: Write Engine & File Management
- **Tujuan**: Memungkinkan pengelolaan file melalui API.
- **Ruang Lingkup**: Create/Update/Delete file JSON di direktori `public/data/` via GitHub Contents API dengan validasi path, size limit (1MB), optimistic concurrency (SHA), dan perbaikan F-01 s/d F-04.
- **Dependensi**: Phase 2.1.
- **Status**: COMPLETED & VERIFIED.

### Write Engine Usability Follow-up (2026-11-21)
- Automatic SHA lookup endpoint and Tester integration implemented on `dev`.
- Regression tests added; syntax checks, automated test execution, and Development runtime verification remain NOT RUN / NOT VERIFIED.

## Phase 2.3: Public Submission & Guestbook (historical milestone)
- **Tujuan**: Memungkinkan pengumpulan pesan/guestbook publik dengan validasi aman tanpa auth admin.
- **Ruang Lingkup awal**: Endpoint `POST /api/v1/public/submit` dan penyimpanan Guestbook awal di `public/data/guestbook/`.
- **Status implementasi**: milestone awal tercatat selesai. Alur Guestbook terbaru untuk RBAC-07 menggunakan mapping Origin dan target `assets/data/bukutamu.json` pada repository website; jangan menganggap path awal sebagai target saat ini.
- **Verifikasi**: laporan suite lokal 149 PASS, 0 FAIL, 0 SKIP pada commit `a6a089d` adalah bukti historis; Development runtime/deployment tetap NOT VERIFIED.

## Security Review Follow-up (2026-11-21)
- R-001 s/d R-005: implementasi remediation Dashboard, CORS, dan test isolation selesai.
- `npm run check`: PASS dan `npm test`: 149 PASS, 0 FAIL, 0 SKIP berdasarkan laporan pengguna pada branch `dev`, commit `a6a089d`; bukan verifikasi independen dalam sesi dokumentasi.
- R-006 WAF Development: NOT VERIFIED.
- R-007 failed-login audit logging: menunggu keputusan retensi, akses, dan metadata.
- R-008 sinkronisasi dokumentasi: COMPLETED.

## Current Workstream Selection
- Dokumentasi telah direkonsiliasi setelah owner memilih opsi C.
- Tidak ada prioritas teknis berikutnya yang dipilih. Tunggu keputusan owner antara RBAC Development runtime verification (deployment memerlukan persetujuan eksplisit) dan Development CI/CD (dimulai dengan audit read-only).
- Lihat `PROGRESS.md` untuk status dan `EXECUTION_POLICY.md` untuk antrean tunggal.

## Phase 3: Monitoring & Optimization (Future)
- Monitoring logs & error tracking.
- Performance optimization (Worker latency).
- Documentation refinement.
## Caller Repository Metadata
- **Implementation**: added on branch `dev` on 2026-11-21.
- **Scope**: `GET /api/v1/github/repository` resolves the caller repository from the validated request Origin and its `/config.json`.
- **Verification**: regression tests and syntax checks NOT RUN in this environment; Development deployment/runtime NOT VERIFIED.


## Guestbook Per-Origin Storage (2026-11-21)
- **Implementation**: added on branch dev.
- **Scope**: one JSON array file per allowlisted Origin hostname at public/data/{hostname}/bukutamu.json; dots retained.
- **Concurrency**: SHA optimistic locking with bounded re-read/retry on 409 (maximum three writes).
- **Limits**: 15 KiB request and 1 MiB serialized file.
- **Verification**: regression tests added but NOT RUN in this environment; Development deployment/runtime NOT VERIFIED.


## RBAC Program — Approved Architecture (2026-11-21)
- **Status (latest)**: RBAC-01 through RBAC-08 source foundations implemented on `dev`, not verified. RBAC-09 regression tests added but NOT VERIFIED. See `project/RBAC_PLAN.md` and `project/PROGRESS.md`.
- Detail and task tracker: [RBAC_PLAN.md](RBAC_PLAN.md).
- Roles: Admin (all API-managed data), User (only owned registered repositories under `assets/data/`), Guest (public Guestbook submission only).
- User JWT: audience `dekeku-user`, role `user`, lifetime 30 minutes; Admin retains `dekeku-admin` audience.
- Account and repository mapping storage: private `dekeku-db` repository; PBKDF2-SHA256 password hashes; server-authoritative mapping; multiple repositories per User.
- Guestbook target: each mapped website repository at `assets/data/bukutamu.json`; public reads use static repository/CDN URLs.
- Existing `public/data/{hostname}/bukutamu.json` files must not be deleted or migrated automatically.
- RBAC-01 through RBAC-08 are implemented but not verified. RBAC-09 security regression tests have been added; `npm test` remains NOT RUN by user instruction; syntax checks and Development runtime remain NOT VERIFIED.



## RBAC-01 — Private Account Storage Foundation (2026-11-21)
- **Implementation**: ADDED on branch `dev`; see [RBAC_PLAN.md](RBAC_PLAN.md).
- Fixed private paths: `private/auth/users.json` and `private/repositories/mappings.json`.
- Added strict user/mapping schema validation and internal GitHub Contents API read/create/update with file-size limit and mandatory SHA for updates.
- Added `test/rbac-storage.test.js` to local test script.
- **Status**: IMPLEMENTED — NOT VERIFIED. `npm test` NOT RUN by user instruction; syntax/static checks NOT RUN; Development runtime NOT VERIFIED.
- Next at the time: RBAC-02 role/audience/ownership middleware. Historical note; implementation is recorded in section below.


## RBAC-02 — Role and Ownership Middleware (2026-11-21)
- Added separate Admin and User JWT middleware with strict issuer/audience/role checks; retained `authMiddleware` as a compatibility alias for Admin routes.
- User middleware rechecks active account status from private account storage. Repository ownership middleware resolves an opaque mapping ID against private mappings and attaches only server-sourced repository coordinates.
- Added `test/rbac-auth.test.js` to the local test command.
- **Status**: IMPLEMENTED — NOT VERIFIED. Tests and syntax checks NOT RUN by user instruction; Development runtime NOT VERIFIED. No endpoints, account records, mappings, secrets, config, deployment, or Production resources changed.
- Next at the time: RBAC-04 User login. Historical note; implementation is recorded in section below.


## RBAC-03 — Admin Account & Repository Management (2026-11-21)
- Added Admin-only account create/list/detail/status-disable/reset-password handlers and repository mapping create/list/soft-disable handlers.
- Routes are mounted behind the existing Admin JWT middleware; existing Admin auth compatibility is preserved.
- Private account and mapping records use the fixed dekeku-db paths, schema validation, PBKDF2-SHA256 password hashes, bounded JSON body parsing, and SHA-protected writes.
- Added test/rbac-admin.test.js to the local test script.
- Status: IMPLEMENTED — NOT VERIFIED. Tests and syntax checks NOT RUN by instruction; Development runtime NOT VERIFIED. No real account or mapping records were created; no Production/config/secrets/deployment changes.
- Next: RBAC-05 User data CRUD. RBAC-01–04 runtime verification remains pending.


## RBAC-04 — User Login & JWT (2026-11-21)
- Added POST /api/v1/user/login, reading User accounts from the fixed private account document.
- Verifies PBKDF2-SHA256 hashes, rejects disabled accounts, uses uniform authentication failure responses, and performs dummy-hash verification for unknown usernames.
- Issues User HS256 JWT with aud=dekeku-user, role=user, immutable account ID as sub, and a 30-minute lifetime.
- Request parsing is bounded to 16 KiB with strict JSON/content-type checks and unknown-field rejection.
- Added test/rbac-user-login.test.js to local test script.
- Status: IMPLEMENTED — NOT VERIFIED. Tests and syntax checks NOT RUN by instruction; Development runtime NOT VERIFIED. No real account/data, secrets, configuration, deployment, or Production resources changed.
- Next: RBAC-05 User data CRUD under assets/data/. RBAC-01–04 runtime verification remains pending.


## RBAC-05 — User Data CRUD (2026-11-21)
- Added User repository listing and scoped data endpoints: GET /api/v1/user/repositories; GET/POST/PUT/DELETE /api/v1/user/data.
- Requires User JWT and active account; each data request resolves the mapping ID against private storage and checks ownership against JWT subject.
- Repository coordinates are server-derived. Relative paths are fixed under assets/data/; JSON only, 1 MiB file limit, bounded request body, strict UTF-8, and SHA concurrency for update/delete.
- Added test/rbac-user-data.test.js and registered it in npm test.
- Status: IMPLEMENTED — NOT VERIFIED. Tests and syntax checks NOT RUN by user instruction; Development runtime NOT VERIFIED. No real account/mapping/data, secrets, config, deployment, or Production resources changed.
- Next: RBAC-06 private/public data boundary review. RBAC-01–05 runtime verification remains pending.


## RBAC-06 — Private/Public Data Boundary Review (2026-11-21)
- **Status**: IMPLEMENTED — NOT VERIFIED.
- Public file reads are constrained by `GitHubClient.getFile()` and `validatePublicPath()` before upstream access; only the `public/` tree with approved file extensions is eligible.
- Fixed private storage paths and User `assets/data/` paths are outside the public read allowlist.
- Admin, User, and Guest route separation reviewed; regression coverage added in `test/rbac-boundary.test.js` and registered in `package.json`.
- Source review VERIFIED. Tests and syntax/static checks NOT RUN per instruction; Development runtime NOT VERIFIED.
- Next: RBAC-07 Guestbook per mapped website repository.


## RBAC-07 — Guestbook per Mapped Website Repository (2026-11-21)
- **Status**: IMPLEMENTED — NOT VERIFIED.
- Guestbook submission now resolves the exact active Origin mapping from private `dekeku-db` storage. Repository owner/name/branch are server-derived; client cannot choose the destination.
- Worker verifies the mapped repository exists and is public, then appends to the fixed `assets/data/bukutamu.json` path. Legacy `public/data/{hostname}/bukutamu.json` files remain untouched.
- Preserves array JSON, strict UTF-8 and payload validation, 15 KiB request limit, 1 MiB file limit, SHA optimistic concurrency, and up to three conflict attempts.
- Regression cases added to existing `test/public-submission.test.js`; suite already registered in `package.json`.
- Source review VERIFIED. Tests/syntax checks NOT RUN per instruction; Development runtime NOT VERIFIED.
- Abuse protection remains follow-up: Origin is spoofable; verify/configure Development WAF/IP rate limiting for `POST /api/v1/public/submit`. No Production configuration changed.
- Next: RBAC-08 Browser User session integration.


## RBAC-08 — Browser User Session Integration (2026-11-21)
- **Status**: IMPLEMENTED — NOT VERIFIED.
- Both generated Tester route and static Tester copy now include User login, User Bearer requests, repository listing, and logout.
- User JWT is stored only in `sessionStorage` under `dekeku_user_access_token`; restored for the same tab session and removed on logout or User-request 401.
- Public API helper strips Authorization; Admin token remains in-memory and separate from User token.
- Regression assertions updated in `test/tester-dashboard.test.js`. Tests/syntax checks NOT RUN per instruction; Development browser/runtime NOT VERIFIED.
- XSS exposure remains because sessionStorage is readable by same-origin JavaScript.
- Next: RBAC-09 Security & Regression Review.


## RBAC-09 — Security & Regression Review (2026-11-21)
- Added `test/rbac-security-review.test.js` for ownership isolation, server-derived repository coordinates, client field injection rejection, disabled account handling, and expired JWT rejection.
- Registered test in `package.json`.
- Test execution and syntax/static checks NOT RUN; Development WAF and CDN integration NOT VERIFIED.
- Next: syntax/static checks only (do not run `npm test`), then separately gather Development WAF and CDN evidence.


## Current RBAC Verification Follow-up (2026-11-21)
- RBAC-01–08: implementation present on `dev`; NOT VERIFIED.
- RBAC-09: regression tests added; NOT VERIFIED.
- Limited V8 parser check: PASS 13/13 RBAC source/test files after stripping ES-module import/export declarations for parsing. Native node --check: NOT RUN. Focused R-013 test: NOT RUN. `npm test`: NOT RUN by owner instruction.
- Development WAF (User Login and Guestbook): DEFERRED by owner.
- Guestbook static CDN/cache behavior: NOT VERIFIED.
- R-013: immediate User JWT revocation APPROVED (D-023); source implementation and focused regression test added on dev; verification pending.
- Historical "Next" notes in earlier stage entries do not override the current work queue.


## R-013 Decision Update (2026-11-21)
- Owner approved immediate invalidation of all User JWTs issued before a successful password reset.
- Implementation direction: per-user token/session version stored in private account record, embedded in newly issued User JWTs, validated on each authenticated User request, and incremented during password reset.
- Implementation is not yet started; no runtime behavior has changed. See EXECUTION_POLICY.md for the ordered next steps.


## R-013 Implementation Update (2026-11-21)
- Implemented optional per-user tokenVersion with backward-compatible default 0; new accounts initialize at 0.
- User login signs the current version into User JWTs; User middleware validates it against private storage on each authenticated request.
- Successful Admin password reset increments the version in the same SHA-guarded private account write as the password hash.
- Focused regression tests added and registered. Limited V8 parser check PASS 13/13 after stripping module declarations; native node --check and focused test remain NOT RUN. Development runtime NOT VERIFIED.
- No deployment or Production changes.


## Latest R-013 Verification Status (2026-11-21)
- Source implementation and focused regression test are present on `dev`.
- Owner-reported Termux verification: `node --check` PASS for all RBAC source/test files; `node --test test/rbac-token-version.test.js` PASS (6 PASS, 0 FAIL).
- `npm test`: NOT RUN by explicit instruction.
- Development runtime/deployment remains NOT VERIFIED; do not infer runtime behavior from local tests.
- WAF remains DEFERRED; Guestbook CDN/cache behavior remains NOT VERIFIED; Production untouched.
- The test results are owner-reported and were not independently re-executed in this session.


## Development CI/CD Track — Approved, Not Started (2026-11-21)

- Branch workflow: develop on `dev`; submit stable changes through PR to `main`.
- PR validation is required; PR events must not deploy.
- Updates to `main` are intended to trigger deployment to Development Worker `dekeku-api-dev` only.
- Track tasks CICD-001..CICD-010 in [BACKLOG.md](BACKLOG.md).
- This track is PLANNED / NOT STARTED. Production deployment is not authorized.


## Development CI/CD Track — Current Status (2026-11-21)
- Owner selected the Development CI/CD workstream after documentation reconciliation.
- CICD-001 read-only audit: COMPLETE. No workflow files exist at audited dev HEAD `09df42e24ab911efa5ed2541f7e80ddb665c20b7`; Wrangler names `dekeku-api-dev` but has no named environment; package scripts define no deployment command.
- CICD-002 branch-policy reconciliation: COMPLETE. Work on `dev`, PR to `main`, no direct commits/pushes to `main`. Branch protection is currently reported inactive by GitHub branch metadata and remains a separate operational gap.
- Next: CICD-003 define PR validation contract. Workflow implementation and deployment remain pending.
- GitHub Actions secrets/environments/settings are NOT VERIFIED. Production remains out of scope.


## CICD-003 — PR Validation Contract (2026-11-21)
- Status: COMPLETE — DEFINED. See `CICD_VALIDATION_CONTRACT.md` for required checks, warning checks, failure behavior, and safety boundaries.
- Next: CICD-004 implements PR validation only; no deployment on PR events.
- `npm test` remains NOT RUN; remote tests are excluded from PR CI.
