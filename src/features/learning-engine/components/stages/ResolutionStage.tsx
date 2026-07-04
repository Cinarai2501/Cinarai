'use client';

import { useEffect, useState } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import StageHero from '../StageHero';

export default function ResolutionStage() {
  const { comic, setCanAdvance } = useLearningEngine();
  const [answer, setAnswer] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    setCanAdvance(answer.trim().length > 0);
  }, [answer, setCanAdvance]);

  return (
    <div className="flex flex-col gap-3 animate-fade-in-up">

      <StageHero
        cover={comic.cover}
        title={comic.title}
        emoji="💡"
        stageName="Resolusi"
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
        <h2 className="text-xl font-black text-neutral-950 leading-snug">Resolusi</h2>
        <p className="mt-1 text-sm text-neutral-500 leading-relaxed">
          Temukan solusi dari masalah di {comic.lokasi}.
        </p>
      </div>

      {/* Ringkasan identifikasi */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h3 className="text-sm font-black text-neutral-700">📋 Yang Sudah Kamu Temukan</h3>
        </div>
        <ul className="px-4 py-3 flex flex-col gap-1.5">
          {comic.learningTargets.map((target, i) => (
            <li key={i} className="flex items-start gap-3 rounded-xl bg-neutral-50 p-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-black text-primary-700 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-neutral-700 leading-relaxed">{target}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Kotak jawaban */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h3 className="text-sm font-black text-neutral-700">✏️ Tuliskan Jawabanmu</h3>
        </div>
        <div className="px-4 py-3 flex flex-col gap-2">
          <p className="text-sm text-neutral-500 leading-relaxed">
            Berdasarkan penjelajahanmu di {comic.lokasi}, tuliskan kesimpulanmu tentang{' '}
            {comic.subtitle.toLowerCase()}.
          </p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={5}
            placeholder="Tulis jawabanmu di sini..."
            className="w-full rounded-xl border-2 border-neutral-200 bg-neutral-50 px-4 py-3 text-base leading-relaxed text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 resize-none transition-colors"
          />
          <p className="text-xs text-neutral-400 text-right">{answer.trim().length} karakter</p>
          {answer.trim().length === 0 && (
            <p className="text-sm font-semibold text-warning-700 bg-warning-50 border border-warning-200 rounded-xl px-3 py-2.5">
              ✏️ Tulis jawabanmu dulu, baru bisa lanjut ya!
            </p>
          )}
        </div>
      </div>

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

      {/* Feedback AI placeholder */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h3 className="text-sm font-black text-neutral-700">🤖 Feedback AI</h3>
        </div>
        <div className="px-4 py-4 flex items-start gap-3">
          <span className="text-3xl flex-shrink-0">🚧</span>
          <div>
            <p className="text-sm font-bold text-neutral-700">Segera Hadir!</p>
            <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
              Setelah kamu menulis jawaban, AI akan memberikan umpan balik dan saran perbaikan.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
