'use client';

import { Stage } from '../../types';
import { useLearningEngine } from '../../hooks/useLearningEngine';

export default function LearningBottomNav() {
  const {
    currentStage,
    isFinished,
    canAdvance,
    isSaving,
    nextStage,
    previousStage,
  } = useLearningEngine();

  const isFirst = currentStage === Stage.Cover;
  const isLastLearningStage = currentStage === Stage.Introspection;
  const showValidationMessage = !canAdvance;
  const nextDisabled = !canAdvance || isSaving;

  if (isFinished) return null;

  return (
    <nav
      aria-label="Navigasi stage"
      className="flex-shrink-0 border-t border-neutral-200 bg-white px-4 pt-3 md:px-6 lg:px-8"
      style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}
    >
      {showValidationMessage && (
        <p className="mx-auto mb-3 w-full max-w-2xl rounded-2xl border border-warning-200 bg-warning-50 px-4 py-3 text-center text-sm font-semibold text-warning-700 md:max-w-3xl md:text-base">
          ⚠️ Selesaikan semua bagian terlebih dahulu
        </p>
      )}

      <div className="mx-auto flex w-full max-w-2xl items-center gap-3 md:max-w-3xl">
        {/* Previous */}
        <button
          onClick={previousStage}
          disabled={isFirst || isSaving}
          aria-label="Stage sebelumnya"
          className="flex h-11 min-w-[112px] items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-600 transition-colors hover:bg-neutral-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 md:h-12 md:min-w-[132px] md:text-base"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Sebelumnya</span>
        </button>

        {/* Next */}
        <button
          onClick={() => { void nextStage(); }}
          disabled={nextDisabled}
          aria-label={isLastLearningStage ? 'Selesaikan pembelajaran' : 'Stage berikutnya'}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 text-sm font-black text-white shadow-sm transition-all hover:bg-primary-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-300 md:h-12 md:text-base"
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
