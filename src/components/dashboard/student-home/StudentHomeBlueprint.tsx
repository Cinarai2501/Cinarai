'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
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
  const cur = LEVEL_THRESHOLDS[level] ?? 0;
  const next = LEVEL_THRESHOLDS[level + 1] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const progress = next > cur ? Math.round(((xp - cur) / (next - cur)) * 100) : 100;
  return { level: level + 1, name: LEVEL_NAMES[level] ?? 'Legenda', nextXp: next, progress };
}

function getDashboardCoverAsset(comicId?: number) {
  return `/assets/dashboard/home/covers/cover-komik-${comicId ?? 1}.png`;
}

function getAvatarAsset(firstName: string) {
  const n = firstName.toLowerCase();
  if (n.includes('ara') || n.includes('ani') || n.endsWith('a')) {
    return '/assets/dashboard/home/avatars/avatar-anak-perempuan.png';
  }
  return '/assets/dashboard/home/avatars/avatar-anak-laki-laki.png';
}

function getLevelIconAsset(level: number) {
  return `/assets/dashboard/home/levels/icon-level-${Math.max(1, Math.min(level, 5))}-v2.png`;
}

function getStatIconAsset(type: string) {
  switch (type) {
    case 'xp':
      return '/assets/dashboard/home/statistics/icon-total-xp.png';
    case 'level':
      return '/assets/dashboard/home/levels/icon-level-3-v2.png';
    case 'streak':
      return '/assets/dashboard/home/statistics/icon-streak.png';
    case 'comic':
      return '/assets/dashboard/home/statistics/icon-komik-selesai.png';
    default:
      return '/assets/dashboard/home/statistics/icon-total-xp.png';
  }
}

export default function StudentHomeBlueprint() {
  const { user } = useAuth();
  const { states, getProgress } = useAllComicProgress();
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

    return {
      totalXp: totalCompleted * 15,
      completedComics: completedCount,
      continueComic: nextComic,
      overallPct: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
    };
  }, [comics, getProgress, unlockStatuses]);

  const todayProgress = continueComic ? getProgress(continueComic.id) : undefined;
  const todayPct = todayProgress?.percentage ?? 0;
  const stageLabel = `${todayProgress?.completedCount ?? 0}/${SINTAKS.length} tahap`;
  const levelInfo = getLevelInfo(totalXp);

  const statCards = [
    {
      label: 'XP',
      value: `${totalXp}`,
      type: 'xp',
      bg: 'rgba(251, 191, 36, 0.12)',
      valueColor: '#92400E',
    },
    {
      label: 'Level',
      value: `${levelInfo.level}`,
      type: 'level',
      bg: 'rgba(59, 130, 246, 0.11)',
      valueColor: '#1E40AF',
    },
    {
      label: 'Streak',
      value: `${completedComics > 0 ? Math.min(14, 3 + completedComics) : 7}`,
      type: 'streak',
      bg: 'rgba(249, 115, 22, 0.11)',
      valueColor: '#9A3412',
    },
    {
      label: 'Komik',
      value: `${completedComics}`,
      type: 'comic',
      bg: 'rgba(16, 185, 129, 0.11)',
      valueColor: '#14532D',
    },
  ];

  const badgeItems = [
    { asset: '/assets/dashboard/home/badges/pembaca/badge-pembaca-pemula.png', title: 'Pembaca Pemula' },
    { asset: '/assets/dashboard/home/badges/pembaca/badge-pembaca-terampil.png', title: 'Penjelajah Candi' },
    { asset: '/assets/dashboard/home/badges/komik/badge-komik-3-pencari-bentuk.png', title: 'Pencari Bentuk' },
    { asset: '/assets/dashboard/home/badges/komik/badge-komik-5-master-cinarai.png', title: 'Pecinta Belajar' },
  ];

  return (
    <div className="min-h-full">
      <div className="mx-auto flex max-w-[440px] flex-col px-[16px] pb-[92px] pt-[12px]">
        <div className="flex flex-col gap-[12px]">
          <section
            className="overflow-hidden rounded-[36px] px-[20px] pb-[24px] pt-[20px] text-white shadow-[0_28px_48px_rgba(15,23,42,0.18)]"
            style={{ background: 'linear-gradient(135deg, #1D93FF 0%, #0F5FB5 100%)', minHeight: 320 }}
          >
            <div className="flex h-full flex-col justify-between gap-[16px]">
              <div className="flex items-start justify-between gap-[16px]">
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/80">Selamat Datang</p>
                  <h1 className="mt-[6px] text-[28px] font-extrabold leading-[34px] text-white">Halo, {firstName}!</h1>
                  <p className="mt-[8px] text-[14px] font-normal text-white/90">Semangat belajar hari ini!</p>
                </div>
                <div className="relative mt-[2px] flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-white/20 ring-[3px] ring-white/70">
                  <Image src={avatarAsset} alt={`${firstName} avatar`} width={72} height={72} className="h-[72px] w-[72px] rounded-full object-cover" />
                </div>
              </div>
            </div>
          </section>

          <section
            className="relative z-10 -mt-[24px] rounded-[30px] bg-white p-[16px] shadow-[0_18px_36px_rgba(15,23,42,0.16)]"
            style={{ minHeight: 144 }}
          >
            <div className="flex h-full items-center gap-[16px]">
              <div className="flex h-[48px] w-[48px] items-center justify-center rounded-[20px] bg-[#EEF7FF]">
                <Image src={getLevelIconAsset(levelInfo.level)} alt={`Level ${levelInfo.level}`} width={48} height={48} className="h-[48px] w-[48px] object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-[8px]">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">Level</p>
                    <p className="mt-[4px] text-[18px] font-black leading-[1.15] text-[#111827]">{levelInfo.level} · {levelInfo.name}</p>
                  </div>
                  <p className="text-[11px] font-semibold text-[#9CA3AF]">XP</p>
                </div>
                <div className="mt-[8px] flex items-center justify-between gap-[8px] text-[11px] font-semibold text-[#6B7280]">
                  <span>{totalXp} XP</span>
                  <span>{levelInfo.nextXp} target</span>
                </div>
                <div className="mt-[8px] h-[12px] overflow-hidden rounded-full bg-[#EEF4FB]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#1D93FF] to-[#0F5FB5]" style={{ width: `${levelInfo.progress}%` }} />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] bg-[#F6F9FE] p-[16px] shadow-[0_10px_24px_rgba(15,23,42,0.05)]" style={{ minHeight: 180 }}>
            <div className="flex h-full items-center gap-[12px]">
              <div className="h-[112px] w-[92px] shrink-0 overflow-hidden rounded-[20px] bg-slate-100">
                <Image src={getDashboardCoverAsset(continueComic?.id)} alt={continueComic ? continueComic.title : 'Cover komik'} width={92} height={112} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">Continue Learning</p>
                <h2 className="mt-[4px] text-[18px] font-black leading-[23px] text-[#111827]">{continueComic ? continueComic.title : 'Belum ada komik aktif'}</h2>
                <div className="mt-[8px] h-[12px] overflow-hidden rounded-full bg-[#EEF4FB]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#1D93FF] to-[#0F5FB5]" style={{ width: `${todayPct}%` }} />
                </div>
                <div className="mt-[8px] flex items-center justify-between gap-[8px]">
                  <p className="text-[12px] font-semibold text-[#1D93FF]">{todayPct}% selesai</p>
                  <Link href="/dashboard/siswa/komik" className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#1D93FF] shadow-[0_8px_16px_rgba(29,147,255,0.24)]" aria-label="Lanjutkan belajar">
                    <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] bg-white p-[12px] shadow-[0_6px_16px_rgba(15,23,42,0.05)]">
            <div className="grid grid-cols-2 gap-[8px]">
              {statCards.map((stat) => (
                <div key={stat.label} className="rounded-[24px] border border-[#E5E7EB] p-[12px]" style={{ background: stat.bg }}>
                  <div className="flex items-center gap-[8px]">
                    <div className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-white/70">
                      <Image src={getStatIconAsset(stat.type)} alt={stat.label} width={32} height={32} className="h-[32px] w-[32px] object-contain" />
                    </div>
                    <div>
                      <p className="text-[20px] font-black leading-[1.1]" style={{ color: stat.valueColor }}>{stat.value}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6B7280]">{stat.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] bg-[#F6F9FE] p-[16px] shadow-[0_10px_24px_rgba(15,23,42,0.05)]" style={{ minHeight: 160 }}>
            <div className="flex items-start justify-between gap-[8px]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">Progress Belajar Hari Ini</p>
                <p className="mt-[4px] text-[14px] font-medium text-[#6B7280]">Kamu sudah menyelesaikan {todayPct}% dari perjalanan hari ini.</p>
                <p className="mt-[4px] text-[12px] font-semibold text-[#1D93FF]">{stageLabel}</p>
              </div>
              <Link href="/dashboard/siswa/komik" className="flex h-[36px] items-center rounded-full bg-[#1D93FF] px-[12px] text-[11px] font-semibold text-white shadow-[0_8px_16px_rgba(29,147,255,0.24)]" aria-label="Lihat detail progres">
                Lihat
              </Link>
            </div>
            <div className="mt-[12px] h-[12px] overflow-hidden rounded-full bg-[#EEF4FB]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#1D93FF] to-[#0F5FB5]" style={{ width: `${Math.max(8, todayPct)}%` }} />
            </div>
            <div className="mt-[12px] flex items-center justify-between text-[12px] font-semibold text-[#6B7280]">
              <span>Mulai</span>
              <span>{todayPct}%</span>
              <span>Target</span>
            </div>
          </section>

          <section className="rounded-[28px] bg-[#F6F9FE] p-[16px] shadow-[0_10px_24px_rgba(15,23,42,0.05)]" style={{ minHeight: 220 }}>
            <div className="flex items-center justify-between gap-[8px]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">Badge Terbaru</p>
                <p className="mt-[4px] text-[12px] font-medium text-[#6B7280]">Pencapaian terbaru kamu</p>
              </div>
              <Link href="/dashboard/siswa/profil" className="rounded-full border border-[#DCE8F8] bg-white px-[12px] py-[8px] text-[11px] font-semibold text-[#1D93FF] shadow-[0_4px_10px_rgba(15,23,42,0.04)]">
                Lihat Semua
              </Link>
            </div>
            <div className="mt-[12px] flex gap-[12px] overflow-x-auto pb-[4px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {badgeItems.map((badge) => (
                <div key={badge.title} className="flex min-w-[140px] shrink-0 flex-col items-center rounded-[24px] border border-[#E5E7EB] bg-white p-[12px] shadow-[0_8px_20px_rgba(29,147,255,0.10)]">
                  <div className="flex h-[112px] w-[112px] items-center justify-center rounded-[20px] bg-[#F8FBFF] p-[8px]">
                    <Image src={badge.asset} alt={badge.title} width={112} height={112} className="h-[112px] w-[112px] object-contain" />
                  </div>
                  <p className="mt-[10px] text-center text-[12px] font-bold leading-[16px] text-[#111827]">{badge.title}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
