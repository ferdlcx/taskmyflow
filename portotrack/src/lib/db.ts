/**
 * PortoTrack — Dexie Database (IndexedDB)
 *
 * Database lokal untuk offline-first.
 * Semua tabel disinkronkan ke Supabase via sync engine.
 *
 * Catatan indeks:
 * - `++` = auto-increment (tidak dipakai karena kita pakai UUID)
 * - `&`  = unique index
 * - `*`  = multi-entry index
 * - Tanpa prefix = non-unique index
 */

import Dexie, { type EntityTable, type Table } from 'dexie';
import type {
  Source,
  Asset,
  Transaction,
  WatchlistItem,
  FiatHolding,
  PriceCache,
  Deadline,
  HabitEntry,
} from './types';

/**
 * Database utama PortoTrack.
 * Meng-extend Dexie untuk tipe-safe table access.
 */
class PortoTrackDB extends Dexie {
  sources!: EntityTable<Source, 'id'>;
  assets!: EntityTable<Asset, 'id'>;
  transactions!: EntityTable<Transaction, 'id'>;
  watchlist!: EntityTable<WatchlistItem, 'id'>;
  fiat_holdings!: EntityTable<FiatHolding, 'id'>;
  price_cache!: EntityTable<PriceCache, 'coingecko_id'>;
  deadlines!: EntityTable<Deadline, 'id'>;
  habits!: Table<HabitEntry>;

  constructor() {
    super('portotrack-db');

    this.version(1).stores({
      // --- Tabel yang disinkronisasi ---
      sources: [
        '&id',
        'user_id',
        'type',
        'sync_status',
        'updated_at',
        'deleted_at',
      ].join(', '),

      assets: [
        '&id',
        '&coingecko_id',
        'symbol',
        'name',
      ].join(', '),

      transactions: [
        '&id',
        'user_id',
        'asset_id',
        'source_id',
        'type',
        'txn_date',
        'sync_status',
        'updated_at',
        'deleted_at',
        // Indeks gabungan untuk query holding per aset per sumber
        '[user_id+asset_id]',
        '[user_id+source_id]',
        '[user_id+asset_id+source_id]',
      ].join(', '),

      watchlist: [
        '&id',
        'user_id',
        'asset_id',
        'sync_status',
        'updated_at',
        'deleted_at',
      ].join(', '),

      fiat_holdings: [
        '&id',
        'user_id',
        'source_id',
        'currency',
        'sync_status',
        'updated_at',
        'deleted_at',
        '[user_id+source_id]',
      ].join(', '),

      deadlines: [
        '&id',
        'date',
        'sync_status',
        'updated_at',
        'deleted_at'
      ].join(', '),

      habits: [
        '[date+habit_id]',
        'date',
        'habit_id',
        'sync_status',
        'updated_at'
      ].join(', '),

      // --- Tabel lokal (tidak disinkronisasi) ---
      price_cache: [
        '&coingecko_id',
        'fetched_at',
      ].join(', '),
    });
  }
}

/** Instance database singleton */
export const db = new PortoTrackDB();

// ---------------------------------------------------------------------------
// Helper Queries
// ---------------------------------------------------------------------------

/**
 * Ambil semua record yang pending sinkronisasi dari suatu tabel.
 * @param table - Nama tabel Dexie
 * @returns Array record yang sync_status = 'pending'
 */
export async function getPendingRecords<T>(
  table: 'sources' | 'transactions' | 'watchlist' | 'fiat_holdings'
): Promise<T[]> {
  return (await db.table(table).where('sync_status').equals('pending').toArray()) as T[];
}

/**
 * Ambil semua record aktif (belum di-soft-delete) dari suatu tabel.
 * @param table - Nama tabel Dexie
 * @returns Array record yang deleted_at = null
 */
export async function getActiveRecords<T>(
  table: 'sources' | 'transactions' | 'watchlist' | 'fiat_holdings'
): Promise<T[]> {
  return (await db
    .table(table)
    .filter((item: Record<string, unknown>) => item.deleted_at === null)
    .toArray()) as T[];
}

/**
 * Tandai record sebagai sudah disinkronisasi.
 * @param table - Nama tabel Dexie
 * @param id - ID record
 */
export async function markSynced(
  table: 'sources' | 'transactions' | 'watchlist' | 'fiat_holdings',
  id: string
): Promise<void> {
  await db.table(table).update(id, { sync_status: 'synced' as const });
}

/**
 * Tandai record sebagai error sinkronisasi.
 * @param table - Nama tabel Dexie
 * @param id - ID record
 */
export async function markSyncError(
  table: 'sources' | 'transactions' | 'watchlist' | 'fiat_holdings',
  id: string
): Promise<void> {
  await db.table(table).update(id, { sync_status: 'error' as const });
}
