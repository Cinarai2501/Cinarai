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

function UserAvatar() {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-gradient-to-br from-white/35 via-white/20 to-white/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.35)]">
      <svg viewBox="0 0 64 64" className="h-10 w-10" fill="none" aria-hidden="true">
        <circle cx="32" cy="32" r="26" fill="#FFFFFF" fillOpacity="0.9" />
        <circle cx="25" cy="28" r="3.2" fill="#1E3A5F" />
        <circle cx="39" cy="28" r="3.2" fill="#1E3A5F" />
        <path d="M22 41c2.5-4 7.2-6 10-6s7.5 2 10 6" stroke="#1E3A5F" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M15 20c2.2-8.5 10.7-14 17-14 8.2 0 14.5 5.8 16 14" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function DashboardSiswaHomePage() {
  const { user } = useAuth();
  const { states, getProgress, isLoading } = useAllComicProgress();
  const greeting = getGreeting();
  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Petualang';

  const comics = useMemo(() => getAllComics(), []);
  const unlockStatuses = useMemo(() => getAllUnlockStatuses(states), [states]);

  const { totalXp, completedComics, continueComic, overallPct, totalCompletedStages, totalPossibleStages } = useMemo(() => {
    let totalCompleted = 0;
    let completedCount = 0;
    let nextComic = undefined as (typeof comics)[number] | undefined;

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

    return {
      totalXp: totalXpValue,
      completedComics: completedCount,
      continueComic: nextComic,
      overallPct: overallPctValue,
      totalCompletedStages: totalCompleted,
      totalPossibleStages: totalPossible,
    };
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
    {
      title: overallPct >= 50 ? 'Progress kuat' : 'Ayo lanjutkan',
      subtitle: overallPct >= 50 ? 'Momentum belajarmu sudah baik.' : 'Satu langkah lagi untuk mempercepat progres.',
    },
  ];

  const statCards = [
    { label: 'Total XP', value: `${totalXp}` },
    { label: 'Level', value: levelInfo.name },
    { label: 'Streak', value: '— Hari' },
    { label: 'Komik selesai', value: `${completedComics}` },
  ];

  return (
    <div className="pb-24">
      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-4 text-white shadow-[0_12px_24px_rgba(15,23,42,0.12)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary-100/80">{greeting}</p>
            <h1 className="mt-2 text-[24px] font-black leading-tight">Halo, {firstName}!</h1>
            <p className="mt-2 text-[13px] leading-5 text-primary-100/90">Ringkasan belajar hari ini. Pantau level, XP, dan kelanjutan pembelajaranmu dari satu layar.</p>
          </div>
          <UserAvatar />
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <div className="rounded-[20px] border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary-100/80">Level</p>
                <p className="mt-2 text-[22px] font-black text-white">{levelInfo.level}</p>
                <p className="mt-1 text-[12px] text-primary-100/80">{levelInfo.name}</p>
              </div>
              <div className="rounded-2xl bg-white/15 p-2.5">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary-100/80">Progress XP</p>
                <p className="mt-2 text-[22px] font-black text-white">{levelInfo.progress}%</p>
                <p className="mt-1 text-[12px] text-primary-100/80">Menuju {levelInfo.nextXp} XP</p>
              </div>
              <div className="rounded-2xl bg-white/15 p-2.5">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 space-y-3">
        <div className="rounded-[24px] bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-400">Continue Learning</p>
              <h2 className="mt-1.5 text-[18px] font-black text-neutral-900">{continueComic ? continueComic.title : 'Belum ada komik aktif'}</h2>
            </div>
            <Link href="/dashboard/siswa/komik" className="rounded-full bg-primary-50 px-3 py-2 text-[11px] font-black text-primary-700">
              Lanjutkan Belajar
            </Link>
          </div>

          <div className="mt-4 rounded-[20px] border border-neutral-200 bg-neutral-50 p-3">
            <div className="flex items-center justify-between text-[12px] font-semibold text-neutral-700">
              <span>Progress hari ini</span>
              <span>{todayPct}%</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-neutral-200">
              <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-700" style={{ width: `${todayPct}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-[12px] text-neutral-500">
              <span>{todayStages}/{SINTAKS.length} tahap selesai</span>
              <span className="text-primary-600">{continueComic ? 'Lanjutkan sekarang' : 'Siap dimulai'}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {statCards.map((stat) => (
            <div key={stat.label} className="min-h-[96px] rounded-[20px] border border-neutral-200 bg-white p-3 shadow-[0_6px_16px_rgba(15,23,42,0.05)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-400">{stat.label}</p>
              <p className="mt-2 text-[22px] font-black text-neutral-900">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[24px] bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-400">Progress Belajar</p>
              <h2 className="mt-1.5 text-[18px] font-black text-neutral-900">Progres keseluruhan</h2>
            </div>
            <Link href="/dashboard/siswa/komik" className="text-[12px] font-black text-primary-600">
              Lihat Semua
            </Link>
          </div>

          <div className="mt-3 rounded-[20px] border border-neutral-200 bg-neutral-50 p-3">
            <div className="flex items-center justify-between text-[12px] font-semibold text-neutral-700">
              <span>Persentase selesai</span>
              <span className="text-primary-700">{overallPct}%</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-neutral-200">
              <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-700" style={{ width: `${overallPct}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-[12px] text-neutral-500">
              <span>{totalCompletedStages}/{totalPossibleStages} tahapan selesai</span>
              <span>{completedComics} komik selesai</span>
            </div>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {badgeItems.map((badge) => (
              <div key={badge.title} className="min-w-[200px] rounded-[20px] border border-neutral-200 bg-neutral-50 p-3 shadow-sm">
                <p className="text-[13px] font-black text-neutral-900">{badge.title}</p>
                <p className="mt-1.5 text-[12px] leading-5 text-neutral-500">{badge.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
