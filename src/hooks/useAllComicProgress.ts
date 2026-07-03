'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSnackbar } from '@/context/SnackbarContext';
import { subscribeToAllComicProgress } from '@/services/comicProgress';
import type { ComicProgressState } from '@/types/progress';

export function useAllComicProgress() {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [states, setStates] = useState<ComicProgressState[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
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
  }, [user, showSnackbar]);

  const getProgress = (comicId: number): ComicProgressState | undefined =>
    states.find((s) => s.comicId === comicId);

  return { states, getProgress, isLoading };
}
