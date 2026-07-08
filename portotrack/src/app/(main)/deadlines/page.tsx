'use client';

import React, { useState } from 'react';

const mockDeadlines = [
  { id: 1, title: 'TGE: ZK Sync', type: 'tge', date: '2026-07-15', amount: '$5,000 Est' },
  { id: 2, title: 'Task: LayerZero bridging', type: 'task', date: '2026-07-10', priority: 'High' },
  { id: 3, title: 'TGE: Starknet Phase 2', type: 'tge', date: '2026-08-01', amount: 'Unknown' },
  { id: 4, title: 'Task: Testnet Node setup', type: 'task', date: '2026-07-12', priority: 'Medium' },
];

export default function DeadlinesPage() {
  const [view, setView] = useState<'list' | 'calendar'>('list');

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Tugas & Deadlines</h1>
          <p className="text-sm text-text-secondary mt-1">Pantau TGE dan tugas-tugas penting Anda</p>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-lg">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              view === 'list' ? 'bg-white/10 text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              view === 'calendar' ? 'bg-white/10 text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            Calendar
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl min-h-[400px]">
        {view === 'list' ? (
          <div className="space-y-4">
            {mockDeadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(d => (
              <div key={d.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${d.type === 'tge' ? 'bg-accent-emerald' : 'bg-accent-blue'}`} />
                  <div>
                    <h3 className="font-semibold text-text-primary">{d.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-text-muted bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider">{d.type}</span>
                      <span className="text-xs text-text-secondary">{new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {d.type === 'tge' && <span className="text-sm font-medium text-accent-emerald">{d.amount}</span>}
                  {d.type === 'task' && <span className={`text-sm font-medium ${d.priority === 'High' ? 'text-red-400' : 'text-text-secondary'}`}>{d.priority} Priority</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-text-muted pb-2">{day}</div>
            ))}
            {/* Mock Calendar Grid for July 2026 */}
            {Array.from({ length: 3 }).map((_, i) => <div key={`empty-${i}`} className="p-4" />)}
            {Array.from({ length: 31 }).map((_, i) => {
              const day = i + 1;
              const dateStr = `2026-07-${day.toString().padStart(2, '0')}`;
              const events = mockDeadlines.filter(d => d.date === dateStr);
              
              return (
                <div key={day} className="min-h-[80px] p-2 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-xs text-text-secondary">{day}</span>
                  <div className="mt-2 space-y-1">
                    {events.map(e => (
                      <div key={e.id} className={`text-[10px] px-1.5 py-0.5 rounded-md truncate ${e.type === 'tge' ? 'bg-accent-emerald/20 text-accent-emerald' : 'bg-accent-blue/20 text-accent-blue'}`}>
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
