'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAllComicProgress } from '@/hooks/useAllComicProgress';
import { getAllComics } from '@/lib/comicRepository';
import { getAllUnlockStatuses } from '@/lib/unlockEngine';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import { generateDailyMotivation } from '@/lib/ai/dailyMotivation';
import BadgeSection from './BadgeSection';
import ContinueLearningCard from './ContinueLearningCard';
import HomeHeader from './HomeHeader';
import MotivationCard from './MotivationCard';
import StatisticsGrid from './StatisticsGrid';
import StudentBottomNav from '@/components/dashboard/StudentBottomNav';
import { getLevelConfig } from './levelConfig';

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

function getLevelInfo(xp: number): LevelInfo {
  const config = getLevelConfig(xp);
  return { level: config.level, name: config.name, nextXp: config.nextXp, progress: config.progress };
}

function getAvatarAsset(firstName: string) {
  const n = firstName.toLowerCase();
  if (n.includes('ara') || n.includes('ani') || n.endsWith('a')) {
    return '/assets/dashboard/home/avatars/avatar-anak-perempuan.png';
  }
  return '/assets/dashboard/home/avatars/avatar-anak-laki-laki.png';
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
  const [motivation, setMotivation] = useState('Belajar sedikit demi sedikit tetap membawa kita maju.');
  const [motivationLoading, setMotivationLoading] = useState(true);

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
  const levelInfo = getLevelInfo(totalXp);

  useEffect(() => {
    if (!user?.uid) {
      setMotivationLoading(false);
      return;
    }

    let cancelled = false;

    const loadMotivation = async () => {
      const todayKey = new Date().toISOString().slice(0, 10);
      const motivationDoc = doc(firestore, 'users', user.uid, 'daily_motivation', todayKey);

      try {
        const snapshot = await getDoc(motivationDoc);
        if (!cancelled && snapshot.exists()) {
          const data = snapshot.data() as { text?: string } | undefined;
          if (typeof data?.text === 'string' && data.text.trim()) {
            setMotivation(data.text.trim());
            setMotivationLoading(false);
            return;
          }
        }

        if (cancelled) return;

        const generated = await generateDailyMotivation();
        if (!cancelled) {
          setMotivation(generated.motivation);
          await setDoc(motivationDoc, {
            userId: user.uid,
            text: generated.motivation,
            createdAt: serverTimestamp(),
            date: todayKey,
          }, { merge: true });
        }
      } catch {
        if (!cancelled) {
          setMotivation('Belajar sedikit demi sedikit tetap membawa kita maju.');
        }
      } finally {
        if (!cancelled) {
          setMotivationLoading(false);
        }
      }
    };

    void loadMotivation();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const statCards: StatCard[] = [
    { label: 'Total XP', value: `${totalXp}`, iconAsset: getStatIconAsset('xp'), bg: '#FEF3C7', valueColor: '#D97706', scale: 'scale-[1.8]' },
    { label: 'Level', sublabel: levelInfo.name, value: `Level ${levelInfo.level}`, iconAsset: getStatIconAsset('level'), bg: '#EDE9FE', valueColor: '#7C3AED', scale: 'scale-[1.0]' },
    { label: 'Streak Belajar', value: `${completedComics > 0 ? Math.min(14, 3 + completedComics) : 3}`, iconAsset: getStatIconAsset('streak'), bg: '#FFEDD5', valueColor: '#EA580C', scale: 'scale-[1.65]' },
    { label: 'Komik Selesai', value: `${completedComics}`, iconAsset: getStatIconAsset('comic'), bg: '#DCFCE7', valueColor: '#16A34A', scale: 'scale-[1.65]' },
  ];

  const levelBadge: BadgeItem = {
    asset: getLevelConfig(totalXp).badgeAsset,
    title: getLevelConfig(totalXp).badgeTitle,
  };

  const badgeItems: BadgeItem[] = [
    levelBadge,
    { asset: '/assets/dashboard/home/badges/pembaca/badge-pembaca-terampil.png', title: 'Penjelajah Candi' },
    { asset: '/assets/dashboard/home/badges/komik/badge-komik-3-pencari-bentuk.png', title: 'Pencari Bentuk' },
  ];

  return (
    <main className="relative overflow-hidden bg-[linear-gradient(180deg,#F5F8FF_0%,#F8FAFF_100%)] text-slate-900">
      <div className="mx-auto flex w-full max-w-[480px] flex-col px-0 pb-[72px]">
        <HomeHeader firstName={firstName} avatarAsset={avatarAsset} />

        <section className="mt-2 space-y-2.5">
          <ContinueLearningCard coverAsset={getDashboardCoverAsset(continueComic?.id)} title={continueComic ? continueComic.title : 'Petualang Bangun Ruang Candi Jawi'} progressPct={todayPct} />
          <MotivationCard motivation={motivation} isLoading={motivationLoading} />
          <StatisticsGrid statCards={statCards} />
          <BadgeSection badgeItems={badgeItems.slice(0, 3)} />
        </section>
      </div>

      <StudentBottomNav />
    </main>
  );
}
