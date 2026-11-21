

## 9. RBAC Program — Approved Next Work (2026-11-21)
- RBAC architecture approved; full stage/task tracker: [RBAC_PLAN.md](RBAC_PLAN.md).
- Roles: Admin, User, Guest with distinct scopes. User JWT uses `aud=dekeku-user`, `role=user`, 30-minute lifetime; existing Admin audience remains distinct.
- Private account and repository mappings live in private `dekeku-db`; password hashes use PBKDF2-SHA256; Admin alone creates/manages accounts and mappings.
- User CRUD is restricted to `assets/data/` in repositories mapped to that user. Guestbook writes target mapped website repository `assets/data/bukutamu.json`; static public reads bypass Worker.
- Legacy Guestbook files at `public/data/{hostname}/bukutamu.json` must remain untouched until a separate migration decision.
- Current implementation status: RBAC-01 through RBAC-09 NOT STARTED. Next: RBAC-01 private account storage and repository mapping.
- `npm test`: NOT RUN by explicit user instruction. Syntax/static checks: NOT RUN. Development runtime: NOT VERIFIED. No source code, secrets, Wrangler config, Cloudflare settings, Production resources, or deployment changed in this documentation checkpoint.
