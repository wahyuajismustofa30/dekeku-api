# Execution Policy & Current Work Queue

Updated: 2026-11-22 (owner scope: public repository management)
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
- `project/RBAC_PLAN.md` is a historical reference only; private-repository/RBAC work is archived in `project/TASK_ARCHIVE.md` (A-003) and is not active.
- Historical checkpoints and stage notes must not override the latest checkpoint.

## Mandatory execution instructions
1. Keep `project/PROGRESS.md` as the single source of truth for current status.
2. Keep one ordered active work queue; do not copy archived task details into ordinary progress reports.
3. Latest owner scope (2026-11-22): public repository management is the active workstream; PUB-001 through PUB-004 complete; PUB-005 is next active task. Private repository/RBAC tasks are archived under A-003. Earlier CI/CD queue notes below are historical and not active.
4. Do not resume archived tasks automatically. Consult `project/TASK_ARCHIVE.md` only when the owner explicitly asks for the task archive or reactivates an archived item.
5. Update the latest checkpoint only with evidence actually obtained.
6. R-013 syntax validation and focused regression testing are historical owner-reported evidence: `node --check` for all RBAC source/test files and `node --test test/rbac-token-version.test.js` (6 PASS, 0 FAIL). Do not run `npm test` unless the owner explicitly authorizes it.

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
3. [x] **PUB-003 — Route Admin SHA/CREATE/UPDATE/DELETE to the selected public repository.** Shared resolver wired into all four Admin handlers; regression tests verified (51/51 PASS across combined suites).

4. [x] **PUB-004 — Implement safe public repository browsing.** Endpoint `GET /api/v1/admin/browse` audited & remediated with Admin JWT, path validation (`public/` only), child path exact matching, hidden/sensitive file filtering, symlink/submodule property exclusion, max 1000 items cap, pagination, and metadata-only output. Verified via `node --test` (20/20 PASS in browse suite, 52/52 PASS total).
5. [ ] **PUB-005 — Complete the phpMyAdmin-like Tester file manager.** Project selection, folder tree, JSON table/editor, and safe CRUD interactions.
6. [ ] **PUB-006 — Verify on Development.** Test at least two public project repositories, auth boundaries, SHA conflicts, and failure paths.

Execution remains on `dev`; PR to `main` only after stable and owner review. No Production changes, private repository setup, secrets changes, or writes to real website data without separate explicit approval.

## Baseline evidence

- Target branch: `dev`; work is restricted to this branch.
- R-013 implementation and focused regression test are present in the repository.
- Owner-reported Termux verification: native `node --check` PASS for all RBAC source/test files; focused `node --test test/rbac-token-version.test.js` PASS (6 PASS, 0 FAIL).
- These results are user-reported evidence; they were not independently re-run in this session.
- `npm test`: NOT RUN by explicit instruction.
- Development runtime/deployment: NOT VERIFIED.
- Deferred/archived follow-up items are stored in `project/TASK_ARCHIVE.md` and are intentionally omitted from the active queue.
- Historical baseline before the owner's latest instruction (SUPERSEDED): no technical workstream was selected. Current selection is public repository management; PUB-001 specification is complete and PUB-002 is in progress.
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
- Historical note: the owner previously selected the Development CI/CD workstream. This is superseded by the 2026-11-22 public-repository scope decision.
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
- Historical next step at the time of this record: CICD-004. Superseded by the 2026-11-22 public-repository scope decision.
- Required/blocking: `npm ci`; syntax checks for relevant JS under `src/` and `test/`; Wrangler `deploy --dry-run`; mapped focused regression tests for changed code.
- Initial warnings: `npm audit --audit-level=high`; changed code without a deterministic test mapping.
- `npm test` remains prohibited/NOT RUN; remote tests remain excluded. Do not add secrets or Production access to PR validation.


## CICD-004 Result — PR Validation Workflow
- `.github/workflows/pr-validation.yml` is implemented on `dev`; normative contract remains `project/CICD_VALIDATION_CONTRACT.md`.
- Workflow is PR-only for `dev` → `main`; read-only permissions; immutable action pins; per-PR concurrency; no deployment step or secrets.
- Checks: `npm ci`, syntax checks for JS under `src/` and `test/`, explicit Development Worker name guard plus Wrangler dry-run, focused mapped `node --test` suites, and warning-only `npm audit`.
- `npm test` and remote tests remain prohibited. Workflow run and YAML execution are NOT VERIFIED until an actual PR triggers it.
- Historical next step at the time of this record: CICD-006. Superseded by the 2026-11-22 public-repository scope decision.

## Current Owner Update — 2026-11-22 (Supersedes stale queue statements above)

- Exactly two repository branches are allowed: `main` and `dev`. Do not create additional branches. Both are synchronized at commit `1649701419f6d1b03b5f659c76f02d02b4355ad8`; `dev` was fast-forwarded without force-push.
- Owner reports Cloudflare Workers auto-deployment from GitHub is configured and a GitHub deployment succeeded. This is owner-reported, not independently verified. Verify the Cloudflare dashboard integration, branch mapping, Worker target, deployed version and health before treating it as verified.
- `.github/workflows/pr-validation.yml` is a PR validation workflow only; it contains no deployment step. Do not create a duplicate deployment mechanism before auditing the existing Cloudflare Git integration.
- Historical next step at the time of this record: documentation-only PR validation. Superseded by the 2026-11-22 public-repository scope decision.
- Reassess CICD-005..010 after verifying the existing Cloudflare deployment integration; preserve Development-only scope (`dekeku-api-dev`).
- `npm test` remains NOT RUN. Remote tests remain prohibited. Production remains untouched.

## PR #23 — Historical Validation Gate (2026-11-22; superseded by latest owner scope)

- Documentation-only PR #23 is open: https://github.com/wahyuajismustofa30/dekeku-api/pull/23
- Head `dev`: `49a0b92dbe8a8530907c0c50879a07c7026a7abf`; base `main`: `1649701419f6d1b03b5f659c76f02d02b4355ad8`.
- It contains documentation changes only. CI was expected to trigger, but workflow-runs lookup and combined commit status returned no runs/statuses; therefore CI is NOT VERIFIED.
- Do not merge independently. Review actual CI evidence before recommending merge.


## Owner Scope Update — 2026-11-22 (Latest)

- Current focus is public repository management per project, as recorded in D-027.
- Private repository setup, `dekeku-db` account/mapping storage, User RBAC expansion, and associated verification are archived under A-003. Do not resume automatically.
- Existing source code and historical decision records remain intact. No code, Worker configuration, Cloudflare setting, secret, data, or deployment was changed by this scope update.
- Current next task: PUB-004 — implement bounded, paginated directory/file browsing for the validated public project repository. PUB-001..PUB-003 source/focused verification is complete; Development runtime remains NOT VERIFIED.
