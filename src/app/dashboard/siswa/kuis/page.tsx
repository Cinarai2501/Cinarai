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

  const availableComics = useMemo(
    () => comics.filter((comic) => unlockStatuses.get(comic.id) !== 'COMING_SOON'),
    [comics, unlockStatuses],
  );

  return (
    <div className="space-y-4 pb-28">
      <section className="rounded-[32px] bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-600">Kuis</p>
        <h1 className="mt-3 text-2xl font-black text-neutral-900">Evaluasi dan latihan</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">Lihat status kuis per modul dan nilai terakhir dengan tampilan yang mudah dibaca.</p>
      </section>

      <div className="space-y-4">
        {isLoading ? (
          [1, 2, 3].map((index) => (
            <div key={index} className="h-36 rounded-[28px] bg-neutral-100 animate-pulse" />
          ))
        ) : (
          availableComics.map((comic) => {
            const progress = getProgress(comic.id);
            const percentage = progress?.percentage ?? 0;
            const completed = progress?.isCompleted ?? false;
            const status = completed ? 'Selesai' : percentage > 0 ? 'Berlangsung' : 'Belum dimulai';

            return (
              <div key={comic.id} className="rounded-[32px] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-black text-neutral-900">{comic.title}</h2>
                    <p className="mt-1 text-sm text-neutral-500">Kelas {comic.kelas} • {comic.estimatedMinutes} menit</p>
                  </div>
                  <span className="rounded-3xl bg-primary-50 px-3 py-2 text-xs font-black text-primary-700">{status}</span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Stat label="Progress" value={`${percentage}%`} />
                  <Stat label="Nilai terakhir" value={completed ? 'Selesai' : '-'} />
                  <Stat label="Riwayat" value={percentage > 0 ? 'Dibuka' : 'Belum ada'} />
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link href={`/comic/${comic.id}/learn`} className="inline-flex flex-1 items-center justify-center rounded-3xl bg-primary-600 px-4 py-3 text-sm font-black text-white transition hover:bg-primary-700">
                    {completed ? 'Tinjau' : 'Mulai'}
                  </Link>
                  <Link href={`/comic/${comic.id}/learn`} className="inline-flex flex-1 items-center justify-center rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-black text-neutral-900 transition hover:bg-neutral-100">
                    Ulangi
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-neutral-50 p-4 text-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-400">{label}</p>
      <p className="mt-3 font-black text-neutral-900">{value}</p>
    </div>
  );
}
