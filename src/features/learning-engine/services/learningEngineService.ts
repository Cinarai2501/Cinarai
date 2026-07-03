import {
  subscribeToComicProgress,
  saveComicProgress,
} from '@/services/comicProgress';
import { completeSintaks } from '@/lib/progressEngine';
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
  stage: Sintaks
): Promise<ComicProgressState> {
  if (!userId) {
    const err = new Error('userId tidak tersedia');
    console.error('Save Progress Error', err);
    throw err;
  }
  const next = completeSintaks(current, stage);
  await saveComicProgress(userId, next);
  return next;
}
