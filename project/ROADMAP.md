# ROADMAP — DEKEKU API Gateway

*Catatan Acuan*: Untuk status detail, riwayat pengujian, dan daftar isu aktif, lihat [PROGRESS.md](PROGRESS.md) sebagai sumber status tunggal proyek.

## Phase 1: Foundation & GitHub Core
- **Status**: COMPLETED.
- **Hasil**: Runtime Cloudflare Workers, GitHub Client read-only, router core, dan public access policy untuk `public/`.

## Phase 2.1: Authentication & Authorization
- **Tujuan**: Menjamin keamanan operasi administratif.
- **Ruang Lingkup**: JWT Middleware, Admin Login (`POST /api/v1/admin/login`), Secret Management (`JWT_SECRET`, `ADMIN_PASSWORD_HASH`), PBKDF2 hashing.
- **Status**: COMPLETED & VERIFIED.

## Phase 2.2: Write Engine & File Management
- **Tujuan**: Memungkinkan pengelolaan file melalui API.
- **Ruang Lingkup**: Create/Update/Delete file JSON di direktori `public/data/` via GitHub Contents API dengan validasi path, size limit (1MB), optimistic concurrency (SHA), dan perbaikan F-01 s/d F-04.
- **Dependensi**: Phase 2.1.
- **Status**: COMPLETED & VERIFIED.

## Phase 2.3: Public Submission & Guestbook
- **Tujuan**: Memungkinkan pengumpulan pesan/guestbook publik dengan validasi aman tanpa auth admin.
- **Ruang Lingkup**: Endpoint `POST /api/v1/public/submit`, validasi payload (name, message), penyimpanan concurrent-safe ke `public/data/guestbook/`, CORS wildcard (`*.artoprintingpbg.com`, `*.dekeku.my.id`).
- **Status**: COMPLETED menurut implementasi terdokumentasi. Hasil pengujian lokal terbaru yang dilaporkan pengguna adalah 149 PASS, 0 FAIL, 0 SKIP pada commit `a6a089d`; runtime/deployment Development tetap NOT VERIFIED.

## Security Review Follow-up (2026-11-21)
- R-001 s/d R-005: implementasi remediation Dashboard, CORS, dan test isolation selesai.
- `npm run check`: PASS dan `npm test`: 149 PASS, 0 FAIL, 0 SKIP berdasarkan laporan pengguna pada branch `dev`, commit `a6a089d`; bukan verifikasi independen dalam sesi dokumentasi.
- R-006 WAF Development: NOT VERIFIED.
- R-007 failed-login audit logging: menunggu keputusan retensi, akses, dan metadata.
- R-008 sinkronisasi dokumentasi: COMPLETED.

## Phase 3: Monitoring & Optimization (Future)
- Monitoring logs & error tracking.
- Performance optimization (Worker latency).
- Documentation refinement.
