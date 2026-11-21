

## RBAC Program — Approved Architecture (2026-11-21)
- **Status**: DESIGN APPROVED; implementation not started.
- Detail and task tracker: [RBAC_PLAN.md](RBAC_PLAN.md).
- Roles: Admin (all API-managed data), User (only owned registered repositories under `assets/data/`), Guest (public Guestbook submission only).
- User JWT: audience `dekeku-user`, role `user`, lifetime 30 minutes; Admin retains `dekeku-admin` audience.
- Account and repository mapping storage: private `dekeku-db` repository; PBKDF2-SHA256 password hashes; server-authoritative mapping; multiple repositories per User.
- Guestbook target: each mapped website repository at `assets/data/bukutamu.json`; public reads use static repository/CDN URLs.
- Existing `public/data/{hostname}/bukutamu.json` files must not be deleted or migrated automatically.
- Next stage: RBAC-01 private account storage and repository mapping. `npm test`: NOT RUN by user instruction; syntax checks and runtime verification: NOT RUN / NOT VERIFIED.
