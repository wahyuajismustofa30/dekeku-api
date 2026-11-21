# RECOMMENDATIONS — DEKEKU API Gateway

Tanggal pencatatan: 2026-11-21

Dokumen ini menyimpan rekomendasi hasil review repository dan dashboard Tester. Status tiap rekomendasi dibedakan antara implementasi kode, pengujian lokal, dan verifikasi runtime. R-001 s/d R-005 telah diimplementasikan; suite lokal 149 PASS dan `npm run check` PASS berdasarkan laporan pengguna pada 2026-11-21 (branch `dev`, commit `a6a089d`). Hasil tersebut belum diverifikasi ulang secara independen dalam sesi dokumentasi ini. Rekomendasi yang memerlukan bukti konfigurasi/runtime tetap berstatus NOT VERIFIED.

## Prioritas P0 — Keamanan Dashboard Tester

### R-001. Batasi tujuan pengiriman JWT dari Tester Dashboard
- **Temuan review**: Dashboard menerima `baseUrl` yang dapat diubah pengguna dan mengirim JWT pada request administratif. Jika tujuan tidak dibatasi, token berpotensi terkirim ke origin eksternal.
- **Rekomendasi**:
  1. Terapkan allowlist origin API yang eksplisit; jangan mengandalkan input bebas sebagai tujuan request admin.
  2. Wajibkan HTTPS untuk origin remote dan validasi URL dengan parser URL bawaan.
  3. Tolak URL yang memuat username/password, origin yang tidak dikenal, skema selain HTTPS, dan perubahan host yang tidak disetujui.
  4. Pisahkan helper request publik dan administratif. Hanya helper administratif yang boleh menambahkan header Authorization, dan hanya untuk origin Development yang disetujui.
  5. Hapus token dari state ketika origin berubah, saat logout, atau ketika server mengembalikan 401. Hindari penyimpanan token di localStorage; gunakan state sesi sementara jika memungkinkan.
  6. Jangan pernah menulis JWT atau kredensial ke console maupun pesan error.
- **Tes penerimaan**: origin eksternal, HTTP, URL dengan credentials, deceptive hostname/suffix, perubahan base URL, logout, respons 401, dan request publik tidak boleh membawa JWT.
- **Prioritas**: P0 — selesaikan sebelum Dashboard Tester digunakan untuk operasi admin.
- **Status (2026-11-21)**: IMPLEMENTED pada kedua salinan Dashboard. API origin dikunci ke `window.location.origin`, remote wajib HTTPS, redirect ditolak, helper publik/admin dipisah, JWT hanya berada di memori sesi, token lama di `localStorage` dibersihkan saat pemuatan, dan sesi dibersihkan pada 401/logout. Perilaku inti diuji dengan isolated JavaScript harness; suite lokal `npm test` 149 PASS berdasarkan laporan pengguna; deployment/runtime NOT VERIFIED.

## Prioritas P1 — Fungsionalitas Dashboard

### R-002. Samakan kontrak token login
- **Temuan review**: Dashboard mencari properti `token`, sedangkan kontrak respons login API menggunakan `access_token`.
- **Rekomendasi**: Gunakan `access_token` sesuai kontrak API; validasi respons sukses dan token non-empty sebelum menyimpan sesi. Tampilkan error yang aman untuk respons invalid, 4xx/5xx, dan kegagalan jaringan.
- **Tes penerimaan**: login sukses, password salah, respons tanpa token, JSON malformed, HTTP 500, dan network failure.
- **Status (2026-11-21)**: IMPLEMENTED — Dashboard memakai `access_token`, memvalidasi token non-empty, mengosongkan password field, dan meredaksi token pada log. Pengujian perilaku login sukses dan sesi dilakukan dengan isolated JavaScript harness; suite lokal 149 PASS berdasarkan laporan pengguna. Kasus server error/network tetap bergantung pada cakupan regression suite dan tidak diklaim terverifikasi terpisah di sini.

### R-003. Lengkapi header Guestbook Dashboard
- **Temuan review**: Request Guestbook dari dashboard tidak menyertakan `Content-Type: application/json`, sedangkan endpoint mengharuskan JSON.
- **Rekomendasi**: Kirim `Content-Type: application/json` dan `Accept: application/json`; validasi input di UI tanpa menggantikan validasi backend; cegah submit ganda; reset form hanya setelah respons sukses terkonfirmasi.
- **Tes penerimaan**: payload valid, input kosong/tidak valid, server menolak payload, network failure, dan double-submit.
- **Status (2026-11-21)**: IMPLEMENTED — Header JSON/Accept, validasi input, guard double-submit, tombol disabled selama request, dan reset hanya pada HTTP 201 dengan `success: true`. Skenario sukses dan double-submit diuji dengan isolated JavaScript harness; suite lokal 149 PASS berdasarkan laporan pengguna.

## Prioritas P1 — CORS dan Pengujian

### R-004. Perketat validasi wildcard CORS
- **Temuan review**: Pemeriksaan wildcard perlu memastikan batas hostname dan protokol, bukan sekadar pencocokan suffix.
- **Rekomendasi**:
  1. Pertahankan kebijakan deny-by-default.
  2. Parse origin sebagai URL dan validasi protocol, hostname, port, serta format origin.
  3. Wildcard hanya mengizinkan subdomain yang benar-benar berada di bawah domain yang dikonfigurasi; tentukan secara eksplisit apakah root domain ikut diizinkan.
  4. Tolak HTTP jika kebijakan hanya mengizinkan HTTPS, serta tolak deceptive suffix seperti `evil-dekeku.my.id` dan `dekeku.my.id.evil.com`.
  5. Pastikan preflight dan respons error mengikuti kebijakan yang sama.
- **Tes penerimaan**: exact origin, subdomain valid, root domain, deceptive suffix, HTTP/HTTPS, port, malformed origin, dan preflight.
- **Status (2026-11-21)**: IMPLEMENTED — origin diparse dengan URL parser, hanya HTTPS default-port, menolak credentials/path/query/fragment/malformed origin, wildcard hanya menerima subdomain (apex harus di-allowlist secara eksplisit), dan `Vary: Origin` diberikan pada seluruh respons dengan Origin. Regression tests ditambahkan; isolated harness PASS untuk exact/subdomain dan 9 kelas origin yang ditolak; suite lokal 149 PASS berdasarkan laporan pengguna.

### R-005. Pisahkan test lokal dan test remote
- **Temuan review**: Panduan `docs/USAGE.md` menggunakan pola `node --test test/*.test.js` yang berisiko menyertakan `test/live-remote.test.js`. Tes remote dapat menulis data ke Development Worker aktif.
- **Rekomendasi**:
  1. Pastikan perintah tes default hanya menjalankan unit/integration test lokal yang terisolasi.
  2. Sediakan perintah eksplisit terpisah untuk remote Development test dan beri peringatan bahwa tes dapat menulis data.
  3. Jangan pernah menjalankan remote test sebagai bagian dari perintah default atau CI lokal tanpa persetujuan yang sesuai.
  4. Pastikan mock global seperti `global.fetch` dipulihkan dalam blok `finally`.
  5. Gunakan fixture dan data uji yang tidak memuat secret.
- **Tes penerimaan**: verifikasi daftar file yang dijalankan oleh setiap script, pastikan test default tidak mengakses Worker, dan pastikan remote test hanya berjalan melalui perintah eksplisit.
- **Status (2026-11-21)**: IMPLEMENTED — `npm test` mencantumkan suite lokal secara eksplisit dan mengecualikan `test/live-remote.test.js`; `npm run test:remote` menjadi pemicu eksplisit untuk remote Development tests. `github-core`, `security-edge-cases`, dan `live-remote` memulihkan global fetch melalui `afterEach`; simulasi live-remote juga memakai `try/finally`. `npm run check` PASS dan suite lokal `npm test` 149 PASS berdasarkan laporan pengguna. Remote tests tidak dijalankan.

## Prioritas P1/P2 — Proteksi Abuse dan Observabilitas

### R-006. Verifikasi penerapan Cloudflare WAF Rate Limiting
- **Dasar keputusan**: D-013 menyetujui rate limiting berbasis IP melalui Cloudflare WAF untuk mitigasi brute-force login.
- **Rekomendasi**: Verifikasi konfigurasi aktual untuk `POST /api/v1/admin/login` dan `POST /api/v1/user/login`, scope hostname/environment, threshold, window, action, dan response. Guestbook abuse protection untuk `POST /api/v1/public/submit` dicatat terpisah pada R-012. Mulai dari Development; jangan mengubah Production tanpa persetujuan eksplisit.
- **Tes penerimaan**: request normal, percobaan gagal berulang dari IP yang sama, IP berbeda, masa cooldown, dan bukti rule aktif.
- **Status**: NOT VERIFIED — keputusan telah disetujui, tetapi konfigurasi runtime belum dibuktikan dalam review ini.

### R-007. Tambahkan failed-login audit logging yang aman
- Catat metadata minimum untuk investigasi (waktu, hasil, request ID, dan identitas jaringan yang telah diminimalkan sesuai kebutuhan).
- Jangan mencatat password, JWT, Authorization header, hash, atau secret.
- Tentukan retensi dan akses log sebelum implementasi.
- **Status (2026-11-21)**: NOT IMPLEMENTED — perlu keputusan pemilik proyek mengenai retensi, siapa yang boleh mengakses log, dan metadata jaringan yang boleh dicatat. Tidak ada login event atau data pribadi baru yang ditambahkan ke log.

## Prioritas P2 — Pemeliharaan dan Evolusi Infrastruktur

### R-008. Sinkronisasi dokumentasi pengujian dan status
- Samakan jumlah tes, tanggal, status fase, backlog, changelog, dan checkpoint berdasarkan output aktual.
- Gunakan status `VERIFIED`, `NOT VERIFIED`, `FAILED`, `NEEDS INVESTIGATION`, dan `NOT RUN` secara konsisten.
- Jangan mengklaim 140/140 PASS tanpa command, environment, commit, exit code, dan output yang dapat diperiksa.
- Perbaiki panduan `docs/USAGE.md` agar tidak mendorong eksekusi tes remote secara tidak sengaja.
- **Status (2026-11-21)**: COMPLETED — README/USAGE memakai script lokal eksplisit dan memisahkan remote test; PROGRESS, CHECKPOINT, BACKLOG, ROADMAP, dan CHANGELOG diselaraskan dengan hasil `npm run check` PASS serta `npm test` 149 PASS berdasarkan laporan pengguna (branch `dev`, commit `a6a089d`). Provenance hasil tes dicatat secara eksplisit.

### R-009. Tinjau rotasi secret dan kekuatan password admin
- Pertahankan password admin dengan entropi tinggi dan penyimpanan hash PBKDF2 sesuai kebijakan implementasi.
- Susun prosedur rotasi `JWT_SECRET` dan dampak invalidasi token sebelum menetapkan jadwal rotasi.
- Jangan melakukan rotasi secret tanpa instruksi eksplisit dan rencana pemulihan.

### R-010. Evaluasi GitHub App
- Evaluasi migrasi dari Personal Access Token ke GitHub App untuk membatasi permission dan masa berlaku kredensial.
- Lakukan sebagai pekerjaan infrastruktur terpisah setelah kebutuhan permission dan dampak operasional dipetakan.

### R-011. Evaluasi Workers Analytics Engine
- Pertimbangkan metrik agregat untuk latency, error rate, dan volume request.
- Hindari mengirim data pribadi, payload, token, atau kredensial ke analytics.

## Urutan Eksekusi yang Disarankan
1. R-001 — keamanan pengiriman JWT pada Tester Dashboard.
2. R-002 dan R-003 — perbaikan kontrak login dan request Guestbook.
3. R-004 — hardening CORS dan regression tests.
4. R-005 — isolasi test lokal dan remote serta pembaruan panduan.
5. R-006 dan R-007 — verifikasi WAF dan audit logging.
6. R-009 sampai R-011 — pekerjaan pemeliharaan/evolusi berikutnya.

R-008 telah diselesaikan sebagai sinkronisasi dokumentasi pada 2026-11-21.

## Batasan Pelaksanaan
- Rekomendasi bukan izin otomatis untuk mengubah source code, konfigurasi Cloudflare, secrets, atau melakukan deployment.
- Semua implementasi dilakukan pada branch `dev` dan mengikuti alur PR yang tercatat pada D-011.
- Worker Production `github` dan domain `api.dekeku.my.id` tidak boleh diubah tanpa persetujuan eksplisit.
- Setiap rekomendasi harus ditutup dengan bukti implementasi dan pengujian; jika belum ada bukti, status tetap NOT VERIFIED atau NOT RUN.


## R-012. Guestbook submission abuse protection
- **Temuan**: Origin allowlisting and repository mapping prevent arbitrary destination selection, but Origin is not authentication and can be forged by non-browser clients. The Worker currently has no application-level per-IP/per-Origin Guestbook rate limiter.
- **Rekomendasi**: Configure and verify Cloudflare WAF/IP rate limiting for `POST /api/v1/public/submit` in Development. Select threshold/window based on expected legitimate traffic and monitor false positives. Do not change Production without explicit approval.
- **Tes penerimaan**: valid submission below threshold, repeated submissions from one IP, independent IP behavior, cooldown/reset, and evidence of the active Development rule.
- **Status**: OPEN — configuration/runtime NOT VERIFIED. This is a required abuse-protection follow-up before public exposure.


## R-013. Immediate User JWT revocation after password reset
- **Temuan**: sebelum keputusan D-023, Admin password reset tidak membatalkan JWT User yang telah diterbitkan; token dapat tetap berlaku hingga sisa masa berlaku maksimal 30 menit.
- **Risiko**: token yang disalin sebelum reset dapat tetap mengakses repository milik User selama sisa masa berlaku.
- **Keputusan pemilik**: APPROVED (D-023, 2026-11-21). Semua JWT User yang diterbitkan sebelum reset password harus langsung ditolak. Implementasi menggunakan token/session version server-side; rincian dan acceptance criteria ada pada bagian keputusan R-013 di bawah.
- **Status**: keputusan APPROVED; source implementation using per-user tokenVersion and focused regression tests have been added on dev. Limited V8 parser check PASS 13/13 after stripping module declarations; native node --check, test execution, and Development runtime verification remain pending. The currently deployed Worker has not been updated.


## R-013 — Immediate User JWT Revocation After Password Reset (Decision 2026-11-21)
- **Owner decision: APPROVED**. Every User JWT issued before a successful Admin password reset must become invalid immediately; the User must log in again using the new password.
- **Implementation direction**: add a backward-compatible per-user token/session version in the private User record; include the current version in newly issued User JWTs; compare the claim with the authoritative private record on every authenticated User request; increment the version during successful password reset using SHA-safe concurrency handling.
- **Scope**: User JWTs only. Admin JWTs are not revoked by this decision.
- **Acceptance criteria**: old User JWT rejected immediately after reset; new password can log in and receive a valid token; existing records remain compatible; concurrent SHA conflicts are handled safely; Admin JWTs remain unaffected.
- **Status**: DECISION APPROVED (D-023); source implementation ADDED on dev, NOT VERIFIED. Until Development deployment and runtime verification, the currently deployed Worker may still allow old tokens for their remaining lifetime (up to 30 minutes).
- This decision authorizes the R-013 implementation on dev; it does not authorize deployment or any Production changes.
