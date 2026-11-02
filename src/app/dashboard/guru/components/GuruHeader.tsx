'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from './ui';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

export function GuruHeader() {
  const { user } = useAuth();
  const firstName = user?.displayName?.trim().split(/\s+/)[0] || 'Guru';

  return (
    <header className="border-b border-brand-100 bg-white px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-brand-700">{getGreeting()}</p>
          <h1 className="guru-page-title truncate">Halo, {firstName}!</h1>
          <p className="guru-meta mt-0.5">Dashboard Guru · CINARAI</p>
        </div>

        <Link
          href="/profile/edit"
          aria-label="Buka profil"
          title="Profil"
          className="rounded-full ring-2 ring-brand-100 transition hover:ring-brand-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
        >
          <Avatar name={firstName} src={user?.photoURL} className="h-11 w-11 text-lg" />
        </Link>
      </div>
    </header>
  );
}
