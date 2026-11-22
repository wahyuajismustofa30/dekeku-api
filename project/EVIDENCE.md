# EVIDENCE INDEX — DEKEKU API Gateway

Dokumen ini adalah indeks bukti pengujian, audit, verifikasi, dan investigasi teknis pada repository `dekeku-api`.

## 1. PUB-006 Live Development Worker CRUD E2E Verification
- **Test ID**: PUB-006 E2E CRUD Lifecycle
- **Date / Timestamp**: 2026-11-22T16:57:13.885Z
- **Environment**: Development Worker (`https://dekeku-api-dev.wahyuajismustofa30.workers.dev`)
- **Test Origin**: `https://demo.dekeku.my.id`
- **Test Repository**: `wahyuajismustofa30/demo`
- **Fixture Path**: `public/data/__dekeku_pub006_e2e_fixture.json`
- **Command / Method**: Automated Node test script interacting via `fetch` with Admin JWT authentication (`/api/v1/admin/login`) and `X-DEKEKU-Project-Origin` header.
- **Results Table**:

| Operasi | Endpoint | Method | HTTP Status | SHA Sebelum | SHA Sesudah | Hasil |
|---|---|---|---|---|---|---|
| CREATE | `/api/v1/admin/write/create` | POST | 200 | `-` | `0c86152679a76bbb6c84ea34251cff73e8945681` | VERIFIED |
| READ | `/api/v1/admin/write/file` | GET | 200 | `0c86152679a76bbb6c84ea34251cff73e8945681` | `0c86152679a76bbb6c84ea34251cff73e8945681` | VERIFIED |
| UPDATE | `/api/v1/admin/write/update` | PUT | 200 | `0c86152679a76bbb6c84ea34251cff73e8945681` | `de8389086a32c6a8cdeb494ee53af065eca98db1` | VERIFIED |
| STALE SHA CONFLICT | `/api/v1/admin/write/update` | PUT | 409 | `0c86152679a76bbb6c84ea34251cff73e8945681` | `de8389086a32c6a8cdeb494ee53af065eca98db1` | VERIFIED (HTTP 409 Conflict) |
| DELETE | `/api/v1/admin/write/delete` | DELETE | 200 | `de8389086a32c6a8cdeb494ee53af065eca98db1` | `4f6a86c31b3fe43e1ab9fabce687eb6750e9f3bf` | VERIFIED |
| CLEANUP VERIFICATION | `/api/v1/admin/write/file` | GET | 404 | `-` | `-` | VERIFIED (HTTP 404 Not Found) |

## 2. Arto Printing Read-Only Investigation (`artoprintingpbg.com`)
- **Date / Timestamp**: 2026-11-22
- **Environment**: Public Internet / Production Domains (Read-Only)
- **URLs Inspected**:
  1. `https://artoprintingpbg.com/config.json` -> HTTP 301 Moved Permanently (Location: `https://www.artoprintingpbg.com/config.json`)
  2. `https://www.artoprintingpbg.com/config.json` -> HTTP 404 Not Found (Content-Type: `text/html; charset=utf-8`, custom 404 page).
- **Findings**: File `config.json` is missing from the public repository serving Arto Printing. Gateway requests expecting JSON configuration contract v1 receive HTML error pages, leading to upstream 502/422 responses.
- **Status**: VERIFIED (Read-Only observation).

## 3. Focused Unit & Regression Tests (Prior Audits)
- **PUB-004-FIX & Browse/Write tests**: 54 PASS, 0 FAIL.
- **PUB-005 Tester File Manager**: 66 PASS, 0 FAIL across 9 suites.

## 4. ADM-008 Admin Dashboard Local Test & Dry-Run Verification (2026-11-23)
- **Test ID**: ADM-008 Admin Dashboard Suite & Dry-Run
- **Date / Timestamp**: 2026-11-23
- **Environment**: Local Node.js 22 & Wrangler CLI
- **Branch / Commit**: `dev` (clean working tree)
- **Command 1**: `npm test`
  - **Exit Code**: 0
  - **Result**: PASS (`261 tests`, `261 PASS`, `0 FAIL`, `0 skipped`, `44 test suites`).
  - **Dashboard Test Files Executed**:
    - `test/dashboard-crypto.test.js` (AES-256-GCM encryption, IV uniqueness, tampering/auth, key constraints, size ceiling)
    - `test/dashboard-storage.test.js` (Encrypted metadata storage, SHA handling, plaintext rejection)
    - `test/dashboard-registry.test.js` (Public repository discovery, pagination, config/CNAME/assets validation)
    - `test/dashboard-refresh.test.js` (Durable Object background refresh coordination, progress, cancel, retry failures-only, snapshots)
    - `test/dashboard-router.test.js` (Admin JWT boundary, UI shell availability, protection of mutation/data routes)
    - `test/dashboard-api.test.js` (Metadata upsert, bulk project-type updates, validation, export)
- **Command 2**: `npx wrangler deploy --dry-run --outdir /tmp/dekeku-dashboard-dry-run`
  - **Exit Code**: 0
  - **Result**: PASS (Wrangler dry-run build successful; displays binding `env.DASHBOARD_REFRESH` to `DashboardRefreshCoordinator` Durable Object and environment variables `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`, `ALLOWED_ORIGINS`).
- **Secret List & Remote Deployment**: NOT RUN (per strict execution policy "jangan melakukan deployment" and offline sandbox limitations).
- **Production**: NOT TOUCHED.


## EVD-PUB-DATA — GitHub implementation handoff (2026-11-23)

| Evidence ID | Jenis | Sumber | Lokasi / Referensi | Kesimpulan |
|---|---|---|---|---|
| PUBDATA-SRC-01 | Source | GitHub branch dev | `src/modules/public/resource-registry.js`, `resource-validators.js` | Resource allowlist and Guestbook schema added; execution NOT VERIFIED |
| PUBDATA-SRC-02 | Source | GitHub branch dev | `src/modules/public/storage-engine.js`, `src/modules/public/index.js` | Shared bounded parser, Project Origin resolver, public repository check, fixed-path write and SHA retry added; execution NOT VERIFIED |
| PUBDATA-SRC-03 | Source | GitHub branch dev | `src/modules/public/submit.js`, `src/core/router.js` | Generic route and legacy alias added; execution NOT VERIFIED |
| PUBDATA-TEST-01 | Test source (historical checkpoint) | GitHub branch dev | `test/public-submission.test.js` | NOT RUN at initial GitHub-only handoff; later owner-reported execution is recorded under `PUBDATA-TERMUX-02`. |
| PUBDATA-DOC-01 | Documentation | GitHub branch dev | `docs/PUBLIC_DATA_API.md`, `docs/USAGE.md`, `docs/GUESTBOOK_INTEGRATION.md` | Documentation updated |
| PUBDATA-TERMUX-01 | Historical pending checkpoint (superseded) | Local Termux required | Focused test, syntax/build, approved full suite, diff review | NOT RUN at that earlier checkpoint; superseded by owner-reported `PUBDATA-TERMUX-02` for the focused test and syntax checks. |

No live project repository data was written or deleted by this GitHub source/documentation work. No Cloudflare deployment or Production change was performed.

| PUBDATA-SEC-02 | Test source (historical checkpoint) | GitHub branch dev | `test/public-submission.test.js` | Regression case added; initially NOT RUN. Later included in owner-reported focused 14/14 run `PUBDATA-TERMUX-02`. |


## 5. Public Data API focused Termux validation — owner-reported (2026-11-23)

> Status note: `PUBDATA-TERMUX-01` is retained as historical evidence of the earlier pending state. It is superseded only for the focused test and seven syntax checks by `PUBDATA-TERMUX-02`; it is not evidence of full-suite, remote, live-write, Worker-runtime, or deployment validation.

- **Evidence ID**: PUBDATA-TERMUX-02
- **Environment**: Owner's local Termux / Ubuntu proot checkout.
- **Command**: `node --test test/public-submission.test.js`
- **Result**: **14 PASS, 0 FAIL, 0 cancelled, 0 skipped, 0 todo**.
- **Coverage**: generic Guestbook POST without JWT; legacy alias; append with SHA; unknown resource; missing/untrusted Origin; malformed payload and unsupported fields; private repository rejection; POST-only enforcement; request byte limit; config schema-v1 validation; SHA-conflict retry; malformed stored array; path traversal/nested resource rejection; and public-route rejection of the File Manager project-origin override header.
- **Syntax validation**: `node --check` succeeded for all 7 changed files: `src/core/router.js`, `src/modules/public/index.js`, `src/modules/public/resource-registry.js`, `src/modules/public/resource-validators.js`, `src/modules/public/storage-engine.js`, `src/modules/public/submit.js`, and `src/modules/github/repositories.js`.
- **Commit identity**: exact local tested HEAD SHA was not supplied; therefore this evidence is not yet cryptographically tied to the GitHub `dev` HEAD. The SHA `d8dd289` was the earlier pre-documentation-update PR head recorded at audit time; subsequent documentation commits advanced `dev`, so it must not be treated as the current branch head.
- **Scope boundary**: focused local tests and syntax checks only. No remote integration test, live project data write, Worker runtime test, or deployment is claimed. Production remains untouched.


## 6. GitHub Actions PR Validation — run #51 (2026-11-23)

- **Evidence ID:** CICD-PR-051
- **Workflow:** PR Validation
- **Run ID / number:** `45080601189` / #51
- **Commit:** `98d7163add0452832afefeda1462aad5f187ac43`
- **Result:** SUCCESS
- **Reported test result:** 139 PASS, 0 FAIL, 0 skipped; 19 test suites.
- **Other checks:** `npm ci` PASS; syntax checks on 64 JavaScript files PASS; `npx wrangler deploy --dry-run` PASS; `npm audit` reported 0 vulnerabilities.
- **Run URL:** https://github.com/wahyuajismustofa30/dekeku-api/actions/runs/45080601189
- **Scope:** CI validation only. The run did not deploy a Worker, verify a live Worker runtime, or perform a live project-repository write. It is evidence for the stated commit; later documentation-only commits on `dev` were not automatically validated by this run.
- **Test mapping note:** CI reported four Public Data API source files without individual test mapping; the changed focused test file `test/public-submission.test.js` was run. Do not infer per-file coverage beyond the actual workflow output.

## 7. Current branch / CI provenance reconciliation — 2026-11-23
### Subsequent documentation-only validation — run #79 and final correction

- **Run #79:** ID `45082860459`, SUCCESS on commit `f951f1a257584bf7b61061e60ea625f3e2e60d07`; all returned PR Validation steps completed successfully.
- **Final documentation correction:** commit `86bd6807d743067558f2621172bfa9675df3e951` updates only `project/PROGRESS.md` status wording. The PR-triggered workflow query returned no run for this exact final SHA at check time; combined commit status returned no statuses.
- Therefore run #79 validates the preceding documentation state, not the final `86bd680` commit. No application source or test code changed in the final correction.


### Documentation repair CI — run #74 (2026-11-23)

- **Commit:** `70046cfcba5cefec99e8772f62aeef644bfd91a5`.
- **Run ID / number:** `45082714389` / #74.
- **Result:** SUCCESS; PR Validation job completed all listed steps successfully, including dependency install, JavaScript syntax, Wrangler config/bundle dry-run, focused regression tests, and dependency audit.
- **Job:** `137394247834` — `PR Validation (Development → Main)`; all returned step summaries were `completed / success`.
- **Scope:** validates this documentation repair commit only. No deployment, live Worker runtime, or live repository write.


- **Latest audited branch:** `dev`.
- **Pre-repair baseline HEAD:** `e2bc6f41000b756120ac4dc1405dbe9341a89477` (`e2bc6f4`).
- **PR #29:** OPEN and unmerged at the latest PR-state query; no merge or deployment performed.
- **PR workflow query for exact HEAD:** returned an empty `workflow_runs` list. Record this narrowly as **no PR-triggered workflow run returned for this SHA by the queried endpoint**; do not infer a universal absence of checks.
- **Historical CI evidence:** run #51 SUCCESS is tied to `98d7163add0452832afefeda1462aad5f187ac43`, not the latest HEAD. Reported results remain 139 PASS, 0 FAIL, 0 skipped across 19 suites; npm ci, 64-file syntax checks, Wrangler dry-run, and npm audit 0 vulnerabilities. This evidence does not roll forward to later commits.
- **Public Data API local evidence:** `PUBDATA-TERMUX-02` remains OWNER-REPORTED 14/14 focused tests plus seven syntax checks PASS; exact tested local SHA unknown, so provenance against the latest PR head is NOT VERIFIED.
- **Admin Dashboard local evidence:** 261/261 tests and Wrangler dry-run PASS are OWNER-REPORTED local evidence only; exact tested SHA/Node version not supplied. Dashboard remains PAUSED; this evidence does not prove current-head CI, Development runtime, or deployment.
- No live Worker runtime, live project-repository write, or deployment is established by the evidence above. Production remains untouched.
