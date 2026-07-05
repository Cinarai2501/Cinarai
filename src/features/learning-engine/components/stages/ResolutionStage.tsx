'use client';

import { useEffect, useState } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';

export default function ResolutionStage() {
  const { comic, setCanAdvance } = useLearningEngine();
  const [answer, setAnswer] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    setCanAdvance(answer.trim().length > 0);
  }, [answer, setCanAdvance]);

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">

      {/* Hero card */}
      <div className="rounded-[24px] bg-white px-5 py-7 text-center shadow-sm sm:px-6 sm:py-8">
        <div className="mb-4 text-3xl sm:text-5xl">💡</div>
        <h2 className="text-xl font-black leading-snug text-neutral-900 sm:text-2xl">Resolusi</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500 sm:text-base">
          Temukan solusi dari masalah di{' '}
          <span className="font-black text-primary-600">{comic.lokasi}</span>!
        </p>
      </div>

      {/* Meta */}
      <div className="rounded-[24px] bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1.5 text-sm font-bold text-primary-700">
            📍 {comic.lokasi}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 px-3 py-1.5 text-sm font-bold text-secondary-700">
            📚 Kelas {comic.kelas}
          </span>
        </div>
        <h3 className="text-lg font-black leading-snug text-neutral-950 sm:text-xl">{comic.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500 sm:text-base">
          Temukan solusi dari masalah di {comic.lokasi}.
        </p>
      </div>

      {/* Yang Sudah Kamu Temukan */}
      <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-4 py-4 sm:px-5">
          <h3 className="text-base font-black text-neutral-700 sm:text-lg">📋 Yang Sudah Kamu Temukan</h3>
        </div>
        <ul className="flex flex-col gap-3 px-4 py-4 sm:px-5">
          {comic.learningTargets.map((target, i) => (
            <li key={i} className="flex items-start gap-3 rounded-2xl bg-primary-50 p-3 sm:gap-4 sm:p-4">
              <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-black text-white sm:h-9 sm:w-9 sm:text-base">
                {i + 1}
              </span>
              <p className="pt-1 text-sm leading-relaxed text-neutral-700 sm:text-base">{target}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Tuliskan Jawabanmu */}
      <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-4 py-4 sm:px-5">
          <h3 className="text-base font-black text-neutral-700 sm:text-lg">✏️ Tuliskan Jawabanmu</h3>
        </div>
        <div className="flex flex-col gap-3 px-4 py-4 sm:px-5">
          <p className="text-sm leading-relaxed text-neutral-500 sm:text-base">
            Berdasarkan penjelajahanmu di {comic.lokasi}, tuliskan kesimpulanmu tentang{' '}
            {comic.subtitle.toLowerCase()}.
          </p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={5}
            placeholder="Tulis jawabanmu di sini..."
            className="w-full resize-none rounded-2xl border-2 border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-800 placeholder:text-neutral-400 outline-none transition-colors focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 sm:px-5 sm:py-4 sm:text-base"
          />
          <p className="text-right text-xs text-neutral-400 sm:text-sm">{answer.trim().length} karakter</p>
          {answer.trim().length === 0 && (
            <p className="rounded-2xl border-2 border-warning-200 bg-warning-50 px-4 py-3 text-sm font-bold text-warning-700 sm:text-base">
              ✏️ Tulis jawabanmu dulu, baru bisa lanjut ya!
            </p>
          )}
        </div>
      </div>

      {/* Catatan opsional */}
      <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-4 py-4 sm:px-5">
          <h3 className="text-base font-black text-neutral-700 sm:text-lg">
            📝 Catatan Tambahan{' '}
            <span className="font-normal text-neutral-400">(opsional)</span>
          </h3>
        </div>
        <div className="px-5 py-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Hal menarik, pertanyaan, atau hal yang ingin kamu ingat..."
            className="w-full resize-none rounded-2xl border-2 border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-800 placeholder:text-neutral-400 outline-none transition-colors focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 sm:px-5 sm:text-base"
          />
        </div>
      </div>

      {/* Feedback AI placeholder */}
      <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-4 py-4 sm:px-5">
          <h3 className="text-base font-black text-neutral-700 sm:text-lg">🤖 Feedback AI</h3>
        </div>
        <div className="flex items-start gap-3 px-4 py-5 sm:px-5 sm:gap-4">
          <span className="flex-shrink-0 text-2xl sm:text-3xl">🚧</span>
          <div>
            <p className="text-base font-black text-neutral-700 sm:text-lg">Segera Hadir!</p>
            <p className="mt-1 text-sm leading-relaxed text-neutral-400 sm:text-base">
              Setelah kamu menulis jawaban, AI akan memberikan umpan balik dan saran perbaikan.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
