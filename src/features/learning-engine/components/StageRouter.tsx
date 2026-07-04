'use client';

import { useEffect, useRef } from 'react';
import { Stage } from '../types';
import { useLearningEngine } from '../hooks/useLearningEngine';
import ContextualizationStage from './stages/ContextualizationStage';
import CoverStage from './stages/CoverStage';
import IdentificationStage from './stages/IdentificationStage';
import NavigationStage from './stages/NavigationStage';
import ArgumentationStage from './stages/ArgumentationStage';
import ResolutionStage from './stages/ResolutionStage';
import ApplicationStage from './stages/ApplicationStage';
import IntrospectionStage from './stages/IntrospectionStage';
import FinishStage from './stages/FinishStage';

function StageContent() {
  const { currentStage, isLoading } = useLearningEngine();
  if (isLoading) return null;
  switch (currentStage) {
    case Stage.Cover:            return <CoverStage />;
    case Stage.Contextualization: return <ContextualizationStage />;
    case Stage.Identification:    return <IdentificationStage />;
    case Stage.Navigation:        return <NavigationStage />;
    case Stage.Argumentation:     return <ArgumentationStage />;
    case Stage.Resolution:        return <ResolutionStage />;
    case Stage.Application:       return <ApplicationStage />;
    case Stage.Introspection:     return <IntrospectionStage />;
    case Stage.Finish:            return <FinishStage />;
    default:                      return null;
  }
}

export default function StageRouter() {
  const { currentStage, isLoading, isFinished } = useLearningEngine();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Reset scroll to top on every stage change AND on initial load completion.
  // Runs when currentStage changes (stage navigation) or when isLoading flips
  // false (first render after Firestore data arrives).
  useEffect(() => {
    if (isLoading) return;
    // Scroll the nearest overflow-y scroll container (LearningContent <main>)
    let el: HTMLElement | null = wrapperRef.current?.parentElement ?? null;
    while (el) {
      const overflow = window.getComputedStyle(el).overflowY;
      if (overflow === 'auto' || overflow === 'scroll') {
        el.scrollTo({ top: 0, behavior: 'instant' });
        return;
      }
      el = el.parentElement;
    }
    // Fallback: reset window scroll (covers initial navigation from PDF page)
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentStage, isLoading]);

  // FinishStage renders full-screen without layout wrapper
  if (isFinished) {
    return <FinishStage />;
  }

  return (
    <div
      ref={wrapperRef}
      key={currentStage}
      className="animate-stage-in"
    >
      <StageContent />
    </div>
  );
}
