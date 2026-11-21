# CICD-003 — PR Validation Contract

Tanggal: 2026-11-21
Status: IMPLEMENTED — workflow dibuat; menunggu validasi run PR aktual.
Target PR: `dev` → `main`.
Batas: validasi CI saja; tidak melakukan deployment.

## 1. Prinsip pemicu dan isolasi
- Workflow validasi hanya berjalan pada event Pull Request dengan base `main` dan head branch `dev` pada repository ini.
- Event PR tidak boleh menjalankan `wrangler deploy`, upload Worker, mengubah Cloudflare, atau mengakses Production.
- Validasi tidak membutuhkan `GITHUB_TOKEN`, `JWT_SECRET`, `ADMIN_PASSWORD_HASH`, atau secret Cloudflare. Jangan mengakses atau mencetak secrets.
- Gunakan runner Node.js LTS yang konsisten dengan versi proyek; gunakan `npm ci` dari `package-lock.json`.
- Batasi permission workflow/job ke minimum; validasi biasa hanya memerlukan `contents: read`.
- Batasi concurrency per PR agar run lama dapat dibatalkan tanpa memengaruhi workflow deployment yang kelak dibuat terpisah.

## 2. Pemeriksaan dan klasifikasi

| Check | Command/Metode | Klasifikasi | Kriteria |
|---|---|---|---|
| Dependency install | `npm ci` | REQUIRED / BLOCKING | Instalasi bersih harus exit 0; lockfile wajib tersedia dan konsisten. |
| JavaScript syntax | `node --check` untuk seluruh file `.js` yang relevan di `src/` dan `test/` | REQUIRED / BLOCKING | Semua file yang diperiksa harus valid. Jangan hanya memeriksa entrypoint. |
| Wrangler config/bundle validation | `npx wrangler deploy --dry-run` dengan output diarahkan ke direktori sementara | REQUIRED / BLOCKING | Konfigurasi dan bundling harus berhasil. Ini dry-run lokal CI, bukan deployment; jangan berikan token Cloudflare. |
| Focused regression tests | `node --test` hanya untuk test file yang dipetakan ke file source yang berubah | REQUIRED bila ada perubahan kode dengan test mapping; BLOCKING bila test terkait gagal | Workflow harus memilih suite relevan secara deterministik. Perubahan kode tanpa test mapping dilaporkan sebagai warning sampai mapping ditetapkan; tidak boleh diam-diam menjalankan seluruh suite. |
| Dependency/security audit | `npm audit --audit-level=high` | WARNING pada iterasi awal | Catat temuan high/critical sebagai warning; tidak mengirim detail rahasia. Promosi menjadi blocking perlu keputusan pemilik setelah baseline false-positive/mitigasi ditinjau. |
| Documentation-only change | Validasi format/struktur ringan bila tersedia | REQUIRED / BLOCKING untuk kegagalan pemeriksaan yang dijalankan | Tidak perlu menjalankan test aplikasi jika tidak ada source/test berubah. |

## 3. Larangan tes khusus
- Perintah `npm test` tetap **NOT RUN** dan tidak boleh ditambahkan sebagai required check sampai pemilik memberi instruksi eksplisit baru.
- Jangan menjalankan `npm run test:remote` atau `test/live-remote.test.js` di CI PR. Suite remote dapat menulis Guestbook ke repository aktif.
- Focused tests menggunakan `node --test <mapped-test-files>` secara eksplisit; jangan menganggapnya setara dengan full suite.
- Tidak ada test yang boleh menulis ke Worker aktif, repository data, atau Production.

## 4. Hasil PR dan merge gate
- Required checks harus berstatus sukses agar PR dapat dinyatakan lolos validasi.
- Kegagalan dependency install, syntax, Wrangler dry-run, atau focused regression test yang dipilih = FAIL dan memblokir merge.
- Security audit dan test-mapping gap pada iterasi awal = WARNING, bukan blocker.
- Workflow harus selalu menghasilkan status akhir yang jelas; kegagalan atau kondisi tidak dapat diverifikasi tidak boleh dilaporkan sebagai PASS.
- Branch protection / required status checks GitHub belum aktif dan tidak diubah oleh definisi ini. Pengaktifan merupakan pekerjaan operasional terpisah.

## 5. Batas implementasi dan dependensi
- CICD-003 hanya menetapkan kontrak. Tidak membuat workflow, mengubah source/package scripts/Wrangler, mengubah GitHub settings/secrets, atau melakukan deployment.
- CICD-004 akan mengimplementasikan PR validation workflow berdasarkan kontrak ini.
- CICD-006/007 menangani isolasi kredensial dan safety deployment secara terpisah.
- Perintah dan versi action yang dipakai implementasi harus dipin ke versi/commit yang terverifikasi; jangan memakai action tag bergerak tanpa review.
- `wrangler.jsonc` saat ini menamai Worker `dekeku-api-dev`; dry-run harus memastikan nama tersebut dan tidak menggunakan environment/target Production.

## 6. Acceptance criteria CICD-003
- [x] Trigger PR `dev` → `main`; PR tidak melakukan deployment.
- [x] Required blocking checks dan warning checks ditentukan.
- [x] Aturan focused test ditentukan tanpa menjalankan `npm test` atau remote tests.
- [x] Secrets dan akses Production dikecualikan.
- [x] Hasil gagal/ambigu fail closed untuk pemeriksaan wajib.
- [x] Implementasi workflow PR: `.github/workflows/pr-validation.yml` dibuat pada CICD-004.
- [ ] Bukti run PR aktual: NOT VERIFIED; memerlukan PR `dev` → `main` dan hasil GitHub Actions.


## CICD-004 Implementation Notes
- Workflow runs only for pull requests targeting `main` and is gated to head branch `dev`.
- Actions are pinned to immutable commit SHAs; permissions are read-only; checkout credentials are not persisted; concurrency is scoped per PR.
- Focused test selection uses an explicit source-to-test mapping. Changed test files run directly; `test/live-remote.test.js` is never executed.
- Dependency audit is warning-only. The workflow has no deployment step, Cloudflare credentials, or GitHub write permission.
- Workflow syntax, job execution, and actual PR check result remain NOT VERIFIED until a real PR run is available.
