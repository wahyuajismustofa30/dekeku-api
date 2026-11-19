# BACKLOG — DEKEKU API Gateway

## High Priority (Security & Reliability)
- [ ] Login Rate Limiting: Mitigasi serangan brute-force pada endpoint admin login.
- [ ] Account Lockout: Memblokir username setelah X kali percobaan gagal.
- [ ] Failed-login Audit Logging: Mencatat metadata kegagalan login untuk analisis keamanan.
- [ ] GitHub Client Retry Logic: Implementasi exponential backoff untuk transient errors.

## Medium Priority (Features)
- [ ] JWT Revocation: Mekanisme blacklist/whitelist untuk membatalkan token aktif.
- [ ] Phase 2.2: Write Engine - Implementasi penulisan file ke GitHub.
- [ ] Phase 2.3: Guestbook Module - Public submission API.

## Low Priority (Maintenance)
- [ ] Structured Logging: Peningkatan log format untuk Cloudflare Logs.
- [ ] API Versioning Strategy: Dokumentasi untuk migrasi v1 ke v2.
