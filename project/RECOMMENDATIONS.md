# Project Recommendations — DEKEKU API Gateway

Tanggal pembaruan: 2026-11-23

Dokumen ini berisi rekomendasi teknis, bukan persetujuan untuk mengubah scope, source code, konfigurasi Cloudflare, secrets, atau Production. Status otoritatif pekerjaan tetap berada di `project/PROGRESS.md`.

## Prioritas 1 — Tutup provenance validasi PUB-DATA

- Dapatkan output `git rev-parse HEAD` dari checkout Termux yang menjalankan `node --test test/public-submission.test.js`.
- Bandingkan SHA tersebut dengan HEAD PR #29.
- Jika berbeda, jalankan ulang focused test 14 kasus pada commit kandidat PR yang tepat.
- Simpan command, branch, SHA, environment, exit code, dan ringkasan PASS/FAIL di `project/EVIDENCE.md`.
- Jangan jalankan `test:remote` tanpa persetujuan eksplisit karena dapat menulis ke repository proyek aktif.

## Prioritas 2 — Verifikasi perilaku runtime Development

Setelah ada persetujuan deployment Development secara eksplisit:
- Pastikan target yang dipakai hanya Worker `dekeku-api-dev`.
- Verifikasi binding/variables/secrets berdasarkan nama tanpa menampilkan nilai rahasia.
- Lakukan smoke test endpoint health dan alur Guestbook pada fixture/repository uji yang memang diizinkan.
- Catat versi Worker, commit sumber, hasil smoke test, dan batas verifikasi.
- Jangan menyentuh Production Worker `github`, domain `api.dekeku.my.id`, konfigurasi, secrets, atau data Production.

## Prioritas 3 — Review keamanan Public Data API

Sebelum menganggap PUB-DATA siap rilis, review:
- Rate limiting/abuse protection untuk endpoint publik; Origin dan CORS bukan autentikasi.
- Batas ukuran body/file dan perilaku saat dokumen JSON lama malformed.
- Retry SHA concurrency yang terbatas dan penanganan konflik.
- Validasi canonical HTTPS Origin dan schema-v1 `config.json`.
- Logging yang tidak membocorkan payload, token, atau data pribadi Guestbook.
- Retensi, moderasi, spam handling, dan kebijakan data pribadi Guestbook.

Rekomendasi ini adalah daftar review, bukan klaim bahwa seluruh kontrol tersebut belum ada. Cocokkan dengan source aktual sebelum membuat backlog baru.

## Prioritas 4 — Rekonsiliasi branch dan PR

- PR #29 adalah jalur review `dev` → `main`; jangan merge otomatis.
- Snapshot branch compare 2026-11-23: `dev` diverged, 74 commits ahead dan 2 behind `main`; `dev` HEAD `9d010b4f10159975d378df10b2b505d584d535a6`, `main` HEAD `e2bc6f41000b756120ac4dc1405dbe9341a89477`. Angka ini bukan status permanen. Jangan sinkronkan/merge `main` ke `dev` tanpa audit konflik dan instruksi yang sesuai.
- Pastikan tested SHA cocok dengan PR head sebelum meminta review final.
- Jangan melakukan force-push atau commit langsung ke `main`.

## Workstream yang ditahan

Admin Dashboard ADM-001..ADM-008 tetap PAUSED sesuai prioritas pemilik. Pertahankan implementasi, evidence, dan blocker yang sudah tercatat; jangan melanjutkannya kecuali diminta.

## Batas verifikasi saat dokumen ini diperbarui

- Public Data API focused tests: OWNER-REPORTED LOCAL PASS, 14/14.
- Syntax checks: OWNER-REPORTED LOCAL PASS, 7 file.
- Exact tested local SHA: NOT PROVIDED.
- Full suite untuk kandidat PUB-DATA, remote integration, live repository write, Worker runtime, dan deployment: NOT VERIFIED.
- Production: tidak disentuh.
