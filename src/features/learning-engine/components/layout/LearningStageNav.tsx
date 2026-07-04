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
      <div className="px-5 py-5 border-b border-neutral-100">
        <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-1">
          Tahapan
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-black text-neutral-700">
            {Math.round(progress.percentage)}% selesai
          </span>
        </div>
        {/* Mini progress bar */}
        <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-700"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Stage list */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-1" aria-label="Daftar tahapan">
        {VISIBLE_STAGES.map((stage, i) => {
          const meta = STAGE_META[stage];
          const isCurrent = stage === currentStage;
          const isDone = completedSet.has(stage);

          return (
            <div
              key={stage}
              className={[
                'flex items-center gap-3 rounded-xl px-3 py-3 transition-colors',
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
                  <p className="text-xs text-primary-500 mt-0.5">Sedang berlangsung</p>
                )}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-neutral-100">
        <p className="text-xs text-neutral-400 leading-relaxed text-center">
          Selesaikan setiap tahap untuk membuka tahap berikutnya.
        </p>
      </div>
    </div>
  );
}
