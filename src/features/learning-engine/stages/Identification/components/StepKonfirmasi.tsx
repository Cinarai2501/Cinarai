'use client';

import { useIdentificationContext } from '../context/IdentificationContext';
import StepKonfirmasiItem from './StepKonfirmasiItem';

export default function StepKonfirmasi() {
  const { state, previousStep, reset, advance, validationErrors } = useIdentificationContext();
  const canAdvance = validationErrors.length === 0;

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-accent-500 to-accent-600 px-5 py-5 text-center">
        <div className="text-4xl mb-2">✅</div>
        <h2 className="text-xl font-black text-white leading-snug">
          Periksa Jawabanmu
        </h2>
        <p className="mt-1 text-sm text-accent-100">
          Pastikan semua jawaban sudah benar sebelum lanjut.
        </p>
      </div>

      {/* Daftar ringkasan */}
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

      {/* Pesan validasi */}
      {!canAdvance && (
        <div className="rounded-2xl border-2 border-error-200 bg-error-50 px-4 py-3.5 flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-black text-error-700 mb-1">Belum bisa lanjut:</p>
            <ul className="flex flex-col gap-1">
              {validationErrors.map((err) => (
                <li key={err} className="text-sm text-error-600 flex items-start gap-1.5">
                  <span className="flex-shrink-0 mt-0.5">•</span>
                  {err}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tombol aksi */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={advance}
          disabled={!canAdvance}
          className="flex w-full items-center justify-center gap-2 min-h-[56px] rounded-2xl bg-primary-600 px-5 py-4 text-base font-black text-white shadow-md hover:bg-primary-700 transition-all active:scale-[0.97] disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed"
        >
          {canAdvance ? (
            <>
              Lanjut ke Tahap Berikutnya 🚀
            </>
          ) : (
            'Lengkapi semua jawaban dulu ya!'
          )}
        </button>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="flex flex-1 items-center justify-center gap-1.5 min-h-[48px] rounded-2xl border-2 border-warning-300 bg-warning-50 px-4 py-3 text-sm font-bold text-warning-700 hover:bg-warning-100 transition-colors active:scale-[0.97]"
          >
            ✏️ Ubah Jawaban
          </button>
          <button
            type="button"
            onClick={previousStep}
            className="flex flex-1 items-center justify-center gap-1.5 min-h-[48px] rounded-2xl border-2 border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors active:scale-[0.97]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Kembali
          </button>
        </div>
      </div>
    </div>
  );
}
