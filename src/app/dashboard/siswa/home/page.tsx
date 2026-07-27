'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAllComicProgress } from '@/hooks/useAllComicProgress';
import { getAllComics } from '@/lib/comicRepository';
import { getAllUnlockStatuses } from '@/lib/unlockEngine';
import MotivationPopup, { getRandomMotivation } from '@/components/dashboard/MotivationPopup';
import { SINTAKS } from '@/types/progress';

const MOTIVATIONS = [
  'Hari ini kita siap menjelajah budaya Indonesia! 🗺️',
  'Yuk lanjutkan petualangan belajarmu! 🚀',
  'Setiap tantangan akan membuatmu semakin hebat! 💪',
  'Belajar sambil bermain itu menyenangkan! 🎉',
  'Kamu bisa menyelesaikan misi hari ini! ⭐',
];

const MISSION_LABELS: Record<string, string> = {
  Cover: '📖 Baca halaman cover',
  Contextualization: '📚 Baca komik',
  Identification: '🔍 Identifikasi masalah',
  Navigation: '🧭 Navigasi cerita',
  Argumentation: '💬 Sampaikan pendapat',
  Resolution: '💡 Temukan solusi',
  Application: '🎯 Terapkan ilmu',
  Introspection: '🪞 Refleksi diri',
};

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000];
const LEVEL_NAMES = ['Pemula', 'Penjelajah', 'Petualang', 'Pahlawan', 'Legenda'];
const MOTIVATION_SESSION_KEY = 'cinarai:motivation-popup-shown';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat Pagi ☀️';
  if (h < 15) return 'Selamat Siang 🌤️';
  if (h < 18) return 'Selamat Sore 🌅';
  return 'Selamat Malam 🌙';
}

function getLevelInfo(xp: number) {
  let level = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i -= 1) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i;
      break;
    }
  }

  const currentThreshold = LEVEL_THRESHOLDS[level] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const progress = nextThreshold > currentThreshold ? Math.round(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100) : 100;

  return { level: level + 1, name: LEVEL_NAMES[level] ?? 'Legenda', nextXp: nextThreshold, progress };
}

export default function DashboardSiswaHomePage() {
  const { user } = useAuth();
  const { states, getProgress, isLoading } = useAllComicProgress();
  const seedRef = useRef(Math.floor(Math.random() * MOTIVATIONS.length));
  const [isMotivationOpen, setIsMotivationOpen] = useState(false);
  const [motivationMessage, setMotivationMessage] = useState(() => getRandomMotivation());

  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Petualang';
  const greeting = getGreeting();
  const motivation = MOTIVATIONS[seedRef.current];

  const unlockStatuses = useMemo(() => getAllUnlockStatuses(states), [states]);
  const comics = useMemo(() => getAllComics(), []);

  const { totalXp, completedComics, continueComic, overallPct } = useMemo(() => {
    let totalCompleted = 0;
    let completedComics = 0;
    let continueComic = null;

    for (const comic of comics) {
      const p = getProgress(comic.id);
      if (!p) continue;
      totalCompleted += p.completedCount;
      if (p.isCompleted) completedComics += 1;
      if (!continueComic && unlockStatuses.get(comic.id) === 'UNLOCKED' && !p.isCompleted) {
        continueComic = comic;
      }
    }

    const totalPossible = comics.filter((comic) => unlockStatuses.get(comic.id) !== 'COMING_SOON').length * SINTAKS.length;
    const overallPct = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
    const totalXp = totalCompleted * 15;

    return { totalXp, completedComics, continueComic, overallPct };
  }, [comics, getProgress, unlockStatuses]);

  const levelInfo = getLevelInfo(totalXp);
  const todayMissions = useMemo(() => {
    const activeProg = continueComic ? getProgress(continueComic.id) : null;
    return SINTAKS.map((s) => ({
      sintaks: s,
      label: MISSION_LABELS[s] ?? s,
      done: activeProg?.sintaksList.some((x) => x.sintaks === s && x.status === 'COMPLETED') ?? false,
    }));
  }, [continueComic, getProgress]);

  const missionsDone = todayMissions.filter((m) => m.done).length;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const alreadyShown = sessionStorage.getItem(MOTIVATION_SESSION_KEY) === 'true';
    if (!isLoading && !alreadyShown) {
      sessionStorage.setItem(MOTIVATION_SESSION_KEY, 'true');
      setMotivationMessage(getRandomMotivation());
      setIsMotivationOpen(true);
    }
  }, [isLoading]);

  return (
    <div className="pb-16">
      <MotivationPopup
        open={isMotivationOpen}
        motivation={motivationMessage}
        onClose={() => setIsMotivationOpen(false)}
        onShuffle={() => setMotivationMessage(getRandomMotivation())}
      />

      <section className="mb-4 rounded-[28px] bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-5 text-white shadow-lg shadow-primary-200/50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-100">{greeting}</p>
            <h1 className="mt-2 text-3xl font-black leading-tight">Halo, {firstName}!</h1>
            <p className="mt-2 text-sm leading-relaxed text-primary-100/90">{motivation}</p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 text-3xl shadow-inner shadow-white/20">
            🧒
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <MetricCard label="Level" value={`#${levelInfo.level}`} description={levelInfo.name} />
          <MetricCard label="Progress" value={`${overallPct}%`} description="Perjalanan belajar" />
        </div>
      </section>

      <section className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatPill emoji="⭐" label="Total XP" value={`${totalXp}`} />
          <StatPill emoji="📚" label="Komik selesai" value={`${completedComics}`} />
          <StatPill emoji="🔥" label="Streak" value="— Hari" />
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-400">Misi hari ini</p>
              <p className="mt-1 text-lg font-black text-neutral-900">{continueComic ? continueComic.title : 'Pilih komik untuk mulai'}</p>
            </div>
            <div className="rounded-3xl bg-primary-50 px-3 py-2 text-xs font-black text-primary-700">{missionsDone}/{todayMissions.length}</div>
          </div>

          <div className="mt-4 grid gap-2">
            {todayMissions.map((mission) => (
              <div key={mission.sintaks} className="flex items-center justify-between rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                <span className={`text-sm font-semibold ${mission.done ? 'text-neutral-400 line-through' : 'text-neutral-700'}`}>
                  {mission.label}
                </span>
                <span className={`h-7 min-w-[2rem] rounded-full px-2 text-center text-xs font-black ${mission.done ? 'bg-primary-600 text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                  {mission.done ? '✓' : '○'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-400">Rangkuman</p>
              <p className="mt-1 text-lg font-black text-neutral-900">Pusat progresmu</p>
            </div>
            <div className="rounded-3xl bg-secondary-50 px-3 py-2 text-xs font-black text-secondary-700">{comics.length} Komik</div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <SummaryCard title="Komik selesai" value={`${completedComics}`} />
            <SummaryCard title="Total XP" value={`${totalXp} XP`} />
            <SummaryCard title="Level" value={`${levelInfo.name}`} />
            <SummaryCard title="Progress keseluruhan" value={`${overallPct}%`} />
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <h2 className="text-base font-black text-neutral-900">Akses cepat</h2>
          <div className="mt-4 grid gap-3">
            <Link href="/dashboard/siswa/komik" className="rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-black text-neutral-900 transition hover:border-primary-300 hover:bg-primary-50">
              📖 Daftar Komik
            </Link>
            <Link href="/dashboard/siswa/ai-tutor" className="rounded-3xl bg-primary-600 px-4 py-4 text-sm font-black text-white transition hover:bg-primary-700">
              💬 AI Tutor
            </Link>
            <Link href="/dashboard/siswa/kuis" className="rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-black text-neutral-900 transition hover:border-primary-300 hover:bg-primary-50">
              ✏️ Kuis
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-5 rounded-[28px] bg-white p-5 shadow-sm">
        <h2 className="text-base font-black text-neutral-900">Pencapaian</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <AchievementCard emoji="🏅" label="Komik selesai" value={`${completedComics}`} color="bg-primary-50" textColor="text-primary-700" />
          <AchievementCard emoji="🎯" label="Total XP" value={`${totalXp} XP`} color="bg-secondary-50" textColor="text-secondary-700" />
          <AchievementCard emoji="⭐" label="Level" value={levelInfo.name} color="bg-accent-50" textColor="text-accent-700" />
          <AchievementCard emoji="🔥" label="Streak" value="— Hari" color="bg-amber-50" textColor="text-amber-700" />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <div className="rounded-3xl bg-white/10 p-4 text-white ring-1 ring-white/20 backdrop-blur-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">{label}</p>
      <p className="mt-3 text-2xl font-black leading-tight">{value}</p>
      <p className="mt-2 text-sm text-white/80">{description}</p>
    </div>
  );
}

function StatPill({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-4 text-center shadow-sm">
      <div className="flex items-center justify-center gap-2 text-xl">{emoji}</div>
      <p className="mt-3 text-2xl font-black text-neutral-900">{value}</p>
      <p className="mt-1 text-sm text-neutral-500">{label}</p>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-400">{title}</p>
      <p className="mt-3 text-xl font-black text-neutral-900">{value}</p>
    </div>
  );
}

function AchievementCard({ emoji, label, value, color, textColor }: { emoji: string; label: string; value: string; color: string; textColor: string }) {
  return (
    <div className={`${color} rounded-3xl p-4 shadow-sm`}>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{emoji}</span>
        <div>
          <p className={`text-base font-black ${textColor}`}>{value}</p>
          <p className="text-sm text-neutral-600">{label}</p>
        </div>
      </div>
    </div>
  );
}
