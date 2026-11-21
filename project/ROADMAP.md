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

### Write Engine Usability Follow-up (2026-11-21)
- Automatic SHA lookup endpoint and Tester integration implemented on `dev`.
- Regression tests added; syntax checks, automated test execution, and Development runtime verification remain NOT RUN / NOT VERIFIED.

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
## Caller Repository Metadata
- **Implementation**: added on branch `dev` on 2026-11-21.
- **Scope**: `GET /api/v1/github/repository` resolves the caller repository from the validated request Origin and its `/config.json`.
- **Verification**: regression tests and syntax checks NOT RUN in this environment; Development deployment/runtime NOT VERIFIED.


## Guestbook Per-Origin Storage (2026-11-21)
- **Implementation**: added on branch dev.
- **Scope**: one JSON array file per allowlisted Origin hostname at public/data/{hostname}/bukutamu.json; dots retained.
- **Concurrency**: SHA optimistic locking with bounded re-read/retry on 409 (maximum three writes).
- **Limits**: 15 KiB request and 1 MiB serialized file.
- **Verification**: regression tests added but NOT RUN in this environment; Development deployment/runtime NOT VERIFIED.


## RBAC Program — Approved Architecture (2026-11-21)
- **Status (latest)**: RBAC-01 and RBAC-02 source foundations implemented on `dev`, not verified. See implementation records below.
- Detail and task tracker: [RBAC_PLAN.md](RBAC_PLAN.md).
- Roles: Admin (all API-managed data), User (only owned registered repositories under `assets/data/`), Guest (public Guestbook submission only).
- User JWT: audience `dekeku-user`, role `user`, lifetime 30 minutes; Admin retains `dekeku-admin` audience.
- Account and repository mapping storage: private `dekeku-db` repository; PBKDF2-SHA256 password hashes; server-authoritative mapping; multiple repositories per User.
- Guestbook target: each mapped website repository at `assets/data/bukutamu.json`; public reads use static repository/CDN URLs.
- Existing `public/data/{hostname}/bukutamu.json` files must not be deleted or migrated automatically.
- RBAC-01 storage and RBAC-02 middleware foundations are implemented but not verified. Next: RBAC-03 / RBAC-04. `npm test`: NOT RUN by user instruction; syntax checks and runtime verification: NOT RUN / NOT VERIFIED.



## RBAC-01 — Private Account Storage Foundation (2026-11-21)
- **Implementation**: ADDED on branch `dev`; see [RBAC_PLAN.md](RBAC_PLAN.md).
- Fixed private paths: `private/auth/users.json` and `private/repositories/mappings.json`.
- Added strict user/mapping schema validation and internal GitHub Contents API read/create/update with file-size limit and mandatory SHA for updates.
- Added `test/rbac-storage.test.js` to local test script.
- **Status**: IMPLEMENTED — NOT VERIFIED. `npm test` NOT RUN by user instruction; syntax/static checks NOT RUN; Development runtime NOT VERIFIED.
- Next: RBAC-02 role/audience/ownership middleware. No endpoints or data records have been added; no Production/deployment/configuration/secret changes.


## RBAC-02 — Role and Ownership Middleware (2026-11-21)
- Added separate Admin and User JWT middleware with strict issuer/audience/role checks; retained `authMiddleware` as a compatibility alias for Admin routes.
- User middleware rechecks active account status from private account storage. Repository ownership middleware resolves an opaque mapping ID against private mappings and attaches only server-sourced repository coordinates.
- Added `test/rbac-auth.test.js` to the local test command.
- **Status**: IMPLEMENTED — NOT VERIFIED. Tests and syntax checks NOT RUN by user instruction; Development runtime NOT VERIFIED. No endpoints, account records, mappings, secrets, config, deployment, or Production resources changed.
- Next: RBAC-03 Admin management and RBAC-04 User login. RBAC-01 verification remains pending.
