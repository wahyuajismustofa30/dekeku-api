# ROADMAP — DEKEKU API Gateway

Tanggal pembaruan: 2026-11-23
Acuan status aktual: `project/PROGRESS.md`.

## Arah proyek
Fokus saat ini adalah pengelolaan data publik pada repository publik masing-masing proyek. Website membaca data publik langsung dari repository/CDN; DEKEKU API Gateway menyediakan autentikasi Admin, discovery repository, browsing, dan operasi administratif. Pengaturan private repository `dekeku-db`, private account storage, mapping, serta perluasan RBAC tetap diarsipkan (A-003).

## Status tahapan

| Tahap | Status | Catatan |
|---|---|---|
| PUB-001 — Config contract v1 | COMPLETE | Spesifikasi dan JSON Schema tersedia. |
| PUB-002 — Schema & trusted Origin enforcement | VERIFIED | Teruji pada Development Worker. |
| PUB-003 — Shared project resolver for Admin writes | VERIFIED | Teruji pada Development Worker. |
| PUB-004 — Safe public repository browsing | VERIFIED | Git Trees traversal dan pembatasan path teruji. |
| PUB-004-FIX — Git Trees security remediation | VERIFIED | Fail-closed symlink/submodule/unknown mode teruji. |
| PUB-005 — Tester File Manager | VERIFIED | File Manager dan JSON CRUD teruji. |
| PUB-006 — Development end-to-end verification & Investigation | COMPLETE & VERIFIED | Live Development Worker E2E CRUD lifecycle test and Arto Printing config investigation completed successfully. |

## CI/CD dan deployment
- `.github/workflows/pr-validation.yml` menjalankan validasi pada PR `dev` → `main`; workflow ini tidak melakukan deployment.
- Pemilik melaporkan Cloudflare Workers auto-deployment telah dikonfigurasi dan deployment dari GitHub berhasil.
- Target yang diizinkan hanya Development Worker `dekeku-api-dev`. Production tetap dilarang disentuh tanpa persetujuan eksplisit.

## Urutan kerja
1. PUB-001 s.d. PUB-006 selesai dan diverifikasi.
2. Rencanakan peningkatan Admin UI atau integrasi selanjutnya sesuai instruksi pemilik.

Tidak ada deployment, perubahan secret/variable, perubahan Cloudflare/Wrangler, atau operasi Production yang diizinkan oleh roadmap ini.

## Workstream ADM — Centralized Admin Dashboard (approved 2026-11-23)

Instruksi pemilik terbaru mengaktifkan Dashboard Admin dan metadata privat `dekeku-db`; ini merupakan scope baru yang lebih baru daripada status arsip A-003/D-027 untuk pengembangan terdahulu. Catatan lama tetap historis dan tidak dihapus.

| Workstream | Ruang lingkup | Status saat ini |
|---|---|---|
| ADM-001 | Durable Object, lifecycle job, AES-GCM encrypted storage foundation, Development binding | AUTOMATED TEST SUITE PASS (OWNER-REPORTED) |
| ADM-002 | Paginated public repository discovery dan normalized registry | AUTOMATED TEST SUITE PASS (OWNER-REPORTED) |
| ADM-003 | Encrypted private metadata read/write/upsert dan bulk type update | AUTOMATED TEST SUITE PASS (OWNER-REPORTED) |
| ADM-004 | Admin Dashboard UI: table/card, search, filter, sort, detail, navigation | AUTOMATED TEST SUITE PASS (OWNER-REPORTED) |
| ADM-005 | Inspection config.json, CNAME, assets/data | AUTOMATED TEST SUITE PASS (OWNER-REPORTED) |
| ADM-006 | Background refresh, progress, cancel, retry, latest result | AUTOMATED TEST SUITE PASS (OWNER-REPORTED) |
| ADM-007 | Quick actions, selection, export, bulk project type | AUTOMATED TEST SUITE PASS (OWNER-REPORTED) |
| ADM-008 | Security review, test suite, Wrangler validation, Development runtime, evidence | AUTOMATED TESTS PASS (OWNER-REPORTED); CONFIG/SECRET/RUNTIME PENDING |

### Urutan kerja dan test policy
Pemilik memerintahkan seluruh implementasi ADM-001..ADM-007 diselesaikan dahulu; pengujian dilakukan setelah itu dalam ADM-008. Urutan tersebut telah dipenuhi dan full automated test suite dilaporkan PASS (261/261). Secret inventory dan runtime Development masih menunggu verifikasi. Jangan membuat PR, merge, atau deployment sebelum seluruh verifikasi akhir dan arahan pemilik.

Semua binding, migration, secret, deployment, dan runtime yang berkaitan dengan Dashboard hanya untuk Development Worker `dekeku-api-dev`. Production tetap dilarang disentuh.

### ADM-008 update — 2026-11-23
Owner reports `npm ci` completed with 0 vulnerabilities and full `npm test` passed 261/261 (44 suites, 0 skipped). This confirms automated test coverage only; exact tested commit SHA/Node version, complete Wrangler target/migration output, Development secret inventory, and live runtime remain NOT VERIFIED. No PR/merge/deployment is authorized by this test result.


## Owner priority override — Public Data API (2026-11-23)

Prioritas aktif terbaru adalah **Public Data API**. Workstream Admin Dashboard dijeda sementara; pekerjaan Dashboard yang sudah ada tetap dipertahankan.

| ID | Workstream | Status |
|---|---|---|
| PUB-DATA-001 | API Contract | IMPLEMENTED on dev |
| PUB-DATA-002 | Resource Registry | IMPLEMENTED on dev |
| PUB-DATA-003 | Shared Storage Engine | IMPLEMENTED on dev |
| PUB-DATA-004 | Guestbook Migration | IMPLEMENTED on dev |
| PUB-DATA-005 | Legacy Compatibility | IMPLEMENTED on dev |
| PUB-DATA-006 | Security & Integration Tests | OWNER-REPORTED LOCAL PASS (14/14); tested SHA not supplied, candidate provenance NOT VERIFIED |
| PUB-DATA-007 | Documentation & Checkpoint | IMPLEMENTED on dev |
| ADM-001..ADM-008 | Centralized Admin Dashboard | PAUSED — resume only on owner instruction or after Public Data API priority is completed |

Rincian dan acceptance criteria: [PUBLIC_DATA_API_PLAN.md](PUBLIC_DATA_API_PLAN.md).

### Arsitektur Public Data API yang disetujui
- Generic endpoint: `POST /api/v1/public/data/{resource}`.
- Server-side Resource Registry dan validator khusus per resource.
- Shared Project Origin resolver berbasis kontrak `config.json` File Manager; migrasi Guestbook telah selesai dan source pada `dev` menggunakan `resolveProjectRepository()`. Perbandingan resolver lama adalah langkah historis yang sudah ditutup, bukan TODO.
- Storage path dan repository coordinates ditetapkan server-side.
- Guestbook menjadi resource pertama; route lama `POST /api/v1/public/submit` dipertahankan sementara sebagai alias.
- Website membaca data langsung dari repository publik/CDN; GET API baru tidak termasuk tahap awal.

Tidak ada izin deployment, perubahan Cloudflare, atau akses Production dari perubahan prioritas ini.


## Public Data API implementation update — 2026-11-23

The approved Public Data API implementation is now present on GitHub branch `dev`:
- PUB-DATA-001..005: IMPLEMENTED on `dev`.
- PUB-DATA-006: owner-reported Termux focused tests 14/14 PASS; 7 changed-source syntax checks PASS. Exact tested local SHA is unknown.
- PUB-DATA-007: IMPLEMENTED on `dev`.
- PR #29 (`dev` → `main`) berstatus OPEN dan belum merged pada audit 2026-11-23.

Next: confirm tested SHA matches PR #29 head, or rerun focused tests against that exact candidate. Full suite, remote integration, live repository write, Worker runtime, and deployment remain NOT VERIFIED. No merge, deployment, Cloudflare configuration/secret changes, or Production access is authorized. Admin Dashboard remains paused.
