'use client';

import { Stage } from '../../types';
import { useLearningEngine } from '../../hooks/useLearningEngine';

export default function LearningBottomNav() {
  const {
    currentStage,
    stageIndex,
    isFinished,
    canAdvance,
    isSaving,
    nextStage,
    previousStage,
  } = useLearningEngine();

  const isFirst = stageIndex === 0;
  const isLastLearningStage = currentStage === Stage.Introspection;
  const showValidationMessage = !canAdvance && currentStage === Stage.Identification;
  const nextDisabled = !canAdvance || isSaving;

  if (isFinished) return null;

  return (
    <nav
      aria-label="Navigasi stage"
      className="flex-shrink-0 bg-white border-t border-neutral-200 px-3 pt-2.5 sm:px-6"
      style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}
    >
      {showValidationMessage && (
        <p className="text-center text-xs text-warning-700 font-bold bg-warning-50 border border-warning-200 rounded-xl px-3 py-2 mb-2">
          ⚠️ Jawab semua pertanyaan terlebih dahulu
        </p>
      )}

      <div className="flex items-center gap-2 mx-auto max-w-2xl">
        {/* Previous */}
        <button
          onClick={previousStage}
          disabled={isFirst || isSaving}
          aria-label="Stage sebelumnya"
          className="flex items-center justify-center gap-1 h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-[0.97]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden xs:inline">Sebelumnya</span>
        </button>

        {/* Next */}
        <button
          onClick={() => { void nextStage(); }}
          disabled={nextDisabled}
          aria-label={isLastLearningStage ? 'Selesaikan pembelajaran' : 'Stage berikutnya'}
          className="flex flex-1 items-center justify-center gap-1.5 h-11 rounded-xl bg-primary-600 px-4 text-sm font-black text-white shadow-sm hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-all active:scale-[0.97]"
        >
          {isSaving ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Menyimpan…
            </>
          ) : isLastLearningStage ? (
            'Selesai 🏆'
          ) : (
            <>
              Berikutnya
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </nav>
  );
}
