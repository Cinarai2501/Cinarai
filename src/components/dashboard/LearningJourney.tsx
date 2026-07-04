'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchAllComics } from '@/services/comicFirestoreService';
import { getAllUnlockStatuses } from '@/lib/unlockEngine';
import { useAllComicProgress } from '@/hooks/useAllComicProgress';
import { SINTAKS } from '@/types/progress';
import type { Comic } from '@/types/comic';
import type { UnlockStatus } from '@/lib/unlockEngine';

// Per-comic visual identity — no external assets needed
const COMIC_THEME: Record<number, {
  emoji: string;
  bg: string;
  accent: string;
  difficulty: string;
  difficultyColor: string;
}> = {
  1: { emoji: '🏛️', bg: 'from-blue-400 to-primary-500',     accent: 'bg-primary-600',   difficulty: 'Menengah', difficultyColor: 'bg-warning-100 text-warning-700' },
  2: { emoji: '🪷', bg: 'from-pink-400 to-rose-500',         accent: 'bg-rose-500',      difficulty: 'Menengah', difficultyColor: 'bg-warning-100 text-warning-700' },
  3: { emoji: '🐘', bg: 'from-teal-400 to-accent-500',       accent: 'bg-accent-600',    difficulty: 'Mudah',    difficultyColor: 'bg-accent-100 text-accent-700' },
  4: { emoji: '🌉', bg: 'from-orange-400 to-secondary-500',  accent: 'bg-secondary-600', difficulty: 'Menengah', difficultyColor: 'bg-warning-100 text-warning-700' },
  5: { emoji: '👑', bg: 'from-purple-400 to-purple-600',     accent: 'bg-purple-600',    difficulty: 'Mudah',    difficultyColor: 'bg-accent-100 text-accent-700' },
};

const DEFAULT_THEME = COMIC_THEME[1];

export default function LearningJourney() {
  const { states, getProgress, isLoading } = useAllComicProgress();
  const [comics, setComics] = useState<Comic[]>([]);
  const [comicsLoading, setComicsLoading] = useState(true);
  const unlockStatuses = useMemo(() => getAllUnlockStatuses(states), [states]);

  useEffect(() => {
    fetchAllComics()
      .then(setComics)
      .catch(() => setComics([]))
      .finally(() => setComicsLoading(false));
  }, []);

  if (isLoading || comicsLoading) {
    return <JourneySkeleton />;
  }

  return (
    <div className="rounded-3xl bg-white shadow-md overflow-hidden">
      {/* Section header */}
      <div className="px-5 pt-5 pb-4 border-b border-neutral-100">
        <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
          Petualangan Belajar
        </p>
        <h2 className="mt-0.5 text-base font-black text-neutral-900">Komik Saya 📚</h2>
      </div>

      {/* Cards */}
      <div className="divide-y divide-neutral-100">
        {comics.map((comic, index) => {
          const progress = getProgress(comic.id);
          const percentage = progress?.percentage ?? 0;
          const isCompleted = progress?.isCompleted ?? false;
          const completedCount = progress?.completedCount ?? 0;
          const unlockStatus = unlockStatuses.get(comic.id) ?? 'LOCKED';
          const isLocked = unlockStatus === 'LOCKED';
          const isComingSoon = unlockStatus === 'COMING_SOON';
          const theme = COMIC_THEME[comic.id] ?? DEFAULT_THEME;

          return (
            <ComicCard
              key={comic.id}
              comic={comic}
              index={index}
              percentage={percentage}
              completedCount={completedCount}
              isCompleted={isCompleted}
              isLocked={isLocked}
              isComingSoon={isComingSoon}
              theme={theme}
              unlockStatus={unlockStatus}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Comic Card ───────────────────────────────────────────────────────────────

interface ComicCardProps {
  comic: Comic;
  index: number;
  percentage: number;
  completedCount: number;
  isCompleted: boolean;
  isLocked: boolean;
  isComingSoon: boolean;
  theme: typeof DEFAULT_THEME;
  unlockStatus: UnlockStatus;
}

function ComicCard({
  comic,
  index,
  percentage,
  completedCount,
  isCompleted,
  isLocked,
  isComingSoon,
  theme,
}: ComicCardProps) {
  const disabled = isLocked || isComingSoon;

  return (
    <div className={`p-4 transition-opacity ${disabled ? 'opacity-55' : 'opacity-100'}`}>
      <div className="flex gap-3">

        {/* ── Illustration panel ── */}
        <div className="flex-shrink-0 relative">
          <div
            className={`relative h-24 w-20 rounded-2xl bg-gradient-to-br ${theme.bg} flex items-center justify-center overflow-hidden shadow-sm`}
          >
            {/* Cover image with emoji fallback */}
            <Image
              src={comic.cover}
              alt={comic.title}
              fill
              sizes="80px"
              className="object-cover rounded-2xl"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            {/* Emoji always rendered behind image as fallback */}
            <span className="absolute text-4xl select-none">{theme.emoji}</span>

            {/* Lock overlay */}
            {disabled && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
                <span className="text-2xl">{isComingSoon ? '🚧' : '🔒'}</span>
              </div>
            )}

            {/* Completed checkmark */}
            {isCompleted && (
              <div className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent-500 shadow">
                <span className="text-xs text-white font-black">✓</span>
              </div>
            )}
          </div>

          {/* Step number */}
          <span className="absolute -bottom-1.5 -left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-black text-neutral-500 shadow ring-1 ring-neutral-200">
            {index + 1}
          </span>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <h3 className={`text-sm font-black leading-snug ${disabled ? 'text-neutral-400' : 'text-neutral-900'}`}>
              {comic.title}
            </h3>
            <StatusBadge
              isCompleted={isCompleted}
              isComingSoon={isComingSoon}
              isLocked={isLocked}
              percentage={percentage}
            />
          </div>

          {/* Meta chips */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-500">
              Kelas {comic.kelas}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${theme.difficultyColor}`}>
              {theme.difficulty}
            </span>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-500">
              ⏱ {comic.estimatedMinutes} mnt
            </span>
          </div>

          {/* Progress bar + stage dots */}
          {!disabled && (
            <div className="mt-2.5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex gap-0.5">
                  {SINTAKS.map((s) => {
                    const idx = SINTAKS.indexOf(s);
                    const done = idx < completedCount;
                    return (
                      <span
                        key={s}
                        title={s}
                        className={`h-1.5 w-1.5 rounded-full transition-colors ${
                          done ? 'bg-primary-500' : 'bg-neutral-200'
                        }`}
                      />
                    );
                  })}
                </div>
                <span className="text-[10px] font-bold text-neutral-500">{percentage}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    isCompleted
                      ? 'bg-gradient-to-r from-accent-400 to-accent-500'
                      : 'bg-gradient-to-r from-primary-400 to-primary-600'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-3">
            <CtaButton
              comicId={comic.id}
              isCompleted={isCompleted}
              isLocked={isLocked}
              isComingSoon={isComingSoon}
              percentage={percentage}
              accentClass={theme.accent}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CTA Button ───────────────────────────────────────────────────────────────

function CtaButton({
  comicId, isCompleted, isLocked, isComingSoon, percentage, accentClass,
}: {
  comicId: number;
  isCompleted: boolean;
  isLocked: boolean;
  isComingSoon: boolean;
  percentage: number;
  accentClass: string;
}) {
  // Jika sudah ada progress apapun, lanjutkan ke /learn agar LearningEngine
  // membaca stage dari Firestore. Jika belum pernah mulai, mulai dari /cover.
  const continueHref = percentage > 0
    ? `/comic/${comicId}/learn`
    : `/comic/${comicId}/cover`;

  if (isComingSoon) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xl bg-warning-100 px-4 py-2 text-xs font-bold text-warning-700 cursor-not-allowed">
        🚧 Segera Hadir
      </span>
    );
  }
  if (isLocked) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-100 px-4 py-2 text-xs font-bold text-neutral-400 cursor-not-allowed">
        🔒 Selesaikan komik sebelumnya
      </span>
    );
  }
  if (isCompleted) {
    return (
      <Link
        href={`/comic/${comicId}/learn`}
        className="inline-flex items-center gap-1.5 rounded-xl bg-accent-500 px-4 py-2.5 text-xs font-black text-white shadow-sm hover:bg-accent-600 active:scale-95 transition-all"
      >
        ✅ Lihat Hasil
      </Link>
    );
  }
  if (percentage > 0) {
    return (
      <Link
        href={continueHref}
        className={`inline-flex items-center gap-1.5 rounded-xl ${accentClass} px-4 py-2.5 text-xs font-black text-white shadow-sm hover:opacity-90 active:scale-95 transition-all`}
      >
        ▶ Lanjutkan
      </Link>
    );
  }
  return (
    <Link
      href={`/comic/${comicId}/cover`}
      className={`inline-flex items-center gap-1.5 rounded-xl ${accentClass} px-4 py-2.5 text-xs font-black text-white shadow-sm hover:opacity-90 active:scale-95 transition-all`}
    >
      🚀 Mulai Petualangan
    </Link>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({
  isCompleted, isComingSoon, isLocked, percentage,
}: {
  isCompleted: boolean; isComingSoon: boolean; isLocked: boolean; percentage: number;
}) {
  if (isCompleted)   return <span className="flex-shrink-0 rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-black text-accent-700">Selesai ✓</span>;
  if (isComingSoon)  return <span className="flex-shrink-0 rounded-full bg-warning-100 px-2 py-0.5 text-[10px] font-black text-warning-700">Segera</span>;
  if (isLocked)      return <span className="flex-shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-black text-neutral-500">Terkunci</span>;
  if (percentage > 0) return <span className="flex-shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-black text-primary-700">Berlangsung</span>;
  return               <span className="flex-shrink-0 rounded-full bg-secondary-100 px-2 py-0.5 text-[10px] font-black text-secondary-700">Baru</span>;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function JourneySkeleton() {
  return (
    <div className="rounded-3xl bg-white shadow-md overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-neutral-100">
        <div className="h-3 w-28 rounded-full bg-neutral-200 animate-pulse" />
        <div className="mt-2 h-5 w-36 rounded-full bg-neutral-200 animate-pulse" />
      </div>
      <div className="divide-y divide-neutral-100">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 flex gap-3">
            <div className="h-24 w-20 rounded-2xl bg-neutral-200 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded-full bg-neutral-200 animate-pulse" />
              <div className="h-3 w-1/2 rounded-full bg-neutral-200 animate-pulse" />
              <div className="h-2 w-full rounded-full bg-neutral-100 animate-pulse" />
              <div className="h-8 w-28 rounded-xl bg-neutral-200 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
