'use client';

import { serverTimestamp } from 'firebase/firestore';
import { getAllComics } from '@/lib/comicRepository';
import { createInitialProgressState, restoreProgressState } from '@/lib/progressEngine';
import {
  mergeFirestoreDocument,
  subscribeToFirestoreDocument,
  subscribeToFirestoreCollection,
  getFirestoreDocument,
} from '@/services/firestore';
import type { ComicProgressDocument } from '@/types/firestore';
import type { ComicProgressState } from '@/types/progress';
import type { Unsubscribe } from 'firebase/firestore';

/** Deterministic doc ID: {userId}_{comicId} */
function docId(userId: string, comicId: number): string {
  return `${userId}_${comicId}`;
}

function currentStage(state: ComicProgressState): string {
  return state.sintaksList.find((s) => s.status === 'CURRENT')?.sintaks ?? 'Cover';
}

function deriveStatus(state: ComicProgressState): ComicProgressDocument['status'] {
  if (state.isCompleted) return 'completed';
  if (state.completedCount > 0) return 'in_progress';
  return 'not_started';
}

function toDocument(
  userId: string,
  state: ComicProgressState
): Omit<ComicProgressDocument, 'id'> {
  return {
    userId,
    comicId: state.comicId,
    stage: currentStage(state),
    percentage: state.percentage,
    status: deriveStatus(state),
    sintaksList: state.sintaksList,
    updatedAt: serverTimestamp() as ComicProgressDocument['updatedAt'],
  };
}

function fromDocument(comicId: number, data: ComicProgressDocument): ComicProgressState {
  if (data.sintaksList?.length) {
    return restoreProgressState(comicId, data.sintaksList);
  }
  return createInitialProgressState(comicId);
}

// ─── Create ──────────────────────────────────────────────────────────────────

/** Create initial progress documents for all comics when user first logs in. */
export async function initializeUserProgress(userId: string): Promise<void> {
  const comics = getAllComics();

  await Promise.all(
    comics.map(async (comic) => {
      const id = docId(userId, comic.id);
      try {
        const existing = await getFirestoreDocument('comic_progress', id);
        if (existing) return;

        const state = createInitialProgressState(comic.id);
        await mergeFirestoreDocument('comic_progress', id, toDocument(userId, state));
      } catch (error) {
        console.error('Save Progress Error', error);
      }
    })
  );
}

// ─── Update ──────────────────────────────────────────────────────────────────

/** Persist updated progress state to Firestore.
 *  Pakai setDoc + merge:true agar aman untuk dokumen baru maupun yang sudah ada.
 *  Setelah save, baca kembali dokumen untuk memverifikasi data tersimpan.
 */
export async function saveComicProgress(
  userId: string,
  state: ComicProgressState
): Promise<void> {
  if (!userId) {
    console.error('Save Progress Error: userId tidak tersedia, progress tidak disimpan.');
    throw new Error('userId tidak tersedia');
  }

  const id = docId(userId, state.comicId);
  try {
    await mergeFirestoreDocument('comic_progress', id, {
      ...toDocument(userId, state),
      ...(state.isCompleted ? { completedAt: serverTimestamp() as ComicProgressDocument['updatedAt'] } : {}),
    });

    // Read-back: verifikasi data benar-benar tersimpan
    const saved = await getFirestoreDocument('comic_progress', id);
    if (!saved) {
      throw new Error(`Dokumen ${id} tidak ditemukan setelah disimpan.`);
    }
  } catch (error) {
    console.error('Save Progress Error', error);
    throw error;
  }
}

// ─── Subscribe ───────────────────────────────────────────────────────────────

/** Subscribe to a single comic's progress in realtime. */
export function subscribeToComicProgress(
  userId: string,
  comicId: number,
  callback: (state: ComicProgressState) => void
): Unsubscribe {
  return subscribeToFirestoreDocument(
    'comic_progress',
    docId(userId, comicId),
    (data) => {
      callback(data ? fromDocument(comicId, data) : createInitialProgressState(comicId));
    },
    (error) => {
      console.error(`[Firestore] subscribeToComicProgress error — userId: ${userId}, comicId: ${comicId}`, error);
    }
  );
}

/** Subscribe to all comics' progress for a user in realtime. */
export function subscribeToAllComicProgress(
  userId: string,
  callback: (states: ComicProgressState[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeToFirestoreCollection(
    'comic_progress',
    (docs) => {
      callback(docs.map((d) => fromDocument(d.comicId, d)));
    },
    { filters: [{ field: 'userId', operator: '==', value: userId }] },
    onError
  );
}
