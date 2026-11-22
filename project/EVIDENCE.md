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
| PUBDATA-TEST-01 | Test source | GitHub branch dev | `test/public-submission.test.js` | Mock/fixture test cases updated; NOT RUN |
| PUBDATA-DOC-01 | Documentation | GitHub branch dev | `docs/PUBLIC_DATA_API.md`, `docs/USAGE.md`, `docs/GUESTBOOK_INTEGRATION.md` | Documentation updated |
| PUBDATA-TERMUX-01 | Pending validation | Local Termux required | Focused test, syntax/build, approved full suite, diff review | NOT RUN; required before declaring VERIFIED |

No live project repository data was written or deleted by this GitHub source/documentation work. No Cloudflare deployment or Production change was performed.

| PUBDATA-SEC-02 | Test source | GitHub branch dev | `test/public-submission.test.js` | Added regression case proving public route ignores `X-DEKEKU-Project-Origin`; NOT RUN |


## 5. Public Data API focused Termux validation — owner-reported (2026-11-23)

- **Evidence ID**: PUBDATA-TERMUX-02
- **Environment**: Owner's local Termux / Ubuntu proot checkout.
- **Command**: `node --test test/public-submission.test.js`
- **Result**: **14 PASS, 0 FAIL, 0 cancelled, 0 skipped, 0 todo**.
- **Coverage**: generic Guestbook POST without JWT; legacy alias; append with SHA; unknown resource; missing/untrusted Origin; malformed payload and unsupported fields; private repository rejection; POST-only enforcement; request byte limit; config schema-v1 validation; SHA-conflict retry; malformed stored array; path traversal/nested resource rejection; and public-route rejection of the File Manager project-origin override header.
- **Syntax validation**: `node --check` succeeded for all 7 changed files: `src/core/router.js`, `src/modules/public/index.js`, `src/modules/public/resource-registry.js`, `src/modules/public/resource-validators.js`, `src/modules/public/storage-engine.js`, `src/modules/public/submit.js`, and `src/modules/github/repositories.js`.
- **Commit identity**: exact local tested HEAD SHA was not supplied; therefore this evidence is not yet cryptographically tied to the current GitHub `dev` HEAD (`d8dd289` reported in the repository audit).
- **Scope boundary**: focused local tests and syntax checks only. No remote integration test, live project data write, Worker runtime test, or deployment is claimed. Production remains untouched.
