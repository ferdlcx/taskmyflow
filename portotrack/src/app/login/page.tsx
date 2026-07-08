'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
      setError('PIN minimal 4 digit');
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
        setError(data.message || 'PIN salah. Coba lagi.');
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

  // Render PIN dots
  const renderDots = () => {
    const dots = [];
    for (let i = 0; i < 6; i++) {
      dots.push(
        <div
          key={i}
          className={`w-3 h-3 rounded-full transition-all duration-200 ${
            i < pin.length
              ? 'bg-accent-emerald scale-110 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
              : 'bg-white/10'
          }`}
        />
      );
    }
    return dots;
  };

  return (
    <div className="relative min-h-dvh flex items-center justify-center overflow-hidden bg-bg-primary">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40" />
      <div className="absolute inset-0 bg-radial-glow" />

      {/* Floating Orbs */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-accent-emerald/5 blur-[100px] animate-float" />
      <div
        className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-accent-teal/5 blur-[120px] animate-float"
        style={{ animationDelay: '1.5s' }}
      />

      {/* Login Card */}
      <div className={`relative z-10 w-full max-w-sm mx-4 animate-fade-in-up ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        {/* Logo Section */}
        <div className="text-center mb-10">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-emerald mb-6 animate-pulse-glow shadow-lg shadow-accent-emerald/20">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>

          <h1 className="text-4xl font-bold gradient-text mb-2">PortoTrack</h1>
          <p className="text-text-secondary text-sm">
            Portofolio kripto & fiat pribadi
          </p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="glass-card p-8">
          <div className="text-center mb-8">
            <h2 className="text-lg font-semibold text-text-primary mb-1">
              Masukkan PIN
            </h2>
            <p className="text-text-muted text-xs">
              Ketik 4–6 digit PIN untuk masuk
            </p>
          </div>

          {/* PIN Dots */}
          <div className="flex justify-center gap-3 mb-6">
            {renderDots()}
          </div>

          {/* Hidden PIN Input */}
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
            className="sr-only"
            autoFocus
            autoComplete="off"
          />

          {/* Tap area to focus input */}
          <button
            type="button"
            onClick={() => inputRef.current?.focus()}
            className="w-full text-center text-text-muted text-xs mb-6 py-2 focus:outline-none"
          >
            Ketuk di sini untuk mengetik
          </button>

          {/* Error */}
          {error && (
            <div className="text-accent-rose text-sm text-center mb-4 animate-fade-in">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-300
              gradient-emerald hover:shadow-lg hover:shadow-accent-emerald/25
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none
              active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Memverifikasi...
              </span>
            ) : (
              'Masuk'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-text-muted text-[11px] mt-8">
          PortoTrack v0.1.0 — Data tersimpan lokal
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
