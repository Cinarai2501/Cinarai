import {
  subscribeToComicProgress,
  saveComicProgress,
  resetComicProgress,
} from '@/services/comicProgress';
import { completeSintaks, createInitialProgressState } from '@/lib/progressEngine';
import type { ComicProgressState, Sintaks } from '@/types/progress';
import type { Unsubscribe } from 'firebase/firestore';

/** Subscribe to live progress for a single comic. */
export function subscribeToLearningProgress(
  userId: string,
  comicId: number,
  callback: (state: ComicProgressState) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeToComicProgress(userId, comicId, callback, onError);
}

/** Mark a stage as complete and persist to Firestore. */
export async function completeStage(
  userId: string,
  current: ComicProgressState,
  stage: Sintaks,
  extraData?: Record<string, unknown>
): Promise<ComicProgressState> {
  if (!userId) {
    const err = new Error('userId tidak tersedia');
    throw err;
  }
  const next = completeSintaks(current, stage);
  await saveComicProgress(userId, current.comicId, next, extraData);
  return next;
}

/** Reset the comic's learning progress back to the first stage and clear saved answers. */
export async function resetLearningProgress(
  userId: string,
  comicId: number
): Promise<ComicProgressState> {
  if (!userId) {
    const err = new Error('userId tidak tersedia');
    throw err;
  }

  await resetComicProgress(userId, comicId);
  return createInitialProgressState(comicId);
}
