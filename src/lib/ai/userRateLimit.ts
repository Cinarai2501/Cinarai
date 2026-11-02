import { createHash } from 'node:crypto';
import type { Firestore } from 'firebase-admin/firestore';

const DEFAULT_MAX_REQUESTS = 20;
const DEFAULT_WINDOW_MS = 60_000;

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
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}.`);
  }
  return value;
}

export function getAiUserRateLimitConfig(): { maxRequests: number; windowMs: number } {
  return {
    maxRequests: configuredPositiveInteger('AI_USER_RATE_LIMIT_MAX_REQUESTS', DEFAULT_MAX_REQUESTS, 1, 1_000),
    windowMs: configuredPositiveInteger('AI_USER_RATE_LIMIT_WINDOW_MS', DEFAULT_WINDOW_MS, 1_000, 3_600_000),
  };
}

export function getAiUserRateLimitState(
  requestTimestamps: unknown,
  now: number,
  maxRequests = DEFAULT_MAX_REQUESTS,
  windowMs = DEFAULT_WINDOW_MS,
): { retryAfterSeconds: number; activeTimestamps: number[] } {
  const activeTimestamps = (Array.isArray(requestTimestamps) ? requestTimestamps : [])
    .filter((timestamp): timestamp is number =>
      typeof timestamp === 'number'
      && Number.isFinite(timestamp)
      && timestamp <= now
      && now - timestamp < windowMs
    )
    .sort((left, right) => left - right);
  if (activeTimestamps.length < maxRequests) {
    return { retryAfterSeconds: 0, activeTimestamps };
  }
  const retryAt = activeTimestamps[activeTimestamps.length - maxRequests] + windowMs;
  return {
    retryAfterSeconds: Math.max(1, Math.ceil((retryAt - now) / 1000)),
    activeTimestamps,
  };
}

export function getAiUserRateLimitDocumentId(): string {
  return createHash('sha256').update('provider-backed-ai').digest('hex');
}

export async function consumeAiUserRateLimit(
  firestore: Firestore,
  uid: string,
  now = Date.now(),
  maxRequests?: number,
  windowMs?: number,
): Promise<number> {
  if (!uid.trim()) throw new Error('Authenticated UID is required for AI rate limiting.');
  const config = getAiUserRateLimitConfig();
  const rateLimitRef = firestore
    .collection('users')
    .doc(uid)
    .collection('guruAiRateLimits')
    .doc(getAiUserRateLimitDocumentId());

  return firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(rateLimitRef);
    const state = getAiUserRateLimitState(
      snapshot.get('requestTimestamps'),
      now,
      maxRequests ?? config.maxRequests,
      windowMs ?? config.windowMs,
    );
    if (state.retryAfterSeconds > 0) return state.retryAfterSeconds;
    transaction.set(rateLimitRef, { requestTimestamps: [...state.activeTimestamps, now] });
    return 0;
  });
}
