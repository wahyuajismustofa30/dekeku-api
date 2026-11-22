# ROADMAP — DEKEKU API Gateway

Tanggal pembaruan: 2026-11-22
Acuan status aktual: `project/PROGRESS.md`. Remote `main` dan `dev` terverifikasi identik pada `c7cdd582003d7162a3842fd9ec612224fc733921` saat pembaruan ini.

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
| PUB-006 — Development end-to-end verification | COMPLETE & VERIFIED | Live Development Worker E2E, admin login, project selection, dan CRUD fixture sukses diverifikasi. |

## CI/CD dan deployment
- `.github/workflows/pr-validation.yml` menjalankan validasi pada PR `dev` → `main`; workflow ini tidak melakukan deployment.
- Pemilik melaporkan Cloudflare GitHub auto-deployment telah dikonfigurasi dan deployment dari GitHub berhasil.
- Target yang diizinkan hanya Development Worker `dekeku-api-dev`. Production tetap dilarang disentuh tanpa persetujuan eksplisit.

## Urutan kerja
1. PUB-001 s.d. PUB-006 selesai dan diverifikasi.
2. Rencanakan peningkatan Admin UI atau integrasi selanjutnya sesuai instruksi pemilik.

Tidak ada deployment, perubahan secret/variable, perubahan Cloudflare/Wrangler, atau operasi Production yang diizinkan oleh roadmap ini.
