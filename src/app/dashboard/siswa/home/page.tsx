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
  const progress =
    nextThreshold > currentThreshold
      ? Math.round(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
      : 100;
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

    const totalPossible =
      comics.filter((comic) => unlockStatuses.get(comic.id) !== 'COMING_SOON').length * SINTAKS.length;
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
    {
      label: 'Total XP',
      value: `${totalXp}`,
      type: 'xp',
      bg: '#FEF3C7',
      border: '#FCD34D',
      iconBg: '#FEF9EC',
      valueColor: '#92400E',
      labelColor: '#B45309',
    },
    {
      label: 'Level',
      value: levelInfo.name,
      type: 'level',
      bg: '#DBEAFE',
      border: '#93C5FD',
      iconBg: '#EFF6FF',
      valueColor: '#1E40AF',
      labelColor: '#2563EB',
    },
    {
      label: 'Streak',
      value: '—',
      type: 'streak',
      bg: '#FFEDD5',
      border: '#FDBA74',
      iconBg: '#FFF7ED',
      valueColor: '#9A3412',
      labelColor: '#C2410C',
    },
    {
      label: 'Komik Selesai',
      value: `${completedComics}`,
      type: 'comic',
      bg: '#DCFCE7',
      border: '#86EFAC',
      iconBg: '#F0FDF4',
      valueColor: '#14532D',
      labelColor: '#15803D',
    },
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
    <div className="min-h-screen">
      <div className="flex w-full flex-col px-[16px] pb-[24px] pt-[20px]">

        {/* ── 1. HEADER ── spec: radius=36px, shadow=0 28px 48px rgba(15,23,42,0.18), padding=20px 20px 24px */}
        <section
          className="relative overflow-hidden rounded-[36px] px-[20px] pb-[44px] pt-[20px] text-white"
          style={{
            background: 'linear-gradient(135deg, #1D93FF 0%, #0A6FD4 60%, #0F5FB5 100%)',
            boxShadow: '0 28px 48px rgba(15,23,42,0.18)',
          }}
        >
          {/* decorative blobs */}
          <div
            className="pointer-events-none absolute -right-[30px] -top-[30px] h-[180px] w-[180px] rounded-full opacity-25"
            style={{ background: 'radial-gradient(circle, #93D4FF, transparent 65%)' }}
          />
          <div
            className="pointer-events-none absolute -bottom-[30px] -left-[20px] h-[140px] w-[140px] rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #BAE6FD, transparent 65%)' }}
          />

          {/* greeting row — gap: 16px */}
          <div className="relative flex items-center justify-between gap-[16px]">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-[0.20em] text-white/70">Selamat Datang 🎉</p>
              {/* spec: 28px, weight 800 */}
              <h1 className="mt-[4px] text-[28px] font-extrabold leading-[34px] tracking-tight">
                Halo, {firstName}! 👋
              </h1>
              {/* spec: 14px, weight 400, white/90 */}
              <p className="mt-[6px] text-[14px] font-normal text-white/90">Semangat belajar hari ini!</p>
            </div>
            {/* avatar — spec: 72px */}
            <div
              className="relative shrink-0"
              style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.25))' }}
            >
              <div className="absolute inset-0 rounded-full bg-white/20 blur-[6px]" />
              <div className="relative flex h-[80px] w-[80px] items-center justify-center rounded-full ring-[3px] ring-white/70 ring-offset-[2px] ring-offset-white/20">
                <Image
                  src={avatarAsset}
                  alt={`${firstName} avatar`}
                  width={72}
                  height={72}
                  className="h-[72px] w-[72px] rounded-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── LEVEL CARD — spec: radius=30px, shadow=0 18px 36px rgba(15,23,42,0.16), padding=16px, gap=16px, overlap=-24px */}
        <section
          className="relative z-10 -mt-[24px] rounded-[30px] bg-white p-[16px]"
          style={{ boxShadow: '0 18px 36px rgba(15,23,42,0.16)' }}
        >
          <div className="flex items-center gap-[16px]">
            {/* spec: level icon 48px */}
            <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[14px] bg-[#EEF7FF]">
              <Image
                src={getLevelIconAsset(levelInfo.level)}
                alt={`Level ${levelInfo.level}`}
                width={48}
                height={48}
                className="h-[48px] w-[48px] object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              {/* spec: Level/XP labels 11px, weight 600, #9CA3AF */}
              <div className="flex items-center justify-between gap-[8px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">Level</p>
                <p className="text-[11px] font-semibold text-[#9CA3AF]">XP</p>
              </div>
              <div className="mt-[2px] flex items-center justify-between gap-[8px]">
                <p className="text-[15px] font-bold text-[#111827]">
                  {levelInfo.level} · {levelInfo.name}
                </p>
                <p className="text-[18px] font-extrabold leading-none text-[#1D93FF]">
                  {totalXp}<span className="text-[11px] font-semibold text-[#9CA3AF]"> / {levelInfo.nextXp} XP</span>
                </p>
              </div>
              {/* spec: progress bar h=12px, track=#EEF4FB, fill=#1D93FF→#0F5FB5 */}
              <div className="mt-[8px] h-[12px] overflow-hidden rounded-full bg-[#EEF4FB]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${levelInfo.progress}%`,
                    background: 'linear-gradient(90deg, #1D93FF, #0F5FB5)',
                  }}
                />
              </div>
              <p className="mt-[5px] text-right text-[11px] font-semibold text-[#1D93FF]">
                {levelInfo.progress}% menuju level berikutnya
              </p>
            </div>
          </div>
        </section>

        {/* ── 2. CONTINUE LEARNING — spec: bg=#F6F9FE, radius=28px, shadow=0 10px 24px rgba(15,23,42,0.05), padding=16px, gap=12px */}
        <section
          className="mt-[12px] w-full overflow-hidden rounded-[28px]"
          style={{ background: '#F6F9FE', boxShadow: '0 10px 24px rgba(15,23,42,0.05)' }}
        >
          <div className="flex items-center justify-between px-[16px] pt-[16px]">
            {/* spec: 10px, weight 600, #9CA3AF */}
            <span className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[#9CA3AF]">
              Continue Learning
            </span>
            <Link href="/dashboard/siswa/komik" className="text-[12px] font-semibold text-[#1D93FF]">
              Lihat Semua →
            </Link>
          </div>

          <div className="flex items-stretch gap-[12px] px-[16px] pb-[16px] pt-[12px]">
            {/* cover — spec: 92×112px */}
            <div
              className="h-[112px] w-[92px] shrink-0 overflow-hidden rounded-[18px]"
              style={{ boxShadow: '0 8px 20px rgba(15,23,42,0.14)' }}
            >
              <Image
                src={getDashboardCoverAsset(continueComic?.id)}
                alt={continueComic ? continueComic.title : 'Cover komik'}
                width={92}
                height={112}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div>
                {/* spec: 18px, weight 900, #111827 */}
                <h2 className="text-[18px] font-black leading-[23px] text-[#111827]">
                  {continueComic ? continueComic.title : 'Belum ada komik aktif'}
                </h2>
                <p className="mt-[4px] text-[12px] font-medium text-[#6B7280]">
                  {todayStages}/{SINTAKS.length} tahap selesai
                </p>
                {/* spec: progress bar h=12px, track=#EEF4FB */}
                <div className="mt-[8px] h-[12px] overflow-hidden rounded-full bg-[#EEF4FB]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${todayPct}%`,
                      background: 'linear-gradient(90deg, #1D93FF, #0F5FB5)',
                    }}
                  />
                </div>
                <p className="mt-[4px] text-[12px] font-bold text-[#1D93FF]">{todayPct}% selesai</p>
              </div>

              <Link
                href="/dashboard/siswa/komik"
                className="mt-[10px] flex w-full items-center justify-center gap-[8px] rounded-[14px] py-[11px] text-[13px] font-extrabold text-white"
                style={{
                  background: 'linear-gradient(90deg, #1D93FF, #0F5FB5)',
                  boxShadow: '0 6px 16px rgba(29,147,255,0.35)',
                }}
              >
                Lanjutkan
                <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ── 3. QUICK STATS — spec: radius=24px, shadow=0 6px 16px rgba(15,23,42,0.05), padding=12px, gap=8px */}
        <section className="mt-[12px]">
          <h3 className="mb-[12px] text-[16px] font-extrabold text-[#111827]">Statistik Kamu 🏆</h3>
          <div className="grid grid-cols-2 gap-[12px]">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[24px] border-[1.5px] p-[12px]"
                style={{
                  background: stat.bg,
                  borderColor: stat.border,
                  boxShadow: '0 6px 16px rgba(15,23,42,0.05)',
                }}
              >
                {/* spec: stat icon 32px */}
                <div
                  className="mb-[8px] flex h-[40px] w-[40px] items-center justify-center rounded-[12px]"
                  style={{
                    background: stat.iconBg,
                    boxShadow: '0 4px 10px rgba(15,23,42,0.08)',
                  }}
                >
                  <Image
                    src={getStatIconAsset(stat.type)}
                    alt={stat.label}
                    width={32}
                    height={32}
                    className="h-[32px] w-[32px] object-contain"
                  />
                </div>
                <p className="text-[24px] font-extrabold leading-none" style={{ color: stat.valueColor }}>
                  {stat.value}
                </p>
                <p className="mt-[5px] text-[12px] font-semibold" style={{ color: stat.labelColor }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. PROGRESS — spec: bg=#F6F9FE, radius=28px, shadow=0 10px 24px rgba(15,23,42,0.05), padding=16px, gap=12px */}
        <section
          className="mt-[12px] w-full overflow-hidden rounded-[28px]"
          style={{ background: '#F6F9FE', boxShadow: '0 10px 24px rgba(15,23,42,0.05)' }}
        >
          {/* spec: label 10px, weight 600, #9CA3AF */}
          <div className="flex items-center justify-between px-[16px] pt-[16px]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[#9CA3AF]">
              Progress Belajar Hari Ini
            </p>
            <span
              className="rounded-full px-[10px] py-[4px] text-[11px] font-bold text-white"
              style={{ background: 'linear-gradient(90deg, #1D93FF, #0F5FB5)' }}
            >
              {todayStages}/{SINTAKS.length} tahap
            </span>
          </div>

          <div className="flex items-end gap-[10px] px-[16px] pt-[12px]">
            <p className="text-[48px] font-extrabold leading-none text-[#1D93FF]">{todayPct}%</p>
            <p className="mb-[6px] text-[13px] font-medium text-[#6B7280]">selesai hari ini</p>
          </div>

          {/* spec: progress bar h=12px, track=#EEF4FB, fill=#1D93FF→#0F5FB5 */}
          <div className="mx-[16px] mt-[12px] h-[12px] overflow-hidden rounded-full bg-[#EEF4FB]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${todayPct}%`,
                background: 'linear-gradient(90deg, #1D93FF, #0F5FB5)',
              }}
            />
          </div>

          <div className="flex items-center justify-between px-[16px] pt-[6px]">
            <p className="text-[11px] font-medium text-[#9CA3AF]">0%</p>
            <p className="text-[11px] font-semibold text-[#1D93FF]">{todayPct}% dari 100%</p>
          </div>

          <div className="mx-[16px] mt-[14px] h-[1px] bg-[#E8F0FE]" />

          {/* spec: arrow button 44px */}
          <button
            type="button"
            className="flex w-full items-center justify-between px-[16px] py-[14px] text-[13px] font-bold text-[#1D93FF]"
          >
            <span>Lihat Detail Tahap</span>
            <span
              className="flex h-[44px] w-[44px] items-center justify-center rounded-full"
              style={{ background: 'linear-gradient(135deg, #1D93FF, #0F5FB5)', boxShadow: '0 4px 12px rgba(29,147,255,0.35)' }}
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </span>
          </button>
        </section>

        {/* ── 5. BADGES — spec: bg=#F6F9FE, radius=28px, shadow=0 10px 24px rgba(15,23,42,0.05), padding=16px, gap=12px */}
        <section
          className="mt-[12px] w-full overflow-hidden rounded-[28px]"
          style={{ background: '#F6F9FE', boxShadow: '0 10px 24px rgba(15,23,42,0.05)' }}
        >
          {/* spec: label 10px, weight 600, #9CA3AF */}
          <div className="flex items-center justify-between px-[16px] pt-[16px]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[#9CA3AF]">Badge Terbaru</p>
            <button type="button" className="text-[12px] font-bold text-[#1D93FF]">
              Lihat Semua →
            </button>
          </div>

          {/* spec: badge 112px, gap=12px */}
          <div className="flex gap-[12px] overflow-x-auto px-[16px] pb-[16px] pt-[12px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {badgeItems.map((badge) => (
              <div
                key={badge.title}
                className="flex min-w-[140px] shrink-0 flex-col items-center rounded-[22px] bg-white px-[12px] pb-[14px] pt-[16px]"
                style={{ boxShadow: '0 6px 16px rgba(15,23,42,0.08)' }}
              >
                {/* spec: badge 112×112px */}
                <div
                  className="flex h-[112px] w-[112px] items-center justify-center rounded-[18px] bg-[#EEF7FF]"
                  style={{ boxShadow: '0 4px 12px rgba(29,147,255,0.10)' }}
                >
                  <Image
                    src={badge.asset}
                    alt={badge.title}
                    width={112}
                    height={112}
                    className="h-[112px] w-[112px] object-contain"
                  />
                </div>
                <p className="mt-[10px] text-center text-[12px] font-bold leading-[17px] text-[#111827]">
                  {badge.title}
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
