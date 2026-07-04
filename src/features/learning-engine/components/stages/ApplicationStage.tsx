'use client';

import { useEffect, useState } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import StageHero from '../StageHero';

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
    <div className="flex flex-col gap-3 animate-fade-in-up">

      <StageHero
        cover={comic.cover}
        title={comic.title}
        emoji="🎯"
        stageName="Penerapan Konsep"
        lokasi={comic.lokasi}
      />

      {/* Judul & meta */}
      <div className="rounded-2xl bg-white shadow-sm px-4 py-4">
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-1 text-[11px] font-semibold text-primary-700">
            📍 {comic.lokasi}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary-100 px-2.5 py-1 text-[11px] font-semibold text-secondary-700">
            📚 Kelas {comic.kelas}
          </span>
        </div>
        <h2 className="text-xl font-black text-neutral-950 leading-snug">Penerapan Konsep</h2>
        <p className="mt-1 text-sm text-neutral-500 leading-relaxed">
          Terapkan ilmu dari {comic.lokasi} pada situasi baru.
        </p>
      </div>

      {/* Studi kasus + jawaban per target */}
      {comic.learningTargets.map((target, i) => (
        <div key={i} className="rounded-2xl bg-white shadow-sm overflow-hidden">
          {/* Header studi kasus */}
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-2">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-black text-primary-700">
              {i + 1}
            </span>
            <h3 className="text-sm font-black text-neutral-700">Studi Kasus {i + 1}</h3>
          </div>

          <div className="px-4 py-3 flex flex-col gap-3">
            {/* Situasi */}
            <div className="rounded-xl bg-neutral-50 p-3">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">Situasi Baru</p>
              <p className="text-sm text-neutral-700 leading-relaxed">
                Bayangkan kamu berada di tempat lain yang berbeda dari {comic.lokasi}. Bagaimana kamu
                menerapkan konsep{' '}
                <span className="font-semibold text-neutral-900">{target.toLowerCase()}</span>{' '}
                pada situasi tersebut?
              </p>
            </div>

            {/* Jawaban */}
            <textarea
              value={answers[i] ?? ''}
              onChange={(e) => handleAnswer(i, e.target.value)}
              rows={4}
              placeholder="Tuliskan penerapan konsepmu di sini..."
              className="w-full rounded-xl border-2 border-neutral-200 bg-neutral-50 px-4 py-3 text-base leading-relaxed text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 resize-none transition-colors"
            />
            <p className="text-xs text-neutral-400 text-right">{(answers[i] ?? '').trim().length} karakter</p>
          </div>
        </div>
      ))}

      {/* Catatan opsional */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h3 className="text-sm font-black text-neutral-700">📝 Catatan Tambahan <span className="font-normal text-neutral-400">(opsional)</span></h3>
        </div>
        <div className="px-4 py-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Hal menarik, pertanyaan, atau hal yang ingin kamu ingat..."
            className="w-full rounded-xl border-2 border-neutral-200 bg-neutral-50 px-4 py-3 text-base leading-relaxed text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 resize-none transition-colors"
          />
        </div>
      </div>

    </div>
  );
}
