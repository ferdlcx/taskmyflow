# Software Requirements Specification
## PortoTrack — Personal Crypto & Fiat Portfolio Tracker
Versi 1.1 · 8 Juli 2026
*(Working title — ganti nama sesuka hati, ini cuma placeholder biar gampang direferensi di dokumen.)*

> **Changelog v1.1**: tambah section 3.9 Smart Import (AI Parsing via Gemini API), NFR-08, NFR-09, BR-07.

---

## 1. Pendahuluan

### 1.1 Tujuan
Dokumen ini mendefinisikan kebutuhan fungsional dan non-fungsional untuk rebuild total aplikasi pelacak portofolio crypto & fiat milik pribadi, menggantikan versi lama yang bermasalah di sisi UI/UX dan sinkronisasi data.

### 1.2 Ruang Lingkup
Aplikasi web (PWA) single-user yang:
- Melacak aset crypto (multi-CEX/wallet) dan saldo fiat dalam satu dashboard net worth.
- Menghitung PnL otomatis dari riwayat transaksi (bukan input manual PnL).
- Mengambil data harga & metadata koin dari CoinGecko API.
- Mendukung watchlist ("cumsun"/akan datang) terpisah dari holding aktif.
- Bekerja offline-first dengan sinkronisasi otomatis ke backend saat online.

### 1.3 Definisi & Istilah
| Istilah | Arti |
|---|---|
| CEX | Centralized Exchange (Binance, Bybit, OKX, dll) |
| PnL | Profit and Loss — selisih nilai sekarang vs modal |
| Avg Cost | Harga rata-rata beli, dihitung dari akumulasi transaksi buy |
| Unrealized PnL | PnL dari holding yang masih dipegang |
| Realized PnL | PnL dari holding yang sudah dijual |
| Watchlist / Cumsun | Aset yang dipantau tapi belum dibeli |
| Soft delete | Data ditandai terhapus (`deleted_at`), bukan dihapus permanen dari DB |
| Source of truth | Data master yang jadi acuan utama saat sinkronisasi |

---

## 2. Deskripsi Umum

### 2.1 Perspektif Produk
Rebuild total dari versi lama. Versi lama sudah punya: integrasi CoinGecko, input harga beli manual, kalkulasi PnL otomatis, ikon crypto, penandaan CEX/wallet, dan watchlist ("cumsun"). Masalah utama versi lama: UI/UX kurang jelas, dan sinkronisasi data tidak reliable. Versi baru mempertahankan seluruh fitur di atas, dengan fondasi data & sync yang dirombak total.

### 2.2 Karakteristik Pengguna
Single user (pemilik aplikasi), mengakses dari beberapa device (desktop & mobile), butuh data selalu konsisten di semua device.

### 2.3 Batasan
- CoinGecko free tier API punya rate limit → wajib batch request & caching.
- Tidak ada integrasi API key exchange langsung di v1 (murni input manual transaksi).
- Kurs USD↔IDR bisa manual atau dari API pihak ketiga (lihat FR-23).

---

## 3. Functional Requirements

### 3.1 Dashboard
- **FR-01** Sistem menampilkan net worth total (crypto + fiat, gabungan semua sumber) sebagai angka utama.
- **FR-02** Sistem menampilkan breakdown alokasi per sumber (CEX/wallet).
- **FR-03** Sistem menampilkan breakdown alokasi per aset, diurutkan berdasarkan nilai terbesar.
- **FR-04** Sistem menampilkan total PnL gabungan (unrealized + realized) di dashboard.

### 3.2 Sumber Dana (CEX/Wallet)
- **FR-05** Pengguna dapat menambah sumber baru (nama, tipe CEX/wallet, ikon opsional).
- **FR-06** Pengguna dapat mengedit dan menghapus (soft delete) sumber.
- **FR-07** Sistem menampilkan peringatan (bukan blokir) saat pengguna menghapus sumber yang masih punya transaksi aktif.

### 3.3 Aset
- **FR-08** Pengguna dapat mencari & menambah aset lewat autocomplete CoinGecko (by nama/simbol).
- **FR-09** Sistem otomatis mengambil ikon, simbol, dan nama resmi dari CoinGecko saat aset ditambahkan.
- **FR-10** Sistem melakukan fetch harga secara batch (satu request untuk semua aset), bukan satu request per koin.
- **FR-11** Sistem menyimpan cache harga lokal dengan TTL default 5 menit, dan menampilkan indikator umur data ("update X menit lalu").

### 3.4 Transaksi & Holdings
- **FR-12** Pengguna dapat mencatat transaksi buy/sell: aset, sumber, quantity, harga, tanggal, fee (opsional), catatan (opsional).
- **FR-13** Sistem menghitung quantity net dan average cost secara otomatis dari akumulasi seluruh transaksi per aset per sumber — bukan angka manual yang tersimpan terpisah.
- **FR-14** Sistem menghitung unrealized PnL untuk holding yang masih dipegang, dan realized PnL untuk yang sudah terjual.
- **FR-15** Pengguna dapat mengedit/menghapus (soft delete) transaksi, dan holdings/PnL otomatis recalculate.
- **FR-16** Sistem menampilkan riwayat transaksi lengkap per aset.

### 3.5 Watchlist (Cumsun / Akan Datang)
- **FR-17** Pengguna dapat menambah aset ke watchlist tanpa membuat transaksi.
- **FR-18** Pengguna dapat mengisi target harga dan catatan per item watchlist.
- **FR-19** Watchlist ditampilkan di tab/section terpisah dari holdings aktif, dan tidak masuk hitungan net worth.
- **FR-20** Pengguna dapat "convert" item watchlist menjadi holding pertama lewat satu form transaksi, tanpa perlu input ulang data aset.

### 3.6 Sinkronisasi & Offline
- **FR-21** Aplikasi dapat dibuka dan menampilkan data terakhir tanpa koneksi internet.
- **FR-22** Perubahan data yang dilakukan saat offline otomatis tersinkron ke backend begitu online kembali.
- **FR-23** Data yang sudah dihapus di satu device tidak boleh muncul kembali setelah sinkronisasi di device lain (soft-delete-aware sync).

### 3.7 Fiat
- **FR-24** Pengguna dapat mencatat saldo fiat (IDR, USD, dll) per sumber, dan nilainya masuk ke perhitungan net worth total.

### 3.8 Pengaturan
- **FR-25** Pengguna dapat memilih mata uang tampilan utama (IDR/USD) dan kurs konversi (manual atau otomatis).

### 3.9 Smart Import (AI Parsing)
- **FR-26** Pengguna dapat menempelkan teks bebas (rekap transaksi, catatan, hasil copy-paste dari mana saja) ke form "Smart Import".
- **FR-27** Sistem mengirim teks ke Gemini API lewat server-side proxy, dan menerima hasil parsing berupa daftar transaksi terstruktur (aset, tipe buy/sell, quantity, harga, sumber, tanggal).
- **FR-28** Sistem menampilkan hasil parsing sebagai preview list yang bisa diedit per baris sebelum disimpan — bukan langsung masuk database.
- **FR-29** Pengguna dapat menekan **"Tambahkan Semua"** untuk commit seluruh hasil parsing sekaligus (batch insert), atau edit/hapus baris tertentu dulu sebelum commit.
- **FR-30** Sistem menandai baris hasil parsing yang tidak dikenali (misal: nama aset tidak match ke CoinGecko, sumber/CEX belum ada) dengan status **"perlu review"**, tidak dipaksa masuk otomatis.

---

## 4. Non-Functional Requirements

| ID | Kebutuhan |
|---|---|
| **NFR-01** | Dashboard harus render < 1 detik dari cache lokal (Dexie), tidak menunggu network. |
| **NFR-02** | Reliabilitas: 0% kasus data reappear/hilang tak sengaja — soft delete wajib di semua tabel yang bisa dihapus. |
| **NFR-03** | Efisiensi API: maksimal 1 batch call CoinGecko per siklus refresh, tidak per-item. |
| **NFR-04** | Keamanan: Row Level Security aktif di Supabase, data tidak bisa diakses lintas user. |
| **NFR-05** | Ketersediaan offline: seluruh fitur baca (dashboard, holdings, watchlist) tetap jalan tanpa internet. |
| **NFR-06** | Portabilitas: dapat diinstall sebagai PWA di desktop & mobile. |
| **NFR-07** | Auditability: setiap baris data historis punya `created_at`/`updated_at`, tidak ada hard delete pada data transaksi. |
| **NFR-08** | Kredensial Gemini API key tidak pernah terekspos ke client — semua pemanggilan lewat server-side proxy (Edge Function). |
| **NFR-09** | Sistem menampilkan disclaimer bahwa teks yang di-paste ke Smart Import (kalau pakai free tier) bisa dipakai Google untuk training, supaya pengguna sadar sebelum tempel data sensitif. |

---

## 5. Business Rules

- **BR-01** PnL dihitung dengan metode **average cost**, bukan FIFO/LIFO — demi kesederhanaan implementasi & pemahaman.
- **BR-02** Realized PnL dan unrealized PnL dicatat dan ditampilkan terpisah, tidak digabung jadi satu angka yang membingungkan.
- **BR-03** Item watchlist tidak pernah masuk hitungan net worth sampai dikonversi menjadi holding via transaksi.
- **BR-04** Data yang di-soft-delete tetap disimpan minimal 30 hari sebelum boleh dibersihkan permanen (jaga-jaga salah hapus).
- **BR-05** Harga yang dipakai untuk kalkulasi PnL selalu berasal dari cache terakhir, dengan disclaimer umur data di UI — bukan real-time per detik.
- **BR-06** Holdings **tidak pernah disimpan sebagai angka mutable terpisah** — selalu dihitung ulang (derived) dari transaksi, untuk menghindari kelas bug "saldo salah update" seperti yang pernah terjadi di proyek sebelumnya.
- **BR-07** Hasil parsing AI (Smart Import) **tidak pernah langsung ditulis ke database** tanpa tahap konfirmasi/review pengguna — mencegah salah tafsir AI merusak data transaksi.

---

## 6. Di Luar Ruang Lingkup (v1)

- Auto-sync langsung via API key exchange (Binance/Bybit/OKX) — kandidat fase 2.
- Price alert / notifikasi push.
- Multi-user / portfolio sharing.
- Perhitungan pajak otomatis.
