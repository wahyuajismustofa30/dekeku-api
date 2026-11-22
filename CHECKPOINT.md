# Historical Project Checkpoint — DEKEKU API Gateway

> **HISTORICAL SNAPSHOT — 2026-11-20.** This root-level file is retained for historical context only. It is not the active project checkpoint and must not be used to infer current implementation status.
>
> The canonical current checkpoint is [`project/CHECKPOINT.md`](project/CHECKPOINT.md). Current workstream status is in [`project/PROGRESS.md`](project/PROGRESS.md); evidence is indexed in [`project/EVIDENCE.md`](project/EVIDENCE.md).

The original Phase 2.2 audit below is retained as historical context. F-01 through F-04 were subsequently fixed; see the root `CHANGELOG.md` and `docs/architecture.md`. The old statements that Phase 2.2 was in progress and that F-01..F-04 were open are superseded.

---

DEKEKU GATEWAY — PROJECT CHECKPOINT

Tanggal checkpoint: 2026-11-20
Status: PHASE 2.2 IN PROGRESS - Menunggu perbaikan F-01 s.d F-04 dan resolver legacy yg mismatch. (DEV BRANCH ACTIVE)

*Acuan Utama*: Sumber status fitur adalah [PROGRESS.md](PROGRESS.md).

## 1. Identitas Proyek & Status Branch
- Project: DEKEKU API Gateway
- Branch Aktif: dev
- Development Worker: dekeku-api-dev (development)
- Production Worker: github (not modified)

## 2. Status Pengembangan
- Phase 1 Foundation & Read: COMPLETED.
- Phase 2.1 Admin Login & JWT: COMPLETED & VERIFIED.
- Phase 2.2 Write Engine (CREATE/UPDATE/DELETE): IN PROGRESS (implementasi dasar ada, menunggu fix F-01 s.d F-04).

## 3. Temuan Keamanan & Kondisi Kode (Audit 2026-11-20)
- F-01: Regex karakter kontrol double-escape di write.js (status: OPEN).
- F-02: Base64 large file chunking belum ada (status: OPEN, gagal >100KB).
- F-03: parseAndValidateBody belum menolak content undefined (status: OPEN).
- F-04: CORS middleware belum memiliki allowlist origin dan error header CORS (status: OPEN).
- 9 legacy tes github-core.test.js: gagal karena ekspektasi error mapping yang bebeda dari gateway desain (status: PENDING REVIEW).

## 4. Pengetahuan Conditional (Operational Metadata)
- Hasil test aktual (2026-11-20): 103 PASS dari 112 tes.
- ARSB (endpoint"): Sekarang /admin/write/*
- Repository status saat ini: DIRSAKSI? CHECKPOINT SAY "PUBLIC" - PERLU CONFIRM.
- Version secret dev: Beri iid temp el. Dihalankan.
- Secret rotations: Diremberken.

## 5. Risiko & Backlog
- Rate limiting (Cloudflare WAF).
- JWT revocation.
- Audit logging failed-login.

## 6. Langkah Berikutnya
1. Perbaiki F-01 s.d F-04 di backend (tidak merge product).
2. Sinkronisasikan kembali legacy tes dengan error gateway mapping.
3. Mempersiapkan denom Phase 2.3 (Public Submission).

