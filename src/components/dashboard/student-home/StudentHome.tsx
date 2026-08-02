'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAllComicProgress } from '@/hooks/useAllComicProgress';
import { getAllComics } from '@/lib/comicRepository';
import { getAllUnlockStatuses } from '@/lib/unlockEngine';
import { SINTAKS } from '@/types/progress';
import BadgeSection from './BadgeSection';
import ContinueLearningCard from './ContinueLearningCard';
import DailyProgressCard from './DailyProgressCard';
import HomeHeader from './HomeHeader';
import LevelCard from './LevelCard';
import StatisticsGrid from './StatisticsGrid';
import StudentBottomNav from '@/components/dashboard/StudentBottomNav';

type StatCard = {
  label: string;
  value: string;
  iconAsset: string;
  bg: string;
  valueColor: string;
  sublabel?: string;
  scale?: string;
};

type BadgeItem = {
  asset: string;
  title: string;
};

type LevelInfo = {
  level: number;
  name: string;
  nextXp: number;
  progress: number;
};

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000];
const LEVEL_NAMES = ['Pemula', 'Penjelajah', 'Petualang', 'Pahlawan', 'Legenda'];

function getLevelInfo(xp: number): LevelInfo {
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

function getDashboardCoverAsset(comicId?: number) {
  return `/assets/dashboard/home/covers/cover-komik-${comicId ?? 1}.png`;
}

export default function StudentHome() {
  const { user } = useAuth();
  const { states, getProgress } = useAllComicProgress();
  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Siswa';
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

    return {
      totalXp: totalCompleted > 0 ? totalCompleted * 15 : 240,
      completedComics: completedCount,
      continueComic: nextComic ?? comics[0],
    };
  }, [comics, getProgress, unlockStatuses]);

  const todayProgress = continueComic ? getProgress(continueComic.id) : undefined;
  const todayPct = todayProgress?.percentage ?? 50;
  const currentStage = todayProgress?.completedCount ?? 4;
  const nextStageLabel = `Tahap ${Math.min(currentStage + 1, SINTAKS.length)}`;
  const levelInfo = getLevelInfo(totalXp);

  const statCards: StatCard[] = [
    { label: 'Total XP', value: `${totalXp}`, iconAsset: getStatIconAsset('xp'), bg: '#FEF3C7', valueColor: '#D97706', scale: 'scale-[1.8]' },
    { label: 'Level', sublabel: levelInfo.name, value: `Level ${levelInfo.level}`, iconAsset: getStatIconAsset('level'), bg: '#EDE9FE', valueColor: '#7C3AED', scale: 'scale-[1.0]' },
    { label: 'Streak', value: `${completedComics > 0 ? Math.min(14, 3 + completedComics) : 3}`, iconAsset: getStatIconAsset('streak'), bg: '#FFEDD5', valueColor: '#EA580C', scale: 'scale-[1.65]' },
    { label: 'Komik Selesai', value: `${completedComics}`, iconAsset: getStatIconAsset('comic'), bg: '#DCFCE7', valueColor: '#16A34A', scale: 'scale-[1.65]' },
  ];

  const badgeItems: BadgeItem[] = [
    { asset: '/assets/dashboard/home/badges/pembaca/badge-pembaca-pemula.png', title: 'Pembaca Pemula' },
    { asset: '/assets/dashboard/home/badges/pembaca/badge-pembaca-terampil.png', title: 'Penjelajah Candi' },
    { asset: '/assets/dashboard/home/badges/komik/badge-komik-3-pencari-bentuk.png', title: 'Pencari Bentuk' },
    { asset: '/assets/dashboard/home/badges/komik/badge-komik-5-master-cinarai.png', title: 'Pecinta Belajar' },
  ];

  return (
    <main className="relative min-h-[100svh] bg-[#F8FAFC] pb-[88px] text-slate-900">
      <HomeHeader firstName={firstName} avatarAsset={avatarAsset} />

      <section className="px-4 pb-6">
        <div className="mx-auto max-w-[480px] space-y-4">
          <LevelCard levelInfo={levelInfo} totalXp={totalXp} levelIconAsset={getLevelIconAsset(levelInfo.level)} />
          <ContinueLearningCard coverAsset={getDashboardCoverAsset(continueComic?.id)} title={continueComic ? continueComic.title : 'Petualang Bangun Ruang Candi Jawi'} progressPct={todayPct} />
          <StatisticsGrid statCards={statCards} />
          <DailyProgressCard progressPct={todayPct} nextStageLabel={nextStageLabel} />
          <BadgeSection badgeItems={badgeItems} />
        </div>
      </section>

      <StudentBottomNav />
    </main>
  );
}
