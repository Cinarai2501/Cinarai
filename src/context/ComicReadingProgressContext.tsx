'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  COMIC_READING_PROGRESS_RESET_EVENT,
  clearAllStoredComicReadingProgress,
  clearStoredComicReadingProgressEntry,
  getStoredComicReadingProgress,
  saveStoredComicReadingProgress,
  type StoredComicReadingProgress,
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

function mapStoredProgress(data: Record<number, StoredComicReadingProgress>): Record<number, ComicReadingProgress> {
  return Object.entries(data).reduce<Record<number, ComicReadingProgress>>((acc, [key, value]) => {
    const comicId = Number(key);
    if (!Number.isNaN(comicId)) {
      acc[comicId] = {
        comicId,
        currentPage: value.currentPage ?? 1,
        totalPages: value.totalPages ?? 1,
        completed: Boolean(value.completed),
        lastPage: value.lastPage ?? value.currentPage ?? 1,
      };
    }
    return acc;
  }, {});
}

interface ComicReadingProgressProviderProps {
  children: React.ReactNode;
}

export function ComicReadingProgressProvider({ children }: ComicReadingProgressProviderProps) {
  const [allProgress, setAllProgress] = useState<Record<number, ComicReadingProgress>>(() =>
    mapStoredProgress(getStoredComicReadingProgress())
  );
  const [currentComicId, setCurrentComicId] = useState<number | null>(null);

  useEffect(() => {
    const handleReset = (event: Event) => {
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
        return;
      }

      clearAllStoredComicReadingProgress();
      setAllProgress({});
      setCurrentComicId(null);
    };

    window.addEventListener(COMIC_READING_PROGRESS_RESET_EVENT, handleReset as EventListener);
    return () => window.removeEventListener(COMIC_READING_PROGRESS_RESET_EVENT, handleReset as EventListener);
  }, []);

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    saveStoredComicReadingProgress(
      Object.entries(allProgress).reduce<Record<number, StoredComicReadingProgress>>((acc, [key, value]) => {
        acc[Number(key)] = {
          comicId: value.comicId,
          currentPage: value.currentPage,
          totalPages: value.totalPages,
          completed: value.completed,
          lastPage: value.lastPage,
        };
        return acc;
      }, {})
    );
  }, [allProgress]);

  const updateProgress = useCallback((comicId: number, page: number, totalPages: number) => {
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
    setCurrentComicId((current) => (current === comicId ? null : current));
    setAllProgress((prev) => {
      if (!(comicId in prev)) return prev;
      const next = { ...prev };
      delete next[comicId];
      return next;
    });
    clearStoredComicReadingProgressEntry(comicId);
  }, []);

  const getLastPage = useCallback((comicId: number): number => {
    return allProgress[comicId]?.lastPage ?? 1;
  }, [allProgress]);

  const isComicCompleted = useCallback((comicId: number): boolean => {
    return allProgress[comicId]?.completed ?? false;
  }, [allProgress]);

  const progress = currentComicId ? allProgress[currentComicId] ?? null : null;

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
