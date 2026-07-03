'use client';

import { useEffect } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';

export default function ArgumentationStage() {
  const { comic, setCanAdvance } = useLearningEngine();

  useEffect(() => {
    setCanAdvance(true);
  }, [setCanAdvance]);

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div>
        <h2 className="text-lg font-black text-neutral-950 leading-snug">Argumentasi</h2>
        <p className="mt-1 text-sm text-neutral-500 leading-relaxed">
          Sampaikan pendapatmu tentang konsep yang kamu temukan di {comic.lokasi}.
        </p>
      </div>

      <div className="rounded-3xl border-2 border-dashed border-neutral-200 bg-white px-5 py-8 flex flex-col items-center gap-3 text-center">
        <span className="text-5xl">💬</span>
        <div>
          <p className="text-sm font-bold text-neutral-700">Aktivitas Argumentasi</p>
          <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
            Aktivitas diskusi dan argumentasi interaktif akan segera hadir di sini.
          </p>
        </div>
        <span className="rounded-full bg-warning-100 px-3 py-1 text-xs font-bold text-warning-700">
          🚧 Segera Hadir
        </span>
      </div>
    </div>
  );
}
