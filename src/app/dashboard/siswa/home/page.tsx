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
      label: 'XP',
      value: `${totalXp}`,
      type: 'xp',
      bg: 'rgba(251,191,36,0.12)',
      border: 'rgba(251,191,36,0.38)',
      valueColor: '#92400E',
      progress: levelInfo.progress,
    },
    {
      label: 'Level',
      value: `${levelInfo.level}`,
      type: 'level',
      bg: 'rgba(59,130,246,0.11)',
      border: 'rgba(59,130,246,0.34)',
      valueColor: '#1E40AF',
      progress: levelInfo.progress,
    },
    {
      label: 'Streak',
      value: `${completedComics > 0 ? Math.min(14, 3 + completedComics) : 7}`,
      type: 'streak',
      bg: 'rgba(249,115,22,0.11)',
      border: 'rgba(249,115,22,0.34)',
      valueColor: '#9A3412',
      progress: Math.min(100, 40 + completedComics * 12),
    },
    {
      label: 'Komik',
      value: `${completedComics}`,
      type: 'comic',
      bg: 'rgba(16,185,129,0.11)',
      border: 'rgba(16,185,129,0.34)',
      valueColor: '#14532D',
      progress: Math.min(100, Math.round((completedComics / Math.max(1, comics.length)) * 100)),
    },
  ];

  return (
    <div className="min-h-full">
      <div className="mx-auto flex h-[calc(100dvh-92px)] max-w-[420px] flex-col overflow-hidden px-4 pb-2 pt-3">
        <div className="flex flex-1 flex-col gap-2 overflow-hidden">
          {/* ── 1. HEADER ── */}
          <section
            className="dash-enter dash-enter-1 overflow-hidden rounded-[26px] bg-gradient-to-br from-[#1D93FF] via-[#0A6FD4] to-[#0F5FB5] px-4 py-3"
            style={{ minHeight: 104, maxHeight: 104 }}
          >
            <div className="flex h-full items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/85">Selamat Datang</p>
                <h1 className="mt-1 text-[18px] font-extrabold leading-[22px] text-white">Halo, {firstName}!</h1>
                <p className="mt-1 text-[11px] font-medium text-white/80">Ringkas, cepat, dan fokus belajar.</p>
              </div>
              <div className="relative flex h-[60px] w-[60px] items-center justify-center rounded-full bg-white/20 ring-2 ring-white/30">
                <Image
                  src={avatarAsset}
                  alt={`${firstName} avatar`}
                  width={60}
                  height={60}
                  className="h-[60px] w-[60px] rounded-full object-cover"
                />
              </div>
            </div>
          </section>

          {/* ── 2. LEVEL CARD ── */}
          <section
            className="dash-enter dash-enter-2 overflow-hidden rounded-[24px] bg-white/95 p-3 shadow-[0_10px_20px_rgba(15,23,42,0.08)]"
            style={{ minHeight: 88, maxHeight: 88 }}
          >
            <div className="flex h-full items-center gap-3">
              <div className="flex h-[60px] w-[60px] items-center justify-center rounded-[20px] bg-[#EEF7FF]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getLevelIconAsset(levelInfo.level)}
                  alt={`Level ${levelInfo.level}`}
                  className="h-[52px] w-[52px] object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#6B7280]">Level</p>
                    <p className="mt-1 text-[16px] font-black leading-[1.1] text-[#111827]">{levelInfo.level} · {levelInfo.name}</p>
                  </div>
                  <div className="rounded-full bg-[#EEF7FF] px-2 py-1 text-[10px] font-semibold text-[#2563EB]">
                    {totalXp} / {levelInfo.nextXp} XP
                  </div>
                </div>
                <div className="mt-2 h-[4px] overflow-hidden rounded-full bg-[#EEF4FB]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#38BDF8] via-[#1D93FF] to-[#0F5FB5]"
                    style={{ width: `${levelInfo.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── 3. CONTINUE LEARNING ── */}
          <section
            className="dash-enter dash-enter-3 overflow-hidden rounded-[24px] bg-white/95 p-3 shadow-[0_10px_20px_rgba(15,23,42,0.08)]"
            style={{ minHeight: 96, maxHeight: 96 }}
          >
            <div className="flex h-full items-center gap-3">
              <div className="h-[64px] w-[64px] overflow-hidden rounded-[18px] bg-slate-100">
                <Image
                  src={getDashboardCoverAsset(continueComic?.id)}
                  alt={continueComic ? continueComic.title : 'Cover komik'}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#6B7280]">Continue Learning</p>
                <h2
                  className="mt-1 text-[14px] font-black leading-[1.2] text-[#111827]"
                  style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                >
                  {continueComic ? continueComic.title : 'Belum ada komik aktif'}
                </h2>
                <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-[#EEF4FB]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#38BDF8] via-[#1D93FF] to-[#0F5FB5]"
                    style={{ width: `${todayPct}%` }}
                  />
                </div>
              </div>
              <Link
                href="/dashboard/siswa/komik"
                className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#1D93FF]"
                aria-label="Lanjutkan belajar"
              >
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </section>

          {/* ── 4. STATISTIK CHIP ── */}
          <section
            className="dash-enter dash-enter-4 overflow-hidden rounded-[24px] bg-white/95 p-3 shadow-[0_10px_20px_rgba(15,23,42,0.08)]"
            style={{ minHeight: 72, maxHeight: 72 }}
          >
            <div className="flex h-full items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {statCards.map((stat) => (
                <div
                  key={stat.label}
                  className="flex min-w-[92px] items-center gap-2 rounded-full border border-white/90 bg-[#F8FBFF]/90 px-2.5 py-2"
                  style={{ background: stat.bg, borderColor: stat.border }}
                >
                  <div className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-white/90">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getStatIconAsset(stat.type)}
                      alt={stat.label}
                      className="h-[18px] w-[18px] object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-black leading-[1]" style={{ color: stat.valueColor }}>
                      {stat.value}
                    </p>
                    <p className="text-[8px] uppercase tracking-[0.2em] text-[#475569]">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
