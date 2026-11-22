# BACKLOG — DEKEKU API Gateway

*Catatan Acuan*: Rincian progres fitur ada di [PROGRESS.md](PROGRESS.md). Rekomendasi teknis ada di [RECOMMENDATIONS.md](RECOMMENDATIONS.md). Rencana repository privat/RBAC hanya referensi historis dan telah diarsipkan di [TASK_ARCHIVE.md](TASK_ARCHIVE.md) A-003.

> **Penting:** bagian prioritas dan checklist historis di bawah bukan antrean kerja aktif. Status tunggal ada di `PROGRESS.md`; satu-satunya urutan kerja aktif ada di `EXECUTION_POLICY.md`. Item yang tidak aktif atau diarsipkan tidak boleh dilanjutkan otomatis.

## High Priority (Security & Reliability)
- [x] Perbaikan Temuan Kode Write Engine (F-01 s/d F-04) - COMPLETED & VERIFIED.
- [x] Penyesuaian Tes Legacy Core (18/18 PASS in `test/github-core.test.js`) - COMPLETED & VERIFIED.
- [x] **P0 — R-001:** Pembatasan origin Tester Dashboard untuk mencegah pengiriman JWT ke origin eksternal — IMPLEMENTED.
- [x] **P1 — R-004:** Hardening validasi wildcard CORS — IMPLEMENTED.
- [x] **P1 — R-005:** Pemisahan test lokal dan remote Development — IMPLEMENTED.
- [DEFERRED] **P1 — R-006:** Verifikasi Cloudflare WAF rate limiting ditunda atas keputusan pemilik proyek. Jangan konfigurasi atau verifikasi sebelum diminta.
- [ ] Failed-login Audit Logging (R-007), tanpa merekam secret atau data sensitif.
- [x] **P1 — R-002:** Dashboard Tester mengikuti kontrak respons login `access_token` — IMPLEMENTED.
- [x] **P1 — R-003:** Header JSON dan penanganan submit Guestbook Dashboard — IMPLEMENTED.

## Medium Priority (Features & Refinements)
- [x] Phase 2.3: Guestbook Module (`POST /api/v1/public/submit`) - COMPLETED & VERIFIED (PR #7 MERGED).
- [x] Automatic SHA retrieval for Write Engine Tester (authenticated lookup endpoint + tester integration; regression tests added, verification pending).
- [ ] Integrasi Frontend Statis dengan endpoint publik.
- [ ] JWT Revocation.
- [ ] Reduksi Metadata Public Endpoints.
- [ ] Validasi Tipe Konten File.
- [ ] GitHub Client Retry Logic.

## Low Priority (Maintenance)
- [x] **R-008:** Sinkronisasi dokumentasi test, status fitur, changelog, dan checkpoint berdasarkan laporan hasil tes terbaru; provenance dicatat sebagai laporan pengguna.
- [ ] **R-009:** Dokumentasikan prosedur rotasi secret dan persyaratan password admin.
- [ ] **R-010:** Evaluasi migrasi Personal Access Token ke GitHub App.
- [ ] **R-011:** Evaluasi Workers Analytics Engine untuk metrik agregat.
- [ ] Structured Logging.
- [ ] API Versioning Strategy.

## Status Implementasi R-001 s/d R-005 (2026-11-21)
- Source changes telah diterapkan pada `src/modules/tester/index.js` dan `public/tester.html`.
- Regression test baru ditambahkan pada `test/tester-dashboard.test.js` dan dimasukkan ke script `npm test`.
- Isolated JavaScript harness terhadap Dashboard aktual: PASS untuk same-origin, pemisahan JWT publik/admin, login `access_token`, penanganan 401, JSON Guestbook, dan double-submit.
- CORS isolated harness: PASS untuk exact origin, wildcard subdomain, apex exclusion, dan 9 kelas origin yang ditolak.
- R-005: `npm test` memakai daftar suite lokal eksplisit; `npm run test:remote` terpisah. Global fetch mocks dipulihkan melalui `afterEach`/`finally`.
- `npm run check`: PASS dan `npm test`: 149 PASS, 0 FAIL, 0 SKIP berdasarkan laporan pengguna (21-11-2026, branch `dev`, commit `a6a089d`). Remote test: NOT RUN. Deployment/runtime Development: NOT VERIFIED. R-001 s/d R-005 ditutup pada sisi implementasi; verifikasi runtime tetap terpisah.

## Catatan Status
- Item yang belum dicentang adalah pekerjaan yang belum dinyatakan selesai.
- Persetujuan keputusan arsitektur tidak sama dengan bukti konfigurasi runtime telah diterapkan.
- Jangan menandai item selesai hanya berdasarkan rekomendasi atau dokumentasi; wajib ada bukti implementasi dan tes.


## Current Focus — Public Repository Management (2026-11-22)

Private-repository setup, private account storage, User repository mapping, and related RBAC expansion are OUT OF CURRENT SCOPE and archived. Do not continue those tasks unless the owner explicitly reactivates them. Existing source code and historical records are preserved; this scope change does not delete or disable implemented functionality.

### Public repository management tasks
- [ ] **PUB-001 — Define public project repository contract.** Finalize the config.json schema and trusted Origin-to-public-repository resolution rules.
- [ ] **PUB-002 — Resolve the target public repository server-side.** Validate repository owner, name, visibility, and default branch; do not accept arbitrary client-supplied repository coordinates.
- [ ] **PUB-003 — Route Admin file operations to the selected public repository.** Ensure SHA lookup and CREATE/UPDATE/DELETE use the same validated project repository context.
- [ ] **PUB-004 — Add public repository file browsing.** List directories/files with safe path validation, pagination, and bounded responses.
- [ ] **PUB-005 — Complete the Tester as a public JSON file manager.** Select project/repository, browse files, inspect/edit JSON, and create/update/delete safely.
- [ ] **PUB-006 — Verify end-to-end on Development.** Test multiple public repositories, access boundaries, SHA conflicts, and error handling without touching Production.

**Execution rule:** work only on dev; do not change Production, private-repository configuration, secrets, or real website data without separate explicit approval.
## CI/CD Development Automation — Owner-Approved Tasks (2026-11-21)

**Target workflow:** local/repository development on `dev` → Pull Request to `main` after stable → PR validation → merge/update `main` → automatic deployment to Development Worker `dekeku-api-dev` only.

- [x] **CICD-001 — Audit deployment target and Wrangler configuration (CRITICAL).** READ-ONLY audit complete at dev HEAD `09df42e24ab911efa5ed2541f7e80ddb665c20b7`: no workflow files; Worker `dekeku-api-dev`; no named Wrangler environment or deploy script; Actions secrets/settings NOT VERIFIED; branch metadata says dev/main `protected=false`. Read-only audit of `wrangler.jsonc`, Worker name/environment, deployment command, and current GitHub Actions state. Confirm the exact Development target; do not modify Cloudflare or Production.
- [x] **CICD-002 — Reconcile branch policy (HIGH).** Reviewed AGENTS.md, MASTER.md, README.md, D-025, and GitHub branch metadata. Policy consistent: work on `dev`, PR to `main`, no direct commits/pushes to `main`. Branch protection is not active per branch metadata; no settings changed. Ensure all current instructions consistently state that development occurs on `dev`, PR target is `main`, and direct commits/pushes to `main` are prohibited.
- [x] **CICD-003 — Define PR validation contract (HIGH).** COMPLETE — DEFINED. Normative contract: `project/CICD_VALIDATION_CONTRACT.md`. Required/blocking: `npm ci`, syntax checks for relevant JS under `src/` and `test/`, Wrangler `deploy --dry-run`, and mapped focused tests for changed code. Initial warnings: `npm audit --audit-level=high` and unmapped test coverage. `npm test` and remote tests remain excluded.
- [x] **CICD-004 — Add PR validation workflow (HIGH).** Implemented `.github/workflows/pr-validation.yml` on `dev`: PR `dev` → `main` only, no deployment, read-only permissions, pinned actions, dependency install, JS syntax, Development-target Wrangler dry-run, mapped focused tests, warning-only npm audit. Actual PR run NOT VERIFIED; no PR created and no branch protection changes.
- [ ] **CICD-005 — Add main-to-Development deployment workflow (CRITICAL).** On updates to `main`, deploy only to `dekeku-api-dev` using an explicit Development target. Do not deploy Production.
- [ ] **CICD-006 — Isolate Development credentials (CRITICAL).** Use dedicated GitHub Actions secrets/variables for Development only. Never reuse or expose Production credentials. Confirm required values without printing secret contents.
- [ ] **CICD-007 — Add deployment safety controls (HIGH).** Serialize/cancel overlapping deployments safely, restrict workflow permissions, verify target identity, record commit SHA and deployment result, and fail closed on ambiguity.
- [ ] **CICD-008 — Validate workflow behavior (HIGH).** Verify PR validation pass/fail behavior, main deployment success/failure handling, missing Development credentials, wrong-target rejection, and concurrency behavior using safe CI evidence.
- [ ] **CICD-009 — Verify Development deployment (HIGH).** Confirm the deployed version and Development URL/health response after CI deployment. Do not probe or modify Production.
- [ ] **CICD-010 — Close documentation and checkpoint (MEDIUM).** Update policy, workflow instructions, progress, checkpoint, and changelog using actual CI evidence.

**Execution order:** CICD-001 → CICD-002 → CICD-003 → CICD-004/CICD-006/CICD-007 → CICD-005 → CICD-008 → CICD-009 → CICD-010.

**Current status:** CICD-001 through CICD-004 implementation COMPLETE; CICD-004 CI run NOT VERIFIED. CICD-006 is next active task, followed by CICD-007 safeguards; CICD-005 deployment workflow remains gated on those tasks. CICD-005..010 remain PLANNED / NOT STARTED. This task list does not authorize Production changes or deployment before the Development-only workflow is implemented and verified.

## Owner Update — Branch Sync & Existing Cloudflare Deployment (2026-11-22)

- [x] Keep repository branch inventory to exactly `main` and `dev`.
- [x] Fast-forward `dev` to `main` at `1649701419f6d1b03b5f659c76f02d02b4355ad8`; comparison confirmed identical after synchronization.
- [x] Confirm `.github/workflows/pr-validation.yml` is present and has no deployment step.
- [ ] Trigger and inspect an actual PR validation run using a documentation-only PR.
- [ ] Verify Cloudflare Workers GitHub integration from the authorized dashboard: connected repository, development/production branch mapping, target Worker name, deployment version and health. Owner reports setup and successful deployment, but independent evidence is not yet recorded.
- [ ] Reassess CICD-005..010 after confirming the existing Cloudflare integration. Avoid creating a duplicate GitHub Actions deployment workflow.
- **Safety:** do not create a third branch; do not merge PR independently; do not touch Production; do not run `npm test` or remote tests.

## PR #23 Validation State (2026-11-22)

- [x] Created documentation-only PR #23 from `dev` to `main`: https://github.com/wahyuajismustofa30/dekeku-api/pull/23
- [ ] Inspect actual GitHub Actions result for PR #23; workflow-runs and combined-status lookups returned no results at checkpoint time.
- [ ] Do not merge until required validation succeeds and owner approves.


## Tester Dashboard UI — 2026-11-22
- [x] Implementasi redesign workspace bergaya phpMyAdmin pada kedua salinan halaman Tester.
- [x] Tambahkan regression assertion untuk navigasi dan panel UI.
- [x] Periksa sinkronisasi HTML statis dan generated route.
- [ ] Jalankan pemeriksaan otomatis yang diizinkan (tanpa `npm test`) dan verifikasi tampilan di Development.
- [ ] Review hasil sebelum commit/PR; jangan deploy Production.
