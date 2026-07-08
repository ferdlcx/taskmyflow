'use client';

import { useState } from 'react';

// ─── Mock Data ─────────────────────────────────────────
// TODO: Replace with real data from API/Dexie DB

interface WatchItem {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  currentPrice: number;
  targetPrice: number;
  targetType: 'above' | 'below';
  change24h: number;
}

const MOCK_WATCHLIST: WatchItem[] = [
  { id: '1', name: 'Bitcoin', symbol: 'BTC', icon: '₿', currentPrice: 1_015_000_000, targetPrice: 1_100_000_000, targetType: 'above', change24h: 2.3 },
  { id: '2', name: 'Ethereum', symbol: 'ETH', icon: 'Ξ', currentPrice: 57_400_000, targetPrice: 65_000_000, targetType: 'above', change24h: 1.8 },
  { id: '3', name: 'Ripple', symbol: 'XRP', icon: '✕', currentPrice: 11_200, targetPrice: 10_000, targetType: 'below', change24h: -0.5 },
  { id: '4', name: 'Avalanche', symbol: 'AVAX', icon: 'A', currentPrice: 560_000, targetPrice: 700_000, targetType: 'above', change24h: 4.2 },
  { id: '5', name: 'Chainlink', symbol: 'LINK', icon: '⬡', currentPrice: 285_000, targetPrice: 350_000, targetType: 'above', change24h: -1.1 },
  { id: '6', name: 'Polygon', symbol: 'POL', icon: '⬣', currentPrice: 8_500, targetPrice: 7_000, targetType: 'below', change24h: 3.7 },
  { id: '7', name: 'Cosmos', symbol: 'ATOM', icon: '⚛', currentPrice: 165_000, targetPrice: 200_000, targetType: 'above', change24h: 0.9 },
  { id: '8', name: 'Near Protocol', symbol: 'NEAR', icon: 'N', currentPrice: 95_000, targetPrice: 120_000, targetType: 'above', change24h: -2.4 },
];

function formatCurrency(amount: number) {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

function getDistance(current: number, target: number, type: 'above' | 'below') {
  const diff = type === 'above'
    ? ((target - current) / current) * 100
    : ((current - target) / current) * 100;
  return diff;
}

// ─── Watchlist Page ────────────────────────────────────

export default function WatchlistPage() {
  const [watchlist] = useState(MOCK_WATCHLIST);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Watchlist</h1>
          <p className="text-text-muted text-sm mt-0.5">{watchlist.length} koin dipantau</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-text-secondary text-sm font-medium
            hover:bg-white/5 hover:text-text-primary transition-all duration-200 active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Tambah
        </button>
      </div>

      {/* Add Form (simple placeholder) */}
      {showAdd && (
        <div className="glass-card p-4 mb-5 animate-fade-in">
          <p className="text-sm text-text-secondary mb-3">Tambah koin ke watchlist</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nama / simbol koin..."
              className="flex-1 glass-input px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted"
            />
            <button className="px-4 py-2.5 rounded-xl gradient-emerald text-white text-sm font-medium hover:shadow-lg hover:shadow-accent-emerald/20 transition-all active:scale-95">
              Tambah
            </button>
          </div>
          {/* TODO: Implement search & add logic with CoinGecko API */}
        </div>
      )}

      {/* Watchlist Items */}
      <div className="space-y-3 stagger-children">
        {watchlist.map((item) => {
          const distance = getDistance(item.currentPrice, item.targetPrice, item.targetType);
          const isNearTarget = distance <= 5;
          const isPositive24h = item.change24h >= 0;

          return (
            <div key={item.id} className="glass-card p-4 group">
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg font-bold shrink-0">
                  {item.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary">{item.name}</p>
                    <span className="text-[10px] text-text-muted font-medium">{item.symbol}</span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {formatCurrency(item.currentPrice)}
                    <span className={`ml-2 ${isPositive24h ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                      {isPositive24h ? '+' : ''}{item.change24h}%
                    </span>
                  </p>
                </div>

                {/* Target */}
                <div className="text-right">
                  <p className="text-[11px] text-text-muted mb-0.5">
                    Target {item.targetType === 'above' ? '↑' : '↓'}
                  </p>
                  <p className="text-sm font-medium text-text-primary">
                    {formatCurrency(item.targetPrice)}
                  </p>
                  <p className={`text-[11px] font-medium mt-0.5 ${
                    isNearTarget ? 'text-accent-amber' : 'text-text-muted'
                  }`}>
                    {isNearTarget ? '⚡ ' : ''}{distance.toFixed(1)}% lagi
                  </p>
                </div>
              </div>

              {/* Swipe hint / Convert button — visible on hover/group */}
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button className="text-xs text-accent-emerald hover:underline">
                  Konversi ke Holding →
                </button>
                <button className="text-xs text-accent-rose hover:underline">
                  Hapus
                </button>
              </div>
              {/* TODO: Implement swipe-to-convert on mobile (touch events) */}
            </div>
          );
        })}
      </div>

      {watchlist.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">👁️</div>
          <p className="text-text-muted text-sm">Belum ada koin di watchlist</p>
          <p className="text-text-muted text-xs mt-1">Tambah koin untuk memantau harganya</p>
        </div>
      )}

      {/* Bottom spacer */}
      <div className="h-8" />
    </div>
  );
}
