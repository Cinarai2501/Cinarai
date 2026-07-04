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
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 px-5 pt-12 pb-20 text-center">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -left-6 bottom-4 h-28 w-28 rounded-full bg-secondary-400/20" />
        <div className="relative">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-white/20 text-5xl shadow-lg ring-4 ring-white/30 mb-4">
            🏆
          </div>
          <h1 className="text-3xl font-black text-white leading-tight">Luar Biasa! 🎉</h1>
          <p className="mt-2 text-xl text-primary-200 leading-snug px-4">
            Kamu telah menyelesaikan<br />
            <span className="font-black text-white">{comic.title}</span>
          </p>
        </div>
      </div>

      {/* Content floats over header */}
      <div className="relative -mt-12 mx-auto w-full max-w-md px-4 flex flex-col gap-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard emoji="📊" label="Progress" value={`${progress.percentage}%`} color="bg-primary-600" />
          <StatCard emoji="⭐" label="XP Didapat" value={`+${xpEarned}`} color="bg-secondary-500" />
          <StatCard emoji="⏱️" label="Estimasi" value={waktuLabel} color="bg-accent-500" />
        </div>

        {/* Stage checklist */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <p className="text-sm font-black uppercase tracking-widest text-neutral-400">Tahapan</p>
            <h2 className="text-xl font-black text-neutral-900 mt-0.5">Yang Sudah Diselesaikan</h2>
          </div>
          <ul className="px-5 py-4 flex flex-col gap-3">
            {LEARNING_STAGES.map((stage) => {
              const done = completedSet.has(stage);
              return (
                <li key={stage} className="flex items-center gap-4">
                  <span className={[
                    'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xl',
                    done ? 'bg-accent-100' : 'bg-neutral-100',
                  ].join(' ')}>
                    {done ? '✅' : (STAGE_EMOJI[stage] ?? '○')}
                  </span>
                  <span className={`text-xl flex-1 ${done ? 'text-neutral-800 font-bold' : 'text-neutral-400'}`}>
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
          className="flex w-full items-center justify-center gap-3 min-h-[72px] rounded-2xl bg-primary-600 px-5 py-4 text-2xl font-black text-white shadow-md hover:bg-primary-700 active:scale-[0.98] transition-all"
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
    <div className="rounded-2xl bg-white shadow-sm px-3 py-4 flex flex-col items-center gap-2 text-center">
      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${color} text-xl`}>
        {emoji}
      </span>
      <span className="text-xl font-black text-neutral-900 leading-tight">{value}</span>
      <span className="text-sm text-neutral-400 leading-tight">{label}</span>
    </div>
  );
}
