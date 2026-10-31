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
  const timestamp = timestampMillis(lastRequestedAt);
  return timestamp !== null && now - timestamp < cooldownMs;
}

export async function consumeTeacherAiRateLimit(
  firestore: Firestore,
  teacherUid: string,
  cooldownMs: number,
  now = Date.now(),
): Promise<boolean> {
  const profileRef = firestore.collection('users').doc(teacherUid);
  return firestore.runTransaction(async (transaction) => {
    const profile = await transaction.get(profileRef);
    if (!profile.exists) throw new Error('Profil guru tidak tersedia untuk menerapkan batas analisis AI.');
    if (isTeacherAiRateLimited(profile.get('guruAiAnalysisLastRequestedAt'), now, cooldownMs)) return true;
    transaction.update(profileRef, { guruAiAnalysisLastRequestedAt: FieldValue.serverTimestamp() });
    return false;
  });
}
