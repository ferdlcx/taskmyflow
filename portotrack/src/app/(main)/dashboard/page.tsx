'use client';

import { useState } from 'react';
import Link from 'next/link';
import HabitHeatmap from '@/components/HabitHeatmap';

// ─── Mock Data ─────────────────────────────────────────

const MOCK_NET_WORTH = 47_825_340;
const MOCK_PNL_AMOUNT = 3_214_500;
const MOCK_PNL_PERCENT = 7.21;
const MOCK_CURRENCY = 'IDR';

const MOCK_FINANCE = {
  saldo: 25_000_000,
  income: 5_000_000,
  expense: 1_200_000
};

const MOCK_DEADLINES = [
  { id: 1, title: 'LayerZero Bridging', type: 'Task', time: 'Hari Ini' },
  { id: 2, title: 'ZK Sync TGE Check', type: 'TGE', time: 'Hari Ini' },
];

const MOCK_HABIT_DATA = Array.from({ length: 90 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - i);
  // Random activity level 0-3
  const val = Math.random() > 0.6 ? Math.floor(Math.random() * 4) : 0;
  return { date: d.toISOString().split('T')[0], value: val };
});

// ─── Helpers ───────────────────────────────────────────

function formatCurrency(amount: number, currency: string = 'IDR') {
  if (currency === 'IDR') {
    return 'Rp ' + amount.toLocaleString('id-ID');
  }
  return '$' + amount.toLocaleString('en-US');
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

      {/* Crypto Net Worth Card (Original) */}
      <div className="glass-card p-6 animate-fade-in-up">
        <p className="text-text-secondary text-sm mb-1">Total Nilai Portofolio (Crypto)</p>
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

      {/* Snapshot Finansial & Tugas Hari Ini */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Snapshot Finansial */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-text-primary">Snapshot Finansial</h3>
          <div className="flex flex-col gap-3">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <p className="text-xs text-text-muted">Total Saldo (Sheet)</p>
              <p className="text-lg font-bold text-text-primary">{formatCurrency(MOCK_FINANCE.saldo, currency)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-4 h-4 rounded bg-accent-emerald/20 flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                  </div>
                  <p className="text-[10px] text-text-muted">Pemasukan</p>
                </div>
                <p className="text-sm font-semibold text-accent-emerald">+{formatCurrency(MOCK_FINANCE.income, currency)}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-4 h-4 rounded bg-accent-rose/20 flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
                  </div>
                  <p className="text-[10px] text-text-muted">Pengeluaran</p>
                </div>
                <p className="text-sm font-semibold text-accent-rose">-{formatCurrency(MOCK_FINANCE.expense, currency)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tugas & Deadline Hari Ini */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Tugas & Deadline Hari Ini</h3>
            <Link href="/deadlines" className="text-xs text-accent-emerald hover:underline">Lihat Kalender</Link>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            {MOCK_DEADLINES.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${d.type === 'TGE' ? 'bg-accent-emerald' : 'bg-accent-blue'}`} />
                  <span className="text-sm font-medium text-text-primary">{d.title}</span>
                </div>
                <span className="text-xs text-text-muted px-2 py-0.5 rounded bg-white/5">{d.time}</span>
              </div>
            ))}
            {MOCK_DEADLINES.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
                Tidak ada tugas hari ini.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Habit Heatmap */}
      <HabitHeatmap data={MOCK_HABIT_DATA} />

      {/* Bottom spacer for mobile nav */}
      <div className="h-4" />
    </div>
  );
}
