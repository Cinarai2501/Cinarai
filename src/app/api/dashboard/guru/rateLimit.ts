import { createHash } from 'node:crypto';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';

export type TeacherAiAnalysisScope = 'class' | 'student' | 'module';

const DEFAULT_MAX_REQUESTS = 5;
const DEFAULT_WINDOW_MS = 60_000;
const MAX_CONFIGURED_REQUESTS = 1_000;
const MIN_CONFIGURED_WINDOW_MS = 1_000;
const MAX_CONFIGURED_WINDOW_MS = 60 * 60_000;

function configuredPositiveInteger(
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} harus berupa bilangan bulat antara ${minimum} dan ${maximum}.`);
  }
  return value;
}

export function getTeacherAiRateLimitConfig(): { maxRequests: number; windowMs: number } {
  return {
    maxRequests: configuredPositiveInteger(
      'TEACHER_AI_RATE_LIMIT_MAX_REQUESTS',
      DEFAULT_MAX_REQUESTS,
      1,
      MAX_CONFIGURED_REQUESTS,
    ),
    windowMs: configuredPositiveInteger(
      'TEACHER_AI_RATE_LIMIT_WINDOW_MS',
      DEFAULT_WINDOW_MS,
      MIN_CONFIGURED_WINDOW_MS,
      MAX_CONFIGURED_WINDOW_MS,
    ),
  };
}

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
  maxRequests?: number,
  windowMs?: number,
): Promise<number> {
  const config = getTeacherAiRateLimitConfig();
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
      maxRequests ?? config.maxRequests,
      windowMs ?? config.windowMs,
    );
    if (state.retryAfterSeconds > 0) return state.retryAfterSeconds;
    transaction.set(rateLimitRef, {
      requestTimestamps: [...state.activeTimestamps, now],
      updatedAt: FieldValue.serverTimestamp(),
    });
    return 0;
  });
}

export async function releaseTeacherAiRateLimit(
  firestore: Firestore,
  teacherUid: string,
  scope: TeacherAiAnalysisScope,
  targetUid: string | undefined,
  requestTimestamp: number,
): Promise<void> {
  const rateLimitRef = firestore
    .collection('users')
    .doc(teacherUid)
    .collection('guruAiRateLimits')
    .doc(getTeacherAiRateLimitDocumentId(scope, targetUid));
  await firestore.runTransaction(async (transaction) => {
    const rateLimit = await transaction.get(rateLimitRef);
    const requestTimestamps = rateLimit.get('requestTimestamps');
    if (!Array.isArray(requestTimestamps)) return;
    const reservationIndex = requestTimestamps.findIndex(
      (timestamp) => timestampMillis(timestamp) === requestTimestamp,
    );
    if (reservationIndex < 0) return;
    const remainingTimestamps = [...requestTimestamps];
    remainingTimestamps.splice(reservationIndex, 1);
    transaction.set(rateLimitRef, {
      requestTimestamps: remainingTimestamps,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

export type TeacherAiAnalysisExecution<T> =
  | { kind: 'cache'; value: T }
  | { kind: 'generated'; value: T }
  | { kind: 'rate-limited'; retryAfterSeconds: number };

async function releaseReservationSafely(
  firestore: Firestore,
  teacherUid: string,
  scope: TeacherAiAnalysisScope,
  targetUid: string | undefined,
  requestTimestamp: number,
): Promise<void> {
  try {
    await releaseTeacherAiRateLimit(firestore, teacherUid, scope, targetUid, requestTimestamp);
  } catch (releaseError) {
    console.error('[dashboard/guru] failed to release AI rate-limit reservation', releaseError);
  }
}

export async function runTeacherAiAnalysis<T>(
  firestore: Firestore,
  teacherUid: string,
  scope: TeacherAiAnalysisScope,
  targetUid: string | undefined,
  cachedValue: T | null,
  generate: () => Promise<T>,
  now = Date.now(),
  isSuccessful: (value: T) => boolean = () => true,
): Promise<TeacherAiAnalysisExecution<T>> {
  if (cachedValue !== null) return { kind: 'cache', value: cachedValue };

  const retryAfterSeconds = await consumeTeacherAiRateLimit(
    firestore,
    teacherUid,
    scope,
    targetUid,
    now,
  );
  if (retryAfterSeconds > 0) return { kind: 'rate-limited', retryAfterSeconds };

  try {
    const value = await generate();
    if (!isSuccessful(value)) {
      await releaseReservationSafely(firestore, teacherUid, scope, targetUid, now);
    }
    return { kind: 'generated', value };
  } catch (error) {
    await releaseReservationSafely(firestore, teacherUid, scope, targetUid, now);
    throw error;
  }
}
