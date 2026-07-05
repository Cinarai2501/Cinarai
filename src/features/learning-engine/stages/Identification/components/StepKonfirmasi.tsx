'use client';

import { useIdentificationContext } from '../context/IdentificationContext';
import StepKonfirmasiItem from './StepKonfirmasiItem';

export default function StepKonfirmasi() {
  const { state, previousStep, reset, advance, validationErrors } = useIdentificationContext();
  const canAdvance = validationErrors.length === 0;

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">

      <div className="px-1">
        <h2 className="text-lg font-black text-neutral-900 sm:text-xl">✅ Periksa Jawabanmu</h2>
        <p className="mt-0.5 text-sm text-neutral-500">Pastikan semua jawaban sudah benar sebelum lanjut.</p>
      </div>

      <ul className="flex flex-col gap-3">
        {state.items.map((item) => {
          const selectedOptionText =
            item.options.find((o) => o.id === item.selectedOptionId)?.text ?? null;
          return (
            <StepKonfirmasiItem
              key={item.id}
              item={item}
              selectedOptionText={selectedOptionText}
            />
          );
        })}
      </ul>

      {!canAdvance && (
        <ul className="flex flex-col gap-1 px-1">
          {validationErrors.map((err) => (
            <li key={err} className="text-sm font-bold text-error-600">⚠️ {err}</li>
          ))}
        </ul>
      )}

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
  );
}
