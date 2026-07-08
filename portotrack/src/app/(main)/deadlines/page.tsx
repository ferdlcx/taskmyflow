'use client';

import React, { useState } from 'react';
import { Calendar, List, CheckSquare } from 'lucide-react';

const mockDeadlines = [
  { id: 1, title: 'TGE: ZK Sync', type: 'tge', date: '2026-07-15', amount: '$5,000 Est' },
  { id: 2, title: 'Task: LayerZero bridging', type: 'task', date: '2026-07-10', priority: 'High' },
  { id: 3, title: 'TGE: Starknet Phase 2', type: 'tge', date: '2026-08-01', amount: 'Unknown' },
  { id: 4, title: 'Task: Testnet Node setup', type: 'task', date: '2026-07-12', priority: 'Medium' },
];

export default function DeadlinesPage() {
  const [view, setView] = useState<'list' | 'calendar'>('list');

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <h1 className="text-3xl font-black uppercase text-black">Tugas & Deadlines</h1>
          <p className="text-sm font-bold text-text-muted mt-1 uppercase">Pantau TGE dan tugas-tugas penting Anda</p>
        </div>
        
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

      <div className="brutalist-card p-6 bg-white min-h-[400px]">
        {view === 'list' ? (
          <div className="space-y-4">
            {mockDeadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(d => (
              <div key={d.id} className="flex items-center justify-between p-4 bg-bg-primary border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all group cursor-pointer">
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
                <div className="text-right">
                  {d.type === 'tge' && <span className="text-sm font-black text-accent-emerald bg-accent-emerald/20 px-2 py-1 border-2 border-black">{d.amount}</span>}
                  {d.type === 'task' && <span className={`text-sm font-black px-2 py-1 border-2 border-black ${d.priority === 'High' ? 'text-accent-rose bg-accent-rose/20' : 'text-text-muted bg-gray-200'}`}>{d.priority} Priority</span>}
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
              const events = mockDeadlines.filter(d => d.date === dateStr);
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
    </div>
  );
}
