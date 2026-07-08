'use client';

import { useState, useMemo } from 'react';
import { Plus, X, Search, Check, Wallet, Coins, Landmark, TrendingUp, TrendingDown } from 'lucide-react';
import { searchCoins } from '@/lib/coingecko';
import type { CoinSearchResult } from '@/lib/types';

// ─── Mock Data ─────────────────────────────────────────

interface Holding {
  id: string;
  sourceName: string; // e.g., Binance, Bybit
  name: string;
  symbol: string;
  icon: string;
  quantity: number;
  currentPrice: number;
  currentValue: number;
  avgCost: number;
  totalCost: number;
  pnl: number;
  pnlPercent: number;
}

const MOCK_CRYPTO: Holding[] = [
  { id: '1', sourceName: 'Binance', name: 'Bitcoin', symbol: 'BTC', icon: '₿', quantity: 0.45, currentPrice: 1_015_000_000, currentValue: 456_750_000, avgCost: 920_000_000, totalCost: 414_000_000, pnl: 42_750_000, pnlPercent: 10.33 },
  { id: '2', sourceName: 'Binance', name: 'Ethereum', symbol: 'ETH', icon: 'Ξ', quantity: 5.2, currentPrice: 57_400_000, currentValue: 298_480_000, avgCost: 52_000_000, totalCost: 270_400_000, pnl: 28_080_000, pnlPercent: 10.38 },
  { id: '3', sourceName: 'Bybit', name: 'Solana', symbol: 'SOL', icon: '◎', quantity: 120, currentPrice: 2_850_000, currentValue: 342_000_000, avgCost: 3_100_000, totalCost: 372_000_000, pnl: -30_000_000, pnlPercent: -8.06 },
];

interface FiatEntry {
  id: string;
  name: string; // Paypal, Seabank, Krom, Utang
  type: 'bank' | 'debt';
  amount: number;
}

const MOCK_FIAT: FiatEntry[] = [
  { id: 'f1', name: 'Paypal ($16)', type: 'bank', amount: 260_000 },
  { id: 'f2', name: 'Seabank', type: 'bank', amount: 300_000 },
  { id: 'f3', name: 'Krom', type: 'bank', amount: 20_000 },
  { id: 'f4', name: 'Utang Budi', type: 'debt', amount: -50_000 },
  { id: 'f5', name: 'Piutang Andi', type: 'debt', amount: 150_000 },
];

type SortKey = 'value' | 'pnl' | 'name';
type TabKey = 'crypto' | 'fiat';

function formatCurrency(amount: number) {
  return 'Rp ' + Math.abs(amount).toLocaleString('id-ID');
}

export default function HoldingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('crypto');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('value');
  const [hideBalance, setHideBalance] = useState(false);

  // Add Asset Modal State
  const [showAdd, setShowAdd] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<CoinSearchResult[]>([]);

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

  const displayAmt = (amt: number) => hideBalance ? '***' : formatCurrency(amt);

  // Grouped Crypto
  const groupedCrypto = useMemo(() => {
    let list = [...MOCK_CRYPTO];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(h => h.name.toLowerCase().includes(q) || h.symbol.toLowerCase().includes(q) || h.sourceName.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (sortBy === 'value') return b.currentValue - a.currentValue;
      if (sortBy === 'pnl') return b.pnlPercent - a.pnlPercent;
      return a.name.localeCompare(b.name);
    });

    const groups: Record<string, typeof list> = {};
    let total = 0;
    list.forEach(h => {
      if (!groups[h.sourceName]) groups[h.sourceName] = [];
      groups[h.sourceName].push(h);
      total += h.currentValue;
    });
    return { groups, total };
  }, [search, sortBy]);

  // Grouped Fiat
  const groupedFiat = useMemo(() => {
    const banks = MOCK_FIAT.filter(f => f.type === 'bank');
    const debts = MOCK_FIAT.filter(f => f.type === 'debt');
    const totalBank = banks.reduce((sum, item) => sum + item.amount, 0);
    const totalDebt = debts.reduce((sum, item) => sum + item.amount, 0);
    return { banks, debts, totalBank, totalDebt, grandTotal: totalBank + totalDebt };
  }, []);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-4xl mx-auto space-y-6">
      
      {/* Header & Global Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <h1 className="text-3xl font-black uppercase text-black">Aset Saya</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-text-muted text-sm font-bold uppercase">Total Nilai:</p>
            <p className="text-lg font-black bg-accent-amber px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_#000]">
              {displayAmt(groupedCrypto.total + groupedFiat.grandTotal)}
            </p>
            <button onClick={() => setHideBalance(!hideBalance)} className="p-1 border-2 border-black bg-white shadow-[2px_2px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all">
              👀
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-white border-2 border-black p-1 shadow-[2px_2px_0px_#000] self-stretch md:self-auto">
          <button
            onClick={() => setActiveTab('crypto')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold uppercase transition-colors ${
              activeTab === 'crypto' ? 'bg-black text-white' : 'text-text-muted hover:text-black hover:bg-gray-100'
            }`}
          >
            <Coins className="w-4 h-4" /> Crypto
          </button>
          <button
            onClick={() => setActiveTab('fiat')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold uppercase transition-colors ${
              activeTab === 'fiat' ? 'bg-black text-white' : 'text-text-muted hover:text-black hover:bg-gray-100'
            }`}
          >
            <Landmark className="w-4 h-4" /> Fiat
          </button>
        </div>
      </div>

      {activeTab === 'crypto' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Cari platform, koin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 brutalist-input"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="brutalist-input px-3 py-2 text-sm font-bold uppercase cursor-pointer"
            >
              <option value="value">Nilai</option>
              <option value="pnl">PnL</option>
              <option value="name">Nama</option>
            </select>
            <button 
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 bg-accent-emerald text-black text-sm font-bold uppercase border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all whitespace-nowrap"
            >
              <Plus className="w-5 h-5 inline-block mr-1" /> Tambah
            </button>
          </div>

          {/* Grouped Crypto List */}
          {Object.entries(groupedCrypto.groups).length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-black font-bold uppercase text-text-muted bg-white">
              Tidak ada aset crypto.
            </div>
          ) : (
            Object.entries(groupedCrypto.groups).map(([platform, items]) => (
              <div key={platform} className="brutalist-card p-0 bg-white overflow-hidden">
                <div className="bg-bg-secondary p-3 border-b-2 border-black flex justify-between items-center">
                  <h3 className="font-black text-black uppercase">{platform}</h3>
                  <span className="text-sm font-bold bg-white px-2 py-0.5 border-2 border-black">
                    {displayAmt(items.reduce((s, i) => s + i.currentValue, 0))}
                  </span>
                </div>
                <div className="divide-y-2 divide-black">
                  {items.map(h => {
                    const isProfit = h.pnl >= 0;
                    return (
                      <div key={h.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 border-2 border-black bg-accent-amber/20 flex items-center justify-center font-bold text-xl">
                            {h.icon}
                          </div>
                          <div>
                            <p className="font-black uppercase text-black">{h.name}</p>
                            <p className="text-sm font-bold text-text-muted">{h.quantity} {h.symbol}</p>
                          </div>
                        </div>
                        <div className="flex flex-col md:items-end text-sm border-l-2 md:border-l-0 border-black pl-3 md:pl-0">
                          <p className="font-bold text-text-muted">Avg: {displayAmt(h.avgCost)}</p>
                          <p className="font-bold text-black">Now: {displayAmt(h.currentPrice)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-lg">{displayAmt(h.currentValue)}</p>
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 border-2 border-black ${isProfit ? 'bg-accent-emerald text-black' : 'bg-accent-rose text-white'}`}>
                            {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span className="text-xs font-bold">{isProfit ? '+' : '-'}{displayAmt(h.pnl)} ({isProfit ? '+' : ''}{h.pnlPercent}%)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'fiat' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black uppercase text-black">Saldo Bank / E-Wallet</h2>
            <button className="px-3 py-1 bg-accent-blue text-white font-bold text-sm border-2 border-black shadow-[2px_2px_0px_#000]">
              + Tambah Bank
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupedFiat.banks.map(b => (
              <div key={b.id} className="brutalist-card p-4 bg-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Wallet className="w-6 h-6 text-black" />
                  <span className="font-black uppercase text-black">{b.name}</span>
                </div>
                <span className="font-black text-lg">{displayAmt(b.amount)}</span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t-2 border-black">
            <h2 className="text-xl font-black uppercase text-black">Utang & Piutang</h2>
            <button className="px-3 py-1 bg-accent-rose text-white font-bold text-sm border-2 border-black shadow-[2px_2px_0px_#000]">
              + Tambah Utang
            </button>
          </div>

          <div className="space-y-3">
            {groupedFiat.debts.map(d => {
              const isPiutang = d.amount > 0;
              return (
                <div key={d.id} className={`brutalist-card p-4 flex justify-between items-center ${isPiutang ? 'bg-accent-emerald/20' : 'bg-accent-rose/20'}`}>
                  <span className="font-black uppercase text-black">{d.name}</span>
                  <span className={`font-black text-lg ${isPiutang ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {isPiutang ? '+' : ''}{displayAmt(d.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="brutalist-card p-6 bg-white w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
              <h2 className="text-xl font-black uppercase text-black">Cari Aset (CoinGecko)</h2>
              <button onClick={() => setShowAdd(false)} className="p-1 hover:bg-bg-secondary border-2 border-transparent hover:border-black transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Cari nama koin (contoh: sxt)..." 
                className="brutalist-input flex-1 p-2"
                autoFocus
              />
              <button type="submit" disabled={searching} className="px-4 py-2 bg-accent-amber border-2 border-black font-bold shadow-[2px_2px_0px_#000] disabled:opacity-50 flex items-center justify-center">
                <Search className="w-5 h-5" />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {searching ? (
                <div className="text-center p-4 font-bold animate-pulse">Mencari...</div>
              ) : results.length > 0 ? (
                results.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2 border-2 border-black hover:bg-bg-secondary group cursor-pointer transition-colors" onClick={() => { alert(`Fitur belum terhubung database: ${r.name}`); setShowAdd(false); }}>
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
                  <p>API Limit / Koin tidak ditemukan.</p>
                  <button className="mt-2 text-sm font-black text-black underline underline-offset-4 hover:text-accent-rose">
                    + Tambah Koin Manual
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}
