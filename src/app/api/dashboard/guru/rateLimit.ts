import { FieldValue, type Firestore } from 'firebase-admin/firestore';

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

export function isTeacherAiRateLimited(
  lastRequestedAt: unknown,
  now: number,
  cooldownMs: number,
): boolean {
  return getTeacherAiRateLimitRemainingSeconds(lastRequestedAt, now, cooldownMs) > 0;
}

export function getTeacherAiRateLimitRemainingSeconds(
  lastRequestedAt: unknown,
  now: number,
  cooldownMs: number,
): number {
  const timestamp = timestampMillis(lastRequestedAt);
  if (timestamp === null) return 0;
  return Math.ceil(Math.max(0, cooldownMs - (now - timestamp)) / 1000);
}

export async function consumeTeacherAiRateLimit(
  firestore: Firestore,
  teacherUid: string,
  cooldownMs: number,
  now?: number,
): Promise<number> {
  const profileRef = firestore.collection('users').doc(teacherUid);
  return firestore.runTransaction(async (transaction) => {
    const profile = await transaction.get(profileRef);
    if (!profile.exists) throw new Error('Profil guru tidak tersedia untuk menerapkan batas analisis AI.');
    const remainingSeconds = getTeacherAiRateLimitRemainingSeconds(
      profile.get('guruAiAnalysisLastRequestedAt'),
      now ?? Date.now(),
      cooldownMs,
    );
    if (remainingSeconds > 0) return remainingSeconds;
    transaction.update(profileRef, { guruAiAnalysisLastRequestedAt: FieldValue.serverTimestamp() });
    return 0;
  });
}
