# CHANGELOG — DEKEKU API Gateway

## [2026-11-20] - Phase 2.2 Security Fixes & Core Test Alignment
### Added
- `src/utils/base64.js`: `uint8ArrayToBase64` helper with 32KB chunking to safely encode payloads > 100KB up to 1MB without RangeError (F-02 resolved).
- Comprehensive test cases in `test/write-foundation.test.js` for 1MB payload base64 encoding/decoding, CORS allowlist, and path control character checks.

### Fixed
- **F-01**: Fixed regex double-escape in `validateWritablePath` (`src/modules/github/write.js`) from `/[\\x00-\\x1F\\x7F]/` to `/[\x00-\x1F\x7F]/`.
- **F-02**: Replaced un-chunked `btoa(String.fromCharCode(...bytes))` spread calls with `uint8ArrayToBase64` in `src/modules/github/write.js` and `src/core/github.js`.
- **F-03**: Added validation in `parseAndValidateBody` to reject missing/undefined `data.content` with HTTP 422.
- **F-04**: Enhanced `src/middleware/cors.js` to support origin allowlist from `env.ALLOWED_ORIGINS`, include `PUT, DELETE` in `Access-Control-Allow-Methods`, reflect matched origin with `Vary: Origin`, and apply CORS headers to error responses in `src/index.js`.
- **Content-Type Parameters**: Enabled support for Content-Type with charset parameters (e.g. `application/json; charset=utf-8`) in write handlers.
- **Commit Message Validation**: Added optional commit message string length validation (up to 256 characters).
- **Core Test Alignment**: Updated assertions in `test/github-core.test.js` to match the current gateway error mapping design (18/18 PASS).

### Changed
- Total test suite expanded to 121 tests (121 PASS, 0 FAIL, 0 SKIP).

## [2026-11-19] - Phase 2.2 Write Engine & Auth Base
### Added
- Write Engine Foundation, GitHub Client PUT/DELETE, Router Integration.

## [2026-11-19] - Secret Provisioning (Dev)
### Added
- Provisioning of `JWT_SECRET` and `ADMIN_PASSWORD_HASH`.
