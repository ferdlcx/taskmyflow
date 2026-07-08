'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Plus, X, Trash2, Edit2, Wallet, Landmark, Blocks } from 'lucide-react';
import type { Source } from '@/lib/types';

const TYPE_BADGES: Record<string, { label: string; icon: React.ReactNode }> = {
  cex: { label: 'CEX', icon: <Landmark className="w-5 h-5" /> },
  wallet: { label: 'Wallet', icon: <Wallet className="w-5 h-5" /> },
  defi: { label: 'DeFi', icon: <Blocks className="w-5 h-5" /> },
};

function formatCurrency(amount: number) {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

export default function SourcesPage() {
  const sources = useLiveQuery(() => db.sources.filter(s => !s.deleted_at).toArray()) || [];
  const transactions = useLiveQuery(() => db.transactions.filter(t => !t.deleted_at).toArray()) || [];
  const assets = useLiveQuery(() => db.assets.toArray()) || [];
  const priceCache = useLiveQuery(() => db.price_cache.toArray()) || [];
  const fiatHoldings = useLiveQuery(() => db.fiat_holdings.filter(f => !f.deleted_at).toArray()) || [];
  
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [formData, setFormData] = useState({ name: '', type: 'cex' as 'cex'|'wallet'|'defi' });

  // Ambil data kurs dan mata uang tampilan
  const displayCurrency = typeof window !== 'undefined' ? (localStorage.getItem('portotrack_display_currency') || 'IDR') : 'IDR';
  const kurs = typeof window !== 'undefined' ? (Number(localStorage.getItem('portotrack_kurs')) || 16100) : 16100;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editId) {
      await db.sources.update(editId, {
        name: formData.name,
        type: formData.type as 'cex'|'wallet',
        updated_at: new Date().toISOString(),
        sync_status: 'pending'
      });
      setEditId(null);
    } else {
      await db.sources.add({
        id: crypto.randomUUID(),
        user_id: 'local_user',
        name: formData.name,
        type: formData.type as 'cex'|'wallet',
        icon_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        sync_status: 'pending'
      });
      setShowAdd(false);
    }
    setFormData({ name: '', type: 'cex' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus sumber ini? Semua transaksi terkait tidak akan terhapus tapi kehilangan referensi.')) {
      await db.sources.update(id, {
        deleted_at: new Date().toISOString(),
        sync_status: 'pending'
      });
    }
  };

  const startEdit = (s: Source) => {
    setEditId(s.id);
    setFormData({ name: s.name, type: s.type as 'cex'|'wallet'|'defi' });
  };

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b-4 border-black pb-4">
        <div>
          <h1 className="text-3xl font-black uppercase text-black">Sumber Aset</h1>
          <p className="text-text-muted font-bold mt-1">Kelola daftar Exchange dan Wallet Anda</p>
        </div>
        <button
          onClick={() => { setShowAdd(!showAdd); setEditId(null); setFormData({ name: '', type: 'cex' }); }}
          className="flex items-center gap-2 px-4 py-2 bg-accent-amber border-2 border-black font-black uppercase shadow-[4px_4px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#000] transition-all"
        >
          {showAdd ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showAdd ? 'Batal' : 'Tambah'}
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="brutalist-card p-6 bg-white border-4 border-black shadow-[8px_8px_0px_#000] animate-fade-in">
          <h3 className="text-xl font-black uppercase mb-4">Tambah Sumber Baru</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-bold uppercase mb-1">Nama Sumber</label>
              <input
                type="text"
                placeholder="Cth: Binance, MetaMask"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="brutalist-input w-full p-3 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase mb-1">Tipe</label>
              <div className="flex gap-2">
                {Object.entries(TYPE_BADGES).map(([key, badge]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: key as any })}
                    className={`flex-1 py-3 border-2 border-black font-black uppercase transition-all flex items-center justify-center gap-2
                      ${formData.type === key ? 'bg-accent-emerald shadow-[4px_4px_0px_#000] -translate-y-1' : 'bg-white hover:bg-gray-100'}`}
                  >
                    {badge.icon} {badge.label}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" className="w-full py-3 bg-accent-blue text-white font-black uppercase border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#000] transition-all">
              Simpan Sumber
            </button>
          </form>
        </div>
      )}

      {/* Sources List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.length === 0 && !showAdd && (
          <div className="col-span-full text-center p-8 border-4 border-dashed border-black bg-white">
            <Wallet className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-2xl font-black uppercase mb-2">Belum ada sumber</h2>
            <p className="text-text-muted font-bold">Tambahkan exchange atau wallet pertama Anda</p>
          </div>
        )}

        {sources.map(source => {
          const badge = TYPE_BADGES[source.type] || TYPE_BADGES.cex;
          const isEditing = editId === source.id;
          
          // Hitung saldo aset kripto untuk sumber ini
          const sourceCryptoHoldings = new Map<string, number>(); // asset_id -> qty
          const sourceTransactions = transactions.filter(t => t.source_id === source.id);
          
          sourceTransactions.forEach(t => {
            const currentQty = sourceCryptoHoldings.get(t.asset_id) || 0;
            if (t.type === 'buy') {
              sourceCryptoHoldings.set(t.asset_id, currentQty + t.quantity);
            } else if (t.type === 'sell') {
              sourceCryptoHoldings.set(t.asset_id, currentQty - t.quantity);
            }
          });

          // Hitung total nilai USD untuk kripto
          let cryptoValueUSD = 0;
          sourceCryptoHoldings.forEach((qty, assetId) => {
            if (qty > 0) {
              const asset = assets.find(a => a.id === assetId);
              const price = priceCache.find(p => p.coingecko_id === asset?.coingecko_id);
              const priceUSD = price?.price_usd || 0;
              cryptoValueUSD += qty * priceUSD;
            }
          });

          // Hitung total saldo fiat (IDR) untuk sumber ini
          const sourceFiats = fiatHoldings.filter(f => f.source_id === source.id);
          const fiatValueIDR = sourceFiats.reduce((sum, f) => sum + f.amount, 0);

          // Hitung estimasi rekap total
          const hasCrypto = cryptoValueUSD > 0;
          const hasFiat = fiatValueIDR > 0;

          return (
            <div key={source.id} className="brutalist-card p-5 bg-white border-2 border-black shadow-[4px_4px_0px_#000] flex flex-col group relative">
              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="brutalist-input w-full p-2 bg-white"
                    required
                  />
                  <div className="flex gap-2">
                     <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })} className="brutalist-input p-2 flex-1">
                        <option value="cex">CEX</option>
                        <option value="wallet">Wallet</option>
                        <option value="defi">DeFi</option>
                     </select>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 py-2 bg-accent-emerald font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all">Simpan</button>
                    <button type="button" onClick={() => setEditId(null)} className="flex-1 py-2 bg-gray-200 font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all">Batal</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-accent-amber border-2 border-black">
                        {badge.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-black uppercase">{source.name}</h3>
                        <span className="inline-block px-2 py-0.5 mt-1 bg-black text-white text-xs font-bold uppercase">
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Rekap Saldo */}
                  <div className="mt-4 pt-4 border-t-2 border-dashed border-black">
                    <span className="text-[10px] font-black uppercase text-text-muted block mb-1">Rekap Saldo Aset</span>
                    <div className="space-y-1">
                      {hasCrypto && (
                        <div className="flex justify-between items-center text-sm font-bold uppercase text-black">
                          <span>Crypto</span>
                          <span>
                            ${cryptoValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      {hasFiat && (
                        <div className="flex justify-between items-center text-sm font-bold uppercase text-black">
                          <span>Fiat / Cash</span>
                          <span>
                            {formatCurrency(fiatValueIDR)}
                          </span>
                        </div>
                      )}
                      {!hasCrypto && !hasFiat && (
                        <span className="text-xs font-bold text-text-muted italic block">Tidak ada saldo aktif</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-gray-200 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-text-muted uppercase">Transaksi</p>
                      <p className="text-xs font-bold text-black">{sourceTransactions.length} Txn</p>
                    </div>
                    <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(source)} className="p-2 bg-white border-2 border-black hover:bg-accent-blue hover:text-white transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(source.id)} className="p-2 bg-white border-2 border-black hover:bg-accent-rose hover:text-white transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
