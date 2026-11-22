# CHANGELOG — DEKEKU API Gateway

## 2026-11-23 — PUB-006 CRUD Evidence Completion & Arto Printing Investigation
### Added / Verified
- Completed live Development Worker E2E CRUD verification for PUB-006 using approved test fixture `public/data/__dekeku_pub006_e2e_fixture.json` on repository `wahyuajismustofa30/demo` (Origin `https://demo.dekeku.my.id`).
- Verified all lifecycle stages with complete SHA records and HTTP statuses: CREATE (200, SHA `0c86152679a76bbb6c84ea34251cff73e8945681`), READ (200, matching SHA), UPDATE (200, SHA `de8389086a32c6a8cdeb494ee53af065eca98db1`), STALE SHA CONFLICT (409 Conflict, file unchanged), DELETE (200, SHA `4f6a86c31b3fe43e1ab9fabce687eb6750e9f3bf`), and CLEANUP VERIFICATION (404 Not Found).
- Completed read-only investigation of `artoprintingpbg.com`: `https://artoprintingpbg.com/config.json` returns 301 Moved Permanently to `https://www.artoprintingpbg.com/config.json`, which returns HTTP 404 Not Found because `config.json` is missing in that repository/branch.
- Reconciled documentation across `PROGRESS.md`, `CHECKPOINT.md`, `ROADMAP.md`, and `BACKLOG.md`.
### Scope / Safety
- No code changes, no Wrangler config changes, no secrets/variables changed, no production resources touched, and `npm test` not run.

## 2026-11-22 — Documentation reconciliation after PR #26
### Updated
- Reconciled PROGRESS, ROADMAP, BACKLOG, CHECKPOINT, RECOMMENDATIONS, EXECUTION_POLICY, public repository contract, usage guide, and architecture decision status.
- Recorded PUB-005 implementation and owner-reported focused regression result.
- Recorded PR #26 merge and remote branch equality.
- Set PUB-006 Development E2E as the next active gate.

## [Unreleased] — 2026-11-22
### Added — PUB-005 Project-aware JSON File Manager
- Added exact-allowlist-validated X-DEKEKU-Project-Origin selector for the first-party Tester.
- Added Admin-authenticated GET /api/v1/admin/write/file to read parsed JSON, size, and SHA from selected project repositories under public/data/.
