'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Check, RefreshCw, Trash2, Edit2, AlertTriangle, PlayCircle } from 'lucide-react';

// ─── Types ──────────────────────────────────

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

const SAMPLE_TEXT = `Beli 0.01 BTC harga 1.015.000.000 di Indodax tanggal 1 Juli 2026
Beli 2 ETH harga 57.400.000 di Binance tanggal 2 Juli 2026
Jual 10 SOL harga 2.850.000 di Tokocrypto tanggal 3 Juli 2026
Beli 5000 ADA harga 12.500 di Indodax tanggal 5 Juli 2026`;

function formatCurrency(amount: number) {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

function CexBadge({ source }: { source: string }) {
  const name = source.toLowerCase();
  if (name.includes('binance')) return <span className="bg-[#F3BA2F] text-black px-2 py-1 text-[10px] font-black uppercase border-2 border-black tracking-tighter">BINANCE</span>;
  if (name.includes('tokocrypto')) return <span className="bg-[#1E88E5] text-white px-2 py-1 text-[10px] font-black uppercase border-2 border-black tracking-tighter">TOKO</span>;
  if (name.includes('indodax')) return <span className="bg-[#0A2640] text-white px-2 py-1 text-[10px] font-black uppercase border-2 border-black tracking-tighter">INDODAX</span>;
  if (name.includes('bybit')) return <span className="bg-[#FFB11A] text-black px-2 py-1 text-[10px] font-black uppercase border-2 border-black tracking-tighter">BYBIT</span>;
  if (name.includes('okx')) return <span className="bg-black text-white px-2 py-1 text-[10px] font-black uppercase border-2 border-white tracking-tighter">OKX</span>;
  return <span className="bg-gray-300 text-black px-2 py-1 text-[10px] font-black uppercase border-2 border-black tracking-tighter">{source}</span>;
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

    try {
      const res = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (json.success) {
        // Ensure unique IDs
        const dataWithIds = json.data.map((r: any, idx: number) => ({ ...r, id: r.id || `ai-${idx}` }));
        setParsed(dataWithIds);
      } else {
        alert(json.error || 'Gagal memproses data');
      }
    } catch (e) {
      alert('Terjadi kesalahan saat menghubungi server AI');
    } finally {
      setParsing(false);
    }
  };

  const handleDelete = (id: string) => {
    setParsed((prev) => prev.filter((r) => r.id !== id));
  };

  const handleCommit = async () => {
    // TODO: Save parsed transactions to DB
    setCommitted(true);
  };

  const loadSample = () => {
    setText(SAMPLE_TEXT);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-black flex items-center gap-3 uppercase tracking-tight">
          <Sparkles className="w-8 h-8 text-black" fill="#facc15" /> SMART IMPORT
        </h1>
        <p className="text-black font-bold uppercase text-sm mt-1 border-b-2 border-black inline-block pb-1">
          Tempel teks transaksi, biar AI yang parsing otomatis
        </p>
      </div>

      {/* Disclaimer */}
      <div className="brutalist-card-static p-4 bg-accent-amber border-2 border-black shadow-[4px_4px_0px_#000]">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-black shrink-0" />
          <div>
            <p className="text-sm font-black text-black uppercase">Perhatian Privasi</p>
            <p className="text-xs font-bold text-black mt-1">
              FITUR INI MENGIRIM TEKS KE GOOGLE GEMINI API.
              JANGAN MASUKKAN DATA SENSITIF SEPERTI PASSWORD ATAU PRIVATE KEY.
            </p>
          </div>
        </div>
      </div>

      {/* Text Input Area */}
      <div className="brutalist-card-static p-5 bg-white border-2 border-black shadow-[4px_4px_0px_#000]">
        <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
          <label className="text-base font-black uppercase text-black">Teks Transaksi</label>
          <button
            onClick={loadSample}
            className="text-xs font-black uppercase text-black bg-accent-teal px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_#000] transition-all"
          >
            MUAT CONTOH
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tempel teks transaksi di sini...&#10;&#10;Contoh:&#10;Beli 0.01 BTC harga 1.015.000.000 di Indodax tanggal 1 Juli 2026&#10;Jual 10 SOL harga 2.850.000 di Tokocrypto tanggal 3 Juli 2026"
          rows={8}
          className="w-full brutalist-input px-4 py-3 text-sm font-bold placeholder:text-text-muted resize-none leading-relaxed focus:bg-yellow-50"
        />

        <button
          onClick={handleParse}
          disabled={parsing || !text.trim()}
          className="w-full mt-4 py-4 border-2 border-black bg-accent-emerald text-black font-black uppercase tracking-widest shadow-[4px_4px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[2px_2px_0px_#000] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {parsing ? (
            <span className="flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              MEMPROSES DENGAN AI...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <PlayCircle className="w-5 h-5 fill-black text-white" />
              PARSE DENGAN AI
            </span>
          )}
        </button>
      </div>

      {/* Parsing Animation */}
      {parsing && (
        <div className="brutalist-card-static p-8 text-center bg-white border-2 border-black shadow-[4px_4px_0px_#000]">
          <div className="inline-flex items-center justify-center w-16 h-16 border-4 border-black bg-accent-emerald mb-4 animate-bounce">
            <Loader2 className="w-8 h-8 text-black animate-spin" />
          </div>
          <p className="text-black font-black text-xl uppercase tracking-widest">ANALYZING...</p>
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 border-2 border-black bg-bg-secondary animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      )}

      {/* Parsed Results */}
      {parsed.length > 0 && !committed && (
        <div className="brutalist-card-static p-6 bg-white border-2 border-black shadow-[4px_4px_0px_#000] space-y-6">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h3 className="text-xl font-black uppercase text-black">
              HASIL PARSING ({parsed.length})
            </h3>
            <span className="text-xs font-black uppercase text-black px-3 py-1 border-2 border-black bg-accent-emerald shadow-[2px_2px_0px_#000]">
              BERHASIL
            </span>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto border-2 border-black shadow-[4px_4px_0px_#000]">
            <table className="w-full text-sm font-bold bg-white">
              <thead className="bg-bg-secondary border-b-2 border-black">
                <tr className="uppercase tracking-tighter">
                  <th className="p-3 text-left border-r-2 border-black">Tanggal</th>
                  <th className="p-3 text-left border-r-2 border-black">Tipe</th>
                  <th className="p-3 text-left border-r-2 border-black">Aset</th>
                  <th className="p-3 text-right border-r-2 border-black">Jumlah</th>
                  <th className="p-3 text-right border-r-2 border-black">Harga</th>
                  <th className="p-3 text-right border-r-2 border-black">Total</th>
                  <th className="p-3 text-left border-r-2 border-black">Sumber</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black">
                {parsed.map((row) => (
                  <tr key={row.id} className="hover:bg-yellow-50">
                    <td className="p-3 border-r-2 border-black">{row.date}</td>
                    <td className="p-3 border-r-2 border-black">
                      <span className={`text-xs font-black uppercase px-2 py-1 border-2 border-black inline-block
                        ${row.type === 'buy' ? 'bg-accent-emerald text-black' :
                          row.type === 'sell' ? 'bg-accent-rose text-white' :
                          'bg-accent-amber text-black'}`}>
                        {row.type === 'buy' ? 'BELI' : row.type === 'sell' ? 'JUAL' : 'TF'}
                      </span>
                    </td>
                    <td className="p-3 text-lg font-black border-r-2 border-black">{row.asset}</td>
                    <td className="p-3 text-right border-r-2 border-black">{row.quantity}</td>
                    <td className="p-3 text-right border-r-2 border-black">{formatCurrency(row.price)}</td>
                    <td className="p-3 text-right font-black border-r-2 border-black">{formatCurrency(row.total)}</td>
                    <td className="p-3 border-r-2 border-black">
                      <CexBadge source={row.source} />
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditId(editId === row.id ? null : row.id)} className="p-2 border-2 border-black bg-bg-secondary hover:bg-accent-teal hover:shadow-[2px_2px_0px_#000] active:shadow-none transition-all">
                          <Edit2 className="w-4 h-4 text-black" />
                        </button>
                        <button onClick={() => handleDelete(row.id)} className="p-2 border-2 border-black bg-bg-secondary hover:bg-accent-rose hover:text-white hover:shadow-[2px_2px_0px_#000] active:shadow-none transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {parsed.map((row) => (
              <div key={row.id} className="p-4 bg-white border-2 border-black shadow-[4px_4px_0px_#000]">
                <div className="flex items-center justify-between mb-3 border-b-2 border-black pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black uppercase px-2 py-1 border-2 border-black inline-block
                      ${row.type === 'buy' ? 'bg-accent-emerald text-black' :
                        row.type === 'sell' ? 'bg-accent-rose text-white' :
                        'bg-accent-amber text-black'}`}>
                      {row.type === 'buy' ? 'Beli' : row.type === 'sell' ? 'Jual' : 'Transfer'}
                    </span>
                    <span className="text-xl font-black text-black uppercase">{row.asset}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditId(editId === row.id ? null : row.id)} className="p-1.5 border-2 border-black bg-bg-secondary active:bg-accent-teal"><Edit2 className="w-4 h-4 text-black" /></button>
                    <button onClick={() => handleDelete(row.id)} className="p-1.5 border-2 border-black bg-bg-secondary active:bg-accent-rose"><Trash2 className="w-4 h-4 text-black" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm font-bold">
                  <p className="text-text-secondary">Tanggal: <span className="text-black uppercase">{row.date}</span></p>
                  <p className="text-text-secondary">Jumlah: <span className="text-black">{row.quantity}</span></p>
                  <p className="text-text-secondary">Harga: <span className="text-black">{formatCurrency(row.price)}</span></p>
                  <p className="text-text-secondary">Total: <span className="text-black font-black text-base">{formatCurrency(row.total)}</span></p>
                  <div className="col-span-2 pt-2 border-t-2 border-dashed border-black">
                    <span className="text-text-secondary mr-2">Sumber:</span> <CexBadge source={row.source} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Commit Button */}
          <button
            onClick={handleCommit}
            className="w-full mt-4 py-4 border-2 border-black bg-black text-white font-black uppercase tracking-widest shadow-[4px_4px_0px_#10B981] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#10B981] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[2px_2px_0px_#10B981] transition-all"
          >
            <span className="flex items-center justify-center gap-2">
              <Check className="w-5 h-5 text-accent-emerald" strokeWidth={3} />
              TAMBAHKAN SEMUA ({parsed.length})
            </span>
          </button>
        </div>
      )}

      {/* Success State */}
      {committed && (
        <div className="brutalist-card-static p-8 text-center bg-white border-2 border-black shadow-[4px_4px_0px_#000]">
          <div className="inline-flex items-center justify-center w-20 h-20 border-4 border-black bg-accent-emerald mb-4 shadow-[4px_4px_0px_#000] rotate-3">
            <Check className="w-10 h-10 text-black" strokeWidth={3} />
          </div>
          <p className="text-black font-black text-2xl uppercase tracking-tighter">BERHASIL!</p>
          <p className="text-black font-bold uppercase mt-2">
            {parsed.length} TRANSAKSI TELAH DITAMBAHKAN
          </p>
          <button
            onClick={() => {
              setText('');
              setParsed([]);
              setCommitted(false);
            }}
            className="mt-8 px-8 py-3 border-2 border-black bg-accent-amber text-black font-black uppercase shadow-[4px_4px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[2px_2px_0px_#000] transition-all flex items-center justify-center mx-auto gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            IMPORT LAGI
          </button>
        </div>
      )}

      {/* Bottom spacer */}
      <div className="h-8" />
    </div>
  );
}
