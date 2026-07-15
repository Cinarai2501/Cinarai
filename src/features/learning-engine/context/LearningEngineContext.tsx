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
import { loadComicModule } from '@/features/comics';
import {
  subscribeToLearningProgress,
  completeStage as persistCompleteStage,
  resetLearningProgress,
} from '../services/learningEngineService';
import { clearStoredComicReadingProgressEntry } from '@/lib/comicReadingProgressStorage';
import {
  Stage,
  ALL_STAGES,
  type LearningContextValue,
  type SlideNavState,
} from '../types';
import { extractFirebaseErrorCode } from '@/services/comicProgress';

function logLearningEngine(functionName: string, comicId: number, page: number, totalPages: number, completed: boolean) {
  // eslint-disable-next-line no-console
  console.log('[learning-engine]', {
    comicId,
    currentPage: page,
    totalPages,
    completed,
    timestamp: new Date().toISOString(),
    functionName,
  });
  // eslint-disable-next-line no-console
  console.log('[learning-engine-stack]', new Error().stack?.split('\n').slice(1, 4).join(' | '));
}

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

// Global `__cinaraiDebug` declared in src/types/cinarai-debug.d.ts

interface LearningEngineProviderProps {
  comic: Comic;
  children: React.ReactNode;
}

export function LearningEngineProvider({ comic, children }: LearningEngineProviderProps) {
  const { user, loading: authLoading } = useAuth();
  const { showSnackbar } = useSnackbar();
  const comicId = comic.id;
  const comicModule = useMemo(() => loadComicModule(comicId), [comicId]);

  const [progress, setProgress] = useState<ComicProgressState>(
    createInitialProgressState(comicId)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [stageIndex, setStageIndex] = useState(0);
  const [canAdvance, setCanAdvance] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [slideNav, setSlideNav] = useState<SlideNavState | null>(null);
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
  // On mount, read the current stage from Firestore and set it as the active stage.
  useEffect(() => {
    if (isLoading) return;
    if (initialSyncDoneRef.current) return;
    initialSyncDoneRef.current = true;

    if (progress.isCompleted) {
      setStageIndex(ALL_STAGES.indexOf(Stage.Finish));
      return;
    }

    const currentSintaks = progress.sintaksList.find((s) => s.status === 'CURRENT')?.sintaks;
    const stage = currentSintaks ? sintaksToStage(currentSintaks) : Stage.Cover;

    const idx = ALL_STAGES.indexOf(stage);
    if (idx !== -1) setStageIndex(idx);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const currentStage = ALL_STAGES[stageIndex] ?? Stage.Cover;
  const totalStages = ALL_STAGES.length;

  useEffect(() => {
    if (isLoading) return;
  }, [currentStage, stageIndex, isLoading]);

  const completedStages: Sintaks[] = useMemo(
    () => progress.sintaksList.filter((s) => s.status === 'COMPLETED').map((s) => s.sintaks),
    [progress.sintaksList]
  );

  const isFinished = currentStage === Stage.Finish || progress.isCompleted;

  /** Save sintaks ke Firestore lalu langsung advance — tanpa cek canAdvance gate.
   *  Dipakai oleh ContextualizationStage saat tombol "Selesai Membaca" ditekan.
   */
  const completeAndAdvance = useCallback(async (sintaks: Sintaks) => {
    if (isSavingRef.current) return;

    const currentStageEnum = sintaksToStage(sintaks);
    const currentIdx = ALL_STAGES.indexOf(currentStageEnum);
    const nextStageEnum = ALL_STAGES[currentIdx + 1] ?? Stage.Identification;

    if (!user?.uid) {
      showSnackbar('Gagal menyimpan progress: login diperlukan.', 'error');
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    let next: ComicProgressState | null = null;
    try {
      next = await persistCompleteStage(user.uid, progressRef.current, sintaks);
      progressRef.current = next;
      setProgress(next);
      showSnackbar('Progress berhasil disimpan ✓', 'success');
    } catch (error) {
      const code = extractFirebaseErrorCode(error);
      showSnackbar(`Gagal menyimpan progress: ${code}`, 'error');
      isSavingRef.current = false;
      setIsSaving(false);
      return; // jangan advance jika save gagal
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }

    if (next) {
      const nextCurrentSintaks = next.sintaksList.find((item) => item.status === 'CURRENT')?.sintaks;
      const nextStageFromProgress = nextCurrentSintaks ? sintaksToStage(nextCurrentSintaks) : nextStageEnum;
      const nextIdx = ALL_STAGES.indexOf(nextStageFromProgress);
      if (nextIdx !== -1) {
        setStageIndex(nextIdx);
      }
    }
  }, [user, showSnackbar]);

  /** Complete current stage in Firestore then advance to next stage. */
  const completeCurrentStage = useCallback(async (metadata?: Record<string, unknown>) => {
    if (isSavingRef.current) return false;

    const sintaks = stageToSintaks(currentStage);
    if (!sintaks) return false;

    if (!user?.uid) {
      showSnackbar('Gagal menyimpan progress: login diperlukan.', 'error');
      return false;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    try {
      const next = await persistCompleteStage(user.uid, progressRef.current, sintaks, metadata);
      progressRef.current = next;
      setProgress(next);
      const nextCurrentSintaks = next.sintaksList.find((item) => item.status === 'CURRENT')?.sintaks;
      const nextStageFromProgress = nextCurrentSintaks ? sintaksToStage(nextCurrentSintaks) : null;
      if (nextStageFromProgress && nextStageFromProgress === Stage.Finish) {
        setStageIndex(ALL_STAGES.indexOf(Stage.Finish));
      }
      showSnackbar('Progress berhasil disimpan ✓', 'success');
      return true;
    } catch (error) {
      const code = extractFirebaseErrorCode(error);
      showSnackbar(`Gagal menyimpan progress: ${code}`, 'error');
      return false;
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [user, currentStage, showSnackbar]);

  const nextStage = useCallback(async () => {
    console.log('[ArgumentationFlow] STEP 5: nextStage called', {
      canAdvance,
      isSaving: isSavingRef.current,
      stageIndex,
      totalStages,
      currentStage,
    });

    if (!canAdvance) {
      console.log('[ArgumentationFlow] STEP 5a: blocked because canAdvance is false');
      return;
    }

    if (isSavingRef.current) {
      console.log('[ArgumentationFlow] STEP 5a: blocked because save already in progress');
      return;
    }

    if (stageIndex >= totalStages - 1) {
      console.log('[ArgumentationFlow] STEP 5a: blocked because already at last stage');
      return;
    }

    const sintaks = stageToSintaks(currentStage);

    if (!user?.uid) {
      console.log('[ArgumentationFlow] STEP 5a: blocked because user is not authenticated');
      showSnackbar('Gagal menyimpan progress: login diperlukan.', 'error');
      return;
    }

    // To avoid blocking UI navigation on slow networks, persist progress in background.
    // Navigation (stageIndex) is advanced immediately while the save runs async.
    if (sintaks) {
      // mark saving ref and set saving indicator while background save runs
      isSavingRef.current = true;
      setIsSaving(true);

      void (async () => {
        try {
          console.log('[ArgumentationFlow] STEP 6: saving progress to Firestore');
          const next = await persistCompleteStage(user.uid, progressRef.current, sintaks);
          progressRef.current = next;
          setProgress(next);
          showSnackbar('Progress berhasil disimpan ✓', 'success');
          console.log('[ArgumentationFlow] STEP 7: progress saved successfully');
        } catch (error) {
          const code = extractFirebaseErrorCode(error);
          console.log('[ArgumentationFlow] STEP 7a: progress save failed', { code });
          showSnackbar(`Gagal menyimpan progress: ${code}`, 'error');
        } finally {
          isSavingRef.current = false;
          setIsSaving(false);
        }
      })();
    }

    // Advance UI immediately
    console.log('[ArgumentationFlow] STEP 8: setting next stage index immediately');
    setStageIndex((i) => {
      const nextIndex = Math.min(i + 1, totalStages - 1);
      console.log('[ArgumentationFlow] STEP 8a: stage index updated', { from: i, to: nextIndex });
      return nextIndex;
    });
  }, [user, stageIndex, totalStages, currentStage, canAdvance, showSnackbar]);

  const previousStage = useCallback(() => {
    setCanAdvance(true);
    const minIndex = ALL_STAGES.indexOf(Stage.Cover);
    setStageIndex((i) => Math.max(i - 1, minIndex));
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

  const registerSlideNav = useCallback((nav: SlideNavState) => {
    setSlideNav(nav);
  }, []);

  const unregisterSlideNav = useCallback(() => {
    setSlideNav(null);
  }, []);

  const resetProgress = useCallback(async () => {
    logLearningEngine('LearningEngineContext.resetProgress', comicId, 1, 1, false);
    if (!user?.uid) {
      showSnackbar('Gagal mengulang pembelajaran: login diperlukan.', 'error');
      return;
    }

    try {
      const next = await resetLearningProgress(user.uid, comicId);
      progressRef.current = next;
      setProgress(next);
      clearStoredComicReadingProgressEntry(comicId);
      // Reset initialSyncDoneRef so the next Firestore snapshot re-syncs stageIndex
      initialSyncDoneRef.current = false;
      setStageIndex(0);
      setCanAdvance(true);
      showSnackbar('Petualangan berhasil diulang. Selamat belajar kembali!', 'success');
    } catch (error) {
      const code = extractFirebaseErrorCode(error);
      showSnackbar(`Tidak dapat mengatur ulang progres. Silakan coba lagi. (${code})`, 'error');
    }
  }, [user, comicId, showSnackbar]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const debugApi = window.__cinaraiDebug ?? {};
    window.__cinaraiDebug = {
      ...debugApi,
      resetLearningEngineProgress: async () => {
        await resetProgress();
      },
    };
  }, [resetProgress]);

  const value = useMemo<LearningContextValue>(
    () => ({
      comicId,
      comic,
      comicModule,
      progress,
      currentStage,
      completedStages,
      isFinished,
      isLoading,
      stageIndex,
      totalStages,
      nextStage,
      completeAndAdvance,
      completeCurrentStage,
      previousStage,
      goToStage,
      finishLearning,
      resetProgress,
      canAdvance,
      setCanAdvance,
      isSaving,
      slideNav,
      registerSlideNav,
      unregisterSlideNav,
    }),
    [
      comicId,
      comic,
      comicModule,
      progress,
      currentStage,
      completedStages,
      isFinished,
      isLoading,
      stageIndex,
      totalStages,
      nextStage,
      completeAndAdvance,
      completeCurrentStage,
      previousStage,
      goToStage,
      finishLearning,
      resetProgress,
      canAdvance,
      setCanAdvance,
      isSaving,
      slideNav,
      registerSlideNav,
      unregisterSlideNav,
    ]
  );

  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>;
}

export function useLearningEngine(): LearningContextValue {
  const ctx = useContext(LearningContext);
  if (!ctx) throw new Error('useLearningEngine must be used within LearningEngineProvider');
  return ctx;
}
