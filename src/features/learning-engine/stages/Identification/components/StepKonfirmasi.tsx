'use client';

import { useIdentificationContext } from '../context/IdentificationContext';
import StepKonfirmasiItem from './StepKonfirmasiItem';

export default function StepKonfirmasi() {
  const { state, validationErrors, reviewIndex, setReviewIndex } = useIdentificationContext();
  const { items } = state;

  const canAdvance = validationErrors.length === 0;
  const isLast = reviewIndex === items.length - 1;
  const item = items[reviewIndex];

  if (!item) return null;

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">

      <div className="px-3">
        <h2 className="text-lg font-black text-neutral-900 sm:text-xl">✅ Periksa Jawabanmu</h2>
        <p className="mt-0.5 text-base text-neutral-500">
          Tinjau setiap jawaban sebelum melanjutkan.
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex flex-wrap items-center justify-center gap-2 px-3">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setReviewIndex(i)}
            className={[
              'min-h-[44px] min-w-[44px] rounded-full border transition-all duration-200',
              i === reviewIndex ? 'border-primary-600 bg-primary-600 text-white' : 'border-neutral-300 bg-white text-neutral-600 hover:border-primary-600',
            ].join(' ')}
            aria-label={`Soal ${i + 1}`}
          >
            {i + 1}
          </button>
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
        <ul className="flex flex-col gap-3 px-3">
          {validationErrors.map((err) => (
            <li key={err} className="text-base font-bold text-error-600">⚠️ {err}</li>
          ))}
        </ul>
      )}

    </div>
  );
}
