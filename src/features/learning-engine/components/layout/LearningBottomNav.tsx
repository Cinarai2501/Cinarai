'use client';

import { Stage } from '../../types';
import { useLearningEngine } from '../../hooks/useLearningEngine';

export default function LearningBottomNav() {
  const {
    currentStage,
    stageIndex,
    isFinished,
    canAdvance,
    nextStage,
    previousStage,
  } = useLearningEngine();

  const isFirst = stageIndex === 0;
  const isLastLearningStage = currentStage === Stage.Introspection;

  if (isFinished) return null;

  return (
    <nav
      aria-label="Navigasi stage"
      className="flex-shrink-0 bg-white border-t border-neutral-200 px-4 py-3 sm:px-6"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center gap-3 mx-auto max-w-2xl">
        {/* Previous */}
        <button
          onClick={previousStage}
          disabled={isFirst}
          aria-label="Stage sebelumnya"
          className="flex items-center justify-center gap-2 min-h-touch rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-600 shadow-xs hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Sebelumnya
        </button>

        {/* Next */}
        <button
          onClick={nextStage}
          disabled={!canAdvance}
          aria-label={isLastLearningStage ? 'Selesaikan pembelajaran' : 'Stage berikutnya'}
          className="flex flex-1 items-center justify-center gap-2 min-h-touch rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-xs hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLastLearningStage ? 'Selesai' : 'Berikutnya'}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
