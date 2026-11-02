'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { ComicDocument } from '@/types/firestore';
import type { StudentRow } from '../types';
import { getModuleRosterSummary } from '../services/moduleAnalytics';
import { Button, Card, EmptyState, LoadingState, ProgressBar, Skeleton } from './ui';
import { ModuleDetail } from './ModuleDetail';

const moduleCovers: Record<number, string> = {
  1: '/assets/dashboard/home/covers/cover-komik-1.png',
  2: '/assets/dashboard/home/covers/cover-komik-2.png',
  3: '/assets/dashboard/home/covers/cover-komik-3.png',
  4: '/assets/dashboard/home/covers/cover-komik-4.png',
  5: '/assets/dashboard/home/covers/cover-komik-5.png',
  6: '/comics/komik-6/cover.png',
};

interface Props {
  comics: ComicDocument[];
  rows: StudentRow[];
  loading: boolean;
  initialComicId?: number | null;
  onSelectStudent: (uid: string) => void;
}

export function ModuleDirectory({ comics, rows, loading, initialComicId = null, onSelectStudent }: Props) {
  const [selectedComicId, setSelectedComicId] = useState<number | null>(initialComicId);

  if (selectedComicId !== null) {
    const comic = comics.find((item) => item.comicId === selectedComicId);
    if (comic) {
      return (
        <ModuleDetail
          comic={comic}
          rows={rows}
          onBack={() => setSelectedComicId(null)}
          onSelectStudent={onSelectStudent}
        />
      );
    }
  }

  return (
    <div className="space-y-4">
      <header className="px-1">
        <h2 className="guru-page-title">Modul pembelajaran</h2>
        <p className="mt-1 text-sm text-secondary-content">Pantau perkembangan kelas di setiap modul.</p>
      </header>

      {loading ? (
        <LoadingState label="Memuat daftar modul">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-72 rounded-2xl" />)}
          </div>
        </LoadingState>
      ) : comics.length === 0 ? (
        <EmptyState>Belum ada modul yang tersedia.</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {comics.map((comic) => {
            const summary = getModuleRosterSummary(rows, comic.comicId);
            const cover = moduleCovers[comic.comicId];
            return (
              <Card key={comic.id ?? comic.comicId} className="overflow-hidden">
                <div className="relative aspect-[16/9] overflow-hidden bg-brand-50">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={`Cover ${comic.title || `Komik ${comic.comicId}`}`}
                      fill
                      sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center text-sm font-semibold text-secondary-content">
                      Cover belum tersedia
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 min-h-12 break-words text-base font-bold leading-6 text-ink">
                    {comic.title || `Komik ${comic.comicId}`}
                  </h3>
                  <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-secondary-content">
                    {comic.synopsis?.trim() || comic.subtitle?.trim() || 'Deskripsi modul belum tersedia.'}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-secondary-content">Progress penyelesaian kelas</p>
                    <span className="flex-shrink-0 text-sm font-black text-brand-700">
                      {summary.completionRate === null ? '—' : `${summary.completionRate}%`}
                    </span>
                  </div>
                  <ProgressBar value={summary.completionRate ?? 0} className="mt-2" />
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <SummaryMetric label="Sudah mulai" value={summary.startedCount} />
                    <SummaryMetric label="Sudah tuntas" value={summary.completedCount} />
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setSelectedComicId(comic.comicId)}
                    className="mt-3 w-full"
                  >
                    Detail Modul
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-canvas px-3 py-2">
      <p className="text-base font-black text-ink">{value}</p>
      <p className="text-[11px] text-secondary-content">{label}</p>
    </div>
  );
}
