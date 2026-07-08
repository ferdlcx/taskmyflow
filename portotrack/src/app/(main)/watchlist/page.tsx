'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { batchFetchPrices, searchCoins } from '@/lib/coingecko';
import { Plus, X, Search, Trash2, ArrowRight } from 'lucide-react';
import type { CoinSearchResult, Asset, WatchlistItem } from '@/lib/types';

function formatCurrency(amount: number) {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

export default function WatchlistPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<CoinSearchResult[]>([]);
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number>>({});
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Live Queries
  const watchlist = useLiveQuery(() => db.watchlist.filter(w => !w.deleted_at).toArray()) || [];
  const assets = useLiveQuery(() => db.assets.toArray()) || [];

  // Calculate Crypto Prices
  useEffect(() => {
    if (watchlist.length === 0 || assets.length === 0) return;
    const fetchPrices = async () => {
      const assetIds = watchlist.map(w => w.asset_id);
      const relevantAssets = assets.filter(a => assetIds.includes(a.id));
      const coingeckoIds = relevantAssets.map(a => a.coingecko_id);
      if (coingeckoIds.length === 0) return;
      
      const prices = await batchFetchPrices(coingeckoIds);
      const priceMap: Record<string, number> = {};
      prices.forEach(p => {
        priceMap[p.coingecko_id] = p.price_idr;
      });
      setCryptoPrices(priceMap);
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, [watchlist, assets]);

  // Handle Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await searchCoins(query);
      setResults(res);
    } catch (error) {
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectCoin = async (r: CoinSearchResult) => {
    let asset = await db.assets.where('coingecko_id').equals(r.id).first();
    if (!asset) {
      asset = {
        id: crypto.randomUUID(),
        coingecko_id: r.id,
        symbol: r.symbol.toUpperCase(),
        name: r.name,
        icon_url: r.thumb,
        created_at: new Date().toISOString()
      };
      await db.assets.add(asset);
    }
    setSelectedAsset(asset);
    setShowAdd(false);
    setShowTargetModal(true);
  };

  const handleAddWatchlist = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAsset) return;
    
    const formData = new FormData(e.currentTarget);
    const targetPrice = Number(formData.get('targetPrice'));
    const note = formData.get('note') as string;

    await db.watchlist.add({
      id: crypto.randomUUID(),
      user_id: 'local_user',
      asset_id: selectedAsset.id,
      target_price_usd: targetPrice || null, // Assuming storing IDR target price for simplicity
      note: note || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      sync_status: 'pending'
    });

    setShowTargetModal(false);
    setSelectedAsset(null);
    setQuery('');
    setResults([]);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus koin ini dari watchlist?')) {
      await db.watchlist.update(id, { deleted_at: new Date().toISOString(), sync_status: 'pending' });
    }
  };

  const handleConvertToHolding = async (id: string) => {
    alert('Fitur pindah ke Holding segera hadir');
  };

  // Derive final watchlist data
  const mappedWatchlist = useMemo(() => {
    return watchlist.map(w => {
      const asset = assets.find(a => a.id === w.asset_id);
      const currentPrice = asset && cryptoPrices[asset.coingecko_id] ? cryptoPrices[asset.coingecko_id] : 0;
      const targetPrice = w.target_price_usd || 0;
      
      let distance = 0;
      if (currentPrice > 0 && targetPrice > 0) {
        distance = (Math.abs(targetPrice - currentPrice) / currentPrice) * 100;
      }

      return {
        id: w.id,
        name: asset?.name || 'Unknown',
        symbol: asset?.symbol || '?',
        icon: asset?.icon_url || '',
        currentPrice,
        targetPrice,
        distance,
        targetType: targetPrice >= currentPrice ? 'above' : 'below',
      };
    });
  }, [watchlist, assets, cryptoPrices]);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <h1 className="text-3xl font-black uppercase text-black">Watchlist</h1>
          <p className="text-text-muted text-sm font-bold uppercase mt-1">
            {watchlist.length} koin dipantau
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-emerald text-black text-sm font-bold uppercase border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all"
        >
          <Plus className="w-5 h-5" />
          Tambah
        </button>
      </div>

      {/* Watchlist Items */}
      <div className="space-y-4">
        {mappedWatchlist.map((item) => {
          const isNearTarget = item.targetPrice > 0 && item.distance <= 5;

          return (
            <div key={item.id} className="brutalist-card p-0 bg-white overflow-hidden group">
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Icon & Info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 border-2 border-black bg-accent-amber/20 flex items-center justify-center font-bold text-xl overflow-hidden shrink-0">
                    {item.icon ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.icon} alt={item.symbol} className="w-full h-full object-cover" />
                    ) : '🪙'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-black uppercase text-black">{item.name}</p>
                      <span className="text-xs font-bold text-text-muted bg-gray-100 px-1 border border-black">{item.symbol}</span>
                    </div>
                    <p className="text-sm font-bold text-text-muted mt-0.5">
                      {formatCurrency(item.currentPrice)}
                    </p>
                  </div>
                </div>

                {/* Target */}
                <div className="flex flex-col md:items-end text-sm border-l-2 md:border-l-0 border-black pl-3 md:pl-0">
                  {item.targetPrice > 0 ? (
                    <>
                      <p className="font-bold text-text-muted">Target {item.targetType === 'above' ? '↑' : '↓'}</p>
                      <p className="font-black text-black text-lg">{formatCurrency(item.targetPrice)}</p>
                      <p className={`text-xs font-bold mt-0.5 inline-block px-1 border-2 border-black ${
                        isNearTarget ? 'bg-accent-amber text-black shadow-[2px_2px_0px_#000]' : 'bg-white text-text-muted'
                      }`}>
                        {isNearTarget ? '⚡ ' : ''}{item.distance.toFixed(1)}% lagi
                      </p>
                    </>
                  ) : (
                    <p className="text-text-muted font-bold italic">Tidak ada target</p>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="bg-bg-secondary p-3 border-t-2 border-black flex justify-between items-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleConvertToHolding(item.id)}
                  className="flex items-center gap-1 text-sm font-bold text-black hover:text-accent-emerald hover:underline underline-offset-2"
                >
                  Konversi ke Holding <ArrowRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="flex items-center gap-1 text-sm font-bold text-accent-rose hover:underline underline-offset-2"
                >
                  <Trash2 className="w-4 h-4" /> Hapus
                </button>
              </div>
            </div>
          );
        })}

        {mappedWatchlist.length === 0 && (
          <div className="p-12 text-center border-2 border-dashed border-black font-bold uppercase text-text-muted bg-white">
            <div className="text-4xl mb-4">👁️</div>
            <p className="text-black">Belum ada koin di watchlist</p>
            <p className="text-xs mt-1">Tambah koin untuk memantau harganya</p>
          </div>
        )}
      </div>

      {/* ─── MODALS ─── */}

      {/* ADD ASSET MODAL */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="brutalist-card p-6 bg-white w-full max-w-md max-h-[80vh] flex flex-col shadow-[8px_8px_0px_#000]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
              <h2 className="text-xl font-black uppercase text-black">Cari Koin</h2>
              <button onClick={() => setShowAdd(false)} className="p-1 hover:bg-bg-secondary border-2 border-transparent hover:border-black transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Cari nama koin (contoh: btc)..." 
                className="brutalist-input flex-1 p-2"
                autoFocus
              />
              <button type="submit" disabled={searching} className="px-4 py-2 bg-accent-amber border-2 border-black font-bold shadow-[2px_2px_0px_#000] flex items-center justify-center hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all disabled:opacity-50">
                <Search className="w-5 h-5" />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {searching ? (
                <div className="text-center p-4 font-bold animate-pulse">Mencari...</div>
              ) : results.length > 0 ? (
                results.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2 border-2 border-black hover:bg-bg-secondary group cursor-pointer transition-colors" onClick={() => handleSelectCoin(r)}>
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.thumb} alt={r.name} className="w-8 h-8 rounded-full border-2 border-black" />
                      <div>
                        <p className="font-bold text-black uppercase">{r.name}</p>
                        <p className="text-xs text-text-muted font-bold">{r.symbol}</p>
                      </div>
                    </div>
                    <div className="hidden group-hover:block p-1 bg-accent-emerald border-2 border-black">
                      <Plus className="w-4 h-4 text-black" />
                    </div>
                  </div>
                ))
              ) : query && !searching ? (
                <div className="text-center p-4 font-bold text-text-muted bg-gray-100 border-2 border-dashed border-black">
                  <p>Koin tidak ditemukan.</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* TARGET PRICE MODAL */}
      {showTargetModal && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="brutalist-card p-6 bg-white w-full max-w-md shadow-[8px_8px_0px_#000]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
              <h2 className="text-xl font-black uppercase text-black flex items-center gap-2">
                {selectedAsset.icon_url && (
                   /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={selectedAsset.icon_url} alt="" className="w-6 h-6 rounded-full border border-black" />
                )}
                Pantau {selectedAsset.symbol}
              </h2>
              <button onClick={() => { setShowTargetModal(false); setSelectedAsset(null); }} className="p-1 hover:bg-bg-secondary border-2 border-transparent hover:border-black transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddWatchlist} className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase mb-1">Target Harga (IDR)</label>
                <input 
                  type="number" 
                  step="any" 
                  name="targetPrice" 
                  placeholder="Opsional: 0" 
                  className="brutalist-input w-full p-2" 
                />
                <p className="text-xs font-bold text-text-muted mt-1">Kosongkan jika hanya ingin memantau tanpa target harga.</p>
              </div>
              <div>
                <label className="block text-sm font-bold uppercase mb-1">Catatan</label>
                <input 
                  type="text" 
                  name="note" 
                  placeholder="Contoh: Beli saat koreksi" 
                  className="brutalist-input w-full p-2" 
                />
              </div>
              <button type="submit" className="w-full py-3 bg-accent-emerald text-black font-black uppercase border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#000] transition-all">
                Simpan ke Watchlist
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bottom spacer */}
      <div className="h-8" />
    </div>
  );
}
