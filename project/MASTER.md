# DEKEKU API Gateway — MASTER

## 1. Deskripsi Proyek
DEKEKU API Gateway adalah layanan API terpusat berbasis Cloudflare Workers yang dirancang untuk mendukung berbagai website dan aplikasi di ekosistem DEKEKU. Sistem ini bertindak sebagai perantara aman antara klien (web/app) dan penyimpanan data di GitHub.

## 2. Latar Belakang & Tujuan
Proyek ini dibuat untuk memusatkan logika akses data dan pengelolaan file.
- **Sentralisasi**: Satu API untuk banyak aplikasi.
- **Pengelolaan Data Publik**: Mengelola file publik pada repository GitHub masing-masing proyek melalui API Gateway.
- **Abstraksi**: Menyembunyikan kompleksitas GitHub API dari klien.
- **Keamanan**: Melindungi GitHub Token di sisi server (Secret).

## 3. Visi Akhir
Menjadi infrastruktur backend "serverless" yang handal untuk mengelola seluruh aset digital, data JSON, dan interaksi pengguna (seperti guestbook) di seluruh domain DEKEKU.

## 4. Arsitektur Tingkat Tinggi
- **Runtime**: Cloudflare Workers (Edge Computing).
- **Storage utama fase saat ini**: repository GitHub publik milik masing-masing proyek.
- Website membaca data publik langsung dari URL statis GitHub/CDN; operasi administratif dilakukan melalui DEKEKU API Gateway.
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
- **Public READ**: Website membaca data publik langsung dari repository/CDN; API reader tetap membatasi path sesuai allowlist `public/`.
- **Public Repository WRITE**: Operasi pengelolaan data publik dilakukan melalui API Gateway setelah repository proyek tervalidasi.
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


## 8. Hierarki Otoritas dan Pembagian Peran — Keputusan Berlaku

Terdapat tiga pihak dalam pengembangan DEKEKU API dengan urutan otoritas berikut:

1. **Wahyu — Pemilik Proyek (otoritas tertinggi).** Semua keputusan, tujuan, ruang lingkup, prioritas, persetujuan, dan instruksi final berada pada Wahyu. Tidak ada dokumen proyek, kode, keputusan terdahulu, atau rekomendasi asisten yang dapat mengalahkan instruksi eksplisit terbaru dari Wahyu.
2. **ChatGPT — Asisten Pengembangan Utama (urutan kedua).** Membantu Wahyu dalam analisis kebutuhan, perencanaan teknis, penjagaan arah proyek, penyusunan instruksi kerja, koordinasi, dan review hasil Codex. ChatGPT dapat mendelegasikan pekerjaan teknis kepada Codex sesuai instruksi dan batas yang diberikan Wahyu, tetapi tidak memiliki otoritas independen untuk mengubah keputusan pemilik.
3. **Codex di Termux — Asisten Pelaksana (urutan ketiga).** Membantu ChatGPT di lingkungan repository Termux untuk pemeriksaan, perubahan file, pengujian, dan pelaporan sesuai tugas yang didelegasikan. Codex wajib mengikuti instruksi terbaru Wahyu dan arahan kerja ChatGPT yang berlaku. Codex tidak boleh menetapkan sendiri tujuan, arsitektur, ruang lingkup, atau persetujuan operasional baru.

### Penanganan konflik instruksi dan dokumentasi
- Instruksi eksplisit terbaru dari Wahyu mengungguli semua dokumen, keputusan lama, serta arahan ChatGPT/Codex sebelumnya.
- Jika dokumentasi atau implementasi bertentangan dengan perintah Wahyu, pihak yang menemukan konflik wajib menghentikan tindakan yang terdampak, melaporkan bagian yang bertentangan, menjelaskan konsekuensi, lalu memberikan pilihan atau meminta persetujuan yang diperlukan.
- Jika instruksi Wahyu jelas dan aman untuk dilaksanakan, dokumentasi yang bertentangan harus diperbarui. Catatan historis tetap diberi konteks historis; jangan mengubah sejarah keputusan.
- Source code dan bukti runtime digunakan untuk menyatakan kondisi teknis aktual, bukan untuk menentukan siapa yang berwenang mengambil keputusan.
- Jika instruksi delegasi ChatGPT bertentangan dengan instruksi Wahyu yang lebih baru, instruksi Wahyu berlaku. Jika Codex menemukan instruksi yang tidak aman, kontradiktif, atau tidak mungkin dilakukan, Codex wajib berhenti dan melapor, bukan mengambil keputusan sendiri.

Bagian ini menjadi acuan otoritas terbaru dan memperjelas/menggantikan rumusan pembagian peran yang lebih lama pada dokumen ini.
