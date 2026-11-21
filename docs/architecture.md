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
  - *Known Code Gaps*:
    - F-01: Validasi karakter kontrol di `write.js` menggunakan regex double-escape `/[\\x00-\\x1F\\x7F]/`.
    - F-02: Konversi Base64 `btoa(String.fromCharCode(...bytes))` belum menggunakan chunking untuk payload > 100KB.
    - F-03: `parseAndValidateBody` belum secara eksplisit menolak jika field `content` bernilai `undefined`.
    - F-04: Header CORS belum dikembalikan pada respons `catch` error di `src/index.js` dan belum memuat method `PUT, DELETE`.
