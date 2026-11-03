'use client';

import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase/client';
import {
  createApplicationActivityOutbox,
  type ApplicationActivityData,
} from './applicationActivityOutbox';

function getStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function sameValue(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((item, index) => sameValue(item, right[index]));
  }
  if (isRecord(left) && isRecord(right)) {
    const leftEntries = Object.entries(left);
    const rightEntries = Object.entries(right);
    return leftEntries.length === rightEntries.length
      && leftEntries.every(([key, value]) =>
        Object.prototype.hasOwnProperty.call(right, key) && sameValue(value, right[key]));
  }
  return false;
}

const outbox = createApplicationActivityOutbox({
  storage: getStorage(),
  isOnline: () => typeof navigator === 'undefined' || navigator.onLine !== false,
  isCurrentUser: (uid) => auth.currentUser?.uid === uid,
  createId: () => crypto.randomUUID().replace(/-/g, ''),
  writeDocument: async (id, userId, data) => {
    if (auth.currentUser?.uid !== userId) {
      throw Object.assign(new Error('Application activity UID no longer matches the signed-in user.'), {
        code: 'application-activity/uid-mismatch',
      });
    }

    const reference = doc(firestore, 'application_activity', id);
    try {
      await setDoc(reference, {
        ...data,
        userId,
        timestamp: serverTimestamp(),
        synced: true,
      });
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error
        ? String(error.code).toLowerCase().replace(/^firestore\//, '')
        : '';
      if (code !== 'permission-denied') throw error;

      const existing = await getDoc(reference);
      const existingData = existing.data();
      if (existing.exists()
        && auth.currentUser?.uid === userId
        && existingData?.userId === userId
        && Object.entries(data).every(([key, value]) =>
          sameValue(existingData[key], value))) {
        return;
      }
      throw error;
    }
  },
  addResumeListeners: (callback) => {
    if (typeof window === 'undefined') return () => {};
    const handleOnline = () => callback();
    const handleFocus = () => callback();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') callback();
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  },
  onSyncError: (category) => {
    console.warn('[ApplicationActivityOutbox] sync attempt failed', { category });
  },
});

export function startApplicationActivitySync(userId: string): () => void {
  return outbox.start(userId);
}

export function saveApplicationActivity(input: {
  userId: string | null;
  data: ApplicationActivityData;
  deferSync?: boolean;
}) {
  return outbox.enqueue(input);
}

export function releaseApplicationActivity(id: string, userId: string | null) {
  outbox.release(id, userId);
}

export function updateApplicationActivity(
  id: string,
  userId: string | null,
  patch: Partial<Pick<ApplicationActivityData, 'coachType' | 'coachMessage' | 'coachSummary'>>,
) {
  return outbox.update(id, userId, patch);
}
