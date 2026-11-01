import assert from 'node:assert/strict';
import test from 'node:test';
import { releaseAiRequestLock, tryAcquireAiRequestLock } from './aiRequestLock';

test('prevents duplicate AI requests while one request is in flight', () => {
  const lock = { current: false };

  assert.equal(tryAcquireAiRequestLock(lock), true);
  assert.equal(tryAcquireAiRequestLock(lock), false);
  releaseAiRequestLock(lock);
  assert.equal(tryAcquireAiRequestLock(lock), true);
});
