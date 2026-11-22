# Public Data API — Work Plan v1

Tanggal persetujuan: 2026-11-23
Tanggal implementasi GitHub: 2026-11-23
Branch target: `dev`
Prioritas: AKTIF (Admin Dashboard tetap PAUSED)

## 1. Tujuan

Menyediakan pola endpoint publik yang dapat diperluas untuk berbagai jenis formulir/data kiriman tanpa membuat endpoint khusus untuk setiap resource:

`POST /api/v1/public/data/{resource}`

Resource pertama adalah `guestbook`. Penambahan resource berikutnya dilakukan melalui Resource Registry dan validator khusus, bukan dengan menambah handler endpoint yang menduplikasi engine.

## 2. Arsitektur yang disetujui dan diimplementasikan

1. **Resource Registry** — server-side allowlist, enabled flag, method, validator, fixed storage path, JSON shape, dan limits.
2. **Resource Validator** — validasi payload terpisah per resource; client tidak dapat mengubah aturan.
3. **Project Repository Resolver** — menggunakan `resolveProjectRepository()` yang juga dipakai File Manager. Resolver Guestbook lama yang membaca private `users.json`/mapping dibandingkan dengan resolver File Manager; pendekatan private mapping dihapus dari jalur Guestbook baru.
4. **Shared Storage Engine** — bounded body parsing, UTF-8/JSON validation, Origin enforcement melalui shared resolver, repository visibility, fixed-path GitHub write, SHA concurrency, bounded retry, dan safe errors.
5. **Guestbook Migration** — Guestbook menjadi resource `guestbook`, mempertahankan payload, timestamp, JSON array, storage path historis, serta batas ukuran.
6. **Legacy Alias** — `POST /api/v1/public/submit` meneruskan ke handler Guestbook yang sama.
7. **Public Read** — website membaca file dari repository publik/CDN secara langsung. GET API baru tidak termasuk cakupan awal.

## 3. Status pekerjaan

| ID | Hasil implementasi | Status validasi |
|---|---|---|
| PUB-DATA-001 — API Contract | Route, method, request/response, unknown resource, dan method handling | IMPLEMENTED |
| PUB-DATA-002 — Resource Registry | Registry server-side dan metadata resource Guestbook | IMPLEMENTED |
| PUB-DATA-003 — Shared Storage Engine | Bounded parsing, resolver, public repo check, fixed-path write, SHA retry | IMPLEMENTED |
| PUB-DATA-004 — Guestbook Migration | Guestbook memakai resolver config.json dan storage engine bersama | IMPLEMENTED |
| PUB-DATA-005 — Legacy Compatibility | Route lama menjadi alias ke handler yang sama | IMPLEMENTED |
| PUB-DATA-006 — Security & Integration Tests | Test cases mock/fixture diperbarui untuk endpoint baru dan alias | TESTS WRITTEN — NOT RUN |
| PUB-DATA-007 — Documentation & Checkpoint | API reference, usage, integration, roadmap, progress, backlog, checkpoint, changelog diperbarui | IMPLEMENTED |

**Status keseluruhan:** IMPLEMENTED ON GITHUB `dev` — AWAITING TERMUX VALIDATION. Belum ada klaim PASS/FAIL untuk test baru. Belum diverifikasi dengan Node test runner, Wrangler dry-run, atau runtime Worker.

## 4. File implementasi

- `src/modules/public/resource-registry.js`
- `src/modules/public/resource-validators.js`
- `src/modules/public/storage-engine.js`
- `src/modules/public/index.js`
- `src/modules/public/submit.js` (legacy alias)
- `src/core/router.js`
- `test/public-submission.test.js`

Dokumentasi:
- `docs/PUBLIC_DATA_API.md`
- `docs/GUESTBOOK_INTEGRATION.md`
- `docs/USAGE.md`

## 5. Kontrak Guestbook

Request:

```json
{
  "name": "Nama Pengunjung",
  "message": "Pesan",
  "email": "opsional@example.com"
}
```

- name wajib 1–100 karakter setelah trim.
- message wajib 1–1000 karakter setelah trim.
- email opsional maksimal 254 karakter.
- field tambahan ditolak.
- Worker menambahkan `createdAt` ISO 8601.
- body maksimal 15.360 byte.
- file maksimal 1 MiB dan harus berupa JSON array.
- storage path tetap: `assets/data/bukutamu.json`.
- repository harus public; owner harus sama dengan trusted `GITHUB_OWNER`; branch diambil dari metadata GitHub.

## 6. Keamanan dan kompatibilitas wajib

- Origin adalah trust selector/CORS boundary, bukan autentikasi.
- Jangan menerima owner, repository, branch, atau storage path dari klien.
- Registry dan validator fail-closed.
- Pertahankan batas ukuran body/file, UTF-8/JSON validation, repository public check, dan SHA concurrency.
- Jangan menghapus atau memindahkan file Guestbook lama otomatis.
- Jangan mengubah User Data API, Admin API, atau Admin Dashboard.
- Tidak membuat GET API publik baru pada fase awal.

## 7. Batas operasional dan langkah berikutnya

- Semua perubahan dilakukan hanya pada branch `dev`.
- Tidak membuat PR, tidak merge, tidak menyentuh `main`.
- Tidak melakukan deployment atau perubahan Cloudflare config/bindings/secrets/variables.
- Production Worker, domain, credentials, dan data Production tidak disentuh.
- **Langkah berikutnya wajib di Termux:** periksa branch dan working tree lokal, amankan perubahan lokal yang belum disimpan, lalu sinkronkan `dev`. Jalankan `node --test test/public-submission.test.js` dan `node --check` pada file source yang berubah. Dokumentasi `docs/USAGE.md` mencatat larangan pemilik atas `npm test`; jangan jalankan `npm test` atau `test:remote` tanpa instruksi baru. Review diff dan catat bukti aktual.
- Setelah validasi Termux, berhenti untuk review pemilik; tidak ada PR/merge/deployment otomatis.
