'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('portotrack_token');
    if (!token) {
      router.replace('/login');
    } else {
      setIsAuthed(true);
    }
    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <div className="fixed inset-0 bg-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-accent-emerald border-t-transparent animate-spin" />
          <p className="text-text-secondary text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthed) return null;

  return <>{children}</>;
}
