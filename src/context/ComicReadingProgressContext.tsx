'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  COMIC_READING_PROGRESS_RESET_EVENT,
  clearAllStoredComicReadingProgress,
  clearStoredComicReadingProgressEntry,
} from '@/lib/comicReadingProgressStorage';

/** Progress membaca satu komik */
export interface ComicReadingProgress {
  comicId: number;
  currentPage: number;
  totalPages: number;
  completed: boolean;
  lastPage: number; // Halaman terakhir yang dibaca sebelum completed=true
}

interface ComicReadingProgressContextValue {
  progress: ComicReadingProgress | null;
  updateProgress: (comicId: number, page: number, totalPages: number) => void;
  markCompleted: (comicId: number, totalPages: number) => void;
  getLastPage: (comicId: number) => number;
  isComicCompleted: (comicId: number) => boolean;
  clearProgress: (comicId: number) => void;
}

const ComicReadingProgressContext = createContext<ComicReadingProgressContextValue | null>(null);

export function useComicReadingProgress(): ComicReadingProgressContextValue {
  const ctx = useContext(ComicReadingProgressContext);
  if (!ctx) {
    throw new Error('useComicReadingProgress must be used within ComicReadingProgressProvider');
  }
  return ctx;
}

function logReadingProgress(functionName: string, comicId: number, page: number, totalPages: number, completed: boolean) {
  // eslint-disable-next-line no-console
  console.log('[reading-progress]', {
    comicId,
    currentPage: page,
    totalPages,
    completed,
    timestamp: new Date().toISOString(),
    functionName,
  });
  // eslint-disable-next-line no-console
  console.log('[reading-progress-stack]', new Error().stack?.split('\n').slice(1, 4).join(' | '));
}

// Global `__cinaraiDebug` declared in src/types/cinarai-debug.d.ts

interface ComicReadingProgressProviderProps {
  children: React.ReactNode;
}

export function ComicReadingProgressProvider({ children }: ComicReadingProgressProviderProps) {
  const [allProgress, setAllProgress] = useState<Record<number, ComicReadingProgress>>({});
  const [currentComicId, setCurrentComicId] = useState<number | null>(null);
  // Suppress resuming for comics that were just reset. When a comic is reset,
  // we want to ignore any stored `lastPage` until the user explicitly
  // navigates (updateProgress) for that comic. Use a ref to avoid
  // re-renders when the set changes.
  const suppressedResumesRef = React.useRef<Set<number>>(new Set());

  useEffect(() => {
    const handleReset = (event: Event) => {
      logReadingProgress('ComicReadingProgressContext:handleReset', (event as CustomEvent<{ comicId?: number }>).detail?.comicId ?? 0, 1, 1, false);
      const detail = (event as CustomEvent<{ comicId?: number }>).detail;
      if (detail?.comicId !== undefined) {
        const comicId = detail.comicId;
        clearStoredComicReadingProgressEntry(comicId);
        setAllProgress((prev) => {
          const next = { ...prev };
          delete next[comicId];
          return next;
        });
        setCurrentComicId((current) => (current === comicId ? null : current));
        // Mark this comic to ignore resume until the user interacts.
        suppressedResumesRef.current.add(comicId);
        return;
      }

      clearAllStoredComicReadingProgress();
      setAllProgress({});
      setCurrentComicId(null);
    };

    window.addEventListener(COMIC_READING_PROGRESS_RESET_EVENT, handleReset as EventListener);
    return () => window.removeEventListener(COMIC_READING_PROGRESS_RESET_EVENT, handleReset as EventListener);
  }, []);

  const updateProgress = useCallback((comicId: number, page: number, totalPages: number) => {
    logReadingProgress('updateProgress', comicId, page, totalPages, false);
    // User-initiated progress update — clear any suppression so resume is
    // allowed on subsequent opens.
    suppressedResumesRef.current.delete(comicId);
    setCurrentComicId(comicId);
    setAllProgress((prev) => {
      const nextPage = Math.max(1, Math.min(page, totalPages));
      const current = prev[comicId] || {
        comicId,
        currentPage: 1,
        totalPages,
        completed: false,
        lastPage: 1,
      };

      const nextState = {
        ...current,
        currentPage: nextPage,
        totalPages,
        lastPage: current.completed ? current.lastPage : nextPage,
      };

      if (
        current.currentPage === nextState.currentPage &&
        current.totalPages === nextState.totalPages &&
        current.completed === nextState.completed &&
        current.lastPage === nextState.lastPage
      ) {
        return prev;
      }

      return {
        ...prev,
        [comicId]: nextState,
      };
    });
  }, []);

  const markCompleted = useCallback((comicId: number, totalPages: number) => {
    logReadingProgress('markCompleted', comicId, totalPages, totalPages, true);
    setCurrentComicId(comicId);
    setAllProgress((prev) => {
      const current = prev[comicId] || {
        comicId,
        currentPage: totalPages,
        totalPages,
        completed: false,
        lastPage: totalPages,
      };
      const nextState = {
        ...current,
        completed: true,
        currentPage: totalPages,
        totalPages,
        lastPage: totalPages,
      };

      if (
        current.completed === nextState.completed &&
        current.currentPage === nextState.currentPage &&
        current.totalPages === nextState.totalPages &&
        current.lastPage === nextState.lastPage
      ) {
        return prev;
      }

      return {
        ...prev,
        [comicId]: nextState,
      };
    });
  }, []);

  const clearProgress = useCallback((comicId: number) => {
    logReadingProgress('clearProgress', comicId, 1, 1, false);
    setCurrentComicId((current) => (current === comicId ? null : current));
    setAllProgress((prev) => {
      if (!(comicId in prev)) return prev;
      const next = { ...prev };
      delete next[comicId];
      return next;
    });
    clearStoredComicReadingProgressEntry(comicId);
    // Also suppress resume after an explicit clear so the reader opens at
    // page 1 until the user navigates.
    suppressedResumesRef.current.add(comicId);
  }, []);

  const getLastPage = useCallback((comicId: number): number => {
    if (suppressedResumesRef.current.has(comicId)) return 1;
    return 1;
  }, []);

  const isComicCompleted = useCallback((comicId: number): boolean => {
    return allProgress[comicId]?.completed ?? false;
  }, [allProgress]);

  const progress = currentComicId ? allProgress[currentComicId] ?? null : null;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const debugApi = window.__cinaraiDebug ?? {};
    window.__cinaraiDebug = {
      ...debugApi,
      triggerReadingProgressUpdate: (comicId: number, page: number, totalPages: number) => {
        updateProgress(comicId, page, totalPages);
      },
      triggerReadingProgressComplete: (comicId: number, totalPages: number) => {
        markCompleted(comicId, totalPages);
      },
    };
  }, [updateProgress, markCompleted]);

  const value: ComicReadingProgressContextValue = {
    progress,
    updateProgress,
    markCompleted,
    getLastPage,
    isComicCompleted,
    clearProgress,
  };

  return (
    <ComicReadingProgressContext.Provider value={value}>
      {children}
    </ComicReadingProgressContext.Provider>
  );
}
