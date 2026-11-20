# PROGRESS STATUS — DEKEKU API Gateway

Tanggal Pembaruan: 2026-11-20

## Ringkasan Proyek
- **Fase Aktif**: Phase 2.2 (Write Engine) — Stage 3 COMPLETED (dengan Catatan Known Issues F-01 s/d F-04).
- **Status Keseluruhan**: Write Engine Foundation + GitHub Client PUT/DELETE + Router Integration TERAKSES & TERUJI.
- **Acuan Utama**: Dokumen ini adalah satu-satunya sumber status terpusat (*single source of truth*) untuk seluruh progres fitur proyek.

## Daftar Fitur & Status

| Komponen | Fitur | Status | Catatan & Temuan Aktual |
| :--- | :--- | :--- | :--- |
| **Core** | Router (Auth Ready) | COMPLETED | Mendukung publik & protected routes. |
| **Core** | GitHubClient (Read) | COMPLETED | Timeout (8000ms) & resilience OK. |
| **Core** | GitHubClient (Write PUT/DELETE) | COMPLETED | Optimistic concurrency via SHA. |
| **Auth** | JWT Utility (HS256) | COMPLETED | Strict iat, exp, signature validation. |
| **Auth** | Auth Middleware | COMPLETED | Verified iss, aud, sub, role, exp. |
| **Auth** | Admin Login | COMPLETED | PBKDF2 verification, JWT issuance. |
| **Security** | Path Validation (Public) | COMPLETED | Memblokir traversal & file tersembunyi. |
| **Security** | Path Validation (Write) | COMPLETED (Known Issue F-01) | Mencegah `..` & `%`, namun regex karakter kontrol menggunakan double-escape `/[\\x00-\\x1F\\x7F]/`. |
| **Security** | Password Hashing | COMPLETED | PBKDF2-SHA256, constant-time compare. |
| **Module** | Health & GitHub Read | COMPLETED | Fitur v1 stabil. |
| **Write** | Validation Foundation | COMPLETED (Known Issue F-02, F-03) | Envelolpe request wajib Objek/Array. Batasan: Base64 `btoa(String.fromCharCode)` gagal di atas ~100KB (F-02) dan `data.content` missing belum ditolak (F-03). |
| **Write** | GitHub Client PUT/DELETE | COMPLETED (Known Issue F-04) | Validasi SHA, error mapping, concurrency OK. Header `Retry-After` dikirim jika tersedia dari GitHub API. |
| **Write** | Router Integration | COMPLETED | Endpoints CREATE/UPDATE/DELETE terpasang di bawah authMiddleware. |

## Hasil Pengujian Aktual (Per 2026-11-20)
Pengujian dijalankan secara otomatis menggunakan Node.js test runner pada seluruh suite:
- **Total Pengujian**: 112 tes (103 PASS, 9 FAIL, 0 SKIP).
- **Auth Module (`test/auth.test.js`)**: 26/26 PASS (JWT & PBKDF2 strict validation).
- **Write Foundation (`test/write-foundation.test.js`)**: 12/12 PASS (Size limit, JSON parsing, path checks).
- **GitHub Client PUT/DELETE (`test/github-write.test.js`)**: 34/34 PASS (Mock integration PUT/DELETE/CREATE).
- **Router Integration (`test/write-router.test.js`)**: 22/22 PASS (Protected routes & public regression).
- **Public Policy & Resilience (`test/github-core.test.js`)**: 9/18 PASS.
  - *Catatan 9 Tes Faiing*: 9 tes pada `test/github-core.test.js` (suite "GitHub Client - Resilience & Error Handling") gagal karena ekspektasi status code/pesan error legacy (misal mengharapkan 408/401/403/500 mentah dari GitHub) berbeda dengan desain error gateway yang baru di `src/core/github.js` (yang memetakan ke 504 Gateway Timeout dan 502 Bad Gateway).

## Endpoints Implemented

### Public (No Auth)
- `GET /api/v1/health` — Health check
- `GET /api/v1/github/repository` — Repository metadata
- `GET /api/v1/github/branch` — Branch metadata
- `GET /api/v1/github/file?path=...` — File content (public/ only)

### Admin Write (Require Admin JWT)
- `POST /api/v1/admin/write/create` — Create new JSON file in `public/data/`
- `PUT /api/v1/admin/write/update` — Update existing JSON file (requires SHA)
- `DELETE /api/v1/admin/write/delete` — Delete JSON file (requires SHA)

### Auth
- `POST /api/v1/admin/login` — Admin login, returns JWT

## Keputusan Arsitektur & Perilaku Aktual
- **Write root**: `public/data/` only, `.json` only.
- **File size limit**: 1.048.576 bytes (UTF-8 setelah `JSON.stringify()`).
- **Request body limit**: 1.153.434 bytes.
- **Content-Type**: Harus `application/json`.
- **Root content validation**: Request envelope wajib JSON Object/Array. Tipe `data.content` tidak dibatasi server (di-stringify oleh server), namun jika `data.content` bernilai `undefined`, server melakukan stringify tanpa penolakan (Temuan F-03).
- **Optimistic concurrency**: Client memberikan SHA, server meneruskan ke GitHub.
- **No auto-retry on conflict (409)**: Menghindari overwrite race condition.

## Masalah, Kendala & Risk Backlog
1. **F-01 (Regex Escape)**: Regex karakter kontrol di `write.js` memakai double-escape `/[\\x00-\\x1F\\x7F]/`.
2. **F-02 (Base64 Large Files)**: Base64 encoding menggunakan `String.fromCharCode(...bytes)` yang melempar RangeError untuk file > ~100KB.
3. **F-03 (Missing Content Check)**: `parseAndValidateBody` belum menolak request tanpa field `content`.
4. **F-04 (CORS Allowlist & Error Headers)**: Preflight CORS belum memiliki allowlist origin (`ALLOWED_ORIGINS`) dan respons error di catch block `index.js` belum menyertakan header CORS.
5. **Legacy Core Tests**: 9/18 tes di `test/github-core.test.js` perlu diperbarui agar sesuai dengan spesifikasi error mapping gateway terbaru.
6. **Rate Limiting & Revocation**: Rate limiting login/public API dan JWT revocation belum tersedia.

## Next Steps
- Memperbaiki temuan F-01 s/d F-04 pada codebase.
- Menyesuaikan ekspektasi tes legacy di `test/github-core.test.js`.
- Mempersiapkan Phase 2.3: Public Submission & Guestbook Module (Planned).
