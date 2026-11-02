import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveAiRequestAccess } from './requestAccess';
import { consumeAiUserRateLimit, getAiUserRateLimitState } from './userRateLimit';
import type { Firestore } from 'firebase-admin/firestore';

function dependencies(overrides: Partial<{
  verifyIdToken: (token: string) => Promise<{ uid?: unknown } | null>;
  getRole: (uid: string) => Promise<unknown>;
  consumeRateLimit: (uid: string) => Promise<number>;
}> = {}) {
  return {
    verifyIdToken: overrides.verifyIdToken ?? (async () => ({ uid: 'verified-user' })),
    getRole: overrides.getRole ?? (async () => 'student'),
  };
}

test('AI access rejects requests without a bearer token', async () => {
  const access = await resolveAiRequestAccess(null, ['student'], dependencies());
  assert.deepEqual(access, { ok: false, status: 401, error: 'Sesi tidak valid.' });
});

test('AI access rejects invalid and expired tokens with 401', async () => {
  for (const verifyIdToken of [
    async () => null,
    async () => { throw new Error('expired token details'); },
  ]) {
    const access = await resolveAiRequestAccess(
      'Bearer invalid-token',
      ['student'],
      dependencies({ verifyIdToken }),
    );
    assert.equal(access.ok, false);
    if (!access.ok) assert.equal(access.status, 401);
  }
});

test('AI access uses verified UID, not request payload identity, and checks server role', async () => {
  let roleLookupUid = '';
  const access = await resolveAiRequestAccess(
    'Bearer valid-token',
    ['student'],
    dependencies({
      verifyIdToken: async () => ({ uid: 'verified-student' }),
      getRole: async (uid) => {
        roleLookupUid = uid;
        return 'student';
      },
    }),
  );

  assert.deepEqual(access, { ok: true, uid: 'verified-student' });
  assert.equal(roleLookupUid, 'verified-student');
});

test('AI access rejects student-to-student and student-to-teacher privilege escalation', async () => {
  const student = await resolveAiRequestAccess(
    'Bearer student-token',
    ['teacher', 'admin'],
    dependencies({ getRole: async () => 'student' }),
  );
  const teacher = await resolveAiRequestAccess(
    'Bearer teacher-token',
    ['student'],
    dependencies({ getRole: async () => 'teacher' }),
  );

  assert.equal(student.ok, false);
  assert.equal(teacher.ok, false);
  if (!student.ok) assert.equal(student.status, 403);
  if (!teacher.ok) assert.equal(teacher.status, 403);
});

test('persistent AI rate limit rejects repeated requests and expires old timestamps', async () => {
  let stored: unknown[] = [];
  const firestore = {
    collection: () => ({
      doc: () => ({
        collection: () => ({
          doc: () => ({ path: 'users/user/aiRateLimits/bucket' }),
        }),
      }),
    }),
    runTransaction: async (callback: (transaction: {
      get: (reference: { path: string }) => Promise<{ get: (key: string) => unknown }>;
      set: (reference: { path: string }, value: { requestTimestamps: number[] }) => void;
    }) => Promise<number>) => callback({
      get: async () => ({ get: () => stored }),
      set: (_reference, value) => { stored = value.requestTimestamps; },
    }),
  } as unknown as Firestore;

  assert.equal(await consumeAiUserRateLimit(firestore, 'user', 1_000, 2, 60_000), 0);
  assert.equal(await consumeAiUserRateLimit(firestore, 'user', 2_000, 2, 60_000), 0);
  assert.equal(await consumeAiUserRateLimit(firestore, 'user', 3_000, 2, 60_000), 58);
  assert.equal(await consumeAiUserRateLimit(firestore, 'user', 62_000, 2, 60_000), 0);

  assert.deepEqual(
    getAiUserRateLimitState([1_000, 2_000, Number.NaN, 'invalid'], 61_999, 2, 60_000),
    { retryAfterSeconds: 0, activeTimestamps: [2_000] },
  );
});
