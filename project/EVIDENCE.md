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

## 3. Focused Unit & Regression Tests (Owner-Reported / Prior Audits)
- **PUB-004-FIX & Browse/Write tests**: 54 PASS, 0 FAIL.
- **PUB-005 Tester File Manager**: 66 PASS, 0 FAIL across 9 suites.
- **`npm test`**: NOT RUN (per strict project execution policy).
