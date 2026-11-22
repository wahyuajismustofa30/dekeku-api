# Execution Policy & Current Work Queue

Updated: 2026-11-22
Target branch: `dev`
Repository: `wahyuajismustofa30/dekeku-api`
Current status authority: `project/PROGRESS.md`.

## Active scope and ordered work queue
Active scope: public data management in each project's own public GitHub repository.

1. [x] **PUB-001 — Public repository config contract v1.** Complete.
2. [x] **PUB-002 — Schema and trusted Origin enforcement.** Verified.
3. [x] **PUB-003 — Shared resolver for Admin SHA and CRUD.** Verified.
4. [x] **PUB-004 / PUB-004-FIX — Safe public repository browsing.** Verified.
5. [x] **PUB-005 — Tester File Manager implementation.** Verified.
6. [x] **PUB-006 — Development E2E verification.** **COMPLETE & VERIFIED** (live Development Worker curl testing passed all health, auth, project selection, CRUD, SHA conflict, cleanup, and security boundary checks).

## Non-negotiable constraints
- `npm test`: NOT RUN.
- Never deploy or modify Production Worker `github`, domain `api.dekeku.my.id`, Production secrets, variables, or data.
- Do not change Wrangler config, Cloudflare settings, secrets, credentials, accounts, repository mappings, or real website data without explicit authorization.
