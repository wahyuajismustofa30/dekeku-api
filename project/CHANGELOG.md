# CHANGELOG — DEKEKU API Gateway

## [Unreleased] - 2026-11-19
### Added
- Regression tests for JWT and PBKDF2 (29 cases).
- Constant-time comparison for password verification.
- Comprehensive validation for hash format and iterations.

### Fixed
- JWT: Ensured `iat` and `exp` are finite numbers.
- JWT: Enforced `exp > iat` and maximum 30-minute duration.
- JWT: Added 30-second clock skew tolerance.
- Hash: Added strict length validation for salt (16 bytes) and hash (32 bytes).
- Hash: Improved resilience against malformed input and non-hex characters.

### Changed
- `src/utils/jwt.js`: Tightened claims validation logic.
- `src/utils/hash.js`: Refactored to include strict format checks and constant-time compare.
- `test/auth.test.js`: Expanded to include regression suites.

## [2026-11-19] - Secret Provisioning (Dev)
### Added
- Secure provisioning of `JWT_SECRET` and `ADMIN_PASSWORD_HASH` for `dekeku-api-dev`.
- Utilized Cloudflare Workers Versions API to stage secrets without immediate deployment.
- Generated cryptographically secure admin password for initial development setup.

## [2026-11-19] - Admin Password Rotation (Dev)
### Changed
- Rotated `ADMIN_PASSWORD_HASH` for `dekeku-api-dev` after initial password exposure.
- New password generated internally (48 chars hex) and hashed with fresh salt.
- Provisioned via Versions API (staged).
