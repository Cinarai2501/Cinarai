'use client';

import { useCallback, useMemo, useState } from 'react';
import { getPdfReaderInitialPage } from '@/components/comic/pdfReaderInitialPage';
import type { IdentificationAnswerDocument } from '@/types/firestore';
import type { IdentificationState } from '../types';
import {
  createIdentificationState,
  resetIdentificationState,
  selectAnswer,
  updateNote,
  saveAnswer,
  setObserveNote,
  completeObserve,
  updateReason,
  saveReason,
} from '../services/identificationService';
import { getComicModule } from '@/features/comics';

export interface UseIdentificationReturn {
  state: IdentificationState;
  setObserveNote: (note: string) => void;
  completeObserve: () => void;
  selectOption: (itemId: string, optionId: string) => void;
  setNote: (itemId: string, note: string) => void;
  save: (itemId: string) => void;
  setReason: (itemId: string, reason: string) => void;
  saveReason: (itemId: string) => void;
  applyAnswers: (answers: IdentificationAnswerDocument[]) => void;
  reset: () => void;
  percentage: number;
}

interface UseIdentificationOptions {
  comicId: number;
  lokasi: string;
  cover: string;
  title: string;
  learningTargets: readonly string[];
  comicSlug?: string;
  sourcePage?: number;
  pdfPath?: string | null;
}

export function useIdentification({
  comicId,
  lokasi,
  cover,
  title,
  learningTargets: _learningTargets,
  comicSlug,
  sourcePage,
  pdfPath,
}: UseIdentificationOptions): UseIdentificationReturn {
  const resolvedSourcePage = useMemo(() => {
    if (typeof sourcePage === 'number' && sourcePage > 0) return sourcePage;
    return getPdfReaderInitialPage(comicId);
  }, [comicId, sourcePage]);

  const [state, setState] = useState<IdentificationState>(() => {
    // eslint-disable-next-line no-console
    console.log('[identification-hook]', {
      comicId,
      currentPage: resolvedSourcePage,
      totalPages: 37,
      completed: false,
      timestamp: new Date().toISOString(),
      functionName: 'useIdentification',
    });
    const comicModule = getComicModule(comicId);
    return createIdentificationState(comicModule.identification, {
      comicId,
      lokasi,
      cover,
      title,
      comicSlug,
      sourcePage: resolvedSourcePage,
      pdfPath,
    });
  });

  const handleSetObserveNote = useCallback((note: string) => {
    setState((prev) => setObserveNote(prev, note));
  }, []);

  const handleCompleteObserve = useCallback(() => {
    setState((prev) => completeObserve(prev));
  }, []);

  const selectOption = useCallback((itemId: string, optionId: string) => {
    setState((prev) => selectAnswer(prev, itemId, optionId));
  }, []);

  const setNote = useCallback((itemId: string, note: string) => {
    setState((prev) => updateNote(prev, itemId, note));
  }, []);

  const save = useCallback((itemId: string) => {
    setState((prev) => saveAnswer(prev, itemId));
  }, []);

  const handleSetReason = useCallback((itemId: string, reason: string) => {
    setState((prev) => updateReason(prev, itemId, reason));
  }, []);

  const handleSaveReason = useCallback((itemId: string) => {
    setState((prev) => saveReason(prev, itemId));
  }, []);

  const applyAnswers = useCallback((answers: IdentificationAnswerDocument[]) => {
    setState((prev) => {
      let next = prev;
      for (const answer of answers) {
        const item = next.items.find((i) => i.targetIndex === answer.step);
        if (!item) continue;

        const selectedIds = Array.from(new Set(
          (answer.selectedAnswerIds && answer.selectedAnswerIds.length > 0
            ? answer.selectedAnswerIds
            : item.options
                .filter((option) => option.text === answer.selectedAnswer)
                .map((option) => option.id))
        ));

        next = {
          ...next,
          items: next.items.map((i) =>
            i.targetIndex === answer.step
              ? {
                  ...i,
                  selectedOptionIds: selectedIds,
                  note: answer.note,
                  reason: answer.reason,
                  answerStatus: selectedIds.length > 0 ? 'SAVED' : 'UNANSWERED',
                  reasonStatus: answer.reason?.trim() ? 'SAVED' : 'EMPTY',
                  status: answer.reason?.trim() ? 'OBSERVED' : i.status,
                }
              : i
          ),
        };
      }
      const observedCount = next.items.filter((i) => i.status === 'OBSERVED').length;
      return { ...next, observedCount, isComplete: next.items.every((i) => i.reasonStatus === 'SAVED') };
    });
  }, []);

  const reset = useCallback(() => {
    setState((prev) => resetIdentificationState(prev));
  }, []);

  const percentage = useMemo(() => {
    if (state.items.length === 0) return 0;
    return Math.round((state.observedCount / state.items.length) * 100);
  }, [state.observedCount, state.items.length]);

  return { state, setObserveNote: handleSetObserveNote, completeObserve: handleCompleteObserve, selectOption, setNote, save, setReason: handleSetReason, saveReason: handleSaveReason, applyAnswers, reset, percentage };
}
