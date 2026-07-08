/**
 * PortoTrack — Definisi tipe data utama
 *
 * Semua interface di sini mencerminkan skema database Supabase
 * sekaligus dipakai di Dexie (IndexedDB) untuk offline-first.
 */

// ---------------------------------------------------------------------------
// Status Sinkronisasi
// ---------------------------------------------------------------------------

/** Status sinkronisasi antara Dexie (lokal) dan Supabase (remote) */
export type SyncStatus = 'synced' | 'pending' | 'error';

/** Tipe sumber aset: exchange terpusat atau wallet */
export type SourceType = 'cex' | 'wallet';

/** Tipe transaksi: beli atau jual */
export type TransactionType = 'buy' | 'sell';

// ---------------------------------------------------------------------------
// Entitas Utama
// ---------------------------------------------------------------------------

/**
 * Sumber aset (exchange / wallet).
 * Contoh: Binance, Tokocrypto, MetaMask, Ledger.
 */
export interface Source {
  id: string;
  user_id: string;
  name: string;
  type: SourceType;
  /** URL ikon sumber (opsional) */
  icon_url: string | null;
  created_at: string;
  updated_at: string;
  /** Soft delete — null berarti aktif */
  deleted_at: string | null;
  /** Status sinkronisasi lokal ↔ remote */
  sync_status: SyncStatus;
}

/**
 * Aset kripto.
 * Data referensi dari CoinGecko, tidak di-soft-delete.
 */
export interface Asset {
  id: string;
  /** ID unik CoinGecko (contoh: "bitcoin", "ethereum") */
  coingecko_id: string;
  /** Simbol ticker (contoh: "BTC", "ETH") */
  symbol: string;
  /** Nama lengkap aset */
  name: string;
  /** URL ikon aset */
  icon_url: string | null;
  created_at: string;
}

/**
 * Transaksi beli/jual aset kripto.
 * Dicatat per-sumber dan per-aset.
 */
export interface Transaction {
  id: string;
  user_id: string;
  /** FK ke tabel assets */
  asset_id: string;
  /** FK ke tabel sources */
  source_id: string;
  type: TransactionType;
  /** Jumlah koin/token */
  quantity: number;
  /** Harga per-unit dalam USD */
  price_usd: number;
  /** Harga per-unit dalam IDR */
  price_idr: number;
  /** Biaya transaksi dalam USD (opsional) */
  fee_usd: number;
  /** Tanggal transaksi (ISO string) */
  txn_date: string;
  /** Catatan opsional */
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sync_status: SyncStatus;
}

/**
 * Item watchlist — aset yang dipantau harganya.
 */
export interface WatchlistItem {
  id: string;
  user_id: string;
  /** FK ke tabel assets */
  asset_id: string;
  /** Target harga dalam IDR untuk notifikasi/limit sell (opsional) */
  target_price_idr?: number | null;
  /** Target harga dalam USD untuk notifikasi/limit sell (opsional) */
  target_price_usd?: number | null;
  /** Catatan pengguna */
  note: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sync_status: SyncStatus;
}

/**
 * Simpanan fiat (non-kripto) di exchange atau bank.
 * Contoh: IDR di Tokocrypto, USD di Binance.
 */
export interface FiatHolding {
  id: string;
  user_id: string;
  /** FK ke tabel sources */
  source_id: string;
  /** Nama bank atau entitas */
  name: string;
  /** Jenis fiat: bank (simpanan biasa) atau debt (utang/piutang) */
  type: 'bank' | 'debt';
  /** Kode mata uang (contoh: "IDR", "USD") */
  currency: string;
  /** Jumlah nominal */
  amount: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sync_status: SyncStatus;
}

/**
 * Cache harga aset dari CoinGecko.
 * Primary key: coingecko_id (bukan uuid).
 */
export interface PriceCache {
  /** ID CoinGecko sebagai primary key */
  coingecko_id: string;
  /** Harga terakhir dalam USD */
  price_usd: number;
  /** Harga terakhir dalam IDR */
  price_idr: number;
  /** Kapan harga terakhir di-fetch (ISO string) */
  fetched_at: string;
}

// ---------------------------------------------------------------------------
// View / Derived Data
// ---------------------------------------------------------------------------

/**
 * Kepemilikan aset bersih (derived dari v_holdings view).
 * Dihitung dari total transaksi beli - jual per aset per sumber.
 */
export interface Holding {
  user_id: string;
  asset_id: string;
  source_id: string;
  /** Jumlah bersih (beli - jual) */
  qty_net: number;
  /** Rata-rata biaya per-unit (USD) */
  avg_cost_usd: number;
}

// ---------------------------------------------------------------------------
// Smart Import (AI Parsing)
// ---------------------------------------------------------------------------

/**
 * Satu baris hasil parsing AI dari teks impor.
 * Digunakan untuk fitur Smart Import via Gemini.
 */
export interface SmartImportRow {
  /** Simbol aset yang terdeteksi (contoh: "BTC") */
  symbol: string;
  /** Tipe transaksi yang terdeteksi */
  type: TransactionType;
  /** Jumlah koin/token */
  quantity: number;
  /** Harga per-unit USD */
  price_usd: number;
  /** Harga per-unit IDR (opsional, bisa 0) */
  price_idr: number;
  /** Biaya transaksi USD */
  fee_usd: number;
  /** Tanggal transaksi (ISO string) */
  txn_date: string;
  /** Nama sumber (contoh: "Binance") */
  source_name: string;
  /** Catatan tambahan */
  notes: string;
  /** Tingkat kepercayaan parsing (0–1) */
  confidence: number;
}

// ---------------------------------------------------------------------------
// Tipe Utilitas
// ---------------------------------------------------------------------------

/** Tabel-tabel yang mendukung sinkronisasi (punya sync_status & updated_at) */
export type SyncableTable =
  | 'sources'
  | 'transactions'
  | 'watchlist'
  | 'fiat_holdings'
  | 'projects'
  | 'garapan_tasks';

/** Record dari salah satu tabel yang bisa disinkronisasi */
export type SyncableRecord = Source | Transaction | WatchlistItem | FiatHolding | Project | GarapanTask;

/** Payload untuk membuat entitas baru (tanpa field auto-generated) */
export type CreatePayload<T> = Omit<
  T,
  'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'sync_status'
>;

/** Payload untuk memperbarui entitas (semua field opsional kecuali id) */
export type UpdatePayload<T> = Partial<T> & { id: string };

/** Respons API generik */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Respons login */
export interface LoginResponse {
  success: boolean;
  token?: string;
  error?: string;
}

/** Hasil pencarian CoinGecko */
export interface CoinSearchResult {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  market_cap_rank: number | null;
}

/** Data pasar CoinGecko (dari /coins/markets) */
export interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number | null;
  price_change_percentage_24h: number | null;
  total_volume: number;
}

// ---------------------------------------------------------------------------
// Phase 2 Types
// ---------------------------------------------------------------------------

export interface Deadline {
  id: string;
  title: string;
  date: string;
  type: 'tge' | 'college' | 'other';
  notes: string | null;
  sync_status: SyncStatus;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface HabitEntry {
  date: string;
  habit_id: string;
  status: boolean;
  sync_status: SyncStatus;
  updated_at?: string;
}

export interface FinanceSummary {
  total_balance: number;
  income_month: number;
  expense_month: number;
  last_synced: string;
}

// ---------------------------------------------------------------------------
// Phase 3 Types
// ---------------------------------------------------------------------------

export interface Project {
  id: string;
  user_id: string;
  platform: string;
  estimated_reward: string;
  target_date: string;
  description: string;
  status: 'active' | 'completed';
  is_daily?: number; // 0 atau 1
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sync_status: SyncStatus;
}

export interface GarapanTask {
  id: string;
  project_id: string;
  title: string;
  is_completed: boolean;
  date: string;
  sync_status: SyncStatus;
  updated_at?: string;
  deleted_at?: string | null;
}
