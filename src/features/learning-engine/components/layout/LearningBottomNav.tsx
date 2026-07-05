'use client';

import { useCallback } from 'react';
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
    slideNav,
  } = useLearningEngine();

  const isFirstStage = currentStage === Stage.Cover;
  const isLastLearningStage = currentStage === Stage.Introspection;

  // Slide-aware flags
  const hasSlides = slideNav !== null;
  const onFirstSlide = !hasSlides || slideNav.slideIndex === 0;
  const onLastSlide = !hasSlides || slideNav.slideIndex === slideNav.totalSlides - 1;

  // Previous: go to prev slide first, only cross stage boundary at slide 0
  const handlePrev = useCallback(() => {
    if (hasSlides && !onFirstSlide) {
      slideNav.goPrev();
    } else {
      previousStage();
    }
  }, [hasSlides, onFirstSlide, slideNav, previousStage]);

  // Next: go to next slide first, only cross stage boundary at last slide
  const handleNext = useCallback(() => {
    if (hasSlides && !onLastSlide) {
      slideNav.goNext();
    } else {
      void nextStage();
    }
  }, [hasSlides, onLastSlide, slideNav, nextStage]);

  const prevDisabled = (isFirstStage && onFirstSlide) || isSaving;
  const nextDisabled = (!canAdvance && onLastSlide) || isSaving;

  // On last slide of last stage, Next becomes "Selesai"
  const isFinishAction = isLastLearningStage && onLastSlide;
  // On last slide of a non-last stage, Next becomes "Lanjut ke Tahap Berikutnya"
  const isContinueAction = !isLastLearningStage && onLastSlide;

  const showValidation = !canAdvance && onLastSlide;

  if (isFinished) return null;

  return (
    <nav
      aria-label="Navigasi stage"
      className="flex-shrink-0 border-t border-neutral-200 bg-white px-4 pt-3 md:px-6 lg:px-8"
      style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}
    >
      {showValidation && (
        <p className="mx-auto mb-3 w-full max-w-2xl rounded-2xl border border-warning-200 bg-warning-50 px-4 py-3 text-center text-base font-semibold text-warning-700 md:max-w-3xl">
          ⚠️ Selesaikan semua bagian terlebih dahulu
        </p>
      )}

      <div className="mx-auto flex w-full max-w-2xl items-center gap-3 md:max-w-3xl">
        {/* Previous */}
        <button
          onClick={handlePrev}
          disabled={prevDisabled}
          aria-label="Sebelumnya"
          className="flex min-h-[48px] min-w-[112px] items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 text-base font-semibold text-neutral-600 transition-colors hover:bg-neutral-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Sebelumnya</span>
        </button>

        {/* Next / Continue / Finish */}
        <button
          onClick={handleNext}
          disabled={nextDisabled}
          aria-label={isFinishAction ? 'Selesaikan pembelajaran' : isContinueAction ? 'Lanjut ke tahap berikutnya' : 'Slide berikutnya'}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 text-base font-black text-white shadow-sm transition-all hover:bg-primary-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {isSaving ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Menyimpan…
            </>
          ) : isFinishAction ? (
            'Selesai 🏆'
          ) : isContinueAction ? (
            <>
              Lanjut ke Tahap Berikutnya
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </>
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
