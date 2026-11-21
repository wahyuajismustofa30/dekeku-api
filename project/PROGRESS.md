# PROGRESS STATUS — DEKEKU API Gateway

Tanggal Pembaruan: 2026-11-21

## Ringkasan Proyek
- **Fase Aktif**: Phase 2.3 (Public Submission & Guestbook) — COMPLETED & VERIFIED.
- **Status Keseluruhan**: Public Submission, CORS, Write Engine, dan remediation R-001 s/d R-005 tercatat selesai pada sisi implementasi. `npm run check` PASS dan `npm test` 149 PASS, 0 FAIL, 0 SKIP berdasarkan laporan pengguna tanggal 2026-11-21 untuk branch `dev` pada commit `a6a089d`. Hasil ini belum diverifikasi ulang secara independen dalam sesi dokumentasi ini; remote test dan runtime/deployment tetap belum diverifikasi.
- **Acuan Utama**: Dokumen ini adalah satu-satunya sumber status terpusat (*single source of truth*) untuk seluruh progres fitur proyek.

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
- [ ] R-006 — verifikasi konfigurasi WAF pada Development.
- [ ] R-007 — tetapkan kebijakan retensi, akses, dan metadata audit log sebelum implementasi.
- [ ] R-009 s/d R-011 — evaluasi pemeliharaan/infrastruktur.
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
