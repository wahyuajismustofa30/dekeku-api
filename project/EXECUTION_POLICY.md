# Execution Policy & Current Work Queue

Updated: 2026-11-22
Target branch: `dev`
Repository: `wahyuajismustofa30/dekeku-api`
Current status authority: `project/PROGRESS.md`.

## Authority hierarchy
1. Wahyu is the project owner and final decision-maker. The latest explicit instruction prevails.
2. ChatGPT is the lead development assistant for analysis, planning, delegation, and review under the owner's authority.
3. Codex in Termux is the execution assistant and must follow the owner's latest instruction and delegated scope.

If instructions or documents conflict with the owner's latest instruction, stop the affected action and report the conflict. Reconcile documentation when the instruction is clear, preserving historical facts.

## Active scope and ordered work queue
Active scope: public data management in each project's own public GitHub repository. Private repository `dekeku-db`, private account storage, mappings, and RBAC expansion remain archived under A-003.

1. [x] **PUB-001 — Public repository config contract v1.** Specification and JSON Schema available.
2. [x] **PUB-002 — Schema and trusted Origin enforcement.** Implemented; focused tests reported PASS; Development runtime NOT VERIFIED.
3. [x] **PUB-003 — Shared resolver for Admin SHA and CRUD.** Implemented; regression coverage reported PASS.
4. [x] **PUB-004 / PUB-004-FIX — Safe public repository browsing.** Git Trees traversal and fail-closed filtering implemented; focused suite reported 47/47 PASS.
5. [x] **PUB-005 — Tester File Manager implementation.** Both Tester copies, project selector, Admin JSON reader, browse, pagination, JSON CRUD, fresh SHA handling implemented; focused regression command reported 66/66 PASS. Browser E2E and Development runtime remain NOT VERIFIED.
6. [ ] **PUB-006 — Development E2E verification (ACTIVE NEXT).** Verify at least two public repositories, authentication, project selection, browse/read/CRUD, SHA conflict, Origin/wildcard boundaries, and upstream failures using approved safe fixtures.

CI/CD follow-up is tracked in `project/BACKLOG.md`: PR validation workflow exists and PR #26 was merged after CI remediation; verify required check behavior and existing Cloudflare Git integration/deployed Development version. Do not create a duplicate deployment workflow before auditing the existing integration.

## Git and PR policy
- Work on `dev`; `main` is the protected integration branch.
- The remote `main` and `dev` branches were verified identical at `c7cdd582003d7162a3842fd9ec612224fc733921` on 2026-11-22. The owner's last reported local checkout was clean on `dev` at `8e43d104`, one merge commit behind `origin/main`; local synchronization has not been confirmed.
- Do not commit/push directly to `main`, force-push, delete branches, create extra branches, or merge PRs independently.
- After work is stable, tested, documented, and reviewed, changes may be committed/pushed to `dev` and proposed through PR `dev` → `main` in accordance with owner approval and repository policy.
- `.github/workflows/pr-validation.yml` validates PRs; it does not deploy.

## Non-negotiable constraints
- `npm test`: NOT RUN unless the owner explicitly changes this instruction.
- Never deploy or modify Production Worker `github`, domain `api.dekeku.my.id`, Production secrets, variables, or data.
- Do not change Wrangler config, Cloudflare settings, secrets, credentials, accounts, repository mappings, or real website data without explicit authorization.
- Do not run destructive/mutative E2E against real project data; use approved disposable fixtures.
- Separate source review, syntax checks, automated tests, Development runtime/browser E2E, deployment evidence, WAF, and CDN verification.
- If evidence is unavailable, record NOT VERIFIED. Do not infer success from code, docs, or a PR merge.

## Evidence vocabulary
- VERIFIED: sufficient current evidence exists.
- FAILED: the check ran and failed.
- NOT VERIFIED: evidence is unavailable or incomplete.
- NEEDS INVESTIGATION: a concrete indication requires further inspection.
- NOT RUN: the check was not executed.

## Reporting requirements
Record command, branch/commit, environment, exit code, PASS/FAIL/SKIP, and concise output evidence for tests. Redact all secrets, tokens, passwords, JWTs, and hashes. Report changed files, test evidence, risks, deployment status, and Production boundary.
