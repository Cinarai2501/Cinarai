'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSnackbar } from '@/context/SnackbarContext';
import { resetComicProgress, subscribeToAllComicProgress } from '@/services/comicProgress';
import { clearStoredComicReadingProgressEntry } from '@/lib/comicReadingProgressStorage';
import type { ComicProgressState } from '@/types/progress';

export function useAllComicProgress() {
  const { user, loading: authLoading } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [states, setStates] = useState<ComicProgressState[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to resolve before subscribing
    if (authLoading) return;

    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsub = subscribeToAllComicProgress(
      user.uid,
      (s) => {
        setStates(s);
        setIsLoading(false);
      },
      (error) => {
        console.error('Save Progress Error', error);
        const msg = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui.';
        showSnackbar(`Gagal memuat progress: ${msg}`, 'error');
        setIsLoading(false);
      },
    );
    return () => unsub();
  }, [authLoading, user, showSnackbar]);

  const getProgress = (comicId: number): ComicProgressState | undefined =>
    states.find((s) => s.comicId === comicId);

  const resetProgressForComic = useCallback(async (comicId: number) => {
    if (!user?.uid) throw new Error('unauthenticated');
    const result = await resetComicProgress(user.uid, comicId);
    clearStoredComicReadingProgressEntry(comicId);
    setStates((prev) => prev.filter((state) => state.comicId !== comicId));
    return result;
  }, [user?.uid]);

  return { states, getProgress, resetProgressForComic, isLoading };
}
