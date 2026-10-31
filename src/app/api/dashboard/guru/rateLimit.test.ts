import assert from 'node:assert/strict';
import test from 'node:test';
import { isTeacherAiRateLimited } from './rateLimit';

test('AI cooldown blocks only recent valid timestamps', () => {
  const now = Date.parse('2026-10-30T12:00:00.000Z');

  assert.equal(isTeacherAiRateLimited(now - 59_999, now, 60_000), true);
  assert.equal(isTeacherAiRateLimited(now - 60_000, now, 60_000), false);
  assert.equal(isTeacherAiRateLimited('invalid', now, 60_000), false);
  assert.equal(isTeacherAiRateLimited(null, now, 60_000), false);
});
