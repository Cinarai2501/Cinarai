'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { getAllComics } from '@/lib/comicRepository';
import { getAllUnlockStatuses } from '@/lib/unlockEngine';
import { useAllComicProgress } from '@/hooks/useAllComicProgress';

export default function DashboardSiswaAiTutorPage() {
  const { states, getProgress } = useAllComicProgress();
  const comics = useMemo(() => getAllComics(), []);
  const unlockStatuses = useMemo(() => getAllUnlockStatuses(states), [states]);

  const activeComic = useMemo(
    () => comics.find((comic) => unlockStatuses.get(comic.id) === 'UNLOCKED' && !(getProgress(comic.id)?.isCompleted ?? false))
      ?? comics.find((comic) => unlockStatuses.get(comic.id) === 'UNLOCKED')
      ?? null,
    [comics, getProgress, unlockStatuses],
  );

  const suggestionChips = [
    'Apa itu kubus?',
    'Apa rumus volume balok?',
    'Apa ciri prisma?',
    'Mengapa limas memiliki titik puncak?',
  ];

  return (
    <div className="space-y-4 pb-28">
      <section className="rounded-[32px] bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-600">AI Tutor</p>
        <h1 className="mt-3 text-2xl font-black text-neutral-900">Chat pintar untuk belajar</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">Ajukan pertanyaan tentang bangun ruang, bangun datar, rumus, ciri-ciri, dan materi komik CINARAI.</p>
      </section>

      <section className="rounded-[32px] bg-white p-5 shadow-sm">
        <div className="rounded-[28px] bg-primary-50 p-4">
          <p className="font-black text-primary-700">Halo! Aku AI Tutor CINARAI.</p>
          <p className="mt-2 text-sm leading-relaxed text-primary-700/90">AI hanya akan menjawab topik pembelajaran yang ada di komik. Jika kamu bertanya di luar topik, aku akan mengarahkanmu kembali ke materi.</p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[28px] bg-neutral-100 p-4">
            <p className="text-sm font-black text-neutral-900">Contoh pertanyaan</p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-600">
              <li>• Apa itu kubus?</li>
              <li>• Apa rumus volume balok?</li>
              <li>• Apa ciri prisma?</li>
              <li>• Mengapa limas memiliki titik puncak?</li>
            </ul>
          </div>
          <div className="rounded-[28px] bg-neutral-100 p-4">
            <p className="text-sm font-black text-neutral-900">AI Tutor hanya menjawab</p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-600">
              <li>• bangun ruang</li>
              <li>• bangun datar</li>
              <li>• rumus</li>
              <li>• ciri-ciri</li>
              <li>• identifikasi objek</li>
              <li>• materi komik</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-400">Contoh chat</p>
        <div className="mt-4 space-y-3">
          <div className="rounded-[28px] bg-neutral-100 p-4">
            <p className="text-sm font-black text-neutral-900">Kamu</p>
            <p className="mt-2 text-sm text-neutral-700">Apa itu kubus?</p>
          </div>
          <div className="rounded-[28px] bg-primary-600 p-4 text-white">
            <p className="text-sm font-black">AI Tutor</p>
            <p className="mt-2 text-sm leading-relaxed text-white/90">Kubus adalah bangun ruang dengan 6 sisi persegi yang sama dan 12 rusuk. Bentuk ini sering muncul di materi komik dan pelajaran matematika dasar.</p>
          </div>
          <div className="rounded-[28px] bg-neutral-100 p-4">
            <p className="text-sm font-black text-neutral-900">Kamu</p>
            <p className="mt-2 text-sm text-neutral-700">Apa rumus volume balok?</p>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-400">Suggestion chips</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {suggestionChips.map((chip) => (
            <button key={chip} type="button" className="rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-left text-sm font-semibold text-neutral-900 transition hover:border-primary-300 hover:bg-primary-50">
              {chip}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-400">Mulai AI Tutor</p>
        <div className="mt-4 space-y-3">
          <div className="rounded-[28px] bg-neutral-50 p-4">
            <p className="text-sm font-black text-neutral-900">{activeComic ? `Rekomendasi komik: ${activeComic.title}` : 'Belum ada komik aktif'}</p>
            <p className="mt-2 text-sm text-neutral-500">{activeComic ? 'Buka AI Tutor untuk modul ini dan ajukan pertanyaan yang sesuai.' : 'Buka halaman Komik untuk memilih materi belajar.'}</p>
          </div>
          <Link
            href={activeComic ? `/ai-tutor/${activeComic.id}` : '/dashboard/siswa/komik'}
            className="inline-flex w-full items-center justify-center rounded-3xl bg-primary-600 px-4 py-3 text-sm font-black text-white transition hover:bg-primary-700"
          >
            {activeComic ? `Buka AI Tutor ${activeComic.title}` : 'Lihat Daftar Komik'}
          </Link>
        </div>
      </section>
    </div>
  );
}
