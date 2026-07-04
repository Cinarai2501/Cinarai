'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useIdentification } from '../hooks/useIdentification';
import { useLearningEngine } from '../../../hooks/useLearningEngine';
import { useAuth } from '@/hooks/useAuth';
import {
  saveIdentificationAnswer,
  loadIdentificationAnswers,
} from '../services/identificationAnswerService';
import type { IdentificationStep } from '../types';

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

  // Load jawaban dari Firestore saat mount
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

  // Wrap saveReason agar otomatis persist ke Firestore
  const saveReasonWithPersist = useCallback(
    (itemId: string) => {
      identification.saveReason(itemId);

      if (!user) return;
      const item = state.items.find((i) => i.id === itemId);
      if (!item) return;

      saveIdentificationAnswer(user.uid, comicId, item.targetIndex, {
        selectedAnswer: item.selectedOptionId,
        note: item.note,
        reason: item.reason,
      }).catch((error) => {
        console.error(
          `[IdentificationContext] saveIdentificationAnswer gagal — userId: ${user.uid}, comicId: ${comicId}, itemId: ${itemId}`,
          error
        );
      });
    },
    [user, comicId, state.items, identification]
  );

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
    }),
    [identification, saveReasonWithPersist, lokasi, subtitle, kelas, cover, title, currentStep, nextStep, previousStep, reset, advance, validationErrors]
  );

  return (
    <IdentificationContext.Provider value={value}>
      {children}
    </IdentificationContext.Provider>
  );
}
