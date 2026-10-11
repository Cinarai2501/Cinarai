'use client';

import { useAuth } from '@/hooks/useAuth';
import type { DashboardSummary } from '../types';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat Pagi ☀️';
  if (h < 15) return 'Selamat Siang 🌤️';
  if (h < 18) return 'Selamat Sore 🌅';
  return 'Selamat Malam 🌙';
}

interface Props {
  summary: DashboardSummary;
  loading: boolean;
  onLogout: () => void;
}

export function GuruHeader({ summary, loading, onLogout }: Props) {
  const { user } = useAuth();
  const firstName = user?.displayName?.split(' ')[0] ?? 'Guru';

  return (
    <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 pb-24 pt-safe overflow-hidden">
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -left-8 bottom-0 h-48 w-48 rounded-full bg-secondary-400/20" />

      <div className="relative mx-auto max-w-5xl px-4 pt-10 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary-200">{getGreeting()}</p>
            <h1 className="mt-0.5 text-2xl font-black text-white leading-tight">
              Halo, {firstName}! 👋
            </h1>
            <p className="mt-1 text-sm text-primary-100">
              {user?.email ?? ''}
            </p>
            {user?.displayName && (
              <p className="mt-0.5 text-xs text-primary-200">Dashboard Guru · CINARAI</p>
            )}
          </div>

          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl ring-4 ring-white/30 shadow-lg">
              {user?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoURL} alt="avatar" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <span>👩‍🏫</span>
              )}
            </div>
            <button
              onClick={onLogout}
              className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white hover:bg-white/25 transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Stat pills */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-white/10 p-3 h-16 skeleton" />
            ))
          ) : (
            <>
              <StatPill label="Total Siswa" value={String(summary.totalStudents)} emoji="👥" />
              <StatPill label="Progres Berjalan" value={summary.progressDocuments ? String(summary.activeStudents) : '—'} emoji="📈" />
              <StatPill label="Total Komik" value={String(summary.totalComics)} emoji="📚" />
              <StatPill label="Siswa Tuntas" value={summary.progressDocuments ? String(summary.studentsCompleted) : '—'} emoji="✅" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <div className="rounded-xl bg-white/15 px-3 py-2.5 backdrop-blur-sm">
      <div className="flex items-center gap-1.5">
        <span className="text-base">{emoji}</span>
        <span className="text-lg font-black text-white">{value}</span>
      </div>
      <p className="mt-0.5 text-[11px] text-primary-200 leading-tight">{label}</p>
    </div>
  );
}
