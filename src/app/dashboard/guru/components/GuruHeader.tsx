'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import type { DashboardSummary } from '../types';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

interface Props {
  summary: DashboardSummary;
  loading: boolean;
}

export function GuruHeader({ summary, loading }: Props) {
  const { user } = useAuth();
  const firstName = user?.displayName?.trim().split(/\s+/)[0] || 'Guru';

  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 px-4 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))] text-white sm:px-6">
      <div className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full bg-white/10" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-20 -left-12 h-40 w-40 rounded-full bg-secondary-400/20" aria-hidden="true" />

      <div className="relative mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-primary-100">{getGreeting()}</p>
            <h1 className="truncate text-xl font-black leading-tight sm:text-2xl">Halo, {firstName}!</h1>
            <p className="mt-0.5 max-w-[250px] truncate text-xs text-primary-100 sm:max-w-none">
              {user?.email || 'Dashboard Guru · CINARAI'}
            </p>
          </div>

          <Link
            href="/profile/edit"
            aria-label="Buka profil"
            title="Profil"
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 text-xl ring-2 ring-white/50 transition hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {user?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
            ) : (
              <span aria-hidden="true">👩‍🏫</span>
            )}
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[68px] animate-pulse rounded-xl bg-white/15" aria-label="Memuat statistik" />
            ))
          ) : (
            <>
              <StatPill label="Total siswa" value={String(summary.totalStudents)} emoji="👥" />
              <StatPill label="Sedang belajar" value={String(summary.activeStudents)} emoji="📈" />
              <StatPill label="Total komik" value={String(summary.totalComics)} emoji="📚" />
              <StatPill label="Target tercapai" value={summary.progressDocuments ? String(summary.studentsCompleted) : '—'} emoji="✅" />
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function StatPill({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <div className="min-h-[68px] rounded-xl border border-white/10 bg-white/15 px-3 py-2 backdrop-blur-sm">
      <div className="flex items-center gap-1.5">
        <span className="text-sm" aria-hidden="true">{emoji}</span>
        <span className="text-lg font-black leading-none">{value}</span>
      </div>
      <p className="mt-1 text-[11px] font-medium leading-tight text-primary-100">{label}</p>
    </div>
  );
}
