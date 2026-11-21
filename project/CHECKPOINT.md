DEKEKU GATEWAY — PROJECT CHECKPOINT

Tanggal checkpoint: 2026-11-21
Status: PHASE 2.3 DOCUMENTED — FOLLOW-UP SECURITY REVIEW PENDING

*Acuan Utama*: Sumber status fitur adalah [PROGRESS.md](PROGRESS.md). Daftar rekomendasi dan kriteria penerimaan ada di [RECOMMENDATIONS.md](RECOMMENDATIONS.md).

## 1. Identitas Proyek & Batas Operasional
- Project: DEKEKU API Gateway
- Development branch: dev
- Development Worker: dekeku-api-dev
- Production Worker: github — protected; do not modify without explicit approval.
- GitHub is a backup/review path; follow D-011 for development changes.

## 2. Status Pengembangan yang Tercatat
- Phase 1 s/d 2.3: tercatat COMPLETED di PROGRESS.md.
- `npm run check`: PASS dan `npm test`: 149 PASS, 0 FAIL, 0 SKIP berdasarkan laporan pengguna tanggal 2026-11-21 pada branch `dev`, commit `a6a089d`; tidak dieksekusi ulang secara independen dalam pekerjaan dokumentasi ini.
- Runtime dan deployment tidak diuji dalam pekerjaan dokumentasi ini.
- Perubahan konfigurasi Cloudflare dan secret tidak dilakukan.

## 3. Temuan Review yang Menunggu Tindak Lanjut
- **P0 R-001:** IMPLEMENTED; same-origin enforced, JWT sesi memori, helper publik/admin dipisah. Isolated harness PASS; suite lokal 149 PASS berdasarkan laporan pengguna; deployment/runtime NOT VERIFIED.
- **P1 R-002:** IMPLEMENTED — login memakai `access_token` dan token direduksi dari log.
- **P1 R-003:** IMPLEMENTED — JSON headers, input validation, double-submit guard, success-only reset. Regression tests termasuk dalam suite lokal.
- **P1 R-004:** IMPLEMENTED — strict HTTPS origin parser, wildcard subdomain-only, apex explicit allowlist, port/credentials/path checks, `Vary: Origin`; regression test ditambahkan. Isolated harness PASS; suite lokal 149 PASS berdasarkan laporan pengguna.
- **P1 R-005:** IMPLEMENTED — `npm test` lokal eksplisit; remote test hanya melalui `npm run test:remote`; global fetch cleanup memakai `afterEach`/`finally`. `npm run check` dan suite lokal PASS berdasarkan laporan pengguna.
- **P1 R-006:** WAF rate limiting disetujui pada D-013, tetapi konfigurasi aktual NOT VERIFIED.
- **P1 R-007:** Rancang failed-login audit logging tanpa secret.
- **R-008:** COMPLETED — dokumentasi status, hasil tes, changelog, dan checkpoint telah disinkronkan; lihat commit dokumentasi dan PR #16.
- Rincian lengkap dan acceptance criteria: [RECOMMENDATIONS.md](RECOMMENDATIONS.md).

## 4. Langkah Berikutnya
1. R-006: verifikasi WAF Development untuk admin login; jangan menyentuh Production.
2. R-007: sepakati retensi log, pihak yang berhak mengakses, dan metadata yang boleh dicatat sebelum implementasi.
3. R-009 s/d R-011 tetap pekerjaan evaluasi terpisah.
4. Lanjutkan integrasi frontend statis dengan endpoint public submission bila diprioritaskan.

## 5. Batasan Pekerjaan Terakhir
- Source Dashboard, salinan HTML, regression test, dan script `npm test` diperbarui pada branch `dev`.
- Isolated JavaScript harness dijalankan terhadap script Dashboard dan CORS aktual; skenario inti PASS.
- `npm run check`: PASS; `npm test`: 149 PASS, 0 FAIL, 0 SKIP berdasarkan laporan pengguna (21-11-2026, branch `dev`, commit `a6a089d`). Output terminal mentah tidak disertakan dalam catatan ini.
- Remote test NOT RUN; deployment/runtime Development NOT VERIFIED.
- Tidak ada secret, konfigurasi Worker, deployment, atau runtime Production yang diubah.
## 6. Caller Repository Metadata — New Work (2026-11-21)
- Branch: `dev`.
- Implemented `GET /api/v1/github/repository` lookup from validated `Origin` → fixed `/config.json` → `repository.username` + `repository.repo` → GitHub repository metadata.
- Origin uses the shared CORS HTTPS allowlist; caller owner must match `GITHUB_OWNER`; private repositories are rejected; config response is capped at 32 KiB, timeout 8 seconds, redirects disabled.
- Regression suite added: `test/repository-metadata.test.js`; added to `npm test`.
- Design notes: `docs/caller-repository-metadata.md`.
- Test execution, local syntax validation, and Development runtime/deployment: NOT RUN / NOT VERIFIED in this environment.
- No secrets, Wrangler bindings, Cloudflare settings, Worker deployment, or Production resources changed.


## 7. Guestbook Per-Origin Storage — Implemented on dev (2026-11-21)
- Commit: see latest dev head after this checkpoint update.
- Endpoint now derives hostname from validated HTTPS Origin and stores all submissions for that hostname in public/data/{hostname}/bukutamu.json as a JSON array.
- Dots in hostname are preserved. No client-controlled path or repository selector is accepted.
- Updates use current Git blob SHA. On 409, the Worker re-reads the latest file and retries with fresh SHA, at most three attempts.
- Request max: 15 KiB; stored JSON max: 1 MiB. Full file returns 413. Existing legacy files are untouched.
- Automated tests, syntax checks, and runtime verification: NOT RUN / NOT VERIFIED in this environment. No deployment, secrets, Worker config, Production, or data repository files were changed.


## 8. Write Engine Automatic SHA Retrieval — Implemented on dev (2026-11-21)
- Added authenticated `GET /api/v1/admin/write/sha?path=...`; only the current Blob SHA and requested path are returned.
- UPDATE/DELETE in `wahyuajismustofa30/demo:index.html` fetch the SHA immediately before writing/deleting. CREATE/UPDATE refresh the displayed SHA; DELETE clears it.
- SHA validation and GitHub optimistic concurrency remain mandatory; a concurrent file change can still produce 409.
- Regression tests added, but automated tests and syntax checks are NOT RUN. Development deployment/runtime is NOT VERIFIED.
- No deployment, Production request, secret/configuration change, or Termux synchronization was performed.


## 9. RBAC Program — Approved Next Work (2026-11-21)
- RBAC architecture approved; full stage/task tracker: [RBAC_PLAN.md](RBAC_PLAN.md).
- Roles: Admin, User, Guest with distinct scopes. User JWT uses `aud=dekeku-user`, `role=user`, 30-minute lifetime; existing Admin audience remains distinct.
- Private account and repository mappings live in private `dekeku-db`; password hashes use PBKDF2-SHA256; Admin alone creates/manages accounts and mappings.
- User CRUD is restricted to `assets/data/` in repositories mapped to that user. Guestbook writes target mapped website repository `assets/data/bukutamu.json`; static public reads bypass Worker.
- Legacy Guestbook files at `public/data/{hostname}/bukutamu.json` must remain untouched until a separate migration decision.
- Latest implementation status: RBAC-01 through RBAC-08 foundations IMPLEMENTED — NOT VERIFIED. Next: RBAC-09 Security & Regression Review. See sections 10–17 and `project/RBAC_PLAN.md`.
- `npm test`: NOT RUN by explicit user instruction. Syntax/static checks: NOT RUN. Development runtime: NOT VERIFIED. No source code, secrets, Wrangler config, Cloudflare settings, Production resources, or deployment changed in this documentation checkpoint.



## 10. RBAC-01 — Private Storage Foundation (2026-11-21)
- Branch: `dev`; implementation added to source.
- Added `src/modules/rbac/storage.js` with strict allowlist for `private/auth/users.json` and `private/repositories/mappings.json`.
- User schema: unique ID/username, PBKDF2 hash format/range, fixed user role, active/disabled state, timestamps, unknown-field rejection.
- Mapping schema: user reference, owner/repo/branch validation, canonical HTTPS Origin, active/disabled state, unique active repository and Origin.
- Read helper checks repository access when a target document is missing, then returns an empty versioned document; validates GitHub file metadata, 1 MiB cap, UTF-8, JSON and schema.
- Write helper permits create only with `expectedSha=null`; updates require a valid current SHA and rely on GitHub 409 for concurrent modification.
- Added `test/rbac-storage.test.js` to local test command.
- **Tests**: `npm test` NOT RUN per user instruction; syntax/static checks NOT RUN; Development runtime NOT VERIFIED.
- **Not performed**: no account or mapping data created, no API endpoints, no secret/config/Cloudflare/Production/deployment changes.
- **Known limitation**: updates to the two JSON documents are not transactional. RBAC management logic must coordinate updates and recover safely from SHA conflicts.
- Historical next step at the time of this checkpoint: RBAC-01 verification, then RBAC-02. Both implementation records are below.


## 11. RBAC-02 — Role and Ownership Middleware (2026-11-21)
- Branch: `dev`; implementation added in `src/middleware/auth.js`.
- Exports `adminAuthMiddleware`, compatibility alias `authMiddleware`, `userAuthMiddleware`, and `repositoryOwnershipMiddleware`.
- Admin tokens require `aud=dekeku-admin` and `role=admin`; User tokens require `aud=dekeku-user` and `role=user`. User status is checked against private account storage. Ownership checks resolve only active mappings belonging to the authenticated user.
- Added `test/rbac-auth.test.js` to `npm test`.
- `npm test` and syntax/static checks: NOT RUN by instruction; Development runtime: NOT VERIFIED.
- No User login or API endpoints are mounted; no private account/mapping records, secrets, Wrangler config, Cloudflare settings, deployment, or Production resources changed.
- Known boundary: ownership middleware must be invoked only after `userAuthMiddleware`; this ordering will be enforced when User routes are introduced.
- Historical next step at the time of this checkpoint: RBAC-03 Admin management and RBAC-04 User login. Current next stage: RBAC-05.


## 12. RBAC-03 — Admin Account & Repository Management (2026-11-21)
- Branch: dev; source added in src/modules/rbac/admin.js and routes in src/core/router.js.
- Admin routes: POST/GET /api/v1/admin/users, GET/PATCH /api/v1/admin/users/:id, POST /api/v1/admin/users/:id/reset-password, POST/GET /api/v1/admin/users/:id/repositories, PATCH/DELETE /api/v1/admin/repositories/:id.
- All routes are behind existing Admin JWT middleware. DELETE mapping is soft-disable; it does not delete a record.
- Passwords are PBKDF2-SHA256 hashes, role fixed to User, IDs generated server-side, and password hashes are excluded from responses.
- Mapping writes validate user reference, repository fields, branch, canonical HTTPS Origin, and active uniqueness; client cannot select mapping/user IDs or status.
- JSON bodies are streamed with a 16 KiB cap and exact accepted-field checks. Writes use current GitHub blob SHA.
- Added test/rbac-admin.test.js to npm test.
- npm test and syntax/static checks: NOT RUN per user instruction; Development runtime: NOT VERIFIED.
- No account or mapping records were created in dekeku-db. No secrets, Wrangler config, Cloudflare settings, deployment, or Production resources changed.
- Limitations: two private JSON documents are not transactionally updated; repository existence is not checked at mapping registration; listing has no pagination.
- Historical next step at the time of this checkpoint: RBAC-04 User login. Current next stage: RBAC-05; RBAC-01–04 runtime verification remains pending.


## 13. RBAC-04 — User Login & JWT (2026-11-21)
- Branch: dev; added src/modules/auth/user-login.js and mounted POST /api/v1/user/login in src/core/router.js.
- Reads User account records only from fixed private private/auth/users.json; username comparison is case-insensitive; disabled accounts are rejected.
- Password verification uses PBKDF2-SHA256. Unknown usernames trigger a dummy PBKDF2 verification; invalid credentials share the same 401 response.
- JWT claims: iss=dekeku-api, aud=dekeku-user, role=user, sub=<account ID>, iat, exp=iat+1800. Response returns Bearer access token and non-sensitive user identity.
- JSON request body is streamed with 16 KiB cap, requires application/json, validates UTF-8/object shape, and rejects unknown fields.
- Added test/rbac-user-login.test.js to local npm test.
- npm test: NOT RUN per explicit user instruction. Syntax/static checks: NOT RUN. Development runtime: NOT VERIFIED.
- No account/private data created or changed; no secrets, Wrangler/Cloudflare configuration, deployment, or Production resources changed.
- Security follow-up: verify WAF/IP rate limiting for User login before production; application-level throttling and audit log remain separate tasks.
- Next: RBAC-05 User data CRUD confined to assets/data/. RBAC-01–04 runtime verification remains pending.


## 14. RBAC-05 — User Data CRUD (2026-11-21)
- Branch: dev. Added src/modules/rbac/user-data.js; updated src/core/router.js; added test/rbac-user-data.test.js and registered it in package.json.
- Routes: GET /api/v1/user/repositories and GET/POST/PUT/DELETE /api/v1/user/data.
- User JWT and active account required. Data routes require mapping ID owned by JWT subject; owner/repo/branch are resolved only from private mappings.
- User path is relative and server-prefixed assets/data/. Rejects encoded paths, traversal, backslash, absolute/hidden paths, control characters, repeated separators, and non-JSON extensions.
- GET returns parsed JSON and SHA; POST creates; PUT/DELETE require 40-character SHA. JSON root object/array; max file size 1 MiB; streamed body cap 1,153,434 bytes; strict UTF-8.
- npm test: NOT RUN per explicit instruction. Syntax/static checks: NOT RUN. Development runtime: NOT VERIFIED.
- No real account, mapping, or target repository data was created/modified. No secrets, Wrangler/Cloudflare config, deployment, or Production resources changed.
- Known limitations: no pagination/bulk listing, no application-level write throttling, SHA conflicts are returned without automatic retry.
- Next: RBAC-06 private/public data boundary review. RBAC-01–05 runtime verification remains pending.


## 15. RBAC-06 — Private/Public Data Boundary Review (2026-11-21)
- Branch: `dev`.
- Source review verified that public file reads pass through `GitHubClient.getFile()` and `validatePublicPath()` before any GitHub upstream request. The reader requires the `public/` root and rejects private storage paths, `assets/data/`, traversal, hidden segments, sensitive names, and unsupported extensions.
- The private storage helper remains restricted to the two exact private JSON paths. User data routes remain separate behind User JWT + mapping ownership; Admin management routes remain behind Admin JWT; Guest submit remains a separate Origin-validated public route.
- Added `test/rbac-boundary.test.js` and registered it in `package.json`.
- Source review: VERIFIED. Automated tests: NOT RUN per instruction. Syntax/static checks: NOT RUN. Development runtime: NOT VERIFIED.
- No live GitHub data was read or changed; no accounts/mappings were created; no secrets/configuration/deployment/Production resources touched.
- **Current next stage: RBAC-07 Guestbook per mapped website repository.** RBAC-01–06 remain runtime NOT VERIFIED.


## 16. RBAC-07 — Guestbook per Mapped Website Repository (2026-11-21)
- Branch: `dev`.
- Replaced legacy Guestbook destination resolution in `src/modules/public/submit.js`: request Origin must pass HTTPS `ALLOWED_ORIGINS`, then match one active mapping in private `dekeku-db` storage.
- Target owner/repository/branch are server-derived from mapping. Worker verifies the target repository exists and is public, then writes only to `assets/data/bukutamu.json`.
- Request does not accept a repository ID, owner, repository, branch, or path. Unsupported body fields are rejected.
- Request body uses streamed 15 KiB cap and strict UTF-8; stored array JSON is limited to 1 MiB. SHA concurrency is preserved with at most three read/write attempts on 409.
- Updated `test/public-submission.test.js`; it is already registered in `package.json`.
- Legacy `public/data/{hostname}/bukutamu.json` files were not accessed, deleted, copied, or migrated.
- Source review: VERIFIED. Tests: NOT RUN per explicit instruction. Syntax/static checks: NOT RUN. Development runtime: NOT VERIFIED.
- Risk/follow-up: Origin can be spoofed by non-browser clients. No app-level Guestbook rate limiter exists; verify/configure Cloudflare WAF/IP rate limiting for the Guestbook POST route in Development before public exposure. CDN cache behavior needs website-level verification.
- No real mapping/account/data, secrets, Wrangler/Cloudflare settings, deployment, or Production resources changed.
- **Current next stage: RBAC-08 Browser User session integration.** RBAC-01–07 remain runtime NOT VERIFIED.


## 17. RBAC-08 — Browser User Session Integration (2026-11-21)
- Branch: `dev`.
- Updated `src/modules/tester/index.js` and `public/tester.html` with User login form, User session status, logout, and authenticated User repository listing.
- User login calls `POST /api/v1/user/login`, consumes `access_token`, and stores it only in `sessionStorage` key `dekeku_user_access_token`. Password input is cleared after login; JWT is never displayed or logged.
- Added `userRequest()` with User Bearer token. Public helper removes Authorization; Admin helper retains its distinct in-memory Admin JWT.
- User request 401, or 403 with the exact `User account is unavailable` error, clears User token and UI state; Admin request 401 clears only Admin state. Logout removes the sessionStorage key.
- Updated `test/tester-dashboard.test.js` to cover both page copies and separate auth helpers/session lifecycle.
- Source review: VERIFIED. Syntax checks/tests: NOT RUN per instruction. Development browser/runtime: NOT VERIFIED.
- XSS limitation: sessionStorage is readable by same-origin JavaScript; keep strict output handling and avoid third-party scripts.
- No accounts/mappings/secrets/configuration/deployment/Production resources changed.
- **Current next stage: RBAC-09 Security & Regression Review.** RBAC-01–08 remain runtime NOT VERIFIED.
