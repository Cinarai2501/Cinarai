'use client';

import { useEffect } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';

export default function IdentificationStage() {
  const { comic, setCanAdvance } = useLearningEngine();

  useEffect(() => {
    setCanAdvance(true);
  }, [setCanAdvance]);

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div>
        <h2 className="text-lg font-black text-neutral-950 leading-snug">Identifikasi Masalah</h2>
        <p className="mt-1 text-sm text-neutral-500 leading-relaxed">
          Temukan konsep matematika yang tersembunyi di {comic.lokasi}.
        </p>
      </div>

      <div className="rounded-3xl bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 sm:px-5">
          <h3 className="text-sm font-bold text-white">Apa yang Perlu Kamu Temukan?</h3>
          <p className="mt-0.5 text-xs text-primary-100">{comic.subtitle} · Kelas {comic.kelas}</p>
        </div>
        <ul className="px-4 py-4 sm:px-5 flex flex-col gap-2">
          {comic.learningTargets.map((target, i) => (
            <li key={i} className="flex items-start gap-3 rounded-xl bg-neutral-50 p-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-neutral-700 leading-relaxed">{target}</p>
            </li>
          ))}
        </ul>
      </div>

      <ComingSoonCard
        icon="🔍"
        title="Aktivitas Identifikasi"
        description="Aktivitas interaktif untuk mengidentifikasi konsep matematika akan segera hadir."
      />
    </div>
  );
}

function ComingSoonCard({ icon, title, description }: {
  icon: string; title: string; description: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 px-5 py-6 flex flex-col items-center gap-3 text-center">
      <span className="text-4xl">{icon}</span>
      <div>
        <p className="text-sm font-bold text-neutral-700">{title}</p>
        <p className="mt-1 text-xs text-neutral-400 leading-relaxed">{description}</p>
      </div>
      <span className="rounded-full bg-warning-100 px-3 py-1 text-xs font-bold text-warning-700">
        🚧 Segera Hadir
      </span>
    </div>
  );
}
