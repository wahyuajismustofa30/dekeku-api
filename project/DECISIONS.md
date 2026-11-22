# ARCHITECTURE DECISIONS — DEKEKU API Gateway

| ID | Judul | Konteks | Keputusan |
| :--- | :--- | :--- | :--- |
| **D-001** | Public GET Access | Akses data untuk website statis. | Endpoint GET bersifat publik tanpa autentikasi klien. |
| **D-002** | GitHub Privacy (historical scope) | Perlindungan data dan kredensial. | Kredensial dan data internal harus tetap privat serta diakses server-side. Untuk data publik proyek, D-027 menetapkan repository publik masing-masing proyek sebagai storage; D-027 supersedes the blanket-private-repository assumption for public project data. |
| **D-003** | Token Management | Penyimpanan kredensial. | GITHUB_TOKEN disimpan sebagai Cloudflare Worker Secret. |
| **D-004** | Restricted Public Path | Pencegahan kebocoran kode/config. | Pembacaan file publik dibatasi pada direktori public/. |
| **D-005** | Write Authorization | Operasi tulis administratif. | Operasi administratif/write engine memerlukan JWT admin; public submit memiliki validasi tersendiri. |
| **D-006** | JWT Secret Separation | Keamanan otentikasi. | JWT_SECRET dipisahkan dari GITHUB_TOKEN. |
| **D-007** | Admin Registration | Mencegah akses liar. | Tidak ada registrasi admin publik. |
| **D-008** | Environment Isolation | Stabilitas produksi. | Worker dekeku-api-dev dan github (prod) dipisahkan. |
| **D-009** | Production Protection | Keamanan live service. | Worker github (api.dekeku.my.id) tidak boleh diubah tanpa izin eksplisit. |
| **D-010** | Change Authority | Tata kelola proyek. | Perubahan tujuan dan arsitektur membutuhkan persetujuan pemilik proyek. |
| **D-011** | Git Workflow Policy | Tata kelola kode. | Pengembangan dilakukan pada dev; penggabungan ke main melalui PR yang ditinjau manusia. |
| **D-012** | CORS Policy | Keamanan cross-origin. | Deny-by-default dengan ALLOWED_ORIGINS, exact HTTPS dan wildcard subdomain. |
| **D-013** | Login Abuse Protection | Mitigasi brute force. | Rate limiting berbasis IP menggunakan Cloudflare WAF. |
| **D-014** | Caller Repository Metadata | Metadata repository pemanggil. | Origin tervalidasi memilih config.json; owner harus sama dengan GITHUB_OWNER; hanya metadata publik. Origin bukan autentikasi. |
| **D-015** | Guestbook Per-Origin Storage | Pemisahan data Guestbook. | Setiap hostname dari Origin HTTPS yang diizinkan disimpan sebagai array JSON di public/data/{hostname}/bukutamu.json; titik hostname dipertahankan. SHA optimistic concurrency memakai retry terbatas dengan pembacaan ulang. Batas file 1 MiB; data lama tidak dimigrasikan otomatis. |


## RBAC Decisions — Approved (2026-11-21)

| ID | Judul | Konteks | Keputusan |
| :--- | :--- | :--- | :--- |
| **D-016** | RBAC Roles & Scope | Pemisahan kewenangan API. | Admin mengelola seluruh data yang dikelola API; User hanya repository miliknya di bawah `assets/data/`; Guest hanya mengirim Guestbook publik tanpa login. |
| **D-017** | User JWT Policy | Isolasi token Admin dan User. | User memakai audience `dekeku-user`, role `user`, dan masa berlaku 30 menit. Admin tetap memakai audience `dekeku-admin` dan role `admin`. |
| **D-018** | Private Account Storage | Penyimpanan akun dan mapping. | Akun dan mapping disimpan di repository privat `dekeku-db`; password PBKDF2-SHA256; akun dibuat Admin; mapping repository/Origin ditentukan server. Satu User dapat memiliki banyak repository. |
| **D-019** | User Data Boundary | Mencegah akses lintas akun dan path arbitrer. | User hanya dapat mengakses `assets/data/` pada repository yang terdaftar untuk akunnya. Klien tidak dapat menentukan owner/repository/branch/path arbitrer. |
| **D-020** | Guestbook Destination | Pemisahan Guestbook antar website. | Guestbook ditulis ke `assets/data/bukutamu.json` di repository website yang dipetakan ke Origin. Public reads dilakukan melalui static repository/CDN URL, bukan Worker. Origin bukan autentikasi. |
| **D-021** | Legacy Guestbook Preservation | Mencegah kehilangan data lama. | File lama `public/data/{hostname}/bukutamu.json` tidak boleh dihapus atau dimigrasikan otomatis; strategi migrasi memerlukan keputusan terpisah. |
| **D-022** | Browser User Token Storage | Penyimpanan sesi browser. | Token User disimpan di `sessionStorage` dengan key `dekeku_user_access_token`, bukan `localStorage`; dibersihkan saat logout atau sesi invalid. Risiko XSS tetap harus diperhitungkan. |

Status keputusan D-016 s/d D-021: APPROVED DESIGN; implementation recorded in RBAC_PLAN.md and remains runtime NOT VERIFIED. D-022 browser sessionStorage implementation is present in both Tester pages; source review VERIFIED, automated test execution and Development browser runtime NOT VERIFIED. See [RBAC_PLAN.md](RBAC_PLAN.md).


### Guestbook destination decision precedence (2026-11-21)
- D-015 documents the earlier per-hostname storage design under `public/data/{hostname}/bukutamu.json`.
- For the RBAC Guestbook flow, the later approved D-020 is authoritative: new submissions go to `assets/data/bukutamu.json` in the active website repository mapped to the exact Origin.
- D-021 remains in force: legacy D-015 files are preserved and are not migrated/deleted automatically.


| **D-023** | Immediate User JWT Revocation | Respons setelah Admin melakukan reset password User. | SETUJU: semua JWT User yang diterbitkan sebelum reset password harus langsung ditolak. Terapkan mekanisme token/session version server-side pada record User; versi dimasukkan ke JWT baru dan diverifikasi pada setiap request User terautentikasi. Reset password menaikkan versi secara aman menggunakan SHA concurrency. JWT Admin tidak terpengaruh. Keputusan disetujui 2026-11-21; source implementation tersedia di dev; syntax check dan focused test PASS berdasarkan laporan pemilik dari Termux; Development runtime NOT VERIFIED. |


## D-023 Verification Status Update (2026-11-21)
- Decision remains APPROVED: successful Admin password reset immediately invalidates all earlier User JWTs for that account; Admin JWTs are unaffected.
- Implementation is present on branch `dev`.
- Owner reports Termux verification PASS: `node --check` for all RBAC source/test files and `node --test test/rbac-token-version.test.js` (6 PASS, 0 FAIL).
- The results are owner-reported and were not independently re-executed in this session.
- Development deployment/runtime remains NOT VERIFIED; the currently deployed Worker has not received this source change. Production remains untouched.


## D-024 — Hierarki Otoritas dan Pembagian Peran (2026-11-21)
- **Status**: DISETUJUI PEMILIK PROYEK.
- **Wahyu** adalah pemilik proyek dan pemegang seluruh keputusan final; instruksi eksplisit terbarunya menjadi acuan tertinggi.
- **ChatGPT** adalah asisten pengembangan utama pada urutan kedua: membantu analisis, perencanaan, koordinasi, penyusunan instruksi, dan review; dapat mendelegasikan pekerjaan kepada Codex dalam batas persetujuan Wahyu.
- **Codex di Termux** adalah asisten pelaksana pada urutan ketiga: membantu ChatGPT mengerjakan pemeriksaan, perubahan repository, pengujian, dan pelaporan sesuai delegasi; tidak boleh mengubah tujuan, arsitektur, ruang lingkup, atau batas operasional secara mandiri.
- Jika dokumen, keputusan terdahulu, implementasi, atau arahan asisten bertentangan dengan instruksi eksplisit terbaru Wahyu, tindakan yang terdampak dihentikan dan konflik dilaporkan. Berikan pilihan atau minta persetujuan spesifik sesuai dampaknya.
- Jika perintah Wahyu jelas dan aman, dokumentasi yang bertentangan diperbarui; catatan historis tidak boleh dipalsukan.
- Bukti kode/runtime menentukan fakta teknis aktual, tetapi tidak mengalahkan otoritas keputusan Wahyu.
- Rujukan pelaksanaan: `AGENTS.md` dan bagian 8 `project/MASTER.md`.


## D-025 — Branch, PR Validation, and Development CI/CD (2026-11-21)

- **Status:** DISETUJUI PEMILIK PROYEK.
- Seluruh pengembangan dilakukan pada branch `dev`; perubahan yang sudah stabil diajukan melalui Pull Request dari `dev` ke `main`. Commit/push langsung ke `main` dilarang.
- PR wajib menjalankan validasi yang disepakati. Kegagalan pemeriksaan kritis memblokir penggabungan; pemeriksaan non-kritis dapat menjadi peringatan pada tahap awal. PR tidak melakukan deployment.
- Setelah perubahan masuk ke `main`, GitHub Actions ditujukan untuk melakukan deployment otomatis hanya ke Development Worker `dekeku-api-dev`.
- Deployment menggunakan kredensial khusus Development, verifikasi target, kontrol concurrency, dan pencatatan commit/deployment. Tidak boleh ada fallback ke Production.
- Production Worker `github`, domain `api.dekeku.my.id`, kredensial, konfigurasi, dan data Production tetap di luar cakupan serta tidak boleh diubah tanpa persetujuan eksplisit.
- **Status implementasi:** kebijakan target disetujui; workflow belum dibuat atau diverifikasi. Lihat CICD-001 s/d CICD-010 di `BACKLOG.md`.

## D-026 — Maximum Two Branches & Existing Cloudflare Git Deployment (2026-11-22)

- **Status:** DISETUJUI MELALUI INSTRUKSI TERBARU PEMILIK.
- Repository hanya boleh memiliki dua branch: `main` dan `dev`. Jangan membuat branch ketiga, termasuk branch sementara. Jaga kedua branch tetap sinkron sesuai kebutuhan.
- Pengembangan tetap dilakukan di `dev`; perubahan stabil diajukan melalui PR ke `main`. Jangan commit/push langsung ke `main` dan jangan merge PR secara mandiri.
- Pemilik melaporkan Cloudflare Workers auto-deployment melalui GitHub telah dikonfigurasi dan deployment dari GitHub berhasil. Catatan ini adalah laporan pemilik; pengaturan dashboard, pemetaan branch, target Worker, deployed version, dan health belum diverifikasi independen.
- `.github/workflows/pr-validation.yml` adalah workflow validasi PR saja dan tidak melakukan deployment. Jangan membuat mekanisme deployment duplikat sebelum integrasi Cloudflare yang sudah ada diperiksa.
- Target deployment yang diperbolehkan dalam pekerjaan ini adalah Development Worker `dekeku-api-dev` saja. Production Worker `github`, domain `api.dekeku.my.id`, kredensial, konfigurasi, dan data Production tetap dilarang disentuh.
- **Bukti sinkronisasi 2026-11-22:** `dev` fast-forward ke `main`; kedua branch identik pada commit `1649701419f6d1b03b5f659c76f02d02b4355ad8`.


## D-027 — Fokus Pengelolaan Repository Publik (2026-11-22)

- **Status:** DISETUJUI MELALUI INSTRUKSI TERBARU PEMILIK.
- Fokus pekerjaan saat ini adalah pengelolaan data publik pada repository masing-masing proyek.
- Website membaca data publik langsung dari repository publik/CDN; operasi administratif create/read/update/delete dan penjelajahan file dikelola melalui DEKEKU API Gateway.
- Pengaturan repository privat `dekeku-db`, private account storage, repository mapping, dan perluasan RBAC dipindahkan ke arsip dan tidak menjadi antrean aktif sampai pemilik meminta reaktivasi.
- Kode, test, dan keputusan historis terkait repository privat tidak dihapus oleh perubahan ruang lingkup ini.
- Implementasi harus memvalidasi Origin dan identitas repository di sisi server; jangan menerima owner/repository/branch arbitrer dari klien. Production tetap di luar cakupan tanpa persetujuan eksplisit.
