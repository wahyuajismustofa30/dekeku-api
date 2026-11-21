# Execution Policy & Current Work Queue

Updated: 2026-11-21
Target branch: `dev`
Repository: `wahyuajismustofa30/dekeku-api`
Baseline inspected: `6f0360e5166595945320a467a1fa2c91722b7401`

## Authority
- `project/PROGRESS.md` is the single source of truth for current project status.
- This file defines the required execution sequence and hard constraints.
- `project/BACKLOG.md` is the detailed task checklist and must agree with PROGRESS.
- `project/RBAC_PLAN.md` retains RBAC architecture, endpoint inventory, acceptance criteria, and implementation records; its current status must agree with PROGRESS and BACKLOG.
- Historical checkpoints and stage notes must not override the latest checkpoint.

## Mandatory execution instructions
1. Synchronize all documentation so there is one authoritative current status and one ordered current work queue.
2. Run syntax/static validation for every RBAC source and test file without running `npm test`. The current `npm run check` script only checks `src/index.js` and is not comprehensive.
3. WAF Development setup/verification is DEFERRED by project owner. Do not configure or verify WAF until the owner explicitly resumes this task.
4. Verify the `assets` data retrieval path returns current data. Requests must use a cache-busting timestamp query parameter (for example `?t=<timestamp>`); do not rely on CDN cache for freshness. Confirm the CDN/cache key honors the query parameter or explicitly bypasses cache. Do not perform a real write unless an isolated Development fixture and explicit safe test target are available.
5. R-013 is APPROVED (D-023): implement immediate User JWT revocation using a backward-compatible per-user token/session version. Keep implementation and verification separate; do not affect Admin JWTs.
6. Update the latest checkpoint only with evidence actually obtained.

## Non-negotiable constraints
- `npm test`: NOT RUN unless the owner explicitly changes this instruction.
- Work only on `dev`; never commit/push to `main`.
- Never deploy or modify Production Worker `github`, Production domain `api.dekeku.my.id`, Production secrets, variables, or data.
- Do not change Wrangler configuration, Cloudflare settings, secrets, credentials, real accounts, repository mappings, or website data without explicit authorization.
- If a required dashboard, runtime, credential, or safe fixture is unavailable, record `NOT VERIFIED` with the exact blocker. Do not infer success from source code or documentation.
- Keep implementation, syntax/static validation, automated tests, Development runtime, WAF, and CDN verification as separate evidence categories.

## Ordered current work queue
1. [x] Record this mandatory execution policy.
2. [x] Reconcile PROGRESS, BACKLOG, ROADMAP, RBAC_PLAN, RECOMMENDATIONS, CHANGELOG, and CHECKPOINT to the approved R-013 decision and current queue.
3. [ ] Syntax/static-check every RBAC source and test file; do not run `npm test`.
4. [DEFERRED] Verify/configure Development WAF for User Login and Guestbook POST only when owner resumes this task.
5. [ ] Verify Guestbook static CDN URL, JSON response, cache headers/freshness, and post-write behavior.
6. [ ] Implement R-013: add per-user token/session version, include it in User JWTs, check it on every authenticated User request, and increment it during successful password reset.
7. [ ] Add focused R-013 regression tests and verify behavior without running npm test; update checkpoint only with actual evidence.

## Baseline evidence
- Branch `dev`, HEAD `6f0360e5166595945320a467a1fa2c91722b7401` before this policy file.
- RBAC source/test files are present in the Git tree.
- `npm run check` only checks `src/index.js`; it is insufficient for all RBAC files.
- `npm test`: NOT RUN by explicit instruction.
- Syntax/static checks of all RBAC files: NOT RUN.
- Development WAF: DEFERRED by owner; no settings changed.
- `assets` cache-busting behavior: NOT VERIFIED; timestamp query parameter is the required request strategy. CDN query-string cache-key behavior still needs evidence.
- Development runtime: NOT VERIFIED.
- Browser dashboard access was unavailable in this execution context; no Cloudflare WAF or CDN setting was read or changed.
