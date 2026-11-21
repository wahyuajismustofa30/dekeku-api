

## RBAC Program — Approved Tasks (2026-11-21)
See [RBAC_PLAN.md](RBAC_PLAN.md) for approved architecture, endpoint inventory, acceptance criteria, and full task breakdown.
- [ ] **RBAC-01** — Private account storage and repository mapping in `dekeku-db`.
- [ ] **RBAC-02** — Role, audience, and ownership middleware (Admin/User isolation).
- [ ] **RBAC-03** — Admin account and repository management endpoints.
- [ ] **RBAC-04** — User login and 30-minute User JWT.
- [ ] **RBAC-05** — User CRUD restricted to owned repositories under `assets/data/`.
- [ ] **RBAC-06** — Enforce private/public data boundary and close unintended public reads.
- [ ] **RBAC-07** — Route Guestbook submissions to each mapped website repository.
- [ ] **RBAC-08** — Browser User session using sessionStorage and safe logout/401 cleanup.
- [ ] **RBAC-09** — Security, regression, and isolation review.
- **Current next task**: RBAC-01. All stages remain NOT STARTED; design approval is not implementation evidence.
- **Verification**: `npm test` NOT RUN per user instruction; syntax checks NOT RUN; Development runtime NOT VERIFIED.
