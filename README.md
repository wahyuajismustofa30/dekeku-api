# DEKEKU API Gateway

Layanan API Gateway terpusat berbasis Cloudflare Workers untuk ekosistem aplikasi DEKEKU. Bertindak sebagai perantara aman antara klien dan repositori data GitHub.

## Struktur Repository
- `src/core/`: Logika inti router (`router.js`), GitHub API client (`github.js`), dan kustom HTTP errors (`errors.js`).
- `src/middleware/`: Middleware request/response untuk CORS (`cors.js`) dan autentikasi JWT (`auth.js`).
- `src/modules/`: Modul fitur API:
  - `health/`: Health check status service.
  - `auth/`: Login admin (`login.js`).
  - `github/`: Public read (`files.js`, `repositories.js`) dan Admin write (`write-router.js`, `write.js`).
- `src/utils/`: Utility reusabel (`response.js`, `jwt.js`, `hash.js`, `github-content.js`).
- `test/`: Test suite otomatis (`auth.test.js`, `github-core.test.js`, `github-write.test.js`, `write-foundation.test.js`, `write-router.test.js`).
- `docs/`: Dokumentasi arsitektur teknis (`architecture.md`).
- `project/`: Dokumentasi tata kelola dan status proyek (`MASTER.md`, `ROADMAP.md`, `PROGRESS.md`, `DECISIONS.md`, `CHECKPOINT.md`, `CHANGELOG.md`, `BACKLOG.md`, `CLAUDE_PROJECT_CONTEXT.md`).

## Lingkungan Pengembangan & Pengujian

### Menjalankan Server Lokal
```bash
npm run dev
```
Menjalankan server pengembangan lokal menggunakan Wrangler (`wrangler dev`).

### Pemeriksaan Sintaks
```bash
npm run check
```

### Menjalankan Test Suite
Menjalankan seluruh file pengujian secara mandiri menggunakan Node.js test runner:
```bash
for f in test/*.test.js; do node "$f"; done
```
Atau menjalankan satu file tes spesifik:
```bash
node test/auth.test.js
```

## Daftar API Endpoints

### Publik (Tanpa Autentikasi)
- `GET /api/v1/health` — Status kesehatan layanan.
- `GET /api/v1/github/repository` — Metadata repositori GitHub.
- `GET /api/v1/github/branch` — Metadata branch repositori.
- `GET /api/v1/github/file?path=public/...` — Membaca isi file di direktori `public/`.
- `POST /api/v1/admin/login` — Login admin, mengembalikan JWT token.

### Admin Write (Memerlukan JWT Admin Bearer Token)
- `POST /api/v1/admin/write/create` — Membuat file JSON baru di `public/data/`.
- `PUT /api/v1/admin/write/update` — Memperbarui file JSON yang ada di `public/data/` (Wajib menyertakan `sha`).
- `DELETE /api/v1/admin/write/delete` — Menghapus file JSON di `public/data/` (Wajib menyertakan `sha`).

## Variable Lingkungan (Environment Variables)

### Secrets (Kredensial Sensitif)
Harus dikonfigurasi melalui Cloudflare Workers Secrets (`wrangler secret put <NAME>`):
- `GITHUB_TOKEN`: Personal Access Token GitHub dengan izin read/write ke repositori data.
- `JWT_SECRET`: Secret key untuk penandatanganan dan verifikasi JWT token HS256.
- `ADMIN_PASSWORD_HASH`: Hash password admin berformat `pbkdf2:100000:<salt_hex>:<hash_hex>`.

### Konfigurasi Reguler (Environment Bindings)
- `GITHUB_OWNER`: Pemilik/organisasi repositori GitHub target.
- `GITHUB_REPO`: Nama repositori GitHub target.
- `GITHUB_BRANCH`: Branch target (default: `main`).
- `ALLOWED_ORIGINS`: *(Usulan D-012)* Daftar origin yang diizinkan untuk CORS (dipisahkan koma).

## Catatan Lingkungan (Dev vs Production)
- Worker Development (`dekeku-api-dev`) dan Worker Production (`github` / `api.dekeku.my.id`) dipisahkan secara terisolasi.
- Perubahan pada Worker produksi dilarang tanpa instruksi eksplisit dari pemilik proyek.

## Tautan Dokumentasi
- [Dokumentasi Arsitektur](docs/architecture.md)
- [Status Progress & Hasil Pengujian](project/PROGRESS.md)
