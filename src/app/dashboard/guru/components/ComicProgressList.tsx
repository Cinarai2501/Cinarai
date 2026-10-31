'use client';

import Link from 'next/link';
import { Card, ProgressBar, Skeleton } from './ui';
import type { ComicDocument } from '@/types/firestore';
import type { StudentRow } from '../types';

interface Props {
  comics: ComicDocument[];
  rows: StudentRow[];
  loading: boolean;
  compact?: boolean;
  onOpenModules?: () => void;
}

export function ComicProgressList({ comics, rows, loading, compact = false, onOpenModules }: Props) {
  const displayedComics = comics.slice(0, 6);

  return (
    <Card className={compact ? 'p-4' : 'p-4 sm:p-5'}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Modul belajar</p>
          <h2 className="text-base font-black text-neutral-900">Progress komik</h2>
        </div>
        {onOpenModules && (
          <button
            type="button"
            onClick={onOpenModules}
            className="min-h-11 flex-shrink-0 rounded-xl px-2 text-xs font-bold text-primary-700 hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
          >
            Menu Modul <span aria-hidden="true">→</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: compact ? 3 : 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10 rounded-xl" />
          ))}
        </div>
      ) : displayedComics.length === 0 ? (
        <p className="rounded-xl bg-neutral-50 px-3 py-4 text-sm text-neutral-600">
          Data komik belum tersedia.
        </p>
      ) : (
        <>
          <ul className={compact ? 'space-y-2.5' : 'grid gap-2.5 sm:grid-cols-2'}>
            {displayedComics.map((comic) => {
              const progressValues = rows.flatMap((student) => {
                const progress = student.progressList.find((item) => item.comicId === comic.comicId);
                return progress && Number.isFinite(progress.percentage) ? [progress.percentage] : [];
              });
              const average = progressValues.length
                ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length)
                : null;

              return (
                <li key={comic.id ?? comic.comicId}>
                  <Link
                    href={`/comic/${comic.comicId}`}
                    className="block rounded-xl border border-neutral-100 px-3 py-2.5 transition hover:border-primary-200 hover:bg-primary-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-sm font-semibold text-neutral-800">
                        {comic.title || `Komik ${comic.comicId}`}
                      </span>
                      <span className="flex-shrink-0 text-xs font-bold text-primary-700">
                        {average === null ? 'Belum ada data' : `${average}%`}
                      </span>
                    </div>
                    {average !== null ? (
                      <div className="mt-2 flex items-center gap-2">
                        <ProgressBar value={average} className="flex-1" />
                        <span className="whitespace-nowrap text-[10px] text-neutral-500">
                          {progressValues.length}/{rows.length} siswa
                        </span>
                      </div>
                    ) : (
                      <p className="mt-1 text-[11px] text-neutral-500">
                        Belum ada progress tersimpan
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          {comics.length > 6 && (
            <p className="mt-2 text-xs text-neutral-500">Menampilkan 6 dari {comics.length} komik.</p>
          )}
          {!compact && (
            <p className="mt-3 text-xs text-neutral-500">
              Rata-rata dihitung dari progress yang tersimpan untuk komik tersebut.
            </p>
          )}
        </>
      )}
    </Card>
  );
}
