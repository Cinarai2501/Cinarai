'use client';

import { useCallback, useEffect } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import { IdentificationProvider, useIdentificationContext } from '../../stages/Identification/context/IdentificationContext';
import StepAmati from '../../stages/Identification/components/StepAmati';
import StepIdentifikasi from '../../stages/Identification/components/StepIdentifikasi';

/**
 * Bridges IdentificationContext slides into LearningEngineContext slideNav.
 *
 * Flat slide layout:
 *   0 → OBSERVE
 *   1 → IDENTIFY (with inline feedback)
 */
function SlideNavBridge() {
  const {
    currentStep, nextStep, previousStep,
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
    registerSlideNav({ slideIndex, totalSlides, canGoNext, canGoPrev, goNext, goPrev });
  }, [slideIndex, totalSlides, canGoNext, canGoPrev, goNext, goPrev, registerSlideNav]);

  useEffect(() => () => unregisterSlideNav(), [unregisterSlideNav]);

  return null;
}

function StepRouter() {
  const { currentStep } = useIdentificationContext();
  if (currentStep === 'OBSERVE') return <StepAmati />;
  return <StepIdentifikasi />;
}

export default function IdentificationStage() {
  const { comic, setCanAdvance } = useLearningEngine();

  useEffect(() => {
    setCanAdvance(false);
  }, [setCanAdvance]);

  const handleCompleteChange = useCallback(
    (isComplete: boolean) => setCanAdvance(isComplete),
    [setCanAdvance]
  );

  return (
    <IdentificationProvider
      comicId={comic.id}
      lokasi={comic.lokasi}
      subtitle={comic.subtitle}
      kelas={comic.kelas}
      cover={comic.cover}
      title={comic.title}
      learningTargets={comic.learningTargets}
      onCompleteChange={handleCompleteChange}
    >
      <SlideNavBridge />
      <StepRouter />
    </IdentificationProvider>
  );
}
