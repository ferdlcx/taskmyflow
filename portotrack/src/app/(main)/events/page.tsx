'use client';

import { useState, useEffect } from 'react';
import { Megaphone, ExternalLink, Calendar, RefreshCw } from 'lucide-react';

interface EventItem {
  title: string;
  url: string;
  date: string;
  source: 'Binance' | 'Bybit' | 'OKX';
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Binance' | 'Bybit' | 'OKX'>('All');

  // Load cache on mount
  useEffect(() => {
    const cached = localStorage.getItem('portotrack_cached_events');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEvents(parsed);
          setLoading(false); // Stop loading screen immediately, show cache
        }
      } catch (err) {
        console.error('Error parsing cached events:', err);
      }
    }
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    // Hanya tampilkan loading screen jika tidak ada data sama sekali (baik cache maupun state)
    const hasData = events.length > 0 || (localStorage.getItem('portotrack_cached_events') ? true : false);
    if (!hasData) {
      setLoading(true);
    }
    setError('');
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.success && data.data) {
        setEvents(data.data);
        localStorage.setItem('portotrack_cached_events', JSON.stringify(data.data));
      } else {
        setError(data.error || 'Gagal memuat event.');
      }
    } catch (e) {
      setError('Koneksi gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(e => {
    if (activeTab === 'All') return true;
    return e.source === activeTab;
  });

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'Binance': return 'bg-accent-amber text-black';
      case 'Bybit': return 'bg-accent-blue text-white';
      case 'OKX': return 'bg-black text-white';
      default: return 'bg-gray-100 text-black';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b-4 border-black pb-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            <Megaphone className="w-8 h-8" /> Event & Listing CEX
          </h1>
          <p className="text-text-muted font-bold mt-1 uppercase text-xs">
            Pengumuman & Garapan Baru Terkini dari Exchange Utama (Bebas Gimmick)
          </p>
        </div>
        <button 
          onClick={fetchEvents}
          disabled={loading}
          className="p-3 bg-white border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_#000] transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['All', 'Binance', 'Bybit', 'OKX'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 border-2 border-black font-black uppercase text-xs transition-all
              ${activeTab === tab ? 'bg-accent-amber shadow-[3px_3px_0px_#000] -translate-y-0.5' : 'bg-white hover:bg-gray-100'}`}
          >
            {tab === 'All' ? '📢 Semua CEX' : tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border-2 border-black shadow-[6px_6px_0px_#000]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-black" />
          <span className="font-black text-xs uppercase animate-pulse">Menghubungkan API Exchange...</span>
        </div>
      ) : error ? (
        <div className="p-8 border-2 border-black bg-accent-rose/20 text-center font-bold text-black shadow-[6px_6px_0px_#000]">
          {error}
          <button onClick={fetchEvents} className="block mx-auto mt-4 px-4 py-2 bg-white border-2 border-black font-black uppercase text-xs">Coba Lagi</button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 border-2 border-dashed border-black bg-white text-center font-black uppercase text-text-muted">
          Tidak ada pengumuman terbaru saat ini.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((evt, idx) => (
            <div 
              key={idx} 
              className="brutalist-card p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 hover:-translate-y-1 transition-transform"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 border-2 border-black text-[10px] font-black uppercase ${getSourceColor(evt.source)}`}>
                    {evt.source}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-text-muted">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(evt.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
                <h3 className="font-black text-black text-base md:text-lg leading-tight uppercase">
                  {evt.title}
                </h3>
              </div>
              
              <a 
                href={evt.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white font-black text-xs uppercase border-2 border-black hover:bg-white hover:text-black transition-colors"
              >
                Kunjungi Event <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
