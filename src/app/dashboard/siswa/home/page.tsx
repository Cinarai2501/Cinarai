'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAllComicProgress } from '@/hooks/useAllComicProgress';
import { getAllComics } from '@/lib/comicRepository';
import { getAllUnlockStatuses } from '@/lib/unlockEngine';
import { SINTAKS } from '@/types/progress';

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000];
const LEVEL_NAMES = ['Pemula', 'Penjelajah', 'Petualang', 'Pahlawan', 'Legenda'];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
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
  const greeting = getGreeting();
  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Petualang';

  const comics = useMemo(() => getAllComics(), []);
  const unlockStatuses = useMemo(() => getAllUnlockStatuses(states), [states]);

  const { totalXp, completedComics, continueComic } = useMemo(() => {
    let totalCompleted = 0;
    let completedCount = 0;
    let nextComic = null;

    for (const comic of comics) {
      const progress = getProgress(comic.id);
      if (!progress) continue;
      totalCompleted += progress.completedCount;
      if (progress.isCompleted) completedCount += 1;
      if (!nextComic && unlockStatuses.get(comic.id) === 'UNLOCKED' && !progress.isCompleted) {
        nextComic = comic;
      }
    }

    const totalPossible = comics.filter((comic) => unlockStatuses.get(comic.id) !== 'COMING_SOON').length * SINTAKS.length;
    const overallPctValue = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
    const totalXpValue = totalCompleted * 15;

    return { totalXp: totalXpValue, completedComics: completedCount, continueComic: nextComic, overallPct: overallPctValue };
  }, [comics, getProgress, unlockStatuses]);

  const todayProgress = continueComic ? getProgress(continueComic.id) : undefined;
  const todayStages = todayProgress?.completedCount ?? 0;
  const todayPct = todayProgress?.percentage ?? 0;
  const levelInfo = getLevelInfo(totalXp);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      document.documentElement.style.scrollBehavior = 'smooth';
    }
  }, [isLoading]);

  const badgeItems = [
    {
      title: completedComics > 0 ? 'Komik pertama selesai' : 'Mulai petualanganmu',
      subtitle: completedComics > 0 ? 'Kamu sudah menyelesaikan setidaknya satu komik.' : 'Pilih komik untuk mulai belajar sekarang.',
    },
    {
      title: totalXp >= 100 ? 'Lebih dari 100 XP' : 'XP makin bertambah',
      subtitle: totalXp >= 100 ? 'Hebat! Terus kumpulkan XP.' : 'Setiap langkah belajar memberi XP.',
    },
    {
      title: continueComic ? 'Siap melanjutkan' : 'Belum ada komik aktif',
      subtitle: continueComic ? `Lanjutkan ${continueComic.title}.` : 'Buka halaman Komik untuk memilih materi.',
    },
  ];

  return (
    <div className="pb-28">
      <section className="rounded-[32px] bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-5 text-white shadow-lg shadow-primary-200/30">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-100/80">{greeting}</p>
            <h1 className="mt-3 text-3xl font-black leading-tight">Halo, {firstName}!</h1>
            <p className="mt-2 text-sm leading-relaxed text-primary-100/90">Ringkasan belajar hari ini. Lihat level, XP, dan kelanjutan materi kamu.</p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 text-3xl shadow-inner shadow-white/20">👋</div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[28px] bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary-100/80">Level</p>
            <p className="mt-3 text-3xl font-black text-white">{levelInfo.level}</p>
            <p className="mt-1 text-sm text-primary-100/80">{levelInfo.name}</p>
          </div>
          <div className="rounded-[28px] bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary-100/80">Progress XP</p>
            <p className="mt-3 text-3xl font-black text-white">{levelInfo.progress}%</p>
            <p className="mt-1 text-sm text-primary-100/80">Menuju {levelInfo.nextXp} XP</p>
          </div>
        </div>
      </section>

      <section className="mt-5 space-y-4 px-0">
        <div className="rounded-[32px] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-400">Continue Learning</p>
              <h2 className="mt-2 text-2xl font-black text-neutral-900">{continueComic ? continueComic.title : 'Belum ada komik aktif'}</h2>
            </div>
            <span className="rounded-3xl bg-primary-50 px-3 py-2 text-xs font-black text-primary-700">{todayPct}%</span>
          </div>

          <div className="mt-5 space-y-4 rounded-[28px] bg-neutral-50 p-4">
            <div className="flex items-center justify-between text-sm font-semibold text-neutral-700">
              <span>Progress Hari Ini</span>
              <span>{todayPct}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-neutral-200">
              <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-700" style={{ width: `${todayPct}%` }} />
            </div>
            <div className="flex items-center justify-between text-sm text-neutral-500">
              <span>{todayStages}/{SINTAKS.length} Tahap selesai</span>
              <Link href="/dashboard/siswa/komik" className="rounded-3xl bg-primary-600 px-4 py-2 text-xs font-black text-white transition hover:bg-primary-700">
                Lihat Detail
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="Total XP" value={`${totalXp}`} />
            <StatCard label="Level" value={levelInfo.name} />
            <StatCard label="Streak" value="— Hari" />
            <StatCard label="Komik selesai" value={`${completedComics}`} />
          </div>
        </div>

        <div className="rounded-[32px] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-400">Badge Terbaru</p>
              <h2 className="mt-2 text-xl font-black text-neutral-900">Pencapaian terbaru</h2>
            </div>
            <Link href="/dashboard/siswa/komik" className="text-sm font-black text-primary-600 hover:text-primary-700">
              Lihat Semua
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {badgeItems.map((badge) => (
              <div key={badge.title} className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4 shadow-sm">
                <p className="text-sm font-black text-neutral-900">{badge.title}</p>
                <p className="mt-2 text-sm text-neutral-500">{badge.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-neutral-50 p-4 text-center shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-400">{label}</p>
      <p className="mt-3 text-2xl font-black text-neutral-900">{value}</p>
    </div>
  );
}
