'use client';

import { useCallback, useEffect } from 'react';
import { useLearningEngine } from '../../../hooks/useLearningEngine';
import { useIdentificationContext } from '../context/IdentificationContext';

export default function IdentificationNavigation() {
  const {
    currentStep,
    nextStep,
    previousStep,
    state,
  } = useIdentificationContext();
  const { registerSlideNav, unregisterSlideNav } = useLearningEngine();

  const slideIndex = currentStep === 'OBSERVE' ? 0 : 1;
  const totalSlides = 2;

  const canGoNext =
    currentStep === 'OBSERVE'
      ? state.observe.note.trim().length > 0
      : state.isComplete;

  const canGoPrev = slideIndex > 0;

  const goNext = useCallback(() => {
    if (currentStep === 'OBSERVE') nextStep();
  }, [currentStep, nextStep]);

  const goPrev = useCallback(() => {
    if (currentStep === 'IDENTIFY') previousStep();
  }, [currentStep, previousStep]);

  useEffect(() => {
    registerSlideNav({
      slideIndex,
      totalSlides,
      canGoNext,
      canGoPrev,
      goNext,
      goPrev,
    });
  }, [slideIndex, totalSlides, canGoNext, canGoPrev, goNext, goPrev, registerSlideNav]);

  useEffect(() => () => unregisterSlideNav(), [unregisterSlideNav]);

  return null;
}
