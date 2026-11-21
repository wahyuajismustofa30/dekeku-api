# RBAC Implementation Plan — DEKEKU API

Tanggal pencatatan: 2026-11-21
Status: RBAC-01/02 IMPLEMENTED — NOT VERIFIED
Target branch: `dev`

Dokumen ini adalah daftar kerja operasional untuk implementasi Role-Based Access Control (RBAC). Keputusan arsitektur di bawah telah disetujui pemilik proyek. Status implementasi dan verifikasi harus diperbarui berdasarkan bukti aktual; persetujuan desain bukan bukti implementasi.

## 1. Keputusan Arsitektur yang Disetujui

### 1.1 Role dan kewenangan
- **Admin**: mengelola akun dan mapping repository; memiliki akses ke seluruh direktori data yang dikelola API. Tidak berarti akses bebas ke secret atau file internal.
- **User**: hanya mengakses repository yang terdaftar untuk akunnya, dibatasi ke direktori `assets/data/` pada setiap repository tersebut.
- **Guest**: tidak login dan tidak memiliki JWT; hanya boleh mengirim Guestbook melalui endpoint publik.
- Pembacaan Guestbook yang sudah dipublikasikan dilakukan langsung melalui URL statis repository/CDN, bukan melalui Worker.

### 1.2 JWT dan sesi
- Masa berlaku JWT User: 30 menit.
- Admin tetap memakai audience `dekeku-admin` dan role `admin`.
- User memakai audience `dekeku-user` dan role `user`.
- Token browser disimpan di `sessionStorage` dengan key `dekeku_user_access_token`; tidak menggunakan `localStorage`.
- Token dikirim sebagai Bearer token dan dibersihkan saat logout atau sesi tidak valid.
- Risiko XSS pada penyimpanan token yang dapat dibaca JavaScript tetap harus diperhitungkan.

### 1.3 Penyimpanan akun dan mapping
- Repository penyimpanan privat: `dekeku-db`.
- Struktur awal:
  ```
  private/
    auth/users.json
    repositories/mappings.json
    system/
  ```
- Akun hanya dibuat oleh Admin; tidak ada registrasi publik.
- Password disimpan sebagai hash PBKDF2-SHA256, bukan plaintext.
- Data akun minimal: ID, username, passwordHash, role=user, status active/disabled, createdAt, updatedAt.
- Mapping server-authoritative: user tidak boleh menentukan role, owner, repository, branch, atau Origin melalui request.
- Sejak awal, satu user dapat memiliki beberapa repository.
- Registrasi repository dilakukan manual oleh Admin: owner, nama repository, dan branch.
- Satu repository hanya boleh dimiliki satu akun aktif kecuali kebijakan sharing disetujui kemudian.
- Satu Origin aktif hanya boleh dipetakan ke satu repository untuk menghindari tujuan Guestbook ambigu.
- GitHub token hanya berada di sisi server.
- Penyimpanan privat harus menggunakan metode internal read/write dengan allowlist path privat yang ketat; jangan melewati atau melonggarkan validasi path publik.

### 1.4 Data publik dan Guestbook
- Data website berada di repository website milik User:
  ```
  assets/data/bukutamu.json
  assets/data/statistik.json
  ```
- Browser membaca JSON publik langsung dari static repository/CDN URL.
- Worker memvalidasi operasi tulis melalui GitHub API.
- Alur Guestbook: Guest POST `/api/v1/public/submit`; Worker memvalidasi Origin, payload, ukuran, rate limit, dan mitigasi abuse; Worker mencari mapping Origin pada `dekeku-db`; Worker menulis ke `assets/data/bukutamu.json` di repository website terdaftar.
- Origin bukan autentikasi karena klien non-browser dapat memalsukannya. Mapping server-side dan perlindungan lain tetap wajib.
- Semua submission dari Origin yang sama masuk ke file Guestbook yang sama.
- Pertimbangkan batas ukuran file, SHA concurrency, retry conflict, cache CDN/invalidation, dan GitHub API rate limit.
- Data lama di `dekeku-db/public/data/{hostname}/bukutamu.json` tidak boleh dihapus atau dimigrasikan otomatis. Strategi migrasi menunggu keputusan terpisah.

## 2. Endpoint Target

### Admin
- `POST /api/v1/admin/login` (existing)
- `POST /api/v1/admin/users`
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/users/:id`
- `PATCH /api/v1/admin/users/:id`
- `POST /api/v1/admin/users/:id/reset-password`
- `POST /api/v1/admin/users/:id/repositories`
- `GET /api/v1/admin/users/:id/repositories`
- `PATCH /api/v1/admin/repositories/:id`
- `DELETE /api/v1/admin/repositories/:id` — soft-disable mapping, bukan penghapusan permanen.

### User
- `POST /api/v1/user/login`
- `GET /api/v1/user/repositories`
- `GET /api/v1/user/data`
- `POST /api/v1/user/data`
- `PUT /api/v1/user/data`
- `DELETE /api/v1/user/data`
- User mengirim repository ID terdaftar; server memverifikasi ownership dan menetapkan prefix `assets/data/`. Jangan menerima owner/repo/path arbitrer dari klien.

### Guest
- `POST /api/v1/public/submit` saja.
- Pembacaan Guestbook dilakukan melalui static URL, bukan endpoint Worker.

## 3. Tahapan dan Daftar Tugas

| ID | Tahap | Ruang lingkup utama | Status |
|---|---|---|---|
| RBAC-01 | Private account storage & repository mapping | Schema akun, mapping, internal private repository access, validasi dan penyimpanan aman | IMPLEMENTED — NOT VERIFIED |
| RBAC-02 | Role & ownership middleware | Memisahkan Admin/User audience, role, ownership, dan scope akses | IMPLEMENTED — NOT VERIFIED |
| RBAC-03 | Admin account management | CRUD akun, status disable, reset password, registrasi/disable repository | IMPLEMENTED — NOT VERIFIED |
| RBAC-04 | User login & JWT | Login User, PBKDF2, JWT audience user, TTL 30 menit | BLOCKED BY RBAC-01/02 |
| RBAC-05 | User data CRUD | CRUD JSON terisolasi pada `assets/data/` untuk repository milik user | BLOCKED BY RBAC-01/02/04 |
| RBAC-06 | Private/public data boundary | Tutup pembacaan data privat; pastikan endpoint publik tidak membocorkan data privat | BLOCKED BY RBAC-01/02 |
| RBAC-07 | Guestbook per website repository | Origin mapping ke repository website; tulis `assets/data/bukutamu.json`; mitigasi concurrency/cache | BLOCKED BY RBAC-01 |
| RBAC-08 | Browser User session | Login UI, sessionStorage, Bearer token, logout/401 cleanup | BLOCKED BY RBAC-04 |
| RBAC-09 | Security & regression review | Ownership bypass, IDOR, path traversal, role confusion, Origin spoofing, size/rate limits, regression | BLOCKED BY RBAC-01–08 |

## 4. Acceptance Criteria Minimum

- User tidak dapat membaca atau mengubah repository milik user lain, termasuk dengan mengganti repository ID.
- User tidak dapat keluar dari prefix `assets/data/`, termasuk melalui encoding, traversal, slash/backslash, atau path normalization.
- Klien tidak dapat memilih role, GitHub owner/repository/branch, atau mapping Origin.
- JWT Admin dan User tidak saling dapat digunakan; audience dan role harus cocok.
- JWT User ditolak setelah 30 menit sesuai kebijakan expiry.
- Akun disabled langsung ditolak untuk login/akses sesuai mekanisme status check yang ditetapkan.
- Tidak ada password plaintext, GitHub token, JWT secret, atau credential dalam repository publik, response, maupun log.
- Public file reader tidak dapat membaca `private/` atau file internal.
- Guestbook hanya menulis ke repository yang dipetakan server untuk Origin tersebut; Origin bukan bukti identitas.
- Konflik SHA, file limit, GitHub API error, dan CDN cache behavior ditangani serta didokumentasikan.
- File Guestbook lama tetap utuh sampai strategi migrasi disetujui.
- Production Worker, Production secrets, dan deployment tidak disentuh tanpa persetujuan eksplisit.

## 5. Status Verifikasi dan Batas Operasional

- RBAC design: APPROVED oleh pemilik proyek.
- RBAC-01 source foundation: IMPLEMENTED pada branch `dev` (private storage schema, exact path allowlist, GitHub Contents API read/create/update dengan SHA concurrency). Belum ada endpoint publik/admin untuk memanipulasi akun atau mapping.
- `npm test`: NOT RUN atas instruksi pemilik proyek untuk melewati proses tersebut. Test `test/rbac-storage.test.js` sudah ditambahkan ke suite lokal.
- Syntax/static checks: NOT RUN.
- Development runtime/deployment: NOT VERIFIED.
- Production: tidak disentuh.
- Tidak ada secret, credential, `wrangler.jsonc`, atau konfigurasi Cloudflare yang diubah.

## 6. Aturan Melanjutkan Pekerjaan

1. Kerjakan satu tahap RBAC pada satu waktu dan perbarui status tabel ini.
2. Jangan mengklaim tahap selesai hanya karena dokumentasi atau desain tersedia.
3. Catat file yang berubah, risiko, pengujian yang tidak dijalankan, dan batasan verifikasi.
4. Pertahankan kompatibilitas Admin yang ada sampai penggantiannya diuji dan disetujui.
5. Jangan mengubah `main`, Worker Production, secrets, atau melakukan deployment.
6. Jangan migrasikan atau menghapus Guestbook lama tanpa keputusan eksplisit.
7. RBAC-01/02/03 telah memiliki fondasi source pada branch dev, tetapi belum diverifikasi. Tahap berikutnya RBAC-04 User login; verifikasi runtime tetap terpisah.


## 7. RBAC-01 Implementation Record (2026-11-21)
- **Status**: IMPLEMENTED — NOT VERIFIED.
- Added `src/modules/rbac/storage.js`.
- Private document paths are exact allowlist entries only: `private/auth/users.json` and `private/repositories/mappings.json`; public path validation remains separate and unchanged.
- User schema validates unique IDs/usernames, PBKDF2 hash format and iteration bounds, fixed `role=user`, active/disabled status, timestamps, and rejects unknown fields.
- Repository mapping schema validates user IDs, owner/repository/branch, canonical HTTPS Origin, status, timestamps, one active mapping per repository, and one active repository per Origin.
- Storage reads use the private GitHub Contents API path directly, enforce 1 MiB and UTF-8/JSON/schema checks, distinguish a missing file from an inaccessible repository by confirming repository access, and return the current blob SHA.
- Storage writes use a fixed path, enforce schema and size, use create-only when `expectedSha=null`, and require a valid current SHA for updates. GitHub 409 conflict is propagated; there is no blind overwrite or automatic retry.
- Added `test/rbac-storage.test.js` and included it in the local `npm test` command. Tests were **NOT RUN** by user instruction. Syntax/static check: **NOT RUN**. Runtime: **NOT VERIFIED**.
- No endpoint, account record, repository mapping, private database file, secret, Wrangler configuration, Worker setting, deployment, or Production resource was changed.
- Remaining limitation: no transactional update across users and repository-mapping documents. Callers must preserve referential integrity and re-read latest SHA before a write; concurrency conflicts must be handled explicitly.


## 8. RBAC-02 Implementation Record (2026-11-21)
- **Status**: IMPLEMENTED — NOT VERIFIED; no User endpoints are routed yet.
- `src/middleware/auth.js` now exports `adminAuthMiddleware`, legacy alias `authMiddleware`, and `userAuthMiddleware`.
- Admin validation requires issuer `dekeku-api`, audience `dekeku-admin`, and role `admin`. User validation requires audience `dekeku-user` and role `user`; User account ID/status is rechecked against private `users.json` on every authenticated request.
- `repositoryOwnershipMiddleware` accepts only an opaque mapping ID, reloads and validates the private user/mapping documents, requires an active mapping owned by the authenticated account, and attaches server-sourced owner/repository/branch/Origin metadata. It does not accept client-selected repository coordinates or file paths.
- Added `test/rbac-auth.test.js` for Admin/User audience isolation and ownership middleware input gates; registered in `npm test`.
- `npm test` and syntax/static checks: **NOT RUN** by instruction. Development runtime: **NOT VERIFIED**.
- User login, user routes, data CRUD, and path scoping are not implemented in this stage. Middleware must be mounted behind `userAuthMiddleware` before ownership checks are used.
- Next: RBAC-03 Admin account/repository management and RBAC-04 User login; retain the current no-test/no-deploy boundary.


## 9. RBAC-03 Implementation Record (2026-11-21)
- **Status**: IMPLEMENTED — NOT VERIFIED.
- Added src/modules/rbac/admin.js with Admin-only handlers for:
  - POST/GET /api/v1/admin/users
  - GET/PATCH /api/v1/admin/users/:id
  - POST /api/v1/admin/users/:id/reset-password
  - POST/GET /api/v1/admin/users/:id/repositories
  - PATCH/DELETE /api/v1/admin/repositories/:id (DELETE is soft-disable).
- Added router mounts behind existing Admin JWT middleware; legacy Admin routes remain intact.
- Account creation accepts only username/password, creates a random immutable ID, fixed role user, active status, and PBKDF2-SHA256 hash. Password length is constrained to 12–128 characters. Hashes are never included in responses.
- Repository mapping accepts only owner/repo/branch/Origin, validates the complete mapping against current users and uniqueness rules, and writes only to the fixed private mapping document. Client cannot set mapping ID, userId, status, or database path.
- JSON request bodies are streamed with a 16 KiB cap, require application/json, fatal UTF-8 decoding, and reject unknown fields. Private writes use the latest fetched SHA; conflicts are surfaced without blind overwrite/retry.
- Added test/rbac-admin.test.js for route authentication isolation and registered it in npm test.
- Verification: npm test NOT RUN per instruction; syntax/static checks NOT RUN; Development runtime NOT VERIFIED. No account/mapping data was created.
- Limitations: cross-document operations remain non-transactional; repository existence/ownership on GitHub is not remotely verified at registration time; Admin must supply correct owner/repo/branch. No pagination yet for account/mapping lists.
- Next: RBAC-04 User login and 30-minute User JWT. RBAC-01/02/03 runtime verification remains pending.
