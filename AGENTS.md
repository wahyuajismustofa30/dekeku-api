# DEKEKU API Gateway - Agent Instructions

Before starting any task in this repository, you MUST read the following project documentation in the `project/` directory:
1. `project/MASTER.md` - Core goals and operational rules.
2. `project/ROADMAP.md` - Current phase and dependencies.
3. `project/PROGRESS.md` - Feature status.
4. `project/DECISIONS.md` - Architectural decisions.
5. `project/CHECKPOINT.md` - Last state and next steps.

Adhere to the authority and security principles defined in `project/MASTER.md`.

## GIT & GITHUB WORKFLOW POLICY

### A. Fungsi GitHub
- GitHub berfungsi sebagai backup source code, riwayat perubahan, dan jalur review kode.
- GitHub **bukan** ketergantungan runtime tetapi menjadi jalur review melalui Pull Request dari branch `dev` ke `main`.
- Jangan melakukan sinkronisasi hanya karena ada perubahan kecil.

### B. Pemeriksaan Git
- Hindari pemeriksaan Git berulang tanpa kebutuhan.
- Diizinkan melakukan satu kali `git fetch` dan sinkronisasi branch `dev` di awal tugas yang akan mengubah source code.
- Jika branch `dev` tertinggal atau menyimpang dari `main` (misalnya setelah squash merge di GitHub), sinkronkan dengan melakukan merge `origin/main` ke `dev`. Jangan menggunakan `rebase` atau `force-push`. Selesaikan konflik hanya jika sepele; jika tidak sepele, berhenti dan laporkan tanpa menebak.
- Lakukan pemeriksaan ulang ketika pekerjaan siap di-commit.
- Jangan menjalankan pemeriksaan remote atau pemeriksaan riwayat commit secara rutin jika tidak diperlukan.
- Jangan melakukan audit Git menyeluruh untuk pekerjaan dokumentasi sederhana.

### C. Kriteria Siap Commit
Commit hanya dipertimbangkan ketika:
- Implementasi tahap terkait sudah selesai.
- Pengujian relevan sudah dilakukan.
- Hasil pengujian sudah diverifikasi.
- Dokumentasi terkait sudah diperbarui.
- Tidak ada perubahan tidak dikenal atau file sensitif yang ikut disertakan.
- Perubahan sudah layak menjadi checkpoint.

Jangan memaksakan commit untuk pekerjaan yang masih berlangsung.

### D. Prosedur Commit dan Push
Ketika pekerjaan sudah matang:
1. Periksa perubahan yang akan disimpan.
2. Pastikan tidak ada secret, password, token, atau kredensial.
3. Pastikan hanya file relevan yang disertakan.
4. Buat commit dengan pesan yang jelas.
5. Seluruh commit dan push hanya dilakukan ke branch `dev`. Jika branch `dev` lokal belum ada, buat dari `origin/main`. Pembuatan branch `dev` ini diizinkan tanpa persetujuan tambahan.
6. Push ke `origin/dev` diizinkan setelah kriteria di Bagian C terpenuhi dan tes lulus (tidak ada tes baru yang gagal).
7. Setelah push, pastikan terdapat Pull Request (PR) dari `dev` ke `main`:
   - Jika PR terbuka sudah ada: cukup push ke `dev` dan berikan komentar ringkas pada PR tersebut.
   - Jika PR belum ada: buat PR baru dengan deskripsi berisi ringkasan perubahan, daftar file yang diubah, hasil tes aktual (jumlah pass/fail/skip), risiko teknis, dan hal-hal yang tidak dapat diverifikasi.

Ketentuan:
- Jangan melakukan force-push.
- Jangan melakukan commit atau push langsung ke branch `main`.
- Jangan melakukan merge PR secara mandiri.
- Jangan menghapus branch apa pun, termasuk branch `dev`.
- Jangan melakukan deployment sebagai bagian otomatis dari commit atau push.
- Jangan mengubah `wrangler.jsonc` atau secret tanpa persetujuan eksplisit.
- Membuat atau menghapus branch selain `dev` tetap memerlukan persetujuan eksplisit.

### E. Kondisi Belum Siap
Jika pekerjaan belum matang:
- Biarkan perubahan tetap lokal.
- Jangan melakukan commit atau push.
- Perbarui checkpoint dokumentasi jika diperlukan.
- Jangan menghapus perubahan lokal yang belum disimpan.

### F. Pelaporan
Setelah aktivitas Git yang relevan, laporkan secara ringkas:
- Branch aktif.
- Status commit.
- Status push.
- Status PR (nomor atau tautan, baru atau sudah ada).
- Jumlah hasil pengujian (pass/fail/skip).
- Hasil sinkronisasi.

Jangan mengklaim commit atau push berhasil tanpa bukti.

### G. Bila Push atau PR Tidak Bisa Dilakukan
Jika tidak memiliki akses atau kredensial yang diperlukan untuk melakukan push atau membuat PR:
1. Berhenti dan jangan mencari jalan lain atau mengakali pembatasan tersebut.
2. Biarkan commit tetap tersimpan di branch lokal `dev`.
3. Laporkan kendala tersebut secara jelas kepada pengguna.


## EVIDENCE-BASED AUDIT & VERIFICATION POLICY (PRINSIP: NO EVIDENCE, NO CLAIM)

Setiap klaim teknis, hasil audit, hasil pengujian, dan kesimpulan wajib memiliki bukti aktual.

### A. Larangan Utama
Codex dilarang keras:
- Mengarang hasil pemeriksaan, output terminal, nomor baris kode, atau jumlah PASS/FAIL/SKIP.
- Menganggap test, CI, PR, atau deployment berhasil tanpa menjalankan dan memeriksa bukti aktual.
- Menganggap secret tersedia berdasarkan dokumentasi semata.
- Jika bukti tidak tersedia atau tidak dapat diverifikasi, wajib menuliskan `NOT VERIFIED`.

### B. Status Verifikasi
Gunakan status secara konsisten:
- `VERIFIED` — didukung bukti aktual yang cukup.
- `NOT VERIFIED` — belum dapat dibuktikan.
- `FAILED` — pemeriksaan telah dijalankan dan gagal.
- `NEEDS INVESTIGATION` — ditemukan indikasi masalah yang membutuhkan pemeriksaan lanjutan.
- `NOT RUN` — pemeriksaan tidak dijalankan.

### C. Persyaratan Bukti Pengujian
Setiap pengujian yang dijalankan wajib mencatat format berikut:
- **Test ID / Nama Tes**: 
- **Commit / Branch**: 
- **Environment**: 
- **Command**: 
- **Exit Code**: 
- **PASS / FAIL / SKIP**: 
- **Output Evidence**: 
- **Result**: 

### D. Keamanan Pengujian & Redaksi
- Utamakan pengujian lokal, mock, fixture, atau environment terisolasi.
- Jangan melakukan pengujian destruktif atau operasi tulis/hapus pada runtime aktif tanpa persetujuan eksplisit.
- Redaksi informasi sensitif (token, password, JWT, hash, secret) sebelum menyertakan output.
