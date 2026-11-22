# ROADMAP — DEKEKU API Gateway

Tanggal pembaruan: 2026-11-22
Acuan status aktual: `project/PROGRESS.md`. Remote `main` dan `dev` terverifikasi identik pada `c7cdd582003d7162a3842fd9ec612224fc733921` saat pembaruan ini.

## Arah proyek
Fokus saat ini adalah pengelolaan data publik pada repository publik masing-masing proyek. Website membaca data publik langsung dari repository/CDN; DEKEKU API Gateway menyediakan autentikasi Admin, discovery repository, browsing, dan operasi administratif. Pengaturan private repository `dekeku-db`, private account storage, mapping, serta perluasan RBAC tetap diarsipkan (A-003).

## Status tahapan

| Tahap | Status | Catatan |
|---|---|---|
| PUB-001 — Config contract v1 | COMPLETE | Spesifikasi dan JSON Schema tersedia. |
| PUB-002 — Schema & trusted Origin enforcement | IMPLEMENTED / focused tests PASS | Runtime Development belum diverifikasi. |
| PUB-003 — Shared project resolver for Admin writes | IMPLEMENTED / regression PASS | SHA dan CREATE/UPDATE/DELETE memakai resolver bersama. |
| PUB-004 — Safe public repository browsing | IMPLEMENTED / regression PASS | Admin JWT, `public/` boundary, metadata-only, pagination. |
| PUB-004-FIX — Git Trees security remediation | VERIFIED LOCALLY | Focused test dilaporkan 47/47 PASS; runtime belum diverifikasi. |
| PUB-005 — Tester File Manager | IMPLEMENTED / focused tests PASS | 66/66 pada tujuh-file regression command; belum browser E2E. |
| PUB-006 — Development end-to-end verification | PENDING / ACTIVE NEXT | Belum diverifikasi pada Worker Development aktif. |

## Gate PUB-006
Pengujian harus menggunakan minimal dua repository publik dan data fixture yang aman. Verifikasi:
1. Health endpoint dan halaman `/tester` pada Worker Development.
2. Admin login, sesi JWT, dan proteksi endpoint tanpa token.
3. Pemilihan proyek melalui `X-DEKEKU-Project-Origin` dan config schema v1.
4. Browse root `public/`, nested folder, pagination, dan metadata.
5. Read JSON serta CREATE/UPDATE/DELETE hanya pada fixture yang disetujui.
6. SHA conflict, file/path terlarang, invalid Origin, wildcard subdomain, dan upstream errors.
7. Pastikan repository proyek yang dipilih tidak tertukar dan token GitHub tidak terekspos.
8. Catat hasil per skenario dengan status VERIFIED / FAILED / NOT VERIFIED.

## CI/CD dan deployment
- `.github/workflows/pr-validation.yml` menjalankan validasi pada PR `dev` → `main`; workflow ini tidak melakukan deployment.
- PR #26 telah digabung. Validasi PR setelah perbaikan CI dilaporkan berhasil; pencarian run pada merge commit tidak menghasilkan run yang dapat diverifikasi.
- Pemilik melaporkan Cloudflare GitHub auto-deployment telah dikonfigurasi. Pemetaan branch, target Worker, deployed version, dan post-merge health masih NOT VERIFIED secara independen.
- Jangan membuat workflow deployment duplikat sebelum integrasi Cloudflare yang sudah ada diperiksa.
- Target yang diizinkan hanya Development Worker `dekeku-api-dev`. Production tetap dilarang disentuh tanpa persetujuan eksplisit.

## Website project config — follow-up
Pemeriksaan terdahulu menemukan `www.dekeku.my.id/config.json` masih menggunakan format lama dan `www.artoprintingpbg.com/config.json` mengembalikan 404; config schema v1 pada repository `demo` telah dibuat tetapi domain demo belum diverifikasi. Ini perlu diperiksa ulang, bukan diasumsikan masih sama atau sudah diperbaiki.

## Urutan kerja
1. PUB-006 Development E2E verification.
2. Recheck config v1 dan HTTP response domain proyek.
3. Reconcile dokumentasi hasil E2E dan deployment evidence.
4. Setelah gate operasional lulus, rencanakan peningkatan Admin UI sebagai pekerjaan terpisah.

Tidak ada deployment, perubahan secret/variable, perubahan Cloudflare/Wrangler, atau operasi Production yang diizinkan oleh roadmap ini.