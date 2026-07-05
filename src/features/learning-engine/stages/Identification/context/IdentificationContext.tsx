'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useIdentification } from '../hooks/useIdentification';
import { useLearningEngine } from '../../../hooks/useLearningEngine';
import { useAuth } from '@/hooks/useAuth';
import {
  saveIdentificationAnswer,
  loadIdentificationAnswers,
} from '../services/identificationAnswerService';
import type { IdentificationItem, IdentificationStep } from '../types';

interface AutoSaveMetadata {
  status: 'idle' | 'saving' | 'saved' | 'error';
  message?: string;
}

interface IdentificationComicMeta {
  comicId: number;
  lokasi: string;
  subtitle: string;
  kelas: string;
  cover: string;
  title: string;
  learningTargets: readonly string[];
}

export interface IdentificationContextValue
  extends ReturnType<typeof useIdentification> {
  // Meta komik
  lokasi: string;
  subtitle: string;
  kelas: string;
  cover: string;
  title: string;
  // Navigasi step
  currentStep: IdentificationStep;
  nextStep: () => void;
  previousStep: () => void;
  reset: () => void;
  // Aksi lanjut ke stage berikutnya (Navigation)
  advance: () => void;
  // Validasi
  validationErrors: string[];
  // Auto-save state per item
  autoSaveState: Record<string, AutoSaveMetadata>;
  // Review pagination (CONFIRM step)
  reviewIndex: number;
  setReviewIndex: (index: number) => void;
}

const IdentificationContext = createContext<IdentificationContextValue | null>(null);

export function useIdentificationContext(): IdentificationContextValue {
  const ctx = useContext(IdentificationContext);
  if (!ctx) throw new Error('useIdentificationContext must be used within IdentificationProvider');
  return ctx;
}

interface IdentificationProviderProps extends IdentificationComicMeta {
  onCompleteChange?: (isComplete: boolean) => void;
  children: React.ReactNode;
}

export function IdentificationProvider({
  comicId,
  lokasi,
  subtitle,
  kelas,
  cover,
  title,
  learningTargets,
  onCompleteChange,
  children,
}: IdentificationProviderProps) {
  const { nextStage } = useLearningEngine();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<IdentificationStep>('OBSERVE');
  const [reviewIndex, setReviewIndex] = useState(0);

  const identification = useIdentification({ comicId, lokasi, cover, title, learningTargets });
  const { state, reset: resetIdentification, applyAnswers } = identification;

  // Stable ref so persistItem always reads the latest state without stale closure
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const [autoSaveState, setAutoSaveState] = useState<Record<string, AutoSaveMetadata>>({});
  const saveTimeout = useRef<number | null>(null);
  const pendingSaveRef = useRef<Set<string>>(new Set());
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const updateAutoSaveState = useCallback((itemId: string, metadata: AutoSaveMetadata) => {
    setAutoSaveState((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], ...metadata },
    }));
  }, []);

  const persistItem = useCallback(async (item: IdentificationItem) => {
    const currentUser = userRef.current;
    if (!currentUser) return;

    updateAutoSaveState(item.id, { status: 'saving', message: 'Menyimpan...' });

    try {
      await saveIdentificationAnswer(currentUser.uid, comicId, item.targetIndex, {
        selectedAnswer: item.selectedOptionId,
        note: item.note,
        reason: item.reason,
      });

      updateAutoSaveState(item.id, { status: 'saved', message: '✓ Tersimpan' });
      window.setTimeout(() => {
        updateAutoSaveState(item.id, { status: 'idle', message: undefined });
      }, 2000);
    } catch (error) {
      console.error(
        `[IdentificationContext] auto-save gagal — userId: ${currentUser.uid}, comicId: ${comicId}, itemId: ${item.id}`,
        error
      );
      updateAutoSaveState(item.id, { status: 'error', message: 'Koneksi terputus, mencoba menyimpan kembali...' });
      pendingSaveRef.current.add(item.id);
      if (saveTimeout.current) window.clearTimeout(saveTimeout.current);
      saveTimeout.current = window.setTimeout(() => {
        const retryIds = Array.from(pendingSaveRef.current);
        pendingSaveRef.current.clear();
        retryIds.forEach((id) => {
          const retryItem = stateRef.current.items.find((i) => i.id === id);
          if (retryItem) void persistItem(retryItem);
        });
      }, 1000);
    }
  }, [comicId, updateAutoSaveState]);

  const scheduleAutoSave = useCallback((itemId: string) => {
    pendingSaveRef.current.add(itemId);
    if (saveTimeout.current) window.clearTimeout(saveTimeout.current);
    saveTimeout.current = window.setTimeout(() => {
      const pendingItems = Array.from(pendingSaveRef.current);
      pendingSaveRef.current.clear();
      pendingItems.forEach((id) => {
        const item = stateRef.current.items.find((i) => i.id === id);
        if (item) void persistItem(item);
      });
    }, 500);
  }, [persistItem]);

  useEffect(() => {
    if (!user) return;
    void loadIdentificationAnswers(user.uid, comicId).then((answers) => {
      if (answers.length > 0) applyAnswers(answers);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, comicId]);

  // Beritahu parent saat isComplete berubah
  useEffect(() => {
    onCompleteChange?.(state.isComplete);
  }, [state.isComplete, onCompleteChange]);

  // Reset reviewIndex when entering CONFIRM step
  useEffect(() => {
    if (currentStep === 'CONFIRM') setReviewIndex(0);
  }, [currentStep]);

  // Otomatis maju ke CONFIRM dihapus — feedback langsung di IDENTIFY
  // (tidak perlu auto-advance ke CONFIRM lagi)
  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev === 'OBSERVE') return 'IDENTIFY';
      if (prev === 'IDENTIFY') return 'CONFIRM';
      return prev;
    });
  }, []);

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev === 'CONFIRM') return 'IDENTIFY';
      if (prev === 'IDENTIFY') return 'OBSERVE';
      return prev;
    });
  }, []);

  const reset = useCallback(() => {
    resetIdentification();
    setCurrentStep('OBSERVE');
  }, [resetIdentification]);

  const advance = useCallback(() => {
    void nextStage();
  }, [nextStage]);

  const saveReasonWithPersist = useCallback(
    (itemId: string) => {
      identification.saveReason(itemId);
      scheduleAutoSave(itemId);
    },
    [identification, scheduleAutoSave]
  );

  useEffect(() => {
    return () => {
      if (saveTimeout.current) window.clearTimeout(saveTimeout.current);
    };
  }, []);

  const validationErrors = useMemo<string[]>(() => {
    const errors: string[] = [];
    if (!state.observe.note.trim()) {
      errors.push('Kamu belum menulis catatan pengamatan.');
    }
    const unanswered = state.items.filter((i) => !i.selectedOptionId);
    if (unanswered.length > 0) {
      errors.push(`${unanswered.length} pertanyaan belum dipilih jawabannya.`);
    }
    return errors;
  }, [state.observe.note, state.items]);

  const value = useMemo<IdentificationContextValue>(
    () => ({
      ...identification,
      saveReason: saveReasonWithPersist,
      lokasi,
      subtitle,
      kelas,
      cover,
      title,
      currentStep,
      nextStep,
      previousStep,
      reset,
      advance,
      validationErrors,
      autoSaveState,
      reviewIndex,
      setReviewIndex,
      selectOption: (itemId: string, optionId: string) => {
        identification.selectOption(itemId, optionId);
        scheduleAutoSave(itemId);
      },
      setNote: (itemId: string, note: string) => {
        identification.setNote(itemId, note);
        scheduleAutoSave(itemId);
      },
      setReason: (itemId: string, reason: string) => {
        identification.setReason(itemId, reason);
        scheduleAutoSave(itemId);
      },
    }),
    [identification, saveReasonWithPersist, lokasi, subtitle, kelas, cover, title, currentStep, nextStep, previousStep, reset, advance, validationErrors, autoSaveState, scheduleAutoSave, reviewIndex, setReviewIndex]
  );

  return (
    <IdentificationContext.Provider value={value}>
      {children}
    </IdentificationContext.Provider>
  );
}
