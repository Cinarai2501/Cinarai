"use client";

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchAllComics } from '@/services/comicFirestoreService';
import { useAllComicProgress } from '@/hooks/useAllComicProgress';
import { useSnackbar } from '@/context/SnackbarContext';
import type { Comic } from '@/types/comic';

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
  const { getProgress, resetProgressForComic, isLoading } = useAllComicProgress();
  const { showSnackbar } = useSnackbar();
  const [comics, setComics] = useState<Comic[]>([]);
  const [comicsLoading, setComicsLoading] = useState(true);
  const [pendingResetComicId, setPendingResetComicId] = useState<number | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const pendingComic = useMemo(() => comics.find((comic) => comic.id === pendingResetComicId) ?? null, [comics, pendingResetComicId]);

  const handleRequestReset = useCallback((id: number) => {
    setPendingResetComicId(id);
  }, [setPendingResetComicId]);

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
    <div className="overflow-x-hidden rounded-[28px] bg-white shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
      <div className="border-b border-neutral-100 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-neutral-400">
          Petualangan Belajar
        </p>
        <h2 className="mt-1.5 text-[18px] font-black leading-6 text-neutral-900 sm:text-lg">Komik Saya 📚</h2>
      </div>

      <div className="space-y-3 px-3 pb-3 pt-3 sm:space-y-4 sm:px-4 sm:pb-4 sm:pt-4">
        {comics.map((comic) => {
          const progress = getProgress(comic.id);
          const percentage = progress?.percentage ?? 0;
          const isCompleted = progress?.isCompleted ?? false;
          const theme = COMIC_THEME[comic.id] ?? DEFAULT_THEME;

          return (
            <ComicCard
              key={comic.id}
              comic={comic}
              percentage={percentage}
              isCompleted={isCompleted}
              theme={theme}
              onRequestReset={handleRequestReset}
              isResetting={isResetting && pendingResetComicId === comic.id}
              canReset={percentage > 0 || isCompleted}
            />
          );
        })}
      </div>

      {pendingResetComicId !== null && pendingComic && (
        <div className="border-t border-neutral-100 bg-neutral-50/70 px-5 py-4">
          <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm">
            <h3 className="text-base font-black text-neutral-900">Ulangi Petualangan? 🔄</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Kamu akan mengulang petualangan dari awal. Semua tahap akan kembali ke awal, tetapi kamu bisa belajar lagi kapan saja.
            </p>
            {isResetting && (
              <div className="mt-3 flex items-center gap-2 rounded-2xl bg-primary-50 px-3 py-2.5">
                <div className="h-4 w-4 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin flex-shrink-0" />
                <span className="text-sm font-semibold text-primary-700">Mengatur ulang petualangan...</span>
              </div>
            )}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setPendingResetComicId(null)}
                className="inline-flex h-11 items-center justify-center rounded-[14px] border border-neutral-200 bg-white px-5 text-sm font-black text-neutral-700 transition hover:bg-neutral-50 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={async () => {
                  if (pendingResetComicId === null || isResetting) return;
                  setIsResetting(true);
                  try {
                    await resetProgressForComic(pendingResetComicId);
                    showSnackbar('Petualangan berhasil diulang. Selamat belajar kembali! 🎉', 'success');
                    setPendingResetComicId(null);
                  } catch {
                    showSnackbar('Tidak dapat mengatur ulang progres. Silakan coba lagi.', 'error');
                  } finally {
                    setIsResetting(false);
                  }
                }}
                className="inline-flex h-11 items-center justify-center rounded-[14px] bg-primary-600 px-5 text-sm font-black text-white shadow-md transition hover:bg-primary-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isResetting ? 'Mengulang...' : 'Ya, Ulangi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Comic Card ───────────────────────────────────────────────────────────────

interface ComicCardProps {
  comic: Comic;
  percentage: number;
  isCompleted: boolean;
  theme: typeof DEFAULT_THEME;
  onRequestReset: (id: number) => void;
  isResetting: boolean;
  canReset: boolean;
}
const ComicCard = React.memo(function ComicCard({
  comic,
  percentage,
  isCompleted,
  theme,
  onRequestReset,
  isResetting,
  canReset,
}: ComicCardProps) {
  const router = useRouter();
  const cardHref = `/comic/${comic.id}/learn`;
  const handleCardClick = useCallback(() => {
    router.push(cardHref);
  }, [cardHref, router]);

  const handleCardKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        router.push(cardHref);
      }
    },
    [cardHref, router]
  );

  return (
    <div
      className="relative w-full max-w-full overflow-hidden rounded-[22px] border border-neutral-100 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition hover:shadow-[0_14px_40px_rgba(15,23,42,0.10)] sm:p-4"
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      {/* Desktop: badge absolute top-right. Mobile: badge shown inline under title */}
      <div className="hidden sm:block absolute top-4 right-4">
        <StatusBadge isCompleted={isCompleted} percentage={percentage} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="relative flex-shrink-0 self-center overflow-hidden rounded-[12px] bg-slate-100 shadow-md sm:self-start sm:rounded-[22px]">
          <div className="relative h-24 w-24 max-w-full sm:h-[120px] sm:w-[120px]">
            <Image
              src={comic.cover}
              alt={comic.title}
              fill
              sizes="(max-width: 640px) 112px, 120px"
              className="object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        </div>

        <div className="min-w-0 flex-1 w-full max-w-full">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <h3 className="min-w-0 w-full break-words text-[17px] font-black leading-6 text-neutral-900 line-clamp-2 sm:text-[20px] sm:leading-7">
              {comic.title}
            </h3>
            <div className="sm:hidden">
              <StatusBadge isCompleted={isCompleted} percentage={percentage} />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500 sm:text-sm">
              Kelas {comic.kelas}
            </span>
            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${theme.difficultyColor} sm:text-[12px]`}>
              {theme.difficulty}
            </span>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500 sm:text-sm">
              {comic.estimatedMinutes} mnt
            </span>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-semibold tracking-[0.14em] text-neutral-500 sm:text-sm">Progress</span>
              <span className="flex items-center">
                <span className={`inline-flex h-7 shrink-0 items-center justify-center rounded-full px-3 text-[12px] font-black sm:text-sm ${
                  isCompleted ? 'bg-accent-100 text-accent-700' : 'bg-primary-100 text-primary-700'
                }`}>
                  {percentage}%
                </span>
              </span>
            </div>

            <div className="mt-2 flex items-center">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100 sm:h-3.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCompleted
                      ? 'bg-gradient-to-r from-accent-400 to-accent-500'
                      : 'bg-gradient-to-r from-primary-500 to-primary-700'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-end">
          <div className="w-full sm:w-auto">
            <CtaButton
              comicId={comic.id}
              isCompleted={isCompleted}
              percentage={percentage}
              accentClass={theme.accent}
            />
          </div>
          {canReset && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRequestReset(comic.id);
              }}
              disabled={isResetting}
              className="inline-flex h-11 w-full max-w-full items-center justify-center rounded-[12px] border border-neutral-200 bg-white px-4 text-sm font-black text-neutral-700 shadow-sm transition hover:border-primary-200 hover:text-primary-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed sm:w-auto"
            >
              Ulangi
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// ─── CTA Button ───────────────────────────────────────────────────────────────

const CtaButton = React.memo(function CtaButton({
  comicId, isCompleted, percentage, accentClass,
}: {
  comicId: number;
  isCompleted: boolean;
  percentage: number;
  accentClass: string;
}) {
  // Semua komik (belum mulai maupun sedang berlangsung) masuk ke /learn.
  // LearningEngine membaca stage dari Firestore dan menampilkan stage yang tepat.
  const continueHref = `/comic/${comicId}/learn`;

  if (isCompleted) {
    return (
      <Link
        href={`/comic/${comicId}/learn`}
        className="inline-flex h-11 w-full max-w-full items-center justify-center gap-2 rounded-[14px] bg-accent-500 px-5 text-sm font-black text-white shadow-md transition-all hover:brightness-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-200"
      >
        ✅ Lihat Hasil
      </Link>
    );
  }
  if (percentage > 0) {
    return (
      <Link
        href={continueHref}
        className={`inline-flex h-11 w-full max-w-full items-center justify-center gap-2 rounded-[14px] ${accentClass} px-5 text-sm font-black text-white shadow-md transition-all hover:brightness-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-200`}
      >
        ▶ Lanjutkan
      </Link>
    );
  }
  return (
    <Link
      href={`/comic/${comicId}/learn`}
      className={`inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-[14px] ${accentClass} px-5 text-sm font-black text-white shadow-md hover:brightness-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all`}
    >
      🚀 Mulai Petualangan
    </Link>
  );
});

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = React.memo(function StatusBadge({
  isCompleted, percentage,
}: {
  isCompleted: boolean; percentage: number;
}) {
  if (isCompleted)   return <span className="flex-shrink-0 rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-black text-accent-700">Selesai ✓</span>;
  if (percentage > 0) return <span className="flex-shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-black text-primary-700">Berlangsung</span>;
  return               <span className="flex-shrink-0 rounded-full bg-secondary-100 px-2 py-0.5 text-[10px] font-black text-secondary-700">Baru</span>;
});

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
