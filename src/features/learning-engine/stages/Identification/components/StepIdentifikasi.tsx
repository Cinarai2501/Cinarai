'use client';

import { useIdentificationContext } from '../context/IdentificationContext';
import IdentificationProgress from './IdentificationProgress';
import IdentificationActivity from './IdentificationActivity';

export default function StepIdentifikasi() {
  const { lokasi, state } = useIdentificationContext();

  return (
    <div className="flex flex-col gap-3 animate-fade-in-up">

      {/* Hero banner */}
      <div className="rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 px-5 py-6 text-center">
        <div className="text-5xl mb-3">🧩</div>
        <h2 className="text-xl font-black text-white leading-snug">Identifikasi Masalah</h2>
        <p className="mt-1.5 text-sm text-primary-100 leading-relaxed">
          Temukan konsep matematika di{' '}
          <span className="font-bold text-white">{lokasi}</span>
        </p>
      </div>

      {/* Progress */}
      <IdentificationProgress
        observedCount={state.observedCount}
        totalCount={state.items.length}
        isComplete={state.isComplete}
      />

      {/* Petunjuk */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h3 className="text-sm font-black text-neutral-700">📌 Cara Menjawab</h3>
        </div>
        <ol className="px-4 py-3 flex flex-col gap-1.5">
          {[
            { emoji: '👆', text: 'Pilih jawaban yang paling tepat.' },
            { emoji: '📝', text: 'Tulis catatan singkat tentang jawabanmu.' },
            { emoji: '💾', text: 'Tekan "Simpan" untuk menyimpan jawabanmu.' },
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 rounded-xl bg-neutral-50 p-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-black text-primary-700 mt-0.5">
                {i + 1}
              </span>
              <span className="text-sm text-neutral-700 leading-relaxed">
                {step.emoji} {step.text}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Daftar soal */}
      <IdentificationActivity />

    </div>
  );
}
