# CHANGELOG — DEKEKU API Gateway

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
