# CHANGELOG — DEKEKU API Gateway

## [Unreleased] - 2026-11-20
### Documented Issues (Awaiting Fix)
- Menganalisis dan mendokumentasikan temuan review dokumentasi (F-01 s.d F-04) serta audit kebijakan CORS yang sedang berlangsung.
  - F-01: Regex karakter kontrol double-escape di `validateWritablePath`.
  - F-02: `btoa(String.fromCharCode(...bytes))` RangeError pada file > 100KB.
  - F-03: `parseAndValidateBody` belum menolak `content` yang tidak ada.
  - F-04: CORS middleware belum mendukung allowlist origin dan header CORS pada logical catch error.

## [2026-11-19] - Phase 2.2 Write Engine & Auth Base
*(Catatan 2026-11-20: Hasil tes aktual per 2026-11-20: 103 PASS dari 112 tes total, 9 tes legacy di github-core.test.js gagal karena ekspektasi error mapping yang belum diselaraskan.)*

### Added
- **Write Engine Foundation**: Streaming HTTP request body, JSON structure validation (Object/Array root only), file size validation (1MB limit).
- **GitHub Client PUT/DELETE Operations**: Optimistic concurrency via SHA, error mapping per design (401/403/500→502, timeout→504, etc).
- **Router Integration**: Endpoints CRUD JSON files di bawah authMiddleware.
- **Test Suites**: 12 foundation tests, 34 write client tests, 22 router integration tests, 29 login/auth regression tests.

### Fixed
- JWT: Enforced finite `iat`/`exp`, stricter validation, 30-second clock skew.
- Hash: Added strict format comparison for PBKDF2-SHA256.
- Path Validation: SQL injection & traversal protection.

### Changed
- Updated source modules: `github.js`, `write.js`, `router.js`, `auth.js`.
- Added new test files: `write-foundation.test.js`, `github-write.test.js`, `write-router.test.js`.
- Updated changelog with accurate test numbers.

## [2026-11-19] - Secret Provisioning (Dev)
### Added
- Secure provisioning of `JWT_SECRET` and `ADMIN_PASSWORD_HASH` via Cloudflare Versions API.
- Generated cryptographically secure admin password.

## [2026-11-19] - Admin Password Rotation (Dev)
### Changed
- Rotated `ADMIN_PASSWORD_HASH` for `dekeku-api-dev` after initial exposure.
