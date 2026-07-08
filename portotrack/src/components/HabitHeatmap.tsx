import React from 'react';

interface HabitHeatmapProps {
  data: { date: string; value: number }[];
}

export default function HabitHeatmap({ data }: HabitHeatmapProps) {
  // Generate last 90 days for the heatmap
  const today = new Date();
  const days: string[] = [];
  
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  // Create a map for fast lookup
  const dataMap = new Map(data.map(item => [item.date, item.value]));

  const getColorClass = (value: number | undefined) => {
    if (!value) return 'bg-bg-secondary border-black';
    if (value === 1) return 'bg-accent-emerald/40 border-black';
    if (value === 2) return 'bg-accent-emerald/70 border-black';
    return 'bg-accent-emerald border-black';
  };

  return (
    <div className="brutalist-card p-6 flex flex-col gap-5 bg-white">
      <div className="flex items-center justify-between border-b-2 border-black pb-2">
        <h3 className="text-lg font-black uppercase text-black">Aktivitas Habit</h3>
        <span className="text-xs font-bold uppercase text-black border-2 border-black px-2 py-1 bg-accent-amber">90 Hari Terakhir</span>
      </div>
      
      <div className="flex gap-1 overflow-hidden p-2 border-2 border-black bg-bg-secondary shadow-[inset_2px_2px_0px_#000]">
        {/* Divide into weeks */}
        {Array.from({ length: Math.ceil(days.length / 7) }).map((_, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-1">
            {days.slice(colIndex * 7, (colIndex + 1) * 7).map((dateStr) => {
              const value = dataMap.get(dateStr);
              return (
                <div
                  key={dateStr}
                  title={`${dateStr}: ${value || 0} aktivitas`}
                  className={`w-3.5 h-3.5 border-2 transition-transform duration-200 ${getColorClass(value)} hover:scale-125 cursor-pointer z-10 hover:z-20`}
                />
              );
            })}
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-end gap-2 text-xs font-bold uppercase text-black mt-2">
        <span>Sedikit</span>
        <div className="flex gap-1">
          <div className="w-3.5 h-3.5 border-2 border-black bg-bg-secondary" />
          <div className="w-3.5 h-3.5 border-2 border-black bg-accent-emerald/40" />
          <div className="w-3.5 h-3.5 border-2 border-black bg-accent-emerald/70" />
          <div className="w-3.5 h-3.5 border-2 border-black bg-accent-emerald" />
        </div>
        <span>Banyak</span>
      </div>
    </div>
  );
}
