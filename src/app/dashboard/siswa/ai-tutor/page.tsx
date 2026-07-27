'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { getAllComics } from '@/lib/comicRepository';
import { getAllUnlockStatuses } from '@/lib/unlockEngine';
import { useAllComicProgress } from '@/hooks/useAllComicProgress';

export default function DashboardSiswaAiTutorPage() {
  const { states, getProgress, isLoading } = useAllComicProgress();
  const comics = useMemo(() => getAllComics(), []);
  const unlockStatuses = useMemo(() => getAllUnlockStatuses(states), [states]);

  const activeComic = useMemo(
    () => comics.find((comic) => unlockStatuses.get(comic.id) === 'UNLOCKED' && !(getProgress(comic.id)?.isCompleted ?? false))
      ?? comics.find((comic) => unlockStatuses.get(comic.id) === 'UNLOCKED')
      ?? null,
    [comics, getProgress, unlockStatuses],
  );

  const featuredComics = useMemo(
    () => comics.filter((comic) => unlockStatuses.get(comic.id) !== 'COMING_SOON').slice(0, 3),
    [comics, unlockStatuses],
  );

  if (isLoading) {
    return (
      <div className="space-y-4 pb-6">
        <div className="h-40 rounded-[28px] bg-neutral-100 animate-pulse" />
        <div className="space-y-3">
          <div className="h-20 rounded-[28px] bg-neutral-100 animate-pulse" />
          <div className="h-20 rounded-[28px] bg-neutral-100 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">AI Tutor</p>
        <h1 className="mt-3 text-2xl font-black text-neutral-900">Bertanya tentang komik dan bangun ruang</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">AI Tutor akan membantu kamu menjawab pertanyaan tentang materi yang ada di komik. Fokus pada bangun ruang, ciri, rumus, dan identifikasi objek.</p>
      </section>

      <section className="space-y-3 rounded-[28px] bg-white p-5 shadow-sm">
        <div className="rounded-3xl border border-primary-100 bg-primary-50 px-4 py-4 text-sm text-primary-700">
          <p className="font-black">Halo! Aku AI Tutor CINARAI.</p>
          <p className="mt-2 text-sm leading-relaxed text-primary-700/90">Tanya apa saja tentang komik yang tersedia. Jika kamu bertanya di luar topik, aku akan mengarahkanmu kembali ke materi pembelajaran.</p>
        </div>

        <div className="space-y-3">
          <div className="rounded-[24px] bg-neutral-100 px-4 py-4 text-sm text-neutral-700">
            <p className="font-black">Contoh pertanyaan</p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed">
              <li>• Apa ciri kubus yang ada di komik?</li>
              <li>• Bagaimana cara menghitung luas permukaan?</li>
              <li>• Apa bedanya limas dan kerucut?</li>
            </ul>
          </div>
          <div className="rounded-[24px] bg-neutral-100 px-4 py-4 text-sm text-neutral-700">
            <p className="font-black">AI Tutor hanya akan membahas</p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed">
              <li>• bangun ruang dan datar</li>
              <li>• ciri-ciri dan rumus</li>
              <li>• identifikasi objek komik</li>
              <li>• materi yang ada di komik</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-400">Mulai AI Tutor</p>
        <div className="mt-4 space-y-3">
          {activeComic ? (
            <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">Rekomendasi komik</p>
              <h2 className="mt-2 text-lg font-black text-neutral-900">{activeComic.title}</h2>
              <p className="mt-2 text-sm text-neutral-500">Buka AI Tutor untuk komik ini dan ajukan pertanyaan belajar yang sesuai.</p>
              <Link href={`/ai-tutor/${activeComic.id}`} className="mt-4 inline-flex w-full items-center justify-center rounded-3xl bg-primary-600 px-4 py-3 text-sm font-black text-white transition hover:bg-primary-700">
                Buka AI Tutor {activeComic.title}
              </Link>
            </div>
          ) : (
            <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              <p className="font-black">Belum ada komik aktif untuk AI Tutor saat ini.</p>
              <p className="mt-2">Buka halaman Komik untuk menemukan modul yang tersedia.</p>
              <Link href="/dashboard/siswa/komik" className="mt-4 inline-flex w-full items-center justify-center rounded-3xl bg-amber-600 px-4 py-3 text-sm font-black text-white transition hover:bg-amber-700">
                Lihat Daftar Komik
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-400">Komik yang tersedia</p>
        <div className="mt-4 space-y-3">
          {featuredComics.map((comic) => (
            <Link key={comic.id} href={`/ai-tutor/${comic.id}`} className="block rounded-[24px] border border-neutral-200 bg-neutral-50 p-4 transition hover:border-primary-300">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-black text-neutral-900">{comic.title}</p>
                  <p className="mt-1 text-sm text-neutral-500">{comic.kelas} • {comic.estimatedMinutes} menit</p>
                </div>
                <span className="rounded-2xl bg-primary-100 px-3 py-2 text-xs font-black text-primary-700">Chat AI</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
