'use client';

import { useState, useMemo } from 'react';

// ─── Mock Data ─────────────────────────────────────────
// TODO: Replace with real data from API/Dexie DB

interface Holding {
  id: string;
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

const MOCK_HOLDINGS: Holding[] = [
  { id: '1', name: 'Bitcoin', symbol: 'BTC', icon: '₿', quantity: 0.45, currentPrice: 1_015_000_000, currentValue: 456_750_000, avgCost: 920_000_000, totalCost: 414_000_000, pnl: 42_750_000, pnlPercent: 10.33 },
  { id: '2', name: 'Ethereum', symbol: 'ETH', icon: 'Ξ', quantity: 5.2, currentPrice: 57_400_000, currentValue: 298_480_000, avgCost: 52_000_000, totalCost: 270_400_000, pnl: 28_080_000, pnlPercent: 10.38 },
  { id: '3', name: 'Solana', symbol: 'SOL', icon: '◎', quantity: 120, currentPrice: 2_850_000, currentValue: 342_000_000, avgCost: 3_100_000, totalCost: 372_000_000, pnl: -30_000_000, pnlPercent: -8.06 },
  { id: '4', name: 'USDT', symbol: 'USDT', icon: '₮', quantity: 5000, currentPrice: 16_100, currentValue: 80_500_000, avgCost: 15_900, totalCost: 79_500_000, pnl: 1_000_000, pnlPercent: 1.26 },
  { id: '5', name: 'Cardano', symbol: 'ADA', icon: '₳', quantity: 15000, currentPrice: 12_500, currentValue: 187_500_000, avgCost: 14_200, totalCost: 213_000_000, pnl: -25_500_000, pnlPercent: -11.97 },
  { id: '6', name: 'Polkadot', symbol: 'DOT', icon: '●', quantity: 800, currentPrice: 135_000, currentValue: 108_000_000, avgCost: 120_000, totalCost: 96_000_000, pnl: 12_000_000, pnlPercent: 12.5 },
];

type SortKey = 'value' | 'pnl' | 'name';

function formatCurrency(amount: number) {
  return 'Rp ' + Math.abs(amount).toLocaleString('id-ID');
}

// ─── Holdings Page ─────────────────────────────────────

export default function HoldingsPage() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('value');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...MOCK_HOLDINGS];

    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (h) => h.name.toLowerCase().includes(q) || h.symbol.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'value') return b.currentValue - a.currentValue;
      if (sortBy === 'pnl') return b.pnlPercent - a.pnlPercent;
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [search, sortBy]);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Aset Saya</h1>
          <p className="text-text-muted text-sm mt-0.5">{MOCK_HOLDINGS.length} aset</p>
        </div>
      </div>

      {/* Search & Sort */}
      <div className="flex gap-2 mb-5">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Cari aset..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 glass-input text-sm text-text-primary placeholder:text-text-muted"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="glass-input px-3 py-2.5 text-sm text-text-primary bg-bg-card appearance-none cursor-pointer pr-8"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
        >
          <option value="value">Nilai</option>
          <option value="pnl">PnL</option>
          <option value="name">Nama</option>
        </select>
      </div>

      {/* Holdings List */}
      <div className="space-y-3 stagger-children">
        {filtered.map((h) => {
          const isSelected = selectedId === h.id;
          const isProfit = h.pnl >= 0;

          return (
            <div key={h.id}>
              <button
                onClick={() => setSelectedId(isSelected ? null : h.id)}
                className="w-full glass-card p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg font-bold shrink-0">
                    {h.icon}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">{h.name}</p>
                    <p className="text-xs text-text-muted">
                      {h.quantity} {h.symbol}
                    </p>
                  </div>

                  {/* Value & PnL */}
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text-primary">
                      {formatCurrency(h.currentValue)}
                    </p>
                    <p className={`text-xs font-medium ${isProfit ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                      {isProfit ? '+' : '-'}{formatCurrency(h.pnl)}
                      <span className="ml-1 opacity-75">({isProfit ? '+' : ''}{h.pnlPercent.toFixed(2)}%)</span>
                    </p>
                  </div>
                </div>
              </button>

              {/* Detail Panel */}
              {isSelected && (
                <div className="mt-1 glass-card-static p-4 rounded-xl animate-fade-in space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] text-text-muted">Harga Saat Ini</p>
                      <p className="text-sm font-medium text-text-primary">{formatCurrency(h.currentPrice)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-text-muted">Rata-rata Biaya</p>
                      <p className="text-sm font-medium text-text-primary">{formatCurrency(h.avgCost)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-text-muted">Total Biaya</p>
                      <p className="text-sm font-medium text-text-primary">{formatCurrency(h.totalCost)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-text-muted">Nilai Sekarang</p>
                      <p className="text-sm font-medium text-text-primary">{formatCurrency(h.currentValue)}</p>
                    </div>
                  </div>

                  {/* TODO: Add transaction history for this asset */}
                  {/* TODO: Add edit/delete buttons */}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-text-muted text-sm">Tidak ada aset ditemukan</p>
        </div>
      )}

      {/* FAB — Add Transaction */}
      <button
        className="fixed bottom-24 md:bottom-8 right-6 w-14 h-14 rounded-2xl gradient-emerald
          flex items-center justify-center shadow-lg shadow-accent-emerald/25
          hover:shadow-xl hover:shadow-accent-emerald/30 active:scale-90
          transition-all duration-300 animate-fade-in-up z-40"
        title="Tambah Transaksi"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {/* Bottom spacer */}
      <div className="h-8" />
    </div>
  );
}
