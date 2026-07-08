'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ─── Settings Page ─────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();

  // TODO: Load/save from Dexie / localStorage
  const [currency, setCurrency] = useState('IDR');
  const [kurs, setKurs] = useState('16100');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('portotrack_token');
    router.replace('/login');
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-xl font-bold text-text-primary">Setelan</h1>
        <p className="text-text-muted text-sm mt-0.5">Konfigurasi aplikasi</p>
      </div>

      {/* ── Display Currency ─────────────────────── */}
      <div className="brutalist-card-static p-5 space-y-4">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          💱 Mata Uang Tampilan
        </h3>

        <div className="flex gap-2">
          {['IDR', 'USD'].map((cur) => (
            <button
              key={cur}
              onClick={() => setCurrency(cur)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                ${currency === cur
                  ? 'gradient-emerald text-white shadow-lg shadow-accent-emerald/20'
                  : 'bg-white/5 text-text-secondary hover:bg-white/10'
                }`}
            >
              {cur === 'IDR' ? '🇮🇩 IDR (Rupiah)' : '🇺🇸 USD (Dollar)'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Kurs Setting ─────────────────────────── */}
      <div className="brutalist-card-static p-5 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          📊 Kurs USD/IDR
        </h3>
        <p className="text-xs text-text-muted">
          Kurs manual untuk konversi. Dipakai jika data kurs otomatis tidak tersedia.
        </p>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">Rp</span>
          <input
            type="text"
            inputMode="numeric"
            value={kurs}
            onChange={(e) => setKurs(e.target.value.replace(/\D/g, ''))}
            className="w-full pl-10 pr-4 py-2.5 brutalist-input text-sm text-text-primary"
          />
        </div>
        {/* TODO: Auto-fetch kurs from API */}
      </div>

      {/* ── Telegram Notification ────────────────── */}
      <div className="brutalist-card-static p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              📬 Notifikasi Telegram
            </h3>
            <p className="text-xs text-text-muted mt-1">
              Kirim notifikasi harga ke Telegram Bot
            </p>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={() => setTelegramEnabled(!telegramEnabled)}
            className={`relative w-12 h-7 rounded-full transition-colors duration-300 shrink-0
              ${telegramEnabled ? 'bg-accent-emerald' : 'bg-white/10'}`}
          >
            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-300
              ${telegramEnabled ? 'translate-x-5.5' : 'translate-x-0.5'}`}
            />
          </button>
        </div>

        {telegramEnabled && (
          <div className="mt-4 pt-4 border-t border-border animate-fade-in space-y-3">
            <input
              type="text"
              placeholder="Bot Token"
              className="w-full brutalist-input px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted"
            />
            <input
              type="text"
              placeholder="Chat ID"
              className="w-full brutalist-input px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted"
            />
            <button className="px-4 py-2 rounded-lg gradient-emerald text-white text-sm font-medium active:scale-95 transition-all">
              Test Kirim
            </button>
            {/* TODO: Implement Telegram integration */}
          </div>
        )}
      </div>

      {/* ── API Key Management ───────────────────── */}
      <div className="brutalist-card-static p-5 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          🔑 API Key (Gemini AI)
        </h3>
        <p className="text-xs text-text-muted">
          Untuk fitur Smart Import parsing otomatis. Data dikirim ke Google Gemini API.
        </p>
        <div className="relative">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Masukkan API Key..."
            className="w-full pr-12 brutalist-input px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted font-mono"
          />
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
          >
            {showApiKey ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            )}
          </button>
        </div>
        <button className="px-4 py-2 rounded-lg gradient-emerald text-white text-sm font-medium active:scale-95 transition-all">
          Simpan Key
        </button>
        {/* TODO: Save API key to secure storage */}
      </div>

      {/* ── About ────────────────────────────────── */}
      <div className="brutalist-card-static p-5 space-y-2">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          ℹ️ Tentang
        </h3>
        <div className="space-y-1.5 text-xs text-text-secondary">
          <p><span className="text-text-muted">Aplikasi:</span> PortoTrack v0.1.0</p>
          <p><span className="text-text-muted">Deskripsi:</span> Portfolio tracker kripto & fiat pribadi</p>
          <p><span className="text-text-muted">Data:</span> Tersimpan lokal di perangkat (IndexedDB)</p>
          <p><span className="text-text-muted">Lisensi:</span> Personal use</p>
        </div>
      </div>

      {/* ── Logout ───────────────────────────────── */}
      <div className="brutalist-card-static p-5">
        {!showLogoutConfirm ? (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-3 rounded-xl border border-accent-rose/30 text-accent-rose text-sm font-semibold
              hover:bg-accent-rose/10 transition-all duration-200 active:scale-[0.98]"
          >
            Keluar
          </button>
        ) : (
          <div className="animate-fade-in space-y-3">
            <p className="text-sm text-text-primary text-center">Yakin ingin keluar?</p>
            <div className="flex gap-2">
              <button
                onClick={handleLogout}
                className="flex-1 py-3 rounded-xl bg-accent-rose text-white text-sm font-semibold
                  hover:bg-accent-rose/90 active:scale-[0.98] transition-all"
              >
                Ya, Keluar
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-border text-text-secondary text-sm font-medium
                  hover:bg-white/5 transition-all"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom spacer */}
      <div className="h-8" />
    </div>
  );
}
