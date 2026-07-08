'use client';

import { useState } from 'react';

// ─── Mock Parsed Data ──────────────────────────────────
// TODO: Replace with real Gemini AI parsing results

interface ParsedRow {
  id: string;
  date: string;
  type: 'buy' | 'sell' | 'transfer';
  asset: string;
  quantity: number;
  price: number;
  total: number;
  source: string;
}

const MOCK_PARSED: ParsedRow[] = [
  { id: '1', date: '2026-07-01', type: 'buy', asset: 'BTC', quantity: 0.01, price: 1_015_000_000, total: 10_150_000, source: 'Indodax' },
  { id: '2', date: '2026-07-02', type: 'buy', asset: 'ETH', quantity: 2, price: 57_400_000, total: 114_800_000, source: 'Binance' },
  { id: '3', date: '2026-07-03', type: 'sell', asset: 'SOL', quantity: 10, price: 2_850_000, total: 28_500_000, source: 'Tokocrypto' },
  { id: '4', date: '2026-07-05', type: 'buy', asset: 'ADA', quantity: 5000, price: 12_500, total: 62_500_000, source: 'Indodax' },
];

const SAMPLE_TEXT = `Beli 0.01 BTC harga 1.015.000.000 di Indodax tanggal 1 Juli 2026
Beli 2 ETH harga 57.400.000 di Binance tanggal 2 Juli 2026
Jual 10 SOL harga 2.850.000 di Tokocrypto tanggal 3 Juli 2026
Beli 5000 ADA harga 12.500 di Indodax tanggal 5 Juli 2026`;

function formatCurrency(amount: number) {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

// ─── Smart Import Page ─────────────────────────────────

export default function SmartImportPage() {
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [committed, setCommitted] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const handleParse = async () => {
    if (!text.trim()) return;

    setParsing(true);
    setParsed([]);
    setCommitted(false);

    // Simulate AI parsing delay
    // TODO: Replace with real Gemini API call via /api/smart-import
    await new Promise((r) => setTimeout(r, 2000));

    setParsed(MOCK_PARSED);
    setParsing(false);
  };

  const handleDelete = (id: string) => {
    setParsed((prev) => prev.filter((r) => r.id !== id));
  };

  const handleCommit = async () => {
    // TODO: Save parsed transactions to Dexie DB / API
    setCommitted(true);
  };

  const loadSample = () => {
    setText(SAMPLE_TEXT);
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <span className="text-2xl">✨</span> Smart Import
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Tempel teks transaksi, biar AI yang parsing otomatis
        </p>
      </div>

      {/* Disclaimer — NFR-09 */}
      <div className="glass-card-static p-4 border-l-4 border-accent-amber">
        <div className="flex items-start gap-3">
          <span className="text-lg shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-medium text-accent-amber">Perhatian Privasi</p>
            <p className="text-xs text-text-muted mt-1">
              Fitur ini mengirim teks ke Google Gemini API (free tier) untuk parsing.
              Jangan masukkan data sensitif seperti password atau private key.
              Data transaksi akan diproses oleh pihak ketiga sesuai kebijakan privasi Google.
            </p>
          </div>
        </div>
      </div>

      {/* Text Input Area */}
      <div className="glass-card-static p-5 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-text-primary">Teks Transaksi</label>
          <button
            onClick={loadSample}
            className="text-xs text-accent-emerald hover:underline"
          >
            Muat contoh
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tempel teks transaksi di sini...&#10;&#10;Contoh:&#10;Beli 0.01 BTC harga 1.015.000.000 di Indodax tanggal 1 Juli 2026&#10;Jual 10 SOL harga 2.850.000 di Tokocrypto tanggal 3 Juli 2026"
          rows={8}
          className="w-full glass-input px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none leading-relaxed"
        />

        <button
          onClick={handleParse}
          disabled={parsing || !text.trim()}
          className="w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-300
            gradient-emerald hover:shadow-lg hover:shadow-accent-emerald/25
            disabled:opacity-40 disabled:cursor-not-allowed
            active:scale-[0.98]"
        >
          {parsing ? (
            <span className="flex items-center justify-center gap-3">
              <div className="relative w-5 h-5">
                <div className="absolute inset-0 rounded-full border-2 border-white/30" />
                <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin" />
              </div>
              Memproses dengan AI...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              Parse dengan AI
            </span>
          )}
        </button>
      </div>

      {/* Parsing Animation */}
      {parsing && (
        <div className="glass-card-static p-8 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-emerald/10 mb-4 animate-pulse-glow">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" className="animate-spin-slow">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <p className="text-text-primary font-medium">Sedang menganalisis teks...</p>
          <p className="text-text-muted text-xs mt-1">AI sedang membaca dan mengekstrak transaksi</p>

          {/* Shimmer Rows */}
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-xl animate-shimmer bg-white/5" style={{ animationDelay: `${i * 0.3}s` }} />
            ))}
          </div>
        </div>
      )}

      {/* Parsed Results */}
      {parsed.length > 0 && !committed && (
        <div className="glass-card-static p-5 animate-fade-in-up space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">
              Hasil Parsing ({parsed.length} transaksi)
            </h3>
            <span className="text-[10px] text-accent-emerald font-medium px-2 py-1 rounded-full bg-accent-emerald/15">
              ✓ Berhasil
            </span>
          </div>

          {/* Table — Mobile: cards, Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted text-xs border-b border-border">
                  <th className="pb-2 text-left font-medium">Tanggal</th>
                  <th className="pb-2 text-left font-medium">Tipe</th>
                  <th className="pb-2 text-left font-medium">Aset</th>
                  <th className="pb-2 text-right font-medium">Jumlah</th>
                  <th className="pb-2 text-right font-medium">Harga</th>
                  <th className="pb-2 text-right font-medium">Total</th>
                  <th className="pb-2 text-left font-medium">Sumber</th>
                  <th className="pb-2 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {parsed.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 text-text-secondary">{row.date}</td>
                    <td className="py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                        ${row.type === 'buy' ? 'bg-accent-emerald/15 text-accent-emerald' :
                          row.type === 'sell' ? 'bg-accent-rose/15 text-accent-rose' :
                          'bg-accent-amber/15 text-accent-amber'}`}>
                        {row.type === 'buy' ? 'Beli' : row.type === 'sell' ? 'Jual' : 'Transfer'}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-text-primary">{row.asset}</td>
                    <td className="py-3 text-right text-text-secondary">{row.quantity}</td>
                    <td className="py-3 text-right text-text-secondary">{formatCurrency(row.price)}</td>
                    <td className="py-3 text-right font-medium text-text-primary">{formatCurrency(row.total)}</td>
                    <td className="py-3 text-text-secondary">{row.source}</td>
                    <td className="py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditId(editId === row.id ? null : row.id)}
                          className="text-text-muted hover:text-accent-emerald transition-colors text-xs"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="text-text-muted hover:text-accent-rose transition-colors text-xs"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {parsed.map((row) => (
              <div key={row.id} className="p-3 rounded-xl bg-white/[0.03] border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                      ${row.type === 'buy' ? 'bg-accent-emerald/15 text-accent-emerald' :
                        row.type === 'sell' ? 'bg-accent-rose/15 text-accent-rose' :
                        'bg-accent-amber/15 text-accent-amber'}`}>
                      {row.type === 'buy' ? 'Beli' : row.type === 'sell' ? 'Jual' : 'Transfer'}
                    </span>
                    <span className="text-sm font-semibold text-text-primary">{row.asset}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditId(editId === row.id ? null : row.id)} className="text-xs text-text-muted hover:text-accent-emerald">✏️</button>
                    <button onClick={() => handleDelete(row.id)} className="text-xs text-text-muted hover:text-accent-rose">🗑️</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <p className="text-text-muted">Tanggal: <span className="text-text-secondary">{row.date}</span></p>
                  <p className="text-text-muted">Jumlah: <span className="text-text-secondary">{row.quantity}</span></p>
                  <p className="text-text-muted">Harga: <span className="text-text-secondary">{formatCurrency(row.price)}</span></p>
                  <p className="text-text-muted">Total: <span className="text-text-primary font-medium">{formatCurrency(row.total)}</span></p>
                  <p className="text-text-muted col-span-2">Sumber: <span className="text-text-secondary">{row.source}</span></p>
                </div>
                {/* TODO: Inline edit form when editId === row.id */}
              </div>
            ))}
          </div>

          {/* Commit Button */}
          <button
            onClick={handleCommit}
            className="w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-300
              gradient-emerald hover:shadow-lg hover:shadow-accent-emerald/25
              active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12l5 5L20 7" />
              </svg>
              Tambahkan Semua ({parsed.length} transaksi)
            </span>
          </button>
        </div>
      )}

      {/* Success State */}
      {committed && (
        <div className="glass-card-static p-8 text-center animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-emerald/15 mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12l5 5L20 7" />
            </svg>
          </div>
          <p className="text-text-primary font-semibold text-lg">Berhasil! 🎉</p>
          <p className="text-text-muted text-sm mt-1">
            {parsed.length} transaksi berhasil ditambahkan
          </p>
          <button
            onClick={() => {
              setText('');
              setParsed([]);
              setCommitted(false);
            }}
            className="mt-6 px-6 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-medium
              hover:bg-white/5 transition-all"
          >
            Import Lagi
          </button>
        </div>
      )}

      {/* Bottom spacer */}
      <div className="h-8" />
    </div>
  );
}
