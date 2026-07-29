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
  const cur  = LEVEL_THRESHOLDS[level] ?? 0;
  const next = LEVEL_THRESHOLDS[level + 1] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const progress = next > cur ? Math.round(((xp - cur) / (next - cur)) * 100) : 100;
  return { level: level + 1, name: LEVEL_NAMES[level] ?? 'Legenda', nextXp: next, progress };
}

function getDashboardCoverAsset(comicId?: number) {
  return `/assets/dashboard/home/covers/cover-komik-${comicId ?? 1}.png`;
}

function getAvatarAsset(firstName: string) {
  const n = firstName.toLowerCase();
  if (n.includes('ara') || n.includes('ani') || n.endsWith('a'))
    return '/assets/dashboard/home/avatars/avatar-anak-perempuan.png';
  return '/assets/dashboard/home/avatars/avatar-anak-laki-laki.png';
}

function getLevelIconAsset(level: number) {
  return `/assets/dashboard/home/levels/icon-level-${Math.max(1, Math.min(level, 5))}-v2.png`;
}

function getStatIconAsset(type: string) {
  switch (type) {
    case 'xp':     return '/assets/dashboard/home/statistics/icon-total-xp.png';
    case 'level':  return '/assets/dashboard/home/levels/icon-level-3-v2.png';
    case 'streak': return '/assets/dashboard/home/statistics/icon-streak.png';
    case 'comic':  return '/assets/dashboard/home/statistics/icon-komik-selesai.png';
    default:       return '/assets/dashboard/home/statistics/icon-total-xp.png';
  }
}

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.80)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.65)',
};

export default function DashboardSiswaHomePage() {
  const { user } = useAuth();
  const { states, getProgress, isLoading } = useAllComicProgress();
  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Petualang';
  const avatarAsset = getAvatarAsset(firstName);

  const comics         = useMemo(() => getAllComics(), []);
  const unlockStatuses = useMemo(() => getAllUnlockStatuses(states), [states]);

  const { totalXp, completedComics, continueComic } = useMemo(() => {
    let totalCompleted = 0;
    let completedCount = 0;
    let nextComic = undefined as (typeof comics)[number] | undefined;
    for (const comic of comics) {
      const p = getProgress(comic.id);
      if (!p) continue;
      totalCompleted += p.completedCount;
      if (p.isCompleted) completedCount += 1;
      if (!nextComic && unlockStatuses.get(comic.id) === 'UNLOCKED' && !p.isCompleted)
        nextComic = comic;
    }
    const totalPossible =
      comics.filter((c) => unlockStatuses.get(c.id) !== 'COMING_SOON').length * SINTAKS.length;
    return {
      totalXp: totalCompleted * 15,
      completedComics: completedCount,
      continueComic: nextComic,
      overallPct: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
    };
  }, [comics, getProgress, unlockStatuses]);

  const todayProgress = continueComic ? getProgress(continueComic.id) : undefined;
  const todayStages   = todayProgress?.completedCount ?? 0;
  const todayPct      = todayProgress?.percentage ?? 0;
  const levelInfo     = getLevelInfo(totalXp);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading)
      document.documentElement.style.scrollBehavior = 'smooth';
  }, [isLoading]);

  const statCards = [
    {
      label: 'Total XP',      value: `${totalXp}`,         type: 'xp',
      bg: 'rgba(251,191,36,0.12)',   border: 'rgba(251,191,36,0.38)',
      valueColor: '#92400E',         labelColor: '#B45309',
    },
    {
      label: 'Level',         value: levelInfo.name,        type: 'level',
      bg: 'rgba(59,130,246,0.11)',   border: 'rgba(59,130,246,0.34)',
      valueColor: '#1E40AF',         labelColor: '#2563EB',
    },
    {
      label: 'Streak',        value: '—',                   type: 'streak',
      bg: 'rgba(249,115,22,0.11)',   border: 'rgba(249,115,22,0.34)',
      valueColor: '#9A3412',         labelColor: '#C2410C',
    },
    {
      label: 'Komik Selesai', value: `${completedComics}`,  type: 'comic',
      bg: 'rgba(16,185,129,0.11)',   border: 'rgba(16,185,129,0.34)',
      valueColor: '#14532D',         labelColor: '#15803D',
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
          className="dash-enter dash-enter-1 relative overflow-hidden rounded-[36px] px-[20px] pb-[48px] pt-[22px] text-white"
          style={{
            background: 'linear-gradient(135deg, #1D93FF 0%, #0A6FD4 60%, #0F5FB5 100%)',
            boxShadow: '0 28px 48px rgba(15,23,42,0.20)',
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
                <Image src={avatarAsset} alt={`${firstName} avatar`}
                  width={72} height={72} className="h-[72px] w-[72px] rounded-full object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. LEVEL CARD ── */}
        <section
          className="dash-enter dash-enter-2 relative z-10 -mt-[24px] rounded-[30px] p-[16px]"
          style={{ ...glass, boxShadow: '0 18px 36px rgba(15,23,42,0.12)' }}
        >
          <div className="flex items-center gap-[16px]">
            {/*
              Container: 120×120px, rounded, bg biru muda.
              Padding 6px di semua sisi → area gambar efektif 108×108px (~90%).
              `<img>` native digunakan karena next.config unoptimized:true,
              sehingga tidak ada override inset dari Next.js Image fill.
            */}
            <div
              className="shrink-0 rounded-[20px] bg-[#EEF7FF]"
              style={{
                width: 120,
                height: 120,
                minWidth: 120,
                padding: 6,
                boxShadow: '0 6px 20px rgba(29,147,255,0.22)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getLevelIconAsset(levelInfo.level)}
                alt={`Level ${levelInfo.level}`}
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <div className="flex items-center justify-between gap-[8px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">Level</p>
                <p className="text-[11px] font-semibold text-[#9CA3AF]">XP</p>
              </div>
              <div className="mt-[4px] flex items-center justify-between gap-[8px]">
                <p className="text-[15px] font-bold text-[#111827]">{levelInfo.level} · {levelInfo.name}</p>
                <p className="text-[18px] font-extrabold leading-none text-[#1D93FF]">
                  {totalXp}
                  <span className="text-[11px] font-semibold text-[#9CA3AF]"> / {levelInfo.nextXp} XP</span>
                </p>
              </div>
              <div className="mt-[12px] h-[8px] overflow-hidden rounded-full bg-[#EEF4FB]">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${levelInfo.progress}%`, background: 'linear-gradient(90deg, #38BDF8, #1D93FF, #0F5FB5)' }}
                />
              </div>
              <p className="mt-[5px] text-right text-[11px] font-semibold text-[#1D93FF]">
                {levelInfo.progress}% menuju level berikutnya
              </p>
            </div>
          </div>
        </section>

        {/* ── 3. CONTINUE LEARNING ── */}
        <section
          className="dash-enter dash-enter-3 mt-[20px] w-full overflow-hidden rounded-[28px]"
          style={{ ...glass, boxShadow: '0 8px 24px rgba(15,23,42,0.07)' }}
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

        {/* ── 4. STATISTIK ── */}
        {/*
          Stat icon: centered in a 100px-tall area at the top of each card.
          Image is 80×80px — large, centered, no padding shrinkage.
          Value + label sit below in a padded row.
        */}
        <section className="dash-enter dash-enter-4 mt-[20px]">
          <div className="mb-[14px]">
            <h3 className="text-[16px] font-extrabold text-[#111827]">Statistik Kamu 🏆</h3>
            <p className="mt-[2px] text-[12px] font-medium text-[#9CA3AF]">Perkembangan belajarmu</p>
          </div>
          <div className="grid grid-cols-2 gap-[14px]">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className="press-scale overflow-hidden rounded-[24px] border-[1.5px]"
                style={{ background: stat.bg, borderColor: stat.border, boxShadow: '0 6px 16px rgba(15,23,42,0.06)' }}
              >
                {/*
                  Icon area: container 100% wide, height 96px.
                  img mengisi seluruh area dengan padding 8px di semua sisi.
                */}
                <div
                  style={{
                    width: '100%',
                    height: 96,
                    padding: 8,
                    boxSizing: 'border-box',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getStatIconAsset(stat.type)}
                    alt={stat.label}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                </div>
                <div className="px-[14px] pb-[14px]">
                  <p className="text-[24px] font-extrabold leading-none" style={{ color: stat.valueColor }}>
                    {stat.value}
                  </p>
                  <p className="mt-[4px] text-[12px] font-semibold" style={{ color: stat.labelColor }}>
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 5. BADGE TERBARU ── */}
        <section
          className="dash-enter dash-enter-5 mt-[20px] w-full overflow-hidden rounded-[28px]"
          style={{ ...glass, boxShadow: '0 8px 24px rgba(15,23,42,0.07)' }}
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
                className="press-scale flex min-w-[148px] shrink-0 flex-col items-center rounded-[24px] pb-[14px]"
                style={{
                  background: 'linear-gradient(160deg, #EEF7FF 0%, #FFFFFF 100%)',
                  boxShadow: '0 8px 20px rgba(29,147,255,0.10)',
                  border: '1px solid rgba(147,197,253,0.35)',
                }}
              >
                {/*
                  Badge: container 120×120px, padding 6px.
                  img mengisi ~90% area container.
                */}
                <div
                  style={{
                    width: 120,
                    height: 120,
                    padding: 6,
                    marginTop: 12,
                    boxSizing: 'border-box',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={badge.asset}
                    alt={badge.title}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                </div>
                <p className="mt-[10px] px-[10px] text-center text-[12px] font-bold leading-[17px] text-[#111827]">
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
