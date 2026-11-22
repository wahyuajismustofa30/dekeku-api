# TASK BACKLOG — DEKEKU API Gateway

Tanggal Pembaruan: 2026-11-22 (Fokus Aktif: Pengelolaan Repository Publik — PUB-004-FIX Security Audit Complete)

Dokumen ini adalah daftar periksa teknis mendetail. Status ringkas terbaru proyek dikelola secara terpusat di `project/PROGRESS.md`.

## Catatan Penting Otoritas & Status
1. **Otoritas**: Wahyu (Pemilik Proyek) memegang otoritas tertinggi.
2. **Ruang Lingkup Aktif Saat Ini**: Pengelolaan data publik pada repository publik masing-masing proyek (PUB-001 s/d PUB-006).
3. **Pekerjaan Diarsip (A-003)**: Pengaturan repository privat `dekeku-db`, private account storage, mapping, dan perluasan RBAC dipindahkan ke arsip di `project/TASK_ARCHIVE.md`.
4. **Strategi CI/CD**: Workflow `.github/workflows/pr-validation.yml` dikonfigurasi untuk validasi PR `dev` → `main`. Auto-deployment Cloudflare Workers dari GitHub dilaporkan aktif oleh pemilik; target deployment terbatas pada Development Worker `dekeku-api-dev`. Production Worker `github`, `api.dekeku.my.id`, secret, dan data Production tidak disentuh.

---

## Workstream 1: Pengelolaan Repository Publik (ACTIVE WORKSTREAM)

- [x] **PUB-001 — Define public project repository contract.** COMPLETE (specification only): `project/PUBLIC_REPOSITORY_CONTRACT.md` dan `docs/schemas/public-repository-config.schema.json`. Runtime enforcement is PUB-002.
- [x] **PUB-002 — Enforce public repository config and trusted Origin.** Schema v1, exact canonical HTTPS Origin, owner/name, GitHub identity, public visibility, and default branch checks implemented. Focused metadata tests 12/12 PASS. Development runtime NOT VERIFIED.
- [x] **PUB-003 — Resolve and route Admin file operations to the selected public repository.** Shared resolver wired to SHA lookup and CREATE/UPDATE/DELETE; focused regression tests verified (54/54 PASS across combined suites).
- [x] **PUB-004 — Add public repository file browsing (PUB-004-FIX Security Audit Complete).** Endpoint `GET /api/v1/admin/browse` audited and remediated with Admin JWT, path validation (`public/` only), child path exact matching, hidden/sensitive file rejection, mode `"120000"` (symlink) & mode `"160000"` (submodule) rejection, mode allowlist (`100644`/`100755`/`040000`), accurate upstream truncation detection (Contents API >= 1000 items & Git Trees API `truncated`), max 1000 items cap, `truncated` flag, pagination, and metadata-only output. Verified via `node --test` (22/22 PASS in browse suite, 54/54 total across PUB-002/003/004).
- [ ] **PUB-005 — Complete the Tester as a public JSON file manager.** Select project/repository, browse files, inspect/edit JSON, and create/update/delete safely.
- [ ] **PUB-006 — Verify end-to-end on Development.** Test multiple public repositories, access boundaries, SHA conflicts, and error handling without touching Production.

---

## Workstream 2: CI/CD & Testing Infrastructure (TARGET APPROVED — STANDBY)

- [x] **CICD-001 — Audit repository CI/CD & deployment configuration.** Read-only audit complete on `dev` commit `09df42e`. No workflow files, secrets, or deployment configs changed.
- [x] **CICD-002 — Establish workflow trigger boundary.** APPROVED TARGET POLICY: PRs run validation only; merges to `main` trigger Development-only deployment.
- [x] **CICD-003 — Define PR validation check matrix.** SPEC COMPLETE: `project/CICD_VALIDATION_CONTRACT.md`.
- [x] **CICD-004 — Implement PR validation workflow.** Workflow `.github/workflows/pr-validation.yml` implemented on `dev`. Validation runs on PR to `main`.
- [ ] **CICD-005 — Implement PR check status reporting.** Awaiting first live PR validation run.
- [ ] **CICD-006 — Audit Cloudflare Worker deployment targets.** Development Worker `dekeku-api-dev` approved; Production Worker `github` protected. Existing Cloudflare Git integration needs dashboard verification.
- [ ] **CICD-007 — Configure GitHub deployment credentials for Development.** Development-only API token / credentials configuration.
- [ ] **CICD-008 — Create Development deployment workflow.** Deployment triggered only on merge to `main` targeting `dekeku-api-dev`.
- [ ] **CICD-009 — Implement post-deployment smoke test.** Automated health check against `dekeku-api-dev`.
- [ ] **CICD-010 — Verify end-to-end CI/CD execution.** Complete PR validation, merge, deployment, and verification flow on Development.
