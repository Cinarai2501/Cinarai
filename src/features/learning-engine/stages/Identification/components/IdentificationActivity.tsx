'use client';

import { useIdentificationContext } from '../context/IdentificationContext';
import ActivityItem from './ActivityItem';

export default function IdentificationActivity() {
  const { state, lokasi } = useIdentificationContext();
  const { items, isComplete } = state;

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <ActivityItem key={item.id} item={item} />
        ))}
      </ul>

      {isComplete && (
        <div className="rounded-xl bg-accent-500 px-4 py-4 flex items-center gap-3">
          <span className="text-2xl flex-shrink-0">🎉</span>
          <div>
            <p className="text-lg font-black text-white leading-tight">Hebat! Semua soal selesai!</p>
            <p className="text-sm text-accent-100">Kamu berhasil di {lokasi}. Tekan Lanjut!</p>
          </div>
        </div>
      )}
    </div>
  );
}
