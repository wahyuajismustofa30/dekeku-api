# DEKEKU API Gateway — Panduan Penggunaan & Referensi API

Dokumen ini memuat panduan lengkap mengenai cara menjalankan, menguji, dan menggunakan endpoint API pada **DEKEKU API Gateway**.

---

## 1. Arsitektur & Lingkungan

DEKEKU API Gateway adalah Cloudflare Worker modular yang menggunakan GitHub Contents API. Fokus pengembangan saat ini adalah pengelolaan data publik di repository masing-masing proyek. Website membaca data publik langsung dari URL GitHub Raw/CDN; operasi administratif akan diarahkan ke repository proyek yang telah divalidasi.

**Batas implementasi saat ini:** `GITHUB_OWNER`, `GITHUB_REPO`, dan `GITHUB_BRANCH` masih menjadi konfigurasi repository Worker. Pemetaan dinamis ke beberapa repository publik belum selesai. Jangan menganggap dukungan multi-repository sudah aktif hanya berdasarkan dokumentasi.

### Environment Variables (`wrangler.jsonc` & `.dev.vars`)
- `GITHUB_OWNER`: Pemilik repository GitHub (contoh: `wahyuajismustofa30`).
- `GITHUB_REPO`: Nama repository yang saat ini dikonfigurasi pada Worker Development. Nilai aktual harus diperiksa dari `wrangler.jsonc` sebelum pengujian; dukungan pemilihan repository publik per proyek belum selesai.
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
Jalankan pemeriksaan syntax dan suite lokal yang terisolasi:
```bash
npm run check
npm test
```

Tes remote Development harus dijalankan secara terpisah dan eksplisit:
```bash
npm run test:remote
```
**Peringatan:** `test:remote` mengakses Worker Development aktif. Salah satu skenarionya mengirim Guestbook yang menulis data ke repository GitHub. Jangan jalankan sebagai bagian dari tes default atau tanpa persetujuan.

### Tester Dashboard
Dashboard tersedia pada route `/` dan `/tester`.
- Tujuan API mengikuti origin halaman yang sedang dibuka; dashboard tidak menerima URL API bebas.
- Origin remote wajib HTTPS. HTTP hanya diizinkan untuk host loopback saat pengembangan lokal.
- JWT admin hanya disimpan di memori halaman, tidak ditampilkan, dan tidak dipersistenkan. Memuat ulang halaman, logout, atau respons HTTP 401 menghapus sesi.
- Request publik tidak membawa Authorization; hanya request administratif yang menggunakan helper terpisah.

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

4. **Public Guestbook Submission**
   - **Method**: `POST`
   - **Path**: `/api/v1/public/submit`
   - **Content-Type**: `application/json`
   - **Payload**:
     ```json
     {
       "name": "Nama Pengunjung",
       "message": "Pesan guestbook..."
     }
     ```
   - **Deskripsi**: Mengirimkan pesan guestbook publik yang disimpan secara otomatis ke `public/data/guestbook/`.
   - **Respons**: `201 Created`

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

2. **Retrieve Current File SHA (Write Engine)**
   - **Method**: `GET`
   - **Path**: `/api/v1/admin/write/sha?path=public/data/myfile.json`
   - **Header**: `Authorization: Bearer <TOKEN>`
   - **Deskripsi**: Mengambil SHA Blob GitHub terkini untuk file JSON yang sudah ada di `public/data/`. Respons hanya mengembalikan path dan SHA, bukan isi file. Endpoint ini dipakai Tester sebelum UPDATE/DELETE; klien tetap boleh mengirim SHA secara eksplisit.

3. **Create File (Write Engine)**
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

4. **Update File (Write Engine)**
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

5. **Delete File (Write Engine)**
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
