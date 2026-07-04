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
      <div className="rounded-2xl bg-white shadow-sm px-5 py-8 text-center">
        <div className="text-8xl mb-5">💡</div>
        <h2 className="text-3xl font-black text-neutral-900 leading-snug">Resolusi</h2>
        <p className="mt-3 text-xl text-neutral-500 leading-relaxed">
          Temukan solusi dari masalah di{' '}
          <span className="font-black text-primary-600">{comic.lokasi}</span>!
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
          Temukan solusi dari masalah di {comic.lokasi}.
        </p>
      </div>

      {/* Yang Sudah Kamu Temukan */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h3 className="text-xl font-black text-neutral-700">📋 Yang Sudah Kamu Temukan</h3>
        </div>
        <ul className="px-4 py-4 flex flex-col gap-3">
          {comic.learningTargets.map((target, i) => (
            <li key={i} className="flex items-start gap-4 rounded-2xl bg-primary-50 p-4">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-base font-black text-white mt-0.5">
                {i + 1}
              </span>
              <p className="text-xl text-neutral-700 leading-relaxed pt-1">{target}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Tuliskan Jawabanmu */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h3 className="text-xl font-black text-neutral-700">✏️ Tuliskan Jawabanmu</h3>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <p className="text-xl text-neutral-500 leading-relaxed">
            Berdasarkan penjelajahanmu di {comic.lokasi}, tuliskan kesimpulanmu tentang{' '}
            {comic.subtitle.toLowerCase()}.
          </p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={5}
            placeholder="Tulis jawabanmu di sini..."
            className="w-full resize-none rounded-2xl border-2 border-neutral-200 bg-neutral-50 px-5 py-4 text-xl leading-relaxed text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 transition-colors"
          />
          <p className="text-base text-neutral-400 text-right">{answer.trim().length} karakter</p>
          {answer.trim().length === 0 && (
            <p className="text-xl font-bold text-warning-700 bg-warning-50 border-2 border-warning-200 rounded-2xl px-5 py-4">
              ✏️ Tulis jawabanmu dulu, baru bisa lanjut ya!
            </p>
          )}
        </div>
      </div>

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

      {/* Feedback AI placeholder */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h3 className="text-xl font-black text-neutral-700">🤖 Feedback AI</h3>
        </div>
        <div className="px-5 py-6 flex items-start gap-4">
          <span className="text-4xl flex-shrink-0">🚧</span>
          <div>
            <p className="text-xl font-black text-neutral-700">Segera Hadir!</p>
            <p className="text-lg text-neutral-400 mt-1 leading-relaxed">
              Setelah kamu menulis jawaban, AI akan memberikan umpan balik dan saran perbaikan.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
