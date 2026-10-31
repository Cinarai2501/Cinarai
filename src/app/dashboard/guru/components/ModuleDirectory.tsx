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
}

export function ModuleDirectory({ comics, rows, loading }: Props) {
  const [selectedComicId, setSelectedComicId] = useState<number | null>(null);

  if (selectedComicId !== null) {
    const comic = comics.find((item) => item.comicId === selectedComicId);
    if (comic) {
      return <ModuleDetail comic={comic} onBack={() => setSelectedComicId(null)} />;
    }
  }

  return (
    <div className="space-y-3">
      <header className="px-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Materi belajar</p>
        <h2 className="text-lg font-black text-neutral-900">Modul CINARAI</h2>
        <p className="mt-0.5 text-sm text-neutral-600">Pantau kemajuan siswa berdasarkan data tahap belajar dan asesmen yang tersimpan.</p>
      </header>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-2xl" />)}
        </div>
      ) : comics.length === 0 ? (
        <Card className="p-5 text-sm text-neutral-600">Katalog komik belum tersedia.</Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {comics.map((comic) => {
            const summary = getModuleRosterSummary(rows, comic.comicId);
            return (
              <Card key={comic.id ?? comic.comicId} className="p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-sm font-black text-primary-700">
                    {comic.comicId}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words text-sm font-bold text-neutral-900">{comic.title}</h3>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-neutral-600">
                      {comic.synopsis || comic.subtitle || 'Deskripsi modul belum tersedia di katalog.'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <Metric label="Mulai" value={summary.startedCount} />
                  <Metric label="Belajar" value={summary.learningCount} />
                  <Metric label="Tuntas" value={summary.completedCount} />
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-600">Penyelesaian kelas</span>
                    <span className="font-bold text-primary-700">{summary.completionRate === null ? '—' : `${summary.completionRate}%`}</span>
                  </div>
                  {summary.completionRate !== null && <ProgressBar value={summary.completionRate} />}
                  {summary.completionRate === null && <p className="text-[11px] text-neutral-500">Belum ada siswa dalam cakupan.</p>}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedComicId(comic.comicId)}
                  className="mt-3 min-h-11 w-full rounded-xl bg-primary-600 px-4 text-sm font-bold text-white transition hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                >
                  Detail modul
                </button>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && comics.length > 0 && (
        <p className="px-1 text-[11px] leading-5 text-neutral-500">
          Mulai berarti terdapat progress tahap yang tersimpan; dokumen inisialisasi Cover saja tidak dihitung. Tuntas berarti seluruh tahap pada alur tersimpan selesai, dibagi seluruh siswa dalam cakupan guru. Tidak ada data progress berarti belum tersedia, bukan 0% penguasaan.
        </p>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-neutral-50 px-2 py-2">
      <p className="text-sm font-black text-neutral-900">{value}</p>
      <p className="text-[10px] font-medium text-neutral-500">{label}</p>
    </div>
  );
}
