/**
 * PortoTrack — CoinGecko Service
 *
 * Wrapper untuk CoinGecko API (free tier).
 * Termasuk rate-limit handling dan fallback ke cache lokal.
 */

import { db } from './db';
import type { CoinSearchResult, CoinMarketData, PriceCache } from './types';

/** Base URL CoinGecko API v3 */
const BASE_URL = 'https://api.coingecko.com/api/v3';

/** Opsional API key untuk pro tier */
const API_KEY = process.env.COINGECKO_API_KEY || '';

/** Durasi cache yang dianggap masih valid (5 menit) */
const CACHE_TTL_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Bangun URL dengan query params dan API key (jika ada).
 */
function buildUrl(path: string, params: Record<string, string> = {}): string {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  if (API_KEY) {
    url.searchParams.set('x_cg_demo_api_key', API_KEY);
  }
  return url.toString();
}

/**
 * Fetch wrapper dengan handling untuk rate limit (429).
 * Jika 429, return null sehingga caller bisa fallback ke cache.
 */
async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);

    if (res.status === 429) {
      console.warn('[CoinGecko] Rate limited (429). Menggunakan data cache.');
      return null;
    }

    if (!res.ok) {
      console.error(`[CoinGecko] HTTP ${res.status}: ${res.statusText}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.error('[CoinGecko] Network error:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Cari koin berdasarkan nama atau simbol.
 *
 * @param query - Kata kunci pencarian (contoh: "bitcoin", "ETH")
 * @returns Array hasil pencarian, kosong jika gagal/rate-limited
 */
export async function searchCoins(query: string): Promise<CoinSearchResult[]> {
  const url = buildUrl('/search', { query });
  const data = await safeFetch<{ coins: CoinSearchResult[] }>(url);

  if (!data?.coins) return [];

  return data.coins.map((coin) => ({
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol,
    thumb: coin.thumb,
    market_cap_rank: coin.market_cap_rank,
  }));
}

/**
 * Ambil harga batch untuk beberapa koin sekaligus.
 * Hasilnya langsung disimpan ke price_cache di Dexie.
 *
 * @param ids - Array CoinGecko ID (contoh: ["bitcoin", "ethereum"])
 * @returns Array PriceCache yang berhasil diambil
 */
export async function batchFetchPrices(ids: string[]): Promise<PriceCache[]> {
  if (ids.length === 0) return [];

  // Cek cache dulu — kumpulkan yang masih valid
  const now = Date.now();
  const cached: PriceCache[] = [];
  const staleIds: string[] = [];

  for (const id of ids) {
    const entry = await db.price_cache.get(id);
    if (entry && now - new Date(entry.fetched_at).getTime() < CACHE_TTL_MS) {
      cached.push(entry);
    } else {
      staleIds.push(id);
    }
  }

  // Jika semua masih valid, langsung return
  if (staleIds.length === 0) return cached;

  // Fetch dari API (max 250 per request di free tier)
  const url = buildUrl('/coins/markets', {
    vs_currency: 'usd',
    ids: staleIds.join(','),
    order: 'market_cap_desc',
    per_page: '250',
    page: '1',
    sparkline: 'false',
    price_change_percentage: '24h',
  });

  const marketData = await safeFetch<CoinMarketData[]>(url);

  if (!marketData) {
    // Rate limited atau error — return cache apa adanya (termasuk stale)
    const staleEntries = await db.price_cache
      .where('coingecko_id')
      .anyOf(staleIds)
      .toArray();
    return [...cached, ...staleEntries];
  }

  // Kita perlu fetch juga harga IDR
  const urlIdr = buildUrl('/simple/price', {
    ids: staleIds.join(','),
    vs_currencies: 'idr',
  });
  const idrData = await safeFetch<Record<string, { idr: number }>>(urlIdr);

  // Simpan ke cache
  const freshEntries: PriceCache[] = marketData.map((coin) => ({
    coingecko_id: coin.id,
    price_usd: coin.current_price,
    price_idr: idrData?.[coin.id]?.idr ?? 0,
    fetched_at: new Date().toISOString(),
  }));

  // Bulk put ke Dexie
  await db.price_cache.bulkPut(freshEntries);

  return [...cached, ...freshEntries];
}

/**
 * Ambil detail lengkap satu koin.
 *
 * @param id - CoinGecko ID (contoh: "bitcoin")
 * @returns Data pasar koin, atau null jika gagal
 */
export async function getCoinDetails(
  id: string
): Promise<CoinMarketData | null> {
  const url = buildUrl('/coins/markets', {
    vs_currency: 'usd',
    ids: id,
    order: 'market_cap_desc',
    per_page: '1',
    page: '1',
    sparkline: 'false',
  });

  const data = await safeFetch<CoinMarketData[]>(url);
  return data?.[0] ?? null;
}

/**
 * Ambil harga dari cache lokal tanpa hit API.
 * Berguna untuk tampilan offline.
 *
 * @param coingeckoId - CoinGecko ID
 * @returns Data cache atau undefined jika belum pernah di-cache
 */
export async function getCachedPrice(
  coingeckoId: string
): Promise<PriceCache | undefined> {
  return db.price_cache.get(coingeckoId);
}
