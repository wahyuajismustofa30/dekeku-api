
## 2026-11-23 — Admin Dashboard implementation (ADM-001..ADM-007)

### Added
- AES-256-GCM encrypted dashboard metadata envelope and private storage adapter for `dekeku-db`.
- Paginated discovery of public repositories belonging to configured `GITHUB_OWNER`.
- Repository inspection for `config.json`, `CNAME`, and `assets/data`.
- Admin Dashboard page at `/admin` with login, table/card views, search, filters, project details, project navigation, quick actions, selection, export, and bulk project-type updates.
- Durable Object refresh coordinator with latest-only job state, progress, cancellation, and failed-item retry.
- Development-only Durable Object binding and migration in `wrangler.jsonc`.

### Policy and verification
- Owner instructed that implementation ADM-001..ADM-007 must finish before tests are run; final tests and runtime checks are deferred to ADM-008.
- Source/config changes are IMPLEMENTED — NOT TESTED. Wrangler validation and Development runtime are NOT VERIFIED.
- `DB_ENCRYPTION_KEY` Development secret has not been configured or verified in this session.
- Production resources were not touched; no PR, merge, or deployment was performed.