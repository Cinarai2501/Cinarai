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
    <div className="min-h-screen bg-[#F5F8FD] pb-[96px]">
      <div className="mx-auto flex max-w-[440px] flex-col gap-[10px] px-[16px] pb-[12px] pt-[10px]">
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1D93FF] via-[#2A7EFF] to-[#0F5FB5] px-[16px] pb-[16px] pt-[16px] text-white shadow-[0_20px_36px_rgba(15,23,42,0.16)]">
          <div className="flex items-start justify-between gap-[12px]">
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/90">{greeting}</p>
              <h1 className="mt-[6px] text-[24px] font-extrabold leading-[1.02] text-white">Halo, {firstName}!</h1>
              <p className="mt-[6px] text-[12px] leading-[18px] text-white/90">
                Lihat progres belajar, level, dan komik yang sedang kamu kerjakan di satu layar.
              </p>
            </div>
            <div className="relative z-10 shrink-0">
              <div className="rounded-full ring-[3px] ring-white/30">
                <Image src={avatarAsset} alt={`${firstName} avatar`} width={56} height={56} className="h-[56px] w-[56px] rounded-full object-cover" />
              </div>
            </div>
          </div>

          <div className="mt-[12px]">
            <div className="relative -translate-y-[10px]">
              <div className="rounded-[24px] border border-white/20 bg-white p-[12px] text-[#121827] shadow-[0_14px_28px_rgba(15,23,42,0.14)]">
                <div className="flex items-center gap-[12px]">
                  <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[12px] bg-[#EEF7FF]">
                    <Image src={getLevelIconAsset(levelInfo.level)} alt={`Level ${levelInfo.level}`} width={40} height={40} className="h-[40px] w-[40px] object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-[8px]">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9CA3AF]">Level</p>
                        <p className="mt-[2px] text-[20px] font-extrabold leading-none text-[#111827]">{levelInfo.level}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9CA3AF]">XP</p>
                        <p className="mt-[2px] text-[18px] font-extrabold text-[#111827]">{totalXp}</p>
                      </div>
                    </div>
                    <div className="mt-[6px] flex items-center justify-between text-[11px] text-[#6B7280]">
                      <span>{levelInfo.name}</span>
                      <span>{levelInfo.nextXp} XP</span>
                    </div>
                  </div>
                </div>

                <div className="mt-[12px]">
                  <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                    <span>Progress menuju level berikutnya</span>
                    <span>{levelInfo.progress}%</span>
                  </div>
                  <div className="mt-[6px] h-[8px] overflow-hidden rounded-full bg-[#EEF4FB]">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#1D93FF] to-[#0F5FB5]" style={{ width: `${levelInfo.progress}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-[#E5E7EB] bg-white p-[12px] shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-[8px]">
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#9CA3AF]">Continue Learning</p>
              <h2 className="mt-[2px] text-[15px] font-black text-[#111827]">{continueComic ? continueComic.title : 'Belum ada komik aktif'}</h2>
            </div>
            <Link href="/dashboard/siswa/komik" className="text-[11px] font-black text-[#1D93FF]">
              Lihat Komik
            </Link>
          </div>

          <div className="mt-[10px] flex items-center gap-[10px] rounded-[20px] border border-[#E5E7EB] bg-[#F6F9FE] p-[10px]">
            <div className="h-[80px] w-[80px] shrink-0 overflow-hidden rounded-[16px] bg-[#E5E7EB]">
              <Image src={getDashboardCoverAsset(continueComic?.id)} alt={continueComic ? continueComic.title : 'Cover komik'} width={80} height={80} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-[#1D93FF]">{continueComic ? 'Lanjutkan sekarang' : 'Belum ada progres'}</p>
              <p className="mt-[2px] text-[12px] font-semibold text-[#111827]">{continueComic ? continueComic.title : 'Pilih komik untuk memulai pembelajaran.'}</p>
              <div className="mt-[8px] h-[8px] overflow-hidden rounded-full bg-[#E8ECF2]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#1D93FF] to-[#0F5FB5]" style={{ width: `${todayPct}%` }} />
              </div>
              <div className="mt-[6px] flex items-center justify-between text-[10px] text-[#6B7280]">
                <span>{todayStages}/{SINTAKS.length} tahap selesai</span>
                <span>{todayPct}%</span>
              </div>
            </div>
            <Link href="/dashboard/siswa/komik" className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-[#1D93FF] text-white shadow-[0_8px_16px_rgba(24,117,204,0.2)]">
              <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-[8px]">
          {statCards.map((stat) => (
            <div key={stat.label} className={`rounded-[20px] border border-[#E5E7EB] p-[10px] shadow-[0_5px_12px_rgba(15,23,42,0.05)] ${stat.bg}`}>
              <div className="flex h-[40px] w-[40px] items-center justify-center rounded-[12px] bg-white/70">
                <Image src={getStatIconAsset(stat.type)} alt={stat.label} width={40} height={40} className="h-[40px] w-[40px] object-contain" />
              </div>
              <p className="mt-[8px] text-[18px] font-black text-[#111827]">{stat.value}</p>
              <p className="mt-[2px] text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6B7280]">{stat.label}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[24px] border border-[#E5E7EB] bg-white p-[12px] shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-[8px]">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#9CA3AF]">Progress Belajar Hari Ini</p>
              <h3 className="mt-[2px] text-[15px] font-black text-[#111827]">Tahap yang sedang kamu kerjakan</h3>
            </div>
            <Link href="/dashboard/siswa/komik" className="rounded-full bg-[#EEF7FF] px-[8px] py-[6px] text-[10px] font-black text-[#1D93FF]">
              Lihat Detail Tahap
            </Link>
          </div>

          <div className="mt-[10px] rounded-[20px] border border-[#E5E7EB] bg-[#F6F9FE] p-[10px]">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#4B5563]">
              <span>Persentase progres</span>
              <span className="text-[#1D93FF]">{todayPct}%</span>
            </div>
            <div className="mt-[6px] h-[8px] overflow-hidden rounded-full bg-[#E8ECF2]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#1D93FF] to-[#0F5FB5]" style={{ width: `${todayPct}%` }} />
            </div>
            <div className="mt-[6px] flex items-center justify-between text-[10px] text-[#6B7280]">
              <span>{todayStages}/{SINTAKS.length} tahap selesai</span>
              <span>{continueComic ? 'Lanjutkan sekarang' : 'Siap dimulai'}</span>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-[#E5E7EB] bg-white p-[12px] shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-[8px]">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#9CA3AF]">Badge Terbaru</p>
              <h3 className="mt-[2px] text-[15px] font-black text-[#111827]">Progress terbaru kamu</h3>
            </div>
            <Link href="/dashboard/siswa/komik" className="text-[11px] font-black text-[#1D93FF]">
              Lihat Semua
            </Link>
          </div>

          <div className="mt-[10px] flex gap-[8px] overflow-x-auto pb-[2px]">
            {badgeItems.map((badge) => (
              <div key={badge.title} className="min-w-[120px] shrink-0 rounded-[20px] border border-[#E5E7EB] bg-[#F6F9FE] p-[8px]">
                <div className="flex h-[64px] items-center justify-center overflow-hidden rounded-[16px] bg-white p-[6px]">
                  <Image src={badge.asset} alt={badge.title} width={64} height={64} className="h-full w-full object-contain" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
