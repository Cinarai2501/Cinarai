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
import type { ComicProgressDocument } from '@/types/firestore';
import type { ComicProgressState } from '@/types/progress';

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
      } catch (error) {
        console.error('Save Progress Error', error);
      }
    })
  );
}

// ─── Update ───────────────────────────────────────────────────────────────────

/** Persist updated progress state to Firestore, then verify the write succeeded. */
export async function saveComicProgress(
  userId: string,
  state: ComicProgressState
): Promise<void> {
  if (!userId) {
    throw new Error('userId tidak tersedia');
  }
  const ref = progressDocRef(userId, state.comicId);
  const payload = {
    ...toDocument(state),
    ...(state.isCompleted ? { completedAt: serverTimestamp() } : {}),
  };
  try {
    await setDoc(ref, payload, { merge: true });
  } catch (error) {
    console.error(
      `[saveComicProgress] setDoc gagal — userId: ${userId}, comicId: ${state.comicId}`,
      error
    );
    throw error;
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
      console.error(`[Firestore] subscribeToComicProgress error — userId: ${userId}, comicId: ${comicId}`, error);
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
