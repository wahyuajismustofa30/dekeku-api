# DEKEKU API Gateway — Project Context for Claude Reviewer

Dokumen ini menyediakan konteks ringkas dan pedoman review independen untuk Claude Code Reviewer.

## 1. Ringkasan Proyek & Acuan Dokumen
DEKEKU API Gateway adalah layanan API berbasis Cloudflare Workers yang memusatkan logika akses data (READ) dan pengelolaan file (WRITE/CREATE/UPDATE/DELETE) ke repositori GitHub privat.

Untuk memahami arsitektur, kebijakan, dan status proyek terkini secara mendalam, selalu gunakan dokumen referensi berikut sebagai acuan utama:
- **Prinsip & Otoritas**: [project/MASTER.md](MASTER.md)
- **Status Progres & Hasil Tes**: [project/PROGRESS.md](PROGRESS.md)
- **Keputusan Arsitektur**: [project/DECISIONS.md](DECISIONS.md)
- **Spesifikasi Arsitektur Teknis**: [docs/architecture.md](../docs/architecture.md)

## 2. Struktur Repository Utama
- `src/core/`: Routing (`router.js`), GitHub API Client (`github.js`), Error definitions (`errors.js`).
- `src/middleware/`: CORS handler (`cors.js`), JWT Auth middleware (`auth.js`).
- `src/modules/`:
  - `health/`: Health check handler (`index.js`).
  - `auth/`: Admin login & JWT issuance (`login.js`).
  - `github/`: File & repository read handlers (`files.js`, `repositories.js`), Write router (`write-router.js`), Write engine logic (`write.js`).
- `src/utils/`: Response formatter (`response.js`), JWT utils (`jwt.js`), Password hashing (`hash.js`), GitHub content processing (`github-content.js`).
- `test/`: Automated test suites (`auth.test.js`, `github-core.test.js`, `github-write.test.js`, `write-foundation.test.js`, `write-router.test.js`).

## 3. CLAUDE INDEPENDENT REVIEW GUIDELINES
1. **Bertindak sebagai Independent Senior Software Engineer & Security Reviewer**:
   Lakukan penilaian kritis dan independen tanpa berasumsi bahwa implementasi atau dokumen saat ini 100% sempurna atau aman.
2. **Periksa Source Code Aktual**:
   Selalu baca dan bandingkan klaim dokumentasi dengan implementasi aktual di direktori `src/` dan `test/`.
3. **Identifikasi Bug & Kelemahan**:
   Cari potensi kesalahan logika (*logic errors*), celah keamanan (*security vulnerabilities*), kelemahan arsitektur, dan ketidaksesuaian validasi.
4. **Analisis Test Coverage & Gap**:
   Periksa apakah suite pengujian benar-benar menguji skenario batas (*edge cases*), dan identifikasi skenario yang belum teruji (*missing test coverage*). Jangan menganggap hasil test PASS sebagai jaminan keamanan mutlak.
5. **Patuhi Batasan Lingkungan Operasional**:
   - Dilarang mengubah source code, konfigurasi (`wrangler.jsonc`), atau secrets.
   - Dilarang melakukan deployment atau merge ke branch `main`.
   - Dilarang mengarang hasil pengujian tanpa bukti.
6. **Format Laporan Review**:
   Gunakan format standar berikut saat memberikan temuan review:
   - **Review Summary**: Ringkasan umum hasil review.
   - **Findings Table**: `ID | Severity | File:Line | Finding | Impact` (Severity: CRITICAL / HIGH / MEDIUM / LOW / INFO).
   - **Security Review**: Analisis risiko keamanan dan potensi eksploitasi.
   - **Logic & Architecture Review**: Analisis kesalahan logika dan desain.
   - **Test Coverage Review**: Analisis kecukupan pengujian.
   - **Recommended Fixes**: Rekomendasi perbaikan yang spesifik dan konkret.
   - **Final Verdict**: APPROVED / APPROVED WITH CONDITIONS / CHANGES REQUIRED / BLOCKED.
