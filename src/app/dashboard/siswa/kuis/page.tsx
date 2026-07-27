'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { getAllComics } from '@/lib/comicRepository';
import { getAllUnlockStatuses } from '@/lib/unlockEngine';
import { useAllComicProgress } from '@/hooks/useAllComicProgress';

export default function DashboardSiswaKuisPage() {
  const { states, getProgress, isLoading } = useAllComicProgress();
  const comics = useMemo(() => getAllComics(), []);
  const unlockStatuses = useMemo(() => getAllUnlockStatuses(states), [states]);

  const availableComics = comics.filter((comic) => unlockStatuses.get(comic.id) !== 'COMING_SOON');

  return (
    <div className="space-y-4 pb-6">
      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">Kuis</p>
        <h1 className="mt-3 text-2xl font-black text-neutral-900">Latihan dan evaluasi</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">Pilih modul untuk melihat tugas kuis, kemajuan, dan hasil terakhir. Kuis berada di dalam setiap komik dan membantu mengukur pemahamanmu.</p>
      </section>

      <div className="space-y-4">
        {isLoading ? (
          [1, 2, 3].map((index) => (
            <div key={index} className="h-28 rounded-[28px] bg-neutral-100 animate-pulse" />
          ))
        ) : (
          availableComics.map((comic) => {
            const progress = getProgress(comic.id);
            const percentage = progress?.percentage ?? 0;
            const completed = progress?.isCompleted ?? false;

            return (
              <div key={comic.id} className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-black text-neutral-900">{comic.title}</h2>
                    <p className="mt-1 text-sm text-neutral-500">Kelas {comic.kelas} • {comic.estimatedMinutes} menit</p>
                  </div>
                  <div className="rounded-3xl bg-primary-50 px-3 py-2 text-xs font-black text-primary-700">Kuis</div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900">Progress kuis</p>
                    <div className="mt-2 h-3 rounded-full bg-neutral-100 overflow-hidden">
                      <div className="h-3 rounded-full bg-gradient-to-r from-primary-500 to-primary-700" style={{ width: `${percentage}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-neutral-500">{percentage}% selesai</p>
                  </div>
                  <Link href={`/comic/${comic.id}/learn`} className="rounded-3xl bg-primary-600 px-4 py-3 text-sm font-black text-white transition hover:bg-primary-700">
                    {completed ? 'Tinjau' : 'Mulai'}
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
