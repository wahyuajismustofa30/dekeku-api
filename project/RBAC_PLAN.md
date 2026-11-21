# RBAC Implementation Plan — DEKEKU API

Tanggal pencatatan: 2026-11-21
Status: RBAC-01–07 IMPLEMENTED — NOT VERIFIED
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
| RBAC-04 | User login & JWT | Login User, PBKDF2, JWT audience user, TTL 30 menit | IMPLEMENTED — NOT VERIFIED |
| RBAC-05 | User data CRUD | CRUD JSON terisolasi pada `assets/data/` untuk repository milik user | IMPLEMENTED — NOT VERIFIED |
| RBAC-06 | Private/public data boundary | Tutup pembacaan data privat; pastikan endpoint publik tidak membocorkan data privat | IMPLEMENTED — NOT VERIFIED |
| RBAC-07 | Guestbook per website repository | Origin mapping ke repository website; tulis `assets/data/bukutamu.json`; mitigasi concurrency/cache | IMPLEMENTED — NOT VERIFIED |
| RBAC-08 | Browser User session | Login UI, sessionStorage, Bearer token, logout/401 cleanup | IMPLEMENTED — NOT VERIFIED |
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
- RBAC-01 sampai RBAC-04 memiliki implementasi source pada branch `dev`; seluruh tahap masih NOT VERIFIED. Admin management dan User login routes telah ditambahkan. Tidak ada akun/mapping nyata dibuat.
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
7. RBAC-01 sampai RBAC-08 telah memiliki implementasi source pada branch dev, tetapi belum diverifikasi. Tahap berikutnya RBAC-09 Security & Regression Review; verifikasi runtime tetap terpisah.


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
- Next: RBAC-05 User data CRUD under assets/data/. RBAC-01–04 runtime verification remains pending.


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
- Next: RBAC-05 User data CRUD. RBAC-01–04 runtime verification remains pending.


## 10. RBAC-04 Implementation Record (2026-11-21)
- Status: IMPLEMENTED — NOT VERIFIED.
- Added src/modules/auth/user-login.js and public POST /api/v1/user/login route in src/core/router.js.
- Login reads the fixed private private/auth/users.json document through the GitHub Contents API. Username matching is case-insensitive; only active accounts may authenticate.
- Password verification uses the existing PBKDF2-SHA256 verifier. Unknown usernames still execute PBKDF2 verification against a fixed dummy hash to reduce username-enumeration timing differences. Authentication failures share the same 401 response.
- Successful login issues HS256 JWT with iss=dekeku-api, aud=dekeku-user, sub=<immutable user ID>, role=user, iat, and exp=iat+1800. Response includes access_token, token_type=Bearer, expires_in=1800, and non-sensitive user identity only.
- Request parsing requires application/json, streams at most 16 KiB, enforces fatal UTF-8 and JSON object shape, and rejects unknown fields. Password input is limited to 128 characters.
- Added test/rbac-user-login.test.js for method, content-type, malformed JSON, and unsupported-field contracts; registered in local npm test.
- Verification: npm test NOT RUN per explicit instruction; syntax/static checks NOT RUN; Development runtime NOT VERIFIED. No actual account was created and no private data was written.
- Security limitation: login endpoint still needs verified Cloudflare WAF/IP rate limiting before production exposure; no new application-level login throttling or audit log is included in this stage.
- Next: RBAC-05 User data CRUD restricted to assets/data/, using existing User authentication and repository ownership middleware. RBAC-01 through RBAC-04 remain NOT VERIFIED at runtime.


## 11. RBAC-05 Implementation Record (2026-11-21)
- Status: IMPLEMENTED — NOT VERIFIED.
- Added src/modules/rbac/user-data.js and mounted User routes in src/core/router.js:
  - GET /api/v1/user/repositories
  - GET /api/v1/user/data
  - POST /api/v1/user/data
  - PUT /api/v1/user/data
  - DELETE /api/v1/user/data
- All routes require User JWT (aud=dekeku-user, role=user) and active account status. Data operations additionally resolve repositoryId through private mappings and enforce mapping.userId equals JWT subject; owner/repo/branch are server-sourced only.
- User file paths are relative and server-prefixed with assets/data/. Percent encoding, backslash, traversal, hidden segments, absolute paths, control characters, repeated separators, and non-JSON extensions are rejected.
- GET returns parsed JSON plus current blob SHA. POST creates without SHA; PUT and DELETE require a valid 40-character SHA and rely on GitHub optimistic concurrency. No automatic retry or blind overwrite.
- JSON roots must be object/array; file content is limited to 1 MiB; request bodies are streamed and capped at 1,153,434 bytes. UTF-8 is decoded strictly.
- Added test/rbac-user-data.test.js for path boundary and route authorization and registered it in local npm test.
- Verification: npm test NOT RUN per explicit instruction; syntax/static checks NOT RUN; Development runtime NOT VERIFIED. No User account, mapping, or website repository data was created or modified.
- Risks/limitations: repository listing and per-file operations have no pagination/bulk listing; no application-level write rate limiting; GitHub SHA conflicts surface to caller. WAF and runtime checks remain pending.
- Next: RBAC-08 Browser User session integration. RBAC-01 through RBAC-07 remain NOT VERIFIED at runtime.


## 12. RBAC-06 — Private/Public Data Boundary Review (2026-11-21)
- **Status**: IMPLEMENTED — NOT VERIFIED.
- Source review confirms `GET /api/v1/github/file` uses `GitHubClient.getFile()`, which applies `validatePublicPath()` before any upstream request. The validator requires the first segment to be exactly `public`, rejects hidden path segments, traversal, empty segments, sensitive filenames, and non-allowlisted extensions.
- The private account and repository mapping files are only accessible through the exact fixed allowlist in `src/modules/rbac/storage.js`; the public reader cannot address `private/` or User `assets/data/` paths.
- Admin management routes remain behind Admin JWT middleware; User routes require User JWT and ownership checks; Guest submission remains separate and requires a valid allowlisted Origin.
- Added `test/rbac-boundary.test.js` and registered it in the local npm script.
- Source review: VERIFIED. Automated test execution: NOT RUN per instruction. Syntax/static checks: NOT RUN. Development runtime: NOT VERIFIED.
- No real account/mapping/data, secrets, Cloudflare settings, Wrangler configuration, deployment, or Production resources changed.
- Next: RBAC-07 Guestbook per mapped website repository.


## 13. RBAC-07 — Guestbook per Mapped Website Repository (2026-11-21)
- **Status**: IMPLEMENTED — NOT VERIFIED.
- Updated `src/modules/public/submit.js`. The Guest POST route first validates Origin against the shared HTTPS allowlist, then loads private user and repository mapping documents from the central `dekeku-db` repository.
- Only an active mapping with an exact canonical Origin match is accepted. Owner, repository, branch, and destination path are never accepted from the request; all destination coordinates are sourced from the private mapping.
- The target repository is checked through GitHub and must be public, because Guestbook reads are intended to use static repository/CDN URLs. A missing/inaccessible repository or private repository is rejected before any Guestbook file write.
- The only write target is the fixed `assets/data/bukutamu.json` path in the mapped website repository. Legacy files at `public/data/{hostname}/bukutamu.json` remain untouched.
- Request JSON is streamed and capped at 15 KiB, decoded as strict UTF-8, and rejects unsupported fields. Stored Guestbook JSON must be an array; file size is capped at 1 MiB. Existing entries are appended using current SHA; 409 conflicts trigger a fresh read/retry for at most three write attempts.
- Updated `test/public-submission.test.js` for mapped target create/append, SHA conflict retry, unregistered Origin, private/missing target repository, unsupported fields, payload/content-type, and method handling. It is already included in `package.json`.
- Source review: VERIFIED. Test execution: NOT RUN per user instruction. Syntax/static checks: NOT RUN. Development runtime: NOT VERIFIED.
- **Limitations / required follow-up**: Origin is spoofable by non-browser clients and is not authentication. No application-level rate limiter is implemented. Verify/configure Cloudflare WAF/IP rate limiting for `POST /api/v1/public/submit` in Development before public exposure. Existing CDN cache/invalidation is outside the Worker write path and must be checked at the website integration layer.
- No real account/mapping or website data was changed; no secrets, Wrangler/Cloudflare configuration, deployment, or Production resources touched.
- Next: RBAC-08 Browser User session integration.


## 14. RBAC-08 — Browser User Session Integration (2026-11-21)
- **Status**: IMPLEMENTED — NOT VERIFIED.
- Updated generated Tester page `src/modules/tester/index.js` and static copy `public/tester.html`.
- Added User login UI calling `POST /api/v1/user/login`. It consumes `access_token`, clears the password input, and never renders or logs the JWT.
- User token is persisted only in `sessionStorage` under `dekeku_user_access_token`; the same tab session can restore it after page reload. If sessionStorage cannot be written, the UI does not establish a session.
- Added separate `userRequest()` helper that attaches User Bearer token. Public `apiRequest()` strips Authorization, while Admin requests retain the existing in-memory Admin token. Role tokens are never shared between helpers.
- Added User logout and repository-list request. User 401 or account-disabled 403 clears only User session; Admin 401 clears only Admin in-memory token.
- Updated `test/tester-dashboard.test.js` to assert script parsing, same-origin request policy, public/Admin/User Authorization separation, sessionStorage key/read/write/remove, and User session cleanup.
- Source review: VERIFIED. Automated tests and syntax checks: NOT RUN per explicit instruction. Development browser/runtime: NOT VERIFIED.
- Security limitation: sessionStorage remains accessible to same-origin JavaScript and does not mitigate XSS. Avoid third-party scripts and preserve output escaping/CSP. JWT remains valid for up to 30 minutes as enforced by API.
- No secrets, account/mapping records, Wrangler/Cloudflare settings, deployment, or Production resources changed.
- Next: RBAC-09 Security & Regression Review.
