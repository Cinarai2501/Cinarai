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
    progress,
  } = useLearningEngine();

  const isFirstStage = currentStage === Stage.Cover;
  const isLastLearningStage = currentStage === Stage.Introspection;

  const hasSlides = slideNav !== null;
  const onFirstSlide = !hasSlides || slideNav.slideIndex === 0;
  const onLastSlide = !hasSlides || slideNav.slideIndex === slideNav.totalSlides - 1;

  const handlePrev = useCallback(() => {
    if (hasSlides && !onFirstSlide) {
      slideNav.goPrev();
    } else {
      previousStage();
    }
  }, [hasSlides, onFirstSlide, slideNav, previousStage]);

  const handleNext = useCallback(() => {
    if (hasSlides && !onLastSlide) {
      slideNav.goNext();
    } else {
      void nextStage();
    }
  }, [hasSlides, onLastSlide, slideNav, nextStage]);

  const prevDisabled = ((hasSlides && !onFirstSlide) ? !slideNav!.canGoPrev : isFirstStage && onFirstSlide) || isSaving;
  const nextDisabled = ((hasSlides && !onLastSlide) ? !slideNav!.canGoNext : !canAdvance && onLastSlide) || isSaving;

  const isFinishAction = isLastLearningStage && onLastSlide;
  const isContinueAction = !isLastLearningStage && onLastSlide;

  const progressPercent = Math.round(progress.percentage ?? 0);

  if (isFinished) return null;

  return (
    <nav
      aria-label="Navigasi stage"
      className="sticky bottom-0 z-50 border-t border-neutral-200 bg-white/95 px-4 pt-3 backdrop-blur-sm shadow-sm md:px-6 lg:px-8"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 md:max-w-3xl">
        <div className="flex items-center justify-between gap-3 rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base font-semibold text-neutral-600 shadow-sm">
          <span>Kembali</span>
          <span className="text-center text-base font-black text-neutral-900">Progress {progressPercent}%</span>
          <span className="text-right">Lanjut</span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handlePrev}
            disabled={prevDisabled}
            className="flex min-h-[56px] min-w-[104px] w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 text-base font-semibold text-neutral-700 transition duration-200 hover:bg-neutral-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:translate-y-0.5 disabled:shadow-none"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Sebelumnya</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={nextDisabled}
            className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 text-base font-black text-white shadow-sm transition duration-200 hover:bg-primary-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-primary-300 disabled:animate-pulse"
          >
            {isSaving ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Menyimpan…
              </>
            ) : isFinishAction ? (
              'Selesai'
            ) : isContinueAction ? (
              'Lanjut'
            ) : (
              'Lanjut'
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
