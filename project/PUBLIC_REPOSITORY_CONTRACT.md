# Public Project Repository Config Contract

- **Contract ID:** PUB-CONFIG-001
- **Version:** 1
- **Status:** SPECIFICATION APPROVED FOR IMPLEMENTATION
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
2. Origin must be explicitly trusted for repository discovery. In the current implementation, an exact canonical HTTPS entry in `ALLOWED_ORIGINS` is the trust allowlist; wildcard entries are ignored for repository discovery even though they remain usable for CORS. A broad CORS wildcard is not sufficient evidence that a hostname is an approved project-to-repository mapping.
3. Fetch only `https://{validated-origin}/config.json`; do not accept a client-supplied config URL, repository URL, API URL, or redirect target.
4. Fetch with redirects disabled, credentials omitted, an 8-second timeout, and a 32 KiB maximum response body.
5. Require a successful response and valid UTF-8 JSON matching this schema. Reject missing, malformed, oversized, unsupported-version, or invalid-field documents.
6. After parsing, verify repository existence, owner policy, and public visibility using GitHub's API before using it as a target.
7. Origin is a project selector, not user authentication. Every administrative write must still require a valid Admin JWT. Non-browser callers can forge an `Origin` header; authorization must never depend on that header alone.

## 5. Explicitly prohibited fields

Do not publish any of the following in `config.json`:

- GitHub tokens, API keys, passwords, JWTs, hashes, or Cloudflare secrets.
- Private repository identifiers or private storage mappings.
- Client-controlled GitHub API base URLs, raw content URLs, or arbitrary endpoints.
- A branch override in schema v1.
- Any setting that relaxes server-side path, file-size, authentication, or repository-owner policy.

## 6. Compatibility and implementation status

`src/modules/github/repositories.js` now enforces the schema-v1 object shape, required project ID and repository fields, rejects unknown fields, validates owner against `GITHUB_OWNER`, and accepts repository discovery only from exact canonical HTTPS entries in `ALLOWED_ORIGINS` (wildcard entries are excluded). It also verifies that GitHub returns the requested repository identity, public visibility, and a non-empty safe default branch.

PUB-002 resolver/metadata enforcement is implemented and its focused test suite was reported PASS by the owner (12 PASS, 0 FAIL, 0 SKIP); syntax checks were also reported PASS.\n\nPUB-003 now reuses `resolveProjectRepository(request, env)` for Admin SHA lookup and CREATE/UPDATE/DELETE. Every operation resolves the same trusted Origin/config and uses the repository identity plus `default_branch` returned by GitHub. Updated write-router regression tests assert the selected repository branch. Owner-reported syntax checks PASS for four source/test files and combined focused tests PASS (37 PASS, 0 FAIL, 0 SKIP). Development runtime remains NOT VERIFIED.

## 7. Acceptance criteria for PUB-001

- [x] Versioned JSON structure documented.
- [x] Required fields and validation constraints defined.
- [x] Owner and public-visibility restrictions defined.
- [x] Branch selection rule defined (GitHub default branch; no config override in v1).
- [x] Origin discovery, trust, fetch, timeout, redirect, and size rules defined.
- [x] Security boundary clarified: Origin is not authentication.
- [x] Current implementation gaps documented without claiming runtime enforcement.
