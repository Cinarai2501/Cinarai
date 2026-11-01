import { createHash } from 'node:crypto';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';

export type TeacherAiAnalysisScope = 'class' | 'student' | 'module';

const DEFAULT_MAX_REQUESTS = 5;
const DEFAULT_WINDOW_MS = 60_000;

function timestampMillis(value: unknown): number | null {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? timestamp : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value && typeof value === 'object' && 'toMillis' in value && typeof value.toMillis === 'function') {
    const timestamp = value.toMillis();
    return typeof timestamp === 'number' && Number.isFinite(timestamp) ? timestamp : null;
  }
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    const date = value.toDate();
    return date instanceof Date && Number.isFinite(date.getTime()) ? date.getTime() : null;
  }
  return null;
}

export function getTeacherAiRateLimitState(
  requestTimestamps: unknown,
  now: number,
  maxRequests = DEFAULT_MAX_REQUESTS,
  windowMs = DEFAULT_WINDOW_MS,
): { remainingRequests: number; retryAfterSeconds: number; activeTimestamps: number[] } {
  const activeTimestamps = (Array.isArray(requestTimestamps) ? requestTimestamps : [])
    .map(timestampMillis)
    .filter((timestamp): timestamp is number =>
      timestamp !== null && timestamp <= now && now - timestamp < windowMs
    )
    .sort((left, right) => left - right);
  if (activeTimestamps.length < maxRequests) {
    return { remainingRequests: maxRequests - activeTimestamps.length, retryAfterSeconds: 0, activeTimestamps };
  }
  const oldest = activeTimestamps[Math.max(0, activeTimestamps.length - maxRequests)];
  return {
    remainingRequests: 0,
    retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    activeTimestamps,
  };
}

export function getTeacherAiRateLimitDocumentId(
  scope: TeacherAiAnalysisScope,
  targetUid?: string,
): string {
  const normalizedTarget = scope === 'student' || scope === 'module' ? targetUid?.trim() : '';
  if ((scope === 'student' || scope === 'module') && !normalizedTarget) {
    throw new Error(`Target wajib untuk scope analisis ${scope}.`);
  }
  return createHash('sha256')
    .update(`${scope}:${normalizedTarget ?? ''}`)
    .digest('hex');
}

export async function consumeTeacherAiRateLimit(
  firestore: Firestore,
  teacherUid: string,
  scope: TeacherAiAnalysisScope,
  targetUid?: string,
  now = Date.now(),
  maxRequests = DEFAULT_MAX_REQUESTS,
  windowMs = DEFAULT_WINDOW_MS,
): Promise<number> {
  const rateLimitRef = firestore
    .collection('users')
    .doc(teacherUid)
    .collection('guruAiRateLimits')
    .doc(getTeacherAiRateLimitDocumentId(scope, targetUid));
  return firestore.runTransaction(async (transaction) => {
    const rateLimit = await transaction.get(rateLimitRef);
    const state = getTeacherAiRateLimitState(
      rateLimit.get('requestTimestamps'),
      now,
      maxRequests,
      windowMs,
    );
    if (state.retryAfterSeconds > 0) return state.retryAfterSeconds;
    transaction.set(rateLimitRef, {
      requestTimestamps: [...state.activeTimestamps, now],
      updatedAt: FieldValue.serverTimestamp(),
    });
    return 0;
  });
}
