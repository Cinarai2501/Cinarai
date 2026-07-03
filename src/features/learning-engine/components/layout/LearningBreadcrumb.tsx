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

export default function LearningBreadcrumb() {
  const { currentStage, completedStages, goToStage } = useLearningEngine();

  // completedStages adalah Sintaks[] — nilainya identik dengan Stage enum string values
  const completedSet = new Set<string>(completedStages);

  return (
    <nav
      aria-label="Stage pembelajaran"
      className="bg-white border-b border-neutral-200 overflow-x-auto"
    >
      <ol className="flex items-center gap-1 px-4 py-2 sm:px-6 min-w-max">
        {LEARNING_STAGES.map((stage, index) => {
          const isCompleted = completedSet.has(stage);
          const isCurrent = currentStage === stage;
          const isAccessible = isCompleted || isCurrent;

          return (
            <li key={stage} className="flex items-center gap-1">
              {index > 0 && (
                <span className="text-neutral-300 text-xs select-none">›</span>
              )}
              <button
                onClick={() => isAccessible && goToStage(stage)}
                disabled={!isAccessible}
                aria-current={isCurrent ? 'step' : undefined}
                className={[
                  'px-2.5 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap min-h-touch flex items-center',
                  isCurrent
                    ? 'bg-primary-600 text-white'
                    : isCompleted
                      ? 'bg-accent-100 text-accent-700 hover:bg-accent-200'
                      : 'bg-neutral-100 text-neutral-400 cursor-not-allowed',
                ].join(' ')}
              >
                {STAGE_LABELS[stage]}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
