'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { 
  LayoutDashboard, 
  Briefcase, 
  Eye, 
  Link2, 
  Settings, 
  CalendarCheck,
  Layers,
  Target
} from 'lucide-react';

// ─── Navigation Items ──────────────────────────────────

const navItems = [
  { href: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
  { href: '/deadlines', label: 'Tugas', icon: CalendarCheck },
  { href: '/holdings', label: 'Aset', icon: Briefcase },
  { href: '/watchlist', label: 'Pantau', icon: Eye },
  { href: '/sources', label: 'Sumber', icon: Link2 },
  { href: '/garapan', label: 'Garapan', icon: Target },
  { href: '/settings', label: 'Setelan', icon: Settings },
];

// ─── Main Layout ───────────────────────────────────────

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <AuthGuard>
      <div className="flex h-dvh overflow-hidden bg-bg-secondary font-sans text-text-primary">
        {/* ── Desktop Sidebar ─────────────────────── */}
        <aside className="hidden md:flex flex-col w-64 bg-bg-card border-r-2 border-black shrink-0">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b-2 border-black">
            <div className="w-10 h-10 border-2 border-black bg-accent-emerald flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <Layers className="w-6 h-6 text-black" />
            </div>
            <span className="text-xl font-black uppercase tracking-tight text-black">PortoTrack</span>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-none border-2 transition-all duration-200 font-bold
                    ${active
                      ? 'bg-accent-amber border-black shadow-[2px_2px_0px_#000] text-black translate-x-1'
                      : 'border-transparent text-text-secondary hover:border-black hover:bg-bg-secondary hover:text-black hover:shadow-[2px_2px_0px_#000]'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-black' : ''}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="px-6 py-4 border-t-2 border-black bg-bg-secondary">
            <p className="text-xs font-bold text-text-muted">PORTOTRACK V0.1.0</p>
          </div>
        </aside>

        {/* ── Main Content ────────────────────────── */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0 bg-bg-secondary">
          <div className="relative z-10 h-full p-4 md:p-8">
            {children}
          </div>
        </main>

        {/* ── Mobile Bottom Tab Bar ───────────────── */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-bg-card border-t-2 border-black pb-safe">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200
                    ${active ? 'text-black border-t-4 border-accent-amber pt-1' : 'text-text-secondary border-t-4 border-transparent pt-1'}`}
                >
                  <Icon className={`w-6 h-6 ${active ? 'text-black' : ''}`} />
                  <span className="text-[10px] font-bold uppercase">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </AuthGuard>
  );
}
