# Integrasi Guestbook Website dengan DEKEKU API

Panduan ini menjelaskan integrasi Guestbook berdasarkan implementasi pada branch `dev`. Endpoint Guestbook saat ini menggunakan registrasi Origin dan repository mapping privat.

## 1. Alur kerja

1. Pengunjung mengisi formulir Guestbook di website.
2. Browser mengirim JSON ke `POST /api/v1/public/submit`.
3. Worker memvalidasi Origin HTTPS terhadap `ALLOWED_ORIGINS`.
4. Worker mencari mapping repository berstatus `active` yang Origin-nya cocok persis di database privat pusat.
5. Worker memastikan repository tujuan bersifat public.
6. Worker menambahkan entri ke `assets/data/bukutamu.json` melalui GitHub Contents API.
7. Website membaca file JSON dari GitHub Raw/CDN.

Browser tidak boleh menentukan owner, repository, branch, token, atau path penyimpanan. Koordinat repository ditentukan oleh mapping privat di sisi Worker.

> **Pemisahan konfigurasi:** Guestbook menggunakan `private/auth/users.json` dan `private/repositories/mappings.json`. File Manager menggunakan Project Origin dan resolver `config.json`. Keduanya merupakan alur berbeda pada implementasi saat ini.

## 2. Persiapan administrator

Pastikan Worker memiliki konfigurasi berikut:

- `ALLOWED_ORIGINS`: daftar Origin HTTPS, dipisahkan koma.
- `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`, `GITHUB_TOKEN`: akses ke repository privat pusat yang menyimpan database akun dan mapping.
- Dokumen `private/auth/users.json`.
- Dokumen `private/repositories/mappings.json`.

Contoh struktur mapping (ilustrasi):

```json
{
  "version": 1,
  "repositories": [
    {
      "id": "mapping_12345678",
      "userId": "user_12345678",
      "owner": "pemilik-github",
      "repo": "repository-website",
      "branch": "main",
      "origin": "https://www.contoh.com",
      "status": "active",
      "createdAt": "2026-11-23T00:00:00.000Z",
      "updatedAt": "2026-11-23T00:00:00.000Z"
    }
  ]
}
```

Mapping harus lolos validasi Worker. `userId` harus merujuk user yang valid. Origin harus berupa origin HTTPS kanonis tanpa path, query, fragment, kredensial, atau port. Contoh: `https://www.contoh.com`.

Repository website tujuan wajib public. Token GitHub hanya disimpan sebagai secret di Worker, tidak pernah di HTML atau JavaScript frontend.

## 3. Endpoint pengiriman

- Method: `POST`
- URL: `https://<alamat-worker>/api/v1/public/submit`
- Authentication: tidak menggunakan Admin JWT.
- Header: `Content-Type: application/json`.
- Browser mengirim header `Origin` secara otomatis untuk request lintas-origin.

Body:

```json
{
  "name": "Nama Pengunjung",
  "message": "Isi pesan",
  "email": "pengunjung@example.com"
}
```

| Field | Wajib | Batas |
|---|---:|---:|
| `name` | Ya | 1–100 karakter |
| `message` | Ya | 1–1000 karakter |
| `email` | Tidak | Maksimal 254 karakter |

Nama dan pesan dipangkas spasi di awal/akhir. Email disimpan jika diberikan dan tidak kosong. Field lain akan ditolak. Body harus berupa objek JSON UTF-8 dengan ukuran maksimal 15.360 byte.

## 4. Contoh formulir website

Ganti `WORKER_BASE_URL` dengan alamat Worker yang digunakan. Tidak diperlukan token GitHub atau Admin JWT pada formulir publik.

```html
<form id="guestbook-form">
  <label>Nama <input name="name" maxlength="100" required></label>
  <label>Email (opsional) <input name="email" type="email" maxlength="254"></label>
  <label>Pesan <textarea name="message" maxlength="1000" required></textarea></label>
  <button type="submit">Kirim</button>
  <p id="guestbook-status" role="status" aria-live="polite"></p>
</form>

<script>
const WORKER_BASE_URL = "https://WORKER_BASE_URL";

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
    const response = await fetch(WORKER_BASE_URL + "/api/v1/public/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok || result.success !== true) {
      throw new Error(result.error?.message || result.message || "Pengiriman gagal");
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

Request akan ditolak jika Origin website belum diizinkan atau belum memiliki mapping aktif. Jangan mencoba mengatur header `Origin` secara manual dari browser.

## 5. Membaca data

Lokasi file pada repository website:

`assets/data/bukutamu.json`

URL Raw:

`https://raw.githubusercontent.com/OWNER/REPOSITORY/BRANCH/assets/data/bukutamu.json`

Contoh:

```js
async function loadGuestbook() {
  const url = "https://raw.githubusercontent.com/OWNER/REPOSITORY/BRANCH/assets/data/bukutamu.json";
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error("Data Guestbook tidak dapat dimuat");

  const entries = await response.json();
  if (!Array.isArray(entries)) throw new Error("Format Guestbook tidak valid");
  return entries;
}
```

Setiap item berisi `name`, `message`, `createdAt`, dan `email` jika email diberikan. `createdAt` dibuat oleh Worker dalam format ISO 8601.

Saat menampilkan data pengunjung, gunakan `textContent`, bukan `innerHTML`. Pesan publik tetap perlu moderasi. GitHub Raw/CDN mungkin menyajikan cache yang belum langsung diperbarui.

## 6. Respons sukses

HTTP `201 Created`:

```json
{
  "success": true,
  "data": {
    "message": "Submission successful",
    "file": "bukutamu.json",
    "path": "assets/data/bukutamu.json",
    "count": 1,
    "sha": "<github-blob-sha>"
  }
}
```

`count` adalah jumlah item setelah penambahan. SHA merupakan metadata GitHub dan umumnya tidak perlu dipakai frontend.

## 7. Batasan dan error

| HTTP | Penyebab umum | Tindakan |
|---:|---|---|
| 400 | Body kosong atau JSON tidak valid | Periksa payload |
| 403 | Origin tidak diizinkan/tidak terdaftar atau repository bukan public | Periksa allowlist dan mapping |
| 405 | Method bukan POST | Gunakan POST |
| 413 | Payload atau file melewati batas | Kurangi ukuran data |
| 415 | Content-Type salah | Gunakan application/json |
| 422 | Field tidak valid atau field tambahan | Periksa nama dan panjang field |
| 409 | Konflik penulisan berulang | Coba lagi setelah jeda singkat |
| 502 | File penyimpanan rusak atau metadata tidak valid | Periksa file repository |

Worker menerima file Guestbook berupa JSON array dengan batas ukuran 1 MiB. Jika file belum ada, Worker membuat file baru. Saat konflik SHA, Worker mencoba ulang hingga tiga kali.

## 8. Keamanan dan operasional

- CORS bukan autentikasi. Endpoint ini memang publik; Origin allowlist bukan perlindungan anti-spam yang kuat.
- Implementasi handler Guestbook saat ini belum memiliki rate limiting atau CAPTCHA. Pertimbangkan Cloudflare WAF/rate limiting.
- Jangan pernah mengekspos `GITHUB_TOKEN`, `JWT_SECRET`, atau kredensial lain ke frontend.
- Jangan menerima koordinat repository dari form atau query string pengunjung.
- Jangan menampilkan isi pesan sebagai HTML mentah.
- Tes remote Development dapat menulis ke repository GitHub. Jangan jalankan tanpa persetujuan dan verifikasi target data terlebih dahulu.

## 9. Catatan implementasi

Panduan ini mengikuti source `src/modules/public/submit.js`, routing `src/core/router.js`, validasi mapping `src/modules/rbac/storage.js`, dan CORS middleware. Saat ini Guestbook menyimpan data ke `assets/data/bukutamu.json`; bukan `public/data/guestbook/`.

Jika arsitektur mapping Guestbook kelak disatukan dengan resolver Project Origin berbasis `config.json`, panduan dan integration tests harus diperbarui bersama perubahan kode.
