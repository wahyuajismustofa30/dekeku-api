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
Pemilik memerintahkan seluruh implementasi ADM-001..ADM-007 diselesaikan dahulu; pengujian dilakukan setelah itu dalam ADM-008. Setiap implementasi sebelum ADM-008 wajib tetap ditandai NOT TESTED. Jangan membuat PR, merge, atau deployment sebelum verifikasi akhir dan arahan pemilik.

Semua binding, migration, secret, deployment, dan runtime yang berkaitan dengan Dashboard hanya untuk Development Worker `dekeku-api-dev`. Production tetap dilarang disentuh.

### ADM-008 update — 2026-11-23
Owner reports `npm ci` completed with 0 vulnerabilities and full `npm test` passed 261/261 (44 suites, 0 skipped). This confirms automated test coverage only; exact tested commit SHA/Node version, complete Wrangler target/migration output, Development secret inventory, and live runtime remain NOT VERIFIED. No PR/merge/deployment is authorized by this test result.
