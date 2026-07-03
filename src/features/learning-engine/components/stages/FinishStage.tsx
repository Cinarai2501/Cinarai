'use client';

import { useRouter } from 'next/navigation';
import { LEARNING_STAGES, type Stage } from '../../types';
import { useLearningEngine } from '../../hooks/useLearningEngine';

const STAGE_LABELS: Record<Stage, string> = {
  Cover:             'Cover',
  Contextualization: 'Kontekstualisasi',
  Identification:    'Identifikasi',
  Navigation:        'Navigasi',
  Argumentation:     'Argumentasi',
  Resolution:        'Resolusi',
  Application:       'Aplikasi',
  Introspection:     'Introspeksi',
  Finish:            'Selesai',
};

export default function FinishStage() {
  const router = useRouter();
  const { comic, progress, completedStages } = useLearningEngine();

  const hours = Math.floor(comic.estimatedMinutes / 60);
  const minutes = comic.estimatedMinutes % 60;
  const waktuLabel = hours > 0
    ? `${hours} jam${minutes > 0 ? ` ${minutes} menit` : ''}`
    : `${minutes} menit`;

  const completedSet = new Set<string>(completedStages);

  return (
    <div
      className="flex flex-col bg-neutral-50"
      style={{
        minHeight: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex flex-1 flex-col items-center justify-start px-4 py-10 sm:px-6">
        <div className="w-full max-w-md flex flex-col gap-6">

          {/* Hero */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
              <svg className="w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-950 leading-snug">
                Learning Journey Selesai!
              </h1>
              <p className="mt-1 text-sm text-neutral-500">{comic.title}</p>
            </div>
          </div>

          {/* Statistik */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white shadow-xs px-4 py-4 flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-primary-600">{progress.percentage}%</span>
              <span className="text-xs text-neutral-500 text-center">Persentase Selesai</span>
            </div>
            <div className="rounded-2xl bg-white shadow-xs px-4 py-4 flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-primary-600">{waktuLabel}</span>
              <span className="text-xs text-neutral-500 text-center">Estimasi Waktu</span>
            </div>
          </div>

          {/* Tahapan Selesai */}
          <section className="rounded-2xl bg-white shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-100 sm:px-5">
              <h2 className="text-sm font-bold text-neutral-800">Tahapan yang Diselesaikan</h2>
            </div>
            <ul className="px-4 py-3 sm:px-5 flex flex-col gap-1">
              {LEARNING_STAGES.map((stage) => {
                const done = completedSet.has(stage);
                return (
                  <li key={stage} className="flex items-center gap-3 py-2">
                    <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${done ? 'bg-primary-100' : 'bg-neutral-100'}`}>
                      {done ? (
                        <svg className="w-3.5 h-3.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </span>
                    <span className={`text-sm ${done ? 'text-neutral-800 font-medium' : 'text-neutral-400'}`}>
                      {STAGE_LABELS[stage]}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Tombol */}
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-xs hover:bg-primary-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Kembali ke Dashboard
          </button>

        </div>
      </div>
    </div>
  );
}
