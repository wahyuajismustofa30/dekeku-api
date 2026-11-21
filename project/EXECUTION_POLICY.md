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
1. Keep `project/PROGRESS.md` as the single source of truth for current status.
2. Keep one ordered active work queue; do not copy archived task details into ordinary progress reports.
3. R-013 syntax validation and focused regression testing are reported PASS by the owner from Termux: `node --check` for all RBAC source/test files and `node --test test/rbac-token-version.test.js` (6 PASS, 0 FAIL). Do not run `npm test`.
4. Do not resume archived tasks automatically. Consult `project/TASK_ARCHIVE.md` only when the owner explicitly asks for the task archive or reactivates an archived item.
5. Update the latest checkpoint only with evidence actually obtained.

## Non-negotiable constraints
- `npm test`: NOT RUN unless the owner explicitly changes this instruction.
- Work only on `dev`; never commit/push to `main`.
- Never deploy or modify Production Worker `github`, Production domain `api.dekeku.my.id`, Production secrets, variables, or data.
- Do not change Wrangler configuration, Cloudflare settings, secrets, credentials, real accounts, repository mappings, or website data without explicit authorization.
- If a required dashboard, runtime, credential, or safe fixture is unavailable, record `NOT VERIFIED` with the exact blocker. Do not infer success from source code or documentation.
- Keep implementation, syntax/static validation, automated tests, Development runtime, WAF, and CDN verification as separate evidence categories.

## Ordered current work queue

1. [x] Reconcile project documentation to the approved R-013 decision and current status.
2. [x] Implement R-013 per-user tokenVersion, User JWT claim, per-request version check, and increment during successful password reset on `dev`.
3. [x] Add and register focused R-013 regression coverage.
4. [x] Owner reports native `node --check` PASS for all RBAC source/test files from Termux.
5. [x] Owner reports `node --test test/rbac-token-version.test.js`: 6 PASS, 0 FAIL from Termux.
6. [ARCHIVED] Non-active tasks have been moved to `project/TASK_ARCHIVE.md`. Do not display archive contents unless the owner explicitly asks for the task archive; do not resume archived tasks automatically.
7. [ ] Consider Development runtime verification only with explicit deployment approval. Do not deploy automatically.

## Baseline evidence

- Target branch: `dev`; work is restricted to this branch.
- R-013 implementation and focused regression test are present in the repository.
- Owner-reported Termux verification: native `node --check` PASS for all RBAC source/test files; focused `node --test test/rbac-token-version.test.js` PASS (6 PASS, 0 FAIL).
- These results are user-reported evidence; they were not independently re-run in this session.
- `npm test`: NOT RUN by explicit instruction.
- Development runtime/deployment: NOT VERIFIED.
- Detailed deferred follow-up items are stored in `project/TASK_ARCHIVE.md` and are intentionally omitted from the active queue.
- Production Worker/domain/secrets/configuration/data: untouched.

## R-013 Implementation Evidence (2026-11-21)
- Source implementation is present on dev: src/modules/rbac/storage.js, src/modules/rbac/admin.js, src/modules/auth/user-login.js, and src/middleware/auth.js.
- Focused regression suite added: test/rbac-token-version.test.js; registered in package.json.
- Owner-reported Termux verification: native node --check PASS for all RBAC source/test files; focused test node --test test/rbac-token-version.test.js PASS (6 PASS, 0 FAIL).
- These checks were not independently re-executed in this session. npm test: NOT RUN by explicit instruction.
- No Development deployment, Cloudflare configuration, account data, secrets, or Production resources changed.
