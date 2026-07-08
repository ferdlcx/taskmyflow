'use client';

import { useState } from 'react';
import { Plus, Trash2, CheckCircle, Circle, Edit2 } from 'lucide-react';

const MOCK_GARAPAN = [
  { id: '1', platform: 'Galxe', estimated_reward: '$50', target_date: '2026-07-15', description: 'Testnet V2 Campaign', status: 'active' },
  { id: '2', platform: 'Binance', estimated_reward: '100 BNB', target_date: '2026-07-10', description: 'Megadrop Airdrop', status: 'active' },
  { id: '3', platform: 'Bybit', estimated_reward: 'Mantle Tokens', target_date: '2026-06-30', description: 'MNT Staking Pool', status: 'completed' },
];

export default function GarapanPage() {
  const [projects, setProjects] = useState(MOCK_GARAPAN);
  const [showAdd, setShowAdd] = useState(false);

  const toggleStatus = (id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'active' ? 'completed' : 'active' } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black uppercase tracking-tight text-black">Garapan & Airdrop</h1>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-amber text-black text-sm font-bold border-2 border-black shadow-[4px_4px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_#000] transition-all"
        >
          <Plus className="w-5 h-5" /> TAMBAH BARU
        </button>
      </div>

      {showAdd && (
        <div className="brutalist-card p-6 bg-accent-teal/20 space-y-4 animate-fade-in-up">
          <h2 className="text-xl font-black uppercase border-b-2 border-black pb-2 mb-4">Input Garapan Baru</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Platform (CEX/Web)</label>
              <input type="text" placeholder="Contoh: Binance" className="brutalist-input w-full p-2" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Estimasi Reward</label>
              <input type="text" placeholder="Contoh: $50 / 100 Token" className="brutalist-input w-full p-2" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Tanggal/Deadline</label>
              <input type="date" className="brutalist-input w-full p-2" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Keterangan / Sumber</label>
              <input type="text" placeholder="Catatan tambahan" className="brutalist-input w-full p-2" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t-2 border-black">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-white text-black font-bold border-2 border-black shadow-[2px_2px_0px_#000]">Batal</button>
            <button className="px-4 py-2 bg-accent-emerald text-black font-bold border-2 border-black shadow-[2px_2px_0px_#000]">Simpan Garapan</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {projects.map(p => (
          <div key={p.id} className={`brutalist-card p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${p.status === 'completed' ? 'opacity-50 bg-bg-secondary' : 'bg-white'}`}>
            <div className="flex items-start gap-3 flex-1">
              <button onClick={() => toggleStatus(p.id)} className="mt-1 hover:scale-110 transition-transform">
                {p.status === 'completed' ? <CheckCircle className="w-6 h-6 text-accent-emerald" /> : <Circle className="w-6 h-6 text-text-muted" />}
              </button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-black text-white border border-black">{p.platform}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-black uppercase border border-black ${p.status === 'active' ? 'bg-accent-emerald' : 'bg-bg-secondary'}`}>{p.status}</span>
                </div>
                <h3 className={`text-lg font-black uppercase ${p.status === 'completed' ? 'line-through text-text-muted' : 'text-black'}`}>{p.description}</h3>
                <div className="flex items-center gap-4 text-xs font-bold text-text-muted mt-1 uppercase">
                  <span>💰 Reward: {p.estimated_reward}</span>
                  <span>📅 Date: {p.target_date}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button className="p-2 bg-accent-amber border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => deleteProject(p.id)} className="p-2 bg-accent-rose text-white border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
