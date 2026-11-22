# Integrasi Guestbook Website dengan DEKEKU Public Data API

Panduan ini mengikuti arsitektur Public Data API pada branch `dev`.

## 1. Endpoint

Endpoint standar:

- Method: `POST`
- Path: `/api/v1/public/data/guestbook`
- Authentication: tidak memerlukan Admin JWT.
- Content-Type: `application/json`
- Origin: harus merupakan HTTPS Origin kanonis yang diizinkan oleh `ALLOWED_ORIGINS`.

Endpoint kompatibilitas sementara:

- `POST /api/v1/public/submit`
- Route lama meneruskan ke resource `guestbook` yang sama; tidak ada validator atau storage engine duplikat.

## 2. Payload

```json
{
  "name": "Nama Pengunjung",
  "message": "Isi pesan",
  "email": "pengunjung@example.com"
}
```

| Field | Wajib | Batas |
|---|---:|---:|
| `name` | Ya | 1–100 karakter setelah trim |
| `message` | Ya | 1–1000 karakter setelah trim |
| `email` | Tidak | Maksimal 254 karakter |

Field tambahan ditolak. Email kosong setelah trim tidak disimpan. Worker menambahkan `createdAt` dalam format ISO 8601. Body maksimum 15.360 byte dan file penyimpanan maksimum 1 MiB.

## 3. Contoh integrasi website

Ganti `API_BASE_URL` dengan alamat Worker yang memang digunakan website.

```html
<form id="guestbook-form">
  <label>Nama <input name="name" maxlength="100" required></label>
  <label>Email (opsional) <input name="email" type="email" maxlength="254"></label>
  <label>Pesan <textarea name="message" maxlength="1000" required></textarea></label>
  <button type="submit">Kirim</button>
  <p id="guestbook-status" role="status" aria-live="polite"></p>
</form>

<script>
const API_BASE_URL = "https://YOUR_WORKER_HOST";

document.getElementById("guestbook-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = document.getElementById("guestbook-status");
  const button = form.querySelector('button[type="submit"]');
  const data = new FormData(form);
  const payload = {
    name: String(data.get("name") || "").trim(),
    message: String(data.get("message") || "").trim()
  };
  const email = String(data.get("email") || "").trim();
  if (email) payload.email = email;

  button.disabled = true;
  status.textContent = "Mengirim...";
  try {
    const response = await fetch(API_BASE_URL + "/api/v1/public/data/guestbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok || result.success !== true) {
      throw new Error(result.error || result.message || "Pengiriman gagal");
    }
    status.textContent = "Terima kasih, pesan berhasil dikirim.";
    form.reset();
  } catch (error) {
    status.textContent = error.message || "Terjadi kesalahan.";
  } finally {
    button.disabled = false;
  }
});
</script>
```

Browser mengirim header `Origin` secara otomatis. Public Data API mengabaikan `X-DEKEKU-Project-Origin` (header selector khusus File Manager). Jangan mencoba mengatur `Origin` secara manual dan jangan mengirim owner, repository, branch, atau storage path dari frontend.

## 4. Cara Worker menentukan repository

1. Worker memvalidasi HTTPS Origin terhadap `ALLOWED_ORIGINS`.
2. Worker mengambil `/config.json` dari Origin tersebut dengan redirect dinonaktifkan dan batas ukuran 32 KiB.
3. Konfigurasi harus sesuai schema v1: `schema_version`, `project.id`, dan `repository.username/repo`.
4. `repository.username` harus sama dengan trusted `GITHUB_OWNER`.
5. Worker memeriksa metadata GitHub; repository harus public dan branch berasal dari metadata `default_branch`.
6. Resource Registry menetapkan path penyimpanan server-side: `assets/data/bukutamu.json`.

Resolver ini adalah `resolveProjectRepository()` yang juga digunakan File Manager. Guestbook tidak lagi membaca private `users.json` atau `repositories/mappings.json` untuk memilih repository.

Contoh `config.json`:

```json
{
  "schema_version": 1,
  "project": { "id": "example-project" },
  "repository": {
    "username": "YOUR_GITHUB_OWNER",
    "repo": "YOUR_PROJECT_REPOSITORY"
  }
}
```

## 5. Membaca data

Data disimpan sebagai JSON array pada repository proyek:

`assets/data/bukutamu.json`

Website membaca file langsung dari GitHub Raw/CDN, bukan melalui GET Public Data API:

`https://raw.githubusercontent.com/OWNER/REPOSITORY/BRANCH/assets/data/bukutamu.json`

Pastikan response berbentuk array. Saat menampilkan isi pesan, gunakan `textContent`, bukan `innerHTML`. Data kiriman publik tetap memerlukan moderasi. CDN dapat menyajikan cache yang belum langsung diperbarui.

## 6. Respons

HTTP `201 Created`:

```json
{
  "success": true,
  "resource": "guestbook",
  "message": "Submission successful",
  "file": "bukutamu.json",
  "path": "assets/data/bukutamu.json",
  "count": 1,
  "sha": "GITHUB_BLOB_SHA"
}
```

## 7. Error umum

| HTTP | Arti |
|---:|---|
| 400 | Body kosong, JSON tidak valid, atau UTF-8 tidak valid |
| 403 | Origin tidak dipercaya atau repository bukan public |
| 404 | Resource tidak dikenal atau config.json tidak ditemukan |
| 405 | Method bukan POST |
| 413 | Body, config, atau file melewati batas |
| 415 | Content-Type bukan application/json |
| 422 | Schema config atau field Guestbook tidak valid |
| 409 | Konflik penulisan berulang |
| 502/504 | Metadata, GitHub, atau pengambilan config gagal |

## 8. Batas keamanan

- Origin allowlist adalah kontrol trust/CORS, bukan autentikasi atau anti-spam.
- Tidak ada rate limiting atau CAPTCHA di handler ini; pertimbangkan proteksi Cloudflare terpisah.
- Jangan pernah mengekspos `GITHUB_TOKEN`, JWT secret, atau kredensial ke frontend.
- Jangan menerima koordinat repository atau path dari klien.
- Jangan menampilkan input pengguna sebagai HTML mentah.
- Pengujian remote terhadap Worker aktif dapat menulis ke repository proyek; jangan jalankan tanpa izin dan target data yang terverifikasi.
- Data Guestbook lama tidak dipindah atau dihapus otomatis oleh perubahan ini.


## Verification status — 2026-11-23

Owner-reported local Termux validation: `node --test test/public-submission.test.js` passed 14/14 focused tests; `node --check` passed for all 7 changed source files. The exact tested local HEAD SHA was not supplied, so this evidence is not conclusively tied to the current GitHub `dev` / PR #29 head. No remote integration test, live project repository write, Worker runtime smoke test, full-suite rerun, or deployment is claimed. PR #29 remains unmerged; production resources remain untouched.
