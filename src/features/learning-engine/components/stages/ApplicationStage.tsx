'use client';

import { useEffect, useState } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';

export default function ApplicationStage() {
  const { comic, setCanAdvance } = useLearningEngine();
  const [answers, setAnswers] = useState<string[]>(() =>
    comic.learningTargets.map(() => '')
  );
  const [note, setNote] = useState('');

  useEffect(() => {
    setCanAdvance(false);
  }, [setCanAdvance]);

  useEffect(() => {
    setCanAdvance(answers.every((a) => a.trim().length > 0));
  }, [answers, setCanAdvance]);

  const handleAnswer = (i: number, v: string) =>
    setAnswers((prev) => prev.map((a, idx) => (idx === i ? v : a)));

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">

      {/* Hero card */}
      <div className="rounded-[24px] bg-white px-5 py-7 text-center shadow-sm sm:px-6 sm:py-8">
        <div className="mb-4 text-3xl sm:text-5xl">🎯</div>
        <h2 className="text-xl font-black leading-snug text-neutral-900 sm:text-2xl">Penerapan Konsep</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500 sm:text-base">
          Terapkan ilmu dari{' '}
          <span className="font-black text-primary-600">{comic.lokasi}</span> pada situasi baru!
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
          Terapkan ilmu dari {comic.lokasi} pada situasi baru.
        </p>
      </div>

      {/* Studi kasus per target */}
      {comic.learningTargets.map((target, i) => (
        <div key={i} className="overflow-hidden rounded-[24px] bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-4 sm:px-5">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-black text-white sm:h-9 sm:w-9 sm:text-base">
              {i + 1}
            </span>
            <h3 className="text-base font-black text-neutral-700 sm:text-lg">Studi Kasus {i + 1}</h3>
          </div>

          <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
            {/* Situasi */}
            <div className="rounded-2xl bg-primary-50 p-3 sm:p-4">
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-primary-400 sm:text-xs">Situasi Baru</p>
              <p className="text-sm leading-relaxed text-neutral-700 sm:text-base">
                Bayangkan kamu berada di tempat lain yang berbeda dari {comic.lokasi}. Bagaimana kamu
                menerapkan konsep{' '}
                <span className="font-black text-neutral-900">{target.toLowerCase()}</span>{' '}
                pada situasi tersebut?
              </p>
            </div>

            {/* Jawaban */}
            <textarea
              value={answers[i] ?? ''}
              onChange={(e) => handleAnswer(i, e.target.value)}
              rows={4}
              placeholder="Tuliskan penerapan konsepmu di sini..."
              className="w-full resize-none rounded-2xl border-2 border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-800 placeholder:text-neutral-400 outline-none transition-colors focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 sm:px-5 sm:py-4 sm:text-base"
            />
            <p className="text-right text-xs text-neutral-400 sm:text-sm">{(answers[i] ?? '').trim().length} karakter</p>
          </div>
        </div>
      ))}

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

    </div>
  );
}
