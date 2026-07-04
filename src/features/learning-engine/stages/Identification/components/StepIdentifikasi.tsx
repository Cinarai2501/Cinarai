'use client';

import { useIdentificationContext } from '../context/IdentificationContext';
import IdentificationProgress from './IdentificationProgress';
import IdentificationActivity from './IdentificationActivity';

export default function StepIdentifikasi() {
  const { lokasi, state } = useIdentificationContext();

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">

      {/* Hero card */}
      <div className="rounded-2xl bg-white shadow-sm px-5 py-8 text-center">
        <div className="text-8xl mb-5">🧩</div>
        <h2 className="text-3xl font-black text-neutral-900 leading-snug">Identifikasi Masalah</h2>
        <p className="mt-3 text-xl text-neutral-500 leading-relaxed">
          Temukan konsep matematika di{' '}
          <span className="font-black text-primary-600">{lokasi}</span>
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
        <div className="px-5 py-4 border-b border-neutral-100">
          <h3 className="text-xl font-black text-neutral-700">📌 Cara Menjawab</h3>
        </div>
        <ol className="px-4 py-4 flex flex-col gap-3">
          {[
            { emoji: '👆', text: 'Pilih jawaban yang paling tepat.' },
            { emoji: '📝', text: 'Tulis catatan singkat tentang jawabanmu.' },
            { emoji: '💾', text: 'Jawabanmu akan tersimpan otomatis.' },
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-4 rounded-2xl bg-primary-50 p-4">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-base font-black text-white mt-0.5">
                {i + 1}
              </span>
              <span className="text-xl text-neutral-700 leading-relaxed pt-1">
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
