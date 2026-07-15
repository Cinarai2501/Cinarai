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

  const hasSlides = slideNav !== null;
  const onFirstSlide = !hasSlides || slideNav.slideIndex === 0;
  const onLastSlide = !hasSlides || slideNav.slideIndex === slideNav.totalSlides - 1;

  const handlePrev = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log('[LearningBottomNav] Prev clicked', { hasSlides, onFirstSlide, currentStage });
    if (hasSlides && !onFirstSlide) {
      slideNav.goPrev();
    } else {
      previousStage();
    }
  }, [hasSlides, onFirstSlide, slideNav, previousStage]);

  const handleNext = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log('[LearningBottomNav] Next clicked', { hasSlides, onLastSlide, canAdvance, currentStage });
    if (hasSlides && !onLastSlide) {
      slideNav.goNext();
    } else {
      void nextStage();
    }
  }, [hasSlides, onLastSlide, slideNav, nextStage]);

  const prevDisabled =
    ((hasSlides && !onFirstSlide) ? !slideNav!.canGoPrev : isFirstStage && onFirstSlide) || isSaving;
  const nextDisabled =
    ((hasSlides && !onLastSlide) ? !slideNav!.canGoNext : !canAdvance && onLastSlide) || isSaving;

  const isFinishAction = isLastLearningStage && onLastSlide;

  if (isFinished) return null;

  return (
    <nav
      aria-label="Navigasi stage"
      className="pointer-events-none sticky bottom-0 z-50 border-t border-neutral-200 bg-white/95 backdrop-blur-sm shadow-sm"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-3 py-2 md:max-w-3xl md:px-4">
        <button
          type="button"
          onClick={handlePrev}
          disabled={prevDisabled}
          aria-label="Sebelumnya"
          className="pointer-events-auto flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 transition duration-200 hover:bg-neutral-100 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={nextDisabled}
          className="pointer-events-auto flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-black text-white shadow-sm transition duration-200 hover:bg-primary-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-primary-300"
        >
          {isSaving ? (
            <>
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              <span>Menyimpan…</span>
            </>
          ) : isFinishAction ? (
            'Selesai'
          ) : (
            'Lanjut →'
          )}
        </button>
      </div>
    </nav>
  );
}
