'use client';

import { useState } from 'react';
import type { ComicDocument } from '@/types/firestore';
import type { StudentRow } from '../types';
import { getModuleRosterSummary } from '../services/moduleAnalytics';
import { Card, ProgressBar, Skeleton } from './ui';
import { ModuleDetail } from './ModuleDetail';

interface Props {
  comics: ComicDocument[];
  rows: StudentRow[];
  loading: boolean;
  initialComicId?: number | null;
}

export function ModuleDirectory({ comics, rows, loading, initialComicId = null }: Props) {
  const [selectedComicId, setSelectedComicId] = useState<number | null>(initialComicId);

  if (selectedComicId !== null) {
    const comic = comics.find((item) => item.comicId === selectedComicId);
    if (comic) {
      return <ModuleDetail comic={comic} onBack={() => setSelectedComicId(null)} />;
    }
  }

  return (
    <div className="space-y-3">
      <header className="px-1">
        <h2 className="text-lg font-black text-neutral-900">Modul CINARAI</h2>
        <p className="mt-0.5 text-xs text-neutral-600">Progress kelas dihitung dari seluruh roster; data yang belum tersedia dibedakan dari tahap tuntas.</p>
      </header>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-2xl" />)}
        </div>
      ) : comics.length === 0 ? (
        <Card className="p-5 text-sm text-neutral-600">Katalog komik belum tersedia.</Card>
      ) : (
        <div className="space-y-2">
          {comics.map((comic) => {
            const summary = getModuleRosterSummary(rows, comic.comicId);
            return (
              <button
                type="button"
                key={comic.id ?? comic.comicId}
                onClick={() => setSelectedComicId(comic.comicId)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-left transition hover:border-primary-200 hover:bg-primary-50/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-sm font-bold text-neutral-900">{comic.title}</span>
                  <span className="flex-shrink-0 text-xs font-bold text-primary-700">
                    {summary.averageProgress === null ? '—' : `${summary.averageProgress}%`}
                  </span>
                </span>
                <span className="mt-2 flex items-center gap-2">
                  <ProgressBar value={summary.averageProgress ?? 0} className="flex-1" />
                  <span className="w-24 flex-shrink-0 text-right text-[10px] text-neutral-500">
                    {summary.progressRecordCount}/{rows.length} siswa
                  </span>
                  <span className="text-neutral-400" aria-hidden="true">›</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
