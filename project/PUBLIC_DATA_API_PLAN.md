# Public Data API — Work Plan v1

Tanggal persetujuan: 2026-11-23
Status: APPROVED DESIGN — IMPLEMENTATION NOT STARTED
Branch target: `dev`
Prioritas: AKTIF (menggantikan sementara urutan kerja Admin Dashboard)

## 1. Tujuan

Menyediakan pola endpoint publik yang dapat diperluas untuk berbagai jenis formulir/data kiriman tanpa membuat endpoint khusus untuk setiap resource:

`POST /api/v1/public/data/{resource}`

Resource pertama adalah `guestbook`. Penambahan resource berikutnya dilakukan melalui Resource Registry dan validator khusus, bukan dengan menambah handler endpoint yang menduplikasi engine.

## 2. Arsitektur yang disetujui

1. **Resource Registry** — daftar resource yang diizinkan dan dikendalikan server. Setiap entri menentukan status enabled, method, validator/schema, storage path tetap, bentuk dokumen JSON, dan batas ukuran.
2. **Resource Validator** — validasi payload terpisah untuk setiap resource. Klien tidak dapat mengubah aturan atau storage path.
3. **Project Repository Resolver** — resolver bersama berdasarkan Project Origin dan kontrak `config.json` yang digunakan File Manager. Periksa implementasi aktual sebelum menyatukan resolver; jangan menganggap resolver Guestbook lama dan File Manager identik.
4. **Shared Storage Engine** — memusatkan parsing body terbatas, validasi Origin, resolusi repository, pemeriksaan repository publik, validasi dokumen, GitHub write, SHA optimistic concurrency, retry terbatas sesuai perilaku aman saat ini, dan error response yang aman.
5. **Guestbook Migration** — migrasikan Guestbook menjadi resource `guestbook` dengan kompatibilitas payload dan format data yang sudah berlaku.
6. **Legacy Alias** — `POST /api/v1/public/submit` tetap tersedia sementara dan meneruskan ke handler Guestbook yang sama; tidak boleh ada business logic duplikat.
7. **Public Read** — website membaca file dari repository publik/CDN secara langsung. GET API baru tidak termasuk cakupan tahap awal.

## 3. Daftar pekerjaan

- [ ] **PUB-DATA-001 — API Contract**
  - Tetapkan route, method, request/response, status code, error contract, dan perilaku resource tidak dikenal/nonaktif.
  - Pastikan endpoint publik tidak membutuhkan Admin JWT.
  - Acceptance: kontrak terdokumentasi dan sesuai pola router yang aktual.

- [ ] **PUB-DATA-002 — Resource Registry**
  - Buat registry allowlist yang ditentukan server.
  - Definisikan metadata per resource: enabled, validator, fixed storage path, JSON shape, dan limit.
  - Acceptance: resource tidak terdaftar/nonaktif ditolak; klien tidak dapat menentukan owner/repo/branch/path.

- [ ] **PUB-DATA-003 — Shared Storage Engine**
  - Implementasikan komponen bersama untuk bounded body parsing, JSON validation, Origin enforcement, resolver, repository visibility, GitHub write, SHA conflict/concurrency, dan safe errors.
  - Acceptance: engine tidak menerima koordinat repository atau path arbitrer dari request; gagal tertutup saat resolver/config/repository tidak valid.

- [ ] **PUB-DATA-004 — Guestbook Migration**
  - Daftarkan Guestbook sebagai resource `guestbook`.
  - Pertahankan schema field, batas, timestamp, bentuk file, dan tujuan penyimpanan sesuai temuan source aktual.
  - Acceptance: pengiriman Guestbook melalui route baru tersimpan dengan format kompatibel; tidak menghapus/memindahkan data lama otomatis.

- [ ] **PUB-DATA-005 — Legacy Compatibility**
  - Pertahankan `POST /api/v1/public/submit` sebagai alias ke implementasi Guestbook yang sama.
  - Acceptance: route lama dan baru memakai validasi/engine identik; tidak ada duplikasi business logic.

- [ ] **PUB-DATA-006 — Security & Integration Tests**
  - Uji Origin/CORS, no-JWT public flow, malformed JSON, body/file size, schema, unknown/disabled resource, path traversal, resolver/config errors, private/inaccessible repository, GitHub conflict, serta legacy alias.
  - Gunakan mock/fixture; jangan menulis atau menghapus data proyek aktif tanpa izin.
  - Acceptance: seluruh test relevan lulus dan bukti dicatat.

- [ ] **PUB-DATA-007 — Documentation & Checkpoint**
  - Perbarui API usage/reference, architecture, Guestbook integration, backlog, progress, decisions, changelog, dan checkpoint.
  - Perbaiki referensi dokumentasi Guestbook lama yang tidak cocok dengan source aktual.
  - Acceptance: dokumen konsisten dengan implementasi dan bukti; status tidak melebih-lebihkan verifikasi.

## 4. Keamanan dan kompatibilitas wajib

- Origin adalah kontrol kepercayaan browser/CORS, bukan autentikasi.
- Jangan menerima owner, repository, branch, atau storage path dari klien.
- Registry dan validator harus fail-closed.
- Pertahankan batas ukuran body/file, validasi UTF-8/JSON, perlindungan traversal, repository public check, dan kontrol SHA concurrency yang relevan.
- Jangan menghapus atau memigrasikan file Guestbook lama secara otomatis.
- Jangan mengubah User Data API, Admin API, atau Admin Dashboard sebagai bagian pekerjaan ini.
- Tidak membuat GET API publik baru pada fase awal.
- Periksa source aktual untuk menyelesaikan perbedaan antara resolver Guestbook lama dan Project Origin resolver File Manager sebelum memilih implementasi final.

## 5. Urutan prioritas dan batas operasional

- PUB-DATA-001 s.d. PUB-DATA-007 menjadi workstream aktif dan didahulukan.
- Admin Dashboard ADM-001..ADM-008 dijeda sementara; implementasi dan hasil yang sudah ada tetap dipertahankan. Jangan menghapus atau merombak pekerjaan Dashboard.
- Implementasi hanya pada branch `dev`.
- Tidak membuat branch ketiga, tidak commit/push selama pekerjaan belum memenuhi kriteria matang, tidak membuat PR, tidak merge.
- Tidak melakukan deployment atau perubahan Cloudflare config/bindings/secrets/variables.
- Production Worker, domain, credentials, dan data Production tidak boleh disentuh.
- Jika ditemukan konflik desain/source yang memengaruhi keamanan atau kompatibilitas, hentikan bagian terkait dan laporkan sebelum mengambil keputusan.

## 6. Status pelaksanaan

Semua item PUB-DATA-001..007: NOT STARTED.
Dokumen ini merekam keputusan dan daftar pekerjaan; dokumen ini bukan bukti implementasi, pengujian, atau deployment.
