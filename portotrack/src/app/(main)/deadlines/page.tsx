'use client';

import React, { useState } from 'react';
import { Calendar, List, Plus, X, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Deadline } from '@/lib/types';

export default function DeadlinesPage() {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [showAdd, setShowAdd] = useState(false);
  
  // Real DB Data
  const deadlines = useLiveQuery(() => db.deadlines.filter(d => !d.deleted_at).toArray()) || [];

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const type = formData.get('type') as 'tge' | 'college' | 'other';
    const date = formData.get('date') as string;
    const notes = formData.get('notes') as string;

    await db.deadlines.add({
      id: crypto.randomUUID(),
      title,
      type,
      date,
      notes: notes || null,
      sync_status: 'pending',
      updated_at: new Date().toISOString(),
      deleted_at: null,
    });
    setShowAdd(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus deadline ini?')) {
      await db.deadlines.update(id, { deleted_at: new Date().toISOString(), sync_status: 'pending' });
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <h1 className="text-3xl font-black uppercase text-black">Tugas & Deadlines</h1>
          <p className="text-sm font-bold text-text-muted mt-1 uppercase">Pantau TGE dan tugas-tugas penting Anda</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent-amber text-black text-sm font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all"
          >
            <Plus className="w-4 h-4" /> Tambah
          </button>
          <div className="flex bg-white border-2 border-black p-1 shadow-[2px_2px_0px_#000]">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase transition-colors ${
                view === 'list' ? 'bg-accent-emerald text-black border-2 border-black' : 'text-text-muted hover:text-black border-2 border-transparent'
              }`}
            >
              <List className="w-4 h-4" /> List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase transition-colors ${
                view === 'calendar' ? 'bg-accent-emerald text-black border-2 border-black' : 'text-text-muted hover:text-black border-2 border-transparent'
              }`}
            >
              <Calendar className="w-4 h-4" /> Calendar
            </button>
          </div>
        </div>
      </div>

      <div className="brutalist-card p-6 bg-white min-h-[400px]">
        {deadlines.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-black font-bold uppercase text-text-muted bg-white">
            Belum ada deadline tersimpan.
          </div>
        ) : view === 'list' ? (
          <div className="space-y-4">
            {deadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(d => (
              <div key={d.id} className="flex items-center justify-between p-4 bg-bg-primary border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all group cursor-pointer relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 border-2 border-black ${d.type === 'tge' ? 'bg-accent-emerald' : 'bg-accent-blue'}`} />
                  <div>
                    <h3 className="font-black text-black uppercase">{d.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-black border-2 border-black bg-white px-2 py-0.5 uppercase tracking-wider">{d.type}</span>
                      <span className="text-xs font-bold text-text-muted">{new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-black text-black hidden md:block">{d.notes}</span>
                  <button onClick={() => handleDelete(d.id)} className="p-2 bg-accent-rose text-white border-2 border-black hover:scale-110 transition-transform opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-black uppercase text-black border-b-2 border-black pb-2">{day}</div>
            ))}
            {/* Mock Calendar Grid for July 2026 */}
            {Array.from({ length: 3 }).map((_, i) => <div key={`empty-${i}`} className="p-4" />)}
            {Array.from({ length: 31 }).map((_, i) => {
              const day = i + 1;
              const dateStr = `2026-07-${day.toString().padStart(2, '0')}`;
              const events = deadlines.filter(d => d.date === dateStr);
              const isToday = day === 8;
              
              return (
                <div key={day} className={`min-h-[100px] p-2 border-2 border-black transition-colors ${isToday ? 'bg-accent-amber/20' : 'bg-bg-primary hover:bg-bg-secondary'}`}>
                  <span className={`text-xs font-black ${isToday ? 'bg-black text-white px-2 py-1' : 'text-text-muted'}`}>{day}</span>
                  <div className="mt-2 space-y-2">
                    {events.map(e => (
                      <div key={e.id} className={`text-[10px] font-bold px-1.5 py-1 border-2 border-black truncate uppercase ${e.type === 'tge' ? 'bg-accent-emerald text-black' : 'bg-accent-blue text-white'}`}>
                        {e.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD MODAL */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="brutalist-card p-6 bg-white w-full max-w-md shadow-[8px_8px_0px_#000]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
              <h2 className="text-xl font-black uppercase text-black">Tambah Deadline Baru</h2>
              <button onClick={() => setShowAdd(false)} className="p-1 hover:bg-bg-secondary border-2 border-transparent hover:border-black transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase mb-1">Judul / Nama Tugas</label>
                <input type="text" name="title" placeholder="Contoh: Claim Airdrop Starknet" className="brutalist-input w-full p-2" required />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase mb-1">Tipe</label>
                <select name="type" className="brutalist-input w-full p-2 bg-white" required>
                  <option value="tge">TGE / Airdrop</option>
                  <option value="college">Tugas Kuliah</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold uppercase mb-1">Tanggal</label>
                <input type="date" name="date" className="brutalist-input w-full p-2" required />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase mb-1">Catatan Tambahan</label>
                <input type="text" name="notes" placeholder="Optional" className="brutalist-input w-full p-2" />
              </div>
              <button type="submit" className="w-full py-3 bg-accent-emerald text-black font-black uppercase border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#000] transition-all">
                Simpan Deadline
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
