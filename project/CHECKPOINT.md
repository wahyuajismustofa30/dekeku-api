DEKEKU GATEWAY — PROJECT CHECKPOINT

Tanggal checkpoint: 2026-11-21
Status: PHASE 2.3 DOCUMENTED — FOLLOW-UP SECURITY REVIEW PENDING

*Acuan Utama*: Sumber status fitur adalah [PROGRESS.md](PROGRESS.md). Daftar rekomendasi dan kriteria penerimaan ada di [RECOMMENDATIONS.md](RECOMMENDATIONS.md).

## 1. Identitas Proyek & Batas Operasional
- Project: DEKEKU API Gateway
- Development branch: dev
- Development Worker: dekeku-api-dev
- Production Worker: github — protected; do not modify without explicit approval.
- GitHub is a backup/review path; follow D-011 for development changes.

## 2. Status Pengembangan yang Tercatat
- Phase 1 s/d 2.3: tercatat COMPLETED di PROGRESS.md.
- `npm run check`: PASS dan `npm test`: 149 PASS, 0 FAIL, 0 SKIP berdasarkan laporan pengguna tanggal 2026-11-21 pada branch `dev`, commit `a6a089d`; tidak dieksekusi ulang secara independen dalam pekerjaan dokumentasi ini.
- Runtime dan deployment tidak diuji dalam pekerjaan dokumentasi ini.
- Perubahan konfigurasi Cloudflare dan secret tidak dilakukan.

## 3. Temuan Review yang Menunggu Tindak Lanjut
- **P0 R-001:** IMPLEMENTED; same-origin enforced, JWT sesi memori, helper publik/admin dipisah. Isolated harness PASS; suite lokal 149 PASS berdasarkan laporan pengguna; deployment/runtime NOT VERIFIED.
- **P1 R-002:** IMPLEMENTED — login memakai `access_token` dan token direduksi dari log.
- **P1 R-003:** IMPLEMENTED — JSON headers, input validation, double-submit guard, success-only reset. Regression tests termasuk dalam suite lokal.
- **P1 R-004:** IMPLEMENTED — strict HTTPS origin parser, wildcard subdomain-only, apex explicit allowlist, port/credentials/path checks, `Vary: Origin`; regression test ditambahkan. Isolated harness PASS; suite lokal 149 PASS berdasarkan laporan pengguna.
- **P1 R-005:** IMPLEMENTED — `npm test` lokal eksplisit; remote test hanya melalui `npm run test:remote`; global fetch cleanup memakai `afterEach`/`finally`. `npm run check` dan suite lokal PASS berdasarkan laporan pengguna.
- **P1 R-006:** WAF rate limiting disetujui pada D-013, tetapi konfigurasi aktual NOT VERIFIED.
- **P1 R-007:** Rancang failed-login audit logging tanpa secret.
- **R-008:** COMPLETED — dokumentasi status, hasil tes, changelog, dan checkpoint telah disinkronkan; lihat commit dokumentasi dan PR #16.
- Rincian lengkap dan acceptance criteria: [RECOMMENDATIONS.md](RECOMMENDATIONS.md).

## 4. Langkah Berikutnya
1. R-006: verifikasi WAF Development untuk admin login; jangan menyentuh Production.
2. R-007: sepakati retensi log, pihak yang berhak mengakses, dan metadata yang boleh dicatat sebelum implementasi.
3. R-009 s/d R-011 tetap pekerjaan evaluasi terpisah.
4. Lanjutkan integrasi frontend statis dengan endpoint public submission bila diprioritaskan.

## 5. Batasan Pekerjaan Terakhir
- Source Dashboard, salinan HTML, regression test, dan script `npm test` diperbarui pada branch `dev`.
- Isolated JavaScript harness dijalankan terhadap script Dashboard dan CORS aktual; skenario inti PASS.
- `npm run check`: PASS; `npm test`: 149 PASS, 0 FAIL, 0 SKIP berdasarkan laporan pengguna (21-11-2026, branch `dev`, commit `a6a089d`). Output terminal mentah tidak disertakan dalam catatan ini.
- Remote test NOT RUN; deployment/runtime Development NOT VERIFIED.
- Tidak ada secret, konfigurasi Worker, deployment, atau runtime Production yang diubah.
## 6. Caller Repository Metadata — New Work (2026-11-21)
- Branch: `dev`.
- Implemented `GET /api/v1/github/repository` lookup from validated `Origin` → fixed `/config.json` → `repository.username` + `repository.repo` → GitHub repository metadata.
- Origin uses the shared CORS HTTPS allowlist; caller owner must match `GITHUB_OWNER`; private repositories are rejected; config response is capped at 32 KiB, timeout 8 seconds, redirects disabled.
- Regression suite added: `test/repository-metadata.test.js`; added to `npm test`.
- Design notes: `docs/caller-repository-metadata.md`.
- Test execution, local syntax validation, and Development runtime/deployment: NOT RUN / NOT VERIFIED in this environment.
- No secrets, Wrangler bindings, Cloudflare settings, Worker deployment, or Production resources changed.


## 7. Guestbook Per-Origin Storage — Implemented on dev (2026-11-21)
- Commit: see latest dev head after this checkpoint update.
- Endpoint now derives hostname from validated HTTPS Origin and stores all submissions for that hostname in public/data/{hostname}/bukutamu.json as a JSON array.
- Dots in hostname are preserved. No client-controlled path or repository selector is accepted.
- Updates use current Git blob SHA. On 409, the Worker re-reads the latest file and retries with fresh SHA, at most three attempts.
- Request max: 15 KiB; stored JSON max: 1 MiB. Full file returns 413. Existing legacy files are untouched.
- Automated tests, syntax checks, and runtime verification: NOT RUN / NOT VERIFIED in this environment. No deployment, secrets, Worker config, Production, or data repository files were changed.


## 8. Write Engine Automatic SHA Retrieval — Implemented on dev (2026-11-21)
- Added authenticated `GET /api/v1/admin/write/sha?path=...`; only the current Blob SHA and requested path are returned.
- UPDATE/DELETE in `wahyuajismustofa30/demo:index.html` fetch the SHA immediately before writing/deleting. CREATE/UPDATE refresh the displayed SHA; DELETE clears it.
- SHA validation and GitHub optimistic concurrency remain mandatory; a concurrent file change can still produce 409.
- Regression tests added, but automated tests and syntax checks are NOT RUN. Development deployment/runtime is NOT VERIFIED.
- No deployment, Production request, secret/configuration change, or Termux synchronization was performed.
