# Execution Policy & Current Work Queue

Updated: 2026-11-21 (CICD-001 audit and owner-selected CI/CD track)
Target branch: `dev`
Repository: `wahyuajismustofa30/dekeku-api`
Baseline inspected before this documentation reconciliation: `447aecad00eee7dfb0018308882be2333b698f7a`

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
- `project/RBAC_PLAN.md` retains RBAC architecture, endpoint inventory, acceptance criteria, and implementation records; its current status must agree with PROGRESS and BACKLOG.
- Historical checkpoints and stage notes must not override the latest checkpoint.

## Mandatory execution instructions
1. Keep `project/PROGRESS.md` as the single source of truth for current status.
2. Keep one ordered active work queue; do not copy archived task details into ordinary progress reports.
3. R-013 syntax validation and focused regression testing are reported PASS by the owner from Termux: `node --check` for all RBAC source/test files and `node --test test/rbac-token-version.test.js` (6 PASS, 0 FAIL). Do not run `npm test`.
6. The owner selected option C (documentation reconciliation), then explicitly instructed continuation with the Development CI/CD track. CICD-001 read-only audit is complete; CICD-002 branch-policy reconciliation is complete. CICD-003 is the next active task.
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

1. [x] Reconcile project documentation to the approved R-013 decision and owner-reported verification status.
2. [x] R-013 source implementation and focused regression coverage are present on `dev`.
3. [x] Owner-reported Termux verification: native `node --check` PASS for all RBAC source/test files; `node --test test/rbac-token-version.test.js` PASS (6 PASS, 0 FAIL).
4. [x] `npm test` remains NOT RUN as explicitly instructed.
5. [x] **CICD-001 — Read-only deployment target and Wrangler audit.** Completed against branch `dev`, HEAD `09df42e24ab911efa5ed2541f7e80ddb665c20b7`; findings recorded below and in PROGRESS.
6. [x] **CICD-002 — Reconcile branch policy.** Documentation reviewed; development on `dev`, PR target `main`, and direct commits/pushes to `main` prohibited. No conflicting current instruction found.
7. [ ] **CICD-003 — Define PR validation contract.** NEXT ACTIVE TASK. Define required and optional checks, without creating or running workflows.
8. [ ] CICD-004 / CICD-006 / CICD-007 — PR validation workflow, Development-only credentials, and deployment safeguards; only after the contract and required approvals.
9. [ ] CICD-005 — Main-to-Development deployment workflow; only after Development target and credential safeguards are verified and explicit implementation approval is obtained.
10. [ ] CICD-008 / CICD-009 / CICD-010 — Workflow evidence, Development runtime verification, and final documentation.
11. [DEFERRED / ARCHIVED] WAF and CDN/cache follow-ups are not active; do not resume archived items automatically. Consult `project/TASK_ARCHIVE.md` only when the owner explicitly requests or reactivates an archived item.

## Baseline evidence

- Target branch: `dev`; work is restricted to this branch.
- R-013 implementation and focused regression test are present in the repository.
- Owner-reported Termux verification: native `node --check` PASS for all RBAC source/test files; focused `node --test test/rbac-token-version.test.js` PASS (6 PASS, 0 FAIL).
- These results are user-reported evidence; they were not independently re-run in this session.
- `npm test`: NOT RUN by explicit instruction.
- Development runtime/deployment: NOT VERIFIED.
- Deferred/archived follow-up items are stored in `project/TASK_ARCHIVE.md` and are intentionally omitted from the active queue.
- Historical baseline before the owner's latest instruction (SUPERSEDED): no technical workstream was selected. Current selection is Development CI/CD; CICD-003 is next.
- Production Worker/domain/secrets/configuration/data: untouched.

## R-013 Implementation Evidence (2026-11-21)
- Source implementation is present on dev: src/modules/rbac/storage.js, src/modules/rbac/admin.js, src/modules/auth/user-login.js, and src/middleware/auth.js.
- Focused regression suite added: test/rbac-token-version.test.js; registered in package.json.
- Owner-reported Termux verification: native node --check PASS for all RBAC source/test files; focused test node --test test/rbac-token-version.test.js PASS (6 PASS, 0 FAIL).
- These checks were not independently re-executed in this session. npm test: NOT RUN by explicit instruction.
- No Development deployment, Cloudflare configuration, account data, secrets, or Production resources changed.


## CI/CD Development — Owner-Approved Direction (2026-11-21)

- Development work is performed on branch `dev`; changes are proposed to `main` through a Pull Request after they are stable.
- Pull Requests from `dev` to `main` must run the agreed validation workflow. Critical validation failures block merging; optional/non-critical checks may initially report warnings.
- A successful update to `main` is the intended trigger for GitHub Actions to deploy **only** the Development Worker `dekeku-api-dev`.
- A PR itself must not deploy. Deployment must use Development-only credentials and configuration; Production credentials, Worker `github`, domain `api.dekeku.my.id`, and Production data are out of scope.
- The deployment workflow must prevent overlapping deployments, identify the source commit, and fail closed if the target cannot be confirmed as Development.
- This is an approved target policy, not evidence that CI/CD has been implemented. Until the relevant tasks are completed and verified, no automatic deployment is assumed to exist.


## CI/CD Execution Boundary

- Branch kerja aktif tetap `dev`; PR target `main` hanya setelah perubahan stabil.
- The owner selected the Development CI/CD workstream. CICD-001 and CICD-002 are complete; CICD-003 is the next active task. The approved workflow policy is not evidence of an implemented workflow.
- Do not create or run a deployment workflow until its Development target, credential isolation, and fail-closed safeguards have been reviewed.
- Once implemented, only an update to `main` may trigger the Development deployment. PR events and pushes to `dev` must not deploy.
- Production remains prohibited. `npm test` remains NOT RUN unless the owner explicitly changes that instruction.


## CICD-001 Audit Evidence (2026-11-21)
- Audited branch: `dev`; HEAD: `09df42e24ab911efa5ed2541f7e80ddb665c20b7`.
- Repository tree at that commit was complete (`truncated=false`); no `.github/workflows` path was present.
- `wrangler.jsonc` names the Worker `dekeku-api-dev`, entrypoint `src/index.js`, and configures `GITHUB_OWNER=wahyuajismustofa30`, `GITHUB_REPO=dekeku-db`, `GITHUB_BRANCH=main`, and `ALLOWED_ORIGINS`. It has no named Wrangler environment.
- `package.json`: `dev=wrangler dev`; `build` and `check` both run only `node --check src/index.js`; no deployment script is defined.
- `.gitignore` excludes `.dev.vars` and environment files. README documents Worker secrets but does not prove GitHub Actions secrets exist.
- GitHub branch metadata reports `protected=false` for `dev` and `main`; required status checks are not configured on `main`. Branch-protection details endpoint returned 403 for the integration, so full protection rules are NOT VERIFIED.
- GitHub Actions secrets, environments, and repository Actions settings: NOT VERIFIED (sensitive/unsupported endpoint access). No secrets were read.
- Audit was read-only. No workflows, source, Wrangler config, Cloudflare settings, secrets, deployment, or Production resources changed.


## CICD-003 Result — PR Validation Contract
- CICD-003 is COMPLETE — DEFINED. The normative check matrix, trigger boundary, failure behavior, and test restrictions are in `project/CICD_VALIDATION_CONTRACT.md`.
- Next active task: CICD-004, implement PR validation workflow only. PR events must not deploy.
- Required/blocking: `npm ci`; syntax checks for relevant JS under `src/` and `test/`; Wrangler `deploy --dry-run`; mapped focused regression tests for changed code.
- Initial warnings: `npm audit --audit-level=high`; changed code without a deterministic test mapping.
- `npm test` remains prohibited/NOT RUN; remote tests remain excluded. Do not add secrets or Production access to PR validation.
