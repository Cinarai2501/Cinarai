'use client';

import { deleteField, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import type { ProgressDocument } from '@/types/firestore';
import { BANGUN_RUANG_MODULE } from './module';

export type LearningModuleStatus = 'not_started' | 'in_progress' | 'completed';

export interface LearningModuleProgressDocument extends ProgressDocument {
  moduleId: typeof BANGUN_RUANG_MODULE.id;
  status: LearningModuleStatus;
}

function progressRef(userId: string) {
  return doc(firestore, 'users', userId, 'learning-module-progress', BANGUN_RUANG_MODULE.id);
}

export async function getLearningModuleProgress(userId: string): Promise<LearningModuleProgressDocument | null> {
  if (!userId) return null;
  const snapshot = await getDoc(progressRef(userId));
  return snapshot.exists() ? (snapshot.data() as LearningModuleProgressDocument) : null;
}

export async function saveLearningModuleProgress(
  userId: string,
  progress: Pick<LearningModuleProgressDocument, 'completedItems' | 'totalItems' | 'status'>
): Promise<void> {
  if (!userId) return;
  await setDoc(
    progressRef(userId),
    {
      userId,
      moduleId: BANGUN_RUANG_MODULE.id,
      lessonId: BANGUN_RUANG_MODULE.id,
      score: 0,
      completedItems: progress.completedItems,
      totalItems: progress.totalItems,
      isCompleted: progress.status === 'completed',
      status: progress.status,
      updatedAt: serverTimestamp(),
      completedAt: progress.status === 'completed' ? serverTimestamp() : deleteField(),
    },
    { merge: true }
  );
}