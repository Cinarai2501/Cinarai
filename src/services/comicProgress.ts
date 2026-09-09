'use client';

import { doc, getDoc, onSnapshot, setDoc, serverTimestamp, type Unsubscribe, collection, type QuerySnapshot, type DocumentData } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import { debug } from '@/lib/debug';
import { getAllComics } from '@/lib/comicRepository';
import { deleteFirestoreDocument, queryFirestoreCollection } from '@/services/firestore';
import { clearStoredComicReadingProgressEntry, dispatchComicReadingProgressReset } from '@/lib/comicReadingProgressStorage';
import type { ComicProgressState, SintaksProgress } from '@/types/progress';
import type { FirestoreTimestamp } from '@/types/firestore';
import { SINTAKS } from '@/types/progress';

export interface ComicProgressStageData {
  cover?: { completed?: boolean };
  identification?: {
    selectedShapes?: string[];
    answers?: Array<{
      step?: number;
      selectedAnswer?: string | null;
      note?: string;
      reason?: string;
      selectedAnswerIds?: string[];
      selectedShapes?: string[];
      aiTutorUsed?: boolean;
      attemptCount?: number;
    }>;
  };
  navigation?: {
    objectVisited?: string[];
    openedObjects?: string[];
    aiConversation?: unknown[];
  };
  argumentation?: {
    currentQuestion?: string | null;
    currentIndex?: number;
    selectedAnswer?: string | null;
    textAnswer?: string | null;
    completedArguments?: number[];
    score?: number | null;
    feedback?: Record<string, unknown> | null;
  };
  application?: {
    selectedChoice?: string[];
    explanation?: string;
    score?: number | null;
    selectedAnswer?: string[];
    studentReason?: string;
    answerSubmitted?: boolean;
    answerFeedback?: string;
    attemptCount?: number;
    coachMessage?: string | null;
    coachSummary?: Record<string, unknown> | null;
  };
  introspection?: {
    reflection?: string;
    aiFeedback?: Record<string, unknown> | null;
    checked?: boolean[];
    rating?: number | null;
    saved?: boolean;
  };
  resolution?: {
    completed?: boolean;
    currentIndex?: number;
    selected?: string | null;
    completedMissions?: number[];
    isFinished?: boolean;
  };
}

// New minimal Firestore shape (Progress Engine V2)
export interface ComicProgressV2 {
  comicId: number;
  currentStage: string;
  completedStages: string[];
  readerPage?: number;
  readerCompleted?: boolean;
  lastOpened?: unknown;
  stageData?: ComicProgressStageData;
  updatedAt?: FirestoreTimestamp | unknown;
}

function log(...args: unknown[]) {
  debug('[comic-progress-v2]', ...args);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeStageData(value: unknown): ComicProgressStageData | undefined {
  if (!value || !isPlainObject(value)) return undefined;
  return value as ComicProgressStageData;
}

export function mergeStageData(existing: ComicProgressStageData | undefined, patch: ComicProgressStageData | undefined): ComicProgressStageData | undefined {
  if (!patch) {
    return existing ? { ...existing } : undefined;
  }

  const result: ComicProgressStageData = { ...(existing ?? {}) };
  Object.entries(patch).forEach(([key, value]) => {
    if (value === undefined) return;
    const currentValue = result[key as keyof ComicProgressStageData];
    if (isPlainObject(currentValue) && isPlainObject(value)) {
      result[key as keyof ComicProgressStageData] = mergeStageData(
        currentValue as ComicProgressStageData,
        value as ComicProgressStageData
      ) as never;
    } else {
      result[key as keyof ComicProgressStageData] = value as never;
    }
  });

  return result;
}

function extractStageDataPatch(stateOrPayload: unknown, extraData?: Record<string, unknown>): ComicProgressStageData | undefined {
  const stageDataCandidates: Array<Record<string, unknown> | undefined> = [];

  if (isPlainObject(stateOrPayload) && 'stageData' in stateOrPayload) {
    stageDataCandidates.push(stateOrPayload.stageData as Record<string, unknown> | undefined);
  }

  if (extraData && 'stageData' in extraData) {
    stageDataCandidates.push(extraData.stageData as Record<string, unknown> | undefined);
  }

  const topLevelStageKeys = ['cover', 'identification', 'navigation', 'argumentation', 'application', 'introspection', 'resolution'];
  if (isPlainObject(stateOrPayload)) {
    const directStagePatch = Object.fromEntries(
      Object.entries(stateOrPayload).filter(([key]) => topLevelStageKeys.includes(key))
    );
    if (Object.keys(directStagePatch).length > 0) {
      stageDataCandidates.push(directStagePatch);
    }
  }

  if (extraData) {
    const extraStagePatch = Object.fromEntries(
      Object.entries(extraData).filter(([key]) => topLevelStageKeys.includes(key))
    );
    if (Object.keys(extraStagePatch).length > 0) {
      stageDataCandidates.push(extraStagePatch);
    }
  }

  return stageDataCandidates.reduce<ComicProgressStageData | undefined>((acc, candidate) => {
    if (!candidate) return acc;
    return mergeStageData(acc, candidate as ComicProgressStageData);
  }, undefined);
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

export async function loadComicProgress(userId: string, comicId: number): Promise<ComicProgressV2 | null> {
  if (!userId) throw new Error('unauthenticated');
  debug('[comic-progress] Loading progress...', { userId, comicId });
  const ref = progressDocRef(userId, comicId);
  const snap = await getDoc(ref);
  const data = snap.exists() ? (snap.data() as ComicProgressV2) : null;
  if (data) {
    debug('[comic-progress] Loaded progress...', { comicId, stageData: data.stageData });
  }
  return data;
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

  const existingSnap = await getDoc(ref);
  const existingData = existingSnap.exists() ? (existingSnap.data() as ComicProgressV2 | null) : null;
  const patchStageData = extractStageDataPatch(stateOrPayload, extraData);
  const nextStageData = patchStageData
    ? mergeStageData(normalizeStageData(existingData?.stageData), patchStageData)
    : existingData?.stageData;

  const docPayload: Partial<ComicProgressV2> = {
    ...payload,
    stageData: nextStageData,
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
    await setDoc(ref, { comicId, currentStage: SINTAKS[0], completedStages: [], readerPage: 1, readerCompleted: false, stageData: {}, updatedAt: serverTimestamp() });
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
