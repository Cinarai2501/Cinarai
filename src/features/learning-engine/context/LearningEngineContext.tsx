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
import { useSnackbar } from '@/context/SnackbarContext';
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
import { extractFirebaseErrorCode } from '@/services/comicProgress';

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
  const { user, loading: authLoading } = useAuth();
  const { showSnackbar } = useSnackbar();
  const comicId = comic.id;

  const [progress, setProgress] = useState<ComicProgressState>(
    createInitialProgressState(comicId)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [stageIndex, setStageIndex] = useState(0);
  const [canAdvance, setCanAdvance] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // True after the first Firestore snapshot has been applied — prevents subsequent
  // snapshots from overriding the user's in-session navigation.
  const initialSyncDoneRef = React.useRef(false);
  // Stable ref so nextStage() always reads the latest Firestore snapshot
  const progressRef = React.useRef(progress);
  useEffect(() => { progressRef.current = progress; }, [progress]);
  // Ref guard to prevent concurrent nextStage calls (isSaving state can be stale in closure)
  const isSavingRef = React.useRef(false);

  // Subscribe to Firestore progress
  // Wait for auth to resolve before deciding what to do.
  useEffect(() => {
    // Auth still initialising — keep isLoading true, don't subscribe yet
    if (authLoading) return;

    // Definitely unauthenticated — nothing to load
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Safety net: if the first snapshot never arrives, stop spinning after 10s
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 10_000);

    const unsub = subscribeToLearningProgress(
      user.uid,
      comicId,
      (state) => {
        clearTimeout(timeout);
        setProgress(state);
        setIsLoading(false);
      },
      (error) => {
        clearTimeout(timeout);
        console.error('[LearningEngine] Firestore progress subscription error', error);
        setIsLoading(false);
      }
    );
    return () => {
      clearTimeout(timeout);
      unsub();
    };
  }, [authLoading, user, comicId]);

  // Sync stageIndex to Firestore progress on initial load only.
  // After the first sync, in-session navigation drives stageIndex exclusively.
  useEffect(() => {
    if (isLoading) return;
    if (initialSyncDoneRef.current) return;
    initialSyncDoneRef.current = true;

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
    if (!canAdvance || isSavingRef.current || stageIndex >= totalStages - 1) return;

    const sintaks = stageToSintaks(currentStage);
    const nextStageEnum = ALL_STAGES[stageIndex + 1] ?? Stage.Finish;

    console.log('[CURRENT STAGE]', currentStage);
    console.log('[NEXT STAGE]', nextStageEnum);
    console.log('[ROUTE]', `/comic/${comicId}/learn`);

    if (!user?.uid) {
      console.error('[SAVE FAILED] CURRENT UID: null — login diperlukan');
      showSnackbar('Gagal menyimpan progress: login diperlukan.', 'error');
      return;
    }

    console.log('[CURRENT UID]', user.uid);

    if (sintaks) {
      isSavingRef.current = true;
      setIsSaving(true);
      try {
        console.log('[START SAVE] uid:', user.uid, '| sintaks:', sintaks);
        const next = await persistCompleteStage(user.uid, progressRef.current, sintaks);
        setProgress(next);
        console.log('[SAVE SUCCESS] uid:', user.uid, '| sintaks:', sintaks);
        showSnackbar('Progress berhasil disimpan ✓', 'success');
      } catch (error) {
        const code = extractFirebaseErrorCode(error);
        console.error('[SAVE FAILED] code:', code, '| uid:', user.uid, '| sintaks:', sintaks, error);
        showSnackbar(`Gagal menyimpan progress: ${code}`, 'error');
        isSavingRef.current = false;
        setIsSaving(false);
        return;
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    }

    setStageIndex((i) => Math.min(i + 1, totalStages - 1));
  }, [user, comicId, stageIndex, totalStages, currentStage, canAdvance, showSnackbar]);

  const previousStage = useCallback(() => {
    setCanAdvance(true); // reset gate saat mundur
    setStageIndex((i) => Math.max(i - 1, 0));
  }, []);

  const goToStage = useCallback((stage: Stage) => {
    const idx = ALL_STAGES.indexOf(stage);
    if (idx !== -1) {
      setCanAdvance(true); // reset gate saat navigasi via breadcrumb
      setStageIndex(idx);
    }
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
      canAdvance,
      setCanAdvance,
      isSaving,
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
      canAdvance,
      setCanAdvance,
      isSaving,
    ]
  );

  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>;
}

export function useLearningEngine(): LearningContextValue {
  const ctx = useContext(LearningContext);
  if (!ctx) throw new Error('useLearningEngine must be used within LearningEngineProvider');
  return ctx;
}
