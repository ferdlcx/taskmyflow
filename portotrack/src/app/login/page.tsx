'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // If already logged in, redirect
    const token = localStorage.getItem('portotrack_token');
    if (token) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError('PIN MINIMAL 4 DIGIT');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('portotrack_token', data.token || 'authenticated');
        router.replace('/dashboard');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'PIN SALAH. COBA LAGI.');
        triggerShake();
        setPin('');
      }
    } catch {
      // TODO: Replace with real API — for now allow demo login
      localStorage.setItem('portotrack_token', 'demo_token');
      router.replace('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center overflow-hidden bg-bg-secondary p-4 font-sans">
      
      {/* Login Card */}
      <div className={`relative z-10 w-full max-w-sm mx-auto ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        
        {/* Form Card */}
        <form onSubmit={handleSubmit} className="brutalist-card p-6 md:p-8 bg-white flex flex-col items-center">
          
          {/* Logo Section */}
          <div className="w-16 h-16 border-2 border-black bg-accent-amber flex items-center justify-center shadow-[4px_4px_0px_#000] mb-6">
            <Layers className="w-10 h-10 text-black" strokeWidth={2.5} />
          </div>

          <div className="text-center mb-8 border-b-2 border-black pb-4 w-full">
            <h1 className="text-3xl font-black uppercase text-black mb-1 tracking-tight">PortoTrack</h1>
            <p className="text-black font-bold uppercase text-xs">
              PORTOFOLIO KRIPTO & FIAT
            </p>
          </div>

          <div className="text-center mb-6 w-full">
            <h2 className="text-lg font-black uppercase text-black mb-1">
              MASUKKAN PIN
            </h2>
          </div>

          {/* PIN Input */}
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setPin(val);
              setError('');
            }}
            placeholder="••••••"
            className="w-full brutalist-input bg-bg-secondary text-center text-4xl tracking-[0.5em] font-mono py-4 text-black placeholder:text-gray-400 mb-6 focus:bg-yellow-50 focus:placeholder:text-transparent"
            autoFocus
            autoComplete="off"
          />

          {/* Error */}
          {error && (
            <div className="bg-accent-rose text-white font-black uppercase text-xs text-center p-2 mb-6 w-full border-2 border-black shadow-[2px_2px_0px_#000]">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full py-4 border-2 border-black bg-accent-emerald text-black font-black uppercase tracking-widest shadow-[4px_4px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[2px_2px_0px_#000] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                VERIFYING...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                MASUK <ArrowRight className="w-5 h-5" strokeWidth={3} />
              </span>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-black font-bold uppercase text-xs mt-6">
          PORTOTRACK V0.1.0 — DATA LOKAL
        </p>
      </div>

      {/* Shake animation keyframe (inline for self-contained) */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
