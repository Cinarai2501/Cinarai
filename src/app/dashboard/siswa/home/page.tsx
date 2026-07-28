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
  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Petualang';
  const avatarAsset = getAvatarAsset(firstName);

  const comics = useMemo(() => getAllComics(), []);
  const unlockStatuses = useMemo(() => getAllUnlockStatuses(states), [states]);

  const { totalXp, completedComics, continueComic } = useMemo(() => {
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
    { label: 'Streak', value: '—', type: 'streak', bg: 'bg-[#ffefee]' },
    { label: 'Komik selesai', value: `${completedComics}`, type: 'comic', bg: 'bg-[#ecfdf3]' },
  ];

  const badgeItems = [
    {
      asset: '/assets/dashboard/home/badges/pembaca/badge-pembaca-pemula.png',
      title: 'Pembaca Pemula',
    },
    {
      asset: '/assets/dashboard/home/badges/pembaca/badge-pembaca-terampil.png',
      title: 'Penjelajah Candi',
    },
    {
      asset: '/assets/dashboard/home/badges/komik/badge-komik-3-pencari-bentuk.png',
      title: 'Pencari Bentuk',
    },
    {
      asset: '/assets/dashboard/home/badges/komik/badge-komik-5-master-cinarai.png',
      title: 'Pecinta Belajar',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F8FD] pb-[96px]">
      <div className="mx-auto flex w-full max-w-[440px] flex-col gap-[16px] px-[20px] pb-[12px] pt-[20px]">
        <section className="relative h-[320px] overflow-hidden rounded-[36px] bg-gradient-to-br from-[#1D93FF] via-[#2A7EFF] to-[#0F5FB5] px-[20px] pb-[24px] pt-[20px] text-white shadow-[0_28px_48px_rgba(15,23,42,0.18)]">
          <div className="flex items-start justify-between gap-[16px]">
            <div className="min-w-0">
              <h1 className="text-[28px] font-extrabold leading-[36px]">Halo, Siswa! 👋</h1>
              <p className="mt-[8px] text-[14px] font-normal leading-[20px] text-white/90">Semangat belajar hari ini!</p>
            </div>
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white/15">
              <Image src={avatarAsset} alt={`${firstName} avatar`} width={72} height={72} className="h-[72px] w-[72px] rounded-full object-cover" />
            </div>
          </div>

          <div className="mt-[16px] flex justify-center">
            <div className="h-[144px] w-full rounded-[30px] bg-white p-[16px] shadow-[0_18px_36px_rgba(15,23,42,0.16)]">
              <div className="flex items-center gap-[12px]">
                <div className="flex h-[48px] w-[48px] items-center justify-center rounded-[12px] bg-[#EEF7FF]">
                  <Image src={getLevelIconAsset(levelInfo.level)} alt={`Level ${levelInfo.level}`} width={48} height={48} className="h-[48px] w-[48px] object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-[12px]">
                    <div>
                      <p className="text-[14px] font-semibold text-[#111827]">Level {levelInfo.level} - {levelInfo.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] font-semibold text-[#2563EB]">{totalXp}</p>
                      <p className="text-[12px] font-medium text-[#6B7280]">/ {levelInfo.nextXp} XP</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-[16px] h-[12px] overflow-hidden rounded-full bg-[#EEF4FB]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#1D93FF] to-[#0F5FB5]" style={{ width: `${levelInfo.progress}%` }} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-[16px] h-[180px] w-full rounded-[28px] bg-[#F6F9FE] p-[16px] shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
          <div className="flex items-start gap-[12px]">
            <div className="h-[112px] w-[92px] overflow-hidden rounded-[20px] bg-[#E5E7EB]">
              <Image src={getDashboardCoverAsset(continueComic?.id)} alt={continueComic ? continueComic.title : 'Cover komik'} width={92} height={112} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-[10px]">
                <span className="rounded-full bg-[#E7F2FF] px-[10px] py-[4px] text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2563EB]">COMIC</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#6B7280]">Lanjutkan Belajar</span>
              </div>
              <h2 className="mt-[10px] text-[18px] font-black leading-[26px] text-[#111827]">{continueComic ? continueComic.title : 'Belum ada komik aktif'}</h2>
              <div className="mt-[16px] h-[12px] overflow-hidden rounded-full bg-[#E8ECF2]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#1D93FF] to-[#0F5FB5]" style={{ width: `${todayPct}%` }} />
              </div>
              <div className="mt-[10px] flex items-center justify-between text-[12px] font-medium text-[#6B7280]">
                <span>{todayPct}%</span>
                <span>{todayStages}/{SINTAKS.length} tahap selesai</span>
              </div>
            </div>
            <Link href="/dashboard/siswa/komik" className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#1D93FF] text-white shadow-[0_8px_16px_rgba(24,117,204,0.2)]">
              <svg viewBox="0 0 24 24" className="h-[24px] w-[24px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>

        <section className="mt-[16px] grid w-full grid-cols-2 gap-[12px]">
          {statCards.map((stat) => (
            <div key={stat.label} className={`rounded-[24px] p-[12px] shadow-[0_6px_16px_rgba(15,23,42,0.05)] ${stat.bg}`}>
              <div className="flex items-center gap-[12px]">
                <div className="flex h-[32px] w-[32px] items-center justify-center rounded-[12px] bg-white/80">
                  <Image src={getStatIconAsset(stat.type)} alt={stat.label} width={32} height={32} className="h-[32px] w-[32px] object-contain" />
                </div>
                <div>
                  <p className="text-[20px] font-bold text-[#111827]">{stat.value}</p>
                  <p className="mt-[4px] text-[12px] font-medium text-[#6B7280]">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-[16px] h-[160px] w-full rounded-[28px] bg-[#F6F9FE] p-[16px] shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2563EB]">Progress Belajar Hari Ini</p>
            <h3 className="mt-[6px] text-[16px] font-black text-[#111827]">Tahap yang sedang kamu kerjakan</h3>
          </div>
          <div className="mt-[16px] flex items-center justify-between">
            <p className="text-[24px] font-bold text-[#2563EB]">{todayPct}%</p>
            <p className="text-[12px] font-medium text-[#6B7280]">{todayStages}/{SINTAKS.length} tahap selesai</p>
          </div>
          <div className="mt-[12px] h-[12px] overflow-hidden rounded-full bg-[#E8ECF2]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#1D93FF] to-[#0F5FB5]" style={{ width: `${todayPct}%` }} />
          </div>
          <button type="button" className="mt-[16px] inline-flex w-full items-center justify-between rounded-[20px] bg-white px-[14px] py-[12px] text-[12px] font-semibold text-[#2563EB] shadow-[0_6px_16px_rgba(15,23,42,0.08)]">
            <span>Lihat Detail Tahap</span>
            <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </section>

        <section className="mt-[16px] h-[220px] w-full rounded-[28px] bg-[#F6F9FE] p-[16px] shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2563EB]">Badge Terbaru</p>
            <p className="text-[12px] font-semibold text-[#2563EB]">Lihat Semua</p>
          </div>
          <div className="mt-[16px] flex gap-[12px] overflow-x-auto pb-[4px]">
            {badgeItems.map((badge) => (
              <div key={badge.title} className="min-w-[144px] shrink-0 rounded-[20px] bg-white p-[10px] text-center">
                <div className="mx-auto h-[112px] w-[112px] overflow-hidden rounded-[16px] bg-[#F6F9FE] p-[10px]">
                  <Image src={badge.asset} alt={badge.title} width={112} height={112} className="h-[112px] w-[112px] object-contain" />
                </div>
                <p className="mt-[10px] text-[12px] font-semibold text-[#111827]">{badge.title}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
