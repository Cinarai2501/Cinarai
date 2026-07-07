'use client';

import { useIdentificationContext } from '../context/IdentificationContext';
import IdentificationActivity from './IdentificationActivity';
import IdentificationHeader from './IdentificationHeader';
import IdentificationProgress from './IdentificationProgress';

export default function StepIdentifikasi() {
  const { lokasi, state } = useIdentificationContext();
  const { observedCount, items, isComplete } = state;

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      <IdentificationHeader />
      <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-base font-semibold uppercase tracking-[0.2em] text-neutral-400">Lokasi</p>
        <p className="mt-2 text-xl font-black text-neutral-900">{lokasi}</p>
      </div>
      <IdentificationProgress observedCount={observedCount} totalCount={items.length} isComplete={isComplete} />
      <IdentificationActivity />
    </div>
  );
}
