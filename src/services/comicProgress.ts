'use client';

import { doc, getDoc, onSnapshot, setDoc, serverTimestamp, type Unsubscribe, collection, type QuerySnapshot, type DocumentData } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import { getAllComics } from '@/lib/comicRepository';
import { deleteFirestoreDocument, queryFirestoreCollection } from '@/services/firestore';
import { clearStoredComicReadingProgressEntry, dispatchComicReadingProgressReset } from '@/lib/comicReadingProgressStorage';
import type { ComicProgressState, SintaksProgress } from '@/types/progress';
import type { FirestoreTimestamp } from '@/types/firestore';
import { SINTAKS } from '@/types/progress';

// New minimal Firestore shape (Progress Engine V2)
interface ComicProgressV2 {
  comicId: number;
  currentStage: string;
  completedStages: string[];
  readerPage?: number;
  readerCompleted?: boolean;
  lastOpened?: unknown;
  updatedAt?: FirestoreTimestamp | unknown;
}

function log(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.log('[comic-progress-v2]', ...args);
}

function comicDocId(comicId: number) {
  return `comic-${comicId}`;
}

function progressDocRef(userId: string, comicId: number) {
  return doc(firestore, 'users', userId, 'progress', comicDocId(comicId));
}


function buildCompatState(comicId: number, doc: ComicProgressV2 | null): ComicProgressState {
  // Build a compatible `ComicProgressState` used by existing UI code
  const completedSet = new Set<string>(doc?.completedStages ?? []);
  const current = doc?.currentStage ?? SINTAKS[0];

  const sintaksList: SintaksProgress[] = SINTAKS.map((s) => {
    if (completedSet.has(s)) return { sintaks: s, status: 'COMPLETED' } as SintaksProgress;
    if (s === current) return { sintaks: s, status: 'CURRENT' } as SintaksProgress;
    return { sintaks: s, status: 'LOCKED' } as SintaksProgress;
  });

  const completedCount = sintaksList.filter((s) => s.status === 'COMPLETED').length;
  const percentage = Math.round((completedCount / SINTAKS.length) * 1000) / 10;
  return {
    comicId,
    sintaksList,
    completedCount,
    percentage,
    isCompleted: completedCount === SINTAKS.length,
  };
}

// Helpers to clear related documents when resetting a comic progress
async function clearIdentificationAnswers(userId: string, comicId: number): Promise<void> {
  const answers = await queryFirestoreCollection('identification_answers', {
    filters: [
      { field: 'userId', operator: '==', value: userId },
      { field: 'comicId', operator: '==', value: comicId },
    ],
  });
  await Promise.all(
    answers.map((a) => deleteFirestoreDocument('identification_answers', a.id ?? `${userId}_${comicId}_${(a as unknown as { step?: number }).step ?? 0}`))
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
    activities.map((a) => deleteFirestoreDocument('application_activity', a.id ?? `${userId}_${comicId}_${(a as unknown as { attempt?: number }).attempt ?? 0}`))
  );
}

async function clearReflectionDocuments(userId: string, comicId: number): Promise<void> {
  const reflections = await queryFirestoreCollection('reflection', { filters: [{ field: 'userId', operator: '==', value: userId }] });
  const matching = reflections.filter((r) => {
    const rid = (r as unknown as { id?: string }).id;
    const reflectionComicId = (r as unknown as { comicId?: unknown }).comicId;
    return rid?.startsWith(`${userId}_${comicId}_`) || String(reflectionComicId) === String(comicId);
  });
  await Promise.all(matching.map((r) => deleteFirestoreDocument('reflection', (r as unknown as { id?: string }).id ?? `${userId}_${comicId}_reflection`)));
}

export async function initializeUserProgress(userId: string): Promise<void> {
  const comics = getAllComics();
  await Promise.all(
    comics.map(async (comic) => {
      const ref = progressDocRef(userId, comic.id);
      try {
        const snap = await getDoc(ref);
        if (snap.exists()) return;
        const initial: ComicProgressV2 = {
          comicId: comic.id,
          currentStage: SINTAKS[0],
          completedStages: [],
          readerPage: 1,
          readerCompleted: false,
          updatedAt: serverTimestamp(),
        };
        await setDoc(ref, initial);
      } catch (e) {
        // ignore
      }
    })
  );
}

export async function getComicProgress(userId: string, comicId: number): Promise<ComicProgressState> {
  if (!userId) throw new Error('unauthenticated');
  const ref = progressDocRef(userId, comicId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return buildCompatState(comicId, null);
  const data = snap.data() as ComicProgressV2;
  return buildCompatState(comicId, data);
}

export function extractFirebaseErrorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as { code: string }).code);
  }
  return error instanceof Error ? error.message : String(error);
}

export async function saveComicProgress(
  userId: string,
  comicId: number,
  stateOrPayload: unknown,
  extraData?: Record<string, unknown>
): Promise<void> {
  if (!userId) throw new Error('unauthenticated');
  const ref = progressDocRef(userId, comicId);

  // Backwards-compatible: if a full ComicProgressState is supplied, convert
  // it to the V2 payload shape. Otherwise assume it's already a V2 partial.
  let payload: Partial<ComicProgressV2>;
  if (typeof stateOrPayload === 'object' && stateOrPayload !== null && 'sintaksList' in (stateOrPayload as object)) {
    const st = stateOrPayload as ComicProgressState;
    const completedStages = st.sintaksList.filter((s) => s.status === 'COMPLETED').map((s) => s.sintaks);
    const current = st.sintaksList.find((s) => s.status === 'CURRENT')?.sintaks ?? SINTAKS[0];
    payload = {
      comicId: st.comicId,
      currentStage: current,
      completedStages,
      updatedAt: serverTimestamp(),
      ...(extraData ?? {}),
    } as Partial<ComicProgressV2>;
  } else {
    payload = (stateOrPayload as Partial<ComicProgressV2>) ?? {};
    payload.updatedAt = serverTimestamp();
  }
  const docPayload: Partial<ComicProgressV2> = {
    ...payload,
    comicId,
    updatedAt: serverTimestamp(),
  };
  log('saveComicProgress', userId, comicId, docPayload);
  try {
    await setDoc(ref, docPayload, { merge: true });
  } catch (error) {
    const code = extractFirebaseErrorCode(error);
    throw new Error(code);
  }
}

export async function resetComicProgress(userId: string, comicId: number): Promise<void> {
  if (!userId) throw new Error('unauthenticated');
  // Delete the progress document and related artifacts
  try {
    const ref = progressDocRef(userId, comicId);
    await setDoc(ref, { comicId, currentStage: SINTAKS[0], completedStages: [], readerPage: 1, readerCompleted: false, updatedAt: serverTimestamp() });
    await Promise.all([
      clearIdentificationAnswers(userId, comicId),
      clearApplicationActivities(userId, comicId),
      clearReflectionDocuments(userId, comicId),
    ]);
    clearStoredComicReadingProgressEntry(comicId);
    dispatchComicReadingProgressReset(comicId);
  } catch (e) {
    throw new Error((e as Error).message ?? 'reset failed');
  }
}

export function subscribeToComicProgress(userId: string, comicId: number, cb: (s: ComicProgressState) => void, onError?: (e: Error) => void): Unsubscribe {
  return onSnapshot(progressDocRef(userId, comicId), (snap) => {
    const data = snap.exists() ? (snap.data() as ComicProgressV2) : null;
    cb(buildCompatState(comicId, data));
  }, onError);
}

export function subscribeToAllComicProgress(userId: string, cb: (states: ComicProgressState[]) => void, onError?: (e: Error) => void): Unsubscribe {
  // Subscribe to the entire progress collection under user
  return onSnapshot(
    collection(firestore, 'users', userId, 'progress'),
    (snap: QuerySnapshot<DocumentData>) => {
      const docs = snap.docs ?? [];
      const states = docs
        .map((d) => {
          const data = d.data() as ComicProgressV2;
          const cid = data.comicId ?? Number(d.id.replace('comic-', ''));
          if (!cid || Number.isNaN(cid)) return null;
          return buildCompatState(cid, data);
        })
        .filter((s): s is ComicProgressState => s !== null);
      cb(states);
    },
    onError
  );
}

if (typeof window !== 'undefined') {
  const w = window as Window & { __cinaraiDebug?: unknown };
  w.__cinaraiDebug = {
    ...(w.__cinaraiDebug as object | undefined),
    resetComicProgress,
    saveComicProgress,
  };
}
