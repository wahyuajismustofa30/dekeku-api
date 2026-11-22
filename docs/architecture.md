# DEKEKU API Gateway — Architecture

Dokumen ini menjelaskan arsitektur aktual DEKEKU API Gateway berbasis Cloudflare Workers dan integrasinya dengan GitHub Contents API.

## 1. Tinjauan Arsitektur
DEKEKU API Gateway berfungsi sebagai perantara aman (*reverse proxy* & data gateway) antara aplikasi klien (*frontend/mobile*) dan repositori GitHub privat yang berfungsi sebagai *data store* dan *file repository*.

- **Runtime**: Cloudflare Workers (V8 Serverless Edge Execution).
- **Upstream Data Store**: GitHub REST API (Contents API).
- **Protokol**: HTTP/HTTPS REST API (JSON).

## 2. Alur Request & Respons
1. **Client Request** masuk ke Cloudflare Worker (`src/index.js`).
2. **CORS Middleware** (`src/middleware/cors.js`): Menangani preflight `OPTIONS` dan menambahkan header CORS dasar.
3. **Router Core** (`src/core/router.js`): Mengarahkan request berdasarkan path dan HTTP method:
   - `/api/v1/health` (Public GET) -> Handler Health (`src/modules/health/index.js`).
   - `/api/v1/github/*` (Public GET) -> GitHub Router (`src/modules/github/files.js`, `repositories.js`).
   - `/api/v1/admin/login` (Public POST) -> Admin Login Handler (`src/modules/auth/login.js`).
   - `/api/v1/admin/write/*` (Protected admin operations) -> `authMiddleware` (`src/middleware/auth.js`) -> GitHub Write Router (`src/modules/github/write-router.js`); includes `GET /api/v1/admin/write/sha` for current Blob SHA retrieval.
4. **GitHub Client Core** (`src/core/github.js`): Berinteraksi dengan GitHub Contents API menggunakan `env.GITHUB_TOKEN`.
5. **Response Formatter** (`src/utils/response.js`): Mengembalikan respons terstruktur dalam format JSON.

## 3. Komponen & Modul Utama
- **Core (`src/core/`)**:
  - `router.js`: Central HTTP routing logic.
  - `github.js`: Client abstraction untuk GitHub Contents API (READ via GET, WRITE via PUT, DELETE via DELETE) dengan timeout (8000ms), error handling, dan concurrency control via SHA.
  - `errors.js`: `HttpError` custom class untuk error status mapping.
- **Middleware (`src/middleware/`)**:
  - `cors.js`: Penanganan header CORS (Method allowed: GET, POST, OPTIONS).
  - `auth.js`: Authentication middleware memverifikasi JWT Bearer token pada protected routes.
- **Modules (`src/modules/`)**:
  - `health`: Endpoint pemeriksaan kesehatan gateway.
  - `auth`: Logika otentikasi admin, verifikasi PBKDF2 hash, dan penerbitan JWT.
  - `github`: Handler read-only (`files.js`, `repositories.js`) dan write engine (`write-router.js`, `write.js`).
- **Utils (`src/utils/`)**:
  - `response.js`: Helper format respons JSON standar (`success` / `error`).
  - `jwt.js`: Generator dan verifikator JWT HS256 berbasis Web Crypto.
  - `hash.js`: Verifikator password PBKDF2-SHA256 constant-time comparison.
  - `github-content.js`: Pembantu pemrosesan konten file dan dekode Base64 dari GitHub.

## 4. Keamanan & Batasan
- **Autentikasi Admin**:
  - Algoritma JWT: HS256 (`env.JWT_SECRET`).
  - Klaim wajib: `iss`, `aud`, `sub`, `role` (harus `admin`), `iat`, `exp`.
  - Durasi Token: Maksimal 1800 detik (30 menit) dengan toleransi *clock skew* 30 detik.
  - Hashing Password: PBKDF2-SHA256 dengan 100.000 iterasi, salt 16-byte, hash 32-byte (`env.ADMIN_PASSWORD_HASH`).
- **Validasi Path**:
  - Public Read: Dibatasi pada direktori `public/`, memblokir file tersembunyi (`.env`, `.git`), file sensitif, dan traversal (`..`, `//`).
  - Admin Write: Dibatasi hanya pada direktori `public/data/` dengan ekstensi `.json`.
- **Batasan Ukuran File**:
  - Maksimal ukuran payload request body: 1.1 MB (1.153.434 byte).
  - Maksimal ukuran file JSON tertulis: 1 MB (1.048.576 byte).
- **Concurrency Control**:
  - Operasi UPDATE (PUT) dan DELETE tetap mewajibkan SHA commit terakhir dari GitHub untuk *optimistic locking*.
  - Tester mengambil SHA terbaru melalui endpoint admin `GET /api/v1/admin/write/sha?path=...` sebelum UPDATE/DELETE. Worker tetap memvalidasi SHA dan GitHub tetap menolak versi yang sudah berubah (409).
- **Keterbatasan Keamanan Saat Ini (Known Issues / Gaps)**:
  - *Rate Limiting*: Belum tersedia di tingkat aplikasi (disarankan menggunakan Cloudflare WAF).
  - *Token Revocation*: Belum ada mekanisme pencabutan/blacklist token JWT aktif.
  - *Resolved code gaps (source-verified)*: F-01 control-character validation uses the correct control-character range in `src/modules/github/write.js`; F-02 large Base64 payloads use the chunked `uint8ArrayToBase64` helper; F-03 write-body validation rejects missing or undefined `content`; F-04 CORS allows the supported write methods, applies the origin allowlist, and adds CORS headers to handled error responses. These four items are historical fixes, not active gaps. See root `CHANGELOG.md` for the original resolution record.


## Public Data API architecture update (2026-11-23)

The active public write contract is `POST /api/v1/public/data/{resource}`, with a server-side Resource Registry and per-resource validation/storage policy. Guestbook is the first resource. The resolver uses the request's trusted HTTPS `Origin`, the project's schema-v1 `config.json`, the trusted `GITHUB_OWNER`, public-repository verification, and the repository default branch. Public Data API requests do not accept client-selected owner/repository/branch/path and explicitly ignore `X-DEKEKU-Project-Origin`, which remains a File Manager selector. Guestbook data is appended to the fixed path `assets/data/bukutamu.json`; public websites read it directly from the project's public repository/CDN. The legacy `POST /api/v1/public/submit` route delegates to the same Guestbook handler.

Owner-reported local Termux validation: focused test 14/14 PASS and syntax checks for 7 changed source files PASS. Exact tested local HEAD SHA is unknown; full suite, remote integration, live write, Worker runtime, and deployment remain NOT VERIFIED. See `project/EVIDENCE.md` and `project/CHECKPOINT.md`.


### CI evidence update (2026-11-23)
GitHub Actions PR Validation run #51 on commit `98d7163add0452832afefeda1462aad5f187ac43` completed successfully: 139 tests passed, 0 failed, 0 skipped across 19 suites; `npm ci`, syntax checks on 64 JavaScript files, Wrangler dry-run, and `npm audit` (0 vulnerabilities) passed. This is CI evidence for that commit only; it does not establish a live Worker runtime, live repository write, or deployment. See `project/EVIDENCE.md` and `project/CHECKPOINT.md`.
