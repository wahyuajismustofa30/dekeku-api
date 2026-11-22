# Public Data API — Reference

Status on `dev`: IMPLEMENTED. Owner-reported focused Termux validation PASS (14/14); exact tested local SHA not yet confirmed against PR #29.

## Endpoint contract

`POST /api/v1/public/data/{resource}`

- Public route; no Admin JWT.
- `Content-Type: application/json` required.
- Browser Origin must be a canonical HTTPS origin trusted by `ALLOWED_ORIGINS`.
- Public submissions explicitly ignore `X-DEKEKU-Project-Origin`; that selector remains reserved for the authenticated File Manager workflow. The public route is bound to the request's actual `Origin` header.
- Resource names are matched against the server-side registry. Unknown or disabled resources return 404; methods other than the registered method return 405.
- The client cannot select repository owner, repository, branch, storage path, schema, or size limits.

The first registered resource is `guestbook`.

## Guestbook schema

Request:

```json
{
  "name": "Visitor",
  "message": "Hello",
  "email": "visitor@example.com"
}
```

- `name`: required string, trimmed, 1–100 characters.
- `message`: required string, trimmed, 1–1000 characters.
- `email`: optional string, max 254 characters; omitted when empty.
- Unknown properties are rejected.
- Worker adds `createdAt` (ISO 8601).
- Request body limit: 15,360 bytes.
- Stored JSON file limit: 1 MiB.
- Stored document shape: JSON array.
- Fixed storage path: `assets/data/bukutamu.json`.

## Repository resolution and storage

1. Validate request Origin against `ALLOWED_ORIGINS`.
2. Fetch `https://{origin}/config.json` with redirect disabled, timeout 8 seconds, and 32 KiB bounded response.
3. Validate config schema v1 and require `repository.username` to match trusted `GITHUB_OWNER`.
4. Resolve repository through `resolveProjectRepository()`, verify GitHub visibility is public, and use GitHub's `default_branch`.
5. Registry chooses the storage path; no client path or repository coordinate is accepted.
6. Read existing JSON, validate file metadata/SHA/UTF-8/JSON/array shape, then create or update through GitHub Contents API.
7. Retry SHA conflicts up to three attempts; fail with 409 after repeated conflicts.

Origin is a trust selector and browser/CORS boundary, not authentication. The route is public and should receive separate abuse protection (e.g. Cloudflare rate limiting).

## Legacy compatibility

`POST /api/v1/public/submit` delegates directly to the same `guestbook` registry handler. There is no duplicated validation or storage logic.

## Response

HTTP 201 includes `success`, `resource`, `message`, `file`, `path`, `count`, and GitHub blob `sha`.

## Read path

No new public GET endpoint is introduced. Websites read the JSON file directly from their public repository/CDN. Existing Guestbook files are not automatically moved or deleted.

## Validation status

Implementation and test cases are on branch `dev`. Owner-reported local Termux evidence (2026-11-23): `node --test test/public-submission.test.js` — 14 PASS, 0 FAIL; `node --check` — PASS for 7 changed source files. The exact local tested HEAD SHA was not supplied, so this evidence is not conclusively tied to the current `dev`/PR #29 head. Full test suite, remote integration, live repository write, Worker runtime, and deployment remain NOT VERIFIED. Before merge, confirm the tested SHA matches PR #29 head or rerun the focused tests against that exact commit.
