# CHANGELOG — DEKEKU API Gateway

## [Unreleased] - 2026-11-21
### Added — Automatic Write Engine SHA Retrieval
- Added authenticated `GET /api/v1/admin/write/sha?path=...` to retrieve the current GitHub Blob SHA without returning file contents.
- Updated the demo HTML Tester to fetch SHA before UPDATE/DELETE and refresh/clear the displayed SHA after write operations.
- Added regression coverage for auth, successful SHA lookup, and invalid write paths.
### Verification
- Automated tests, syntax checks, and Development runtime: NOT RUN / NOT VERIFIED.
- No Worker deployment, Production request, secret/configuration change, or Termux synchronization.

### Added — Caller Repository Metadata
- `GET /api/v1/github/repository` now reads the calling site's `Origin`, fetches that origin's fixed `/config.json`, and uses `repository.username` / `repository.repo` to resolve GitHub metadata.
- Shared `getAllowedOrigin()` helper ensures the origin is accepted by the same HTTPS `ALLOWED_ORIGINS` policy as CORS.
- Added strict config validation, owner pinning to `GITHUB_OWNER`, public-repository-only response, 8-second timeout, 32 KiB streamed body limit, and redirect rejection.
- Added `test/repository-metadata.test.js` and registered it in `npm test`.
- Added `docs/caller-repository-metadata.md`.
### Verification
- Automated tests and syntax checks: NOT RUN in this environment. Development deployment/runtime: NOT VERIFIED.
- No Wrangler configuration, secrets, Cloudflare settings, or Production resources changed.

## [Unreleased] - 2026-11-21
### Documentation & Verification Update
- Sinkronisasi `PROGRESS.md`, `CHECKPOINT.md`, `BACKLOG.md`, `RECOMMENDATIONS.md`, `ROADMAP.md`, dan `README.md`.
- Mencatat `npm run check`: PASS dan `npm test`: 149 PASS, 0 FAIL, 0 SKIP berdasarkan laporan pengguna pada 2026-11-21 untuk branch `dev`, commit `a6a089d`; hasil tidak diklaim sebagai eksekusi independen sesi dokumentasi.
- R-001 s/d R-005 ditandai selesai pada sisi implementasi; R-006 WAF dan R-007 audit logging tetap terbuka.
- Remote test tetap NOT RUN; Development runtime/deployment tetap NOT VERIFIED.
### Fixed
- CORS: memvalidasi origin melalui URL parser; hanya HTTPS tanpa port non-default, credentials, path/query/fragment, atau malformed origin. Wildcard hanya menerima subdomain, bukan apex; `Vary: Origin` selalu disetel untuk request dengan Origin.
- Test isolation: menambahkan pemulihan global fetch melalui `afterEach` pada `github-core`, `security-edge-cases`, dan `live-remote`; mock remote simulation memakai `try/finally`.
- Tester Dashboard: mengunci request ke origin halaman sendiri, menolak redirect, mewajibkan HTTPS untuk origin remote, memisahkan helper publik/admin, menyimpan JWT hanya di memori sesi, membersihkan token lama dari localStorage, dan menghapus sesi pada 401/logout.
- Tester Dashboard: menyelaraskan login dengan respons `access_token` dan meredaksi data sensitif dari log.
- Guestbook Dashboard: menambahkan JSON headers, validasi input, pencegahan double-submit, dan reset form hanya setelah sukses.

### Added
- `test/tester-dashboard.test.js` sebagai regression coverage untuk dua salinan dashboard dan ditambahkan ke script `npm test`.
- `test/cors-policy.test.js` untuk exact origin, wildcard, apex, protocol, port, credentials, malformed origin, dan deceptive hostname.
- `npm run test:remote` sebagai script eksplisit untuk suite yang mengakses Development Worker; script default tetap mengisolasi remote test.

### Verification
- Isolated JavaScript harness terhadap script Dashboard aktual: PASS untuk origin binding, JWT scoping, login token handling, 401 cleanup, dan Guestbook double-submit/success flow.
- Isolated CORS harness: PASS untuk exact origin, wildcard subdomain, apex exclusion, dan 9 kelas origin yang ditolak.
- `npm run check`: PASS dan `npm test`: 149 PASS, 0 FAIL, 0 SKIP berdasarkan laporan pengguna (21-11-2026, branch `dev`, commit `a6a089d`). Remote test: NOT RUN; Development deployment/runtime: NOT VERIFIED.

### Added
- Dokumentasi rekomendasi hasil review pada `project/RECOMMENDATIONS.md`:
  - P0: pembatasan origin Tester Dashboard untuk mencegah kebocoran JWT.
  - P1: sinkronisasi kontrak token login dan header Guestbook.
  - P1: hardening wildcard CORS serta pemisahan tes lokal dan remote.
  - P1/P2: verifikasi WAF, failed-login audit logging, dan sinkronisasi dokumentasi.
  - P2: prosedur rotasi secret, evaluasi GitHub App, dan Workers Analytics Engine.
- Backlog dan checkpoint diperbarui agar prioritas tindak lanjut, status NOT VERIFIED, dan batasan Production tercatat.

### Notes
- Perubahan ini hanya dokumentasi. Tidak ada source code, konfigurasi Cloudflare, secret, deployment, atau runtime Production yang diubah.
- Rekomendasi belum dianggap sebagai implementasi atau verifikasi.

## [Unreleased] - 2026-11-20
### Added
- Kebijakan Alur Kerja Git & GitHub (`AGENTS.md` & `project/MASTER.md`):
  - Penetapan branch `dev` sebagai branch pengembangan utama tempat seluruh commit Codex dilakukan.
  - Alur review kode berbasis Pull Request (PR) dari `dev` ke `main`.
  - Prosedur penanganan sinkronisasi branch `dev` terhadap `origin/main` (merge tanpa rebase/force-push).
- Pembaruan Dokumentasi Arsitektur & Context:
  - Dokumentasi lengkap modul write engine, sistem otentikasi JWT/PBKDF2, dan alur request pada `docs/architecture.md`.
  - Pembaruan `README.md` mencakup struktur repository lengkap, daftar endpoint terperinci, dan petunjuk pengujian.
  - Penyederhanaan `project/CLAUDE_PROJECT_CONTEXT.md` sebagai pointer dokumen referensi utama dan panduan review independen.
  - Pencatatan keputusan arsitektur D-011 (Git Workflow), D-012 (Proposed CORS Policy), dan D-013 (Proposed Login Abuse Protection) di `project/DECISIONS.md`.

### Documented Issues (Awaiting Fix)
- Menganalisis dan mendokumentasikan temuan review keamanan kode (F-01 s/d F-04) di `PROGRESS.md` dan `architecture.md`:
  - F-01: Regex karakter kontrol double-escape di `validateWritablePath`.
  - F-02: `btoa(String.fromCharCode(...bytes))` RangeError pada file > 100KB.
  - F-03: `parseAndValidateBody` belum menolak `content` yang tidak ada (`undefined`).
  - F-04: CORS middleware belum mendukung allowlist origin (`ALLOWED_ORIGINS`) dan header CORS pada catch block error.

## [2026-11-19] - Phase 2.2 Write Engine & Auth Base
*(Catatan Koreksi 2026-11-20: Jumlah tes lulus aktual per 2026-11-20 adalah 103/112 pass, di mana 9 tes legacy di github-core.test.js gagal akibat perubahan desain error mapping gateway).*

### Added
- Phase 2.2 Stage 1: Write Engine Validation Foundation
  - Streaming HTTP request body with size limiting (1.1 MB)
  - UTF-8 decoding with fatal error mode
  - JSON parsing and structure validation (Object/Array root only)
  - File size validation (1 MB UTF-8 after JSON.stringify)
  - Writable path validator (public/data/*.json only)
  - Separate validator for write operations (validateWritablePath)
  - Comprehensive test suite (12 tests)
- Phase 2.2 Stage 2: GitHub Client PUT/DELETE Operations
  - putFile(path, content, sha, message) — UPDATE with mandatory SHA
  - deleteFile(path, sha, message) — DELETE with mandatory SHA
  - createFile(path, content, message) — CREATE without SHA
  - SHA validation: 40-char hex string, strict format check
  - Optimistic concurrency: SHA passed through unchanged to GitHub
  - No auto-retry on conflict
  - Error mapping per design: 401/403(perm)→502, 403/422(rate)→429, 409→409, 429→429, 5xx→502, timeout→504, network→502
  - Retry-After header forwarded when available
  - Secret leakage prevention in errors
  - Comprehensive mock test suite (34 tests)
- Phase 2.2 Stage 3: Router Integration
  - POST /api/v1/admin/write/create — Create JSON file in public/data/
  - PUT /api/v1/admin/write/update — Update JSON file (requires SHA)
  - DELETE /api/v1/admin/write/delete — Delete JSON file (requires SHA)
  - All write endpoints protected by authMiddleware (admin role required)
  - Public GET endpoints unchanged and regression tested
  - Integration test suite (22 tests)
- Regression tests for JWT and PBKDF2 (29 cases).
- Constant-time comparison for password verification.
- Comprehensive validation for hash format and iterations.

### Fixed
- JWT: Ensured `iat` and `exp` are finite numbers.
- JWT: Enforced `exp > iat` and maximum 30-minute duration.
- JWT: Added 30-second clock skew tolerance.
- Hash: Added strict length validation for salt (16 bytes) and hash (32 bytes).
- Hash: Improved resilience against malformed input and non-hex characters.
- Write Engine: Percent-encoded traversal paths blocked in validateWritablePath.
- Write Engine: Backslash, control characters, double encoding rejected.

### Changed
- `src/utils/jwt.js`: Tightened claims validation logic.
- `src/utils/hash.js`: Refactored to include strict format checks and constant-time compare.
- `src/core/github.js`: Added putFile, deleteFile, validateSha, refined error mapping.
- `src/modules/github/write.js`: Added createFile, updateFile, deleteFile, parseAndValidateBody, validateWritablePath.
- `src/modules/github/index.js`: Extended to handle write endpoints under auth.
- `src/core/router.js`: Added protected write route prefix /api/v1/admin/write/.
- `test/auth.test.js`: Expanded to include regression suites.
- `test/github-write.test.js`: New — 34 mock integration tests for GitHub Client PUT/DELETE.
- `test/write-foundation.test.js`: New — 12 validation foundation tests.
- `test/write-router.test.js`: New — 22 router integration tests.

## [2026-11-19] - Secret Provisioning (Dev)
### Added
- Secure provisioning of `JWT_SECRET` and `ADMIN_PASSWORD_HASH` for `dekeku-api-dev`.
- Utilized Cloudflare Workers Versions API to stage secrets without immediate deployment.
- Generated cryptographically secure admin password for initial development setup.

## [2026-11-19] - Admin Password Rotation (Dev)
### Changed
- Rotated `ADMIN_PASSWORD_HASH` for `dekeku-api-dev` after initial password exposure.
- New password generated internally (48 chars hex) and hashed with fresh salt.
- Provisioned via Versions API (staged).


## [Unreleased] — Guestbook Per-Origin Storage (2026-11-21)
### Changed
- Public Guestbook submissions now append to one JSON array file per validated Origin hostname at public/data/{hostname}/bukutamu.json.
- Hostname dots are preserved; Origin must pass the shared HTTPS ALLOWED_ORIGINS validator.
- Writes use Git blob SHA and bounded read-again retry after 409 conflicts.
### Added
- Regression tests for create, append, conflict retry, Origin rejection, and validation.
- docs/guestbook-storage.md describing layout, limits, concurrency, and security boundaries.
### Verification
- Tests and syntax checks: NOT RUN. Development runtime/deployment: NOT VERIFIED.
- No deployment, Worker settings, secrets, Production resources, or database repository content changed.


## [Unreleased] — RBAC Architecture & Task Tracker (2026-11-21)
### Added
- Added `project/RBAC_PLAN.md` containing the approved Admin/User/Guest architecture, private account repository structure, JWT policy, endpoint inventory, Guestbook target flow, acceptance criteria, and RBAC-01 through RBAC-09 task tracker.
- Linked the RBAC plan from roadmap, backlog, and checkpoint documentation.
### Status
- Architecture approved; implementation not started.
- `npm test`: NOT RUN per explicit user instruction. Syntax checks: NOT RUN. Development runtime: NOT VERIFIED.
- Documentation-only change; no source code, secrets, Worker configuration, deployment, or Production resources changed.



## [Unreleased] — RBAC-01 Private Storage Foundation (2026-11-21)
### Added
- `src/modules/rbac/storage.js`: exact private storage path allowlist, versioned user and repository-mapping schemas, private Contents API reads and SHA-protected writes.
- Schema constraints for PBKDF2 hashes, fixed User role, account status, repository ownership references, canonical HTTPS Origin, unique active repository and Origin.
- `test/rbac-storage.test.js` and registration in the local `npm test` script.
### Verification
- `npm test`: NOT RUN by explicit user instruction.
- Syntax/static checks: NOT RUN. Development runtime: NOT VERIFIED.
- No account data, mapping data, secrets, Worker configuration, deployment, or Production resources changed.


## [Unreleased] — RBAC-02 Role & Ownership Middleware (2026-11-21)
### Added
- Admin/User JWT middleware separation with strict audience and role validation; retained legacy Admin middleware export.
- User account status revalidation from private storage and ownership enforcement through opaque repository mapping IDs.
- `test/rbac-auth.test.js` registered in the local test script.
### Verification
- `npm test`: NOT RUN per user instruction. Syntax/static checks: NOT RUN. Development runtime: NOT VERIFIED.
- No User endpoints/login, account records, mappings, secrets, Wrangler configuration, deployment, or Production resources changed.


## [Unreleased] — RBAC-03 Admin Account & Repository Management (2026-11-21)
### Added
- src/modules/rbac/admin.js: Admin account create/list/detail/status update/reset-password and repository mapping create/list/soft-disable handlers.
- Admin management routes in src/core/router.js, protected by the existing Admin JWT middleware.
- PBKDF2-SHA256 password hashing, server-generated IDs, fixed User role, strict request field allowlists, 16 KiB streamed JSON limit, schema validation, and SHA-protected private storage writes.
- test/rbac-admin.test.js registered in the local test script.
### Verification
- npm test: NOT RUN per explicit user instruction. Syntax/static checks: NOT RUN. Development runtime: NOT VERIFIED.
- No real account/mapping records, secrets, Wrangler configuration, Cloudflare settings, deployment, or Production resources changed.


## [Unreleased] — RBAC-04 User Login & JWT (2026-11-21)
### Added
- src/modules/auth/user-login.js and public POST /api/v1/user/login.
- Private account lookup, PBKDF2-SHA256 verification, disabled-account rejection, generic authentication failures, and dummy-hash verification for unknown usernames.
- User JWT issuance with aud=dekeku-user, role=user, immutable account ID subject, and 30-minute expiry.
- Bounded 16 KiB JSON parsing with content-type, UTF-8, object-shape, and field allowlist checks.
- test/rbac-user-login.test.js registered in local test script.
### Verification
- npm test: NOT RUN per explicit user instruction. Syntax/static checks: NOT RUN. Development runtime: NOT VERIFIED.
- No real account/private data, secrets, Wrangler/Cloudflare configuration, deployment, or Production resources changed.


## [Unreleased] — RBAC-05 User Data CRUD (2026-11-21)
### Added
- User repository listing and repository-scoped GET/POST/PUT/DELETE data endpoints.
- Strict ownership resolution using the authenticated User subject and private repository mappings.
- Fixed assets/data/ path prefix, JSON-only file validation, 1 MiB file limit, streamed request cap, strict UTF-8, and SHA-based update/delete concurrency.
- test/rbac-user-data.test.js registered in local npm test.
### Verification
- npm test: NOT RUN per explicit user instruction. Syntax/static checks: NOT RUN. Development runtime: NOT VERIFIED.
- No real account, mapping, target repository data, secrets, configuration, deployment, or Production resources changed.


## [Unreleased] — RBAC-06 Private/Public Data Boundary Review (2026-11-21)
### Added
- Added `test/rbac-boundary.test.js` covering fixed private storage allowlist, public reader denial of `private/` and `assets/data/` paths before upstream access, traversal/hidden paths, and Admin/User/Guest route separation.
- Registered the new boundary regression suite in `package.json`.
### Reviewed
- Confirmed the public reader delegates to `GitHubClient.getFile()`, which applies `validatePublicPath()` before calling the GitHub Contents API.
- Confirmed private storage uses an exact two-path allowlist and User data operations use separate authenticated ownership-scoped routes.
### Verification
- Source review: VERIFIED.
- Automated test execution: NOT RUN per explicit user instruction. Syntax/static checks: NOT RUN. Development runtime: NOT VERIFIED.
- No live data, credentials, Wrangler/Cloudflare settings, deployment, or Production resources changed.


## [Unreleased] — RBAC-07 Guestbook per Mapped Website Repository (2026-11-21)
### Changed
- Guestbook submission now resolves the active Origin mapping from private `dekeku-db` storage and derives repository coordinates exclusively from that mapping.
- Target repository must exist and be public; Guestbook writes are fixed to `assets/data/bukutamu.json`.
- Added strict streamed request parsing, exact accepted body fields, and retained the 15 KiB request cap, 1 MiB stored-file cap, SHA optimistic concurrency, and three-attempt conflict handling.
- Legacy `public/data/{hostname}/bukutamu.json` files remain untouched; no migration or deletion was performed.
### Tests
- Expanded `test/public-submission.test.js` for mapped repository create/append, conflict retry, unregistered Origin, private/missing repository, unsupported fields, and input/method validation. Existing `package.json` script already includes the test file.
### Verification
- Source review: VERIFIED.
- `npm test`: NOT RUN per explicit instruction. Syntax/static checks: NOT RUN. Development runtime: NOT VERIFIED.
- Origin spoofing remains possible for non-browser clients; WAF/IP rate limiting for Guestbook POST is a required Development follow-up. CDN cache behavior is not verified.
- No live account/mapping/website data, secrets, configuration, deployment, or Production resources changed.


## [Unreleased] — RBAC-08 Browser User Session Integration (2026-11-21)
### Added
- User login UI on generated and static Tester dashboards.
- User JWT session storage in `sessionStorage` key `dekeku_user_access_token`, with same-tab restoration and logout cleanup.
- Dedicated User Bearer request helper and User repository listing action.
- Role-specific 401 cleanup; public requests strip Authorization and Admin token remains in-memory/separate.
### Tests
- Updated `test/tester-dashboard.test.js` assertions for both dashboard copies, User token storage lifecycle, helper isolation, and 401/logout behavior.
### Verification
- Source review: VERIFIED.
- Tests and syntax checks: NOT RUN per explicit instruction. Development browser/runtime: NOT VERIFIED.
- sessionStorage remains exposed to same-origin JavaScript (XSS risk). No secret/configuration/deployment/Production changes.


## [Unreleased] — RBAC-09 Security & Regression Review (2026-11-21)
### Added
- `test/rbac-security-review.test.js` with five integration regression scenarios for mapping ownership/IDOR, server-authoritative repository coordinates, client repository-coordinate injection, disabled accounts, and expired User JWT.
- Registered the new security review test file in `package.json`.
### Reviewed
- Router, Admin/User auth middleware, private storage, Admin management, User data CRUD, User login/JWT, Guestbook mapping/write path, GitHub client, CORS, public path allowlist, and Tester browser session.
### Verification
- Source review: VERIFIED.
- `npm test`: NOT RUN per explicit instruction. Syntax/static checks: NOT RUN. Development runtime/WAF/CDN: NOT VERIFIED.
- Open risks: WAF rate limiting for User login and Guestbook; spoofable Origin; CDN cache/invalidation; reset-password does not immediately revoke existing JWT; sessionStorage remains XSS-readable.
- No secrets/configuration/deployment/Production changes.


## [Unreleased] — Execution Policy & Verification Follow-up (2026-11-21)
### Documentation
- Added `project/EXECUTION_POLICY.md` and linked it from `AGENTS.md` as a required pre-task document.
- Updated PROGRESS, BACKLOG, ROADMAP, RBAC_PLAN, RECOMMENDATIONS, and CHECKPOINT to clarify current RBAC verification status and the ordered follow-up.
- Historical test report for commit `a6a089d` remains historical; it is not evidence for current HEAD.
### Verification
- RBAC syntax/static checks: NOT RUN (no repository execution environment available).
- `npm test`: NOT RUN by explicit instruction.
- Development WAF and Guestbook CDN/cache: NOT VERIFIED (dashboard/runtime evidence unavailable).
- R-013: immediate User JWT revocation recommended; owner decision OPEN; no code/schema changes.
- No Production, Cloudflare configuration, secrets, credentials, accounts, mappings, or website data changed.


## [Unreleased] — Owner Decision: WAF Deferred, Assets Cache-Busting (2026-11-21)
### Decisions
- Deferred Development WAF setup/verification; do not configure WAF until the owner resumes the task.
- Require a changing timestamp query parameter on `assets` retrieval URLs to avoid reusing cached URLs and prioritize current data.
- CDN freshness still requires confirming that the query string participates in the cache key, or bypassing cache when it does not.
### Scope
- Documentation only. No WAF/CDN settings, application code, website data, deployment, or Production resources changed.


## [Unreleased] — Owner Decision R-013: Immediate User JWT Revocation (2026-11-21)
### Decision
- Owner approved immediate invalidation of all User JWTs issued before a successful Admin password reset (D-023).
- Approved implementation direction: backward-compatible per-user token/session version stored in private account data, embedded in newly issued User JWTs, checked against the authoritative record on every authenticated User request, and incremented during successful password reset with SHA-safe concurrency handling.
- Admin JWTs are unaffected; User must log in again with the new password.
### Status / Scope
- Decision: APPROVED. Source implementation and focused regression tests were subsequently added on dev; syntax/test verification and Development deployment remain pending. The currently deployed Worker may still allow old tokens until their remaining expiry (up to 30 minutes).
- Documentation-only update. No source/schema, account data, secrets, configuration, deployment, or Production resources changed.
- npm test: NOT RUN per explicit instruction.


## [Unreleased] — R-013 User JWT Revocation Implementation (2026-11-21)
### Changed
- Added backward-compatible tokenVersion validation for private User records; legacy records and legacy User JWTs without a version resolve to version 0.
- New User accounts start at version 0, and User login includes the current version in newly issued dekeku-user JWTs.
- User auth and repository ownership middleware compare the JWT version with the authoritative private account record; malformed explicit claims and stale versions are rejected.
- Successful Admin password reset increments tokenVersion in the same SHA-guarded write as the password hash. SHA conflicts are surfaced without blind overwrite/retry; overflow is rejected.
- Added and registered test/rbac-token-version.test.js covering legacy compatibility, stale-token rejection, new-password login, Admin JWT isolation, invalid versions, and SHA conflicts.
### Verification / Scope
- Limited V8 parser check: PASS 13/13 RBAC source/test files after stripping ES-module import/export declarations for parsing; package.json JSON parse and test registration PASS. Native node --check: NOT RUN. Focused test: NOT RUN. npm test: NOT RUN by explicit instruction.
- Development runtime: NOT VERIFIED; no deployment performed. WAF remains DEFERRED; CDN cache behavior remains NOT VERIFIED.
- No account data, secrets, Cloudflare configuration, or Production resources changed.
