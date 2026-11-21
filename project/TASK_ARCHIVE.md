# Arsip Tugas DEKEKU API

> Arsip internal proyek. Jangan tampilkan isi arsip dalam laporan progress, audit ringkas, atau jawaban biasa. Buka dan tampilkan hanya jika pemilik secara eksplisit meminta "arsip tugas" atau meminta isi arsip.

## Arsip — 2026-11-21

### A-001 — Verifikasi CDN Guestbook
- **Pekerjaan**: Verifikasi URL CDN Guestbook, respons JSON, cache headers, dan perilaku setelah penulisan.
- **Status**: DIARSIPKAN / TIDAK AKTIF.
- **Catatan**: Belum diverifikasi. Jangan menjalankan operasi tulis pada data nyata; jika suatu saat diaktifkan kembali, gunakan target Development yang terisolasi dan fixture aman. Periksa apakah query string ikut menjadi bagian cache key sebelum menyimpulkan cache-busting timestamp efektif.

### A-002 — WAF Development
- **Pekerjaan**: Konfigurasi dan verifikasi WAF/rate limiting untuk User Login dan Guestbook pada Development.
- **Status**: DITUNDA PEMILIK / DIARSIPKAN.
- **Catatan**: Jangan mulai konfigurasi atau verifikasi sampai pemilik secara eksplisit meminta untuk melanjutkannya.

## Aturan Arsip
- Item di arsip bukan bagian dari antrean kerja aktif.
- Jangan mengerjakan item arsip secara otomatis.
- Jangan menampilkan daftar atau rincian arsip kecuali pemilik meminta arsip tugas.
- Jika pemilik mengaktifkan kembali item, pindahkan kembali ke antrean aktif dan catat tanggal/keputusan aktivasi.
