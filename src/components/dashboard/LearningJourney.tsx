'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getAllComics } from '@/lib/comicRepository';
import { getAllUnlockStatuses } from '@/lib/unlockEngine';
import { useAllComicProgress } from '@/hooks/useAllComicProgress';
import type { Comic } from '@/types/comic';
import type { UnlockStatus } from '@/lib/unlockEngine';

const comics = getAllComics();

// Per-comic personality: emoji illustration + gradient pair
const COMIC_THEME: Record<number, { emoji: string; gradient: string; ring: string }> = {
  1: { emoji: '🏛️', gradient: 'from-blue-400 to-primary-500',   ring: 'ring-primary-300' },
  2: { emoji: '🪷', gradient: 'from-pink-400 to-secondary-500', ring: 'ring-secondary-300' },
  3: { emoji: '🐘', gradient: 'from-teal-400 to-accent-500',    ring: 'ring-accent-300' },
  4: { emoji: '🌉', gradient: 'from-orange-400 to-warning-500', ring: 'ring-warning-300' },
  5: { emoji: '👑', gradient: 'from-purple-400 to-purple-600',  ring: 'ring-purple-300' },
};

export default function LearningJourney() {
  const { states, getProgress, isLoading } = useAllComicProgress();
  const unlockStatuses = useMemo(() => getAllUnlockStatuses(states), [states]);

  useEffect(() => {
    if (!isLoading) {
      console.log('[Dashboard] Learning Journey Loaded', {
        comicCount: comics.length,
        progressCount: states.length,
      });
    }
  }, [isLoading, states]);

  // Find the first comic the user can continue (unlocked, not completed)
  const continueComic = useMemo(() => {
    return comics.find((c) => {
      const status = unlockStatuses.get(c.id);
      const progress = getProgress(c.id);
      return status === 'UNLOCKED' && !progress?.isCompleted;
    });
  }, [unlockStatuses, getProgress]);

  if (isLoading) {
    return <JourneySkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
            Petualangan Belajar
          </p>
          <h2 className="mt-0.5 text-xl font-bold text-neutral-900">Komik Saya 📚</h2>
        </div>
        {continueComic && (
          <Link
            href={`/comic/${continueComic.id}/cover`}
            className="flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-700 transition-colors"
          >
            Lanjutkan <span>▶</span>
          </Link>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-neutral-200 -z-0" />

        <div className="space-y-4">
          {comics.map((comic, index) => {
            const progress = getProgress(comic.id);
            const percentage = progress?.percentage ?? 0;
            const isCompleted = progress?.isCompleted ?? false;
            const unlockStatus = unlockStatuses.get(comic.id) ?? 'LOCKED';
            const isLocked = unlockStatus === 'LOCKED';
            const isComingSoon = unlockStatus === 'COMING_SOON';
            const theme = COMIC_THEME[comic.id] ?? COMIC_THEME[1];

            return (
              <ComicCard
                key={comic.id}
                comic={comic}
                index={index}
                percentage={percentage}
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
    </div>
  );
}

// ─── Comic Card ──────────────────────────────────────────────────────────────

interface ComicCardProps {
  comic: Comic;
  index: number;
  percentage: number;
  isCompleted: boolean;
  isLocked: boolean;
  isComingSoon: boolean;
  theme: { emoji: string; gradient: string; ring: string };
  unlockStatus: UnlockStatus;
}

function ComicCard({
  comic,
  index,
  percentage,
  isCompleted,
  isLocked,
  isComingSoon,
  theme,
}: ComicCardProps) {
  const disabled = isLocked || isComingSoon;

  return (
    <div className="relative flex gap-4">
      {/* Step bubble */}
      <div className="relative z-10 flex-shrink-0">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full text-xl shadow-sm ring-4 ring-white
            ${disabled
              ? 'bg-neutral-200 grayscale'
              : isCompleted
                ? `bg-gradient-to-br ${theme.gradient}`
                : `bg-gradient-to-br ${theme.gradient} opacity-90`
            }`}
        >
          {isCompleted ? '✅' : disabled ? '🔒' : theme.emoji}
        </div>
        {/* Step number badge */}
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-neutral-500 shadow-sm ring-1 ring-neutral-200">
          {index + 1}
        </span>
      </div>

      {/* Card body */}
      <div
        className={`flex-1 rounded-2xl border p-4 shadow-sm transition-all
          ${disabled
            ? 'border-neutral-200 bg-white opacity-60'
            : isCompleted
              ? 'border-accent-200 bg-accent-50'
              : 'border-primary-200 bg-white'
          }`}
      >
        {/* Top row: title + badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3
                className={`font-bold leading-snug ${
                  disabled ? 'text-neutral-400' : 'text-neutral-900'
                }`}
              >
                {comic.title}
              </h3>
            </div>
            <p className={`mt-0.5 text-xs ${disabled ? 'text-neutral-400' : 'text-neutral-500'}`}>
              {comic.subtitle} · Kelas {comic.kelas} · {comic.lokasi}
            </p>
          </div>

          {/* Status badge */}
          <StatusBadge
            isCompleted={isCompleted}
            isComingSoon={isComingSoon}
            isLocked={isLocked}
            percentage={percentage}
          />
        </div>

        {/* Progress bar — only for unlocked */}
        {!disabled && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">
                Progress
              </span>
              <span className="text-xs font-bold text-neutral-600">{percentage}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-neutral-100 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  isCompleted
                    ? 'bg-gradient-to-r from-accent-400 to-accent-500'
                    : 'bg-gradient-to-r from-primary-400 to-primary-600'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* CTA button */}
        <div className="mt-4">
          {disabled ? (
            <div
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold cursor-not-allowed
                ${isComingSoon
                  ? 'bg-warning-100 text-warning-600'
                  : 'bg-neutral-100 text-neutral-400'
                }`}
            >
              {isComingSoon ? '🚧 Segera Hadir' : '🔒 Terkunci'}
            </div>
          ) : isCompleted ? (
            <Link
              href={`/comic/${comic.id}/cover`}
              className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-accent-600 transition-colors"
            >
              ✅ Ulangi
            </Link>
          ) : percentage > 0 ? (
            <Link
              href={`/comic/${comic.id}/cover`}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-700 transition-colors"
            >
              ▶ Lanjutkan
            </Link>
          ) : (
            <Link
              href={`/comic/${comic.id}/cover`}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-700 transition-colors"
            >
              🚀 Mulai
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({
  isCompleted,
  isComingSoon,
  isLocked,
  percentage,
}: {
  isCompleted: boolean;
  isComingSoon: boolean;
  isLocked: boolean;
  percentage: number;
}) {
  if (isCompleted) {
    return (
      <span className="flex-shrink-0 rounded-full bg-accent-100 px-2.5 py-1 text-[10px] font-bold text-accent-700">
        Selesai ✓
      </span>
    );
  }
  if (isComingSoon) {
    return (
      <span className="flex-shrink-0 rounded-full bg-warning-100 px-2.5 py-1 text-[10px] font-bold text-warning-700">
        Segera
      </span>
    );
  }
  if (isLocked) {
    return (
      <span className="flex-shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold text-neutral-500">
        Terkunci
      </span>
    );
  }
  if (percentage > 0) {
    return (
      <span className="flex-shrink-0 rounded-full bg-primary-100 px-2.5 py-1 text-[10px] font-bold text-primary-700">
        Berlangsung
      </span>
    );
  }
  return (
    <span className="flex-shrink-0 rounded-full bg-secondary-100 px-2.5 py-1 text-[10px] font-bold text-secondary-700">
      Baru
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function JourneySkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-36 rounded-full bg-neutral-200 animate-pulse" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="h-12 w-12 rounded-full bg-neutral-200 animate-pulse flex-shrink-0" />
          <div className="flex-1 h-32 rounded-2xl bg-neutral-200 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
