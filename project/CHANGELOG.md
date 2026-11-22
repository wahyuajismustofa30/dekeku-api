## [Unreleased] — 2026-11-22
### Added — PUB-005 Project-aware JSON File Manager
- Added exact-allowlist-validated X-DEKEKU-Project-Origin selector for the first-party Tester while preserving browser Origin selection for normal websites.
- Added Admin-authenticated GET /api/v1/admin/write/file to read parsed JSON, size, and SHA from selected project repositories under public/data/.
- Added project connection, directory browsing/navigation/pagination, JSON editor, create/update/delete flows with SHA concurrency, and delete confirmation to both Tester page copies.
- Added focused tests for project selection, Admin JSON reading, and Tester File Manager UI. Execution is pending owner local verification.

# CHANGELOG — DEKEKU API Gateway

## [Unreleased] - 2026-11-22 (PUB-004-FIX Security Audit & Remediation)
### Added / Remediated
- Remediated upstream truncation detection on `GET /api/v1/admin/browse`: automatically flags `truncated: true` when Contents API returns >= 1,000 items (since Contents API caps directory arrays at 1,000 entries) or when Git Trees API returns `truncated: true`.
- Remediated symlink and submodule filtering: explicitly checks mode strings (`"120000"` for symlinks, `"160000"` for submodules) and enforces mode allowlist (`"100644"`, `"100755"` for files; `"040000"` for directories) when `mode` is present. Rejects items with unknown or unprovable modes or types (`"commit"`, `"symlink"`, `"submodule"`).
- Added native `getTree` method to `GitHubClient` in `src/core/github.js` for Git Trees API object support.
- Updated `test/browse-router.test.js` with comprehensive regression tests covering Contents API 1,000 item limits, Git Trees API `truncated: true` objects, symlink mode `"120000"`, submodule mode `"160000"`, file modes `"100644"`/`"100755"`, directory mode `"040000"`, unknown mode/type rejection, child path mismatch, pagination, and secret leakage prevention.
### Verification / Scope
- Syntax checks (`node --check`): PASS for all modified files (`src/modules/github/browse.js`, `src/core/github.js`, `src/core/router.js`, `test/browse-router.test.js`).
- Automated tests (`node --test test/browse-router.test.js test/repository-metadata.test.js test/write-router.test.js`): **54 PASS, 0 FAIL, 0 SKIP** (22 PASS in PUB-004 suite).
- Whitespace check (`git diff --check`): PASS (exit code 0, 0 formatting errors).
- `npm test` NOT RUN per explicit instruction. Development runtime: NOT VERIFIED.
- No Wrangler/Cloudflare settings, secrets, Worker deployment, or Production resources changed.

## [Unreleased] - 2026-11-22 (PUB-004 Public Repository File Browser)
### Added
- Implemented `GET /api/v1/admin/browse` endpoint for public repository file browsing in `src/modules/github/browse.js` and mounted under Admin JWT middleware (`authMiddleware`) in `src/core/router.js`.
- Integrated `resolveProjectRepository(request, env)` to enforce caller trusted Origin allowlist, `config.json` schema v1, owner policy, public visibility, and default branch reported by GitHub metadata.
- Implemented directory path validation (`validateBrowsePath`) restricting paths to `public/`, blocking traversal, backslashes, control characters, malformed encoding, hidden files, and sensitive files.
- Added upstream item filtering: excludes hidden files (`.`), sensitive files, symlinks, and submodules; returns strictly `name`, `path`, `type`, `size`, `sha` without file contents.
- Added upstream 1,000 items cap with `truncated: true` flag, and pagination capped at 100 items per page.
- Enforced exact child path validation (`item.path === '${pathValidation.path}/${item.name}'`) and explicit symlink/submodule property rejection (`target`, `submodule_git_url`).
- Created `test/browse-router.test.js` covering authentication, directory/subdirectory browsing, pagination, path traversal, hidden/sensitive files, out-of-scope paths, non-array responses, item caps, content exclusion, fake symlinks/submodules, child path mismatches, and resolver usage.
