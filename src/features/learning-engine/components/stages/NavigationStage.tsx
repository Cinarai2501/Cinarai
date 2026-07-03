'use client';

import { useEffect } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';

// ---------------------------------------------------------------------------
// Panel Materi
// ---------------------------------------------------------------------------
function PanelMateri() {
  const { comic } = useLearningEngine();

  return (
    <section className="rounded-3xl bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 sm:px-5">
        <h2 className="text-sm font-bold text-white">Materi Pembelajaran</h2>
        <p className="mt-0.5 text-xs text-primary-100">{comic.lokasi} · Kelas {comic.kelas}</p>
      </div>

      {/* Konten */}
      <div className="px-4 py-4 sm:px-5 flex flex-col gap-3">
        <p className="text-sm text-neutral-600 leading-relaxed">{comic.synopsis}</p>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2">
            Target Pembelajaran
          </h3>
          <ul className="flex flex-col gap-2">
            {comic.learningTargets.map((target, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl bg-neutral-50 p-3"
              >
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                  {i + 1}
                </span>
                <p className="text-sm text-neutral-700 leading-relaxed">{target}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Panel Aktivitas
// ---------------------------------------------------------------------------
function ActivityCard({
  icon,
  title,
  description,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-neutral-800">{title}</p>
          <span className="inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
            {badge}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-neutral-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function PanelAktivitas() {
  const { comic } = useLearningEngine();

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
        Aktivitas
      </h2>

      <ActivityCard
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
        }
        title="Scan AR"
        description={`Arahkan kamera ke marker ${comic.lokasi} untuk melihat objek 3D.`}
        badge="Segera Hadir"
      />

      <ActivityCard
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347A3.001 3.001 0 0112 21a3.001 3.001 0 01-2.121-.879l-.347-.347z" />
          </svg>
        }
        title="Tanya AI"
        description="Ajukan pertanyaan tentang materi kepada asisten AI."
        badge="Segera Hadir"
      />

      <ActivityCard
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        }
        title="Kuis Navigasi"
        description="Uji pemahamanmu tentang materi yang sudah dipelajari."
        badge="Segera Hadir"
      />
    </section>
  );
}

// ---------------------------------------------------------------------------
// NavigationStage
// ---------------------------------------------------------------------------
export default function NavigationStage() {
  const { setCanAdvance } = useLearningEngine();

  useEffect(() => {
    setCanAdvance(true);
  }, [setCanAdvance]);

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PanelMateri />
      <PanelAktivitas />
    </div>
  );
}
