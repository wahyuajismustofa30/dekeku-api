# PROGRESS STATUS — DEKEKU API Gateway

Tanggal Pembaruan: 2026-11-22 (PUB-004 Public Repository File Browser audit & remediation complete)

## Ringkasan Proyek
- **Ruang lingkup aktif terbaru**: pengelolaan data publik pada repository masing-masing proyek. Tugas pengaturan repository privat/RBAC dipindahkan ke arsip A-003; kode dan catatan historis tetap dipertahankan.
- **Fokus pekerjaan saat ini**: PUB-005 — penyempurnaan Tester Dashboard sebagai public JSON file manager. Antrean urut ada di `EXECUTION_POLICY.md`.
- **Fase Aktif**: Public Repository Management — pemetaan repository proyek dan pengelolaan file publik. Implementasi multi-repository belum selesai.
- **Status Keseluruhan**: Source RBAC-01 s/d RBAC-08 tersedia di `dev`; RBAC sebagai sistem terintegrasi dan Development runtime tetap NOT VERIFIED. R-013 source + focused regression test tersedia; `node --check` dan focused test (6 PASS, 0 FAIL) PASS berdasarkan laporan pemilik dari Termux, belum dijalankan ulang secara independen di sesi ini. `npm test` tetap NOT RUN. WAF dan CDN/cache follow-up tidak aktif; item yang diarsipkan tidak boleh dilanjutkan otomatis.
- **Prioritas teknis aktif**: PUB-005 — PUB-004 Public Repository File Browser selesai (51/51 PASS pada suite PUB-002/PUB-003/PUB-004); langkah selanjutnya adalah penyempurnaan Tester file manager.
- **Baseline audit CI/CD**: branch `dev`, HEAD `09df42e24ab911efa5ed2541f7e80ddb665c20b7`.
- **Acuan status tunggal**: dokumen ini. Urutan kerja wajib ada di [EXECUTION_POLICY.md](EXECUTION_POLICY.md), checklist rinci di [BACKLOG.md](BACKLOG.md), dan seluruhnya harus konsisten.
- **Bukti historis**: laporan pengguna untuk commit `a6a089d` (149 PASS, 0 FAIL, 0 SKIP dan `npm run check` PASS) adalah bukti historis, bukan verifikasi HEAD saat ini.
- **Larangan tes**: `npm test` NOT RUN sesuai instruksi pemilik proyek. Jangan menjalankannya.

## PUB-002 Verification Update (2026-11-22)
- Owner-reported local verification on branch `dev`: `node --check src/modules/github/repositories.js` PASS; `node --check test/repository-metadata.test.js` PASS; `node --test test/repository-metadata.test.js` PASS (12 PASS, 0 FAIL, 0 SKIP).
- PUB-002 source and focused test verification are COMPLETE. Development runtime remains NOT VERIFIED.


## PUB-004 Audit & Remediation Update (2026-11-22)
- Endpoint `GET /api/v1/admin/browse` implemented in `src/modules/github/browse.js` and mounted in `src/core/router.js` behind Admin JWT middleware (`authMiddleware`).
- Resolves target repository and branch exclusively via `resolveProjectRepository(request, env)`.
- Enforces strict path validation: restricts browsing to `public/`, blocks traversal, backslashes, control characters, malformed encoding, hidden files (`.`), and sensitive files (`package.json`, `secrets.json`, `.env`, `.pem`, `.key`, etc.).
- Enhanced item child path validation: requires `item.path === \`\${pathValidation.path}/\${item.name}\``, rejecting items outside the requested directory.
- Enhanced symlink/submodule rejection: explicitly rejects items carrying `target` or `submodule_git_url` properties, even if typed as `file` or `dir`.
- Filters directory listings to omit hidden/sensitive files, symlinks, and submodules. Returns strictly required metadata (`name`, `path`, `type`, `size`, `sha`) without file contents or internal GitHub API URLs.
- Upstream items capped at 1,000 max per directory with `truncated: true` flag when exceeded. Pagination capped at 100 items per page.
- Added regression tests in `test/browse-router.test.js` for child path mismatch and fake symlink/submodule properties.
- Verification: `node --check` PASS for all modified files (`src/modules/github/browse.js`, `src/core/github.js`, `src/core/router.js`, `test/browse-router.test.js`). `node --test test/browse-router.test.js test/repository-metadata.test.js test/write-router.test.js` PASS (52 PASS, 0 FAIL, 0 SKIP; 20 tests in browse suite). `git diff --check` PASS (exit code 0).
- `npm test` NOT RUN per explicit instruction. Development runtime remains NOT VERIFIED.

## PUB-003 Implementation Update (2026-11-22)
- `resolveProjectRepository(request, env)` is now the shared server-side resolver for metadata and Admin file operations. It requires a canonical trusted Origin, fetches `/config.json`, validates schema v1 and owner, verifies GitHub repository identity/public visibility, and takes `default_branch` only from GitHub metadata.
- Admin SHA lookup and CREATE/UPDATE/DELETE now construct their GitHub client from that validated repository context; static `GITHUB_REPO`/`GITHUB_BRANCH` no longer determine these write targets. Admin JWT remains enforced by the outer router.
- Owner-reported local verification: `node --check` PASS for `src/core/github.js`, `src/modules/github/repositories.js`, `src/modules/github/write-router.js`, and `test/write-router.test.js`; focused `node --test test/write-router.test.js test/repository-metadata.test.js` PASS (37 PASS, 0 FAIL, 0 SKIP).
- PUB-003 source + focused verification COMPLETE based on owner-reported terminal output. Development runtime remains NOT VERIFIED. No real website repository data was written; no deployment, Wrangler/Cloudflare setting, secret, or Production resource was changed.

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

## Historical Next Steps — SUPERSEDED
Daftar berikut adalah snapshot rekomendasi dari tahap sebelumnya, bukan antrean aktif. Status, penundaan, dan pengarsipan terbaru mengikuti `PROGRESS.md`, `BACKLOG.md`, `TASK_ARCHIVE.md`, serta urutan tunggal di `EXECUTION_POLICY.md`. Jangan memulai item hanya karena masih tercantum pada snapshot historis.
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
- **Historical next step — SUPERSEDED:** this section predates the R-013 implementation and owner-reported Termux verification recorded below. Do not use this instruction as the current queue; see `EXECUTION_POLICY.md`.


## Current Verification Status — Authoritative (2026-11-21)

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


## Governance Update — Authority Hierarchy (2026-11-21)
- **Wahyu / Project Owner:** pemegang seluruh keputusan mutlak dan persetujuan final.
- **ChatGPT:** asisten pengembangan utama, urutan kedua; mengelola analisis, rencana, koordinasi/delegasi, dan review.
- **Codex di Termux:** asisten pelaksana, urutan ketiga; membantu ChatGPT di lingkungan Termux sesuai delegasi dan instruksi Wahyu.
- Jika dokumentasi, keputusan lama, implementasi, atau arahan asisten bertentangan dengan instruksi terbaru Wahyu, hentikan tindakan terkait, laporkan konflik dan dampaknya, lalu berikan pilihan atau minta persetujuan spesifik sesuai keadaan.
- Dokumentasi yang bertentangan diperbarui jika instruksi Wahyu jelas dan aman; catatan historis tetap dipertahankan sebagai sejarah.
- Rincian normatif: [MASTER.md](MASTER.md) bagian 8, [DECISIONS.md](DECISIONS.md) D-024, [EXECUTION_POLICY.md](EXECUTION_POLICY.md), dan [AGENTS.md](../AGENTS.md).


## CI/CD Development — Owner-Approved Direction (2026-11-21)

- Development work is performed on branch `dev`; changes are proposed to `main` through a Pull Request after they are stable.
- Pull Requests from `dev` to `main` must run the agreed validation workflow. Critical validation failures block merging; optional/non-critical checks may initially report warnings.
- A successful update to `main` is the intended trigger for GitHub Actions to deploy **only** the Development Worker `dekeku-api-dev`.
- A PR itself must not deploy. Deployment must use Development-only credentials and configuration; Production credentials, Worker `github`, domain `api.dekeku.my.id`, and Production data are out of scope.
- The deployment workflow must prevent overlapping deployments, identify the source commit, and fail closed if the target cannot be confirmed as Development.
- This is an approved target policy, not evidence that CI/CD has been implemented. Until the relevant tasks are completed and verified, no automatic deployment is assumed to exist.


## CI/CD Progress Status (2026-11-21)

- **Owner decision:** D-025 approved. Development on `dev`; stable changes go through PR to `main`; updates to `main` are intended to deploy only to Development Worker `dekeku-api-dev`.
- **Implementation:** NOT STARTED. No workflow files or GitHub Actions settings were changed in this documentation update.
- **Active task tracking:** CICD-001..CICD-010 added to `BACKLOG.md`; execution order is recorded in `EXECUTION_POLICY.md`.
- **Production:** untouched and excluded.


## Documentation Reconciliation & Owner Workstream Selection (2026-11-21)
- Owner selected option C: reconcile documentation first; do not start RBAC runtime work or CI/CD during this pass.
- Current documentation status: reconciled to the owner-reported R-013 Termux verification, explicit `npm test` prohibition, archived/deferred follow-ups, and approved Development-only CI/CD target policy.
- **Historical status — SUPERSEDED by owner instruction:** at the time of the earlier documentation reconciliation, the next technical workstream had not been selected. The owner subsequently selected Development CI/CD; CICD-001 and CICD-002 are complete and CICD-003 is active.
- No source code, tests, Wrangler configuration, Cloudflare settings, secrets, accounts, mappings, website data, deployment, or Production resources changed by this documentation task.


## Development CI/CD — Current Workstream (2026-11-21)
- **Owner instruction:** after selecting option C for documentation reconciliation, the owner explicitly instructed to continue with the CI/CD workstream.
- **CICD-001 — COMPLETE (read-only):** audited repository tree, Wrangler target, package scripts, .gitignore, README, and GitHub branch metadata at dev HEAD `09df42e24ab911efa5ed2541f7e80ddb665c20b7`.
- Findings: no .github/workflows exists at the audited commit; Worker name is `dekeku-api-dev`; Wrangler has no named environment; package scripts have no deploy command; build/check are syntax checks only. GitHub Actions secrets/environments/settings are NOT VERIFIED.
- **CICD-002 — COMPLETE:** current instructions consistently require development on `dev`, PR `dev` → `main`, and prohibit direct commit/push to `main`. No policy conflict found in AGENTS.md, MASTER.md, README.md, and D-025.
- **Branch protection finding:** GitHub branch metadata reports `protected=false` for both `dev` and `main`; full branch protection detail is NOT VERIFIED due API permission restriction. No settings were changed.
- **NEXT ACTIVE:** CICD-003 — define PR validation contract only. Do not create/run workflows or deploy until required design and approval gates are satisfied.
- **Constraints:** `npm test` remains NOT RUN. Production Worker `github`, `api.dekeku.my.id`, Production credentials/config/data untouched. No Wrangler, Cloudflare, secrets, source code, or workflow changes.


## CICD-003 — PR Validation Contract (2026-11-21)
- **Status: COMPLETE — DEFINED.** Kontrak rinci disimpan di [CICD_VALIDATION_CONTRACT.md](CICD_VALIDATION_CONTRACT.md).
- Required/blocking: `npm ci`, syntax check seluruh JS relevan di `src/` dan `test/`, Wrangler `deploy --dry-run`, serta focused regression test untuk perubahan kode jika suite dapat dipetakan.
- Warning awal: `npm audit --audit-level=high` dan perubahan kode yang belum memiliki mapping test. Klasifikasi ini dapat diperketat setelah baseline ditinjau.
- `npm test` tetap NOT RUN; `npm run test:remote` dan `test/live-remote.test.js` dilarang di PR CI karena dapat menulis data aktif.
- PR workflow hanya memvalidasi; tidak deploy, tidak memerlukan secrets Cloudflare/GitHub API, dan tidak mengakses Production.
- **NEXT ACTIVE: CICD-004** — implementasi workflow PR validation. Workflow belum dibuat dan belum diuji.
- README masih memuat instruksi `npm test`; perlu diselaraskan pada pekerjaan dokumentasi terpisah tanpa mengubah larangan pemilik.


## CICD-004 — PR Validation Workflow (2026-11-21)
- **IMPLEMENTED on `dev`**: `.github/workflows/pr-validation.yml`.
- Trigger: pull request targeting `main`, guarded to head branch `dev`; PR event has no deployment step.
- Checks: `npm ci`; syntax validation for all `.js` files under `src/` and `test/`; explicit `dekeku-api-dev` Wrangler target guard and `wrangler deploy --dry-run`; deterministic focused test selection for mapped changed source/test files; `npm audit --audit-level=high` warning-only.
- Security: immutable action commit pins, read-only `contents` permission, checkout credential persistence disabled, per-PR concurrency cancellation. No Cloudflare or GitHub API secrets.
- `npm test`: NOT RUN. `npm run test:remote` and `test/live-remote.test.js`: NOT RUN and excluded from execution.
- **CI workflow run / YAML runtime validation: NOT VERIFIED**; requires an actual PR `dev` → `main`. No PR was created and no branch protection settings were changed.
- **NEXT ACTIVE: CICD-006** — verify and isolate Development-only credentials for the later main-to-Development deployment workflow. No secrets were read or changed.

## Current Status — Authoritative Update (2026-11-22)

- **Branch state:** exactly two branches exist, `main` and `dev`. They are identical at `1649701419f6d1b03b5f659c76f02d02b4355ad8` after fast-forwarding `dev` to `main`; no force update was used and no unique `dev` commit was discarded.
- **GitHub PR validation:** `.github/workflows/pr-validation.yml` exists and is configured for PRs targeting `main` from same-repository `dev`. It validates dependencies, JavaScript syntax, Development Worker Wrangler dry-run, mapped focused tests, and warning-only dependency audit. It has no deployment step and no secrets.
- **CI evidence:** no workflow run was returned for the synchronized commit; PR validation execution remains NOT VERIFIED until a PR triggers it. No open PR existed at the start of this audit.
- **Cloudflare Git deployment:** owner reports automatic Workers deployment from GitHub is configured and a deployment from GitHub succeeded. This is owner-reported, not independently verified: Cloudflare dashboard integration settings, exact target branch, deployed version ID, and health response were not inspected.
- **Deployment boundary:** intended target is Development Worker `dekeku-api-dev` only. Production Worker `github`, `api.dekeku.my.id`, Production variables/secrets/data were not accessed or changed.
- **Validation restrictions:** `npm test` was not run. No remote test, Worker deployment, secret read, or Cloudflare setting change was performed in this audit.
- **Next active work:** create a documentation-only PR `dev` → `main` to trigger existing PR validation; review actual check results. Then independently verify Cloudflare Git deployment target and deployed Development version/health before claiming automatic deployment verified.

## PR Validation Trigger — PR #23 (2026-11-22)

- Documentation-only PR #23 is OPEN: https://github.com/wahyuajismustofa30/dekeku-api/pull/23
- Head: `dev` at `49a0b92dbe8a8530907c0c50879a07c7026a7abf`; base: `main` at `1649701419f6d1b03b5f659c76f02d02b4355ad8`.
- GitHub compare shows `dev` ahead by 8 commits and not behind; all 8 commits are the documentation reconciliation sequence. No source or test files changed in this PR.
- PR was created to trigger `.github/workflows/pr-validation.yml`. At the time of this checkpoint, workflow-runs lookup and combined commit status returned no runs/statuses; CI result remains NOT VERIFIED.
- Do not merge PR #23 independently. Wait for actual required checks and owner review.


## Tester Dashboard Workspace Redesign (2026-11-22)
- Redesign visual pada `public/tester.html` dan `src/modules/tester/index.js` dengan pola workspace phpMyAdmin: sidebar navigasi, top bar, overview, panel API/Guestbook/Admin/User/JSON operations, serta response console.
- Seluruh fungsi dan batas keamanan request sebelumnya dipertahankan; tidak ada endpoint atau kemampuan backend baru yang ditambahkan.
- Regression assertion navigasi/panel ditambahkan ke `test/tester-dashboard.test.js`.
- Source synchronization check: VERIFIED (static HTML sama dengan template HTML yang dihasilkan route).
- Automated tests/syntax checks: NOT RUN sesuai larangan `npm test`; Development browser/runtime: NOT VERIFIED. Tidak ada deployment atau perubahan Production.


## Branch Synchronization Completed — 2026-11-22
- PR #24 (`dev` → `main`) membawa redesign Tester dan catatan proyek; PR validation GitHub Actions run #7 selesai dengan `success`.
- PR #24 berhasil di-merge ke `main` sebagai commit `13529fc915859fcc86ff33e65f242235605819d8`.
- `dev` kemudian di-fast-forward ke commit yang sama dengan `force=false`; perbandingan GitHub `main` ↔ `dev` menunjukkan `identical` (0 ahead / 0 behind).
- Branch inventory tetap tepat dua: `main` dan `dev`.
- `npm test` tidak dijalankan. Tidak ada deployment Cloudflare atau perubahan Production.


## PUB-001 — Public Repository Config Contract (2026-11-22)
- **Status desain**: COMPLETE. Normative contract: `project/PUBLIC_REPOSITORY_CONTRACT.md` (PUB-CONFIG-001 v1); machine-readable schema: `docs/schemas/public-repository-config.schema.json`.
- Config is published at the website origin root as `/config.json`; required fields: `schema_version: 1`, `project.id`, and `repository.username` + `repository.repo`.
- Repository owner must match trusted `GITHUB_OWNER`; target repository must be public. GitHub API `default_branch` is authoritative; schema v1 intentionally has no branch override.
- Discovery requires an explicitly trusted canonical HTTPS Origin. CORS wildcard alone is not a trusted repository mapping. Origin is a selector, never authentication.
- At the PUB-001 specification checkpoint, schema version/project ID and exact-Origin enforcement were still gaps. PUB-002 and PUB-003 now close those source-level gaps; later checkpoints below record implementation and owner-reported test evidence.
- **Source code changes**: none. **Automated tests/schema validation**: NOT RUN. **Development runtime**: NOT VERIFIED. **Production/Cloudflare settings/secrets/data**: untouched.


## PUB-002 — Schema and Trusted-Origin Enforcement (2026-11-22)
- **Implementation status**: IN PROGRESS on `dev`.
- `src/modules/github/repositories.js` now validates exact schema-v1 keys, `schema_version`, project ID format/length, repository username/name, and owner equality with `GITHUB_OWNER`.
- Repository discovery now requires an exact canonical HTTPS origin listed in `ALLOWED_ORIGINS`; wildcard entries are ignored for this purpose (they remain CORS-only).
- GitHub metadata must match the requested `owner/repo`, have `visibility: public`, and provide a non-empty default branch without control characters.
- `test/repository-metadata.test.js` was updated with valid schema fixtures and regression cases for wildcard-only origins, unsupported/missing schema fields, invalid project ID, control characters, dot-segment repository names, unknown properties, owner mismatch, invalid repository name, GitHub identity mismatch, missing default branch, and private visibility.
- **Automated tests / syntax checks**: NOT RUN in this session. `npm test` remains prohibited; focused `node --test test/repository-metadata.test.js` is permitted but has not yet been executed because no local checkout/runtime is attached to this session.
- **Development runtime**: NOT VERIFIED. **Production, Wrangler, Cloudflare settings, secrets and data**: untouched.
- Verification completed: owner reported syntax checks PASS and `node --test test/repository-metadata.test.js` PASS (12 PASS, 0 FAIL, 0 SKIP). Development runtime remains NOT VERIFIED.
