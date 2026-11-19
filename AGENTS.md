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
- GitHub hanya berfungsi sebagai backup source code dan riwayat perubahan untuk sementara.
- GitHub bukan ketergantungan utama runtime aplikasi.
- Jangan melakukan sinkronisasi hanya karena ada perubahan kecil.

### B. Pemeriksaan Git
- Hindari pemeriksaan Git berulang tanpa kebutuhan.
- Lakukan pemeriksaan ketika memulai pekerjaan yang berpotensi mengubah source code.
- Lakukan pemeriksaan ulang ketika pekerjaan siap di-commit.
- Jangan menjalankan `git fetch`, pemeriksaan remote, atau pemeriksaan riwayat commit secara rutin jika tidak diperlukan.
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
5. Push ke GitHub sebagai backup apabila telah diizinkan.

Ketentuan:
- Jangan melakukan force-push.
- Jangan membuat atau menghapus branch tanpa persetujuan.
- Jangan mengubah branch `main` tanpa persetujuan eksplisit.
- Jangan melakukan deployment sebagai bagian otomatis dari commit atau push.

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
- Hasil sinkronisasi.

Jangan mengklaim commit atau push berhasil tanpa bukti.
