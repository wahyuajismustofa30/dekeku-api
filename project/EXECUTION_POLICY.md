# Execution Policy & Current Work Queue

Updated: 2026-11-22 (owner scope: public repository management)
Target branch: `dev`
Repository: `wahyuajismustofa30/dekeku-api`

## Authority Hierarchy
1. **Wahyu — Project Owner (highest authority):** latest explicit instruction, approval, and decision prevails over every project document, historical decision, implementation choice, and assistant instruction.
2. **ChatGPT — Lead Development Assistant (second):** analyzes, plans, coordinates, delegates technical work, and reviews Codex output under Wahyu's authority.
3. **Codex in Termux — Execution Assistant (third):** performs repository/environment tasks delegated by ChatGPT and/or explicitly instructed by Wahyu; cannot independently change goals, architecture, scope, or operational approvals.

### Conflict protocol
- If a document, earlier decision, implementation, or assistant direction conflicts with Wahyu's latest explicit instruction, stop the affected action and report the exact conflict and impact.
- Offer clear options or request the specific approval required. Do not silently decide conflicts involving scope, security, credentials, data, deployment, or Production.
- If Wahyu's instruction is clear and safe, reconcile conflicting documentation while preserving historical context. Technical evidence describes actual behavior; it does not supersede owner authority.
- Codex must stop and report if a delegated instruction is unsafe, contradictory, or technically impossible. A newer explicit instruction from Wahyu always overrides an older ChatGPT delegation.

## Authority
- `project/PROGRESS.md` is the single source of truth for current project status.
- This file defines the required execution sequence and hard constraints.
- `project/BACKLOG.md` is the detailed task checklist and must agree with PROGRESS.
- `project/RBAC_PLAN.md` is a historical reference only; private-repository/RBAC work is archived in `project/TASK_ARCHIVE.md` (A-003) and is not active.
- Historical checkpoints and stage notes must not override the latest checkpoint.

## Non-negotiable constraints
- `npm test`: NOT RUN unless the owner explicitly changes this instruction.
- Work only on `dev`; never commit/push to `main`.
- Never deploy or modify Production Worker `github`, Production domain `api.dekeku.my.id`, Production secrets, variables, or data.
- Do not change Wrangler configuration, Cloudflare settings, secrets, credentials, real accounts, repository mappings, or website data without explicit authorization.
- If a required dashboard, runtime, credential, or safe fixture is unavailable, record `NOT VERIFIED` with the exact blocker. Do not infer success from source code or documentation.
- Keep implementation, syntax/static validation, automated tests, Development runtime, WAF, and CDN verification as separate evidence categories.

## Ordered current work queue

Current owner-approved focus: public data management in each project's own public GitHub repository. Private repository setup and RBAC expansion are archived (A-003).

1. [x] **PUB-001 — Define public project repository contract.** SPEC COMPLETE: `project/PUBLIC_REPOSITORY_CONTRACT.md` + `docs/schemas/public-repository-config.schema.json`; runtime enforcement is not included.
2. [x] **PUB-002 — Enforce config schema and trusted Origin mapping server-side.** Owner-reported syntax checks PASS and `node --test test/repository-metadata.test.js` PASS (12 PASS, 0 FAIL, 0 SKIP). Development runtime NOT VERIFIED.
3. [x] **PUB-003 — Route Admin SHA/CREATE/UPDATE/DELETE to the selected public repository.** Shared resolver wired into all four Admin handlers; regression tests verified (54/54 PASS across combined suites).
4. [x] **PUB-004 — Implement safe public repository browsing (PUB-004-FIX Security Audit Complete).** Endpoint `GET /api/v1/admin/browse` remediated with Admin JWT, path validation (`public/` only), child path exact matching, hidden/sensitive file filtering, mode `"120000"` (symlink) & mode `"160000"` (submodule) rejection, mode allowlist (`100644`/`100755`/`040000`), upstream truncation detection (Contents API >= 1000 & Git Trees API `truncated`), pagination, and metadata-only output. Verified via `node --test` (22/22 PASS in browse suite, 54/54 PASS total).
5. [ ] **PUB-005 — Complete the phpMyAdmin-like Tester file manager.** Project selection, folder tree, JSON table/editor, and safe CRUD interactions.
6. [ ] **PUB-006 — Verify on Development.** Test at least two public project repositories, auth boundaries, SHA conflicts, and failure paths.

Execution remains on `dev`; PR to `main` only after stable and owner review. No Production changes, private repository setup, secrets changes, or writes to real website data without separate explicit approval.


## PUB-004-FIX Follow-up Gate (2026-11-22)
- The prior PUB-004-FIX completion claim is superseded by the follow-up audit finding that the Git Trees API was not invoked at runtime.
- Actual Git Trees traversal has now been added on `dev`, with a new focused integration-style test file. This change is NOT VERIFIED because tests were not run. `test/browse-router.test.js` has now been migrated to branch/tree fixtures; execute the migrated focused suite locally before acceptance.
- PUB-004-FIX remains open until the migrated focused regression suite passes with evidence. PUB-005 is blocked until the owner accepts PUB-004-FIX.
