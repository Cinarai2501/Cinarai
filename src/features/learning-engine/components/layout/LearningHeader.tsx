'use client';

import Link from 'next/link';
import { Stage, LEARNING_STAGES } from '../../types';
import { useLearningEngine } from '../../hooks/useLearningEngine';

export default function LearningHeader() {
  const { comic, currentStage, progress } = useLearningEngine();
  const visibleStages = LEARNING_STAGES.filter((stage) => stage !== Stage.Finish);
  const currentStep = visibleStages.indexOf(currentStage as (typeof visibleStages)[number]);
  const stepNumber = currentStep >= 0 ? currentStep + 1 : 1;
  const progressPct = Math.round(progress.percentage);

  return (
    <header
      className="bg-white border-b border-neutral-100 shadow-sm"
      style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}
    >
      <div className="mx-auto w-full max-w-[1400px] flex items-center gap-3 px-4 py-3 md:px-6 md:py-4 lg:px-8 overflow-hidden">
        <Link
          href="/dashboard"
          aria-label="Kembali ke dashboard"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className="flex-1 min-w-0">
          <h1 className="truncate text-sm font-black leading-tight text-neutral-800 md:text-base lg:text-lg">
            {comic.title}
          </h1>
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
          <span className="text-[11px] font-semibold text-neutral-500 sm:text-xs">
            {stepNumber} / {visibleStages.length}
          </span>
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-100 sm:w-20">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
