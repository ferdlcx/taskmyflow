import React from 'react';

interface HabitHeatmapProps {
  data: { date: string; value: number }[];
}

export default function HabitHeatmap({ data }: HabitHeatmapProps) {
  // Generate last 90 days for the heatmap
  const today = new Date();
  const days: { date: Date, dateStr: string, val: number }[] = [];
  
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  // Create a map for fast lookup
  const dataMap = new Map(data.map(item => [item.date, item.value]));

  const getColorClass = (value: number | undefined) => {
    if (!value) return 'bg-white/5 border border-white/5';
    if (value === 1) return 'bg-accent-emerald/30 border border-accent-emerald/40';
    if (value === 2) return 'bg-accent-emerald/60 border border-accent-emerald/70';
    return 'bg-accent-emerald border border-accent-emerald/80 shadow-[0_0_8px_rgba(52,211,153,0.4)]';
  };

  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Aktivitas Habit</h3>
        <span className="text-xs text-text-muted">90 Hari Terakhir</span>
      </div>
      
      <div className="flex gap-[3px] overflow-hidden">
        {/* Divide into weeks */}
        {Array.from({ length: Math.ceil(days.length / 7) }).map((_, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-[3px]">
            {days.slice(colIndex * 7, (colIndex + 1) * 7).map((dateStr) => {
              const value = dataMap.get(dateStr);
              return (
                <div
                  key={dateStr}
                  title={`${dateStr}: ${value || 0} aktivitas`}
                  className={`w-3 h-3 rounded-[2px] transition-colors duration-200 ${getColorClass(value)} hover:ring-1 hover:ring-white/40 cursor-pointer`}
                />
              );
            })}
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-end gap-2 text-[10px] text-text-muted mt-1">
        <span>Sedikit</span>
        <div className="flex gap-[3px]">
          <div className="w-2.5 h-2.5 rounded-[2px] bg-white/5 border border-white/5" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-accent-emerald/30 border border-accent-emerald/40" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-accent-emerald/60 border border-accent-emerald/70" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-accent-emerald border border-accent-emerald/80" />
        </div>
        <span>Banyak</span>
      </div>
    </div>
  );
}
