"use client";

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchAllComics } from '@/services/comicFirestoreService';
import { useAllComicProgress } from '@/hooks/useAllComicProgress';
import { getAllUnlockStatuses } from '@/lib/unlockEngine';
import { useSnackbar } from '@/context/SnackbarContext';
import type { Comic } from '@/types/comic';

const COMIC_DIFFICULTY: Record<number, string> = {
  1: 'Menengah',
  2: 'Menengah',
  3: 'Mudah',
  4: 'Menengah',
  5: 'Mudah',
};

export default function LearningJourney() {
  const { states, getProgress, resetProgressForComic, isLoading } = useAllComicProgress();
  const { showSnackbar } = useSnackbar();
  const [comics, setComics] = useState<Comic[]>([]);
  const [comicsLoading, setComicsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [pendingResetComicId, setPendingResetComicId] = useState<number | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const unlockStatuses = useMemo(() => getAllUnlockStatuses(states), [states]);

  useEffect(() => {
    fetchAllComics()
      .then(setComics)
      .catch(() => setComics([]))
      .finally(() => setComicsLoading(false));
  }, []);

  const handleRequestReset = useCallback((id: number) => {
    setPendingResetComicId(id);
  }, []);

  const filteredComics = useMemo(() => {
    return comics.filter((comic) => {
      // Search filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        if (!comic.title.toLowerCase().includes(query)) return false;
      }

      // Class filter
      if (selectedClass !== 'Semua') {
        const classNum = selectedClass.replace('Kelas ', '').trim();
        if (comic.kelas.toLowerCase() !== classNum.toLowerCase() && comic.kelas !== classNum) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'Semua') {
        const progress = getProgress(comic.id);
        const percentage = progress?.percentage ?? 0;
        const isCompleted = progress?.isCompleted ?? false;

        if (statusFilter === 'Berlangsung' && (percentage === 0 || isCompleted)) {
          return false;
        }
        if (statusFilter === 'Belum Mulai' && (percentage > 0 || isCompleted)) {
          return false;
        }
        if (statusFilter === 'Selesai' && !isCompleted) {
          return false;
        }
      }

      return true;
    });
  }, [comics, searchQuery, selectedClass, statusFilter, getProgress]);

  if (isLoading || comicsLoading) {
    return <JourneySkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* 2. Search & Filter Bar */}
      <div className="space-y-3">
        {/* Search input + Filter button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <svg
              viewBox="0 0 24 24"
              className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#94A3B8]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari komik..."
              className="w-full rounded-full border border-[#E2E8F0] bg-white py-2.5 pl-10 pr-4 text-[14px] text-[#1E293B] placeholder-[#94A3B8] shadow-sm outline-none transition focus:border-[#0DBF7E]"
            />
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-white px-4 py-2.5 text-[14px] font-semibold text-[#0DBF7E] shadow-sm transition hover:bg-slate-50"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="7" y1="12" x2="17" y2="12" />
              <line x1="10" y1="18" x2="14" y2="18" />
            </svg>
            <span>Filter</span>
          </button>
        </div>

        {/* Horizontal Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-[13px] font-medium">
          {['Semua', 'Kelas IV', 'Kelas V', 'Kelas VI'].map((cls) => (
            <button
              key={cls}
              type="button"
              onClick={() => setSelectedClass(cls)}
              className={`shrink-0 rounded-full px-4 py-1.5 transition ${
                selectedClass === cls
                  ? 'bg-[#0DBF7E] font-bold text-white shadow-sm'
                  : 'border border-[#E2E8F0] bg-white text-[#475569] hover:bg-slate-50'
              }`}
            >
              {cls}
            </button>
          ))}

          {/* Status Filter Dropdown Chip */}
          <div className="relative shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-full border border-[#E2E8F0] bg-white py-1.5 pl-4 pr-8 text-[13px] font-medium text-[#475569] shadow-sm outline-none transition focus:border-[#0DBF7E]"
            >
              <option value="Semua">Berlangsung ∨</option>
              <option value="Berlangsung">Berlangsung</option>
              <option value="Belum Mulai">Belum Mulai</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section Header & Sort Row */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="text-[16px] font-bold text-[#1E293B]">Semua Komik</h2>
        <div className="flex items-center gap-1 text-[13px] font-medium text-[#64748B]">
          <span>Urutkan:</span>
          <span className="font-semibold text-[#1E293B]">Terbaru ∨</span>
        </div>
      </div>

      {/* 3. Comic Cards List */}
      <div className="space-y-4">
        {filteredComics.map((comic, index) => {
          const progress = getProgress(comic.id);
          const percentage = progress?.percentage ?? 0;
          const isCompleted = progress?.isCompleted ?? false;
          const unlockStatus = unlockStatuses.get(comic.id) ?? 'UNLOCKED';
          const isLocked = unlockStatus === 'LOCKED';
          const completedCount = progress?.completedCount ?? 0;
          const totalStages = 8;
          const sequenceNumber = index + 1;
          const difficulty = COMIC_DIFFICULTY[comic.id] ?? 'Menengah';

          return (
            <ComicCard
              key={comic.id}
              sequenceNumber={sequenceNumber}
              comic={comic}
              percentage={percentage}
              isCompleted={isCompleted}
              isLocked={isLocked}
              completedCount={completedCount}
              totalStages={totalStages}
              difficulty={difficulty}
              onRequestReset={handleRequestReset}
              isResetting={isResetting && pendingResetComicId === comic.id}
            />
          );
        })}
      </div>

      {/* Reset confirmation modal */}
      {pendingResetComicId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-[#1E293B]">Ulangi Komik? 🔄</h3>
            <p className="mt-2 text-sm text-[#64748B]">
              Semua progres tahap pada komik ini akan diulang dari awal.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setPendingResetComicId(null)}
                className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-semibold text-[#475569] hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={async () => {
                  if (pendingResetComicId === null) return;
                  setIsResetting(true);
                  try {
                    await resetProgressForComic(pendingResetComicId);
                    showSnackbar('Progres berhasil diulang!', 'success');
                    setPendingResetComicId(null);
                  } catch {
                    showSnackbar('Gagal mengulang progres.', 'error');
                  } finally {
                    setIsResetting(false);
                  }
                }}
                className="rounded-xl bg-[#0DBF7E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0AA86E]"
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

// ─── Comic Card Component ───────────────────────────────────────────────────

interface ComicCardProps {
  sequenceNumber: number;
  comic: Comic;
  percentage: number;
  isCompleted: boolean;
  isLocked: boolean;
  completedCount: number;
  totalStages: number;
  difficulty: string;
  onRequestReset: (id: number) => void;
  isResetting: boolean;
}

const ComicCard = React.memo(function ComicCard({
  sequenceNumber,
  comic,
  percentage,
  isCompleted,
  isLocked,
  completedCount,
  totalStages,
  difficulty,
}: ComicCardProps) {
  const cardHref = `/comic/${comic.id}/learn`;
  const [hasImageError, setHasImageError] = useState(false);

  React.useEffect(() => {
    setHasImageError(false);
  }, [comic.cover]);

  let statusBadge = (
    <span className="rounded-full bg-[#E0F2FE] px-3 py-1 text-[12px] font-bold text-[#1D93FF]">
      Berlangsung
    </span>
  );

  if (isLocked) {
    statusBadge = (
      <span className="flex items-center gap-1 rounded-full bg-[#F3E8FF] px-3 py-1 text-[12px] font-bold text-[#9333EA]">
        <span>Terkunci</span>
        <svg viewBox="0 0 24 24" className="h-[12px] w-[12px]" fill="currentColor">
          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
        </svg>
      </span>
    );
  } else if (isCompleted) {
    statusBadge = (
      <span className="rounded-full bg-[#DCFCE7] px-3 py-1 text-[12px] font-bold text-[#16A34A]">
        Selesai
      </span>
    );
  } else if (percentage === 0) {
    statusBadge = (
      <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-[12px] font-bold text-[#64748B]">
        Belum Mulai
      </span>
    );
  }

  return (
    <article className="overflow-hidden rounded-[24px] border border-slate-100 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-all hover:shadow-[0_14px_36px_rgba(15,23,42,0.09)]">
      <div className="flex items-start gap-3">
        {/* Cover Thumbnail with Sequence Badge */}
        <div className="relative shrink-0">
          <div className="absolute -left-1 -top-1 z-20 flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#1D93FF] text-[12px] font-bold text-white shadow-md">
            {sequenceNumber}
          </div>
          <div className="h-[122px] w-[92px] overflow-hidden rounded-[20px] shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
            {!hasImageError ? (
              <Image
                src={comic.cover}
                alt={comic.title}
                width={92}
                height={122}
                className="h-full w-full object-cover object-center"
                onError={() => setHasImageError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#F8FAFC] px-2 text-center text-[11px] font-semibold text-[#475569]">
                Gambar tidak tersedia
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[15px] font-bold leading-tight text-[#1E293B] line-clamp-2">
              {comic.title}
            </h3>
            <div className="shrink-0">{statusBadge}</div>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
            <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[#475569]">
              Kelas {comic.kelas}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 font-semibold ${
                difficulty === 'Mudah'
                  ? 'bg-[#DCFCE7] text-[#15803D]'
                  : 'bg-[#FEF3C7] text-[#D97706]'
              }`}
            >
              {difficulty}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[#64748B]">
              <svg viewBox="0 0 24 24" className="h-[12px] w-[12px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{comic.estimatedMinutes} menit</span>
            </span>
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-medium text-[#64748B]">Progress</span>
              <span className="font-bold text-[#0DBF7E]">{percentage}%</span>
            </div>
            <div className="mt-1 h-[7px] w-full overflow-hidden rounded-full bg-[#EEF4FB]">
              <div
                className="h-full rounded-full bg-[#0DBF7E] transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="text-[11px] font-medium text-[#64748B]">
              <span>{completedCount} dari {totalStages} tahap selesai</span>
            </div>

            <div>
              {percentage > 0 ? (
                <Link
                  href={cardHref}
                  className="inline-flex items-center justify-center rounded-full bg-[#0DBF7E] px-4 py-1.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#0AA86E] active:scale-95"
                >
                  Lanjutkan
                </Link>
              ) : (
                <Link
                  href={cardHref}
                  className="inline-flex items-center justify-center rounded-full border-2 border-[#0DBF7E] bg-white px-4 py-1.5 text-[13px] font-bold text-[#0DBF7E] transition hover:bg-[#F0FDF4] active:scale-95"
                >
                  Mulai
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
});

// ─── Skeleton ───────────────────────────────────────────────────────────────

function JourneySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-3xl bg-white p-4 shadow-sm border border-slate-100 flex gap-4 animate-pulse">
          <div className="h-[110px] w-[100px] rounded-2xl bg-slate-200 shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-5 w-3/4 rounded-full bg-slate-200" />
            <div className="h-4 w-1/2 rounded-full bg-slate-200" />
            <div className="h-2.5 w-full rounded-full bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
