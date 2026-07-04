'use client';

import type { Comic } from '@/types/comic';
import { Stage } from '../types';
import { LearningEngineProvider } from '../context/LearningEngineContext';
import LearningLayout from './layout/LearningLayout';
import StageRouter from './StageRouter';
import { useLearningEngine } from '../hooks/useLearningEngine';

function LearningEngineInner() {
  const { isLoading, isFinished, currentStage } = useLearningEngine();

  if (isLoading) {
    return <LearningPageSkeleton />;
  }

  // FinishStage renders full-screen without layout
  if (isFinished) {
    return <StageRouter />;
  }

  // ContextualizationStage manages its own full-height layout (PDF reader)
  if (currentStage === Stage.Contextualization) {
    return <StageRouter />;
  }

  return (
    <LearningLayout>
      <StageRouter />
    </LearningLayout>
  );
}

interface LearningEngineProps {
  comic: Comic;
}

export default function LearningEngine({ comic }: LearningEngineProps) {
  return (
    <LearningEngineProvider comic={comic}>
      <LearningEngineInner />
    </LearningEngineProvider>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

export function LearningPageSkeleton() {
  return (
    <div className="flex flex-col bg-[#f0f7ff]" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="bg-white border-b border-neutral-100 shadow-sm">
        <div className="mx-auto w-full max-w-[1400px] flex items-center gap-3 px-3 py-2.5 md:px-6 lg:px-8">
          <div className="h-9 w-9 rounded-xl bg-neutral-100 flex-shrink-0 skeleton" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 w-24 rounded-full skeleton" />
            <div className="h-3.5 w-40 rounded-full skeleton" />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b border-neutral-100">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-2 md:px-6 lg:px-8">
          <div className="flex justify-between mb-1.5">
            <div className="h-2.5 w-24 rounded-full skeleton" />
            <div className="h-2.5 w-8 rounded-full skeleton" />
          </div>
          <div className="h-1.5 w-full rounded-full bg-neutral-100" />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 mx-auto w-full max-w-[1400px]">
        {/* Sidebar skeleton — desktop only */}
        <div className="hidden lg:flex flex-shrink-0 w-64 xl:w-72 flex-col border-r border-neutral-200 bg-white px-4 py-4 gap-3">
          <div className="h-3 w-20 rounded-full skeleton" />
          <div className="h-2 w-full rounded-full bg-neutral-100" />
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2">
              <div className="h-8 w-8 rounded-full skeleton flex-shrink-0" />
              <div className="h-3 flex-1 rounded-full skeleton" />
            </div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex-1 overflow-hidden px-3 pt-3 pb-8 md:px-6 md:pt-5 lg:px-8 lg:pt-6 space-y-4">
            <div className="-mx-3 md:mx-0 h-56 md:h-72 lg:h-80 skeleton md:rounded-2xl" />
            <div className="rounded-2xl bg-white shadow-sm p-5 space-y-3">
              <div className="h-5 w-3/4 rounded-full skeleton" />
              <div className="h-4 w-1/2 rounded-full skeleton" />
              <div className="flex gap-2 mt-1">
                {[72, 64, 80].map((w, i) => (
                  <div key={i} className="h-7 rounded-full skeleton" style={{ width: w }} />
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-white shadow-sm p-5 space-y-3">
              {[100, 90, 95, 85].map((w, i) => (
                <div key={i} className="h-4 rounded-full skeleton" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>

          {/* Bottom nav skeleton */}
          <div className="bg-white border-t border-neutral-200 px-3 pt-2.5 pb-3 md:px-6 lg:px-8 flex gap-2">
            <div className="h-11 md:h-12 w-28 rounded-xl skeleton" />
            <div className="h-11 md:h-12 flex-1 rounded-xl skeleton" />
          </div>
        </div>
      </div>
    </div>
  );
}
