'use client';

import { useCallback, useEffect } from 'react';
import { useLearningEngine } from '../../../hooks/useLearningEngine';
import { useIdentificationContext } from '../context/IdentificationContext';

export default function IdentificationNavigation() {
  const { state, currentQuestionIndex, setCurrentQuestionIndex, checkedItems } = useIdentificationContext();
  const { registerSlideNav, unregisterSlideNav } = useLearningEngine();

  const currentItem = state.items[currentQuestionIndex];
  const canGoNext = Boolean(currentItem && checkedItems[currentItem.id]);
  const canGoPrev = currentQuestionIndex > 0;

  const goNext = useCallback(() => {
    if (canGoNext && currentQuestionIndex < state.items.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }, [canGoNext, currentQuestionIndex, setCurrentQuestionIndex, state.items.length]);
  const goPrev = useCallback(() => {
    if (canGoPrev) setCurrentQuestionIndex(currentQuestionIndex - 1);
  }, [canGoPrev, currentQuestionIndex, setCurrentQuestionIndex]);

  useEffect(() => {
    registerSlideNav({
      slideIndex: 0,
      totalSlides: state.items.length,
      canGoNext,
      canGoPrev,
      goNext,
      goPrev,
    });
  }, [canGoNext, canGoPrev, goNext, goPrev, registerSlideNav, state.items.length]);

  useEffect(() => () => unregisterSlideNav(), [unregisterSlideNav]);

  return null;
}
