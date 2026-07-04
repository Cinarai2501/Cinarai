'use client';

import { useEffect, useRef } from 'react';
import { Stage, LEARNING_STAGES } from '../../types';
import { useLearningEngine } from '../../hooks/useLearningEngine';

const STAGE_LABELS: Record<Stage, string> = {
  [Stage.Cover]:             'Cover',
  [Stage.Contextualization]: 'Komik',
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

// Cover is included in the breadcrumb as the first step.
const BREADCRUMB_STAGES = LEARNING_STAGES.filter((s) => s !== Stage.Finish);

export default function LearningBreadcrumb() {
  const { currentStage, completedStages, goToStage } = useLearningEngine();
  const completedSet = new Set<string>(completedStages);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll active step into view on stage change
  useEffect(() => {
    const el = activeRef.current;
    const container = scrollRef.current;
    if (!el || !container) return;
    const elLeft = el.offsetLeft;
    const elWidth = el.offsetWidth;
    const containerWidth = container.offsetWidth;
    container.scrollTo({
      left: elLeft - containerWidth / 2 + elWidth / 2,
      behavior: 'smooth',
    });
  }, [currentStage]);

  return (
    <nav
      aria-label="Stage pembelajaran"
      className="bg-white border-b border-neutral-100"
    >
      <div
        ref={scrollRef}
        className="flex items-center gap-1 px-3 py-2 overflow-x-auto scrollbar-none"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {BREADCRUMB_STAGES.map((stage) => {
          const isCompleted = completedSet.has(stage);
          const isCurrent = currentStage === stage;
          const isAccessible = isCompleted || isCurrent;

          return (
            <button
              key={stage}
              ref={isCurrent ? activeRef : undefined}
              onClick={() => isAccessible && goToStage(stage)}
              disabled={!isAccessible}
              aria-current={isCurrent ? 'step' : undefined}
              style={{ scrollSnapAlign: 'start', flexShrink: 0 }}
              className={[
                'flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors whitespace-nowrap',
                isCurrent
                  ? 'bg-primary-600 text-white shadow-sm'
                  : isCompleted
                    ? 'bg-accent-100 text-accent-700 active:bg-accent-200'
                    : 'bg-neutral-100 text-neutral-400 cursor-not-allowed',
              ].join(' ')}
            >
              <span className="text-[12px] leading-none">{STAGE_EMOJI[stage]}</span>
              {STAGE_LABELS[stage]}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
