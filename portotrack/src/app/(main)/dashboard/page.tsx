'use client';

import { useState } from 'react';
import Link from 'next/link';

// ─── Mock Data ─────────────────────────────────────────
// TODO: Replace with real data from API/Dexie DB

const MOCK_NET_WORTH = 47_825_340;
const MOCK_PNL_AMOUNT = 3_214_500;
const MOCK_PNL_PERCENT = 7.21;
const MOCK_CURRENCY = 'IDR';

const MOCK_STATS = [
  { label: 'Total Aset', value: '12', icon: '💰' },
  { label: 'Sumber', value: '4', icon: '🏦' },
  { label: 'Watchlist', value: '8', icon: '👁️' },
];

const MOCK_ALLOCATION = [
  { name: 'Bitcoin', symbol: 'BTC', percentage: 42, color: '#F7931A' },
  { name: 'Ethereum', symbol: 'ETH', percentage: 28, color: '#627EEA' },
  { name: 'Solana', symbol: 'SOL', percentage: 12, color: '#9945FF' },
  { name: 'USDT', symbol: 'USDT', percentage: 10, color: '#26A17B' },
  { name: 'Lainnya', symbol: '...', percentage: 8, color: '#6B7280' },
];

const MOCK_TRANSACTIONS = [
  { id: 1, type: 'buy', asset: 'BTC', amount: 0.015, value: 15_250_000, date: '8 Jul 2026', source: 'Indodax' },
  { id: 2, type: 'sell', asset: 'ETH', amount: 1.2, value: 6_840_000, date: '7 Jul 2026', source: 'Binance' },
  { id: 3, type: 'buy', asset: 'SOL', amount: 25, value: 5_125_000, date: '6 Jul 2026', source: 'Tokocrypto' },
  { id: 4, type: 'transfer', asset: 'USDT', amount: 500, value: 8_050_000, date: '5 Jul 2026', source: 'MetaMask' },
  { id: 5, type: 'buy', asset: 'BTC', amount: 0.008, value: 8_200_000, date: '4 Jul 2026', source: 'Indodax' },
];

// ─── Helpers ───────────────────────────────────────────

function formatCurrency(amount: number, currency: string = 'IDR') {
  if (currency === 'IDR') {
    return 'Rp ' + amount.toLocaleString('id-ID');
  }
  return '$' + amount.toLocaleString('en-US');
}

function TransactionIcon({ type }: { type: string }) {
  if (type === 'buy') {
    return (
      <div className="w-9 h-9 rounded-xl bg-accent-emerald/15 flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
      </div>
    );
  }
  if (type === 'sell') {
    return (
      <div className="w-9 h-9 rounded-xl bg-accent-rose/15 flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-xl bg-accent-amber/15 flex items-center justify-center">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
    </div>
  );
}

// ─── Dashboard Page ────────────────────────────────────

export default function DashboardPage() {
  const [currency] = useState(MOCK_CURRENCY);
  const isProfit = MOCK_PNL_AMOUNT >= 0;

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-secondary text-sm">Selamat datang 👋</p>
          <h1 className="text-xl font-bold text-text-primary mt-0.5">Beranda</h1>
        </div>
        <Link
          href="/smart-import"
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-emerald text-white text-sm font-medium
            hover:shadow-lg hover:shadow-accent-emerald/20 transition-all duration-300 active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Smart Import
        </Link>
      </div>

      {/* Net Worth Card */}
      <div className="glass-card p-6 animate-fade-in-up">
        <p className="text-text-secondary text-sm mb-1">Total Nilai Portofolio</p>
        <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-3">
          {formatCurrency(MOCK_NET_WORTH, currency)}
        </h2>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold
          ${isProfit ? 'bg-accent-emerald/15 text-accent-emerald' : 'bg-accent-rose/15 text-accent-rose'}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {isProfit ? <path d="M12 19V5M5 12l7-7 7 7" /> : <path d="M12 5v14M5 12l7 7 7-7" />}
          </svg>
          {isProfit ? '+' : ''}{formatCurrency(MOCK_PNL_AMOUNT, currency)}
          <span className="text-xs opacity-80">({isProfit ? '+' : ''}{MOCK_PNL_PERCENT}%)</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 stagger-children">
        {MOCK_STATS.map((stat) => (
          <div key={stat.label} className="glass-card p-4 text-center">
            <span className="text-2xl mb-2 block">{stat.icon}</span>
            <p className="text-xl font-bold text-text-primary">{stat.value}</p>
            <p className="text-text-muted text-[11px] mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Allocation Breakdown */}
      <div className="glass-card-static p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Alokasi Aset</h3>

        {/* Bar Chart Placeholder */}
        <div className="flex h-3 rounded-full overflow-hidden mb-4">
          {MOCK_ALLOCATION.map((item) => (
            <div
              key={item.symbol}
              className="h-full transition-all duration-500"
              style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
              title={`${item.name} — ${item.percentage}%`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MOCK_ALLOCATION.map((item) => (
            <div key={item.symbol} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-text-secondary truncate">
                {item.name} <span className="text-text-muted">{item.percentage}%</span>
              </span>
            </div>
          ))}
        </div>

        {/* TODO: Replace with interactive chart (e.g., recharts or chart.js) */}
      </div>

      {/* Recent Transactions */}
      <div className="glass-card-static p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">Transaksi Terakhir</h3>
          <Link href="/holdings" className="text-accent-emerald text-xs font-medium hover:underline">
            Lihat semua →
          </Link>
        </div>

        <div className="space-y-3 stagger-children">
          {MOCK_TRANSACTIONS.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors duration-200"
            >
              <TransactionIcon type={tx.type} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary">
                    {tx.type === 'buy' ? 'Beli' : tx.type === 'sell' ? 'Jual' : 'Transfer'} {tx.asset}
                  </p>
                  <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-white/5">
                    {tx.source}
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {tx.amount} {tx.asset} · {tx.date}
                </p>
              </div>
              <p className={`text-sm font-semibold ${
                tx.type === 'sell' ? 'text-accent-rose' : 'text-text-primary'
              }`}>
                {tx.type === 'sell' ? '-' : '+'}{formatCurrency(tx.value, currency)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom spacer for mobile nav */}
      <div className="h-4" />
    </div>
  );
}
