# Software Design Document
## PortoTrack — Personal Crypto & Fiat Portfolio Tracker
Versi 1.1 · 8 Juli 2026 · Referensi: `SRS.md`, `schema.sql`, `flowchart-sync.mermaid`, `flowchart-pnl.mermaid`, `flowchart-navigation.mermaid`, `flowchart-ai-import.mermaid`, `erd.mermaid`

> **Changelog v1.1**: tambah desain Smart Import (AI parsing via Gemini API).

---

## 1. Arsitektur Umum

Pola: **offline-first, single source of truth di Supabase, Dexie sebagai cache lokal.**

```
┌─────────────┐   optimistic write   ┌───────────┐
│   Vue UI    │ ────────────────────▶│  Pinia    │
└─────────────┘                      │  Stores   │
      ▲   ▲                          └─────┬─────┘
      │   │ paste teks bebas               │ write-through
      │   │ (Smart Import)                 ▼
      │   │                          ┌───────────┐
      │   │           instant read   │  Dexie    │
      │   └──────────────────────────│ (cache)   │
      │                              └─────┬─────┘
      │ reactive read                      │ background sync queue
      │                                     ▼
      │                              ┌───────────┐
      │                              │ Supabase  │
      │                              │ (source   │
      │                              │  of truth)│
      │                              └─────┬─────┘
      │                                     ▲
      │        review & confirm             │ batch fetch, cached w/ TTL
      │        ("Tambahkan Semua")     ┌───────────┐
      └──────────────────────────────▶│ CoinGecko │
                                       │  (harga)  │
                                       └───────────┘

┌──────────────┐   teks bebas    ┌────────────────────┐   prompt + JSON schema   ┌───────────┐
│   Vue UI     │ ───────────────▶│ Supabase Edge Func  │ ─────────────────────────▶│ Gemini    │
│ Smart Import │◀─────────────── │  (server-side proxy,│◀───────────────────────── │ API       │
└──────────────┘  JSON terstruktur│  nyimpen API key)   │   JSON transaksi         └───────────┘
                                  └────────────────────┘
```

**Prinsip inti:** UI selalu baca dari Pinia/Dexie (instant), tidak pernah nunggu network. Supabase adalah kebenaran akhir, Dexie cuma cermin lokalnya. Semua penghapusan pakai soft delete supaya urutan sync tidak pernah menyebabkan data "hidup lagi". Untuk Smart Import, Gemini API **tidak pernah dipanggil langsung dari browser** — selalu lewat Edge Function supaya API key aman, dan hasil parsing **tidak pernah auto-commit** — selalu lewat tahap review pengguna dulu.

---

## 2. Tech Stack

| Layer | Pilihan | Alasan |
|---|---|---|
| Frontend | Vue 3 + Vite + Pinia | Sudah battle-tested di proyek TASKDOO, reuse pola yang sudah dikuasai |
| Cache lokal | Dexie.js (IndexedDB) | Offline-first, query cepat, sudah familiar |
| Backend/DB | Supabase (Postgres + Auth + RLS) | Realtime, RLS built-in, gratis untuk skala personal |
| Data harga | CoinGecko public API | Gratis, lengkap, punya endpoint batch |
| Hosting | Vercel | Sudah dipakai di proyek lain, deploy simpel |
| PWA | vite-plugin-pwa | Installable, offline shell |
| AI Parsing | Gemini API (Flash/Flash-Lite) via Supabase Edge Function | Free tier (no credit card), cukup buat task extraction ringan; Edge Function biar API key gak kebuka ke client dan tetap satu ekosistem sama DB/Auth |

> Catatan: tech stack sengaja **tidak diganti** dari yang sudah dikuasai — fokus rebuild ada di pola arsitektur/sync, bukan ganti tools.

---

## 3. Modul & Pinia Store Breakdown

| Store | Tanggung Jawab |
|---|---|
| `authStore` | Session Supabase, login/logout |
| `sourcesStore` | CRUD CEX/wallet |
| `assetsStore` | Metadata aset dari CoinGecko (cached lokal, jarang berubah) |
| `transactionsStore` | CRUD transaksi buy/sell — satu-satunya penulis data holding |
| `holdingsStore` | **Derived state** — dihitung dari `transactionsStore`, tidak punya tabel mutable sendiri |
| `watchlistStore` | CRUD watchlist + aksi convert-to-holding |
| `priceStore` | Cache harga CoinGecko + TTL + batch fetch |
| `fiatStore` | Saldo fiat per sumber |
| `syncStore` | Antrian sync, status (`synced` / `pending` / `error`), resolusi konflik |
| `smartImportStore` | State parsing AI: teks input, hasil parsing (draft, belum commit), status per baris (`ok` / `perlu review`) |

**Kenapa `holdingsStore` derived, bukan tabel sendiri:** ini langsung menutup kelas bug yang pernah muncul di proyek lain (saldo piutang salah update karena ada dua tempat nyimpen angka yang sama). Kalau holdings selalu dihitung ulang dari `transactions`, tidak ada dua sumber kebenaran yang bisa saling gak sinkron.

---

## 4. Sync Engine Design

Detail lengkap ada di `flowchart-sync.mermaid`. Ringkasan aturan:

1. **Setiap write lokal** → tulis ke Dexie dulu (optimistic UI), tandai `sync_status: pending`, masuk antrian.
2. **Antrian diproses** background, di-debounce (~2 detik) supaya tidak spam request per keystroke.
3. **Push ke Supabase** → sukses: `sync_status: synced` + `updated_at` diperbarui. Gagal: retry dengan exponential backoff, status tetap `pending` (dan terlihat di UI, tidak silent fail).
4. **Pull** dilakukan saat app dibuka / interval berkala: ambil baris dengan `updated_at > last_synced_at`, termasuk yang `deleted_at IS NOT NULL`, lalu propagate ke Dexie (hapus/soft-delete lokal juga).
5. **Resolusi konflik**: last-write-wins berdasarkan `updated_at`. Cukup untuk skala single-user beberapa device — tidak perlu CRDT.

---

## 5. Price Data Flow

Detail lengkap ada di `flowchart-pnl.mermaid`. Ringkasan:

- Batch fetch `/coins/markets?ids=...&vs_currencies=usd,idr` sekali per siklus refresh (default 5 menit, atau tombol refresh manual).
- Simpan ke Dexie `price_cache` dengan `fetched_at`.
- UI selalu baca dari cache + tampilkan badge umur data.
- Rate limit (429) → fallback ke cache terakhir + notice di UI, tidak crash.

---

## 6. Data Model

Skema lengkap ada di `schema.sql`, relasi antar tabel ada di `erd.mermaid`. Ringkasan tabel:

| Tabel | Isi |
|---|---|
| `sources` | Daftar CEX/wallet |
| `assets` | Metadata koin (dari CoinGecko) |
| `transactions` | Log buy/sell — satu-satunya sumber kebenaran untuk holdings |
| `watchlist` | Aset yang dipantau, belum dibeli |
| `fiat_holdings` | Saldo fiat per sumber |
| `price_cache` | Cache harga terakhir per aset |
| `v_holdings` (view) | Qty net & average cost, dihitung on-the-fly dari `transactions` |

---

## 7. Error Handling

| Skenario | Penanganan |
|---|---|
| Sync gagal (network/server) | Retry exponential backoff, status `pending` tetap terlihat di UI |
| CoinGecko rate limit (429) | Fallback ke cache terakhir + notice, tidak crash |
| Transaksi tidak valid (qty ≤ 0) | Validasi di form sebelum submit, tidak sampai ke Dexie/Supabase |
| Konflik update (2 device edit bersamaan) | Last-write-wins by `updated_at`, tidak ada silent overwrite tanpa jejak |

---

## 8. Keamanan

- Row Level Security aktif di semua tabel: `WHERE user_id = auth.uid()`.
- Tidak ada API key exchange yang disimpan di v1 — semua input transaksi manual.
- Supabase Auth untuk session management lintas device.

---

## 9. Smart Import / AI Parsing Design

Detail alur lengkap ada di `flowchart-ai-import.mermaid`. Ringkasan:

1. **Input**: pengguna paste teks bebas (rekap transaksi, catatan, apapun) ke form Smart Import.
2. **Client → Edge Function**: teks dikirim ke Supabase Edge Function (Deno), bukan langsung ke Gemini — API key Gemini cuma hidup di server, gak pernah ikut ke bundle frontend.
3. **Edge Function → Gemini**: Edge Function kirim prompt + teks ke Gemini API pakai **structured output (`responseSchema`)**, minta balikan JSON array transaksi sesuai skema: `{ asset_symbol, type, quantity, price, source_name, txn_date, confidence }`.
4. **Matching**: setiap `asset_symbol` & `source_name` hasil parsing dicocokkan ke tabel `assets`/`sources` yang sudah ada (fuzzy match nama). Kalau gak ketemu match yang cukup yakin → status baris jadi `perlu review`, bukan otomatis dibikinkan aset/sumber baru.
5. **Review UI**: hasil parsing ditampilkan sebagai list preview (editable), baris `perlu review` di-highlight beda warna.
6. **Commit**: tombol **"Tambahkan Semua"** → batch insert ke `transactions` (hanya baris yang statusnya `ok` atau sudah dikonfirmasi manual). Baris `perlu review` tidak ikut ter-commit sampai pengguna edit & konfirmasi.

**Model yang dipakai:** Gemini 2.5/3.1 Flash atau Flash-Lite (bukan Pro) — task-nya cuma ekstraksi teks-ke-JSON, gak butuh reasoning berat, dan Flash/Flash-Lite yang masuk free tier.

**Privasi:** karena teks yang di-paste berisi data portofolio pribadi, dan default free tier Google boleh pakai prompt buat training, tampilkan disclaimer singkat di form Smart Import (NFR-09). Kalau risih, tinggal pindah ke paid tier Gemini — biayanya kecil banget untuk volume pemakaian personal.

---

## 10. Urutan Eksekusi Rebuild (Disarankan)

Bukan big-bang rewrite. Urutan supaya tidak rombak UI dua kali:

1. **Migrasi schema** (`schema.sql`) + migration script data lama ke struktur baru.
2. **Bangun sync engine** baru, uji sampai tidak ada kasus reappear/race condition.
3. **Rombak UI** di atas data layer yang sudah solid.
