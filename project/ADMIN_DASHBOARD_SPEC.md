# Admin Dashboard & Project Registry — Implementation Specification

Tanggal: 2026-11-23
Status: APPROVED SCOPE / IMPLEMENTATION IN PROGRESS — TESTING DEFERRED TO ADM-008
Target branch: `dev`
Target runtime: Development Worker `dekeku-api-dev` only

## 1. Tujuan

Membangun Dashboard Admin terpusat untuk menemukan dan mengelola repository publik milik ekosistem DEKEKU. Dashboard menjadi antarmuka administrasi; repository proyek tetap menjadi sumber file publiknya. Metadata pengelolaan internal disimpan secara privat di `dekeku-db`.

Spesifikasi ini merekam keputusan polling pemilik (57–78) dan instruksi terbaru pemilik. Jika bertentangan dengan keputusan lama yang mengarsipkan pengelolaan `dekeku-db`, instruksi terbaru ini menjadi acuan untuk workstream Dashboard.

## 2. Batas lingkungan dan keamanan

- Semua implementasi, binding, migration, secret, pengujian runtime, dan data percobaan hanya untuk Development.
- Durable Object dan secret `DB_ENCRYPTION_KEY` disetujui khusus untuk Development. Persetujuan ini bukan izin mengubah Production.
- Jangan menambahkan secret plaintext ke repository, log, test fixture, atau dokumentasi.
- Token GitHub dan JWT tidak boleh ditampilkan atau diekspor.
- Error dari GitHub/API harus disanitasi sebelum ditampilkan; redaksi token, password, JWT, hash, dan secret wajib.
- Semua endpoint Dashboard memerlukan Admin JWT.
- Discovery hanya menampilkan repository publik dari owner yang dikonfigurasi; jangan menerima owner arbitrer dari browser.
- Metadata privat harus dienkripsi sebelum disimpan di `dekeku-db`; detail algoritma, format envelope, rotasi key, dan pemulihan harus ditetapkan dalam desain teknis sebelum implementasi.
- Tidak boleh ada operasi tulis/hapus ke repository proyek ketika melakukan pemeriksaan status.
- Production Worker `github`, domain `api.dekeku.my.id`, konfigurasi, secret, dan data tetap di luar cakupan.

## 3. Repository Manager

### 3.1 Discovery dan registry
- Ambil daftar seluruh repository publik milik owner yang dikonfigurasi melalui GitHub API dengan pagination.
- Jangan menganggap hasil satu halaman sebagai daftar lengkap.
- Pisahkan data faktual dari GitHub (nama, URL, visibility, archived, default branch, updated_at) dari metadata klasifikasi internal.
- Simpan metadata internal proyek secara privat di `dekeku-db`, termasuk tipe proyek dan informasi pengelolaan yang disepakati.
- Jangan menyimpan salinan file publik proyek sebagai registry metadata.

### 3.2 Daftar dan tampilan
- Urutan default: terakhir diperbarui, terbaru lebih dahulu.
- Sediakan tampilan tabel dan kartu; Admin dapat berpindah di antara keduanya.
- Pencarian: nama proyek, nama repository, domain, dan jenis proyek.
- Filter:
  - jenis proyek;
  - status operasional: aktif, tidak aktif, bermasalah;
  - status repository GitHub: aktif, archived;
  - kelengkapan konfigurasi: `config.json`, `CNAME`, dan `assets/data`.
- Detail proyek menampilkan identitas/repository, status operasional dan GitHub, domain, status CNAME, kelengkapan konfigurasi, serta waktu pemeriksaan terakhir.
- Sediakan dropdown pemilih proyek dan tombol sebelumnya/berikutnya.
- Detail GitHub mencakup visibility, waktu update terakhir GitHub, dan URL repository.

## 4. Pemeriksaan repository

- Pemeriksaan hanya dijalankan manual melalui tombol Refresh; jangan melakukan polling otomatis berkala.
- Refresh tanpa pilihan memeriksa seluruh proyek.
- Refresh terpilih hanya memeriksa proyek yang dicentang.
- Pekerjaan berjalan di background melalui Durable Object agar Admin tetap dapat menggunakan halaman lain.
- UI menampilkan jumlah selesai, sedang diproses, dan tersisa.
- Sediakan Cancel Refresh dengan dialog konfirmasi.
- Ketika selesai, tampilkan ringkasan proyek berhasil dan bermasalah.
- Untuk kegagalan, tampilkan nama proyek/repository, penyebab, waktu, tahap yang gagal, serta detail teknis GitHub/API yang sudah disanitasi.
- Retry hanya untuk proyek yang gagal, tidak mengulang proyek yang sukses.
- Tidak menyimpan riwayat refresh; simpan hanya status/hasil pemeriksaan terbaru.
- Status dan hasil harus tetap tersedia setelah navigasi halaman dan pemuatan ulang UI sesuai lifecycle job yang ditetapkan.

### Tahap pemeriksaan minimal
1. Mengambil metadata repository GitHub.
2. Memeriksa status archived/visibility dan default branch.
3. Memeriksa keberadaan serta validitas dasar `config.json`.
4. Memeriksa keberadaan `CNAME`.
5. Memeriksa keberadaan direktori `assets/data`.
6. Menyusun status operasional dan ringkasan error.

Pemeriksaan konfigurasi harus mengikuti kontrak repository publik yang sudah ada. Jangan menafsirkan file yang hilang sebagai repository tidak aktif tanpa aturan status yang eksplisit.

## 5. Aksi proyek

- Aksi cepat per proyek ditempatkan dalam menu tiga titik: buka detail, periksa ulang, edit metadata, dan buka repository GitHub.
- Checkbox mendukung pemilihan beberapa proyek dan pilih semua.
- Aksi massal:
  - refresh proyek terpilih;
  - ekspor daftar proyek terpilih;
  - ubah jenis proyek untuk seluruh pilihan.
- Perubahan metadata harus divalidasi dan ditulis ke storage privat secara aman.
- Bulk update harus memiliki validasi semua target sebelum commit data agar kegagalan parsial tidak menghasilkan klasifikasi yang tidak konsisten.
- Ekspor hanya memuat metadata non-rahasia yang memang diperlukan; tidak boleh mengekspor kredensial, key, atau data privat sensitif.

## 6. Durable Object dan storage

- Durable Object digunakan untuk koordinasi job refresh, status/progress, pembatalan, dan retry.
- Binding dan migration Durable Object harus didefinisikan untuk Development saja pada tahap awal.
- `DB_ENCRYPTION_KEY` hanya disediakan sebagai secret Development dan tidak pernah menjadi variable biasa.
- Implementasi storage terenkripsi untuk `dekeku-db` memerlukan format ciphertext berversi, nonce unik, autentikasi integritas, validasi ukuran, serta perilaku fail-closed ketika key tidak tersedia atau dekripsi gagal.
- Jangan mengimplementasikan fallback plaintext.
- Persistensi metadata dan status pemeriksaan terbaru harus dipisahkan dari histori; histori refresh tidak disimpan.

## 7. Acceptance criteria

1. Repository discovery memuat seluruh halaman hasil GitHub dan hanya repository publik yang sesuai owner.
2. Metadata internal dapat dibaca/ditulis Admin terautentikasi dan tidak bocor ke endpoint publik.
3. Penyimpanan metadata menggunakan enkripsi terautentikasi; key hanya berasal dari Development secret.
4. Daftar mendukung sorting, tabel/kartu, pencarian, filter, dan navigasi detail.
5. Pemeriksaan manual berjalan di background dan UI tetap dapat digunakan.
6. Progress, cancellation, failure detail, serta retry hanya pada item gagal bekerja sesuai spesifikasi.
7. Status terbaru tersedia tanpa menyimpan riwayat refresh.
8. Quick actions dan bulk actions memenuhi validasi serta batas otorisasi.
9. Test unit/integrasi mencakup pagination, auth, enkripsi, key missing/wrong, concurrency, cancellation, retry, partial failure, redaction, bulk validation, dan data isolation.
10. Development Worker diuji secara eksplisit; tidak ada operasi Production.

## 8. Rencana implementasi

- ADM-001: Dev-only Durable Object binding, lifecycle, dan encrypted storage foundation.
- ADM-002: Paginated public repository discovery dan normalized registry.
- ADM-003: Private metadata read/write/upsert dan bulk project-type update di `dekeku-db` dengan enkripsi.
- ADM-004: Admin dashboard UI, list/table/card, search, filter, sort, detail.
- ADM-005: Repository inspection/check pipeline.
- ADM-006: Background refresh orchestration, progress, cancel, retry, latest-result persistence.
- ADM-007: Quick actions, selection, export, bulk project-type update.
- ADM-008: Security review, regression/integration tests, Development runtime verification, dan dokumentasi evidence.

## 9. Status verifikasi

- Scope dari polling 57–78: RECORDED.
- Approval Durable Object + `DB_ENCRYPTION_KEY` Development-only: RECORDED.
- Source implementation: PRESENT on `dev` for ADM-001 through ADM-007; NOT TESTED.
- Unit/integration tests: DEFERRED by explicit owner instruction until all ADM-001 through ADM-007 implementation work is complete.
- Durable Object binding/migration: PRESENT in `wrangler.jsonc` on `dev`; not validated by Wrangler.
- `DB_ENCRYPTION_KEY` Development secret: NOT VERIFIED from this session. Availability of `GITHUB_TOKEN`, `JWT_SECRET`, and `ADMIN_PASSWORD_HASH` on the Development Worker is also NOT VERIFIED from this session.
- Cloudflare Development deployment/runtime: NOT VERIFIED.
- Production: NOT TOUCHED.
