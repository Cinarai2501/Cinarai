'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToAllComicProgress } from '@/services/comicProgress';
import type { ComicProgressState } from '@/types/progress';

export function useAllComicProgress() {
  const { user } = useAuth();
  const [states, setStates] = useState<ComicProgressState[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    console.log('[Dashboard] Auth User Loaded', { uid: user.uid, email: user.email });
    console.log('[Dashboard] Dashboard Start Loading');
    const unsub = subscribeToAllComicProgress(
      user.uid,
      (s) => {
        console.log('[Dashboard] Firestore Progress Loaded', { count: s.length, states: s });
        setStates(s);
        setIsLoading(false);
        console.log('[Dashboard] Dashboard Finished Loading');
      },
      (error) => {
        console.error('[Dashboard] Dashboard Error', error);
        setIsLoading(false);
      },
    );
    return () => unsub();
  }, [user]);

  const getProgress = (comicId: number): ComicProgressState | undefined =>
    states.find((s) => s.comicId === comicId);

  return { states, getProgress, isLoading };
}
