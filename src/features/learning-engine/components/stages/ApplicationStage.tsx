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
      <div className="rounded-2xl bg-white shadow-sm px-5 py-8 text-center">
        <div className="text-8xl mb-5">🎯</div>
        <h2 className="text-3xl font-black text-neutral-900 leading-snug">Penerapan Konsep</h2>
        <p className="mt-3 text-xl text-neutral-500 leading-relaxed">
          Terapkan ilmu dari{' '}
          <span className="font-black text-primary-600">{comic.lokasi}</span> pada situasi baru!
        </p>
      </div>

      {/* Meta */}
      <div className="rounded-2xl bg-white shadow-sm px-5 py-5">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1.5 text-sm font-bold text-primary-700">
            📍 {comic.lokasi}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 px-3 py-1.5 text-sm font-bold text-secondary-700">
            📚 Kelas {comic.kelas}
          </span>
        </div>
        <h3 className="text-2xl font-black text-neutral-950 leading-snug">{comic.title}</h3>
        <p className="mt-2 text-xl text-neutral-500 leading-relaxed">
          Terapkan ilmu dari {comic.lokasi} pada situasi baru.
        </p>
      </div>

      {/* Studi kasus per target */}
      {comic.learningTargets.map((target, i) => (
        <div key={i} className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-base font-black text-white">
              {i + 1}
            </span>
            <h3 className="text-xl font-black text-neutral-700">Studi Kasus {i + 1}</h3>
          </div>

          <div className="px-5 py-4 flex flex-col gap-4">
            {/* Situasi */}
            <div className="rounded-2xl bg-primary-50 p-4">
              <p className="text-sm font-black uppercase tracking-widest text-primary-400 mb-2">Situasi Baru</p>
              <p className="text-xl text-neutral-700 leading-relaxed">
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
              className="w-full resize-none rounded-2xl border-2 border-neutral-200 bg-neutral-50 px-5 py-4 text-xl leading-relaxed text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 transition-colors"
            />
            <p className="text-base text-neutral-400 text-right">{(answers[i] ?? '').trim().length} karakter</p>
          </div>
        </div>
      ))}

      {/* Catatan opsional */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h3 className="text-xl font-black text-neutral-700">
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
            className="w-full resize-none rounded-2xl border-2 border-neutral-200 bg-neutral-50 px-5 py-4 text-xl leading-relaxed text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 transition-colors"
          />
        </div>
      </div>

    </div>
  );
}
