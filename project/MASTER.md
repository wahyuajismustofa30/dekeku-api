# DEKEKU API Gateway — MASTER

## 1. Deskripsi Proyek
DEKEKU API Gateway adalah layanan API terpusat berbasis Cloudflare Workers yang dirancang untuk mendukung berbagai website dan aplikasi di ekosistem DEKEKU. Sistem ini bertindak sebagai perantara aman antara klien (web/app) dan penyimpanan data di GitHub.

## 2. Latar Belakang & Tujuan
Proyek ini dibuat untuk memusatkan logika akses data dan pengelolaan file.
- **Sentralisasi**: Satu API untuk banyak aplikasi.
- **Penyimpanan Aman**: Menggunakan repository GitHub privat sebagai database dan file server.
- **Abstraksi**: Menyembunyikan kompleksitas GitHub API dari klien.
- **Keamanan**: Melindungi GitHub Token di sisi server (Secret).

## 3. Visi Akhir
Menjadi infrastruktur backend "serverless" yang handal untuk mengelola seluruh aset digital, data JSON, dan interaksi pengguna (seperti guestbook) di seluruh domain DEKEKU.

## 4. Arsitektur Tingkat Tinggi
- **Runtime**: Cloudflare Workers (Edge Computing).
- **Storage**: GitHub Private Repository (API-driven).
- **Komunikasi**: REST API (JSON).
- **Security**:
  - Public Access Policy untuk pembacaan publik.
  - JWT Authentication untuk operasi administratif.
  - Cloudflare Secrets untuk kredensial.

## 5. Komponen Utama
- **GitHub Core**: Client modular untuk interaksi dengan GitHub API (Resilience, Timeout, Error Mapping).
- **Router**: Pengatur alur request berdasarkan path dan method.
- **Middleware**: Penanganan CORS, Keamanan, dan Autentikasi.
- **Modules**: Fitur spesifik (Health, GitHub, Guestbook, dsb).

## 6. Prinsip Keamanan & Batasan
- **Public READ**: Diizinkan hanya pada direktori `public/` dengan ekstensi yang disetujui.
- **Admin WRITE**: Wajib menggunakan autentikasi JWT admin (sudah diimplementasikan).
- **Size Limit**: Batas maksimal file 1 MB.
- **No Direct GitHub Access**: Klien tidak boleh mengakses GitHub API secara langsung.
- **Isolation**: Worker development dan production dipisahkan.

## 7. Aturan Pengelolaan Proyek (Otoritas & Prosedur)

### A. Otoritas Keputusan
- **Wahyu**: Pemilik proyek dan pengambil keputusan final.
- **Codex**: Pelaksana teknis (analisis, implementasi, pengujian, rekomendasi).
- Codex dilarang mengubah tujuan utama atau arsitektur tanpa persetujuan Wahyu.

### B. Prosedur Sebelum Tugas
Codex wajib membaca dokumen di direktori `project/`:
1. `MASTER.md`
2. `ROADMAP.md`
3. `PROGRESS.md`
4. `DECISIONS.md`
5. `CHECKPOINT.md`
Kemudian melakukan audit source code terkait.
*Catatan Acuan*: `AGENTS.md` di root repository adalah acuan utama untuk alur kerja Git & GitHub. Jika terdapat perbedaan/inkonsistensi antara dokumen proyek dan kode aktual, source code adalah sumber kebenaran utama (*source of truth*), dan perbedaannya wajib dilaporkan secara eksplisit kepada Wahyu.

### C. Prosedur Setelah Tugas
Codex wajib:
1. Melaporkan file yang diubah dan hasil pengujian.
2. Menyebutkan risiko dan keterbatasan.
3. Memperbarui dokumentasi terkait berdasarkan fakta aktual.

### D. Perubahan Sensitif
Sesuai `AGENTS.md`, push ke branch `dev` dan pembuatan Pull Request `dev` -> `main` DIIZINKAN setelah kriteria Siap Commit terpenuhi dan pengujian lulus.

Dilarang keras tanpa instruksi eksplisit dari Wahyu:
- Push atau commit langsung ke branch `main`.
- Melakukan merge Pull Request.
- Melakukan force-push (`git push --force`).
- Mengubah Worker produksi (`github`).
- Mengubah Secret atau kredensial.
- Melakukan deployment otomatis ke lingkungan produksi.
- Mengubah kebijakan keamanan inti.


### E. Standar Audit Berbasis Bukti (Evidence-Based Audit)
1. **Hirarki Bukti**: Sumber kebenaran tertinggi adalah hasil pemeriksaan aktual pada repository dan runtime, diikuti source code aktual, riwayat Git, dan dokumentasi proyek. Dokumentasi historis tidak boleh mengalahkan bukti implementasi terbaru. Source code adalah *source of truth*.
2. **Konflik Dokumentasi dan Implementasi**: Jika terdapat perbedaan antara dokumentasi dan kode aktual, tampilkan klaim dokumentasi, bukti implementasi aktual, jelaskan perbedaannya, dan tentukan status berdasarkan bukti terbaru.
3. **Keputusan Deployment (GO / CONDITIONAL GO / NO-GO)**: Keputusan deployment wajib mencantumkan bukti pendukung, temuan blocker, hasil test aktual, pengujian yang belum dilakukan, dan batasan audit. Tidak boleh menyatakan siap deploy hanya berdasarkan dokumentasi atau hasil test yang tidak dapat direproduksi.
4. **Evidence Register**: Untuk audit dengan banyak temuan, gunakan format register:
   `Evidence ID | Jenis | Sumber | Lokasi / Referensi | Kesimpulan`
