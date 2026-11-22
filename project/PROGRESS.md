# PROGRESS STATUS — DEKEKU API Gateway

Tanggal pembaruan: 2026-11-23
Basis dokumentasi: live Development Worker E2E verification & read-only `artoprintingpbg.com` investigation.

## Ringkasan kondisi aktual

- Fokus aktif: pengelolaan data publik pada repository GitHub publik masing-masing proyek.
- PUB-001 s.d. PUB-005: implementasi, focused regression tests, dan File Manager selesai.
- PUB-006: **VERIFIED & COMPLETE** — CRUD fixture live E2E verification on Development Worker completed with full evidence (CREATE, READ, UPDATE, STALE SHA CONFLICT 409, DELETE, CLEANUP 404).
- Arto Printing investigation: `https://artoprintingpbg.com/config.json` returns 301 redirect to `https://www.artoprintingpbg.com/config.json`, which returns HTTP 404 (file `config.json` not found in that repository/branch).
- Production Worker `github`, domain `api.dekeku.my.id`, secrets, variables, and data Production remain untouched and out of scope.

## Status workstream PUB

| ID | Status | Bukti / batas verifikasi |
|---|---|---|
| PUB-001 | COMPLETE — specification | Kontrak config v1 dan JSON Schema tersedia. |
| PUB-002 | VERIFIED | Validasi schema, Origin, owner, repository public, default branch, invalid origin, dan wildcard subdomains teruji pada Development Worker. |
| PUB-003 | VERIFIED | Resolver bersama dipakai untuk SHA dan CREATE/UPDATE/DELETE teruji di Development Worker. |
| PUB-004 / PUB-004-FIX | VERIFIED | Git Trees traversal, `public/` boundary, filtering symlink/submodule/hidden/sensitive entries, pagination/truncation, metadata-only response teruji. |
| PUB-005 | VERIFIED | Project Origin selector, Admin JSON reader, File Manager browse/navigation/pagination/JSON CRUD teruji. |
| PUB-006 | VERIFIED / COMPLETE | Live Development Worker E2E CRUD verification on `wahyuajismustofa30/demo` fixture `public/data/__dekeku_pub006_e2e_fixture.json` passed all 6 lifecycle stages (CREATE 200, READ 200, UPDATE 200, STALE SHA CONFLICT 409, DELETE 200, CLEANUP 404) with complete SHA records. |

### Bukti pengujian CRUD PUB-006

- Worker: `https://dekeku-api-dev.wahyuajismustofa30.workers.dev`
- Repository: `wahyuajismustofa30/demo` (Origin: `https://demo.dekeku.my.id`)
- Fixture Path: `public/data/__dekeku_pub006_e2e_fixture.json`
- CREATE: HTTP 200, SHA `0c86152679a76bbb6c84ea34251cff73e8945681`
- READ: HTTP 200, SHA `0c86152679a76bbb6c84ea34251cff73e8945681`
- UPDATE: HTTP 200, SHA `de8389086a32c6a8cdeb494ee53af065eca98db1`
- STALE SHA CONFLICT: HTTP 409 (`Conflict: file has been modified`), content unchanged
- DELETE: HTTP 200, SHA `4f6a86c31b3fe43e1ab9fabce687eb6750e9f3bf`
- CLEANUP VERIFICATION: HTTP 404 (`File not found`)

### Hasil Investigasi `artoprintingpbg.com` (Read-Only)

- `https://artoprintingpbg.com/config.json`: HTTP 301 Moved Permanently (Location: `https://www.artoprintingpbg.com/config.json`)
- `https://www.artoprintingpbg.com/config.json`: HTTP 404 Not Found (Content-Type: `text/html; charset=utf-8`, serving custom 404 page).
- Penyebab 502/404 pada gateway: File `config.json` belum tersedia di repository publik Arto Printing (`https://www.artoprintingpbg.com/config.json` mengembalikan halaman error 404 standar, bukan JSON kontrak v1). Ketika gateway mencoba mengambil config, respon 404/non-JSON menyebabkan penolakan (502/422). Rekomendasi: buat file `config.json` sesuai kontrak v1 di repository publik Arto Printing.

## Pekerjaan aktif berikutnya

1. Semua workstream PUB (PUB-001 s.d. PUB-006) telah selesai dan diverifikasi.
2. Evaluasi kesiapan peningkatan Admin UI atau tugas berikutnya sesuai arahan pemilik.

## Batas operasional

- Jangan menyentuh Production atau mengubah secret/variable/Wrangler/Cloudflare settings tanpa persetujuan eksplisit.
- Jangan menulis/menghapus data website nyata saat E2E; gunakan repository/fixture pengujian yang disetujui.
- Jangan menjalankan `npm test`.
- RBAC dan private repository `dekeku-db` tetap diarsipkan (A-003), bukan scope aktif.
