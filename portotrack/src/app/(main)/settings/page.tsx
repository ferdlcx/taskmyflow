'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Save, LogOut, X } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();

  const [currency, setCurrency] = useState('IDR');
  const [kurs, setKurs] = useState('16100');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [reminderTime2, setReminderTime2] = useState('');
  const [showTelegramGuide, setShowTelegramGuide] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setCurrency(localStorage.getItem('portotrack_currency') || 'IDR');
    setKurs(localStorage.getItem('portotrack_kurs') || '16100');
    setTelegramEnabled(localStorage.getItem('portotrack_telegram_enabled') === 'true');
    setBotToken(localStorage.getItem('portotrack_telegram_token') || '');
    setChatId(localStorage.getItem('portotrack_telegram_chat_id') || '');
    setReminderTime(localStorage.getItem('portotrack_telegram_reminder_time') || '08:00');
    setReminderTime2(localStorage.getItem('portotrack_telegram_reminder_time_2') || '');
    setApiKey(localStorage.getItem('portotrack_gemini_key') || '');
  }, []);

  const handleSaveGeneral = () => {
    localStorage.setItem('portotrack_currency', currency);
    localStorage.setItem('portotrack_kurs', kurs);
    alert('Pengaturan umum disimpan!');
  };

  const handleSaveApi = () => {
    localStorage.setItem('portotrack_gemini_key', apiKey);
    alert('API Key disimpan secara lokal!');
  };

  const handleSaveTelegram = () => {
    localStorage.setItem('portotrack_telegram_token', botToken);
    localStorage.setItem('portotrack_telegram_chat_id', chatId);
    localStorage.setItem('portotrack_telegram_reminder_time', reminderTime);
    localStorage.setItem('portotrack_telegram_reminder_time_2', reminderTime2);
    alert('Kredensial Telegram disimpan!');
  };

  const handleTestTelegram = async () => {
    if (!botToken || !chatId) {
      alert('Isi Token & Chat ID terlebih dahulu!');
      return;
    }
    try {
      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const res = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '<b>Tes Koneksi PortoTrack</b>\nKoneksi bot Telegram Anda berhasil terhubung!',
          parse_mode: 'HTML'
        })
      });
      
      const data = await res.json();
      if (data.ok) {
        alert('Pesan tes terkirim! Silakan cek Telegram Anda.');
      } else {
        alert('Gagal mengirim pesan Telegram: ' + (data.description || 'Cek token atau Chat ID Anda.'));
      }
    } catch (e) {
      alert('Error: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('portotrack_token');
    router.replace('/login');
  };

  return (
    <div className="px-4 py-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b-4 border-black pb-4 mb-6">
        <h1 className="text-3xl font-black uppercase text-black">Setelan</h1>
        <p className="text-text-muted font-bold mt-1">Konfigurasi aplikasi & preferensi</p>
      </div>

      {/* ── Pengaturan Umum ─────────────────────── */}
      <div className="brutalist-card p-6 bg-white border-4 border-black shadow-[8px_8px_0px_#000]">
        <h3 className="text-xl font-black uppercase mb-4 border-b-2 border-dashed border-black pb-2">Pengaturan Umum</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold uppercase mb-2">Mata Uang Tampilan</label>
            <div className="flex gap-2">
              {['IDR', 'USD'].map((cur) => (
                <button
                  key={cur}
                  onClick={() => setCurrency(cur)}
                  className={`flex-1 py-3 border-2 border-black font-black uppercase transition-all
                    ${currency === cur ? 'bg-accent-amber shadow-[4px_4px_0px_#000] -translate-y-1' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  {cur === 'IDR' ? '🇮🇩 IDR (Rupiah)' : '🇺🇸 USD (Dollar)'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase mb-2">Kurs USD/IDR Manual</label>
            <div className="flex gap-0">
              <span className="p-3 bg-black text-white font-black uppercase">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={kurs}
                onChange={(e) => setKurs(e.target.value.replace(/\D/g, ''))}
                className="flex-1 brutalist-input p-3 bg-white"
              />
            </div>
          </div>

          <button onClick={handleSaveGeneral} className="w-full py-3 bg-accent-blue text-white font-black uppercase border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#000] transition-all flex items-center justify-center gap-2">
            <Save className="w-5 h-5" /> Simpan Pengaturan
          </button>
        </div>
      </div>

      {/* ── API Key Management ───────────────────── */}
      <div className="brutalist-card p-6 bg-white border-4 border-black shadow-[8px_8px_0px_#000]">
        <h3 className="text-xl font-black uppercase mb-4 border-b-2 border-dashed border-black pb-2">🔑 API Key (Gemini)</h3>
        <p className="text-sm font-bold text-text-muted mb-4">
          Digunakan untuk fitur Smart Import (AI Parsing). Data API Key hanya disimpan di browser Anda (localStorage).
        </p>
        <div className="space-y-4">
          <div className="flex gap-0 relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Masukkan Gemini API Key..."
              className="w-full brutalist-input p-3 pr-12 bg-white font-mono"
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 border-2 border-transparent hover:border-black transition-colors"
            >
              {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <button onClick={handleSaveApi} className="w-full py-3 bg-accent-emerald text-black font-black uppercase border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#000] transition-all flex items-center justify-center gap-2">
            <Save className="w-5 h-5" /> Simpan API Key
          </button>
        </div>
      </div>

      {/* ── Telegram Notification ────────────────── */}
      <div className="brutalist-card p-6 bg-white border-4 border-black shadow-[8px_8px_0px_#000]">
        <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-dashed border-black">
          <h3 className="text-xl font-black uppercase">📬 Bot Telegram</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTelegramGuide(true)}
              className="px-3 py-2 bg-white border-2 border-black font-bold text-xs uppercase hover:bg-gray-100 transition-colors"
            >
              Cara Setup?
            </button>
            <button
              onClick={() => {
                 const val = !telegramEnabled;
                 setTelegramEnabled(val);
                 localStorage.setItem('portotrack_telegram_enabled', String(val));
              }}
              className={`px-4 py-2 border-2 border-black font-black uppercase shadow-[2px_2px_0px_#000] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none transition-all
                ${telegramEnabled ? 'bg-accent-emerald text-black' : 'bg-gray-200'}`}
            >
              {telegramEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
        
        {telegramEnabled ? (
          <div className="space-y-4 animate-fade-in">
            <p className="text-sm font-bold text-text-muted">Masukkan kredensial Bot Telegram untuk menerima notifikasi limit harga.</p>
            
            <div>
              <label className="block text-xs font-black uppercase mb-1">Bot Token</label>
              <input 
                type="text" 
                placeholder="Contoh: 123456789:ABCdefGhI..." 
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="w-full brutalist-input p-3 bg-white font-mono text-sm" 
              />
            </div>
            
            <div>
              <label className="block text-xs font-black uppercase mb-1">Chat ID</label>
              <input 
                type="text" 
                placeholder="Contoh: 987654321" 
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                className="w-full brutalist-input p-3 bg-white font-mono text-sm" 
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase mb-1">Jam Pengingat Tugas Harian</label>
              <input 
                type="time" 
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full brutalist-input p-3 bg-white font-mono text-sm" 
              />
              <p className="text-[10px] font-bold text-text-muted mt-1 uppercase">Bot akan mengirimkan daftar garapan harian yang belum selesai pada jam ini.</p>
            </div>

            <div>
              <label className="block text-xs font-black uppercase mb-1">Jam Pengingat Ke-2 (Opsional)</label>
              <input 
                type="time" 
                value={reminderTime2}
                onChange={(e) => setReminderTime2(e.target.value)}
                className="w-full brutalist-input p-3 bg-white font-mono text-sm" 
              />
              <p className="text-[10px] font-bold text-text-muted mt-1 uppercase">Bot hanya akan mengirimkan pengingat kedua jika masih ada tugas harian yang belum selesai pada jam ini.</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={handleSaveTelegram} 
                className="flex-1 py-3 bg-accent-emerald text-black font-black uppercase border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#000] transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" /> Simpan Kredensial
              </button>
              <button 
                onClick={handleTestTelegram} 
                className="py-3 px-6 bg-accent-amber text-black font-black uppercase border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#000] transition-all"
              >
                Test Chat
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm font-bold text-text-muted">Aktifkan untuk mulai menerima notifikasi harga otomatis ke Telegram Anda.</p>
        )}
      </div>

      {/* TELEGRAM SETUP GUIDE MODAL */}
      {showTelegramGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="brutalist-card p-6 bg-white w-full max-w-md shadow-[8px_8px_0px_#000]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
              <h2 className="text-xl font-black uppercase text-black">Cara Setup Bot Telegram</h2>
              <button 
                onClick={() => setShowTelegramGuide(false)} 
                className="p-1 hover:bg-bg-secondary border-2 border-transparent hover:border-black transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4 text-sm font-medium leading-relaxed text-black max-h-[60vh] overflow-y-auto pr-2">
              <p>Ikuti langkah mudah berikut untuk mendapatkan Bot Token dan Chat ID Anda:</p>
              
              <ol className="list-decimal pl-5 space-y-3 font-bold">
                <li>
                  <span className="text-accent-purple">Buat Bot Baru:</span>
                  <p className="font-normal text-xs text-text-muted mt-0.5">
                    Buka Telegram, cari bot bernama <a href="https://t.me/BotFather" target="_blank" className="underline text-black font-black">@BotFather</a>. Kirim pesan <code className="bg-gray-100 p-0.5 border border-black font-mono">/newbot</code> dan ikuti instruksinya sampai Anda mendapatkan <b>HTTP API token (Bot Token)</b>.
                  </p>
                </li>
                <li>
                  <span className="text-accent-purple">Aktifkan Bot Anda:</span>
                  <p className="font-normal text-xs text-text-muted mt-0.5">
                    Buka chat dengan bot baru Anda yang baru saja dibuat, lalu klik <b>Start</b> atau kirim pesan apapun.
                  </p>
                </li>
                <li>
                  <span className="text-accent-purple">Dapatkan Chat ID Anda:</span>
                  <p className="font-normal text-xs text-text-muted mt-0.5">
                    Cari bot <a href="https://t.me/userinfobot" target="_blank" className="underline text-black font-black">@userinfobot</a> di Telegram. Klik <b>Start</b>. Bot tersebut akan langsung mengirimkan informasi akun Anda berupa angka unik, yaitu <b>Id / Chat ID</b> Anda.
                  </p>
                </li>
                <li>
                  <span className="text-accent-purple">Simpan dan Tes:</span>
                  <p className="font-normal text-xs text-text-muted mt-0.5">
                    Masukkan Bot Token dan Chat ID tersebut di kolom atas, lalu klik <b>Simpan</b> dan lakukan <b>Test Chat</b> untuk memastikan pesan tes masuk ke Telegram Anda.
                  </p>
                </li>
              </ol>
            </div>

            <button 
              onClick={() => setShowTelegramGuide(false)} 
              className="w-full mt-6 py-3 bg-black text-white font-black uppercase border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#000] transition-all"
            >
              Paham
            </button>
          </div>
        </div>
      )}

      {/* ── Logout ───────────────────────────────── */}
      <div className="brutalist-card p-6 bg-accent-rose text-white border-4 border-black shadow-[8px_8px_0px_#000]">
        {!showLogoutConfirm ? (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-4 bg-black text-white font-black uppercase border-2 border-black hover:bg-transparent hover:text-black transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" /> Keluar dari Aplikasi
          </button>
        ) : (
          <div className="animate-fade-in space-y-4">
            <h3 className="text-xl font-black uppercase text-center">Yakin ingin keluar?</h3>
            <div className="flex gap-2">
              <button onClick={handleLogout} className="flex-1 py-3 bg-black text-white font-black uppercase border-2 border-black hover:bg-white hover:text-black transition-colors">
                Ya, Keluar
              </button>
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 bg-white text-black font-black uppercase border-2 border-black hover:bg-gray-200 transition-colors">
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
