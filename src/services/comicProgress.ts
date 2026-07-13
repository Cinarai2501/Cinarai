'use client';

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  query,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import { getAllComics } from '@/lib/comicRepository';
import { createInitialProgressState, restoreProgressState } from '@/lib/progressEngine';
import { deleteFirestoreDocument, queryFirestoreCollection } from '@/services/firestore';
import {
  clearStoredComicReadingProgressEntry,
  dispatchComicReadingProgressReset,
} from '@/lib/comicReadingProgressStorage';
import type { ComicProgressDocument } from '@/types/firestore';
import type { ComicProgressState } from '@/types/progress';

// ─── Error helper ─────────────────────────────────────────────────────────────

/**
 * Extract the Firebase error code (e.g. 'permission-denied', 'unauthenticated',
 * 'network-request-failed') so callers can display the real cause instead of a
 * generic message.
 */
export function extractFirebaseErrorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as { code: string }).code);
  }
  return error instanceof Error ? error.message : String(error);
}

// ─── Path helpers ─────────────────────────────────────────────────────────────

/** Doc ID for a comic progress: comic-{comicId} */
function comicDocId(comicId: number): string {
  return `comic-${comicId}`;
}

/** Firestore ref: users/{uid}/progress/comic-{comicId} */
function progressDocRef(userId: string, comicId: number) {
  return doc(firestore, 'users', userId, 'progress', comicDocId(comicId));
}

/** Firestore ref: users/{uid}/progress (collection) */
function progressColRef(userId: string) {
  return collection(firestore, 'users', userId, 'progress');
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

function currentStage(state: ComicProgressState): string {
  return state.sintaksList.find((s) => s.status === 'CURRENT')?.sintaks ?? 'Cover';
}

function deriveStatus(state: ComicProgressState): ComicProgressDocument['status'] {
  if (state.isCompleted) return 'completed';
  if (state.completedCount > 0) return 'in_progress';
  return 'not_started';
}

function toDocument(state: ComicProgressState): Omit<ComicProgressDocument, 'id'> {
  return {
    comicId: state.comicId,
    completedStage: currentStage(state),
    completedPages: state.completedCount,
    percentage: state.percentage,
    status: deriveStatus(state),
    sintaksList: state.sintaksList,
    updatedAt: serverTimestamp(),
  };
}

function fromDocument(comicId: number, data: ComicProgressDocument): ComicProgressState {
  if (data.sintaksList?.length) {
    return restoreProgressState(comicId, data.sintaksList);
  }
  return createInitialProgressState(comicId);
}

async function clearIdentificationAnswers(userId: string, comicId: number): Promise<void> {
  const answers = await queryFirestoreCollection('identification_answers', {
    filters: [
      { field: 'userId', operator: '==', value: userId },
      { field: 'comicId', operator: '==', value: comicId },
    ],
  });

  await Promise.all(
    answers.map((answer) => deleteFirestoreDocument('identification_answers', answer.id ?? `${userId}_${comicId}_${answer.step}`))
  );
}

async function clearApplicationActivities(userId: string, comicId: number): Promise<void> {
  const activities = await queryFirestoreCollection('application_activity', {
    filters: [
      { field: 'userId', operator: '==', value: userId },
      { field: 'comicId', operator: '==', value: comicId },
    ],
  });

  await Promise.all(
    activities.map((activity) => deleteFirestoreDocument('application_activity', activity.id ?? `${userId}_${comicId}_${activity.attempt}`))
  );
}

async function clearReflectionDocuments(userId: string, comicId: number): Promise<void> {
  const reflections = await queryFirestoreCollection('reflection', {
    filters: [{ field: 'userId', operator: '==', value: userId }],
  });

  const matchingReflections = reflections.filter((reflection) => {
    const reflectionComicId = reflection.comicId;
    const reflectionId = reflection.id;
    return reflectionId?.startsWith(`${userId}_${comicId}_`) || String(reflectionComicId) === String(comicId);
  });

  await Promise.all(
    matchingReflections.map((reflection) => deleteFirestoreDocument('reflection', reflection.id ?? `${userId}_${comicId}_reflection`))
  );
}

// ─── Create ───────────────────────────────────────────────────────────────────

/** Create initial progress documents for all comics when user first logs in. */
export async function initializeUserProgress(userId: string): Promise<void> {
  const comics = getAllComics();
  await Promise.all(
    comics.map(async (comic) => {
      const ref = progressDocRef(userId, comic.id);
      try {
        const snap = await getDoc(ref);
        if (snap.exists()) return;
        const state = createInitialProgressState(comic.id);
        await setDoc(ref, toDocument(state));
      } catch {
      }
    })
  );
}

// ─── Update ───────────────────────────────────────────────────────────────────

/** Persist updated progress state to Firestore. Creates the document if it does not exist (merge: true). */
export async function saveComicProgress(
  userId: string,
  state: ComicProgressState,
  extraData?: Record<string, unknown>
): Promise<void> {
  // ── Auth guard ────────────────────────────────────────────────────────────
  if (!userId) {
    throw new Error('unauthenticated');
  }

  const ref = progressDocRef(userId, state.comicId);
  const payload = {
    ...toDocument(state),
    ...(state.isCompleted ? { completedAt: serverTimestamp() } : {}),
    ...(extraData ?? {}),
  };

  try {
    // merge: true → creates document automatically if it does not exist
    await setDoc(ref, payload, { merge: true });
  } catch (error) {
    const code = extractFirebaseErrorCode(error);
    // Re-throw with the Firebase error code as the message so callers can surface it
    throw new Error(code);
  }
}

/** Reset a comic's learning progress back to the initial state and clear saved answers. */
export async function resetComicProgress(userId: string, comicId: number): Promise<ComicProgressState> {
  if (!userId) {
    throw new Error('unauthenticated');
  }

  const initialState = createInitialProgressState(comicId);
  const ref = progressDocRef(userId, comicId);

  // Full overwrite (no merge) so stale fields like completedAt/introspection are removed
  const resetDoc = {
    ...toDocument(initialState),
    completedAt: null,
    introspection: null,
  };

  try {
    await Promise.all([
      setDoc(ref, resetDoc),
      clearIdentificationAnswers(userId, comicId),
      clearApplicationActivities(userId, comicId),
      clearReflectionDocuments(userId, comicId),
    ]);

    clearStoredComicReadingProgressEntry(comicId);
    dispatchComicReadingProgressReset(comicId);
    return initialState;
  } catch (error) {
    const code = extractFirebaseErrorCode(error);
    throw new Error(code);
  }
}

// ─── Subscribe ────────────────────────────────────────────────────────────────

/** Subscribe to a single comic's progress in realtime. */
export function subscribeToComicProgress(
  userId: string,
  comicId: number,
  callback: (state: ComicProgressState) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    progressDocRef(userId, comicId),
    (snap) => {
      callback(
        snap.exists()
          ? fromDocument(comicId, { id: snap.id, ...snap.data() } as ComicProgressDocument)
          : createInitialProgressState(comicId)
      );
    },
    (error) => {
      onError?.(error);
    }
  );
}

/** Subscribe to all comics' progress for a user in realtime. */
export function subscribeToAllComicProgress(
  userId: string,
  callback: (states: ComicProgressState[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    query(progressColRef(userId)),
    (snap) => {
      callback(
        snap.docs.map((d) => {
          const data = { id: d.id, ...d.data() } as ComicProgressDocument;
          // Fallback: parse comicId from doc ID ("comic-{n}") if field is missing
          const comicId = data.comicId ?? parseInt(d.id.replace('comic-', ''), 10);
          if (!comicId || isNaN(comicId)) return null;
          return fromDocument(comicId, { ...data, comicId });
        }).filter((s): s is ComicProgressState => s !== null)
      );
    },
    onError
  );
}
