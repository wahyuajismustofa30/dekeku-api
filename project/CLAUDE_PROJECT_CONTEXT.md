# DEKEKU API Gateway - Project Context for Claude

## A. Project Overview
- **Identitas**: DEKEKU API Gateway, layanan API terpusat berbasis Cloudflare Workers.
- **Tujuan**: Memusatkan logika akses data dan pengelolaan file. Bertindak sebagai perantara aman antara klien dan repositori GitHub privat.
- **Masalah**: Membutuhkan satu API untuk banyak aplikasi DEKEKU, penyimpanan aman, abstraksi GitHub API, dan perlindungan kredensial.
- **Fungsi**: REST API (JSON) untuk akses data (READ) dan pengelolaan file (WRITE/CREATE/UPDATE/DELETE).
- **Batasan**: Hanya untuk ekosistem DEKEKU, file maksimal 1MB, JSON only di `public/data/`.

## B. System Architecture
- **Runtime**: Cloudflare Workers.
- **Storage**: GitHub Private Repository.
- **Request Flow**: Klien -> Cloudflare Worker -> GitHub API (via `GitHubClient`) -> Response.
- **Responsibility**:
    - `src/core`: Routing, Error handling, GitHub Client abstraction.
    - `src/middleware`: Auth, CORS.
    - `src/modules`: Feature logic (Health, GitHub, Auth).

## C. Repository Structure
- `src/core`: Core application logic (`router.js`, `github.js`, `errors.js`).
- `src/middleware`: Request/Response interceptors (`auth.js`, `cors.js`).
- `src/modules`: Feature-specific logic (`health`, `github`, `auth`).
- `src/utils`: Helpers (`response.js`, `jwt.js`, `hash.js`).
- `test`: Test suite.
- `project`: Project management docs (MASTER.md, ROADMAP.md, etc.).

## D. Technology Stack
- **Language**: JavaScript (ES modules).
- **Runtime**: Cloudflare Workers.
- **Tooling**: Wrangler.
- **Authentication**: JWT (HS256).
- **Password**: PBKDF2-SHA256 (Web Crypto).
- **GitHub Interop**: GitHub Contents API.

## E. API Documentation
### Public (No Auth)
- `GET /api/v1/health`
- `GET /api/v1/github/repository`
- `GET /api/v1/github/branch`
- `GET /api/v1/github/file?path=...` (public/ directory)
- `POST /api/v1/admin/login` (Returns JWT)

### Protected (Requires Admin JWT)
- `POST /api/v1/admin/write/create`
- `PUT /api/v1/admin/write/update` (requires SHA)
- `DELETE /api/v1/admin/write/delete` (requires SHA)

## F. Authentication & Security
- **Admin Login**: PBKDF2 verification, constant-time comparison.
- **JWT**: HS256, strictly validated (iat, exp, signature, issuer).
- **Middleware**: `authMiddleware` validates JWT.
- **Path Traversal**: Protected (path validation).
- **File Constraints**: Max 1MB, JSON only, `public/data/` write limit.

## G. GitHub Integration
- **Client**: `src/core/github.js`.
- **Operations**: READ, WRITE (PUT), DELETE.
- **SHA**: Required for PUT/DELETE to ensure concurrency control.
- **Timeout**: Managed by resilient client logic.

## H. Write Engine
- **Operations**: Create, Update, Delete.
- **Validation**: JSON format, File Size, Path restriction.
- **Concurrency**: Optimistic locking using SHA.
- **Error Handling**: Custom error mapping.

## I. Environment Architecture
- **Development**: `dekeku-api-dev` (Worker).
- **Production**: `github` (Worker, `api.dekeku.my.id`).

## J. Current Implementation Status

| Feature | Status | Evidence | Remaining Issues |
| :--- | :--- | :--- | :--- |
| Core Router | COMPLETED | Test Suite | None |
| GitHub Client (Read) | COMPLETED | Test Suite | Legacy tests fail |
| Write Engine (Stages 1-3) | COMPLETED | Test Suite | None |
| JWT Authentication | COMPLETED | Test Suite | Rate limiting, Revocation |
| PBKDF2 Password Hashing| COMPLETED | Test Suite | None |

## K. Architecture Decisions
- **D-001**: Public GET access.
- **D-002**: GitHub Private repo.
- **D-003**: GitHub Secrets (Workers Secrets).
- **D-005**: JWT for write access.
- **D-009**: Production protection (No unauthorized changes).

## L. Known Issues & Technical Risks
- Rate limiting (Missing).
- Token revocation (Missing).
- Legacy GitHub Core tests (9/18 failure due to new error mapping).

## M. Next Development Steps
- Phase 2.3: Public Submission & Guestbook.

## CLAUDE INDEPENDENT REVIEW GUIDELINES
1. Act as an independent senior software engineer and security reviewer.
2. Review the context and *actual* source code, not just this document.
3. Critically analyze logic, security vulnerabilities, and design.
4. Do *not* assume tests passed = 100% secure.
5. Do *not* modify source code, configs, or deploy.
6. Provide findings based on evidence with the following format:
   - Review Summary
   - Findings (ID, Severity, File:Line, Finding, Impact)
   - Security Review
   - Logic & Architecture Review
   - Test Coverage Review
   - Recommended Fixes
   - Final Verdict (APPROVED, APPROVED WITH CONDITIONS, CHANGES REQUIRED, BLOCKED)
