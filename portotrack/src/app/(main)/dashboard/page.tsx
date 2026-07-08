'use client';

import { useState } from 'react';
import Link from 'next/link';
import HabitHeatmap from '@/components/HabitHeatmap';
import { Plus, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-black">Beranda</h1>
        </div>
        <Link
          href="/smart-import"
          className="flex items-center gap-2 px-5 py-2.5 bg-accent-emerald text-black text-sm font-bold border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[2px_2px_0px_#000] transition-all"
        >
          <Plus className="w-5 h-5" />
          SMART IMPORT
        </Link>
      </div>

      {/* Crypto Net Worth Card */}
      <div className="brutalist-card p-6 md:p-8 bg-accent-amber">
        <p className="text-black font-bold uppercase text-sm mb-2">Total Nilai Portofolio (Crypto)</p>
        <h2 className="text-4xl md:text-5xl font-black text-black mb-4 tracking-tighter">
          {formatCurrency(MOCK_NET_WORTH, currency)}
        </h2>
        <div className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-black font-bold shadow-[2px_2px_0px_#000] bg-white`}>
          {isProfit ? <TrendingUp className="w-5 h-5 text-accent-emerald" /> : <TrendingDown className="w-5 h-5 text-accent-rose" />}
          <span className={isProfit ? 'text-accent-emerald' : 'text-accent-rose'}>
            {isProfit ? '+' : ''}{formatCurrency(MOCK_PNL_AMOUNT, currency)}
          </span>
          <span className="text-black ml-1">({isProfit ? '+' : ''}{MOCK_PNL_PERCENT}%)</span>
        </div>
      </div>

      {/* Snapshot Finansial & Tugas Hari Ini */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Snapshot Finansial */}
        <div className="brutalist-card p-6 flex flex-col gap-5 bg-white">
          <h3 className="text-lg font-black uppercase text-black border-b-2 border-black pb-2">Snapshot Finansial</h3>
          <div className="flex flex-col gap-4">
            <div className="p-4 border-2 border-black bg-bg-secondary shadow-[2px_2px_0px_#000]">
              <p className="text-xs font-bold uppercase text-text-muted mb-1">Total Saldo (Sheet)</p>
              <p className="text-2xl font-black text-black">{formatCurrency(MOCK_FINANCE.saldo, currency)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border-2 border-black bg-accent-emerald/20 shadow-[2px_2px_0px_#000]">
                <div className="flex items-center gap-1.5 mb-2">
                  <ArrowUpRight className="w-4 h-4 text-accent-emerald" />
                  <p className="text-xs font-bold uppercase text-black">Pemasukan</p>
                </div>
                <p className="text-base font-black text-black">+{formatCurrency(MOCK_FINANCE.income, currency)}</p>
              </div>
              <div className="p-3 border-2 border-black bg-accent-rose/20 shadow-[2px_2px_0px_#000]">
                <div className="flex items-center gap-1.5 mb-2">
                  <ArrowDownRight className="w-4 h-4 text-accent-rose" />
                  <p className="text-xs font-bold uppercase text-black">Pengeluaran</p>
                </div>
                <p className="text-base font-black text-black">-{formatCurrency(MOCK_FINANCE.expense, currency)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tugas & Deadline Hari Ini */}
        <div className="brutalist-card p-6 flex flex-col gap-5 bg-white">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h3 className="text-lg font-black uppercase text-black">Tugas Hari Ini</h3>
            <Link href="/deadlines" className="text-xs font-bold uppercase text-black hover:underline">Lihat Kalender</Link>
          </div>
          <div className="flex flex-col gap-3 flex-1">
            {MOCK_DEADLINES.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 border-2 border-black bg-bg-secondary shadow-[2px_2px_0px_#000]">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 border-2 border-black ${d.type === 'TGE' ? 'bg-accent-emerald' : 'bg-blue-400'}`} />
                  <span className="text-sm font-bold text-black">{d.title}</span>
                </div>
                <span className="text-xs font-bold uppercase text-black border-2 border-black px-2 py-1 bg-white">{d.time}</span>
              </div>
            ))}
            {MOCK_DEADLINES.length === 0 && (
              <div className="flex-1 flex items-center justify-center font-bold text-black border-2 border-dashed border-black p-4">
                TIDAK ADA TUGAS HARI INI
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Habit Heatmap */}
      <HabitHeatmap data={MOCK_HABIT_DATA} />

      {/* Bottom spacer for mobile nav */}
      <div className="h-8" />
    </div>
  );
}
