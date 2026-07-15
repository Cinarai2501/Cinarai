'use client';

import { useAuth } from '@/hooks/useAuth';

export function GuruHeader() {
  const { user, logout } = useAuth();
  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Guru';

  return (
    <header className="rounded-[28px] border border-white/60 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-4 text-white shadow-xl shadow-primary-900/20 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium tracking-wide text-primary-100">Selamat Datang,</p>
          <h1 className="mt-1 text-xl font-black leading-tight sm:text-2xl">{firstName}</h1>
          <p className="mt-1 text-sm text-primary-100">Dashboard Guru CINARAI</p>
        </div>
        <button
          type="button"
          onClick={() => void logout().catch(() => undefined)}
          className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-white/25"
        >
          Keluar
        </button>
      </div>
    </header>
  );
}
