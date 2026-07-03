'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSnackbar } from '@/context/SnackbarContext';
import { subscribeToComicProgress, saveComicProgress } from '@/services/comicProgress';
import { completeSintaks, createInitialProgressState } from '@/lib/progressEngine';
import type { ComicProgressState, Sintaks } from '@/types/progress';

export function useComicProgress(comicId: number) {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [state, setState] = useState<ComicProgressState>(
    createInitialProgressState(comicId)
  );

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToComicProgress(user.uid, comicId, setState);
    return () => unsub();
  }, [user, comicId]);

  const complete = async (sintaks: Sintaks) => {
    if (!user?.uid) {
      console.error('Save Progress Error: userId tidak tersedia.');
      showSnackbar('Gagal menyimpan progress: sesi tidak ditemukan.', 'error');
      return;
    }

    const next = completeSintaks(state, sintaks);
    setState(next);

    try {
      await saveComicProgress(user.uid, next);
    } catch (error) {
      console.error('Save Progress Error', error);
      const msg = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui.';
      showSnackbar(`Gagal menyimpan progress: ${msg}`, 'error');
      // Rollback optimistic update
      setState(state);
    }
  };

  return { state, complete };
}
