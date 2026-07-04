'use client';

import { useEffect, useState } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import StageHero from '../StageHero';

const RATING_OPTIONS = [
  { value: 1, emoji: '😕', label: 'Belum paham' },
  { value: 2, emoji: '🤔', label: 'Sedikit paham' },
  { value: 3, emoji: '🙂', label: 'Cukup paham' },
  { value: 4, emoji: '😊', label: 'Paham' },
  { value: 5, emoji: '🤩', label: 'Sangat paham' },
] as const;

export default function IntrospectionStage() {
  const { comic, setCanAdvance, nextStage } = useLearningEngine();

  const [checked, setChecked] = useState<boolean[]>(() =>
    comic.learningTargets.map(() => false)
  );
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [summary, setSummary] = useState('');

  const allChecked = checked.every(Boolean);
  const canFinish = allChecked && rating !== null && summary.trim().length > 0;

  useEffect(() => {
    setCanAdvance(false);
  }, [setCanAdvance]);

  const handleCheck = (i: number, v: boolean) =>
    setChecked((prev) => prev.map((c, idx) => (idx === i ? v : c)));

  return (
    <div className="flex flex-col gap-3 animate-fade-in-up">

      <StageHero
        cover={comic.cover}
        title={comic.title}
        emoji="🪞"
        stageName="Refleksi Pembelajaran"
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
        <h2 className="text-xl font-black text-neutral-950 leading-snug">Refleksi Pembelajaran</h2>
        <p className="mt-1 text-sm text-neutral-500 leading-relaxed">
          Kamu telah menyelesaikan petualangan di {comic.lokasi}.
        </p>
      </div>

      {/* Checklist */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h3 className="text-sm font-black text-neutral-700">✅ Apa yang sudah kamu kuasai?</h3>
          <p className="text-xs text-neutral-400 mt-0.5">Centang semua yang sudah kamu pahami.</p>
        </div>
        <ul className="px-4 py-3 flex flex-col gap-1">
          {comic.learningTargets.map((target, i) => (
            <li key={i}>
              <label className="flex items-start gap-3 rounded-xl p-3 cursor-pointer hover:bg-neutral-50 transition-colors">
                <input
                  type="checkbox"
                  checked={checked[i] ?? false}
                  onChange={(e) => handleCheck(i, e.target.checked)}
                  className="mt-0.5 h-5 w-5 flex-shrink-0 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                <span className={`text-sm leading-relaxed ${checked[i] ? 'text-neutral-800 font-semibold' : 'text-neutral-600'}`}>
                  {target}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* Rating pemahaman */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h3 className="text-sm font-black text-neutral-700">⭐ Seberapa paham kamu?</h3>
        </div>
        <div className="px-4 py-3 flex gap-2 flex-wrap">
          {RATING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRating(opt.value)}
              aria-pressed={rating === opt.value}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-2.5 min-w-[60px] flex-1 transition-colors ${
                rating === opt.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <span className="text-2xl leading-none">{opt.emoji}</span>
              <span className="text-xs font-semibold text-center leading-tight">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Catatan opsional */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h3 className="text-sm font-black text-neutral-700">📝 Catatan <span className="font-normal text-neutral-400">(opsional)</span></h3>
        </div>
        <div className="px-4 py-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Hal yang ingin kamu ingat, pertanyaan yang masih ada, atau perasaanmu..."
            className="w-full rounded-xl border-2 border-neutral-200 bg-neutral-50 px-4 py-3 text-base leading-relaxed text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 resize-none transition-colors"
          />
        </div>
      </div>

      {/* Kesimpulan */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h3 className="text-sm font-black text-neutral-700">💬 Kesimpulanmu</h3>
        </div>
        <div className="px-4 py-3 flex flex-col gap-2">
          <p className="text-sm text-neutral-500 leading-relaxed">
            Dengan kata-katamu sendiri, apa pelajaran terpenting yang kamu dapat dari {comic.lokasi}?
          </p>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            placeholder="Tuliskan kesimpulanmu di sini..."
            className="w-full rounded-xl border-2 border-neutral-200 bg-neutral-50 px-4 py-3 text-base leading-relaxed text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 resize-none transition-colors"
          />
          <p className="text-xs text-neutral-400 text-right">{summary.trim().length} karakter</p>
        </div>
      </div>

      {/* Tombol selesai */}
      <button
        type="button"
        onClick={() => { void nextStage(); }}
        disabled={!canFinish}
        className="flex w-full items-center justify-center gap-2 min-h-[56px] rounded-2xl bg-primary-600 px-5 py-4 text-base font-black text-white shadow-md hover:bg-primary-700 transition-all active:scale-[0.97] disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed"
      >
        {canFinish ? (
          <>
            Selesaikan Pembelajaran 🏆
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </>
        ) : (
          'Lengkapi semua bagian dulu ya! ✏️'
        )}
      </button>

    </div>
  );
}
