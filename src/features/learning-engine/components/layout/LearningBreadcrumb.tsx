'use client';

import { Stage, LEARNING_STAGES } from '../../types';
import { useLearningEngine } from '../../hooks/useLearningEngine';

const STAGE_LABELS: Record<Stage, string> = {
  [Stage.Cover]:             'Cover',
  [Stage.Contextualization]: 'Konteks',
  [Stage.Identification]:    'Identifikasi',
  [Stage.Navigation]:        'Navigasi',
  [Stage.Argumentation]:     'Argumen',
  [Stage.Resolution]:        'Resolusi',
  [Stage.Application]:       'Aplikasi',
  [Stage.Introspection]:     'Refleksi',
  [Stage.Finish]:            'Selesai',
};

const STAGE_EMOJI: Record<Stage, string> = {
  [Stage.Cover]:             '📖',
  [Stage.Contextualization]: '📚',
  [Stage.Identification]:    '🔍',
  [Stage.Navigation]:        '🧭',
  [Stage.Argumentation]:     '💬',
  [Stage.Resolution]:        '💡',
  [Stage.Application]:       '🎯',
  [Stage.Introspection]:     '🪞',
  [Stage.Finish]:            '🏆',
};

export default function LearningBreadcrumb() {
  const { currentStage, completedStages, goToStage } = useLearningEngine();
  const completedSet = new Set<string>(completedStages);

  return (
    <nav
      aria-label="Stage pembelajaran"
      className="relative bg-white border-b border-neutral-100 overflow-x-auto scrollbar-none"
    >
      <ol className="flex items-center gap-1.5 px-4 py-2.5 sm:px-6 min-w-max">
        {LEARNING_STAGES.map((stage, index) => {
          const isCompleted = completedSet.has(stage);
          const isCurrent = currentStage === stage;
          const isAccessible = isCompleted || isCurrent;

          return (
            <li key={stage} className="flex items-center gap-1.5">
              {index > 0 && (
                <span className="text-neutral-300 text-xs select-none">›</span>
              )}
              <button
                onClick={() => isAccessible && goToStage(stage)}
                disabled={!isAccessible}
                aria-current={isCurrent ? 'step' : undefined}
                className={[
                  'flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap min-h-[32px]',
                  isCurrent
                    ? 'bg-primary-600 text-white shadow-sm'
                    : isCompleted
                      ? 'bg-accent-100 text-accent-700 hover:bg-accent-200'
                      : 'bg-neutral-100 text-neutral-400 cursor-not-allowed',
                ].join(' ')}
              >
                <span className="text-[13px] leading-none">{STAGE_EMOJI[stage]}</span>
                {STAGE_LABELS[stage]}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
