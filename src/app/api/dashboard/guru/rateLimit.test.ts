import assert from 'node:assert/strict';
import test from 'node:test';
import {
  consumeTeacherAiRateLimit,
  getTeacherAiRateLimitConfig,
  getTeacherAiRateLimitDocumentId,
  getTeacherAiRateLimitState,
  runTeacherAiAnalysis,
} from './rateLimit';
import type { Firestore } from 'firebase-admin/firestore';

function createFakeFirestore() {
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
  return { firestore, documents };
}

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

test('class, student UID, and module scopes do not lock one another', async () => {
  const { firestore } = createFakeFirestore();
  const now = Date.parse('2026-10-30T12:00:00.000Z');
  for (let request = 0; request < 5; request += 1) {
    assert.equal(await consumeTeacherAiRateLimit(firestore, 'teacher-uid', 'student', 'student-uid-1', now), 0);
  }

  const generate = async () => 'generated';
  const classResult = await runTeacherAiAnalysis(firestore, 'teacher-uid', 'class', undefined, null, generate, now);
  const anotherStudent = await runTeacherAiAnalysis(
    firestore,
    'teacher-uid',
    'student',
    'student-uid-2',
    null,
    generate,
    now,
  );
  const moduleResult = await runTeacherAiAnalysis(
    firestore,
    'teacher-uid',
    'module',
    '1',
    null,
    generate,
    now,
  );

  assert.equal(classResult.kind, 'generated');
  assert.equal(anotherStudent.kind, 'generated');
  assert.equal(moduleResult.kind, 'generated');
  assert.equal(
    (await runTeacherAiAnalysis(firestore, 'teacher-uid', 'student', 'student-uid-1', null, generate, now)).kind,
    'rate-limited',
  );

  const classScope = getTeacherAiRateLimitDocumentId('class');
  const studentOne = getTeacherAiRateLimitDocumentId('student', 'student-uid-1');
  const studentTwo = getTeacherAiRateLimitDocumentId('student', 'student-uid-2');

  assert.notEqual(classScope, studentOne);
  assert.notEqual(studentOne, studentTwo);
  assert.equal(getTeacherAiRateLimitDocumentId('class'), classScope);
});

test('cache hits skip the internal rate limit and provider call', async () => {
  let providerCalled = false;
  const firestore = {
    collection: () => {
      throw new Error('A cache hit must not access the rate-limit store');
    },
  } as unknown as Firestore;

  const result = await runTeacherAiAnalysis(
    firestore,
    'teacher-uid',
    'class',
    undefined,
    { insight: 'cached' },
    async () => {
      providerCalled = true;
      return { insight: 'generated' };
    },
  );

  assert.deepEqual(result, { kind: 'cache', value: { insight: 'cached' } });
  assert.equal(providerCalled, false);
});

test('provider failures release their reservation so the next request can proceed', async () => {
  const { firestore } = createFakeFirestore();
  const now = Date.parse('2026-10-30T12:00:00.000Z');

  await assert.rejects(
    runTeacherAiAnalysis(
      firestore,
      'teacher-uid',
      'student',
      'student-uid',
      null,
      async () => {
        throw new Error('Provider failed');
      },
      now,
    ),
    /Provider failed/,
  );

  const retry = await runTeacherAiAnalysis(
    firestore,
    'teacher-uid',
    'student',
    'student-uid',
    null,
    async () => 'success',
    now,
  );
  assert.deepEqual(retry, { kind: 'generated', value: 'success' });
});

test('invalid provider output releases its reservation without blocking a retry', async () => {
  const { firestore } = createFakeFirestore();
  const now = Date.parse('2026-10-30T12:00:00.000Z');

  const invalid = await runTeacherAiAnalysis(
    firestore,
    'teacher-uid',
    'class',
    undefined,
    null,
    async () => ({ valid: false }),
    now,
    (result) => result.valid,
  );
  const retry = await runTeacherAiAnalysis(
    firestore,
    'teacher-uid',
    'class',
    undefined,
    null,
    async () => ({ valid: true }),
    now,
    (result) => result.valid,
  );

  assert.deepEqual(invalid, { kind: 'generated', value: { valid: false } });
  assert.deepEqual(retry, { kind: 'generated', value: { valid: true } });
});

test('internal rate limit can be configured within safe bounds', () => {
  const previousMax = process.env.TEACHER_AI_RATE_LIMIT_MAX_REQUESTS;
  const previousWindow = process.env.TEACHER_AI_RATE_LIMIT_WINDOW_MS;
  try {
    delete process.env.TEACHER_AI_RATE_LIMIT_MAX_REQUESTS;
    delete process.env.TEACHER_AI_RATE_LIMIT_WINDOW_MS;
    assert.deepEqual(getTeacherAiRateLimitConfig(), { maxRequests: 5, windowMs: 60_000 });
    process.env.TEACHER_AI_RATE_LIMIT_MAX_REQUESTS = '7';
    process.env.TEACHER_AI_RATE_LIMIT_WINDOW_MS = '15000';
    assert.deepEqual(getTeacherAiRateLimitConfig(), { maxRequests: 7, windowMs: 15_000 });
    process.env.TEACHER_AI_RATE_LIMIT_MAX_REQUESTS = '1001';
    assert.throws(() => getTeacherAiRateLimitConfig(), /bilangan bulat/);
  } finally {
    if (previousMax === undefined) delete process.env.TEACHER_AI_RATE_LIMIT_MAX_REQUESTS;
    else process.env.TEACHER_AI_RATE_LIMIT_MAX_REQUESTS = previousMax;
    if (previousWindow === undefined) delete process.env.TEACHER_AI_RATE_LIMIT_WINDOW_MS;
    else process.env.TEACHER_AI_RATE_LIMIT_WINDOW_MS = previousWindow;
  }
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
  const { firestore } = createFakeFirestore();
  const now = Date.parse('2026-10-30T12:00:00.000Z');

  const results = await Promise.all(Array.from({ length: 12 }, () =>
    consumeTeacherAiRateLimit(firestore, 'teacher-uid', 'student', 'student-uid', now)
  ));

  assert.equal(results.filter((retryAfter) => retryAfter === 0).length, 5);
  assert.equal(results.filter((retryAfter) => retryAfter > 0).length, 7);
  assert.ok(results.filter((retryAfter) => retryAfter > 0).every((retryAfter) => retryAfter === 60));
});
