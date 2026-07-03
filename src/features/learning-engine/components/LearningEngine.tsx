'use client';

import type { Comic } from '@/types/comic';
import { LearningEngineProvider } from '../context/LearningEngineContext';
import LearningLayout from './layout/LearningLayout';
import StageRouter from './StageRouter';
import { useLearningEngine } from '../hooks/useLearningEngine';

function LearningEngineInner() {
  const { isLoading, isFinished } = useLearningEngine();

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-neutral-50">
        <div className="h-10 w-10 rounded-full border-4 border-primary-200 border-t-primary-500 animate-spin" />
      </div>
    );
  }

  // FinishStage renders full-screen without layout
  if (isFinished) {
    return <StageRouter />;
  }

  return (
    <LearningLayout>
      <StageRouter />
    </LearningLayout>
  );
}

interface LearningEngineProps {
  comic: Comic;
}

export default function LearningEngine({ comic }: LearningEngineProps) {
  return (
    <LearningEngineProvider comic={comic}>
      <LearningEngineInner />
    </LearningEngineProvider>
  );
}
