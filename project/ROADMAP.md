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
- **Status**: COMPLETED & VERIFIED (126/126 PASS).

## Phase 3: Monitoring & Optimization (Future)
- Monitoring logs & error tracking.
- Performance optimization (Worker latency).
- Documentation refinement.
