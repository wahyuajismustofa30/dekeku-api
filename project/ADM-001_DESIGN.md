# ADM-001 — Durable Object & Encrypted Storage Design

Tanggal: 2026-11-23  
Status: DESIGN RECORDED / SOURCE IMPLEMENTED — TESTING DEFERRED  
Target branch: `dev`  
Target environment: Development Worker `dekeku-api-dev` only

## 1. Tujuan dan batas

ADM-001 menyiapkan dua fondasi terpisah:

1. Durable Object untuk koordinasi satu pekerjaan pemeriksaan repository yang berjalan di background.
2. Utility enkripsi terautentikasi untuk metadata Dashboard yang disimpan pada private repository `dekeku-db`.

Durable Object bukan pengganti `dekeku-db`. Metadata proyek tetap disimpan di repository privat melalui GitHub Contents API; Durable Object menyimpan state operasional terbaru dari job refresh. Tidak ada perubahan atau migrasi data lama sebagai bagian ADM-001.

Seluruh binding, migration, secret, test, dan verifikasi runtime hanya untuk Development. Production Worker `github`, domain `api.dekeku.my.id`, konfigurasi, secrets, dan data Production tidak boleh disentuh.

## 2. Durable Object job coordinator

### 2.1 Binding dan lifecycle

- Gunakan satu Durable Object instance bernama stabil untuk mengoordinasikan refresh Dashboard.
- Binding hanya ditambahkan ke konfigurasi Development Worker.
- Migration harus mendaftarkan class baru secara eksplisit; jangan mengganti atau menghapus class/migration yang sudah ada.
- Gunakan persistent Durable Object storage dan alarm untuk melanjutkan pekerjaan setelah request HTTP selesai atau instance dihentikan.
- Alarm hanya dijadwalkan sebagai akibat tindakan Admin manual (start/retry); tidak ada cron atau polling refresh otomatis.
- Semua endpoint pemicu dan pembacaan job wajib melalui Admin JWT.

### 2.2 State minimal

Simpan hanya state job terbaru, bukan histori:

- `jobId`, `status` (`queued`, `running`, `cancelling`, `cancelled`, `completed`, `completed_with_errors`, `failed`).
- Waktu mulai dan selesai.
- Total target, jumlah selesai, jumlah berhasil, jumlah gagal, dan jumlah tersisa.
- Daftar target repository yang sedang diproses atau belum diproses.
- Ringkasan hasil terakhir per repository dan error yang sudah disanitasi.
- Flag pembatalan dan identitas generasi job untuk mencegah worker lama menimpa state baru.

Jangan simpan token GitHub, JWT, password, hash password, encryption key, atau response GitHub mentah. Hindari menyimpan payload repository yang tidak diperlukan.

### 2.3 Concurrency, cancellation, retry

- Hanya satu refresh job aktif pada satu waktu; permintaan start lain ditolak dengan konflik yang terstruktur.
- Perubahan state harus atomik melalui transaksi storage.
- Setiap langkah pemrosesan memeriksa flag pembatalan dan job generation sebelum menulis hasil.
- Pembatalan menghentikan pekerjaan berikutnya secara kooperatif; hasil item yang telah selesai tetap dipertahankan.
- Retry membuat generasi job baru yang hanya memuat ID repository gagal. Item sukses tidak diproses ulang.
- Hasil akhir menggantikan snapshot job sebelumnya. Tidak ada tabel atau koleksi histori refresh.
- Batas ukuran job dan jumlah target harus ditentukan sebelum implementasi agar satu instance tidak menerima payload tanpa batas.

## 3. Encrypted metadata envelope

### 3.1 Algoritma dan format

Gunakan Web Crypto API yang tersedia di Workers:

- AES-256-GCM dengan authentication tag 128-bit.
- Key harus tepat 32 byte dan diperoleh dari secret Development `DB_ENCRYPTION_KEY`; format input yang direkomendasikan adalah base64url tanpa padding.
- Nonce/IV acak baru 12 byte untuk setiap operasi enkripsi melalui `crypto.getRandomValues`.
- Associated Authenticated Data (AAD) mengikat ciphertext ke konteks aplikasi, versi envelope, dan logical document path. Ciphertext dari satu dokumen tidak boleh dapat dipindahkan ke path dokumen lain.
- Format envelope JSON berversi dengan field persis: `version`, `algorithm`, `keyId`, `iv`, dan `ciphertext`. Nilai algoritma `A256GCM`; `keyId` mengidentifikasi versi key, bukan nilai key.
- Ciphertext harus memuat hasil enkripsi dan authentication tag dari Web Crypto. Tidak boleh menyimpan plaintext paralel.

### 3.2 Validasi dan perilaku fail-closed

- Key hilang, format key salah, panjang key salah, envelope tidak valid, nonce salah panjang, ciphertext kosong/terlalu besar, AAD tidak cocok, atau autentikasi/dekripsi gagal harus menghasilkan error internal yang aman.
- Tidak boleh ada fallback membaca atau menulis plaintext.
- Jangan mengembalikan plaintext parsial jika dekripsi gagal.
- Parsing hasil dekripsi menggunakan UTF-8 fatal dan JSON parse; dokumen hasil parse harus lolos schema validator sebelum digunakan.
- Batasi ukuran plaintext dan ciphertext sesuai batas file yang telah disepakati (maksimal 700 KiB untuk payload plaintext agar base64 envelope dan metadata tetap muat di batas file GitHub 1 MiB).
- Jangan memasukkan key, plaintext sensitif, ciphertext lengkap, nonce, atau detail kriptografi internal ke log aplikasi.
- Error yang diteruskan ke UI harus generik dan disanitasi; detail diagnosis hanya boleh berupa kategori error non-rahasia.

### 3.3 Rotasi key

- Envelope memiliki `keyId` agar rotasi dapat dirancang tanpa mengubah format.
- Implementasi awal menggunakan satu key aktif dan tidak melakukan fallback ke key lama secara implisit.
- Prosedur rotasi, re-enkripsi, rollback, dan pemulihan harus disepakati serta diuji sebelum rotasi key produksi apa pun. Rotasi Production tidak termasuk scope ini.

## 4. Integrasi dengan GitHub private storage

- Repository dan branch tujuan ditentukan dari konfigurasi server; klien tidak dapat memilih owner, repository, branch, atau path.
- Path dokumen metadata menggunakan exact allowlist.
- Data divalidasi sebelum dienkripsi dan setelah didekripsi.
- Update menggunakan SHA GitHub sebagai optimistic concurrency token; stale SHA menghasilkan conflict dan tidak boleh ditimpa otomatis.
- Missing private repository atau file yang tidak dapat diakses tidak boleh diam-diam dianggap sebagai database kosong.
- ADM-001 hanya membuat fondasi crypto dan kontrak storage. CRUD metadata Dashboard dikerjakan pada ADM-003.
- Storage RBAC lama tidak otomatis dimigrasikan atau diubah oleh ADM-001. Kondisi dan format penyimpanannya harus diaudit terpisah sebelum keputusan migrasi.

## 5. Konfigurasi Development

Perubahan konfigurasi yang direncanakan (belum diterapkan):

- Tambahkan binding Durable Object untuk class coordinator.
- Tambahkan migration class baru yang sesuai dengan mode storage Durable Object yang dipilih.
- Tambahkan secret `DB_ENCRYPTION_KEY` hanya pada Development Worker melalui prosedur secret yang aman; jangan menaruh nilainya di `wrangler.jsonc`, `.dev.vars` yang dilacak Git, source, test fixture, atau dokumentasi.
- Pertahankan target Worker `dekeku-api-dev` secara eksplisit.
- Jangan menambahkan binding, migration, secret, atau variable pada Worker Production.

Sebelum mengubah `wrangler.jsonc`, implementer harus memastikan konfigurasi branch saat ini dan seluruh migration yang sudah ada, lalu membuat perubahan minimal tanpa menghapus konfigurasi lain.

## 6. Test matrix wajib sebelum commit

### Enkripsi
- Round-trip encrypt/decrypt JSON.
- Nonce berbeda untuk dua enkripsi plaintext identik.
- Perubahan ciphertext, tag, nonce, AAD, atau path menyebabkan dekripsi gagal.
- Key hilang, malformed, dan salah ditolak.
- Envelope versi/algoritma/field tidak dikenal ditolak.
- UTF-8/JSON/schema invalid ditolak.
- Batas ukuran plaintext dan envelope diuji.
- Tidak ada plaintext fallback.

### Durable Object
- Admin authorization boundary pada endpoint pemicu dan pembacaan.
- Hanya satu job aktif; concurrent start ditolak.
- State dan progress bertahan melewati lifecycle request.
- Cancellation menghentikan item berikutnya dan tidak menghapus hasil selesai.
- Retry hanya memproses item gagal.
- Job generation mencegah hasil worker lama menimpa job baru.
- Error disanitasi; tidak ada secret/token dalam state atau response.
- Tidak ada refresh otomatis atau histori job.

### Integrasi dan konfigurasi
- GitHub SHA conflict tidak melakukan overwrite.
- Private repository/file yang tidak tersedia tidak dianggap database kosong.
- Binding dan migration dapat dibangun melalui Wrangler dry-run.
- Test regresi yang relevan tetap lulus.

## 7. Kriteria selesai ADM-001

ADM-001 baru dapat dinyatakan selesai jika:

1. Implementasi Durable Object dan crypto utility tersedia pada `dev`.
2. Binding/migration hanya menargetkan Development.
3. Test matrix yang relevan dijalankan dan hasil aktual dicatat.
4. Wrangler dry-run/build berhasil.
5. Tidak ada plaintext fallback atau secret di repository/log.
6. Dokumentasi dan Evidence Index diperbarui dengan hasil yang dapat direproduksi.
7. Tidak ada perubahan atau deployment Production.

## 8. Status saat dokumen dibuat

- Repository source audit: dilakukan secara read-only pada branch `dev`.
- Durable Object implementation: PRESENT in `src/modules/admin/refresh-coordinator.js`; NOT TESTED.
- Encryption utility: PRESENT in `src/utils/dashboard-crypto.js`; NOT TESTED.
- Encrypted metadata adapter: PRESENT in `src/modules/admin/dashboard-storage.js`; NOT TESTED.
- `wrangler.jsonc` Development Durable Object binding/migration: PRESENT on `dev`; Wrangler validation deferred.
- Development secret availability: NOT VERIFIED.
- Automated tests: DEFERRED until all ADM-001 through ADM-007 implementations are complete, per owner instruction.
- Cloudflare Development runtime: NOT VERIFIED.
- Production: NOT TOUCHED.
