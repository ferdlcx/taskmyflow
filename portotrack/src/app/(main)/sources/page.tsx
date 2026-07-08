'use client';

import { useState } from 'react';

// ─── Mock Data ─────────────────────────────────────────
// TODO: Replace with real data from API/Dexie DB

interface Source {
  id: string;
  name: string;
  type: 'cex' | 'wallet' | 'defi';
  icon: string;
  totalValue: number;
  assetsCount: number;
  lastSync: string;
}

const MOCK_SOURCES: Source[] = [
  { id: '1', name: 'Indodax', type: 'cex', icon: '🇮🇩', totalValue: 245_000_000, assetsCount: 5, lastSync: '2 jam lalu' },
  { id: '2', name: 'Binance', type: 'cex', icon: '🔶', totalValue: 380_500_000, assetsCount: 8, lastSync: '5 menit lalu' },
  { id: '3', name: 'MetaMask', type: 'wallet', icon: '🦊', totalValue: 125_800_000, assetsCount: 4, lastSync: '1 jam lalu' },
  { id: '4', name: 'Tokocrypto', type: 'cex', icon: '🟢', totalValue: 89_200_000, assetsCount: 3, lastSync: '12 jam lalu' },
];

const TYPE_BADGES: Record<string, { label: string; className: string }> = {
  cex: { label: 'CEX', className: 'bg-blue-500/15 text-blue-400' },
  wallet: { label: 'Wallet', className: 'bg-purple-500/15 text-purple-400' },
  defi: { label: 'DeFi', className: 'bg-accent-amber/15 text-accent-amber' },
};

function formatCurrency(amount: number) {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

// ─── Sources Page ──────────────────────────────────────

export default function SourcesPage() {
  const [sources] = useState(MOCK_SOURCES);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const totalValue = sources.reduce((sum, s) => sum + s.totalValue, 0);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Sumber</h1>
          <p className="text-text-muted text-sm mt-0.5">
            {sources.length} sumber · Total {formatCurrency(totalValue)}
          </p>
        </div>
        <button
          onClick={() => { setShowAdd(!showAdd); setEditId(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-text-secondary text-sm font-medium
            hover:bg-white/5 hover:text-text-primary transition-all duration-200 active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Tambah
        </button>
      </div>

      {/* Add / Edit Form */}
      {showAdd && (
        <div className="glass-card p-5 mb-5 animate-fade-in space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Tambah Sumber Baru</h3>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nama sumber (cth: Binance, MetaMask)"
              className="w-full glass-input px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted"
            />

            <div className="flex gap-2">
              {Object.entries(TYPE_BADGES).map(([key, badge]) => (
                <button
                  key={key}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-transparent
                    ${badge.className} hover:border-white/10`}
                >
                  {badge.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <button className="flex-1 py-2.5 rounded-xl gradient-emerald text-white text-sm font-medium hover:shadow-lg hover:shadow-accent-emerald/20 transition-all active:scale-95">
                Simpan
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2.5 rounded-xl border border-border text-text-secondary text-sm hover:bg-white/5 transition-all"
              >
                Batal
              </button>
            </div>
          </div>
          {/* TODO: Implement save logic */}
        </div>
      )}

      {/* Sources List */}
      <div className="space-y-3 stagger-children">
        {sources.map((source) => {
          const badge = TYPE_BADGES[source.type];
          const isEditing = editId === source.id;

          return (
            <div key={source.id} className="glass-card p-4">
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl shrink-0">
                  {source.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-text-primary">{source.name}</p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">
                    {source.assetsCount} aset · Sync {source.lastSync}
                  </p>
                </div>

                {/* Value + Actions */}
                <div className="text-right">
                  <p className="text-sm font-semibold text-text-primary">
                    {formatCurrency(source.totalValue)}
                  </p>
                  <div className="flex gap-2 mt-1 justify-end">
                    <button
                      onClick={() => setEditId(isEditing ? null : source.id)}
                      className="text-[11px] text-text-muted hover:text-accent-emerald transition-colors"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="text-[11px] text-text-muted hover:text-accent-rose transition-colors"
                      title="Hapus"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>

              {/* Edit panel */}
              {isEditing && (
                <div className="mt-3 pt-3 border-t border-border animate-fade-in space-y-3">
                  <input
                    type="text"
                    defaultValue={source.name}
                    className="w-full glass-input px-3 py-2 text-sm text-text-primary"
                  />
                  <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-lg gradient-emerald text-white text-sm font-medium active:scale-95 transition-all">
                      Simpan
                    </button>
                    <button onClick={() => setEditId(null)} className="px-4 py-2 rounded-lg border border-border text-text-secondary text-sm hover:bg-white/5 transition-all">
                      Batal
                    </button>
                  </div>
                  {/* TODO: Implement edit/delete logic */}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sources.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🏦</div>
          <p className="text-text-muted text-sm">Belum ada sumber</p>
          <p className="text-text-muted text-xs mt-1">Tambahkan exchange atau wallet kamu</p>
        </div>
      )}

      {/* Bottom spacer */}
      <div className="h-8" />
    </div>
  );
}
