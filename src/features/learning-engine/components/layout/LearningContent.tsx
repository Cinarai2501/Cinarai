'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';

const SWIPE_THRESHOLD = 48;
const SWIPE_VERT_LIMIT = 72;

interface LearningContentProps {
  children: ReactNode;
}

export default function LearningContent({ children }: LearningContentProps) {
  const { nextStage, previousStage, canAdvance, isSaving, stageIndex, slideNav, resetProgress, isFinished } = useLearningEngine();
  const mainRef = useRef<HTMLElement>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = useCallback(async () => {
    if (isResetting) return;
    const confirmed = window.confirm(
      'Ulang pembelajaran dari awal? Progress dan jawaban yang sudah disimpan akan dihapus.'
    );
    if (!confirmed) return;
    setIsResetting(true);
    try {
      await resetProgress();
    } finally {
      setIsResetting(false);
    }
  }, [isResetting, resetProgress]);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 1) {
      touchStartX.current = null;
      touchStartY.current = null;
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    if (e.changedTouches.length !== 1) return;

    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    if (Math.abs(dy) > SWIPE_VERT_LIMIT) return;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;

    const hasSlides = slideNav !== null;
    const onLastSlide = !hasSlides || slideNav.slideIndex === slideNav.totalSlides - 1;
    const onFirstSlide = !hasSlides || slideNav.slideIndex === 0;

    if (dx < 0) {
      if (hasSlides && !onLastSlide) {
        slideNav.goNext();
      } else if (canAdvance && !isSaving) {
        void nextStage();
      }
    } else {
      if (hasSlides && !onFirstSlide) {
        slideNav.goPrev();
      } else if (stageIndex > 0) {
        previousStage();
      }
    }
  }, [nextStage, previousStage, canAdvance, isSaving, stageIndex, slideNav]);

  return (
    <main
      ref={mainRef}
      className="flex-1 overflow-y-auto overflow-x-hidden bg-[#f0f7ff]"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="mx-auto w-full max-w-2xl px-3 pb-8 pt-3 animate-fade-in sm:px-4 md:max-w-3xl md:px-6 md:pb-10 md:pt-5 lg:px-8 lg:pb-12 lg:pt-6">
        {children}

        {/* Reset — below stage content, only when not finished */}
        {!isFinished && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => { void handleReset(); }}
              disabled={isResetting}
              className="flex w-full min-h-[40px] items-center justify-center gap-1.5 rounded-2xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-400 transition-colors hover:border-error-200 hover:bg-error-50 hover:text-error-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResetting ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-500" />
              ) : (
                <span>↺</span>
              )}
              Ulang Pembelajaran
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
