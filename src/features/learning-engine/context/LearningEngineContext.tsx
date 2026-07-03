'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createInitialProgressState } from '@/lib/progressEngine';
import type { ComicProgressState, Sintaks } from '@/types/progress';
import type { Comic } from '@/types/comic';
import {
  subscribeToLearningProgress,
  completeStage as persistCompleteStage,
} from '../services/learningEngineService';
import {
  Stage,
  ALL_STAGES,
  type LearningContextValue,
} from '../types';

const LearningContext = createContext<LearningContextValue | null>(null);

/** Map Stage enum → Sintaks string (Firestore uses Sintaks strings) */
function stageToSintaks(stage: Stage): Sintaks | null {
  if (stage === Stage.Finish) return null;
  return stage as unknown as Sintaks;
}

/** Map Sintaks string → Stage enum */
function sintaksToStage(sintaks: Sintaks): Stage {
  return Stage[sintaks as keyof typeof Stage] ?? Stage.Cover;
}

interface LearningEngineProviderProps {
  comic: Comic;
  children: React.ReactNode;
}

export function LearningEngineProvider({ comic, children }: LearningEngineProviderProps) {
  const { user } = useAuth();
  const comicId = comic.id;

  const [progress, setProgress] = useState<ComicProgressState>(
    createInitialProgressState(comicId)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [stageIndex, setStageIndex] = useState(0);

  // Subscribe to Firestore progress
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    const unsub = subscribeToLearningProgress(user.uid, comicId, (state) => {
      setProgress(state);
      setIsLoading(false);
    });
    return () => unsub();
  }, [user, comicId]);

  // Sync stageIndex to Firestore progress on initial load
  useEffect(() => {
    if (isLoading) return;
    if (progress.isCompleted) {
      setStageIndex(ALL_STAGES.indexOf(Stage.Finish));
      return;
    }
    const currentSintaks = progress.sintaksList.find((s) => s.status === 'CURRENT')?.sintaks;
    if (currentSintaks) {
      const stage = sintaksToStage(currentSintaks);
      const idx = ALL_STAGES.indexOf(stage);
      if (idx !== -1) setStageIndex(idx);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const currentStage = ALL_STAGES[stageIndex] ?? Stage.Cover;
  const totalStages = ALL_STAGES.length;

  const completedStages: Sintaks[] = useMemo(
    () => progress.sintaksList.filter((s) => s.status === 'COMPLETED').map((s) => s.sintaks),
    [progress.sintaksList]
  );

  const isFinished = currentStage === Stage.Finish || progress.isCompleted;

  /** Complete current stage in Firestore then advance to next stage. */
  const nextStage = useCallback(async () => {
    if (stageIndex >= totalStages - 1) return;

    const sintaks = stageToSintaks(currentStage);
    if (user && sintaks) {
      const next = await persistCompleteStage(user.uid, progress, sintaks);
      setProgress(next);
    }

    setStageIndex((i) => Math.min(i + 1, totalStages - 1));
  }, [user, stageIndex, totalStages, currentStage, progress]);

  const previousStage = useCallback(() => {
    setStageIndex((i) => Math.max(i - 1, 0));
  }, []);

  const goToStage = useCallback((stage: Stage) => {
    const idx = ALL_STAGES.indexOf(stage);
    if (idx !== -1) setStageIndex(idx);
  }, []);

  const finishLearning = useCallback(() => {
    setStageIndex(ALL_STAGES.indexOf(Stage.Finish));
  }, []);

  const value = useMemo<LearningContextValue>(
    () => ({
      comicId,
      comic,
      progress,
      currentStage,
      completedStages,
      isFinished,
      isLoading,
      stageIndex,
      totalStages,
      nextStage,
      previousStage,
      goToStage,
      finishLearning,
    }),
    [
      comicId,
      comic,
      progress,
      currentStage,
      completedStages,
      isFinished,
      isLoading,
      stageIndex,
      totalStages,
      nextStage,
      previousStage,
      goToStage,
      finishLearning,
    ]
  );

  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>;
}

export function useLearningEngine(): LearningContextValue {
  const ctx = useContext(LearningContext);
  if (!ctx) throw new Error('useLearningEngine must be used within LearningEngineProvider');
  return ctx;
}
