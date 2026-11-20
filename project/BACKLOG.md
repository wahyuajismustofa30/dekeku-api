# BACKLOG — DEKEKU API Gateway

*Catatan Acuan*: Rincian progres dan temuan aktif tercatat secara terpusat di [PROGRESS.md](PROGRESS.md).

## High Priority (Security & Reliability)
- [ ] Perbaikan Temuan Kode Write Engine (F-01 s/d F-04):
  - F-01: Perbaiki regex karakter kontrol `validateWritablePath` di `src/modules/github/write.js` (hapus double-escape).
  - F-02: Implementasikan helper Base64 per-chunk untuk file > 100KB di `src/utils/base64.js` dan gunakan di `write.js` serta `github.js`.
  - F-03: Tambahkan validasi penolakan jika field `data.content` bernilai `undefined` di `parseAndValidateBody`.
  - F-04: Terapkan allowlist origin `ALLOWED_ORIGINS` di `src/middleware/cors.js`, tambahkan method `PUT, DELETE`, dan teruskan header CORS pada respons error catch di `src/index.js`.
- [ ] Rate Limiting berbasis IP (Cloudflare WAF): Mitigasi brute-force pada `/api/v1/admin/login` dan endpoint publik. *(Catatan: Pendekatan account lockout di tingkat aplikasi dihindari karena berpotensi menjadi celah DoS pada username admin tunggal).*
- [ ] Penyesuaian Tes Legacy Core: Memperbarui 9 tes di `test/github-core.test.js` agar selaras dengan desain error mapping gateway terbaru di `src/core/github.js`.
- [ ] Failed-login Audit Logging: Mencatat metadata kegagalan login untuk analisis keamanan.

## Medium Priority (Features & Refinements)
- [ ] Phase 2.3: Guestbook Module — Public submission API dengan proteksi spam.
- [ ] JWT Revocation: Mekanisme blacklist/whitelist untuk membatalkan token aktif sebelum exp.
- [ ] Reduksi Metadata Public Endpoints: Membatasi informasi sensitif yang dikembalikan oleh `GET /api/v1/github/repository` dan `GET /api/v1/github/branch`.
- [ ] Validasi Tipe Konten File: Menentukan aturan tipe data yang diizinkan di dalam file JSON jika diperlukan di masa depan.
- [ ] GitHub Client Retry Logic: Implementasi exponential backoff untuk transient errors.

## Low Priority (Maintenance)
- [ ] Sinkronisasi Dev & Main Routine: Menjaga keterselarasan branch `dev` dan `main` secara berkala.
- [ ] Structured Logging: Peningkatan format log JSON untuk Cloudflare Logs.
- [ ] API Versioning Strategy: Dokumentasi dan panduan migrasi dari v1 ke v2.
