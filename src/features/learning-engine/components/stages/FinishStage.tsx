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

const STAGE_EMOJI: Record<string, string> = {
  Cover:             '📖',
  Contextualization: '📚',
  Identification:    '🔍',
  Navigation:        '🧭',
  Argumentation:     '💬',
  Resolution:        '💡',
  Application:       '🎯',
  Introspection:     '🪞',
};

export default function FinishStage() {
  const router = useRouter();
  const { comic, progress, completedStages } = useLearningEngine();

  const hours = Math.floor(comic.estimatedMinutes / 60);
  const minutes = comic.estimatedMinutes % 60;
  const waktuLabel = hours > 0
    ? `${hours} jam${minutes > 0 ? ` ${minutes} mnt` : ''}`
    : `${minutes} menit`;

  const completedSet = new Set<string>(completedStages);
  const xpEarned = completedStages.length * 15;

  return (
    <div
      className="flex flex-col bg-[#f0f7ff]"
      style={{
        minHeight: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Celebration header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 px-5 pb-20 pt-12 text-center md:pb-24 md:pt-16">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -left-6 bottom-4 h-28 w-28 rounded-full bg-secondary-400/20" />
        <div className="relative mx-auto max-w-2xl">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-3xl shadow-lg ring-4 ring-white/30 sm:h-24 sm:w-24 sm:text-4xl md:h-28 md:w-28 md:text-6xl">
            🏆
          </div>
          <h1 className="text-2xl font-black leading-tight text-white md:text-4xl">Luar Biasa! 🎉</h1>
          <p className="mt-2 px-4 text-base leading-snug text-primary-200 md:text-2xl">
            Kamu telah menyelesaikan<br />
            <span className="font-black text-white">{comic.title}</span>
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="relative -mt-12 mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 md:px-6 lg:max-w-3xl">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <StatCard emoji="📊" label="Progress" value={`${progress.percentage}%`} color="bg-primary-600" />
          <StatCard emoji="⭐" label="XP Didapat" value={`+${xpEarned}`} color="bg-secondary-500" />
          <StatCard emoji="⏱️" label="Estimasi" value={waktuLabel} color="bg-accent-500" />
        </div>

        {/* Stage checklist — two columns on desktop */}
        <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
          <div className="border-b border-neutral-100 px-4 py-4 sm:px-5">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-neutral-400">Tahapan</p>
            <h2 className="mt-0.5 text-lg font-black text-neutral-900 sm:text-xl">Yang Sudah Diselesaikan</h2>
          </div>
          <ul className="grid grid-cols-1 gap-3 px-4 py-4 sm:px-5 md:grid-cols-2">
            {LEARNING_STAGES.map((stage) => {
              const done = completedSet.has(stage);
              return (
                <li key={stage} className="flex items-center gap-3">
                  <span className={[
                    'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-lg',
                    done ? 'bg-accent-100' : 'bg-neutral-100',
                  ].join(' ')}>
                    {done ? '✅' : (STAGE_EMOJI[stage] ?? '○')}
                  </span>
                  <span className={`flex-1 text-sm sm:text-base ${done ? 'font-bold text-neutral-800' : 'text-neutral-400'}`}>
                    {STAGE_LABELS[stage]}
                  </span>
                  {done && (
                    <span className="text-base font-black text-accent-600">+15 XP</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="flex min-h-[64px] w-full items-center justify-center gap-3 rounded-[20px] bg-primary-600 px-5 py-4 text-lg font-black text-white shadow-md transition-all hover:bg-primary-700 active:scale-[0.98] sm:text-xl"
        >
          🏠 Kembali ke Dashboard
        </button>

      </div>
    </div>
  );
}

function StatCard({ emoji, label, value, color }: {
  emoji: string; label: string; value: string; color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[20px] bg-white px-3 py-4 text-center shadow-sm md:px-5 md:py-5">
      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${color} text-xl md:h-12 md:w-12 md:text-2xl`}>
        {emoji}
      </span>
      <span className="text-lg md:text-2xl font-black text-neutral-900 leading-tight">{value}</span>
      <span className="text-sm md:text-base text-neutral-400 leading-tight">{label}</span>
    </div>
  );
}
