import assert from 'node:assert/strict';
import test from 'node:test';
import {
  consumeTeacherAiRateLimit,
  getTeacherAiRateLimitDocumentId,
  getTeacherAiRateLimitState,
} from './rateLimit';
import type { Firestore } from 'firebase-admin/firestore';

test('AI rate limit permits five requests per minute in an analysis scope', () => {
  const now = Date.parse('2026-10-30T12:00:00.000Z');
  const timestamps = Array.from({ length: 4 }, (_, index) => now - (4 - index) * 1_000);

  assert.deepEqual(getTeacherAiRateLimitState(timestamps, now), {
    remainingRequests: 1,
    retryAfterSeconds: 0,
    activeTimestamps: timestamps,
  });
  assert.equal(getTeacherAiRateLimitState([...timestamps, now], now).remainingRequests, 0);
  assert.equal(getTeacherAiRateLimitState([...timestamps, now], now).retryAfterSeconds, 56);
});

test('class and per-student analyses use different rate-limit scopes', () => {
  const classScope = getTeacherAiRateLimitDocumentId('class');
  const studentOne = getTeacherAiRateLimitDocumentId('student', 'student-uid-1');
  const studentTwo = getTeacherAiRateLimitDocumentId('student', 'student-uid-2');

  assert.notEqual(classScope, studentOne);
  assert.notEqual(studentOne, studentTwo);
  assert.equal(getTeacherAiRateLimitDocumentId('class'), classScope);
});

test('rate limit reports the exact retry window and ignores expired timestamps', () => {
  const now = Date.parse('2026-10-30T12:00:00.000Z');
  const state = getTeacherAiRateLimitState(
    [now - 60_001, now - 59_999, now - 30_000, now - 20_000, now - 10_000],
    now,
  );

  assert.equal(state.remainingRequests, 1);
  assert.equal(state.retryAfterSeconds, 0);
  assert.deepEqual(state.activeTimestamps, [now - 59_999, now - 30_000, now - 20_000, now - 10_000]);
});

test('module scope is isolated by its target identifier', () => {
  assert.notEqual(
    getTeacherAiRateLimitDocumentId('module', '1'),
    getTeacherAiRateLimitDocumentId('module', '2'),
  );
  assert.throws(() => getTeacherAiRateLimitDocumentId('student'), /Target wajib/);
});

test('parallel requests cannot exceed the transaction-protected per-scope limit', async () => {
  type FakeReference = { path: string };
  type FakeTransaction = {
    get(reference: FakeReference): Promise<{ get(field: string): unknown }>;
    set(reference: FakeReference, value: Record<string, unknown>): void;
  };
  const documents = new Map<string, Record<string, unknown>>();
  let transactionQueue = Promise.resolve();
  const firestore = {
    collection: (collectionName: string) => ({
      doc: (documentId: string) => ({
        path: `${collectionName}/${documentId}`,
        collection: (subcollectionName: string) => ({
          doc: (subdocumentId: string) => ({
            path: `${collectionName}/${documentId}/${subcollectionName}/${subdocumentId}`,
          }),
        }),
      }),
    }),
    runTransaction: async <T>(update: (transaction: FakeTransaction) => Promise<T>): Promise<T> => {
      const previous = transactionQueue;
      let release!: () => void;
      transactionQueue = new Promise<void>((resolve) => {
        release = resolve;
      });
      await previous;
      const writes: Array<{ reference: FakeReference; value: Record<string, unknown> }> = [];
      try {
        const result = await update({
          get: async (reference) => ({
            get: (field) => documents.get(reference.path)?.[field],
          }),
          set: (reference, value) => writes.push({ reference, value }),
        });
        writes.forEach(({ reference, value }) => documents.set(reference.path, value));
        return result;
      } finally {
        release();
      }
    },
  } as unknown as Firestore;
  const now = Date.parse('2026-10-30T12:00:00.000Z');

  const results = await Promise.all(Array.from({ length: 12 }, () =>
    consumeTeacherAiRateLimit(firestore, 'teacher-uid', 'student', 'student-uid', now)
  ));

  assert.equal(results.filter((retryAfter) => retryAfter === 0).length, 5);
  assert.equal(results.filter((retryAfter) => retryAfter > 0).length, 7);
  assert.ok(results.filter((retryAfter) => retryAfter > 0).every((retryAfter) => retryAfter === 60));
});
