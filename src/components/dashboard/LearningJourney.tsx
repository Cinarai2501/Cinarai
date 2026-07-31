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
  const handleCardClick = useCallback(() => router.push(cardHref), [cardHref, router]);

  // New card structure strictly following blueprint visual hierarchy.
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(cardHref); }}
      className="group w-full max-w-full overflow-hidden rounded-[20px] border border-neutral-100 bg-white p-4 shadow-[0_12px_36px_rgba(15,23,42,0.08)] transition-colors hover:shadow-[0_18px_48px_rgba(15,23,42,0.10)] sm:p-5"
    >
      <div className="flex items-start gap-4">
        {/* Cover area: fixed square left */}
        <div className="relative flex-shrink-0 rounded-[12px] overflow-hidden bg-slate-100 shadow-sm" style={{ width: 104, height: 136 }}>
          <Image src={comic.cover} alt={comic.title} fill sizes="104px" className="object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        </div>

        {/* Main content column */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start">
            <h3 className="min-w-0 mr-3 text-[20px] font-black leading-[24px] text-neutral-900 line-clamp-2">
              {comic.title}
            </h3>

            {/* Badge positioned to top-right visually */}
            <div className="ml-auto flex-shrink-0">
              <StatusBadge isCompleted={isCompleted} percentage={percentage} />
            </div>
          </div>

          {/* metadata row: Kelas | Difficulty | Duration */}
          <div className="mt-3 flex items-center gap-3 text-[13px]">
            <span className="rounded-full bg-neutral-100 px-3 py-1 font-semibold uppercase tracking-[0.14em] text-neutral-500">Kelas {comic.kelas}</span>
            <span className={`rounded-full px-3 py-1 font-semibold uppercase tracking-[0.14em] ${theme.difficultyColor}`}>{theme.difficulty}</span>
            <span className="rounded-full bg-neutral-100 px-3 py-1 font-semibold uppercase tracking-[0.14em] text-neutral-500">{comic.estimatedMinutes} mnt</span>
          </div>

          {/* progress row */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold tracking-[0.14em] text-neutral-500">Progress</span>
              <span className={`inline-flex items-center justify-center min-w-[56px] rounded-full px-3 py-1 text-[13px] font-black ${isCompleted ? 'bg-accent-100 text-accent-700' : 'bg-primary-100 text-primary-700'}`}>{percentage}%</span>
            </div>

            <div className="mt-2 w-full">
              <div className="h-3 rounded-full bg-neutral-100 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-gradient-to-r from-accent-400 to-accent-500' : 'bg-gradient-to-r from-primary-500 to-primary-700'}`} style={{ width: `${percentage}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Actions column */}
        <div className="ml-4 flex flex-col items-end gap-3">
          <div className="w-[132px]">
            <CtaButton comicId={comic.id} isCompleted={isCompleted} percentage={percentage} accentClass={theme.accent} />
          </div>
          {canReset && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onRequestReset(comic.id); }} disabled={isResetting} className="inline-flex h-10 items-center justify-center rounded-[12px] border border-neutral-200 bg-white px-3 text-sm font-black text-neutral-700 shadow-sm transition hover:border-primary-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed">
              Ulangi
            </button>
          )}
        </div>
      </div>
    </article>
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
