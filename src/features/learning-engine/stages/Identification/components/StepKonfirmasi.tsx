'use client';

import { useIdentificationContext } from '../context/IdentificationContext';
import StepKonfirmasiItem from './StepKonfirmasiItem';

export default function StepKonfirmasi() {
  const { state, previousStep, reset, advance, validationErrors, reviewIndex, setReviewIndex } = useIdentificationContext();
  const { items } = state;

  const canAdvance = validationErrors.length === 0;
  const isLast = reviewIndex === items.length - 1;
  const item = items[reviewIndex];

  if (!item) return null;

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">

      <div className="px-1">
        <h2 className="text-lg font-black text-neutral-900 sm:text-xl">✅ Periksa Jawabanmu</h2>
        <p className="mt-0.5 text-sm text-neutral-500">
          Tinjau setiap jawaban sebelum melanjutkan.
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 px-1">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setReviewIndex(i)}
            className={[
              'h-2 rounded-full transition-all',
              i === reviewIndex ? 'w-6 bg-primary-600' : 'w-2 bg-neutral-300',
            ].join(' ')}
            aria-label={`Soal ${i + 1}`}
          />
        ))}
      </div>

      {/* Current item */}
      <StepKonfirmasiItem
        item={item}
        index={reviewIndex}
        total={items.length}
      />

      {/* Validation errors — only shown on last item */}
      {isLast && !canAdvance && (
        <ul className="flex flex-col gap-1 px-1">
          {validationErrors.map((err) => (
            <li key={err} className="text-sm font-bold text-error-600">⚠️ {err}</li>
          ))}
        </ul>
      )}

      {/* Navigation — mutually exclusive */}
      {isLast ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={advance}
            disabled={!canAdvance}
            className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[20px] bg-primary-600 px-5 py-3 text-base font-black text-white shadow-sm transition-all hover:bg-primary-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 sm:text-lg"
          >
            {canAdvance ? (
              <>
                Lanjut ke Tahap Berikutnya 🚀
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </>
            ) : (
              'Lengkapi semua jawaban dulu ya!'
            )}
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={reset}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-[20px] border-2 border-warning-300 bg-warning-50 px-4 py-2 text-sm font-black text-warning-700 transition-colors hover:bg-warning-100 active:scale-[0.97] sm:text-base"
            >
              ✏️ Ubah Jawaban
            </button>
            <button
              type="button"
              onClick={previousStep}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-[20px] border-2 border-neutral-200 bg-white px-4 py-2 text-sm font-black text-neutral-600 transition-colors hover:bg-neutral-50 active:scale-[0.97] sm:text-base"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Kembali
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setReviewIndex(Math.max(0, reviewIndex - 1))}
            disabled={reviewIndex === 0}
            className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-[20px] border-2 border-neutral-200 bg-white px-4 py-2 text-sm font-black text-neutral-600 transition-colors hover:bg-neutral-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 sm:text-base"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Sebelumnya
          </button>
          <button
            type="button"
            onClick={() => setReviewIndex(Math.min(items.length - 1, reviewIndex + 1))}
            className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-[20px] bg-primary-600 px-4 py-2 text-sm font-black text-white transition-colors hover:bg-primary-700 active:scale-[0.97] sm:text-base"
          >
            Berikutnya
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

    </div>
  );
}
