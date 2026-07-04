'use client';

import { useIdentificationContext } from '../context/IdentificationContext';
import IdentificationProgress from './IdentificationProgress';
import IdentificationActivity from './IdentificationActivity';

export default function StepIdentifikasi() {
  const { lokasi, state } = useIdentificationContext();

  return (
    <div className="flex flex-col gap-4">

      {/* Header sederhana */}
      <div className="rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 px-5 py-5 text-center">
        <div className="text-4xl mb-2">🧩</div>
        <h2 className="text-xl font-black text-white leading-snug">
          Identifikasi Masalah
        </h2>
        <p className="mt-1 text-sm text-primary-100">
          Temukan konsep matematika di <span className="font-bold text-white">{lokasi}</span>
        </p>
      </div>

      {/* Progress */}
      <IdentificationProgress
        observedCount={state.observedCount}
        totalCount={state.items.length}
        percentage={0}
        isComplete={state.isComplete}
      />

      {/* Petunjuk ringkas */}
      <div className="rounded-2xl bg-secondary-50 border border-secondary-100 px-4 py-3.5">
        <p className="text-xs font-black uppercase tracking-widest text-secondary-600 mb-2.5">
          Cara Menjawab
        </p>
        <ol className="flex flex-col gap-2">
          {[
            { emoji: '👆', text: 'Pilih jawaban yang paling tepat.' },
            { emoji: '📝', text: 'Tulis catatan singkat tentang jawabanmu.' },
            { emoji: '💾', text: 'Tekan "Simpan" untuk menyimpan jawabanmu.' },
          ].map((step, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-secondary-200 text-[10px] font-black text-secondary-700">
                {i + 1}
              </span>
              <span className="text-sm text-secondary-800">
                {step.emoji} {step.text}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Daftar soal langsung */}
      <IdentificationActivity />
    </div>
  );
}
