'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  // Keep a stable ref to the latest state so complete() never closes over stale state
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToComicProgress(user.uid, comicId, setState);
    return () => unsub();
  }, [user, comicId]);

  const complete = useCallback(async (sintaks: Sintaks): Promise<void> => {
    if (!user?.uid) {
      const err = new Error('userId tidak tersedia');
      console.error('[useComicProgress] complete: userId tidak tersedia', err);
      showSnackbar('Gagal menyimpan progress: sesi tidak ditemukan.', 'error');
      throw err;
    }

    // Compute next state from the latest snapshot (not a stale closure)
    const next = completeSintaks(stateRef.current, sintaks);

    // Write to Firestore FIRST — only update local state after confirmed write
    try {
      await saveComicProgress(user.uid, next);
      // Firestore write confirmed: update local state
      // (onSnapshot will also arrive shortly and produce the same result)
      setState(next);
    } catch (error) {
      console.error(
        `[useComicProgress] saveComicProgress gagal — userId: ${user.uid}, comicId: ${comicId}, sintaks: ${sintaks}`,
        error
      );
      const msg = error instanceof Error ? error.message : String(error);
      showSnackbar(`Gagal menyimpan progress: ${msg}`, 'error');
      throw error; // re-throw so handleComplete knows the write failed
    }
  }, [user, comicId, showSnackbar]);

  return { state, complete };
}
