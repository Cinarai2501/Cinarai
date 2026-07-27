'use client';

import Image from 'next/image';
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

function getDashboardCoverAsset(comicId?: number) {
  if (!comicId) return '/assets/dashboard/home/covers/cover-komik-1.png';
  return `/assets/dashboard/home/covers/cover-komik-${comicId}.png`;
}

function getAvatarAsset(firstName: string) {
  const normalized = firstName.toLowerCase();
  if (normalized.includes('ara') || normalized.includes('ani') || normalized.endsWith('a')) {
    return '/assets/dashboard/home/avatars/avatar-anak-perempuan.png';
  }
  return '/assets/dashboard/home/avatars/avatar-anak-laki-laki.png';
}

function getLevelIconAsset(level: number) {
  const safeLevel = Math.max(1, Math.min(level, 5));
  return `/assets/dashboard/home/levels/icon-level-${safeLevel}.png`;
}

function getStatIconAsset(type: string) {
  switch (type) {
    case 'xp':
      return '/assets/dashboard/home/statistics/icon-total-xp.png';
    case 'level':
      return '/assets/dashboard/home/levels/icon-level-3.png';
    case 'streak':
      return '/assets/dashboard/home/statistics/icon-streak.png';
    case 'comic':
      return '/assets/dashboard/home/statistics/icon-komik-selesai.png';
    default:
      return '/assets/dashboard/home/statistics/icon-total-xp.png';
  }
}

export default function DashboardSiswaHomePage() {
  const { user } = useAuth();
  const { states, getProgress, isLoading } = useAllComicProgress();
  const greeting = getGreeting();
  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Petualang';
  const avatarAsset = getAvatarAsset(firstName);

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
    { label: 'Total XP', value: `${totalXp}`, type: 'xp', bg: 'bg-[#fff6e7]' },
    { label: 'Level', value: levelInfo.name, type: 'level', bg: 'bg-[#eef7ff]' },
    { label: 'Streak', value: '— Hari', type: 'streak', bg: 'bg-[#ffeef3]' },
    { label: 'Komik selesai', value: `${completedComics}`, type: 'comic', bg: 'bg-[#ecfdf3]' },
  ];

  const badgeItems = [
    {
      asset: '/assets/dashboard/home/badges/pembaca/badge-pembaca-pemula.png',
      title: overallPct >= 50 ? 'Progress kuat' : 'Mulai petualanganmu',
    },
    {
      asset: '/assets/dashboard/home/badges/komik/badge-komik-1-pembaca-candi-jawi.png',
      title: 'Komik Candi Jawi',
    },
    {
      asset: '/assets/dashboard/home/badges/pembaca/badge-pembaca-terampil.png',
      title: 'Pembaca Terampil',
    },
    {
      asset: '/assets/dashboard/home/badges/komik/badge-komik-3-pencari-bentuk.png',
      title: 'Pencari Bentuk',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f8fd] pb-24">
      <div className="mx-auto max-w-[440px] px-3 pb-4 pt-3">
        <section className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#1d93ff] via-[#2a7eff] to-[#0f5fb5] pt-5 pb-6 px-5 text-white shadow-[0_28px_48px_rgba(15,23,42,0.18)]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-white/90">{greeting}</p>
              <h1 className="mt-2 text-[28px] font-extrabold leading-[1.03]">Halo, {firstName}!</h1>
              <p className="mt-2 text-[14px] leading-6 text-white/90">Lihat progres belajar, level, dan komik yang sedang kamu kerjakan di satu layar.</p>
            </div>
            <div className="relative z-10 shrink-0">
              <div className="rounded-full ring-4 ring-white/30">
                <Image src={avatarAsset} alt={`${firstName} avatar`} width={72} height={72} className="h-18 w-18 rounded-full object-cover" />
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="relative -translate-y-4">
              <div className="mx-auto max-w-full rounded-[30px] border border-white/22 bg-white p-4 text-[#121827] shadow-[0_18px_36px_rgba(15,23,42,0.16)]">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[16px] bg-[#eef7ff]">
                    <Image src={getLevelIconAsset(levelInfo.level)} alt={`Level ${levelInfo.level}`} width={48} height={48} className="h-12 w-12 object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-neutral-400">Level</p>
                        <p className="mt-1 text-[24px] font-extrabold leading-none text-neutral-900">{levelInfo.level}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-neutral-400">XP</p>
                        <p className="mt-1 text-[20px] font-extrabold text-neutral-900">{totalXp}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[12px] text-neutral-500">
                      <span>{levelInfo.name}</span>
                      <span>{levelInfo.nextXp} XP</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[12px] text-neutral-500">
                    <span>Progress menuju level berikutnya</span>
                    <span>{levelInfo.progress}%</span>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#eef4fb]">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#1d93ff] to-[#0f5fb5]" style={{ width: `${levelInfo.progress}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-3 rounded-[28px] border border-neutral-200 bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-400">Continue Learning</p>
              <h2 className="mt-1 text-[18px] font-black text-neutral-900">{continueComic ? continueComic.title : 'Belum ada komik aktif'}</h2>
            </div>
            <Link href="/dashboard/siswa/komik" className="text-[12px] font-black text-primary-600">
              Lihat Komik
            </Link>
          </div>

          <div className="mt-3 flex items-center gap-3 rounded-[24px] border border-neutral-200 bg-[#f6f9fe] p-3">
            <div className="h-[112px] w-[92px] shrink-0 overflow-hidden rounded-[20px] bg-neutral-200">
              <Image src={getDashboardCoverAsset(continueComic?.id)} alt={continueComic ? continueComic.title : 'Cover komik'} width={92} height={112} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-primary-700">{continueComic ? 'Lanjutkan sekarang' : 'Belum ada progres'}</p>
              <p className="mt-1 text-[13px] font-semibold text-neutral-900">{continueComic ? continueComic.title : 'Pilih komik untuk memulai pembelajaran.'}</p>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#e8ecf2]">
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

        <section className="mt-3 grid grid-cols-2 gap-2.5">
          {statCards.map((stat) => (
            <div key={stat.label} className={`rounded-[24px] border border-neutral-200 p-3 shadow-[0_6px_16px_rgba(15,23,42,0.05)] ${stat.bg}`}>
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-white/70">
                <Image src={getStatIconAsset(stat.type)} alt={stat.label} width={32} height={32} className="h-8 w-8 object-contain" />
              </div>
              <p className="mt-3 text-[22px] font-black text-neutral-900">{stat.value}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-500">{stat.label}</p>
            </div>
          ))}
        </section>

        <section className="mt-3 rounded-[28px] border border-neutral-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-400">Progress Belajar</p>
              <h3 className="mt-1 text-[18px] font-black text-neutral-900">Tahap yang sedang kamu kerjakan</h3>
            </div>
            <Link href="/dashboard/siswa/komik" className="rounded-full bg-primary-50 px-3 py-2 text-[11px] font-black text-primary-700">
              Lihat Detail Tahap
            </Link>
          </div>

          <div className="mt-3 rounded-[24px] border border-neutral-200 bg-[#f6f9fe] p-3">
            <div className="flex items-center justify-between text-[12px] font-semibold text-neutral-700">
              <span>Persentase progres</span>
              <span className="text-primary-700">{todayPct}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#e8ecf2]">
              <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-700" style={{ width: `${todayPct}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-[12px] text-neutral-500">
              <span>{todayStages}/{SINTAKS.length} tahap selesai</span>
              <span>{continueComic ? 'Lanjutkan sekarang' : 'Siap dimulai'}</span>
            </div>
          </div>
        </section>

        <section className="mt-3 rounded-[28px] border border-neutral-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
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
              <div key={badge.title} className="min-w-[152px] shrink-0 rounded-[24px] border border-neutral-200 bg-[#f6f9fe] p-2">
                <div className="flex h-24 items-center justify-center overflow-hidden rounded-[20px] bg-white p-2">
                  <Image src={badge.asset} alt={badge.title} width={112} height={112} className="h-full w-full object-contain" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
