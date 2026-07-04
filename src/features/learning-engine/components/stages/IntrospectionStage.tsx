'use client';

import { useEffect, useState } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';

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
    <div className="flex flex-col gap-4 animate-fade-in-up">

      {/* Hero card */}
      <div className="rounded-2xl bg-white shadow-sm px-5 py-8 text-center">
        <div className="text-8xl mb-5">🪞</div>
        <h2 className="text-3xl font-black text-neutral-900 leading-snug">Refleksi Pembelajaran</h2>
        <p className="mt-3 text-xl text-neutral-500 leading-relaxed">
          Kamu telah menyelesaikan petualangan di{' '}
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
          Kamu telah menyelesaikan petualangan di {comic.lokasi}.
        </p>
      </div>

      {/* Checklist */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h3 className="text-xl font-black text-neutral-700">✅ Apa yang sudah kamu kuasai?</h3>
          <p className="text-lg text-neutral-400 mt-1">Centang semua yang sudah kamu pahami.</p>
        </div>
        <ul className="px-4 py-4 flex flex-col gap-3">
          {comic.learningTargets.map((target, i) => (
            <li key={i}>
              <label className="flex items-start gap-4 rounded-2xl p-4 cursor-pointer hover:bg-neutral-50 transition-colors">
                {/* Modern checkbox */}
                <span
                  onClick={() => handleCheck(i, !(checked[i] ?? false))}
                  className={[
                    'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border-[3px] transition-colors cursor-pointer mt-0.5',
                    checked[i]
                      ? 'border-primary-600 bg-primary-600'
                      : 'border-neutral-300 bg-white',
                  ].join(' ')}
                >
                  {checked[i] && (
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className={`text-xl leading-relaxed ${checked[i] ? 'text-neutral-900 font-bold' : 'text-neutral-600'}`}>
                  {target}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* Rating pemahaman */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h3 className="text-xl font-black text-neutral-700">⭐ Seberapa paham kamu?</h3>
        </div>
        <div className="px-4 py-4 flex gap-2 flex-wrap">
          {RATING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRating(opt.value)}
              aria-pressed={rating === opt.value}
              className={[
                'flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-3 min-w-[60px] flex-1 transition-colors',
                rating === opt.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50',
              ].join(' ')}
            >
              <span className="text-3xl leading-none">{opt.emoji}</span>
              <span className="text-sm font-bold text-center leading-tight">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Catatan opsional */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h3 className="text-xl font-black text-neutral-700">
            📝 Catatan{' '}
            <span className="font-normal text-neutral-400">(opsional)</span>
          </h3>
        </div>
        <div className="px-5 py-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Hal yang ingin kamu ingat, pertanyaan yang masih ada, atau perasaanmu..."
            className="w-full resize-none rounded-2xl border-2 border-neutral-200 bg-neutral-50 px-5 py-4 text-xl leading-relaxed text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 transition-colors"
          />
        </div>
      </div>

      {/* Kesimpulan */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h3 className="text-xl font-black text-neutral-700">💬 Kesimpulanmu</h3>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <p className="text-xl text-neutral-500 leading-relaxed">
            Dengan kata-katamu sendiri, apa pelajaran terpenting yang kamu dapat dari {comic.lokasi}?
          </p>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            placeholder="Tuliskan kesimpulanmu di sini..."
            className="w-full resize-none rounded-2xl border-2 border-neutral-200 bg-neutral-50 px-5 py-4 text-xl leading-relaxed text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 transition-colors"
          />
          <p className="text-base text-neutral-400 text-right">{summary.trim().length} karakter</p>
        </div>
      </div>

      {/* Tombol selesai */}
      <button
        type="button"
        onClick={() => { void nextStage(); }}
        disabled={!canFinish}
        className="flex w-full items-center justify-center gap-3 min-h-[72px] rounded-2xl bg-primary-600 px-5 py-4 text-2xl font-black text-white shadow-md hover:bg-primary-700 transition-all active:scale-[0.97] disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed"
      >
        {canFinish ? (
          <>
            Selesaikan Pembelajaran 🏆
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
