# DEKEKU API Gateway — Panduan Penggunaan & Referensi API

Dokumen ini memuat panduan lengkap mengenai cara menjalankan, menguji, dan menggunakan endpoint API pada **DEKEKU API Gateway**.

---

## 1. Arsitektur & Lingkungan

DEKEKU API Gateway adalah Cloudflare Worker modular yang menggunakan GitHub Contents API. Fokus pengembangan saat ini adalah pengelolaan data publik di repository masing-masing proyek. Website membaca data publik langsung dari URL GitHub Raw/CDN; operasi administratif melalui Gateway menggunakan resolver repository proyek yang divalidasi dari `config.json` schema v1.

**Status implementasi:** pemilihan repository publik per proyek telah diimplementasikan melalui `config.json` schema v1 dan `resolveProjectRepository`. `GITHUB_OWNER` tetap menjadi trusted owner policy; `GITHUB_REPO`/`GITHUB_BRANCH` merupakan konfigurasi Worker lama/fallback dan bukan sumber identitas repository proyek ketika resolver berhasil. Repository harus public dan branch berasal dari metadata `default_branch` GitHub. PUB-006 telah dinyatakan selesai dan terverifikasi pada Development menurut bukti historis di `project/EVIDENCE.md`; hal itu terpisah dari verifikasi runtime untuk perubahan Public Data API yang lebih baru.

### Environment Variables (`wrangler.jsonc` & `.dev.vars`)
- `GITHUB_OWNER`: Pemilik repository GitHub (contoh: `wahyuajismustofa30`).
- `GITHUB_REPO`: Konfigurasi repository Worker lama/fallback. Saat project resolver digunakan, identitas repository berasal dari `config.json` schema v1 yang tervalidasi; nilai Worker bukan selector repository dari klien.
- `GITHUB_BRANCH`: Branch target (contoh: `main`).
- `ALLOWED_ORIGINS`: Daftar origin CORS yang diizinkan (mendukung domain eksak dan wildcard subdomain seperti `*.dekeku.my.id`, `*.artoprintingpbg.com`).
- `GITHUB_TOKEN`: Personal Access Token GitHub (Secret, disimpan di Cloudflare Secrets / `.dev.vars`).
- `JWT_SECRET`: Kunci rahasia penandatanganan JWT (Secret).
- `ADMIN_PASSWORD_HASH`: Hash password admin berformat PBKDF2 (`pbkdf2:iters:salt:hash`).

---

## 2. Menjalankan & Menguji Secara Lokal

### Prasyarat
- Node.js v22+
- npm

### Menjalankan Tes Lokal
Jalankan pemeriksaan syntax dan suite terfokus sesuai perubahan. `npm test` tidak boleh dijalankan berdasarkan instruksi pemilik proyek. Contoh suite terfokus:
```bash
node --test test/project-origin-selector.test.js test/tester-file-manager.test.js test/tester-dashboard.test.js test/repository-metadata.test.js test/browse-router.test.js test/browse-git-tree.test.js test/write-router.test.js
```

Tes remote Development harus dijalankan secara terpisah dan eksplisit:
```bash
npm run test:remote
```
**Peringatan:** `test:remote` mengakses Worker Development aktif. Salah satu skenarionya mengirim Guestbook yang menulis data ke repository GitHub. Jangan jalankan sebagai bagian dari tes default atau tanpa persetujuan.

### Tester Dashboard
Dashboard/Tester tersedia pada route `/` dan `/tester`. File Manager PUB-005 sudah diimplementasikan dan focused regression tests dilaporkan 66/66 PASS; browser E2E dan runtime Development belum diverifikasi. PUB-006 bukan lagi gate berikutnya; workstream tersebut berstatus COMPLETE & VERIFIED. Status Public Data API terbaru dan batas validasinya dicatat di `project/PROGRESS.md` dan `project/EVIDENCE.md`.
- Tujuan API mengikuti origin halaman yang sedang dibuka; dashboard tidak menerima URL API bebas.
- Origin remote wajib HTTPS. HTTP hanya diizinkan untuk host loopback saat pengembangan lokal.
- JWT admin hanya disimpan di memori halaman, tidak ditampilkan, dan tidak dipersistenkan. Memuat ulang halaman, logout, atau respons HTTP 401 menghapus sesi.
- Request publik tidak membawa Authorization; hanya request administratif yang menggunakan helper terpisah.
- File Manager menyediakan pemilihan proyek melalui Project Origin canonical HTTPS. Tester mengirimkannya sebagai `X-DEKEKU-Project-Origin`; server memvalidasi exact Origin atau wildcard subdomain yang dikonfigurasi di `ALLOWED_ORIGINS`, lalu membaca `/config.json` dari Origin tersebut. Wildcard subdomain tidak mencakup apex domain. Header ini bukan autentikasi.
- Setelah Admin login, File Manager menampilkan pohon direktori dari `public/`. Pembacaan/edit JSON dan CREATE/UPDATE/DELETE dibatasi server ke `public/data/*.json`; operasi UPDATE/DELETE mengambil SHA terbaru sebelum mutasi.
- Project Origin yang dipilih hanya disimpan di `sessionStorage` tab saat ini. Admin JWT tetap hanya di memori halaman.

### Pengembangan Lokal (Wrangler Dev)
Catatan lingkungan Termux/PRoot mungkin memerlukan penanganan khusus TCMalloc; dianjurkan menjalankan pengujian berbasis Node.js test runner atau menggunakan remote/simulation testing.
```bash
npm run dev
```

---

## 3. Daftar Endpoint API

### A. Endpoint Publik (Tanpa Autentikasi)

1. **Health Check**
   - **Method**: `GET`
   - **Path**: `/api/v1/health`
   - **Deskripsi**: Memeriksa status kesehatan gateway.
   - **Respons**: `200 OK`
     ```json
     {
       "success": true,
       "status": "online",
       "timestamp": "2026-11-20T..."
     }
     ```

2. **Repository Metadata**
   - **Method**: `GET`
   - **Path**: `/api/v1/github/repository`
   - **Deskripsi**: Mengambil metadata repository dari GitHub.

3. **Public File Read**
   - **Method**: `GET`
   - **Path**: `/api/v1/public/*`
   - **Deskripsi**: Membaca file statis dari direktori `public/` (aman dari path traversal dan pembacaan file sensitif).

4. **Public Data Submission**
   - **Method**: `POST`
   - **Path**: `/api/v1/public/data/{resource}`
   - **Resource aktif**: `guestbook`
   - **Content-Type**: `application/json`
   - **Authentication**: tidak memerlukan Admin JWT.
   - **Origin**: HTTPS Origin harus sesuai `ALLOWED_ORIGINS`; Worker mengambil `config.json` dan memvalidasi repository public melalui resolver File Manager.
   - **Payload Guestbook**:
     ```json
     {
       "name": "Nama Pengunjung",
       "message": "Pesan guestbook...",
       "email": "opsional@example.com"
     }
     ```
   - **Storage**: path tetap server-side `assets/data/bukutamu.json` pada repository proyek.
   - **Legacy alias**: `POST /api/v1/public/submit` meneruskan ke resource Guestbook yang sama.
   - **Response**: `201 Created`; website membaca JSON langsung dari GitHub Raw/CDN, bukan GET API Gateway.
   - **Batas**: body 15.360 byte; file 1 MiB; name 1–100, message 1–1000, email opsional maksimal 254 karakter.

---

### B. Endpoint Administratif (Memerlukan Autentikasi JWT)

Seluruh endpoint admin memerlukan header otentikasi:
```http
Authorization: Bearer <JWT_TOKEN>
```

1. **Admin Login**
   - **Method**: `POST`
   - **Path**: `/api/v1/admin/login`
   - **Payload**:
     ```json
     {
       "username": "admin",
       "password": "your-admin-password"
     }
     ```
   - **Deskripsi**: Memverifikasi kredensial PBKDF2 dan menerbitkan JWT token (`role: admin`, masa berlaku terbatas).
   - **Respons**: `200 OK` dengan token JWT.

2. **Read JSON File for Admin File Manager**
   - **Method**: `GET`
   - **Path**: `/api/v1/admin/write/file?path=public/data/myfile.json`
   - **Header**: `Authorization: Bearer <TOKEN>` and `X-DEKEKU-Project-Origin: https://project.example`
   - **Description**: Reads parsed JSON content, size, and current Blob SHA from the selected validated public project repository. Restricted to JSON files under `public/data/`.
   
3. **Retrieve Current File SHA (Write Engine)**
   - **Method**: `GET`
   - **Path**: `/api/v1/admin/write/sha?path=public/data/myfile.json`
   - **Header**: `Authorization: Bearer <TOKEN>`
   - **Deskripsi**: Mengambil SHA Blob GitHub terkini untuk file JSON yang sudah ada di `public/data/`. Respons hanya mengembalikan path dan SHA, bukan isi file. Endpoint ini dipakai Tester sebelum UPDATE/DELETE; klien tetap boleh mengirim SHA secara eksplisit.

4. **Create File (Write Engine)**
   - **Method**: `POST`
   - **Path**: `/api/v1/admin/write/create`
   - **Header**: `Authorization: Bearer <TOKEN>`
   - **Payload**:
     ```json
     {
       "path": "public/data/myfile.json",
       "content": { "key": "value" }
     }
     ```
   - **Deskripsi**: Membuat file baru di dalam `public/data/` (tanpa memerlukan SHA, aman terhadap race condition).

5. **Update File (Write Engine)**
   - **Method**: `PUT`
   - **Path**: `/api/v1/admin/write/update`
   - **Header**: `Authorization: Bearer <TOKEN>`
   - **Payload**:
     ```json
     {
       "path": "public/data/myfile.json",
       "content": { "key": "updated-value" },
       "sha": "<github_file_sha>"
     }
     ```
   - **Deskripsi**: Memperbarui file yang ada dengan validasi SHA (Optimistic Concurrency Control mencegah *overwrite* konflik). Tester mengambil SHA terkini otomatis sebelum request; API tetap mewajibkan SHA.

6. **Delete File (Write Engine)**
   - **Method**: `DELETE`
   - **Path**: `/api/v1/admin/write/delete`
   - **Header**: `Authorization: Bearer <TOKEN>`
   - **Payload**:
     ```json
     {
       "path": "public/data/myfile.json",
       "sha": "<github_file_sha>"
     }
     ```
   - **Deskripsi**: Menghapus file dari repository GitHub dengan validasi SHA. Tester mengambil SHA terkini otomatis sebelum request; API tetap mewajibkan SHA.

---

## 4. Keamanan & Kebijakan CORS

- **CORS**: Gateway menerapkan pembatasan origin ketat berdasarkan variabel lingkungan `ALLOWED_ORIGINS`, mendukung domain eksak serta wildcard subdomain (`*.dekeku.my.id`, `*.artoprintingpbg.com`).
- **Secret Protection**: Token (`GITHUB_TOKEN`), kunci JWT (`JWT_SECRET`), dan hash password (`ADMIN_PASSWORD_HASH`) disimpan sebagai rahasia Cloudflare Worker dan tidak pernah diekspos dalam respons error maupun log.


## Latest Public Data API verification (2026-11-23)

Owner-reported local Termux validation: `node --test test/public-submission.test.js` passed 14/14 tests; `node --check` passed for all 7 changed source files. The exact local tested HEAD SHA was not supplied, so this result is not conclusively tied to the current GitHub `dev` / PR #29 head. It does not establish full-suite status, remote integration, a live repository write, Worker runtime success, or deployment. Do not run `npm run test:remote` without explicit approval because it may write to active project data.
