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
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-white/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)]">
      <svg viewBox="0 0 64 64" className="h-10 w-10" fill="none" aria-hidden="true">
        <circle cx="32" cy="32" r="26" fill="#FFFFFF" fillOpacity="0.94" />
        <circle cx="25" cy="28" r="3.4" fill="#1E3A5F" />
        <circle cx="39" cy="28" r="3.4" fill="#1E3A5F" />
        <path d="M22 41c2.5-4 7.2-6 10-6s7.5 2 10 6" stroke="#1E3A5F" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M15 20c2.2-8.5 10.7-14 17-14 8.2 0 14.5 5.8 16 14" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function StatIcon({ type }: { type: string }) {
  const iconClassName = 'h-6 w-6';
  switch (type) {
    case 'xp':
      return (
        <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" />
        </svg>
      );
    case 'level':
      return (
        <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="M12 5l7 7-7 7" />
        </svg>
      );
    case 'streak':
      return (
        <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 14c0-3.5 2.5-6 7-6 2.5 0 4.7 1.2 5.8 3.2" />
          <path d="M4 20c2.2-2.5 3.8-4 8-4 2.9 0 4.8 1 7 3" />
        </svg>
      );
    case 'comic':
      return (
        <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 8h8" />
          <path d="M8 12h8" />
          <path d="M8 16h5" />
        </svg>
      );
    default:
      return null;
  }
}

function BadgeIcon({ type }: { type: string }) {
  switch (type) {
    case 'progress':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="M12 5l7 7-7 7" />
        </svg>
      );
    case 'xp':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" />
        </svg>
      );
    case 'continue':
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7h16" />
          <path d="M7 12h10" />
          <path d="M10 17h4" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l2 2" />
        </svg>
      );
  }
}

export default function DashboardSiswaHomePage() {
  const { user } = useAuth();
  const { states, getProgress, isLoading } = useAllComicProgress();
  const greeting = getGreeting();
  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Petualang';

  const comics = useMemo(() => getAllComics(), []);
  const unlockStatuses = useMemo(() => getAllUnlockStatuses(states), [states]);

  const { totalXp, completedComics, continueComic, overallPct } = useMemo(() => {
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

  const statCards = [
    { label: 'Total XP', value: `${totalXp}`, accent: 'bg-amber-100 text-amber-700', type: 'xp' },
    { label: 'Level', value: levelInfo.name, accent: 'bg-sky-100 text-sky-700', type: 'level' },
    { label: 'Streak', value: '— Hari', accent: 'bg-rose-100 text-rose-700', type: 'streak' },
    { label: 'Komik selesai', value: `${completedComics}`, accent: 'bg-emerald-100 text-emerald-700', type: 'comic' },
  ];

  const badgeItems = [
    {
      type: 'progress',
      title: completedComics > 0 ? 'Komik pertama selesai' : 'Mulai petualanganmu',
      subtitle: completedComics > 0 ? 'Kamu sudah menyelesaikan setidaknya satu komik.' : 'Pilih komik untuk mulai belajar sekarang.',
      accent: 'bg-sky-100 text-sky-700',
    },
    {
      type: 'xp',
      title: totalXp >= 100 ? 'Lebih dari 100 XP' : 'XP makin bertambah',
      subtitle: totalXp >= 100 ? 'Hebat! Terus kumpulkan XP.' : 'Setiap langkah belajar memberi XP.',
      accent: 'bg-amber-100 text-amber-700',
    },
    {
      type: 'continue',
      title: continueComic ? 'Siap melanjutkan' : 'Belum ada komik aktif',
      subtitle: continueComic ? `Lanjutkan ${continueComic.title}.` : 'Buka halaman Komik untuk memilih materi.',
      accent: 'bg-violet-100 text-violet-700',
    },
    {
      type: 'default',
      title: overallPct >= 50 ? 'Progress kuat' : 'Ayo lanjutkan',
      subtitle: overallPct >= 50 ? 'Momentum belajarmu sudah baik.' : 'Satu langkah lagi untuk mempercepat progres.',
      accent: 'bg-emerald-100 text-emerald-700',
    },
  ];

  return (
    <div className="space-y-4 pb-24 pt-1">
      <section className="overflow-hidden rounded-[30px] bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-4 text-white shadow-[0_16px_32px_rgba(15,23,42,0.14)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-primary-100/80">{greeting}</p>
            <h1 className="mt-2 text-[24px] font-black leading-tight">Halo, {firstName}!</h1>
            <p className="mt-2 text-[13px] leading-5 text-primary-100/90">Lihat progres belajar, level, dan komik yang sedang kamu kerjakan di satu layar.</p>
          </div>
          <UserAvatar />
        </div>

        <div className="mt-4 rounded-[24px] border border-white/20 bg-white/12 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary-100/75">Level & XP</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-[30px] font-black leading-none">{levelInfo.level}</span>
                <span className="pb-1 text-[13px] font-semibold text-primary-100/80">{levelInfo.name}</span>
              </div>
            </div>
            <div className="rounded-[18px] bg-white/15 px-3 py-2 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary-100/75">XP</p>
              <p className="mt-1 text-[18px] font-black">{totalXp}</p>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] text-primary-100/80">
              <span>Progress menuju {levelInfo.nextXp} XP</span>
              <span>{levelInfo.progress}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white" style={{ width: `${levelInfo.progress}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-neutral-200 bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-400">Continue Learning</p>
            <h2 className="mt-1 text-[18px] font-black text-neutral-900">{continueComic ? continueComic.title : 'Belum ada komik aktif'}</h2>
          </div>
          <Link href="/dashboard/siswa/komik" className="text-[12px] font-black text-primary-600">
            Lihat Komik
          </Link>
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-[24px] border border-neutral-200 bg-neutral-50 p-3">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[18px] bg-neutral-200">
            {continueComic?.cover ? (
              <img src={continueComic.cover} alt={continueComic.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-neutral-400">
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="4" width="16" height="16" rx="3" />
                  <path d="M8 8h8" />
                  <path d="M8 12h8" />
                  <path d="M8 16h5" />
                </svg>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-primary-700">{continueComic ? 'Lanjutkan sekarang' : 'Belum ada progres'}</p>
            <p className="mt-1 text-[13px] font-semibold text-neutral-900">{continueComic ? continueComic.title : 'Pilih komik untuk memulai pembelajaran.'}</p>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-neutral-200">
              <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-700" style={{ width: `${todayPct}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
              <span>{todayStages}/{SINTAKS.length} tahap selesai</span>
              <span>{todayPct}%</span>
            </div>
          </div>

          <Link href="/dashboard/siswa/komik" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white shadow-[0_10px_20px_rgba(24,117,204,0.2)]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2.5">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-[24px] border border-neutral-200 bg-white p-3 shadow-[0_6px_16px_rgba(15,23,42,0.05)]">
            <div className={`inline-flex h-11 w-11 items-center justify-center rounded-[16px] ${stat.accent}`}>
              <StatIcon type={stat.type} />
            </div>
            <p className="mt-3 text-[22px] font-black text-neutral-900">{stat.value}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-400">{stat.label}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-400">Progress Belajar Hari Ini</p>
            <h3 className="mt-1 text-[18px] font-black text-neutral-900">Tahap yang sedang kamu kerjakan</h3>
          </div>
          <Link href="/dashboard/siswa/komik" className="rounded-full bg-primary-50 px-3 py-2 text-[11px] font-black text-primary-700">
            Lihat Detail Tahap
          </Link>
        </div>

        <div className="mt-3 rounded-[22px] border border-neutral-200 bg-neutral-50 p-3">
          <div className="flex items-center justify-between text-[12px] font-semibold text-neutral-700">
            <span>Persentase hari ini</span>
            <span className="text-primary-700">{todayPct}%</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-neutral-200">
            <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-700" style={{ width: `${todayPct}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[12px] text-neutral-500">
            <span>{todayStages}/{SINTAKS.length} tahap selesai</span>
            <span>{continueComic ? 'Lanjutkan sekarang' : 'Siap dimulai'}</span>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-400">Badge Terbaru</p>
            <h3 className="mt-1 text-[18px] font-black text-neutral-900">Progress terbaru kamu</h3>
          </div>
          <Link href="/dashboard/siswa/komik" className="text-[12px] font-black text-primary-600">
            Lihat Semua
          </Link>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {badgeItems.map((badge) => (
            <div key={badge.title} className="min-w-[220px] rounded-[22px] border border-neutral-200 bg-neutral-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-[14px] ${badge.accent}`}>
                  <BadgeIcon type={badge.type} />
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Baru</span>
              </div>
              <p className="mt-3 text-[13px] font-black text-neutral-900">{badge.title}</p>
              <p className="mt-1 text-[12px] leading-5 text-neutral-500">{badge.subtitle}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
