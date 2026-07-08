'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';

// ─── Inline SVG Icons (Heroicons-style) ────────────────

function IconDashboard({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-colors duration-200 ${active ? 'stroke-accent-emerald' : 'stroke-text-secondary'}`}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconHoldings({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-colors duration-200 ${active ? 'stroke-accent-emerald' : 'stroke-text-secondary'}`}>
      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path d="M9 12h6" />
      <path d="M12 9v6" />
    </svg>
  );
}

function IconWatchlist({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-colors duration-200 ${active ? 'stroke-accent-emerald' : 'stroke-text-secondary'}`}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconSources({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-colors duration-200 ${active ? 'stroke-accent-emerald' : 'stroke-text-secondary'}`}>
      <path d="M4 7V4h16v3" />
      <path d="M9 20h6" />
      <path d="M12 4v16" />
      <rect x="2" y="7" width="20" height="6" rx="1.5" />
    </svg>
  );
}

function IconSettings({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-colors duration-200 ${active ? 'stroke-accent-emerald' : 'stroke-text-secondary'}`}>
      <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconDeadlines({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-colors duration-200 ${active ? 'stroke-accent-emerald' : 'stroke-text-secondary'}`}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

// ─── Navigation Items ──────────────────────────────────

const navItems = [
  { href: '/dashboard', label: 'Beranda', icon: IconDashboard },
  { href: '/deadlines', label: 'Tugas', icon: IconDeadlines },
  { href: '/holdings', label: 'Aset', icon: IconHoldings },
  { href: '/watchlist', label: 'Pantau', icon: IconWatchlist },
  { href: '/sources', label: 'Sumber', icon: IconSources },
  { href: '/settings', label: 'Setelan', icon: IconSettings },
];

// ─── Main Layout ───────────────────────────────────────

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <AuthGuard>
      <div className="flex h-dvh overflow-hidden">
        {/* ── Desktop Sidebar ─────────────────────── */}
        <aside className="hidden md:flex flex-col w-64 bg-bg-secondary/60 backdrop-blur-xl border-r border-border shrink-0">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6">
            <div className="w-9 h-9 rounded-lg gradient-emerald flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-lg font-bold gradient-text">PortoTrack</span>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                    ${active
                      ? 'bg-accent-emerald/10 text-accent-emerald'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                    }`}
                >
                  <Icon active={active} />
                  {item.label}
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-emerald" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="px-6 py-4 border-t border-border">
            <p className="text-[11px] text-text-muted">PortoTrack v0.1.0</p>
          </div>
        </aside>

        {/* ── Main Content ────────────────────────── */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0">
          <div className="bg-radial-glow pointer-events-none fixed inset-0 z-0" />
          <div className="relative z-10">
            {children}
          </div>
        </main>

        {/* ── Mobile Bottom Tab Bar ───────────────── */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-bg-secondary/80 backdrop-blur-xl border-t border-border pb-safe">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-200
                    ${active ? 'text-accent-emerald' : 'text-text-secondary'}`}
                >
                  <div className="relative">
                    <Icon active={active} />
                    {active && (
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-emerald" />
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </AuthGuard>
  );
}
