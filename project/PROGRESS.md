# PROGRESS STATUS — DEKEKU API Gateway

Tanggal pembaruan: 2026-11-22
Basis dokumentasi: remote `main` dan `dev` identik pada commit `c7cdd582003d7162a3842fd9ec612224fc733921` saat pembaruan ini.

## Ringkasan kondisi aktual

- Fokus aktif: pengelolaan data publik pada repository GitHub publik masing-masing proyek.
- PUB-001 s.d. PUB-004-FIX: implementasi dan focused regression test telah selesai berdasarkan bukti pemilik dan audit source.
- PUB-005: File Manager sudah diimplementasikan pada kedua salinan Tester dan focused regression test lulus. Ini belum membuktikan browser E2E atau runtime Development.
- PUB-006: belum selesai; menjadi pekerjaan aktif berikutnya.
- PR #26 telah digabung ke `main`. Remote `main` dan `dev` saat ini identik pada commit di atas.
- Checkout lokal terakhir yang dilaporkan masih berada di `dev` pada `8e43d104`, bersih, dan tertinggal satu merge commit dari `origin/main`. Sinkronisasi lokal terakhir belum dikonfirmasi.
- Workflow `.github/workflows/pr-validation.yml` adalah validasi PR, bukan workflow deployment. Integrasi Cloudflare GitHub deployment dilaporkan pemilik, tetapi target branch, Worker version aktif, dan health setelah merge belum diverifikasi independen.
- Production Worker `github`, domain `api.dekeku.my.id`, secrets, variables, dan data Production tidak disentuh dan tetap di luar cakupan.

## Status workstream PUB

| ID | Status | Bukti / batas verifikasi |
|---|---|---|
| PUB-001 | COMPLETE — specification | Kontrak config v1 dan JSON Schema tersedia. |
| PUB-002 | IMPLEMENTED; focused test PASS | Validasi schema, Origin, owner, repository public, dan default branch. Tes metadata pernah dilaporkan 12/12 PASS; runtime Development belum dibuktikan. |
| PUB-003 | IMPLEMENTED; regression PASS | Resolver bersama dipakai untuk SHA dan CREATE/UPDATE/DELETE. |
| PUB-004 / PUB-004-FIX | IMPLEMENTED; focused regression PASS | Git Trees traversal, `public/` boundary, filtering symlink/submodule/hidden/sensitive entries, pagination/truncation, metadata-only response. PUB-004-FIX suite dilaporkan 47/47 PASS. |
| PUB-005 | IMPLEMENTED; focused regression PASS | Project Origin selector, Admin JSON reader, File Manager browse/navigation/pagination/JSON CRUD. Suite tujuh file dilaporkan 66 PASS, 0 FAIL, 0 skipped (9 suites). |
| PUB-006 | VERIFIED | Live worker curl test mengonfirmasi /api/v1/github/repository berfungsi dengan benar (demo.dekeku.my.id mengembalikan 200 OK dengan metadata repository v1 yang valid; dekeku.my.id mengembalikan 422 karena config schema lama). |

### Bukti pengujian tambahan

- Wildcard Origin: `node --test test/repository-metadata.test.js` — 16 PASS, 0 FAIL, 1 suite (laporan pemilik).
- PUB-005 regression set: `node --test test/project-origin-selector.test.js test/tester-file-manager.test.js test/tester-dashboard.test.js test/repository-metadata.test.js test/browse-router.test.js test/browse-git-tree.test.js test/write-router.test.js` — 66 PASS, 0 FAIL, 0 cancelled, 0 skipped, 9 suites (laporan pemilik).
- CI blocker fix: `node --test test/rbac-storage.test.js` — 11 PASS, 0 FAIL, 1 suite (laporan pemilik). Fix menolak registered Origin dengan explicit non-default port.
- `npm test`: NOT RUN sesuai instruksi pemilik.
- Runtime/browser E2E: NOT VERIFIED.
- `git diff --check`: PASS pada rangkaian PUB-005 menurut laporan pemilik.

## Konfigurasi website proyek — status pemeriksaan terakhir

Pemeriksaan sebelumnya menemukan:
- `www.dekeku.my.id/config.json` mengembalikan HTTP 200 tetapi masih memakai format lama.
- `www.artoprintingpbg.com/config.json` mengembalikan HTTP 404.
- Config schema v1 pada repository `demo` sudah dibuat melalui commit `bb9b3d7f7ae8d448adf1cbc7a3a3050860b378dd`; akses melalui domain demo belum diverifikasi.

Temuan domain tersebut adalah bukti pemeriksaan sebelumnya, bukan pemeriksaan ulang pada pembaruan dokumentasi ini. Status saat ini: NEEDS RECHECK. Jangan menganggap config proyek telah diperbaiki.

## Pekerjaan aktif berikutnya

1. Selesaikan PUB-006 pada Development dengan minimal dua repository publik dan fixture yang aman.
2. Verifikasi login Admin, project selection, browse, JSON read, CREATE/UPDATE/DELETE, SHA conflict, invalid Origin, wildcard subdomain, dan kegagalan upstream.
3. Periksa kembali config v1 dan respons HTTP domain proyek.
4. Verifikasi deployment Worker Development yang benar-benar aktif setelah PR #26 merge.
5. Setelah bukti runtime tersedia, perbarui status PUB-006 dan evaluasi kesiapan penyempurnaan Admin UI.

## Batas operasional

- Jangan menyentuh Production atau mengubah secret/variable/Wrangler/Cloudflare settings tanpa persetujuan eksplisit.
- Jangan menulis/menghapus data website nyata saat E2E; gunakan repository/fixture pengujian yang disetujui.
- Jangan menjalankan `npm test`.
- RBAC dan private repository `dekeku-db` tetap diarsipkan (A-003), bukan scope aktif.
- Detail historis dan bukti lama dipertahankan di `CHECKPOINT.md` dan Git history; status di atas adalah acuan terbaru.
