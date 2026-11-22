# ROADMAP — DEKEKU API Gateway

Tanggal Pembaruan: 2026-11-22 (Fokus Aktif: Pengelolaan Repository Publik — PUB-004-FIX Security Audit Complete)

## Status Ringkas

- **PUB-001 specification complete**: `project/PUBLIC_REPOSITORY_CONTRACT.md` and `docs/schemas/public-repository-config.schema.json` define the versioned public project config contract.
- **PUB-002 verified locally**: syntax checks PASS and `test/repository-metadata.test.js` 12/12 PASS. Development runtime remains unverified.
- **PUB-003 complete**: Admin SHA/CREATE/UPDATE/DELETE use the shared validated project repository resolver and GitHub-reported default branch; verified via `node --test`.
- **PUB-004 implemented; PUB-004-FIX focused tests VERIFIED LOCALLY (47/47 PASS); Development runtime NOT VERIFIED**: `GET /api/v1/admin/browse` implemented with Admin JWT, path allowlisting, child path matching, hidden/sensitive file rejection, mode `"120000"` (symlink) & mode `"160000"` (submodule) rejection, mode allowlist (`100644`/`100755`/`040000`), accurate upstream truncation handling (Contents API >= 1,000 items & Git Trees API `truncated`), 1,000 items cap, and pagination; 22/22 PASS in focused suite (54/54 PASS total).
- Prioritas: kelola data publik pada repository masing-masing proyek.
- Tahapan aktif: PUB-001 sampai PUB-006 di [BACKLOG.md](BACKLOG.md).
- Pengaturan repository privat, private account storage, mapping, dan perluasan RBAC diarsipkan (A-003); catatan milestone lama di bawah dipertahankan sebagai sejarah, bukan antrean kerja.
- CI/CD workflow validasi PR (`.github/workflows/pr-validation.yml`) dikonfigurasi untuk PR ke `main`. Pemilik melaporkan Cloudflare Workers auto-deployment dari GitHub telah dikonfigurasi; integrasi dashboard belum diverifikasi independen. Target deployment terbatas pada Development Worker `dekeku-api-dev`. Production Worker `github`, `api.dekeku.my.id`, secrets, dan data Production tetap dilarang disentuh.

## Rencana Tahapan Pengelolaan Repository Publik

### PUB-001 — Contract & Discovery Specification (COMPLETE)
- Definisi skema `config.json` v1 (`schema_version`, `project.id`, `repository.username`, `repository.repo`).
- Aturan discovery dari Origin HTTPS tervalidasi ke `https://{origin}/config.json`.
- Aturan branch: `default_branch` dari metadata repository GitHub; tidak ada override branch pada config v1.

### PUB-002 — Config Schema & Trusted Origin Enforcement (COMPLETE & VERIFIED)
- Validasi skema v1, canonical HTTPS Origin (tanpa wildcard pada discovery), pencocokan owner `GITHUB_OWNER`, visibilitas `public`, dan default branch resmi.
- Verified via `node --test test/repository-metadata.test.js` (12/12 PASS).

### PUB-003 — Shared Project Repository Resolver Routing (COMPLETE & VERIFIED)
- Integrasi `resolveProjectRepository(request, env)` ke Admin SHA lookup dan CREATE/UPDATE/DELETE file.
- Verified via `node --test` (54/54 PASS total combined suites).

### PUB-004 — Public Repository File Browsing (implemented); PUB-004-FIX follow-up (NOT VERIFIED)
- Endpoint `GET /api/v1/admin/browse?path=public&page=1&per_page=50`.
- Validasi path `public/`, pementalan traversal, hidden/sensitive files, symlink/submodule filtering (mode `120000`/`160000`, type `symlink`/`submodule`/`commit`, properti `target`/`submodule_git_url`), pencocokan child path presisi, batas upstream 1.000 item, deteksi `truncated: true` presisi, pagination, dan keluaran metadata murni (`name`, `path`, `type`, `size`, `sha`).
- Historical pre-remediation test result: `node --test test/browse-router.test.js` (22/22 PASS). This does NOT verify the new Git Trees traversal; current follow-up tests are NOT RUN and legacy mocks require migration.

### PUB-005 — Tester Public File Manager UI (IN PROGRESS)
- Lengkapi UI Tester untuk memilih proyek/repository, menampilkan pohon folder, tabel/editor JSON, serta operasi CRUD aman melalui DEKEKU API Gateway.

### PUB-006 — Development End-to-End Verification (PENDING)
- Uji alur lengkap dengan sedikitnya dua repository proyek publik pada Development Worker `dekeku-api-dev`.


### PUB-004-FIX Follow-up Status (2026-11-22)
Actual Git Trees branch/tree traversal has been implemented in `src/modules/github/browse.js`, branch-name encoding fixed in `src/core/github.js`, and focused integration-style tests added in `test/browse-git-tree.test.js`. This is NOT VERIFIED: tests were not run, and `test/browse-router.test.js` has now been migrated to Git Trees fixtures; execution remains NOT VERIFIED. PUB-005 remains blocked.


## Latest Verification Update — PUB-004-FIX (2026-11-22)
The earlier NOT VERIFIED test note above is superseded by the owner's local execution after syncing `dev`:
- Command: `node --test test/browse-router.test.js test/browse-git-tree.test.js test/repository-metadata.test.js test/write-router.test.js`.
- Result: **47 PASS, 0 FAIL, 0 SKIP; 8 suites**.
- `git diff --check` returned no output (owner-reported).
- Local branch `dev` is clean at `4f9747a`; remote `origin/dev` head matches the same full commit SHA.
- PUB-004-FIX focused regression tests: VERIFIED. Development runtime: NOT VERIFIED. Owner acceptance: PENDING.
- PUB-005 remains BLOCKED until explicit owner acceptance and authorization.

## PUB-005 Implementation Update (2026-11-22)
- Owner approval received after PUB-004-FIX acceptance.
- Added a project Origin selector header (X-DEKEKU-Project-Origin) validated against the exact server-side ALLOWED_ORIGINS allowlist; no client-supplied owner/repository/branch is accepted.
- Added Admin-authenticated JSON read endpoint GET /api/v1/admin/write/file restricted to public/data/*.json.
- Updated generated and static Tester pages with project connection, directory browser, navigation/pagination, JSON editor, CREATE/UPDATE/DELETE workflows, fresh SHA lookup, and delete confirmation.
- New focused tests added; automated execution is pending local verification. PUB-005 remains IN PROGRESS, not verified.
