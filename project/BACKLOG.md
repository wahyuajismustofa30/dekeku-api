# BACKLOG — DEKEKU API Gateway

*Catatan Acuan*: Rincian progres fitur ada di [PROGRESS.md](PROGRESS.md). Rekomendasi teknis dan kriteria penerimaan ada di [RECOMMENDATIONS.md](RECOMMENDATIONS.md).

## High Priority (Security & Reliability)
- [x] Perbaikan Temuan Kode Write Engine (F-01 s/d F-04) - COMPLETED & VERIFIED.
- [x] Penyesuaian Tes Legacy Core (18/18 PASS in `test/github-core.test.js`) - COMPLETED & VERIFIED.
- [ ] **P0 — R-001:** Batasi origin tujuan request administratif Tester Dashboard agar JWT tidak dapat dikirim ke origin eksternal.
- [ ] **P1 — R-004:** Audit dan hardening validasi wildcard CORS, termasuk batas hostname, protokol, port, dan preflight.
- [ ] **P1 — R-005:** Pisahkan test lokal dari remote Development test; pastikan default test tidak menulis ke Worker aktif.
- [ ] **P1 — R-006:** Verifikasi konfigurasi Cloudflare WAF rate limiting untuk `POST /api/v1/admin/login` (NOT VERIFIED sampai ada bukti runtime).
- [ ] Failed-login Audit Logging (R-007), tanpa merekam secret atau data sensitif.
- [ ] **P1 — R-002:** Samakan Dashboard Tester dengan kontrak respons login `access_token`.
- [ ] **P1 — R-003:** Tambahkan header JSON dan penanganan submit yang benar pada Guestbook Dashboard.

## Medium Priority (Features & Refinements)
- [x] Phase 2.3: Guestbook Module (`POST /api/v1/public/submit`) - COMPLETED & VERIFIED (PR #7 MERGED).
- [ ] Integrasi Frontend Statis dengan endpoint publik.
- [ ] JWT Revocation.
- [ ] Reduksi Metadata Public Endpoints.
- [ ] Validasi Tipe Konten File.
- [ ] GitHub Client Retry Logic.

## Low Priority (Maintenance)
- [ ] **R-008:** Sinkronisasi dokumentasi test, status fitur, changelog, dan checkpoint berdasarkan bukti aktual.
- [ ] **R-009:** Dokumentasikan prosedur rotasi secret dan persyaratan password admin.
- [ ] **R-010:** Evaluasi migrasi Personal Access Token ke GitHub App.
- [ ] **R-011:** Evaluasi Workers Analytics Engine untuk metrik agregat.
- [ ] Structured Logging.
- [ ] API Versioning Strategy.

## Status Implementasi R-001 s/d R-003 (2026-11-21)
- Source changes telah diterapkan pada `src/modules/tester/index.js` dan `public/tester.html`.
- Regression test baru ditambahkan pada `test/tester-dashboard.test.js` dan dimasukkan ke script `npm test`.
- Isolated JavaScript harness terhadap script aktual: PASS untuk same-origin, pemisahan JWT publik/admin, login `access_token`, penanganan 401, JSON Guestbook, dan double-submit.
- Node test suite (`npm test`): NOT RUN. Deployment Development: NOT VERIFIED. Item backlog tetap terbuka sampai test suite aktual dijalankan.

## Catatan Status
- Item yang belum dicentang adalah pekerjaan yang belum dinyatakan selesai.
- Persetujuan keputusan arsitektur tidak sama dengan bukti konfigurasi runtime telah diterapkan.
- Jangan menandai item selesai hanya berdasarkan rekomendasi atau dokumentasi; wajib ada bukti implementasi dan tes.
