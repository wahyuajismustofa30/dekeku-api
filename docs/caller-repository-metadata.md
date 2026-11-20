# Caller Repository Metadata

## Endpoint
`GET /api/v1/github/repository`

## Request flow
1. Worker reads the HTTP `Origin` header.
2. The origin must pass the same HTTPS `ALLOWED_ORIGINS` policy used by CORS.
3. Worker requests the fixed path `/config.json` from that validated origin. It does not accept a URL, owner, or repository from query parameters.
4. The JSON must contain `repository.username` and `repository.repo`.
5. The username must match the Worker-configured `GITHUB_OWNER`; repository names are restricted to a single safe GitHub path segment.
6. Worker requests repository metadata from GitHub and returns it only when GitHub reports the repository as public.

## Security controls
- HTTPS origin only; exact origins and configured wildcard subdomains follow the existing CORS allowlist semantics.
- The config URL is derived from the validated origin and fixed to `/config.json`.
- Redirects are rejected; credentials are omitted; response caching is disabled.
- Config response timeout: 8 seconds. Maximum decoded response size: 32 KiB.
- Invalid JSON, invalid UTF-8, invalid owner/repository values, missing config, and private repositories are rejected.
- The GitHub token is sent only to `api.github.com`, never to the caller origin.
- This endpoint uses Origin as a repository selector, not as user authentication. The returned metadata is public repository metadata.

## Operational boundary
This change is code and test coverage on branch `dev` only. It does not change Wrangler bindings, secrets, Cloudflare configuration, or deploy either Worker. Development runtime verification remains pending.
