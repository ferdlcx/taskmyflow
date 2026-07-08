/**
 * PortoTrack — Sync Engine
 *
 * Mesin sinkronisasi antara Dexie (IndexedDB) dan Supabase.
 *
 * Strategi:
 * 1. Optimistic write: tulis ke Dexie dulu, tandai sync_status = 'pending'
 * 2. Push: kirim semua record 'pending' ke Supabase
 * 3. Pull: ambil record remote yang updated_at > last_synced_at
 * 4. Konflik: last-write-wins berdasarkan updated_at
 * 5. Soft delete: propagasi deleted_at antara lokal ↔ remote
 * 6. Retry: exponential backoff saat gagal
 */

import { db, getPendingRecords, markSynced, markSyncError } from './db';
import { supabase } from './supabase';
import type {
  Source,
  Transaction,
  WatchlistItem,
  FiatHolding,
  SyncableTable,
  SyncableRecord,
} from './types';

// ---------------------------------------------------------------------------
// Konstanta
// ---------------------------------------------------------------------------

const LAST_SYNCED_KEY = 'portotrack_last_synced_at';

/** Delay awal untuk exponential backoff (1 detik) */
const INITIAL_BACKOFF_MS = 1_000;

/** Maksimum retry sebelum menyerah */
const MAX_RETRIES = 5;

/** Daftar tabel yang perlu disinkronisasi */
const SYNCABLE_TABLES: SyncableTable[] = [
  'sources',
  'transactions',
  'watchlist',
  'fiat_holdings',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Ambil timestamp sinkronisasi terakhir dari localStorage.
 * @returns ISO string atau null jika belum pernah sync
 */
export function getLastSyncedAt(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_SYNCED_KEY);
}

/**
 * Simpan timestamp sinkronisasi terakhir.
 */
function setLastSyncedAt(timestamp: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_SYNCED_KEY, timestamp);
}

/**
 * Delay dengan exponential backoff.
 * @param attempt - Percobaan ke-n (0-based)
 */
function backoffDelay(attempt: number): Promise<void> {
  const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
  // Tambahkan jitter ±25% supaya tidak thundering herd
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return new Promise((resolve) => setTimeout(resolve, delay + jitter));
}

/**
 * Hapus field sync_status sebelum kirim ke Supabase.
 * Field ini hanya untuk Dexie, tidak ada di skema Supabase.
 */
function stripSyncStatus<T extends SyncableRecord>(
  record: T
): Omit<T, 'sync_status'> {
  const { sync_status: _, ...rest } = record;
  return rest;
}

// ---------------------------------------------------------------------------
// Push: Lokal → Remote
// ---------------------------------------------------------------------------

/**
 * Push satu tabel: kirim semua record 'pending' ke Supabase.
 *
 * Menggunakan upsert (on conflict id) sehingga aman untuk
 * insert maupun update. Soft-delete ter-propagasi karena
 * deleted_at dikirim apa adanya.
 *
 * @param table - Nama tabel
 * @returns Jumlah record yang berhasil di-push
 */
async function pushTable(table: SyncableTable): Promise<number> {
  const pending = await getPendingRecords<SyncableRecord>(table);

  if (pending.length === 0) return 0;

  let successCount = 0;

  for (const record of pending) {
    const cleanRecord = stripSyncStatus(record);

    const { error } = await supabase
      .from(table)
      .upsert(cleanRecord, { onConflict: 'id' });

    if (error) {
      console.error(`[Sync] Push error di ${table}/${record.id}:`, error.message);
      await markSyncError(table, record.id);
    } else {
      await markSynced(table, record.id);
      successCount++;
    }
  }

  return successCount;
}

/**
 * Push semua tabel yang pending ke Supabase.
 *
 * @returns Total record yang berhasil di-push
 */
export async function pushChanges(): Promise<number> {
  let total = 0;
  for (const table of SYNCABLE_TABLES) {
    total += await pushTable(table);
  }
  return total;
}

// ---------------------------------------------------------------------------
// Pull: Remote → Lokal
// ---------------------------------------------------------------------------

/**
 * Pull satu tabel: ambil record yang diubah sejak lastSyncedAt.
 *
 * Konflik diselesaikan dengan last-write-wins:
 * - Jika remote updated_at > lokal updated_at → pakai remote
 * - Jika lokal updated_at >= remote → abaikan (lokal menang)
 *
 * @param table - Nama tabel
 * @param lastSyncedAt - Timestamp ISO sinkronisasi terakhir
 * @returns Jumlah record yang di-pull
 */
async function pullTable(
  table: SyncableTable,
  lastSyncedAt: string | null
): Promise<number> {
  let query = supabase.from(table).select('*');

  if (lastSyncedAt) {
    query = query.gt('updated_at', lastSyncedAt);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`[Sync] Pull error di ${table}:`, error.message);
    return 0;
  }

  if (!data || data.length === 0) return 0;

  let mergedCount = 0;

  for (const remoteRecord of data) {
    const localRecord = await db.table(table).get(remoteRecord.id);

    if (!localRecord) {
      // Record baru dari remote — simpan langsung
      await db.table(table).put({
        ...remoteRecord,
        sync_status: 'synced',
      });
      mergedCount++;
      continue;
    }

    // Last-write-wins: bandingkan updated_at
    const remoteTime = new Date(remoteRecord.updated_at).getTime();
    const localTime = new Date(localRecord.updated_at).getTime();

    if (remoteTime > localTime) {
      // Remote menang — overwrite lokal
      await db.table(table).put({
        ...remoteRecord,
        sync_status: 'synced',
      });
      mergedCount++;
    }
    // Jika lokal menang (localTime >= remoteTime), abaikan remote.
    // Record lokal yang pending akan di-push saat pushChanges().
  }

  return mergedCount;
}

/**
 * Pull semua perubahan dari Supabase sejak sinkronisasi terakhir.
 *
 * @param lastSyncedAt - Override timestamp (opsional, default dari localStorage)
 * @returns Total record yang di-pull
 */
export async function pullChanges(lastSyncedAt?: string): Promise<number> {
  const since = lastSyncedAt ?? getLastSyncedAt();
  let total = 0;

  for (const table of SYNCABLE_TABLES) {
    total += await pullTable(table, since);
  }

  return total;
}

// ---------------------------------------------------------------------------
// Full Sync Cycle
// ---------------------------------------------------------------------------

/**
 * Jalankan siklus sinkronisasi lengkap dengan retry.
 *
 * Urutan:
 * 1. Push perubahan lokal ke remote
 * 2. Pull perubahan remote ke lokal
 * 3. Update timestamp last_synced_at
 *
 * @returns Object dengan jumlah pushed dan pulled, atau error
 */
export async function syncAll(): Promise<{
  success: boolean;
  pushed: number;
  pulled: number;
  error?: string;
}> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // 1. Push dulu supaya remote punya data terbaru kita
      const pushed = await pushChanges();

      // 2. Pull perubahan remote
      const pulled = await pullChanges();

      // 3. Catat waktu sync
      const now = new Date().toISOString();
      setLastSyncedAt(now);

      console.info(
        `[Sync] Berhasil — pushed: ${pushed}, pulled: ${pulled} (attempt ${attempt + 1})`
      );

      return { success: true, pushed, pulled };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(
        `[Sync] Gagal (attempt ${attempt + 1}/${MAX_RETRIES}): ${message}`
      );

      if (attempt < MAX_RETRIES - 1) {
        await backoffDelay(attempt);
      } else {
        console.error('[Sync] Menyerah setelah', MAX_RETRIES, 'percobaan');
        return {
          success: false,
          pushed: 0,
          pulled: 0,
          error: `Sync gagal setelah ${MAX_RETRIES} percobaan: ${message}`,
        };
      }
    }
  }

  // Tidak seharusnya sampai sini, tapi untuk TypeScript
  return { success: false, pushed: 0, pulled: 0, error: 'Unexpected error' };
}

// ---------------------------------------------------------------------------
// Optimistic Write Helpers
// ---------------------------------------------------------------------------

/**
 * Tulis record baru ke Dexie secara optimistic.
 * Record ditandai sync_status = 'pending' agar di-push ke Supabase nanti.
 *
 * @param table - Nama tabel
 * @param record - Record lengkap (sudah ada id)
 */
export async function optimisticPut<T extends SyncableRecord>(
  table: SyncableTable,
  record: T
): Promise<void> {
  await db.table(table).put({
    ...record,
    sync_status: 'pending',
  });
}

/**
 * Soft-delete record secara optimistic.
 * Set deleted_at ke now dan tandai pending untuk sync.
 *
 * @param table - Nama tabel
 * @param id - ID record yang akan di-soft-delete
 */
export async function optimisticSoftDelete(
  table: SyncableTable,
  id: string
): Promise<void> {
  const now = new Date().toISOString();
  await db.table(table).update(id, {
    deleted_at: now,
    updated_at: now,
    sync_status: 'pending',
  });
}
