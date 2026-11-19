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
- **Admin WRITE**: Wajib menggunakan autentikasi (Phase 2).
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

### C. Prosedur Setelah Tugas
Codex wajib:
1. Melaporkan file yang diubah dan hasil pengujian.
2. Menyebutkan risiko dan keterbatasan.
3. Memperbarui dokumentasi terkait berdasarkan fakta aktual.

### D. Perubahan Sensitif
Dilarang tanpa instruksi eksplisit:
- Mengubah Worker produksi (`github`).
- Mengubah Secret atau kredensial.
- Melakukan deployment atau push ke GitHub.
- Mengubah kebijakan keamanan inti.

