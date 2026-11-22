# CHECKPOINT — DEKEKU API Gateway

## Latest authoritative checkpoint — 2026-11-22

### Repository and branches
- Repository: `wahyuajismustofa30/dekeku-api`.
- Remote `main` and `dev` were compared and are **identical** at `c7cdd582003d7162a3842fd9ec612224fc733921`.
- PR #26 (`feat(pub): complete public repository management and wildcard origins`) is merged into `main`; merge commit `c7cdd582003d7162a3842fd9ec612224fc733921`.
- The latest local checkout status reported by the owner before this checkpoint was clean on local `dev` at `8e43d104`, with `origin/main` at `c7cdd58` and `origin/dev` at `8e43d10`. The remote branches were subsequently observed identical, but local checkout synchronization has not been confirmed. Before local implementation, inspect local `git status`, branch, and refs once.

### Implementation status
- PUB-001: config schema v1 contract and JSON Schema complete.
- PUB-002: server-side config/Origin/repository validation implemented; focused metadata test previously reported 12/12 PASS.
- PUB-003: shared resolver routes Admin SHA and CREATE/UPDATE/DELETE to the validated public project repository.
- PUB-004/PUB-004-FIX: Admin browse endpoint uses Git Trees traversal, `public/` path boundary, exact child matching, hidden/sensitive filtering, symlink/submodule/unknown-mode fail-closed behavior, pagination, truncation reporting, and metadata-only responses. Focused suite reported 47/47 PASS.
- PUB-005: Project Origin selector (`X-DEKEKU-Project-Origin`), authenticated JSON reader (`GET /api/v1/admin/write/file`), and File Manager in both `src/modules/tester/index.js` and `public/tester.html`. Features include browse/navigation/pagination, JSON read/edit, CREATE, UPDATE with fresh SHA, DELETE with confirmation and fresh SHA.
- Wildcard Origin support accepts configured HTTPS subdomains (including nested subdomains) under `*.dekeku.my.id` and `*.artoprintingpbg.com`; wildcard does not authorize apex domains, lookalike suffixes, HTTP, or explicit ports.
- CI fix `8e43d104aef0fee953303d78da22643cab23f248` rejects registered Origins with explicit ports in `src/modules/rbac/storage.js`. This is a narrow regression/security fix; RBAC product scope remains archived.

### Test evidence reported by owner
- PUB-004-FIX focused command: 47 PASS, 0 FAIL, 0 SKIP.
- Wildcard metadata test `node --test test/repository-metadata.test.js`: 16 PASS, 0 FAIL.
- PUB-005 seven-file regression command: 66 PASS, 0 FAIL, 0 cancelled, 0 skipped, 9 suites.
- CI blocker test `node --test test/rbac-storage.test.js`: 11 PASS, 0 FAIL, 1 suite.
- `git diff --check`: PASS for PUB-005 work (no output).
- `npm test`: NOT RUN by owner instruction.
- These are owner-reported local results, not a claim of live Worker/browser E2E success.

### Remaining verification — ACTIVE NEXT: PUB-006
1. Verify current Development Worker deployment identity/version and health after PR #26 merge.
2. Verify `/api/v1/health` and `/tester` on Development.
3. Login Admin; verify unauthenticated admin endpoints return 401.
4. Test at least two public project repositories and ensure project selection never crosses repositories.
5. Test browse, JSON read, and CREATE/UPDATE/DELETE using disposable approved fixture files only.
6. Test SHA conflict, invalid Origin, wildcard subdomain, apex behavior, traversal/sensitive paths, and upstream failures.
7. Recheck project domain config files: previous observations were `www.dekeku.my.id/config.json` HTTP 200 with legacy schema, `www.artoprintingpbg.com/config.json` HTTP 404, and `demo` config v1 committed but domain not verified. These are historical observations; recheck before acting.
8. Record exact environment, Worker version, timestamps, status codes, and outcomes. Do not write/delete real website data.

### Deployment and safety boundaries
- `.github/workflows/pr-validation.yml` is PR validation only, not deployment.
- Owner reports Cloudflare GitHub auto-deployment is configured. Independent verification of branch trigger, target Worker, deployed version, and post-merge health remains NOT VERIFIED.
- Remote branch comparison shows `main` and `dev` identical; local checkout sync remains unconfirmed.
- Production Worker `github`, `api.dekeku.my.id`, Production secrets/config/data have not been touched and remain prohibited without explicit approval.
- No new deployment, secret/variable change, Wrangler change, or Cloudflare dashboard change was performed for this documentation update.

---

## Historical checkpoints

Earlier PUB-004-FIX remediation, initial PUB-005 implementation, newline-escaping regression (fixed in commit `6ff742b59665eaf1b820e708ff814c80f792656d`), and earlier test snapshots are retained in Git history. The authoritative status is the latest checkpoint above and `project/PROGRESS.md`; older notes below this point must be read as historical, not current queue/status.

## Earlier PUB-004-FIX and PUB-005 evidence
- PUB-004-FIX focused tests: 47/47 PASS.
- PUB-005 initial seven-suite command first failed 2 tests due to embedded JavaScript newline escaping; fixed and rerun with 62/62 PASS at that earlier checkpoint.
- Later wildcard Origin tests expanded metadata suite to 16 PASS, and combined seven-file PUB-005 regression command reached 66 PASS.
- Separate `test/rbac-storage.test.js` run after CI blocker fix: 11 PASS.
