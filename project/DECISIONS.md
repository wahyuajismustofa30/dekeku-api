# ARCHITECTURE DECISIONS — DEKEKU API Gateway

| ID | Judul | Konteks | Keputusan |
| :--- | :--- | :--- | :--- |
| **D-001** | Public GET Access | Akses data untuk website statis. | Endpoint GET bersifat publik tanpa autentikasi klien. |
| **D-002** | GitHub Privacy | Keamanan data dan file. | Repository GitHub tetap privat; akses melalui server-side token. |
| **D-003** | Token Management | Penyimpanan kredensial. | `GITHUB_TOKEN` disimpan sebagai Cloudflare Worker Secret. |
| **D-004** | Restricted Public Path | Pencegahan kebocoran kode/config. | Pembacaan file publik dibatasi pada direktori `public/`. |
| **D-005** | Write Authorization | Operasi tulis (Phase 2). | Seluruh operasi administratif/tulis memerlukan autentikasi JWT. |
| **D-006** | JWT Secret Separation | Keamanan otentikasi. | `JWT_SECRET` dipisahkan dari `GITHUB_TOKEN`. |
| **D-007** | Admin Registration | Mencegah akses liar. | Tidak ada registrasi admin publik; identitas admin bersifat internal. |
| **D-008** | Environment Isolation | Stabilitas produksi. | Worker `dekeku-api-dev` dan `github` (prod) dipisahkan. |
| **D-009** | Production Protection | Keamanan live service. | Worker `github` (`api.dekeku.my.id`) tidak boleh diubah tanpa izin eksplisit. |
| **D-010** | Change Authority | Tata kelola proyek. | Perubahan tujuan, arsitektur, dan roadmap membutuhkan persetujuan Wahyu. |
| **D-011** | Git Workflow Policy | Tata kelola perubahan kode & PR review. | **ACCEPTED** (Ditetapkan Wahyu): Semua commit pengembangan dilakukan pada branch `dev`, push ke `origin/dev`, dan penggabungan ke `main` melalui Pull Request (PR) dev -> main yang ditinjau dan digabungkan oleh manusia. |
| **D-012** | CORS Policy | Keamanan akses cross-origin. | **PROPOSED** (Menunggu persetujuan Wahyu): Kebijakan deny-by-default dengan allowlist origin terkonfigurasi melalui environment variable `ALLOWED_ORIGINS` (dipisahkan koma), tanpa wildcard. |
| **D-013** | Login Abuse Protection | Mitigasi brute force pada admin login. | **PROPOSED** (Menunggu persetujuan Wahyu): Rate limiting berbasis IP menggunakan Cloudflare WAF, bukan account lockout di tingkat aplikasi. |
