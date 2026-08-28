'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Stage } from '../types';
import { useLearningEngine } from '../hooks/useLearningEngine';
import { stopGlobalTts } from '@/lib/tts/globalTts';

const StageLoading = () => null;
const ContextualizationStage = dynamic(() => import('./stages/ContextualizationStage'), { loading: StageLoading });
const CoverStage = dynamic(() => import('./stages/CoverStage'), { loading: StageLoading });
const IdentificationStage = dynamic(() => import('./stages/IdentificationStage'), { loading: StageLoading });
const NavigationStage = dynamic(() => import('./stages/NavigationStage'), { loading: StageLoading });
const Comic2NavigationStage = dynamic(() => import('@/features/comics/comic-2/components/Comic2NavigationStage'), { loading: StageLoading });
const ArgumentationStage = dynamic(() => import('./stages/ArgumentationStage'), { loading: StageLoading });
const ResolutionStage = dynamic(() => import('./stages/ResolutionStage'), { loading: StageLoading });
const ApplicationStage = dynamic(() => import('./stages/ApplicationStage'), { loading: StageLoading });
const IntrospectionStage = dynamic(() => import('./stages/IntrospectionStage'), { loading: StageLoading });
const FinishStage = dynamic(() => import('./stages/FinishStage'), { loading: StageLoading });

function StageContent() {
  const { currentStage, isLoading, comic } = useLearningEngine();
  if (isLoading) return null;
  switch (currentStage) {
    case Stage.Cover:            return <CoverStage />;
    case Stage.Contextualization: return <ContextualizationStage />;
    case Stage.Identification:    return <IdentificationStage />;
    case Stage.Navigation:        return comic.id === 2 ? <Comic2NavigationStage /> : <NavigationStage />;
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
  const pathname = usePathname();

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

  useEffect(() => {
    stopGlobalTts();
  }, [currentStage, pathname]);

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
