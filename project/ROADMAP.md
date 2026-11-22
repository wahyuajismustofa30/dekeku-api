# ROADMAP — DEKEKU API Gateway

Tanggal Pembaruan: 2026-11-22 (Fokus Aktif: Pengelolaan Repository Publik — PUB-004-FIX Security Audit Complete)

## Status Ringkas

- **PUB-001 specification complete**: `project/PUBLIC_REPOSITORY_CONTRACT.md` and `docs/schemas/public-repository-config.schema.json` define the versioned public project config contract.
- **PUB-002 verified locally**: syntax checks PASS and `test/repository-metadata.test.js` 12/12 PASS. Development runtime remains unverified.
- **PUB-003 complete**: Admin SHA/CREATE/UPDATE/DELETE use the shared validated project repository resolver and GitHub-reported default branch; verified via `node --test`.
- **PUB-004 & PUB-004-FIX complete (audited & remediated)**: `GET /api/v1/admin/browse` implemented with Admin JWT, path allowlisting, child path matching, hidden/sensitive file rejection, mode `"120000"` (symlink) & mode `"160000"` (submodule) rejection, mode allowlist (`100644`/`100755`/`040000`), accurate upstream truncation handling (Contents API >= 1,000 items & Git Trees API `truncated`), 1,000 items cap, and pagination; 22/22 PASS in focused suite (54/54 PASS total).
- Prioritas: kelola data publik pada repository masing-masing proyek.
- Tahapan aktif: PUB-001 sampai PUB-006 di [BACKLOG.md](BACKLOG.md).
- Pengaturan repository privat, private account storage, mapping, dan perluasan RBAC diarsipkan (A-003); catatan milestone lama di bawah dipertahankan sebagai sejarah, bukan antrean kerja.
- CI/CD workflow validasi PR (`.github/workflows/pr-validation.yml`) dikonfigurasi untuk PR ke `main`. Pemilik melaporkan Cloudflare Workers auto-deployment dari GitHub telah dikonfigurasi; integrasi dashboard belum diverifikasi independen. Target deployment terbatas pada Development Worker `dekeku-api-dev`. Production Worker `github`, `api.dekeku.my.id`, secrets, dan data Production tetap dilarang disentuh.

## Rencana Tahapan Pengelolaan Repository Publik

### PUB-001 — Contract & Discovery Specification (COMPLETE)
- Definisi skema `config.json` v1 (`schema_version`, `project.id`, `repository.username`, `repository.repo`).
- Aturan discovery dari Origin HTTPS tervalidasi ke `https://{origin}/config.json`.
- Aturan branch: `default_branch` dari metadata repository GitHub; tidak ada override branch pada config v1.

### PUB-002 — Config Schema & Trusted Origin Enforcement (COMPLETE & VERIFIED)
- Validasi skema v1, canonical HTTPS Origin (tanpa wildcard pada discovery), pencocokan owner `GITHUB_OWNER`, visibilitas `public`, dan default branch resmi.
- Verified via `node --test test/repository-metadata.test.js` (12/12 PASS).

### PUB-003 — Shared Project Repository Resolver Routing (COMPLETE & VERIFIED)
- Integrasi `resolveProjectRepository(request, env)` ke Admin SHA lookup dan CREATE/UPDATE/DELETE file.
- Verified via `node --test` (54/54 PASS total combined suites).

### PUB-004 & PUB-004-FIX — Public Repository File Browsing & Security Audit (COMPLETE & VERIFIED)
- Endpoint `GET /api/v1/admin/browse?path=public&page=1&per_page=50`.
- Validasi path `public/`, pementalan traversal, hidden/sensitive files, symlink/submodule filtering (mode `120000`/`160000`, type `symlink`/`submodule`/`commit`, properti `target`/`submodule_git_url`), pencocokan child path presisi, batas upstream 1.000 item, deteksi `truncated: true` presisi, pagination, dan keluaran metadata murni (`name`, `path`, `type`, `size`, `sha`).
- Verified via `node --test test/browse-router.test.js` (22/22 PASS).

### PUB-005 — Tester Public File Manager UI (NEXT ACTIVE TASK)
- Lengkapi UI Tester untuk memilih proyek/repository, menampilkan pohon folder, tabel/editor JSON, serta operasi CRUD aman melalui DEKEKU API Gateway.

### PUB-006 — Development End-to-End Verification (PENDING)
- Uji alur lengkap dengan sedikitnya dua repository proyek publik pada Development Worker `dekeku-api-dev`.
