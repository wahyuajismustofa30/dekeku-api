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
3. Verify Cloudflare WAF/IP rate-limiting behavior in Development for `POST /api/v1/user/login` and `POST /api/v1/public/submit` (Guestbook).
4. Verify Guestbook static CDN integration and cache behavior after a successful submission, including cache freshness/invalidation and correct JSON payload. Do not perform a real write unless an isolated Development fixture and explicit safe test target are available.
5. Evaluate immediate JWT revocation after password reset (R-013), document recommendation and decision status, and do not implement schema/code changes without an approved decision.
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
2. [ ] Reconcile PROGRESS, BACKLOG, ROADMAP, RBAC_PLAN, RECOMMENDATIONS, CHANGELOG, and CHECKPOINT to one current status and queue.
3. [ ] Syntax/static-check every RBAC source and test file; do not run `npm test`.
4. [ ] Verify Development WAF for User Login and Guestbook POST.
5. [ ] Verify Guestbook static CDN URL, JSON response, cache headers/freshness, and post-write behavior.
6. [ ] Resolve R-013: adopt or reject immediate User JWT revocation after password reset.
7. [ ] Update the latest checkpoint based only on actual evidence.

## Baseline evidence
- Branch `dev`, HEAD `6f0360e5166595945320a467a1fa2c91722b7401` before this policy file.
- RBAC source/test files are present in the Git tree.
- `npm run check` only checks `src/index.js`; it is insufficient for all RBAC files.
- `npm test`: NOT RUN by explicit instruction.
- Syntax/static checks of all RBAC files: NOT RUN.
- Development WAF: NOT VERIFIED.
- Guestbook CDN/cache: NOT VERIFIED.
- Development runtime: NOT VERIFIED.
- Browser dashboard access was unavailable in this execution context; no Cloudflare WAF or CDN setting was read or changed.
