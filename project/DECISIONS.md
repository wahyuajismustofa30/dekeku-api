# ARCHITECTURE DECISIONS — DEKEKU API Gateway

| ID | Judul | Konteks | Keputusan |
| :--- | :--- | :--- | :--- |
| **D-001** | Public GET Access | Akses data untuk website statis. | Endpoint GET bersifat publik tanpa autentikasi klien. |
| **D-002** | GitHub Privacy | Keamanan data dan file. | Repository GitHub tetap privat; akses melalui server-side token. |
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

Status keputusan D-016 s/d D-022: APPROVED DESIGN; implementation and runtime verification remain pending. See [RBAC_PLAN.md](RBAC_PLAN.md).
