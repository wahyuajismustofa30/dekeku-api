# BACKLOG — DEKEKU API Gateway

*Catatan Acuan*: Rincian progres fitur ada di [PROGRESS.md](PROGRESS.md). Rekomendasi teknis dan kriteria penerimaan ada di [RECOMMENDATIONS.md](RECOMMENDATIONS.md).

## High Priority (Security & Reliability)
- [x] Perbaikan Temuan Kode Write Engine (F-01 s/d F-04) - COMPLETED & VERIFIED.
- [x] Penyesuaian Tes Legacy Core (18/18 PASS in `test/github-core.test.js`) - COMPLETED & VERIFIED.
- [x] **P0 — R-001:** Pembatasan origin Tester Dashboard untuk mencegah pengiriman JWT ke origin eksternal — IMPLEMENTED.
- [x] **P1 — R-004:** Hardening validasi wildcard CORS — IMPLEMENTED.
- [x] **P1 — R-005:** Pemisahan test lokal dan remote Development — IMPLEMENTED.
- [ ] **P1 — R-006:** Verifikasi konfigurasi Cloudflare WAF rate limiting untuk `POST /api/v1/admin/login` (NOT VERIFIED sampai ada bukti runtime).
- [ ] Failed-login Audit Logging (R-007), tanpa merekam secret atau data sensitif.
- [x] **P1 — R-002:** Dashboard Tester mengikuti kontrak respons login `access_token` — IMPLEMENTED.
- [x] **P1 — R-003:** Header JSON dan penanganan submit Guestbook Dashboard — IMPLEMENTED.

## Medium Priority (Features & Refinements)
- [x] Phase 2.3: Guestbook Module (`POST /api/v1/public/submit`) - COMPLETED & VERIFIED (PR #7 MERGED).
- [ ] Integrasi Frontend Statis dengan endpoint publik.
- [ ] JWT Revocation.
- [ ] Reduksi Metadata Public Endpoints.
- [ ] Validasi Tipe Konten File.
- [ ] GitHub Client Retry Logic.

## Low Priority (Maintenance)
- [x] **R-008:** Sinkronisasi dokumentasi test, status fitur, changelog, dan checkpoint berdasarkan laporan hasil tes terbaru; provenance dicatat sebagai laporan pengguna.
- [ ] **R-009:** Dokumentasikan prosedur rotasi secret dan persyaratan password admin.
- [ ] **R-010:** Evaluasi migrasi Personal Access Token ke GitHub App.
- [ ] **R-011:** Evaluasi Workers Analytics Engine untuk metrik agregat.
- [ ] Structured Logging.
- [ ] API Versioning Strategy.

## Status Implementasi R-001 s/d R-005 (2026-11-21)
- Source changes telah diterapkan pada `src/modules/tester/index.js` dan `public/tester.html`.
- Regression test baru ditambahkan pada `test/tester-dashboard.test.js` dan dimasukkan ke script `npm test`.
- Isolated JavaScript harness terhadap Dashboard aktual: PASS untuk same-origin, pemisahan JWT publik/admin, login `access_token`, penanganan 401, JSON Guestbook, dan double-submit.
- CORS isolated harness: PASS untuk exact origin, wildcard subdomain, apex exclusion, dan 9 kelas origin yang ditolak.
- R-005: `npm test` memakai daftar suite lokal eksplisit; `npm run test:remote` terpisah. Global fetch mocks dipulihkan melalui `afterEach`/`finally`.
- `npm run check`: PASS dan `npm test`: 149 PASS, 0 FAIL, 0 SKIP berdasarkan laporan pengguna (21-11-2026, branch `dev`, commit `a6a089d`). Remote test: NOT RUN. Deployment/runtime Development: NOT VERIFIED. R-001 s/d R-005 ditutup pada sisi implementasi; verifikasi runtime tetap terpisah.

## Catatan Status
- Item yang belum dicentang adalah pekerjaan yang belum dinyatakan selesai.
- Persetujuan keputusan arsitektur tidak sama dengan bukti konfigurasi runtime telah diterapkan.
- Jangan menandai item selesai hanya berdasarkan rekomendasi atau dokumentasi; wajib ada bukti implementasi dan tes.
