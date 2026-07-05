'use client';

import { Stage, LEARNING_STAGES } from '../../types';
import { useLearningEngine } from '../../hooks/useLearningEngine';

const STAGE_META: Record<Stage, { label: string; emoji: string }> = {
  [Stage.Cover]:             { label: 'Cover',           emoji: '📖' },
  [Stage.Contextualization]: { label: 'Baca Komik',      emoji: '📚' },
  [Stage.Identification]:    { label: 'Identifikasi',    emoji: '🔍' },
  [Stage.Navigation]:        { label: 'Navigasi',        emoji: '🧭' },
  [Stage.Argumentation]:     { label: 'Argumentasi',     emoji: '💬' },
  [Stage.Resolution]:        { label: 'Resolusi',        emoji: '💡' },
  [Stage.Application]:       { label: 'Penerapan',       emoji: '🎯' },
  [Stage.Introspection]:     { label: 'Refleksi',        emoji: '🪞' },
  [Stage.Finish]:            { label: 'Selesai',         emoji: '🏆' },
};

const VISIBLE_STAGES = LEARNING_STAGES.filter((s) => s !== Stage.Finish);

export default function LearningStageNav() {
  const { currentStage, completedStages, progress } = useLearningEngine();
  const completedSet = new Set<string>(completedStages);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-neutral-100 px-4 py-4 md:px-5 md:py-5">
        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400">
          Tahapan
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-black text-neutral-700 md:text-base">
            {Math.round(progress.percentage)}% selesai
          </span>
        </div>
        {/* Mini progress bar */}
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-700"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Stage list */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-2" aria-label="Daftar tahapan">
        {VISIBLE_STAGES.map((stage, i) => {
          const meta = STAGE_META[stage];
          const isCurrent = stage === currentStage;
          const isDone = completedSet.has(stage);

          return (
            <div
              key={stage}
              className={[
                'flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors',
                isCurrent
                  ? 'bg-primary-50 border border-primary-200'
                  : isDone
                    ? 'bg-neutral-50'
                    : 'bg-transparent',
              ].join(' ')}
            >
              {/* Step number / done indicator */}
              <span className={[
                'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-black',
                isCurrent
                  ? 'bg-primary-600 text-white'
                  : isDone
                    ? 'bg-accent-500 text-white'
                    : 'bg-neutral-100 text-neutral-400',
              ].join(' ')}>
                {isDone ? '✓' : i + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className={[
                  'text-sm font-bold leading-tight truncate',
                  isCurrent ? 'text-primary-700' : isDone ? 'text-neutral-700' : 'text-neutral-400',
                ].join(' ')}>
                  {meta.emoji} {meta.label}
                </p>
                {isCurrent && (
                  <p className="mt-0.5 text-xs text-primary-500">Sedang berlangsung</p>
                )}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-neutral-100 px-4 py-4 md:px-5">
        <p className="text-center text-xs leading-relaxed text-neutral-400 md:text-sm">
          Selesaikan setiap tahap untuk membuka tahap berikutnya.
        </p>
      </div>
    </div>
  );
}
