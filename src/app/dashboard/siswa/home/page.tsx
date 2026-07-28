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
    if (xp >= LEVEL_THRESHOLDS[i]) { level = i; break; }
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
  const n = firstName.toLowerCase();
  if (n.includes('ara') || n.includes('ani') || n.endsWith('a'))
    return '/assets/dashboard/home/avatars/avatar-anak-perempuan.png';
  return '/assets/dashboard/home/avatars/avatar-anak-laki-laki.png';
}

function getLevelIconAsset(level: number) {
  return `/assets/dashboard/home/levels/icon-level-${Math.max(1, Math.min(level, 5))}.png`;
}

function getStatIconAsset(type: string) {
  switch (type) {
    case 'xp':     return '/assets/dashboard/home/statistics/icon-total-xp.png';
    case 'level':  return '/assets/dashboard/home/levels/icon-level-3.png';
    case 'streak': return '/assets/dashboard/home/statistics/icon-streak.png';
    case 'comic':  return '/assets/dashboard/home/statistics/icon-komik-selesai.png';
    default:       return '/assets/dashboard/home/statistics/icon-total-xp.png';
  }
}

/* shared glassmorphism card style */
const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.60)',
};

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
      if (!nextComic && unlockStatuses.get(comic.id) === 'UNLOCKED' && !progress.isCompleted)
        nextComic = comic;
    }
    const totalPossible =
      comics.filter((c) => unlockStatuses.get(c.id) !== 'COMING_SOON').length * SINTAKS.length;
    const overallPctValue = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
    return {
      totalXp: totalCompleted * 15,
      completedComics: completedCount,
      continueComic: nextComic,
      overallPct: overallPctValue,
    };
  }, [comics, getProgress, unlockStatuses]);

  const todayProgress = continueComic ? getProgress(continueComic.id) : undefined;
  const todayStages = todayProgress?.completedCount ?? 0;
  const todayPct   = todayProgress?.percentage ?? 0;
  const levelInfo  = getLevelInfo(totalXp);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading)
      document.documentElement.style.scrollBehavior = 'smooth';
  }, [isLoading]);

  const statCards = [
    {
      label: 'Total XP', value: `${totalXp}`, type: 'xp',
      gradient: 'linear-gradient(135deg, rgba(251,191,36,0.13) 0%, rgba(245,158,11,0.07) 100%)',
      border: 'rgba(251,191,36,0.35)', valueColor: '#92400E', labelColor: '#B45309',
    },
    {
      label: 'Level', value: levelInfo.name, type: 'level',
      gradient: 'linear-gradient(135deg, rgba(59,130,246,0.13) 0%, rgba(29,147,255,0.07) 100%)',
      border: 'rgba(59,130,246,0.32)', valueColor: '#1E40AF', labelColor: '#2563EB',
    },
    {
      label: 'Streak', value: '\u2014', type: 'streak',
      gradient: 'linear-gradient(135deg, rgba(249,115,22,0.13) 0%, rgba(234,88,12,0.07) 100%)',
      border: 'rgba(249,115,22,0.32)', valueColor: '#9A3412', labelColor: '#C2410C',
    },
    {
      label: 'Komik Selesai', value: `${completedComics}`, type: 'comic',
      gradient: 'linear-gradient(135deg, rgba(16,185,129,0.13) 0%, rgba(5,150,105,0.07) 100%)',
      border: 'rgba(16,185,129,0.32)', valueColor: '#14532D', labelColor: '#15803D',
    },
  ];

  const badgeItems = [
    { asset: '/assets/dashboard/home/badges/pembaca/badge-pembaca-pemula.png',       title: 'Pembaca Pemula' },
    { asset: '/assets/dashboard/home/badges/pembaca/badge-pembaca-terampil.png',     title: 'Penjelajah Candi' },
    { asset: '/assets/dashboard/home/badges/komik/badge-komik-3-pencari-bentuk.png', title: 'Pencari Bentuk' },
    { asset: '/assets/dashboard/home/badges/komik/badge-komik-5-master-cinarai.png', title: 'Pecinta Belajar' },
  ];

  return (
    <div className="min-h-screen">
      <div className="flex w-full flex-col px-[16px] pb-[32px] pt-[20px]">

        {/* ── 1. HEADER ── */}
        <section
          className="dash-enter dash-enter-1 relative overflow-hidden rounded-[36px] px-[20px] pb-[44px] pt-[20px] text-white"
          style={{
            background: 'linear-gradient(135deg, #1D93FF 0%, #0A6FD4 60%, #0F5FB5 100%)',
            boxShadow: '0 28px 48px rgba(15,23,42,0.18)',
          }}
        >
          <div className="pointer-events-none absolute -right-[30px] -top-[30px] h-[180px] w-[180px] rounded-full opacity-25"
            style={{ background: 'radial-gradient(circle, #93D4FF, transparent 65%)' }} />
          <div className="pointer-events-none absolute -bottom-[30px] -left-[20px] h-[140px] w-[140px] rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #BAE6FD, transparent 65%)' }} />

          <div className="relative flex items-center justify-between gap-[16px]">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-[0.20em] text-white/70">Selamat Datang 🎉</p>
              <h1 className="mt-[4px] text-[28px] font-extrabold leading-[34px] tracking-tight">
                Halo, {firstName}! 👋
              </h1>
              <p className="mt-[6px] text-[14px] font-normal text-white/90">Semangat belajar hari ini!</p>
            </div>
            <div className="relative shrink-0" style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.25))' }}>
              <div className="absolute inset-0 rounded-full bg-white/20 blur-[6px]" />
              <div className="relative flex h-[80px] w-[80px] items-center justify-center rounded-full ring-[3px] ring-white/70 ring-offset-[2px] ring-offset-white/20">
                <Image src={avatarAsset} alt={`${firstName} avatar`} width={72} height={72}
                  className="h-[72px] w-[72px] rounded-full object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* ── LEVEL CARD ── */}
        <section
          className="dash-enter dash-enter-2 relative z-10 -mt-[24px] rounded-[30px] p-[16px]"
          style={{ ...glassCard, boxShadow: '0 18px 36px rgba(15,23,42,0.12)' }}
        >
          <div className="flex items-center gap-[14px]">
            {/* badge: container 108px, image 100px → mengisi ~93% */}
            <div
              className="shrink-0 rounded-[20px] bg-[#EEF7FF]"
              style={{
                width: 108,
                height: 108,
                padding: 4,
                boxShadow: '0 6px 20px rgba(29,147,255,0.22)',
              }}
            >
              <Image
                src={getLevelIconAsset(levelInfo.level)}
                alt={`Level ${levelInfo.level}`}
                width={100}
                height={100}
                className="h-[100px] w-[100px] object-contain"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-[8px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">Level</p>
                <p className="text-[11px] font-semibold text-[#9CA3AF]">XP</p>
              </div>
              <div className="mt-[2px] flex items-center justify-between gap-[8px]">
                <p className="text-[15px] font-bold text-[#111827]">{levelInfo.level} · {levelInfo.name}</p>
                <p className="text-[18px] font-extrabold leading-none text-[#1D93FF]">
                  {totalXp}<span className="text-[11px] font-semibold text-[#9CA3AF]"> / {levelInfo.nextXp} XP</span>
                </p>
              </div>
              <div className="mt-[10px] h-[8px] overflow-hidden rounded-full bg-[#EEF4FB]">
                <div className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${levelInfo.progress}%`, background: 'linear-gradient(90deg, #38BDF8, #1D93FF, #0F5FB5)' }} />
              </div>
              <p className="mt-[5px] text-right text-[11px] font-semibold text-[#1D93FF]">
                {levelInfo.progress}% menuju level berikutnya
              </p>
            </div>
          </div>
        </section>

        {/* ── 2. CONTINUE LEARNING ── */}
        <section
          className="dash-enter dash-enter-3 mt-[28px] w-full overflow-hidden rounded-[28px]"
          style={{ ...glassCard, boxShadow: '0 8px 24px rgba(15,23,42,0.07)' }}
        >
          <div className="flex items-center justify-between px-[16px] pt-[16px]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[#9CA3AF]">Continue Learning</p>
              <p className="mt-[1px] text-[12px] font-medium text-[#6B7280]">Lanjutkan petualanganmu</p>
            </div>
            <Link href="/dashboard/siswa/komik" className="press-scale text-[12px] font-semibold text-[#1D93FF]">
              Lihat Semua →
            </Link>
          </div>
          <div className="flex items-stretch gap-[12px] px-[16px] pb-[16px] pt-[12px]">
            <div className="h-[112px] w-[92px] shrink-0 overflow-hidden rounded-[18px]"
              style={{ boxShadow: '0 8px 20px rgba(15,23,42,0.14)' }}>
              <Image src={getDashboardCoverAsset(continueComic?.id)}
                alt={continueComic ? continueComic.title : 'Cover komik'}
                width={92} height={112} className="h-full w-full object-cover" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div>
                <h2 className="text-[18px] font-black leading-[23px] text-[#111827]">
                  {continueComic ? continueComic.title : 'Belum ada komik aktif'}
                </h2>
                <p className="mt-[4px] text-[12px] font-medium text-[#6B7280]">
                  {todayStages}/{SINTAKS.length} tahap selesai
                </p>
                {/* progress bar — 8px */}
                <div className="mt-[8px] h-[8px] overflow-hidden rounded-full bg-[#EEF4FB]">
                  <div className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${todayPct}%`, background: 'linear-gradient(90deg, #38BDF8, #1D93FF, #0F5FB5)' }} />
                </div>
                <p className="mt-[4px] text-[12px] font-bold text-[#1D93FF]">{todayPct}% selesai</p>
              </div>
              <Link href="/dashboard/siswa/komik"
                className="press-scale mt-[10px] flex w-full items-center justify-center gap-[8px] rounded-[14px] py-[11px] text-[13px] font-extrabold text-white"
                style={{ background: 'linear-gradient(90deg, #1D93FF, #0F5FB5)', boxShadow: '0 6px 16px rgba(29,147,255,0.35)' }}>
                Lanjutkan
                <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ── 3. QUICK STATS ── */}
        <section className="dash-enter dash-enter-4 mt-[28px]">
          <div className="mb-[14px]">
            <h3 className="text-[16px] font-extrabold text-[#111827]">Statistik Kamu 🏆</h3>
            <p className="mt-[2px] text-[12px] font-medium text-[#9CA3AF]">Perkembangan belajarmu</p>
          </div>
          <div className="grid grid-cols-2 gap-[14px]">
            {statCards.map((stat) => (
              <div key={stat.label}
                className="press-scale relative overflow-hidden rounded-[24px] border-[1.5px] p-[12px]"
                style={{ background: stat.gradient, borderColor: stat.border, boxShadow: '0 6px 16px rgba(15,23,42,0.05)' }}>
                {/* watermark */}
                <div className="pointer-events-none absolute -bottom-[8px] -right-[8px] h-[68px] w-[68px] opacity-[0.11]">
                  <Image src={getStatIconAsset(stat.type)} alt="" width={68} height={68}
                    className="h-[68px] w-[68px] object-contain" aria-hidden="true" />
                </div>
                <div className="mb-[10px]">
                  <Image src={getStatIconAsset(stat.type)} alt={stat.label} width={56} height={56}
                    className="h-[56px] w-[56px] object-contain" />
                </div>
                <p className="text-[24px] font-extrabold leading-none" style={{ color: stat.valueColor }}>{stat.value}</p>
                <p className="mt-[5px] text-[12px] font-semibold" style={{ color: stat.labelColor }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. PROGRESS ── */}
        <section
          className="dash-enter dash-enter-5 press-scale mt-[28px] w-full overflow-hidden rounded-[28px]"
          style={{ ...glassCard, boxShadow: '0 8px 24px rgba(15,23,42,0.07)' }}
        >
          {/* header row */}
          <div className="flex items-start justify-between px-[18px] pt-[18px]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.20em] text-[#9CA3AF]">Progress Belajar Hari Ini</p>
              <h3 className="mt-[3px] text-[16px] font-extrabold text-[#111827]">Capaian Hari Ini</h3>
              <p className="mt-[2px] text-[12px] font-medium text-[#6B7280]">Capai target belajar hari ini.</p>
            </div>
            <span
              className="mt-[2px] shrink-0 rounded-full px-[12px] py-[5px] text-[11px] font-extrabold text-white"
              style={{ background: 'linear-gradient(90deg, #3B82F6, #2563EB)', boxShadow: '0 4px 10px rgba(37,99,235,0.30)' }}
            >
              {todayStages}/{SINTAKS.length} Tahap
            </span>
          </div>

          {/* big % + illustration */}
          <div className="relative mx-[18px] mt-[14px] flex items-end justify-between">
            <p
              className="text-[52px] font-extrabold leading-none"
              style={{ color: '#2563EB', textShadow: '0 2px 12px rgba(37,99,235,0.18)' }}
            >
              {todayPct}%
            </p>
            {/* siluet candi — SVG inline, opacity 8% */}
            <svg
              viewBox="0 0 120 80"
              className="pointer-events-none mb-[4px] h-[64px] w-[96px] opacity-[0.08]"
              fill="#2563EB"
              aria-hidden="true"
            >
              {/* siluet candi penataran sederhana */}
              <rect x="50" y="10" width="20" height="70" />
              <rect x="40" y="25" width="40" height="55" />
              <rect x="28" y="38" width="64" height="42" />
              <rect x="10" y="52" width="100" height="28" />
              <polygon points="60,0 54,10 66,10" />
            </svg>
          </div>

          {/* progress bar 10px */}
          <div className="mx-[18px] mt-[10px] h-[10px] overflow-hidden rounded-full bg-[#DBEAFE]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${todayPct}%`,
                background: 'linear-gradient(90deg, #3B82F6, #2563EB)',
                transition: 'width 400ms cubic-bezier(0.34,1.56,0.64,1)',
              }}
            />
          </div>

          {/* 0% ——— 100% */}
          <div className="mx-[18px] mt-[5px] flex items-center justify-between">
            <p className="text-[11px] font-semibold text-[#93C5FD]">0%</p>
            <p className="text-[11px] font-semibold text-[#93C5FD]">100%</p>
          </div>

          {/* motivasi */}
          <p className="mx-[18px] mt-[10px] text-[12px] font-medium italic text-[#9CA3AF]">
            &ldquo;Ayo selesaikan petualangan hari ini!&rdquo;
          </p>

          <div className="mx-[18px] mt-[14px] h-[1px] bg-[#E8F0FE]" />
          <button
            type="button"
            className="press-scale flex w-full items-center justify-between px-[18px] py-[14px] text-[13px] font-bold text-[#2563EB]"
          >
            <span>Lihat Detail Tahap</span>
            <span
              className="flex h-[36px] w-[36px] items-center justify-center rounded-full"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)', boxShadow: '0 4px 12px rgba(37,99,235,0.30)' }}
            >
              <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </span>
          </button>
        </section>

        {/* ── 5. BADGES ── */}
        <section
          className="dash-enter dash-enter-6 mt-[28px] w-full overflow-hidden rounded-[28px]"
          style={{ ...glassCard, boxShadow: '0 8px 24px rgba(15,23,42,0.07)' }}
        >
          <div className="flex items-center justify-between px-[16px] pt-[16px]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[#9CA3AF]">Badge Terbaru</p>
              <p className="mt-[1px] text-[12px] font-medium text-[#6B7280]">Pencapaian yang kamu raih</p>
            </div>
            <button type="button" className="press-scale text-[12px] font-bold text-[#1D93FF]">
              Lihat Semua →
            </button>
          </div>
          <div className="flex gap-[12px] overflow-x-auto px-[16px] pb-[16px] pt-[12px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {badgeItems.map((badge) => (
              <div
                key={badge.title}
                className="press-scale flex min-w-[148px] shrink-0 flex-col items-center rounded-[24px] pb-[14px] pt-[14px]"
                style={{
                  background: 'linear-gradient(160deg, rgba(238,247,255,0.95) 0%, rgba(255,255,255,0.90) 100%)',
                  boxShadow: '0 8px 20px rgba(29,147,255,0.10)',
                  border: '1px solid rgba(147,197,253,0.35)',
                }}
              >
                {/* glow halo di belakang badge */}
                <div className="relative flex items-center justify-center">
                  <div
                    className="absolute rounded-full"
                    style={{
                      width: 96,
                      height: 96,
                      background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)',
                      filter: 'blur(8px)',
                    }}
                  />
                  {/* container 108px, image 100px → ~93% */}
                  <div
                    className="relative rounded-[20px] bg-white"
                    style={{
                      width: 108,
                      height: 108,
                      padding: 4,
                      boxShadow: '0 6px 18px rgba(29,147,255,0.14)',
                    }}
                  >
                    <Image
                      src={badge.asset}
                      alt={badge.title}
                      width={100}
                      height={100}
                      className="h-[100px] w-[100px] object-contain"
                    />
                  </div>
                </div>
                <p className="mt-[10px] px-[8px] text-center text-[12px] font-bold leading-[17px] text-[#111827]">
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
