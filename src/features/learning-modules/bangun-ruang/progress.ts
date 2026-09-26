'use client';

import { deleteField, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import type { ProgressDocument } from '@/types/firestore';
import { BANGUN_RUANG_MODULE } from './module';

export type LearningModuleStatus = 'not_started' | 'in_progress' | 'completed';

export interface LearningModuleProgressDocument extends ProgressDocument {
  moduleId: typeof BANGUN_RUANG_MODULE.id;
  status: LearningModuleStatus;
  completed?: boolean;
  readerCompleted?: boolean;
}

type ProgressValues = Pick<LearningModuleProgressDocument, 'completedItems' | 'totalItems' | 'status'>;
type CachedProgress = ProgressValues & { pending: boolean };

const writeQueues = new Map<string, Promise<void>>();

function progressRef(userId: string) {
  return doc(firestore, 'users', userId, 'learning-module-progress', BANGUN_RUANG_MODULE.id);
}

function localProgressKey(userId: string) {
  return `learning-module-progress:${userId || 'anonymous'}:${BANGUN_RUANG_MODULE.id}`;
}

function readLocalProgress(userId: string): CachedProgress | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(localProgressKey(userId));
    if (!value) return null;
    const progress = JSON.parse(value) as CachedProgress;
    if (!Number.isFinite(progress.completedItems) || !Number.isFinite(progress.totalItems)) return null;
    if (!['not_started', 'in_progress', 'completed'].includes(progress.status)) return null;
    return progress;
  } catch {
    return null;
  }
}

function writeLocalProgress(userId: string, progress: ProgressValues, pending: boolean) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(localProgressKey(userId), JSON.stringify({ ...progress, pending }));
  } catch {
    // Firestore remains the durable store when local storage is unavailable.
  }
}

function localProgressDocument(userId: string, progress: CachedProgress): LearningModuleProgressDocument {
  return {
    userId,
    moduleId: BANGUN_RUANG_MODULE.id,
    score: 0,
    completedItems: progress.completedItems,
    totalItems: progress.totalItems,
    isCompleted: progress.status === 'completed',
    completed: progress.status === 'completed',
    readerCompleted: progress.status === 'completed',
    status: progress.status,
  } as LearningModuleProgressDocument;
}

export async function getLearningModuleProgress(userId: string): Promise<LearningModuleProgressDocument | null> {
  const cached = readLocalProgress(userId);
  if (!userId) return cached ? localProgressDocument(userId, cached) : null;
  if (cached?.pending) {
    void saveLearningModuleProgress(userId, cached).catch(() => undefined);
    return localProgressDocument(userId, cached);
  }

  try {
    const snapshot = await getDoc(progressRef(userId));
    if (!snapshot.exists()) return cached ? localProgressDocument(userId, cached) : null;
    const stored = snapshot.data() as LearningModuleProgressDocument;
    const status = stored.status ?? (stored.isCompleted ? 'completed' : stored.completedItems > 0 ? 'in_progress' : 'not_started');
    const progress = { completedItems: stored.completedItems, totalItems: stored.totalItems, status };
    writeLocalProgress(userId, progress, false);
    return { ...stored, status };
  } catch {
    return cached ? localProgressDocument(userId, cached) : null;
  }
}

export async function saveLearningModuleProgress(
  userId: string,
  progress: ProgressValues
): Promise<void> {
  writeLocalProgress(userId, progress, Boolean(userId));
  if (!userId) return;

  const previousWrite = writeQueues.get(userId) ?? Promise.resolve();
  const currentWrite = previousWrite.catch(() => undefined).then(() => setDoc(
    progressRef(userId),
    {
      userId,
      moduleId: BANGUN_RUANG_MODULE.id,
      lessonId: BANGUN_RUANG_MODULE.id,
      score: 0,
      completedItems: progress.completedItems,
      totalItems: progress.totalItems,
      isCompleted: progress.status === 'completed',
      completed: progress.status === 'completed',
      readerCompleted: progress.status === 'completed',
      status: progress.status,
      updatedAt: serverTimestamp(),
      completedAt: progress.status === 'completed' ? serverTimestamp() : deleteField(),
    },
    { merge: true }
  ));
  writeQueues.set(userId, currentWrite);

  try {
    await currentWrite;
    const latest = readLocalProgress(userId);
    if (latest && latest.completedItems === progress.completedItems && latest.totalItems === progress.totalItems && latest.status === progress.status) {
      writeLocalProgress(userId, progress, false);
    }
  } finally {
    if (writeQueues.get(userId) === currentWrite) writeQueues.delete(userId);
  }
}