# PROGRESS STATUS — DEKEKU API Gateway

Tanggal Pembaruan: 2026-11-21

## Ringkasan Proyek
- **Fase Aktif**: RBAC Security & Development Verification Follow-up.
- **Status Keseluruhan**: Implementasi RBAC-01 s/d RBAC-08 tersedia di `dev`, tetapi verifikasi sistem lengkap dan Development runtime masih NOT VERIFIED. R-013 source + focused regression test: syntax check dan focused test PASS berdasarkan laporan pengujian pengguna di Termux. WAF Development DEFERRED; perilaku CDN/cache `assets` NOT VERIFIED.
- **Baseline sebelum dokumentasi**: branch `dev`, commit `6f0360e5166595945320a467a1fa2c91722b7401`.
- **Acuan status tunggal**: dokumen ini. Urutan kerja wajib ada di [EXECUTION_POLICY.md](EXECUTION_POLICY.md), checklist rinci di [BACKLOG.md](BACKLOG.md), dan seluruhnya harus konsisten.
- **Bukti historis**: laporan pengguna untuk commit `a6a089d` (149 PASS, 0 FAIL, 0 SKIP dan `npm run check` PASS) adalah bukti historis, bukan verifikasi HEAD saat ini.
- **Larangan tes**: `npm test` NOT RUN sesuai instruksi pemilik proyek. Jangan menjalankannya.

## Daftar Fitur & Status

| Komponen | Fitur | Status | Catatan & Temuan Aktual |
| :--- | :--- | :--- | :--- |
| **Core** | Router (Auth & Public Ready) | COMPLETED | Mendukung publik, auth routes, dan public submission. |
| **Core** | GitHubClient (Read & Create without SHA) | COMPLETED | Mendukung GET dan PUT create file publik tanpa SHA (concurrent-safe). |
| **Core** | GitHubClient (Write PUT/DELETE) | COMPLETED | Optimistic concurrency via SHA. |
| **Auth** | JWT Utility (HS256) | COMPLETED | Strict iat, exp, signature validation. |
| **Auth** | Auth Middleware | COMPLETED | Verified iss, aud, sub, role, exp. |
| **Auth** | Admin Login | COMPLETED | PBKDF2 verification, JWT issuance. |
| **Security** | Path Validation (Public) | COMPLETED | Memblokir traversal & file tersembunyi. |
| **Security** | Path Validation (Write) | COMPLETED | Regex karakter kontrol `/[\x00-\x1F\x7F]/` diperbaiki (F-01 fixed). |
| **Security** | Password Hashing | COMPLETED | PBKDF2-SHA256, constant-time compare. |
| **Security** | CORS Policy & Wildcard | COMPLETED | Allowlist origin via `ALLOWED_ORIGINS` (mendukung wildcard subdomain `*.artoprintingpbg.com` & `*.dekeku.my.id`), `PUT, DELETE` methods, `Vary: Origin`, dan CORS headers pada respons error (F-04 fixed). |
| **Module** | Health & GitHub Read | COMPLETED | Fitur v1 stabil. |
| **Module** | Public Submission (Guestbook) | COMPLETED | Endpoint `POST /api/v1/public/submit` menulis ke `public/data/guestbook/` tanpa auth admin, aman dari conflict via timestamp/random suffix. |
| **Write** | Validation Foundation | COMPLETED | Body parsing, Content-Type with charset parameters, `content` required validation (F-03 fixed), file size limit (1MB). |
| **Write** | Base64 Chunked Encoding | COMPLETED | `src/utils/base64.js` meng-encode payload 1MB per-chunk tanpa RangeError (F-02 fixed). |
| **Write** | GitHub Client PUT/DELETE | COMPLETED | Validasi SHA, error mapping, concurrency OK. Header `Retry-After` dikirim jika tersedia dari GitHub API. |
| **Write** | Router Integration | COMPLETED | Endpoints CREATE/UPDATE/DELETE terpasang di bawah authMiddleware. |

## Write Engine Automatic SHA Retrieval (2026-11-21)
- **IMPLEMENTED on branch dev**: added authenticated `GET /api/v1/admin/write/sha?path=public/data/file.json`.
- Endpoint validates writable path, reads the current GitHub Contents API file metadata through the server-side GitHub client, and returns only path + 40-character Blob SHA (not file contents).
- Tester `wahyuajismustofa30/demo:index.html` now fetches the SHA immediately before UPDATE/DELETE; CREATE/UPDATE refresh the displayed SHA from the write response; DELETE clears it. SHA display is read-only.
- Optimistic concurrency remains enforced: UPDATE/DELETE still require SHA, and GitHub can return 409 if the file changes after lookup.
- Regression tests added for authentication, successful SHA lookup, and rejected paths in `test/write-router.test.js`.
- Automated tests, syntax checks, and Development runtime verification for this feature: NOT RUN / NOT VERIFIED. No Worker deployment or Production request was made.

## Tester Dashboard Hardening (2026-11-21)
- **R-001 — IMPLEMENTED**: API target dikunci ke same-origin, HTTPS diwajibkan untuk remote, redirect ditolak, helper publik/admin dipisah, JWT hanya di memori, legacy localStorage token dibersihkan saat load, dan 401/logout menghapus sesi.
- **R-002 — IMPLEMENTED**: Login memakai `access_token`, validasi token non-empty, password field dibersihkan, dan token direduksi dari log.
- **R-003 — IMPLEMENTED**: Guestbook mengirim `Content-Type: application/json` dan `Accept: application/json`, memvalidasi input, mencegah double-submit, serta hanya reset setelah sukses.
- `test/tester-dashboard.test.js` ditambahkan ke script `npm test`.
- Isolated JavaScript harness terhadap script aktual: PASS untuk same-origin, JWT scoping, login, 401, dan alur Guestbook.
- Pengujian Node (`npm test`): 149 PASS, 0 FAIL, 0 SKIP — DILAPORKAN PENGGUNA (21-11-2026, branch `dev`, commit `a6a089d`); bukan eksekusi independen pada sesi dokumentasi ini. `npm run check`: PASS — DILAPORKAN PENGGUNA. Development deployment/runtime: NOT VERIFIED.

## Security Review Remediation (2026-11-21)
- **R-001 s/d R-003 — IMPLEMENTED**: Tester Dashboard same-origin JWT boundary, `access_token` contract, dan Guestbook JSON/double-submit behavior. Isolated JavaScript harness PASS.
- **R-004 — IMPLEMENTED**: strict HTTPS origin parsing, exact/wildcard hostname validation, wildcard apex exclusion, port/credentials/path rejection, dan `Vary: Origin` untuk request ber-Origin. CORS isolated harness PASS.
- **R-005 — IMPLEMENTED**: `npm test` berisi daftar suite lokal eksplisit dan mengecualikan remote test; `npm run test:remote` menjalankan remote suite secara eksplisit. Mock `global.fetch` dipulihkan dengan `afterEach`/`finally`.
- `test/tester-dashboard.test.js` dan `test/cors-policy.test.js` ditambahkan ke suite lokal.
- `npm run check`: PASS dan `npm test`: 149 PASS, 0 FAIL, 0 SKIP — DILAPORKAN PENGGUNA pada 21-11-2026, branch `dev`, commit `a6a089d`. Remote suite (`npm run test:remote`): NOT RUN. Deployment/runtime Development: NOT VERIFIED.

## Perbaikan Temuan Keamanan & Error Mapping (2026-11-20)
1. **F-01 (Regex Escape)**: Diperbaiki ke `/[\x00-\x1F\x7F]/` di `src/modules/github/write.js`.
2. **F-02 (Base64 Large Files)**: Helper `uint8ArrayToBase64` ditambahkan di `src/utils/base64.js` dengan chunking 32KB.
3. **F-03 (Missing Content Check)**: Check `data.content` missing/undefined ditambahkan ke `parseAndValidateBody` (menolak dengan HTTP 422).
4. **F-04 (CORS Allowlist & Error Headers)**: Handled di `src/middleware/cors.js` dan `src/index.js`. Wildcard subdomains ditambahkan.
5. **Legacy Core Tests**: 18 tes di `test/github-core.test.js` diperbarui dan lulus 100%.

## Riwayat Hasil Pengujian Historis (sebelum remediation R-001 s/d R-005)
Angka berikut merupakan hasil historis sebelum remediation R-001 s/d R-005 dan tidak menggantikan hasil terbaru yang dilaporkan pada bagian atas dokumen:
- **Total Pengujian**: 140 tes (140 PASS, 0 FAIL, 0 SKIP).
- **Auth Module (`test/auth.test.js`)**: 26/26 PASS.
- **Write Foundation (`test/write-foundation.test.js`)**: 21/21 PASS.
- **GitHub Client PUT/DELETE (`test/github-write.test.js`)**: 34/34 PASS.
- **Router Integration (`test/write-router.test.js`)**: 23/23 PASS.
- **Comprehensive Security Edge Cases (`test/security-edge-cases.test.js`)**: 14/14 PASS.
- **Public Submission (`test/public-submission.test.js`)**: 4/4 PASS.
- **Public Policy & Resilience (`test/github-core.test.js`)**: 18/18 PASS.

## Next Steps
- [x] Dashboard Tester HTML served at / and /tester (VERIFIED).
- [x] R-001 s/d R-005 — remediation kode dan isolasi test; hasil suite lokal terbaru dilaporkan PASS.
- [DEFERRED] R-006 — konfigurasi/verifikasi WAF Development ditunda atas keputusan pemilik proyek; jangan dikerjakan sampai diminta.
- [ ] R-007 — tetapkan kebijakan retensi, akses, dan metadata audit log sebelum implementasi.
- [ ] R-009 s/d R-011 — evaluasi pemeliharaan/infrastruktur.
- Pengambilan `assets` wajib mengutamakan data aktual; tambahkan parameter waktu pada URL request (contoh `?t=<timestamp>`) untuk cache-busting. Pastikan CDN memasukkan query parameter ke cache key atau cache dibypass; perilaku aktual masih NOT VERIFIED.
- Integrasi frontend statis dengan endpoint publik `POST /api/v1/public/submit` tetap menjadi pekerjaan fitur berikutnya.
## Caller Repository Metadata (2026-11-21)
- **IMPLEMENTED ON BRANCH `dev`**: `GET /api/v1/github/repository` now resolves the caller repository from the validated request `Origin` and its fixed `/config.json` path.
- Reuses the existing HTTPS `ALLOWED_ORIGINS` policy; rejects missing/unapproved origins, redirects, oversized config (>32 KiB), invalid UTF-8/JSON, malformed repository identity, and owner values that differ from `GITHUB_OWNER`.
- GitHub metadata is returned only for repositories GitHub identifies as public. The GitHub token is never sent to the caller origin.
- Added `test/repository-metadata.test.js` to the local `npm test` command and documented the flow in `docs/caller-repository-metadata.md`.
- **Verification**: automated tests and syntax checks have NOT RUN in this execution environment; Development deployment/runtime NOT VERIFIED. No Wrangler configuration, secrets, Cloudflare settings, or Production resources changed.


## Guestbook Per-Origin Storage (2026-11-21)
- Implemented on branch dev: POST /api/v1/public/submit derives a hostname-specific path from an HTTPS Origin accepted by ALLOWED_ORIGINS.
- Storage format: public/data/{hostname}/bukutamu.json, JSON array; hostname dots are preserved.
- Existing data is read with its blob SHA and updated optimistically. HTTP 409 triggers a fresh read and bounded retry (maximum three write attempts); exhausted conflicts return 409.
- Request limit remains 15 KiB; serialized Guestbook file limit is 1 MiB. Full files are rejected without truncation. Legacy public/data/guestbook files are not migrated or deleted.
- Added regression tests for first write, append, SHA conflict retry, Origin rejection, payload validation, and method handling.
- Verification: NOT RUN in this environment. Development deployment/runtime: NOT VERIFIED. No Worker config, secrets, deployment, Production resource, or data repository contents were changed.


## RBAC Program — Approved Architecture and Implementation (2026-11-21)
- Architecture and scope approved by project owner; detailed tracker: [RBAC_PLAN.md](RBAC_PLAN.md).
- Roles: Admin (all API-managed data), User (owned repositories only, under `assets/data/`), Guest (public Guestbook submission only).
- User JWT policy: `aud=dekeku-user`, role `user`, 30-minute expiry; Admin retains separate `dekeku-admin` audience.
- Private account/mapping storage target: `dekeku-db`; PBKDF2-SHA256 password hashes; Admin-controlled accounts and repository mapping.
- Guestbook target: mapped website repository `assets/data/bukutamu.json`; public read through static repository/CDN URL.
- Legacy files under `public/data/{hostname}/bukutamu.json` must not be migrated or deleted automatically.
- **Latest status**: RBAC-01 through RBAC-08 source foundations IMPLEMENTED — NOT VERIFIED. RBAC-09 security regression coverage added; execution remains NOT RUN.
- **Verification for the initial RBAC checkpoint**: `npm test` NOT RUN per explicit user instruction; syntax/static checks NOT RUN; Development runtime NOT VERIFIED. Subsequent RBAC implementation records follow.



## RBAC-01 — Private Account Storage Foundation (2026-11-21)
- **Status**: IMPLEMENTED — NOT VERIFIED.
- Added `src/modules/rbac/storage.js` with fixed private document paths `private/auth/users.json` and `private/repositories/mappings.json`; no arbitrary private path is accepted.
- Added strict schema validation for user records (unique ID/username, PBKDF2-SHA256 hash, role fixed to `user`, status, timestamps) and repository mappings (user reference, owner/repo/branch, canonical HTTPS Origin, status, unique active repository and Origin).
- Private GitHub Contents API reads enforce file size, UTF-8, JSON and schema validation; missing files are distinguished from inaccessible repositories. Writes use fixed paths, create-only without SHA, or update with mandatory current SHA.
- Added `test/rbac-storage.test.js` to the local test script. Per explicit instruction, `npm test` was NOT RUN; syntax/static check NOT RUN; Development runtime NOT VERIFIED.
- No account records or mapping files were created in `dekeku-db`; no account-management endpoints exist yet. No secrets, Wrangler config, Cloudflare settings, deployment, or Production resources changed.
- **Next**: RBAC-05 User data CRUD. RBAC-01–04 runtime verification remains pending; cross-document writes are not transactional.


## RBAC-02 — Role and Ownership Middleware (2026-11-21)
- **IMPLEMENTED — NOT VERIFIED** on branch `dev`.
- `src/middleware/auth.js` now provides Admin-only and User-only JWT middleware. The legacy `authMiddleware` export remains an alias to Admin middleware, preserving current Admin routes.
- User auth enforces `iss=dekeku-api`, `aud=dekeku-user`, `role=user` and checks that the subject maps to an active User account in private storage.
- Repository ownership middleware requires an opaque mapping ID and verifies that the active mapping belongs to the authenticated User; repository owner/name/branch/Origin are sourced from private storage only.
- Added `test/rbac-auth.test.js` and registered it in `npm test`.
- Tests: **NOT RUN**; syntax/static checks: **NOT RUN**; Development runtime: **NOT VERIFIED**. No User endpoints/login or data CRUD are exposed yet.
- Next: RBAC-05 User data CRUD. RBAC-01–03 runtime verification remains pending.


## RBAC-03 — Admin Account & Repository Management (2026-11-21)
- IMPLEMENTED — NOT VERIFIED on branch dev.
- Added src/modules/rbac/admin.js for account creation/list/detail/status update/reset-password and repository mapping create/list/soft-disable.
- Added routes under /api/v1/admin/users and /api/v1/admin/repositories/:id, protected by the existing Admin JWT middleware.
- User creation accepts username/password only; role is fixed to user, ID is generated server-side, password uses PBKDF2-SHA256, and hash is omitted from all responses.
- Mapping writes validate user references, repository identity, branch, canonical HTTPS Origin, and active repository/Origin uniqueness. Mapping ID/userId/status are server-controlled.
- Request JSON is streamed with a 16 KiB limit; unknown fields are rejected. Private document updates require current SHA and surface conflicts.
- Added test/rbac-admin.test.js to the local test command.
- npm test: NOT RUN per explicit instruction. Syntax/static checks: NOT RUN. Development runtime: NOT VERIFIED.
- No actual User accounts or repository mappings were written to dekeku-db. No secrets, Wrangler/Cloudflare config, deployment, or Production resources changed.
- Known limitations: users and mappings are separate non-transactional JSON documents; repository existence on GitHub is not checked at mapping registration; list endpoints do not paginate.
- Next: RBAC-05 User data CRUD. RBAC-01–03 verification remains pending.


## RBAC Program — Current Implementation Status (2026-11-21)
| Stage | Scope | Implementation status | Verification |
|---|---|---|---|
| RBAC-01 | Private account storage and mappings | IMPLEMENTED | NOT VERIFIED |
| RBAC-02 | Admin/User auth and ownership middleware | IMPLEMENTED | NOT VERIFIED |
| RBAC-03 | Admin account/repository management | IMPLEMENTED | NOT VERIFIED |
| RBAC-04 | User login and 30-minute JWT | IMPLEMENTED | NOT VERIFIED |
| RBAC-05 | User CRUD under assets/data/ | IMPLEMENTED | NOT VERIFIED |
| RBAC-06 | Private/public data boundary | IMPLEMENTED | NOT VERIFIED |
| RBAC-07 | Guestbook per website repository | IMPLEMENTED | NOT VERIFIED |
| RBAC-08 | Browser User sessionStorage | IMPLEMENTED | NOT VERIFIED |
| RBAC-09 | Security/regression review | TESTS ADDED — NOT VERIFIED | NOT RUN |

### RBAC-04 Implementation Detail
- Added src/modules/auth/user-login.js and POST /api/v1/user/login.
- Reads only private account storage, verifies PBKDF2-SHA256, rejects disabled accounts, and returns generic 401 for invalid credentials.
- Successful JWT claims: issuer dekeku-api, audience dekeku-user, role user, subject = immutable user ID, lifetime = 1800 seconds.
- Added bounded JSON parser (16 KiB), strict content type/UTF-8/object validation, and rejects unsupported request fields.
- Added test/rbac-user-login.test.js to local test script.
- Tests: NOT RUN per explicit instruction. Syntax/static checks: NOT RUN. Development runtime: NOT VERIFIED.
- No actual account or private data was created/changed. No secrets, Wrangler/Cloudflare config, deployment, or Production resources changed.
- Before production exposure, verify Cloudflare WAF rate limiting for /api/v1/user/login; application-level throttling/audit logging are not part of this stage.
- Next: RBAC-06 private/public data boundary review.


## RBAC-05 — User Data CRUD (2026-11-21)
- Status: IMPLEMENTED — NOT VERIFIED.
- Added src/modules/rbac/user-data.js and mounted GET /api/v1/user/repositories plus GET/POST/PUT/DELETE /api/v1/user/data.
- User routes require User JWT and active account status. File operations require a registered repositoryId mapped to the authenticated subject; owner, repository, and branch come only from private mappings.
- Client path is relative; server fixes the prefix to assets/data/. Traversal, encoding, backslash, absolute path, hidden segments, control characters, repeated separators, and non-JSON extensions are rejected.
- GET reads and parses JSON and returns SHA. POST creates; PUT/DELETE require current 40-character SHA. GitHub handles concurrent modification conflicts; no blind overwrite or retry.
- JSON root object/array only; maximum stored JSON file 1 MiB; streamed request body maximum 1,153,434 bytes; strict UTF-8.
- Added test/rbac-user-data.test.js to local test script.
- npm test: NOT RUN per explicit instruction. Syntax/static checks: NOT RUN. Development runtime: NOT VERIFIED. No real account, mapping, or target repository data changed; no secrets/config/deployment/Production resources touched.
- Next: RBAC-06 private/public data boundary review, including public reader isolation from private and assets/data paths. RBAC-01–05 runtime verification remains pending.


## RBAC-06 — Private/Public Data Boundary Review (2026-11-21)
- **Source review: VERIFIED** on branch `dev`.
- Public file route `GET /api/v1/github/file` delegates to `GitHubClient.getFile()`, which decodes and validates the path with `validatePublicPath()` before making any GitHub API request. The policy requires the first path segment to be exactly `public`, rejects hidden segments, traversal, malformed/empty segments, sensitive names, and non-allowlisted extensions.
- Confirmed `private/auth/users.json`, `private/repositories/mappings.json`, and `assets/data/*.json` are outside the public allowlist. User CRUD is routed separately behind User JWT and ownership mapping; Admin account/mapping routes remain behind Admin JWT; Guest submission remains a separate public POST route requiring an allowlisted Origin.
- Added `test/rbac-boundary.test.js` covering fixed private-storage paths, denial of private/assets paths before upstream access, traversal/hidden-path rejection, and Admin/User/Guest route separation. Registered it in `package.json`.
- **Verification**: source review VERIFIED; regression test source added but **NOT RUN**; syntax/static checks **NOT RUN**; Development runtime **NOT VERIFIED**.
- No runtime GitHub reads/writes, real account/mapping/data changes, secrets, Wrangler/Cloudflare settings, deployment, or Production resources changed.
- **Stage status: IMPLEMENTED — NOT VERIFIED.** RBAC-01–06 foundations implemented; runtime verification remains pending. Next: RBAC-07 Guestbook per mapped website repository.


## RBAC-07 — Guestbook per Mapped Website Repository (2026-11-21)
- **Status: IMPLEMENTED — NOT VERIFIED** on branch `dev`.
- Replaced legacy central-repository Guestbook writes with server-side Origin mapping resolution from private `dekeku-db` documents (`private/auth/users.json` and `private/repositories/mappings.json`).
- A submission now requires an HTTPS Origin allowed by `ALLOWED_ORIGINS` and an active exact Origin mapping. Client cannot submit repository owner/name/branch, mapping ID, or file path.
- Destination repository coordinates are derived only from the validated private mapping. Worker verifies the target repository exists and is public, then writes only to fixed `assets/data/bukutamu.json`.
- Preserved array JSON format, name/message/email validation, strict UTF-8 request parsing, streamed 15 KiB request cap, 1 MiB stored-file cap, SHA optimistic concurrency, and at most three read/write attempts after 409 conflicts.
- Existing `public/data/{hostname}/bukutamu.json` files are not read, deleted, copied, or migrated.
- Updated `test/public-submission.test.js` with mapped repository creation/append, SHA conflict retry, unregistered Origin, private/missing target repository, unsupported fields, and method/content-type cases. The test is already registered in `package.json`.
- Source review: VERIFIED. Test execution: **NOT RUN** per instruction. Syntax/static checks: **NOT RUN**. Development runtime: **NOT VERIFIED**.
- **Security follow-ups**: Origin is not authentication and can be spoofed by non-browser clients. No application-level Guestbook rate limiter is implemented; Cloudflare WAF/IP rate limiting for `POST /api/v1/public/submit` must be verified/configured in Development before public exposure. Do not modify Production.
- No real mapping/account, target website data, secrets, Wrangler/Cloudflare configuration, deployment, or Production resource changed.
- Next: close RBAC-09 verification gaps: permitted syntax/static checks, Development WAF evidence, and CDN cache integration review. RBAC-01–08 remain runtime NOT VERIFIED.


## RBAC-08 — Browser User Session Integration (2026-11-21)
- **Status: IMPLEMENTED — NOT VERIFIED** on branch `dev`.
- Updated both Tester dashboard copies: `src/modules/tester/index.js` (Worker-served page) and `public/tester.html` (static copy).
- Added User login form calling `POST /api/v1/user/login`; reads the documented `access_token` response field and clears the password field after submission.
- User JWT is stored only in `sessionStorage` under `dekeku_user_access_token`, restored when the same browser tab/session reloads, and never displayed or logged. If sessionStorage is unavailable, login is not treated as established.
- Added a separate `userRequest()` helper that attaches only the User Bearer token. Public requests explicitly remove Authorization; Admin requests continue using the separate in-memory Admin token.
- Added User logout and User repository listing action. A 401 from an authenticated User request, or a 403 carrying the exact `User account is unavailable` error, clears only the User session; Admin 401 clears only the Admin in-memory session.
- Updated `test/tester-dashboard.test.js` assertions for both dashboard copies, role-specific Authorization isolation, sessionStorage lifecycle, and logout/401 cleanup. Test execution **NOT RUN** per explicit instruction.
- Source inspection: VERIFIED. Syntax checks and tests: **NOT RUN**. Development browser/runtime: **NOT VERIFIED**.
- Security note: sessionStorage is JavaScript-readable and remains exposed to XSS; maintain strict output escaping/CSP and avoid third-party scripts. Token lifetime remains server-enforced at 30 minutes.
- No secrets, account records, mappings, Wrangler/Cloudflare configuration, deployment, or Production resources changed.
- **Next: RBAC-09 security and regression review.** RBAC-01–08 implementation exists but remains runtime NOT VERIFIED.


## RBAC-09 — Security & Regression Review (2026-11-21)
- **Status: TESTS ADDED — NOT VERIFIED.**
- Source review covered router, Admin/User middleware, private storage, Admin management, User data CRUD, User login/JWT, Guestbook submission, GitHub client, CORS, public file allowlist, and Tester session handling.
- Added `test/rbac-security-review.test.js` with five integration regression scenarios: cross-User mapping denial before target access; server-authoritative repository coordinates; rejection of client-supplied owner/repo/branch; disabled-account rejection before mapping access; expired JWT rejection before private storage access.
- Registered the new test file in `package.json`.
- `npm test`: NOT RUN per explicit instruction. Syntax/static checks: NOT RUN. Development runtime/WAF/CDN: NOT VERIFIED.
- Review confirms separate Admin/User audience and role checks, active-account recheck, mapping ownership check, fixed `assets/data/` prefix, fixed private storage allowlist, public reader separation, bounded JSON validation, and CORS support for Authorization.
- Open risks: no application-level rate limiter for User login/Guestbook; Cloudflare WAF/IP rate limiting remains DEFERRED. Guestbook Origin is spoofable by non-browser clients and is not authentication. CDN cache/invalidation after Guestbook writes remains unverified. R-013 source implementation and focused regression tests are present on dev but NOT VERIFIED; the deployed Worker has not been updated, so old JWTs may remain usable until their remaining expiry (up to 30 minutes). Browser sessionStorage remains readable by same-origin scripts (XSS exposure).
- No secrets, account/mapping data, website data, Wrangler/Cloudflare configuration, deployment, or Production resources changed.
- **Next:** perform permitted syntax/static checks without running `npm test`; implement approved R-013 token/session version mechanism with focused regression coverage. WAF remains DEFERRED; CDN freshness verification remains pending.


## Current Verification Queue — Authoritative (2026-11-21)

1. R-013 implementation: PRESENT on `dev`; per-user `tokenVersion` is backward-compatible, included in new User JWTs, checked on authenticated User requests, and incremented during successful Admin password reset with SHA-safe concurrency.
2. R-013 syntax validation: PASS — `node --check` completed for all RBAC source and test files, based on the owner's Termux test report.
3. R-013 focused regression test: PASS — `node --test test/rbac-token-version.test.js`, 6 PASS, 0 FAIL, based on the owner's Termux test report.
4. `npm test`: NOT RUN, as explicitly instructed.
5. Development runtime/deployment: NOT VERIFIED; no Worker deployment was performed. Therefore the deployed Worker may still accept pre-reset User JWTs until their remaining expiry (up to 30 minutes).
6. Non-active follow-up tasks have been moved to `project/TASK_ARCHIVE.md`; archive details are intentionally not repeated in this progress summary.
7. Production Worker/domain/secrets/configuration/data: untouched.

**Evidence qualification:** the syntax and focused-test results above are recorded from the owner's report that testing was completed in Termux. They were not independently re-executed in this ChatGPT session. No `npm test` was run.

See [EXECUTION_POLICY.md](EXECUTION_POLICY.md) for the ordered queue and mandatory constraints.

## Owner Decision — Follow-up Task Archiving (2026-11-21)
- Owner requested that selected follow-up tasks be stored in `project/TASK_ARCHIVE.md` and not displayed in ordinary progress reports unless the archive is explicitly requested.
- Archived items are not active work and must not be resumed automatically.


## Owner Decision — R-013 Immediate User JWT Revocation (2026-11-21)
- **Decision: APPROVED**. After Admin successfully resets a User password, every previously issued JWT for that User must be rejected immediately; the User must authenticate again using the new password.
- Approved implementation direction: add a per-user token/session version to the private User record; include the current version in newly issued User JWTs; compare the JWT claim against the authoritative private record on every authenticated User request; increment the version during successful password reset using SHA-safe concurrency handling.
- Scope: User JWTs only. Admin JWT behavior is unchanged.
- Implementation status: SOURCE ADDED on dev, NOT VERIFIED. No Development deployment has been performed; the currently deployed Worker may still allow old JWTs until expiry (up to 30 minutes).
- The decision-recording change was documentation-only. The subsequent R-013 source implementation is recorded separately below; no account data, secrets, Worker configuration, deployment, or Production resources were changed.


## R-013 Implementation Update (2026-11-21)
- Added optional backward-compatible tokenVersion validation to private User records; legacy records without the field resolve to version 0.
- New User accounts start at version 0; User login includes the current version in the dekeku-user JWT.
- userAuthMiddleware and repository ownership middleware compare the token claim with the current private account record. Missing legacy claims mean version 0; explicitly malformed claims are rejected.
- Successful Admin password reset updates passwordHash and increments tokenVersion in the same SHA-guarded private document write. SHA conflicts are surfaced; no blind overwrite/retry. Version overflow is rejected.
- Added test/rbac-token-version.test.js and registered it in package.json; covers legacy records/tokens, invalid versions, old-token rejection after reset, new-password login, Admin JWT isolation, and SHA conflict behavior.
- Syntax validation (`node --check`): PASS across all RBAC source and test files, reported by the owner after running in Termux. Focused regression test (`node --test test/rbac-token-version.test.js`): PASS (6 PASS, 0 FAIL), reported by the owner after running in Termux. These results were not independently re-executed in this session. `npm test`: NOT RUN.
- Follow-up items are archived in `project/TASK_ARCHIVE.md` at the owner's request; do not display their details in ordinary progress reports.
