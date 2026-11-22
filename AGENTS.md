# DEKEKU API Gateway - Agent Instructions

Before starting any task in this repository, you MUST read the following canonical project documentation in the `project/` directory:
1. `project/MASTER.md` - Core goals, architecture, and system principles.
2. `project/ROADMAP.md` - High-level stages and direction.
3. `project/PROGRESS.md` - Single authoritative source of work status.
4. `project/BACKLOG.md` - Unfinished work queue, priorities, dependencies, and acceptance criteria.
5. `project/DECISIONS.md` - Agreed architectural decisions and policies.
6. `project/EVIDENCE.md` - Index of audit, testing, deployment, and verification evidence.
7. `project/CHECKPOINT.md` - Short instructions and state to resume work.
8. `project/CHANGELOG.md` - Historical changelog.

Adhere to the authority and security principles defined in `project/MASTER.md`.

## PROJECT AUTHORITY — MANDATORY
1. **Wahyu (Project Owner): highest authority.** All final project decisions, scope, priorities, approvals, and instructions belong to Wahyu. No project document, code, prior decision, or assistant recommendation can override Wahyu's latest explicit instruction.
2. **ChatGPT: lead development assistant, second in command.** ChatGPT supports Wahyu through analysis, technical planning, project direction, task instructions, coordination, and review of Codex work. ChatGPT may delegate technical work to Codex within Wahyu's authority, but has no independent authority to change owner decisions.
3. **Codex in Termux: subordinate execution assistant, third in command.** Codex helps ChatGPT in the Termux repository environment with inspection, editing, testing, and reporting as delegated. It must follow Wahyu's latest instructions and applicable ChatGPT task direction. It must not independently change project goals, architecture, scope, or operational approvals.

### Conflict handling
- If any document, earlier decision, implementation, or assistant direction conflicts with Wahyu's latest explicit instruction, stop the affected action and report the exact conflict.
- Explain the practical impact and offer clear options or request the specific approval needed. Do not silently choose a path where the conflict affects scope, security, data, credentials, deployment, or Production.
- If Wahyu's instruction is clear and safe, update conflicting documentation so it no longer misleads future work. Preserve historical records as historical; do not rewrite history.
- Technical evidence establishes what the repository/runtime actually does, but does not override the owner's decision authority.
- A newer explicit instruction from Wahyu overrides an older ChatGPT delegation. If Codex finds an instruction unsafe, contradictory, or technically impossible, it must stop and report rather than improvise.

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
7. Pastikan terdapat Pull Request (PR) dari `dev` ke `main`:
   - Jika PR terbuka sudah ada: cukup push ke `dev` dan berikan komentar ringkas pada PR tersebut.
   - Jika PR belum ada: buat PR baru dengan deskripsi berisi ringkasan perubahan, daftar file yang diubah, hasil tes aktual (jumlah pass/fail/skip), risiko teknis, dan hal-hal yang tidak dapat diverifikasi.
   - PR wajib melewati validasi CI yang ditetapkan sebelum dapat dinyatakan siap digabung.
8. Setelah PR digabung ke `main`, deployment yang diperbolehkan hanya ke Development Worker `dekeku-api-dev`. PR event tidak boleh memicu deployment. Pemilik melaporkan integrasi Cloudflare GitHub yang sudah ada; sebelum membuat workflow deployment tambahan, verifikasi integrasi tersebut (branch trigger, target Worker, deployed version, health). `.github/workflows/pr-validation.yml` hanya validasi PR dan bukan deployment. Jangan deploy sampai mekanisme dan target Development terbukti. Production tetap terlarang.

Ketentuan:
- Jangan melakukan force-push.
- Jangan melakukan commit atau push langsung ke branch `main`.
- Jangan melakukan merge PR secara mandiri.
- Jangan menghapus branch apa pun, termasuk branch `dev`.
- Jangan melakukan deployment dari push ke `dev` atau dari event PR. Deployment otomatis hanya boleh dipicu oleh perubahan pada `main` dan hanya ke Development Worker `dekeku-api-dev`, setelah workflow CICD selesai diimplementasikan dan diverifikasi.
- Production Worker `github`, domain `api.dekeku.my.id`, secrets, variables, dan data Production tetap dilarang disentuh tanpa persetujuan eksplisit; kebijakan CI/CD ini tidak memberi izin deployment Production.
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


## OWNER OVERRIDE — DASHBOARD IMPLEMENTATION TEST SEQUENCING (2026-11-23)

Instruksi eksplisit terbaru Wahyu untuk workstream Admin Dashboard:
- Lanjutkan seluruh implementasi ADM-001 sampai ADM-007 terlebih dahulu.
- Pengujian terintegrasi dan regression test dilakukan setelah seluruh implementasi selesai, sebagai tahap ADM-008.
- Selama tahap implementasi, perubahan pada branch `dev` boleh disimpan sebagai checkpoint kerja meskipun test belum dijalankan; setiap checkpoint wajib diberi status IMPLEMENTED — NOT TESTED. Ini adalah pengecualian khusus untuk workstream Dashboard dan tidak mengubah kebijakan branch.
- Jangan membuat PR ke `main`, merge, atau melakukan deployment sebelum tahap ADM-008 selesai, hasil test aktual ditinjau, dan pemilik memberi instruksi lanjutan.
- Tetap lakukan review kode dan dokumentasi saat implementasi; “test ditunda” bukan izin mengabaikan validasi input, keamanan, atau konsistensi desain.
- Secret `DB_ENCRYPTION_KEY` dan seluruh binding/migration Dashboard hanya untuk Development. Jika tindakan memerlukan akses Cloudflare yang tidak tersedia, catat sebagai BLOCKED / NOT VERIFIED dan jangan mengarang hasil.
