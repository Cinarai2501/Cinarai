'use client';

import { useMemo } from 'react';
import { useLearningEngine } from '../../../hooks/useLearningEngine';
import { LEARNING_STAGES } from '../../../types';

export default function IdentificationHeader() {
  const { currentStage, previousStage, progress } = useLearningEngine();

  const { stageNumber, totalStages, progressPercentage } = useMemo(() => {
    const index = LEARNING_STAGES.indexOf(currentStage);
    return {
      stageNumber: index === -1 ? 0 : index + 1,
      totalStages: LEARNING_STAGES.length,
      progressPercentage: Math.round(progress.percentage ?? 0),
    };
  }, [currentStage, progress.percentage]);

  return (
    <div className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 pb-4 pt-3 backdrop-blur-sm shadow-sm">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-3 sm:px-4 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={previousStage}
            className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-base font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
          >
            ← Kembali
          </button>
          <span className="text-base font-semibold uppercase tracking-[0.25em] text-neutral-400">
            Tahap {stageNumber} dari {totalStages}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black uppercase tracking-[0.35em] text-neutral-900 sm:text-3xl">
            IDENTIFICATION
          </h1>
          <div className="rounded-2xl bg-neutral-100 p-3">
            <div className="flex items-center justify-between gap-3 text-base font-semibold text-neutral-600">
              <span>Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-primary-600 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
