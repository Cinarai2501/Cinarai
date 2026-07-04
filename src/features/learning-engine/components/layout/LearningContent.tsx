'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';

const SWIPE_THRESHOLD = 48;
const SWIPE_VERT_LIMIT = 72;

interface LearningContentProps {
  children: ReactNode;
}

export default function LearningContent({ children }: LearningContentProps) {
  const { nextStage, previousStage, canAdvance, isSaving, stageIndex } = useLearningEngine();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

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

    if (dx < 0 && canAdvance && !isSaving) {
      void nextStage();
    } else if (dx > 0 && stageIndex > 0) {
      previousStage();
    }
  }, [nextStage, previousStage, canAdvance, isSaving, stageIndex]);

  return (
    <main
      ref={mainRef}
      className="flex-1 overflow-y-auto bg-[#f0f7ff]"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Mobile/tablet: centered narrow column. Desktop: fills sidebar's right column. */}
      <div className="mx-auto w-full max-w-2xl md:max-w-3xl lg:max-w-none px-3 pt-3 pb-8 md:px-6 md:pt-5 md:pb-10 lg:px-8 lg:pt-6 lg:pb-12 animate-fade-in">
        {children}
      </div>
    </main>
  );
}
