# ADM-008 — Final Test & Development Verification Plan

Tanggal: 2026-11-23  
Status: IN PROGRESS — FIRST OWNER-RUN RESULT RECORDED; FIXES COMMITTED; RERUN PENDING  
Branch: `dev`  
Target runtime: Development Worker `dekeku-api-dev` only

## 1. Owner-directed sequence

Wahyu memerintahkan seluruh implementasi ADM-001..ADM-007 diselesaikan terlebih dahulu. Source dan test suite sudah disiapkan pada `dev`; pengujian belum dijalankan. Dokumen ini menjadi urutan pelaksanaan tahap akhir ADM-008.

Jangan membuat PR, merge ke `main`, atau melakukan deployment sebelum hasil pengujian ditinjau dan pemilik memberi instruksi.

## 2. Local test execution

Jalankan dari root repository pada lingkungan Node.js 22:

```bash
npm ci
npm test
```

Test suite Dashboard yang ditambahkan:
- `test/dashboard-crypto.test.js`
- `test/dashboard-storage.test.js`
- `test/dashboard-registry.test.js`
- `test/dashboard-refresh.test.js`
- `test/dashboard-router.test.js`
- `test/dashboard-api.test.js`

Test Dashboard mencakup:
- AES-256-GCM round-trip, nonce unik, ciphertext/AAD tampering, key invalid, key version, dan batas ukuran.
- Encrypted storage, SHA concurrency, missing private repository, serta penolakan plaintext fallback.
- Repository pagination, filter owner/public, validasi config/CNAME, dan kelengkapan assets/data.
- Durable Object job start, concurrency guard, progress persistence, cancellation, retry hanya untuk item gagal, dan latest-check snapshot.
- Admin JWT boundary untuk protected Dashboard routes (list, metadata, bulk, export, dan refresh state/actions).
- Metadata upsert, bulk project-type update, list, export, serta validasi target sebelum write.

Hasil pertama yang dilaporkan pemilik: 261 tests, 259 PASS, 2 FAIL, exit code 1. Kedua kegagalan berasal dari test fixture/assertion dan telah diperbaiki pada commit `4ffe0f9` (`test(admin): assert bulk validation errors from module handlers`) dan `eab878a` (`test(admin): construct bodyless GET requests in router authorization test`). Rerun `npm test` masih PENDING. Jangan mengubah status menjadi VERIFIED sampai rerun lulus.

## 3. Wrangler configuration validation

Setelah `npm test` selesai:

```bash
npx wrangler deploy --dry-run --outdir /tmp/dekeku-dashboard-dry-run
```

Hasil owner-reported: `npx wrangler deploy --dry-run --outdir /tmp/dekeku-dashboard-dry-run` selesai dengan exit code 0 dan menampilkan `DASHBOARD_REFRESH` sebagai Durable Object binding serta variabel `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`, dan `ALLOWED_ORIGINS`. Dry-run tidak melakukan deployment dan tidak membuktikan ketersediaan secret/runtime. Periksa kembali target `dekeku-api-dev` dan migration `v1-dashboard-refresh` pada output lengkap lokal. Jangan jalankan deploy.

## 4. Development secret inventory

Periksa nama secret tanpa membaca atau mencetak nilainya:

```bash
npx wrangler secret list
```

Pastikan Development memiliki:
- `GITHUB_TOKEN`
- `JWT_SECRET`
- `ADMIN_PASSWORD_HASH`
- `DB_ENCRYPTION_KEY`

Jangan mengasumsikan secret tersedia hanya karena namanya tercantum di dokumen. Jika `DB_ENCRYPTION_KEY` belum ada, buat secret acak 32-byte base64url langsung melalui pipeline CLI, tanpa mencetak nilainya:

```bash
node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("base64url"))' | npx wrangler secret put DB_ENCRYPTION_KEY
```

Perintah secret di atas hanya boleh dijalankan dari repository/configuration yang menunjukkan `name: dekeku-api-dev`. Jangan overwrite key yang sudah digunakan untuk mengenkripsi metadata; perubahan key tanpa prosedur migrasi akan membuat ciphertext lama tidak dapat dibaca. Secret Production tidak boleh disentuh.

## 5. Development runtime smoke test — requires separate deployment approval

Belum diizinkan dalam tahap ini. Setelah local tests dan Wrangler dry-run lulus, minta persetujuan pemilik sebelum deploy atau mengubah secret/binding Cloudflare.

Setelah izin diberikan, verifikasi secara read-only:
1. `GET /api/v1/health` pada Development.
2. `GET /admin` memuat halaman Dashboard.
3. Login Admin berhasil; endpoint Dashboard menolak token tanpa role/audience Admin.
4. Repository discovery hanya memuat repository publik dari configured owner.
5. Metadata tersimpan sebagai envelope terenkripsi pada `dekeku-db/private/dashboard/projects.json`.
6. Refresh manual, progress, cancellation, retry gagal-saja, dan latest-check snapshot.
7. Tidak ada commit/write/delete pada repository proyek selama inspeksi.
8. Tidak ada token, JWT, password, hash, atau encryption key pada response/log.
9. Production Worker `github` dan `api.dekeku.my.id` tidak berubah.

Jangan menjalankan operasi tulis/hapus destruktif pada repository proyek nyata.

## 6. Evidence format

Untuk setiap kelompok test/verification, catat:
- Test ID / nama.
- Commit dan branch.
- Environment.
- Command atau langkah.
- Exit code.
- PASS / FAIL / SKIP.
- Output evidence yang sudah disanitasi.
- Kesimpulan dan blocker.

## 7. Stop conditions

- Jika test gagal, perbaiki source pada `dev`, lalu jalankan ulang suite terkait dan regresi.
- Jika secret atau binding tidak tersedia, tandai BLOCKED / NOT VERIFIED; jangan fallback ke plaintext.
- Jika target Worker tidak eksplisit `dekeku-api-dev`, hentikan.
- Jangan deploy Production, jangan merge PR, dan jangan mengubah branch `main`.
- Setelah ADM-008 selesai, berhenti untuk review dan instruksi pemilik.
