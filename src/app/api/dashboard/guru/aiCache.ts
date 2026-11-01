import { createHash } from 'node:crypto';
import type { Firestore } from 'firebase-admin/firestore';

export type TeacherAiCacheType = 'class' | 'student' | 'module';

const CACHE_TTL_MS = 30 * 60_000;

function stableValue(value: unknown, root = false): unknown {
  if (Array.isArray(value)) return value.map((child) => stableValue(child));
  if (value instanceof Date) return value.toISOString();
  if (!value || typeof value !== 'object') return value;
  if ('toDate' in value && typeof value.toDate === 'function') {
    const date = value.toDate();
    if (date instanceof Date && Number.isFinite(date.getTime())) return date.toISOString();
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !root || key !== 'generatedAt')
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, stableValue(child)])
  );
}

export function getAiSourceFingerprint(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(stableValue(value, true)))
    .digest('hex');
}

export function getTeacherAiCacheDocumentId(type: TeacherAiCacheType, targetUid?: string): string {
  return createHash('sha256')
    .update(`${type}:${targetUid?.trim() ?? ''}`)
    .digest('hex');
}

export async function readTeacherAiCache(
  firestore: Firestore,
  teacherUid: string,
  type: TeacherAiCacheType,
  targetUid: string | undefined,
  sourceFingerprint: string,
  now = Date.now(),
): Promise<{ ai: Record<string, unknown>; generatedAt: string; provider: string | null } | null> {
  const cacheRef = firestore
    .collection('users')
    .doc(teacherUid)
    .collection('guruAiInsightCache')
    .doc(getTeacherAiCacheDocumentId(type, targetUid));
  const snapshot = await cacheRef.get();
  const data = snapshot.data();
  if (!snapshot.exists
    || data?.sourceFingerprint !== sourceFingerprint
    || typeof data.expiresAt !== 'number'
    || data.expiresAt <= now
    || !data.ai
    || typeof data.ai !== 'object'
    || Array.isArray(data.ai)
    || typeof data.generatedAt !== 'string') {
    return null;
  }
  return {
    ai: data.ai as Record<string, unknown>,
    generatedAt: data.generatedAt,
    provider: typeof data.provider === 'string' ? data.provider : null,
  };
}

export async function readTeacherAiCacheSafely(
  ...args: Parameters<typeof readTeacherAiCache>
): Promise<
  | { cache: Awaited<ReturnType<typeof readTeacherAiCache>>; error: null }
  | { cache: null; error: unknown }
> {
  try {
    return { cache: await readTeacherAiCache(...args), error: null };
  } catch (error) {
    return { cache: null, error };
  }
}

export async function writeTeacherAiCache(
  firestore: Firestore,
  teacherUid: string,
  type: TeacherAiCacheType,
  targetUid: string | undefined,
  sourceFingerprint: string,
  ai: Record<string, unknown>,
  provider: string | null,
  generatedAt = new Date().toISOString(),
  now = Date.now(),
): Promise<void> {
  const cacheRef = firestore
    .collection('users')
    .doc(teacherUid)
    .collection('guruAiInsightCache')
    .doc(getTeacherAiCacheDocumentId(type, targetUid));
  await cacheRef.set({
    sourceFingerprint,
    ai,
    provider,
    generatedAt,
    expiresAt: now + CACHE_TTL_MS,
  });
}
