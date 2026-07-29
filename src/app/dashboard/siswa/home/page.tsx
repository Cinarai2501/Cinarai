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
  const todayPct = todayProgress?.percentage ?? 0;
  const levelInfo = getLevelInfo(totalXp);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading)
      document.documentElement.style.scrollBehavior = 'smooth';
  }, [isLoading]);

  const statCards = [
    {
      label: 'Total XP',
      value: `${totalXp}`,
      secondaryLabel: 'XP terkumpul',
      caption: 'Terus lanjutkan tantanganmu',
      type: 'xp',
      bg: 'rgba(251,191,36,0.12)',
      border: 'rgba(251,191,36,0.38)',
      valueColor: '#92400E',
      labelColor: '#B45309',
      progress: levelInfo.progress,
      glow: 'radial-gradient(circle at top left, rgba(251,191,36,0.28), transparent 58%)',
    },
    {
      label: 'Level',
      value: `${levelInfo.level}`,
      secondaryLabel: levelInfo.name,
      caption: 'Misi berikutnya menunggu',
      type: 'level',
      bg: 'rgba(59,130,246,0.11)',
      border: 'rgba(59,130,246,0.34)',
      valueColor: '#1E40AF',
      labelColor: '#2563EB',
      progress: levelInfo.progress,
      glow: 'radial-gradient(circle at top right, rgba(96,165,250,0.24), transparent 58%)',
    },
    {
      label: 'Streak',
      value: `${completedComics > 0 ? Math.min(14, 3 + completedComics) : 7}`,
      secondaryLabel: 'hari beruntun',
      caption: 'Konsistensi bikin kuat',
      type: 'streak',
      bg: 'rgba(249,115,22,0.11)',
      border: 'rgba(249,115,22,0.34)',
      valueColor: '#9A3412',
      labelColor: '#C2410C',
      progress: Math.min(100, 40 + completedComics * 12),
      glow: 'radial-gradient(circle at top center, rgba(249,115,22,0.22), transparent 56%)',
    },
    {
      label: 'Komik Selesai',
      value: `${completedComics}`,
      secondaryLabel: 'komik selesai',
      caption: 'Belajar lewat petualangan',
      type: 'comic',
      bg: 'rgba(16,185,129,0.11)',
      border: 'rgba(16,185,129,0.34)',
      valueColor: '#14532D',
      labelColor: '#15803D',
      progress: Math.min(100, Math.round((completedComics / Math.max(1, comics.length)) * 100)),
      glow: 'radial-gradient(circle at top left, rgba(16,185,129,0.20), transparent 58%)',
    },
  ];

  const badgeItems = [
    { asset: '/assets/dashboard/home/badges/pembaca/badge-pembaca-pemula.png',       title: 'Pembaca Pemula' },
    { asset: '/assets/dashboard/home/badges/pembaca/badge-pembaca-terampil.png',     title: 'Penjelajah Candi' },
    { asset: '/assets/dashboard/home/badges/komik/badge-komik-3-pencari-bentuk.png', title: 'Pencari Bentuk' },
    { asset: '/assets/dashboard/home/badges/komik/badge-komik-5-master-cinarai.png', title: 'Pecinta Belajar' },
  ];

  return (
    <div className="min-h-full">
      <div className="mx-auto flex min-h-full max-w-[420px] flex-col px-4 pb-4 pt-3">
        <div className="flex-1 space-y-3">

          {/* ── 1. HEADER ── */}
          <section
            className="dash-enter dash-enter-1 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1D93FF] via-[#0A6FD4] to-[#0F5FB5] p-4 shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/80">Selamat Datang</p>
                <h1 className="mt-1 text-[20px] font-extrabold leading-[24px] text-white">Halo, {firstName}!</h1>
                <p className="mt-1 text-[12px] font-medium text-white/85">Siap belajar dalam satu layar.</p>
              </div>
              <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white/20 ring-2 ring-white/30">
                <Image
                  src={avatarAsset}
                  alt={`${firstName} avatar`}
                  width={72}
                  height={72}
                  className="h-[72px] w-[72px] rounded-full object-cover"
                />
              </div>
            </div>
          </section>

          {/* ── 2. LEVEL CARD ── */}
          <section
            className="dash-enter dash-enter-2 overflow-hidden rounded-[28px] bg-white/90 p-3 shadow-[0_12px_26px_rgba(15,23,42,0.10)]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-[#EEF7FF]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getLevelIconAsset(levelInfo.level)}
                  alt={`Level ${levelInfo.level}`}
                  className="h-[56px] w-[56px] object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#6B7280]">Level</p>
                <p className="mt-1 text-[20px] font-black leading-[1.1] text-[#111827]">{levelInfo.level} · {levelInfo.name}</p>
                <p className="mt-1 text-[13px] font-semibold text-[#1D4ED8]">{totalXp} / {levelInfo.nextXp} XP</p>
                <div className="mt-3 h-[6px] overflow-hidden rounded-full bg-[#EEF4FB]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#38BDF8] via-[#1D93FF] to-[#0F5FB5]"
                    style={{ width: `${levelInfo.progress}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#2563EB]">{levelInfo.progress}% menuju level berikutnya</p>
              </div>
            </div>
          </section>

          {/* ── 3. CONTINUE LEARNING ── */}
          <section
            className="dash-enter dash-enter-3 overflow-hidden rounded-[28px] bg-white/90 p-3 shadow-[0_12px_26px_rgba(15,23,42,0.10)]"
          >
            <div className="flex items-center gap-3">
              <div className="h-[72px] w-[72px] overflow-hidden rounded-[18px] bg-slate-100">
                <Image
                  src={getDashboardCoverAsset(continueComic?.id)}
                  alt={continueComic ? continueComic.title : 'Cover komik'}
                  width={72}
                  height={72}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#6B7280]">Continue Learning</p>
                <h2
                  className="mt-1 text-[16px] font-black leading-[1.2] text-[#111827]"
                  style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                >
                  {continueComic ? continueComic.title : 'Belum ada komik aktif'}
                </h2>
                <div className="mt-2 h-[6px] overflow-hidden rounded-full bg-[#EEF4FB]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#38BDF8] via-[#1D93FF] to-[#0F5FB5]"
                    style={{ width: `${todayPct}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#1D93FF]">{todayPct}% selesai</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Link
                href="/dashboard/siswa/komik"
                className="flex-1 rounded-[18px] bg-[#1D93FF] px-3 py-2 text-center text-[12px] font-bold text-white shadow-[0_10px_20px_rgba(29,147,255,0.20)]"
              >
                Lanjutkan
              </Link>
              <Link
                href="/dashboard/siswa/komik"
                className="rounded-[18px] border border-[#D1D5DB] bg-white px-3 py-2 text-[12px] font-semibold text-[#374151]"
              >
                Lihat Semua
              </Link>
            </div>
          </section>

          {/* ── 4. STATISTIK MINI ── */}
          <section className="dash-enter dash-enter-4 overflow-hidden rounded-[28px] bg-white/90 p-3 shadow-[0_12px_26px_rgba(15,23,42,0.10)]">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#6B7280]">Statistik</p>
                <p className="mt-1 text-[12px] font-medium text-[#6B7280]">Ringkas dan cepat</p>
              </div>
              <span className="text-[11px] font-semibold text-[#9CA3AF]">Geser untuk lihat semua</span>
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {statCards.map((stat) => (
                <div
                  key={stat.label}
                  className="min-w-[100px] flex-shrink-0 rounded-[24px] border border-white/80 bg-[#F8FBFF]/80 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                  style={{ background: stat.bg, borderColor: stat.border }}
                >
                  <div className="flex h-[40px] items-center justify-center rounded-[18px] bg-white/70">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getStatIconAsset(stat.type)}
                      alt={stat.label}
                      className="h-[28px] w-[28px] object-contain"
                    />
                  </div>
                  <p className="mt-2 text-[19px] font-black leading-[1.05]" style={{ color: stat.valueColor }}>
                    {stat.value}
                  </p>
                  <p className="text-[9px] uppercase tracking-[0.24em] text-[#475569]">{stat.label}</p>
                  <div className="mt-2 h-[4px] overflow-hidden rounded-full bg-white/70">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#38BDF8] via-[#1D93FF] to-[#0F5FB5]"
                      style={{ width: `${stat.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── 5. BADGE TERBARU ── */}
          <section
            className="dash-enter dash-enter-5 overflow-hidden rounded-[28px] bg-white/90 p-3 shadow-[0_12px_26px_rgba(15,23,42,0.10)]"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#6B7280]">Badge Terbaru</p>
                <p className="mt-1 text-[12px] font-medium text-[#6B7280]">Pencapaian terbaru</p>
              </div>
              <Link href="/dashboard/siswa/profil" className="text-[12px] font-bold text-[#1D93FF]">
                Lihat Semua
              </Link>
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {badgeItems.slice(0, 2).map((badge) => (
                <div
                  key={badge.title}
                  className="min-w-[140px] flex-shrink-0 rounded-[24px] bg-gradient-to-br from-[#EEF7FF] to-[#FFFFFF] p-3 shadow-[0_10px_22px_rgba(29,147,255,0.12)]"
                >
                  <div className="flex h-[92px] items-center justify-center rounded-[20px] bg-white/90 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={badge.asset}
                      alt={badge.title}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <p className="mt-3 text-[12px] font-bold leading-[1.2] text-[#111827]">
                    {badge.title}
                  </p>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
