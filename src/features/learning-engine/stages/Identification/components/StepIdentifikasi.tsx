'use client';

import { useIdentificationContext } from '../context/IdentificationContext';
import IdentificationActivity from './IdentificationActivity';

export default function StepIdentifikasi() {
  const { lokasi, state } = useIdentificationContext();
  const { observedCount, items } = state;

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">

      {/* Progress ringkas */}
      <div className="flex items-center justify-between px-1">
        <p className="text-base font-bold text-neutral-500">
          🧩 Identifikasi di <span className="text-primary-600">{lokasi}</span>
        </p>
        <span className="text-sm font-black text-primary-600">
          {observedCount}/{items.length}
        </span>
      </div>

      {/* Daftar soal */}
      <IdentificationActivity />

    </div>
  );
}
