'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const LearningJourney = dynamic(() => import('@/components/dashboard/LearningJourney'), {
  ssr: false,
  loading: () => <JourneySkeleton />,
});

export default function DashboardPage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Petualang';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-primary-500 to-primary-600">
        {/* ── Hero Header ─────────────────────────────────────── */}
        <header className="relative overflow-hidden px-4 pb-8 pt-12 sm:px-6">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -left-6 top-20 h-32 w-32 rounded-full bg-secondary-400/20" />

          <div className="relative mx-auto max-w-2xl">
            <div className="flex items-start justify-between gap-3">
              {/* Greeting */}
              <div>
                <p className="text-sm font-semibold text-primary-100">Halo, Petualang! 👋</p>
                <h1 className="mt-0.5 text-2xl font-bold text-white leading-tight">
                  {firstName}
                </h1>
                <p className="mt-1 text-sm text-primary-200">Siap belajar hari ini?</p>
              </div>

              {/* Avatar + logout */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl shadow-inner">
                  🧒
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25 transition-colors"
                >
                  Keluar
                </button>
              </div>
            </div>

            {/* XP + Badges strip */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              <StatCard emoji="⭐" label="XP Hari Ini" value="0 XP" color="bg-secondary-400" />
              <StatCard emoji="🏅" label="Lencana" value="0" color="bg-accent-500" />
              <StatCard emoji="🔥" label="Streak" value="0 Hari" color="bg-error-400" />
            </div>

            {/* Daily target */}
            <div className="mt-4 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  <div>
                    <p className="text-xs font-semibold text-primary-100">Target Hari Ini</p>
                    <p className="text-sm font-bold text-white">Selesaikan 1 Komik</p>
                  </div>
                </div>
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white">
                  0 / 1
                </span>
              </div>
              <div className="mt-2.5 h-2 rounded-full bg-white/20">
                <div className="h-2 w-0 rounded-full bg-secondary-400 transition-all" />
              </div>
            </div>
          </div>
        </header>

        {/* ── Content ─────────────────────────────────────────── */}
        <main className="relative rounded-t-3xl bg-neutral-50 px-4 pb-10 pt-6 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <LearningJourney />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

function StatCard({
  emoji,
  label,
  value,
  color,
}: {
  emoji: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-white/15 px-2 py-3 text-center backdrop-blur-sm">
      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${color} text-lg shadow-sm`}>
        {emoji}
      </span>
      <span className="text-xs font-bold text-white leading-tight">{value}</span>
      <span className="text-[10px] text-primary-200 leading-tight">{label}</span>
    </div>
  );
}

function JourneySkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-40 rounded-full bg-neutral-200 animate-pulse" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="h-12 w-12 rounded-full bg-neutral-200 animate-pulse flex-shrink-0" />
          <div className="flex-1 h-28 rounded-2xl bg-neutral-200 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
