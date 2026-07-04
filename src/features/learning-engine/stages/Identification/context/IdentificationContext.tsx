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

  const identification = useIdentification({ comicId, lokasi, cover, title, learningTargets });
  const { state, reset: resetIdentification, applyAnswers } = identification;

  const [autoSaveState, setAutoSaveState] = useState<Record<string, AutoSaveMetadata>>({});
  const saveTimeout = useRef<number | null>(null);
  const pendingSaveRef = useRef<Set<string>>(new Set());

  const updateAutoSaveState = useCallback((itemId: string, metadata: AutoSaveMetadata) => {
    setAutoSaveState((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], ...metadata },
    }));
  }, []);

  const persistItem = useCallback(async (item: IdentificationItem) => {
    if (!user) return;

    updateAutoSaveState(item.id, { status: 'saving', message: 'Menyimpan...' });

    try {
      await saveIdentificationAnswer(user.uid, comicId, item.targetIndex, {
        selectedAnswer: item.selectedOptionId,
        note: item.note,
        reason: item.reason,
      });

      if (item.reason.trim().length > 0) {
        identification.saveReason(item.id);
      } else if (item.selectedOptionId) {
        identification.save(item.id);
      }

      updateAutoSaveState(item.id, { status: 'saved', message: '✓ Tersimpan' });
      window.setTimeout(() => {
        updateAutoSaveState(item.id, { status: 'idle', message: undefined });
      }, 2000);
    } catch (error) {
      console.error(
        `[IdentificationContext] auto-save gagal — userId: ${user?.uid}, comicId: ${comicId}, itemId: ${item.id}`,
        error
      );
      updateAutoSaveState(item.id, { status: 'error', message: 'Koneksi terputus, mencoba menyimpan kembali...' });
      pendingSaveRef.current.add(item.id);
      if (saveTimeout.current) window.clearTimeout(saveTimeout.current);
      saveTimeout.current = window.setTimeout(() => {
        pendingSaveRef.current.forEach((id) => {
          const retryItem = identification.state.items.find((i) => i.id === id);
          if (retryItem) void persistItem(retryItem);
        });
      }, 1000);
    }
  }, [comicId, identification, updateAutoSaveState, user]);

  const scheduleAutoSave = useCallback((itemId: string) => {
    pendingSaveRef.current.add(itemId);
    if (saveTimeout.current) window.clearTimeout(saveTimeout.current);
    saveTimeout.current = window.setTimeout(() => {
      const pendingItems = Array.from(pendingSaveRef.current);
      pendingSaveRef.current.clear();
      pendingItems.forEach((id) => {
        const item = identification.state.items.find((i) => i.id === id);
        if (item) void persistItem(item);
      });
    }, 500);
  }, [identification.state.items, persistItem]);

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

  // Otomatis maju ke CONFIRM saat semua item selesai
  useEffect(() => {
    if (state.isComplete && currentStep === 'IDENTIFY') {
      setCurrentStep('CONFIRM');
    }
  }, [state.isComplete, currentStep]);

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
    const noReason = state.items.filter((i) => !i.reason.trim());
    if (noReason.length > 0) {
      errors.push(`${noReason.length} pertanyaan belum ditulis alasannya.`);
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
    [identification, saveReasonWithPersist, lokasi, subtitle, kelas, cover, title, currentStep, nextStep, previousStep, reset, advance, validationErrors, autoSaveState, scheduleAutoSave]
  );

  return (
    <IdentificationContext.Provider value={value}>
      {children}
    </IdentificationContext.Provider>
  );
}
