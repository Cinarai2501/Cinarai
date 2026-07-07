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

    </div>
  );
}
