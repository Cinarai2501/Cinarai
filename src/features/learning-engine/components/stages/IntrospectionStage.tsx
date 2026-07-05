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
      <div className="rounded-[24px] bg-white px-5 py-7 text-center shadow-sm sm:px-6 sm:py-8">
        <div className="mb-4 text-3xl sm:text-5xl">🪞</div>
        <h2 className="text-xl font-black leading-snug text-neutral-900 sm:text-2xl">Refleksi Pembelajaran</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500 sm:text-base">
          Kamu telah menyelesaikan petualangan di{' '}
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
          Kamu telah menyelesaikan petualangan di {comic.lokasi}.
        </p>
      </div>

      {/* Checklist */}
      <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-4 py-4 sm:px-5">
          <h3 className="text-base font-black text-neutral-700 sm:text-lg">✅ Apa yang sudah kamu kuasai?</h3>
          <p className="mt-1 text-sm text-neutral-400 sm:text-base">Centang semua yang sudah kamu pahami.</p>
        </div>
        <ul className="flex flex-col gap-3 px-4 py-4 sm:px-5">
          {comic.learningTargets.map((target, i) => (
            <li key={i}>
              <label className="flex cursor-pointer select-none items-start gap-3 rounded-2xl p-3 transition-colors hover:bg-neutral-50 sm:gap-4 sm:p-4">
                {/* Hidden native checkbox — handles all a11y & Android tap correctly */}
                <input
                  type="checkbox"
                  checked={checked[i] ?? false}
                  onChange={(e) => handleCheck(i, e.target.checked)}
                  className="sr-only"
                />
                {/* Custom visual checkbox */}
                <span
                  aria-hidden="true"
                  className={[
                    'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border-[3px] transition-colors mt-0.5',
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
                <span className={`text-sm leading-relaxed sm:text-base ${checked[i] ? 'font-bold text-neutral-900' : 'text-neutral-600'}`}>
                  {target}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* Rating pemahaman */}
      <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-4 py-4 sm:px-5">
          <h3 className="text-base font-black text-neutral-700 sm:text-lg">⭐ Seberapa paham kamu?</h3>
        </div>
        <div className="flex flex-wrap gap-2 px-4 py-4 sm:px-5">
          {RATING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRating(opt.value)}
              aria-pressed={rating === opt.value}
              className={[
                'flex min-w-[60px] flex-1 flex-col items-center gap-2 rounded-2xl border-2 px-3 py-3 transition-colors',
                rating === opt.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50',
              ].join(' ')}
            >
              <span className="text-xl leading-none sm:text-2xl">{opt.emoji}</span>
              <span className="text-center text-[11px] font-bold leading-tight sm:text-xs">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Catatan opsional */}
      <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-4 py-4 sm:px-5">
          <h3 className="text-base font-black text-neutral-700 sm:text-lg">
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
            className="w-full resize-none rounded-2xl border-2 border-neutral-200 bg-neutral-50 px-5 py-4 text-base md:text-lg leading-relaxed text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 transition-colors"
          />
        </div>
      </div>

      {/* Kesimpulan */}
      <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-4 py-4 sm:px-5">
          <h3 className="text-base font-black text-neutral-700 sm:text-lg">💬 Kesimpulanmu</h3>
        </div>
        <div className="flex flex-col gap-3 px-4 py-4 sm:px-5">
          <p className="text-sm leading-relaxed text-neutral-500 sm:text-base">
            Dengan kata-katamu sendiri, apa pelajaran terpenting yang kamu dapat dari {comic.lokasi}?
          </p>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            placeholder="Tuliskan kesimpulanmu di sini..."
            className="w-full resize-none rounded-2xl border-2 border-neutral-200 bg-neutral-50 px-5 py-4 text-base md:text-lg leading-relaxed text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 transition-colors"
          />
          <p className="text-right text-xs text-neutral-400 sm:text-sm">{summary.trim().length} karakter</p>
        </div>
      </div>

      {/* Tombol selesai */}
      <button
        type="button"
        onClick={() => { void nextStage(); }}
        disabled={!canFinish}
        className="flex min-h-[64px] w-full items-center justify-center gap-3 rounded-[20px] bg-primary-600 px-5 py-4 text-base font-black text-white shadow-md transition-all hover:bg-primary-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 sm:text-lg"
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
