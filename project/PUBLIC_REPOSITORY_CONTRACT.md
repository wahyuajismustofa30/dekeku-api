# Public Project Repository Config Contract

- **Contract ID:** PUB-CONFIG-001
- **Version:** 1
- **Status:** IMPLEMENTED IN SOURCE; focused regression tests PASS; Development runtime NOT VERIFIED
- **Scope:** Public repository metadata only. This contract does not configure private repositories, credentials, user accounts, or RBAC.

## 1. Purpose

Each website project publishes one `config.json` at the root of its own HTTPS origin. DEKEKU API Gateway reads this public file to discover which public GitHub repository belongs to the requesting project.

The file is discovery metadata, not an authentication credential and not proof that the caller is authorized.

## 2. Canonical JSON structure

The normative JSON Schema is [public-repository-config.schema.json](../docs/schemas/public-repository-config.schema.json).

Example:

```json
{
  "schema_version": 1,
  "project": {
    "id": "dekeku"
  },
  "repository": {
    "username": "wahyuajismustofa30",
    "repo": "dekeku-web"
  }
}
```

### Field definitions

| Field | Required | Rules |
|---|---:|---|
| `schema_version` | Yes | Integer constant `1`; unsupported versions must be rejected |
| `project.id` | Yes | Stable lowercase slug, 2–48 chars, letters/numbers separated by single hyphens |
| `repository.username` | Yes | GitHub owner/login; 1–39 chars; GitHub-compatible alphanumeric/hyphen format |
| `repository.repo` | Yes | GitHub repository name; 1–100 chars; letters, numbers, dot, underscore, hyphen; exact `.` and `..` segments are forbidden |

Unknown properties are rejected in contract v1. Values are case-insensitive only where GitHub treats them that way; preserve the published spelling when displaying metadata.

## 3. Repository and branch rules

1. The repository must exist and have GitHub visibility `public`.
2. For the current supported deployment model, `repository.username` must match the configured trusted GitHub owner (`GITHUB_OWNER`), case-insensitively. Supporting multiple owners requires a separate explicit owner allowlist decision; never trust an arbitrary owner from this file.
3. The GitHub repository API's `default_branch` is authoritative. Contract v1 intentionally does not accept a branch field, so a public config cannot redirect writes to an arbitrary branch or silently inherit the Gateway's storage branch.
4. A repository name in this file does not grant access to any file by itself. API path policy and admin authentication remain mandatory.

## 4. Origin-to-config discovery rules

1. The request must contain a canonical HTTPS `Origin` (scheme + host only; no credentials, path, query, fragment, or non-default port).
2. Origin must be trusted for repository discovery by an exact canonical HTTPS entry or an explicitly configured subdomain wildcard in `ALLOWED_ORIGINS`. A wildcard such as `*.dekeku.my.id` matches one or more DNS labels below `dekeku.my.id` (including nested subdomains), but does not match the apex `dekeku.my.id` itself. Matching is case-insensitive and uses a DNS-label boundary, so lookalike suffixes such as `notdekeku.my.id` are rejected. Wildcard trust applies only to canonical HTTPS Origins with no port, path, credentials, query, or fragment.
3. Fetch only `https://{validated-origin}/config.json`; do not accept a client-supplied config URL, repository URL, API URL, or redirect target.
4. Fetch with redirects disabled, credentials omitted, an 8-second timeout, and a 32 KiB maximum response body.
5. Require a successful response and valid UTF-8 JSON matching this schema. Reject missing, malformed, oversized, unsupported-version, or invalid-field documents.
6. After parsing, verify repository existence, owner policy, and public visibility using GitHub's API before using it as a target.
7. Origin is a project selector, not user authentication. Every administrative write must still require a valid Admin JWT. Non-browser callers can forge an `Origin` header; authorization must never depend on that header alone.

8. The DEKEKU Tester is served from the Gateway's own origin, so browser JavaScript cannot set the forbidden `Origin` request header to select a different project. For this first-party Tester only, the client may send `X-DEKEKU-Project-Origin` with the desired project Origin. The server validates this value using the same exact-origin or configured wildcard HTTPS rules from `ALLOWED_ORIGINS` and then fetches that Origin's `/config.json`; the header never supplies an owner, repository, or branch.
9. If `X-DEKEKU-Project-Origin` is present but invalid or untrusted, reject the request. Do not silently fall back to the actual request `Origin`. If the selector header is absent, existing website requests continue to use the browser-supplied `Origin` header.
10. The selector header is a repository selector only, not authentication or authorization. All Admin browse/read/write operations still require a valid Admin JWT, and the repository owner, public visibility, and default branch are validated server-side as above.

## 5. Explicitly prohibited fields

Do not publish any of the following in `config.json`:

- GitHub tokens, API keys, passwords, JWTs, hashes, or Cloudflare secrets.
- Private repository identifiers or private storage mappings.
- Client-controlled GitHub API base URLs, raw content URLs, or arbitrary endpoints.
- A branch override in schema v1.
- Any setting that relaxes server-side path, file-size, authentication, or repository-owner policy.

## 6. Compatibility and implementation status

The current implementation in `src/modules/github/repositories.js` enforces the schema-v1 object shape, required project ID and repository fields, rejects unknown fields, validates owner against `GITHUB_OWNER`, and verifies GitHub repository identity, public visibility, and the repository's safe `default_branch`.

Trusted Origin validation accepts:
- Exact canonical HTTPS Origin entries; and
- Configured HTTPS subdomain wildcard entries such as `*.dekeku.my.id` and `*.artoprintingpbg.com`.

A wildcard matches one or more subdomain labels (including nested subdomains), but not the apex domain. Matching is case-insensitive and respects DNS-label boundaries. HTTP, explicit non-default ports, credentials, paths, query strings, fragments, and deceptive suffixes are rejected. Origin remains a project selector, never authentication.

PUB-002 through PUB-005 implementation is present in the current source:
- PUB-003 uses `resolveProjectRepository(request, env)` for Admin SHA lookup and CREATE/UPDATE/DELETE.
- PUB-004/PUB-004-FIX implements `GET /api/v1/admin/browse` using Git Trees traversal, `public/` restriction, traversal and hidden/sensitive filtering, symlink/submodule/unknown-mode rejection, exact child path matching, truncation reporting, pagination, and metadata-only responses.
- PUB-005 adds the first-party Tester selector `X-DEKEKU-Project-Origin`, authenticated JSON reader `GET /api/v1/admin/write/file`, and File Manager in both Worker-served and static Tester copies. Admin JWT remains mandatory for all admin operations.

Owner-reported focused regression evidence:
- PUB-004-FIX focused suite: 47 PASS, 0 FAIL, 0 SKIP.
- Wildcard Origin metadata suite: 16 PASS, 0 FAIL.
- PUB-005 seven-file regression command: 66 PASS, 0 FAIL, 0 skipped (9 suites).
- Development runtime and browser end-to-end behavior: NOT VERIFIED.

The PR containing PUB-005 and wildcard Origin support (#26) has been merged. Remote `main` and `dev` were verified identical at merge commit `c7cdd582003d7162a3842fd9ec612224fc733921`. Merge status does not prove a live Development deployment. Verify the active Worker/version and run PUB-006 before treating the full workflow as operationally accepted.

## 7. Acceptance criteria for PUB-001

- [x] Versioned JSON structure documented.
- [x] Required fields and validation constraints defined.
- [x] Owner and public-visibility restrictions defined.
- [x] Branch selection rule defined (GitHub default branch; no config override in v1).
- [x] Origin discovery, trust, fetch, timeout, redirect, and size rules defined.
- [x] Security boundary clarified: Origin is not authentication.
- [x] Current implementation gaps documented without claiming runtime enforcement.
