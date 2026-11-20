# BACKLOG — DEKEKU API Gateway

*Catatan Acuan*: Rincian progres dan temuan aktif tercatat secara terpusat di [PROGRESS.md](PROGRESS.md).

## High Priority (Security & Reliability)
- [x] Perbaikan Temuan Kode Write Engine (F-01 s/d F-04) - COMPLETED & VERIFIED.
- [x] Penyesuaian Tes Legacy Core (18/18 PASS in `test/github-core.test.js`) - COMPLETED & VERIFIED.
- [ ] Rate Limiting berbasis IP (Cloudflare WAF): Mitigasi brute-force pada `/api/v1/admin/login` dan endpoint publik.
- [ ] Failed-login Audit Logging.

## Medium Priority (Features & Refinements)
- [ ] Phase 2.3: Guestbook Module.
- [ ] JWT Revocation.
- [ ] Reduksi Metadata Public Endpoints.
- [ ] Validasi Tipe Konten File.
- [ ] GitHub Client Retry Logic.

## Low Priority (Maintenance)
- [ ] Sinkronisasi Dev & Main Routine.
- [ ] Structured Logging.
- [ ] API Versioning Strategy.
