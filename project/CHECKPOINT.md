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
- Latest implementation status: RBAC-01 through RBAC-04 foundations IMPLEMENTED — NOT VERIFIED. Next: RBAC-05. See sections 10–11 and `project/RBAC_PLAN.md`.
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
- Next: RBAC-01 verification, then RBAC-02 role/audience/ownership middleware.


## 11. RBAC-02 — Role and Ownership Middleware (2026-11-21)
- Branch: `dev`; implementation added in `src/middleware/auth.js`.
- Exports `adminAuthMiddleware`, compatibility alias `authMiddleware`, `userAuthMiddleware`, and `repositoryOwnershipMiddleware`.
- Admin tokens require `aud=dekeku-admin` and `role=admin`; User tokens require `aud=dekeku-user` and `role=user`. User status is checked against private account storage. Ownership checks resolve only active mappings belonging to the authenticated user.
- Added `test/rbac-auth.test.js` to `npm test`.
- `npm test` and syntax/static checks: NOT RUN by instruction; Development runtime: NOT VERIFIED.
- No User login or API endpoints are mounted; no private account/mapping records, secrets, Wrangler config, Cloudflare settings, deployment, or Production resources changed.
- Known boundary: ownership middleware must be invoked only after `userAuthMiddleware`; this ordering will be enforced when User routes are introduced.
- Next: RBAC-03 Admin management and RBAC-04 User login. RBAC-01 verification is still pending.


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
- Next: RBAC-04 User login. RBAC-01/02/03 runtime verification remains pending.


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
