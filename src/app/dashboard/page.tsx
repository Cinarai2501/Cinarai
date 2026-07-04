'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAllComicProgress } from '@/hooks/useAllComicProgress';
import { getAllComics } from '@/lib/comicRepository';
import { getAllUnlockStatuses } from '@/lib/unlockEngine';
import { SINTAKS } from '@/types/progress';
import { useMemo } from 'react';

const LearningJourney = dynamic(() => import('@/components/dashboard/LearningJourney'), {
  ssr: false,
  loading: () => <JourneySkeleton />,
});

// ─── Static data ─────────────────────────────────────────────────────────────

const MOTIVATIONS = [
  'Hari ini kita siap menjelajah budaya Indonesia! 🗺️',
  'Yuk lanjutkan petualangan belajarmu! 🚀',
  'Setiap tantangan akan membuatmu semakin hebat! 💪',
  'Belajar sambil bermain itu menyenangkan! 🎉',
  'Kamu bisa menyelesaikan misi hari ini! ⭐',
  'Petualangan seru menantimu di setiap halaman! 📖',
  'Semakin banyak membaca, semakin banyak pengetahuan! 🧠',
];

const DAILY_QUOTES = [
  'Hari ini adalah kesempatan untuk belajar hal baru.',
  'Semakin banyak membaca, semakin banyak pengetahuan.',
  'Setiap langkah kecil membawamu lebih dekat ke tujuan.',
  'Belajar itu seperti petualangan — selalu ada hal baru!',
  'Kamu hebat karena mau terus belajar setiap hari.',
];

const MISSION_LABELS: Record<string, string> = {
  Cover:             '📖 Baca halaman cover',
  Contextualization: '📚 Baca komik',
  Identification:    '🔍 Identifikasi masalah',
  Navigation:        '🧭 Navigasi cerita',
  Argumentation:     '💬 Sampaikan pendapat',
  Resolution:        '💡 Temukan solusi',
  Application:       '🎯 Terapkan ilmu',
  Introspection:     '🪞 Refleksi diri',
};

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000];
const LEVEL_NAMES = ['Pemula', 'Penjelajah', 'Petualang', 'Pahlawan', 'Legenda'];

const comics = getAllComics();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat Pagi ☀️';
  if (h < 15) return 'Selamat Siang 🌤️';
  if (h < 18) return 'Selamat Sore 🌅';
  return 'Selamat Malam 🌙';
}

/** Stable pick per session — changes on hard refresh, not on re-render */
function stablePick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function getLevelInfo(xp: number): { level: number; name: string; nextXp: number; progress: number } {
  let level = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) { level = i; break; }
  }
  const currentThreshold = LEVEL_THRESHOLDS[level] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const progress = nextThreshold > currentThreshold
    ? Math.round(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    : 100;
  return { level: level + 1, name: LEVEL_NAMES[level] ?? 'Legenda', nextXp: nextThreshold, progress };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { states, getProgress, isLoading } = useAllComicProgress();
  const seedRef = useRef(Math.floor(Math.random() * 1000));

  const handleLogout = async () => {
    try { await logout(); } catch (e) { console.error('Logout error:', e); }
  };

  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Petualang';
  const greeting = getGreeting();
  const motivation = stablePick(MOTIVATIONS, seedRef.current);
  const dailyQuote = stablePick(DAILY_QUOTES, seedRef.current + 3);

  // ── Derived stats from real progress ──────────────────────────────────────
  const unlockStatuses = useMemo(() => getAllUnlockStatuses(states), [states]);

  const { totalCompleted, totalXp, completedComics, continueComic, overallPct } = useMemo(() => {
    let totalCompleted = 0;
    let completedComics = 0;
    let continueComic: (typeof comics)[0] | null = null;

    for (const comic of comics) {
      const p = getProgress(comic.id);
      if (!p) continue;
      totalCompleted += p.completedCount;
      if (p.isCompleted) completedComics++;
      if (!continueComic && unlockStatuses.get(comic.id) === 'UNLOCKED' && !p.isCompleted) {
        continueComic = comic;
      }
    }

    const totalPossible = comics.filter(c => c.availability === 'ACTIVE').length * SINTAKS.length;
    const overallPct = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
    const totalXp = totalCompleted * 15; // 15 XP per sintaks completed

    return { totalCompleted, totalXp, completedComics, continueComic, overallPct };
  }, [unlockStatuses, getProgress]);

  const levelInfo = getLevelInfo(totalXp);

  // ── Today's missions: derived from first active in-progress comic ──────────
  const todayMissions = useMemo(() => {
    const activeProg = continueComic ? getProgress(continueComic.id) : null;
    return SINTAKS.map((s) => ({
      sintaks: s,
      label: MISSION_LABELS[s] ?? s,
      done: (activeProg?.sintaksList.find(x => x.sintaks === s)?.status === 'COMPLETED') || false,
    }));
  }, [continueComic, getProgress]);

  const missionsDone = todayMissions.filter(m => m.done).length;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f0f7ff] overflow-x-hidden">

        {/* ══ HEADER WAVE ══════════════════════════════════════════════════ */}
        <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 pb-20 pt-safe overflow-hidden">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -left-8 bottom-4 h-40 w-40 rounded-full bg-secondary-400/20" />
          <div className="pointer-events-none absolute right-8 bottom-8 h-20 w-20 rounded-full bg-accent-400/20" />

          <div className="relative mx-auto max-w-lg px-4 pt-10 sm:px-6">
            {/* Top row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary-200">{greeting}</p>
                <h1 className="mt-0.5 text-2xl font-black text-white leading-tight truncate">
                  Halo, {firstName}! 👋
                </h1>
                <p className="mt-1 text-sm text-primary-100 leading-snug">{motivation}</p>
              </div>
              {/* Avatar */}
              <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl ring-4 ring-white/30 shadow-lg">
                    🧒
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-secondary-400 text-[10px] font-black text-white shadow ring-2 ring-white">
                    {levelInfo.level}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white hover:bg-white/25 transition-colors"
                >
                  Keluar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ══ MAIN CONTENT (floats over header) ═══════════════════════════ */}
        <div className="relative -mt-16 mx-auto max-w-lg px-4 pb-10 sm:px-6 space-y-4 stagger-children">

          {/* ── HERO CARD ─────────────────────────────────────────────── */}
          <div className="rounded-3xl bg-white shadow-md overflow-hidden animate-fade-in-up">
            {/* Level bar */}
            <div className="bg-gradient-to-r from-secondary-400 to-secondary-500 px-5 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <div>
                  <p className="text-[11px] font-semibold text-secondary-900/70 leading-none">Level {levelInfo.level}</p>
                  <p className="text-sm font-black text-white leading-tight">{levelInfo.name}</p>
                </div>
              </div>
              <div className="flex-1 max-w-[120px]">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-bold text-secondary-900/60">{totalXp} XP</span>
                  <span className="text-[10px] font-bold text-secondary-900/60">{levelInfo.nextXp} XP</span>
                </div>
                <div className="h-2 rounded-full bg-secondary-300/50 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-white transition-all duration-700"
                    style={{ width: `${levelInfo.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 divide-x divide-neutral-100 border-b border-neutral-100">
              <StatPill emoji="⭐" label="Total XP" value={`${totalXp}`} />
              <StatPill emoji="📚" label="Selesai" value={`${completedComics} Komik`} />
              <StatPill emoji="🔥" label="Streak" value="— Hari" />
            </div>

            {/* Overall progress */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-neutral-700">Progress Keseluruhan</p>
                <span className="text-sm font-black text-primary-600">{overallPct}%</span>
              </div>
              <div className="h-3 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-700"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-neutral-400">
                {totalCompleted} dari {comics.filter(c => c.availability === 'ACTIVE').length * SINTAKS.length} tahap selesai
              </p>
            </div>

            {/* Continue button */}
            {continueComic ? (
              <div className="px-5 pb-5">
                <Link
                  href={`/comic/${continueComic.id}/cover`}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 py-4 text-base font-black text-white shadow-sm hover:bg-primary-700 active:scale-[0.98] transition-all"
                >
                  <span className="text-xl">▶</span>
                  Lanjutkan Belajar
                  <span className="ml-auto text-xs font-semibold text-primary-200 truncate max-w-[120px]">
                    {continueComic.title.split(' ').slice(0, 3).join(' ')}…
                  </span>
                </Link>
              </div>
            ) : !isLoading ? (
              <div className="px-5 pb-5">
                <div className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent-500 px-5 py-4 text-base font-black text-white">
                  🎉 Semua komik selesai!
                </div>
              </div>
            ) : null}
          </div>

          {/* ── TODAY'S MISSIONS ──────────────────────────────────────── */}
          <div className="rounded-3xl bg-white shadow-md overflow-hidden animate-fade-in-up">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-neutral-100">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Misi Hari Ini</p>
                <h2 className="text-base font-black text-neutral-900">
                  {continueComic ? continueComic.title.split(' ').slice(0, 4).join(' ') : 'Pilih komik untuk mulai'}
                </h2>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5">
                <span className="text-sm font-black text-primary-700">{missionsDone}</span>
                <span className="text-xs text-primary-400">/</span>
                <span className="text-sm font-black text-primary-400">{todayMissions.length}</span>
              </div>
            </div>
            <ul className="px-5 py-3 space-y-2">
              {todayMissions.map((m) => (
                <li key={m.sintaks} className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs transition-colors ${
                      m.done
                        ? 'bg-accent-500 text-white'
                        : 'bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    {m.done ? '✓' : '○'}
                  </span>
                  <span className={`text-sm ${m.done ? 'text-neutral-400 line-through' : 'text-neutral-700 font-medium'}`}>
                    {m.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── LEARNING JOURNEY ──────────────────────────────────────── */}
          <LearningJourney />

          {/* ── ACHIEVEMENTS ──────────────────────────────────────────── */}
          <div className="rounded-3xl bg-white shadow-md overflow-hidden animate-fade-in-up">
            <div className="px-5 pt-4 pb-3 border-b border-neutral-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Pencapaian</p>
              <h2 className="text-base font-black text-neutral-900">Koleksi Lencana 🏅</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              <AchievementCard
                emoji="📚"
                label="Komik Selesai"
                value={`${completedComics}`}
                color="bg-primary-50"
                textColor="text-primary-700"
              />
              <AchievementCard
                emoji="⭐"
                label="Total XP"
                value={`${totalXp} XP`}
                color="bg-secondary-50"
                textColor="text-secondary-700"
              />
              <AchievementCard
                emoji="🏆"
                label="Level Saat Ini"
                value={levelInfo.name}
                color="bg-accent-50"
                textColor="text-accent-700"
              />
              <AchievementCard
                emoji="🔥"
                label="Streak Belajar"
                value="— Hari"
                color="bg-error-50"
                textColor="text-error-700"
              />
            </div>
          </div>

          {/* ── MOTIVATION QUOTE ──────────────────────────────────────── */}
          <div className="rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 px-5 py-5 shadow-md animate-fade-in-up">
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary-200 mb-2">
              💬 Kata Motivasi Hari Ini
            </p>
            <p className="text-base font-bold text-white leading-relaxed">
              &ldquo;{dailyQuote}&rdquo;
            </p>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-3 px-2">
      <span className="text-xl">{emoji}</span>
      <span className="text-sm font-black text-neutral-800 leading-tight">{value}</span>
      <span className="text-[10px] text-neutral-400 leading-tight text-center">{label}</span>
    </div>
  );
}

function AchievementCard({
  emoji, label, value, color, textColor,
}: {
  emoji: string; label: string; value: string; color: string; textColor: string;
}) {
  return (
    <div className={`rounded-2xl ${color} px-4 py-3 flex items-center gap-3`}>
      <span className="text-2xl flex-shrink-0">{emoji}</span>
      <div className="min-w-0">
        <p className={`text-sm font-black ${textColor} leading-tight truncate`}>{value}</p>
        <p className="text-[11px] text-neutral-500 leading-tight">{label}</p>
      </div>
    </div>
  );
}

function JourneySkeleton() {
  return (
    <div className="rounded-3xl bg-white shadow-md p-5 space-y-4">
      <div className="h-5 w-36 rounded-full bg-neutral-200 animate-pulse" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-36 rounded-2xl bg-neutral-100 animate-pulse" />
      ))}
    </div>
  );
}
