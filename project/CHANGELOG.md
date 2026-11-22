# Changelog

> Entri terbaru berada di bagian paling atas. Older entries below are historical records and must not be read as the current status when superseded by a newer dated entry.

## 2026-11-23 — Public Data API owner-reported Termux validation and documentation reconciliation

- Owner reports `node --test test/public-submission.test.js`: 14 PASS, 0 FAIL, 0 cancelled, 0 skipped, 0 todo.
- Owner reports `node --check` passed for 7 changed source files: router, public module/registry/validators/storage/legacy alias, and GitHub repositories resolver.
- Evidence is local Termux evidence. Exact tested local HEAD SHA was not supplied; it is not conclusively tied to GitHub `dev` HEAD or PR #29 head.
- No remote integration test, live project repository write, Worker runtime smoke test, full-suite rerun, or deployment is claimed.
- PR #29 (`dev` → `main`) remains unmerged; merge/deployment not authorized. Admin Dashboard remains PAUSED; Production untouched.


## 2026-11-23 — Admin Dashboard implementation (ADM-001..ADM-007)

### Added
- AES-256-GCM encrypted dashboard metadata envelope and private storage adapter for `dekeku-db`.
- Paginated discovery of public repositories belonging to configured `GITHUB_OWNER`.
- Repository inspection for `config.json`, `CNAME`, and `assets/data`.
- Admin Dashboard page at `/admin` with login, table/card views, search, filters, project details, project navigation, quick actions, selection, export, and bulk project-type updates.
- Durable Object refresh coordinator with latest-only job state, progress, cancellation, and failed-item retry.
- Development-only Durable Object binding and migration in `wrangler.jsonc`.

### Policy and verification
- Owner instructed that implementation ADM-001..ADM-007 must finish before tests are run; final tests and runtime checks are deferred to ADM-008.
- Source/config changes are IMPLEMENTED — NOT TESTED. Wrangler validation and Development runtime are NOT VERIFIED.
- Availability of the `DB_ENCRYPTION_KEY` Development secret was NOT VERIFIED in this session.
- Production resources were not touched; no PR, merge, or deployment was performed.
### Verification preparation
- Added Dashboard test suites for crypto, encrypted storage, repository discovery/inspection, refresh lifecycle, route authorization, and metadata API integration.
- Added focused PR validation mappings and `project/ADM-008_TEST_PLAN.md`.
- Tests and Wrangler dry-run remain NOT RUN by owner-directed sequencing; Development secret inventory/runtime remain NOT VERIFIED.

## 2026-11-23 — ADM-008 automated test rerun
- Owner ran `npm ci`: completed successfully; npm audit reported 0 vulnerabilities.
- Owner reran `npm test` after the two test-only fixes: 261 PASS, 0 FAIL, 0 SKIP across 44 suites (10.819 seconds).
- Recorded as OWNER-REPORTED PASS; exact tested HEAD SHA and Node.js version were not included in the supplied terminal output.
- Remaining: confirm full Wrangler dry-run target/migration output and Development secret names; runtime smoke test requires separate deployment approval.
- No secret write/rotation, PR, merge, or deployment performed. Production untouched.


## 2026-11-23 — Public Data API approved and prioritized (D-030)

### Added
- Approved extensible public submission pattern `POST /api/v1/public/data/{resource}`.
- Planned server-side Resource Registry, resource-specific validators, shared Project Origin resolver, and shared storage engine.
- Guestbook selected as first resource; legacy `POST /api/v1/public/submit` retained as a temporary alias.
- Added `project/PUBLIC_DATA_API_PLAN.md` with seven work items and acceptance criteria.

### Priority
- Public Data API PUB-DATA-001..007 is now the active priority.
- Admin Dashboard ADM-001..ADM-008 is paused temporarily; existing implementation and records are preserved.
- Planning/documentation only. No Public Data API implementation, tests, PR, merge, deployment, Cloudflare configuration, or Production changes are claimed.


## 2026-11-23 — Public Data API implementation on dev

### Added
- Server-side Public Resource Registry and Guestbook payload validator.
- Shared public storage engine with bounded UTF-8/JSON body parsing, Project Origin resolver, public repository validation, fixed storage path, SHA concurrency, and bounded retry.
- Generic route `POST /api/v1/public/data/{resource}`.
- Legacy `POST /api/v1/public/submit` now delegates to the same Guestbook handler.
- Updated Public Data API, Usage, and Guestbook integration documentation.

### Validation boundary
- Updated focused Guestbook/Public Data API test cases; **NOT RUN** in this GitHub-only phase.
- Syntax/build, full local test suite, Wrangler dry-run, and runtime are NOT VERIFIED for these changes.
- Next required step: local Termux validation. No PR, merge, deployment, Cloudflare configuration/secret change, or Production access.
