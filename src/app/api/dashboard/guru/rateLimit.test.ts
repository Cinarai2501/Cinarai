import assert from 'node:assert/strict';
import test from 'node:test';
import { getTeacherAiRateLimitRemainingSeconds, isTeacherAiRateLimited } from './rateLimit';

test('AI cooldown blocks only recent valid timestamps', () => {
  const now = Date.parse('2026-10-30T12:00:00.000Z');

  assert.equal(isTeacherAiRateLimited(now - 59_999, now, 60_000), true);
  assert.equal(isTeacherAiRateLimited(now - 60_000, now, 60_000), false);
  assert.equal(isTeacherAiRateLimited('invalid', now, 60_000), false);
  assert.equal(isTeacherAiRateLimited(null, now, 60_000), false);
});

test('reports the remaining account cooldown rounded up to a retryable second', () => {
  const now = Date.parse('2026-10-30T12:00:00.000Z');

  assert.equal(getTeacherAiRateLimitRemainingSeconds(now - 32_750, now, 60_000), 28);
  assert.equal(getTeacherAiRateLimitRemainingSeconds(now - 59_999, now, 60_000), 1);
  assert.equal(getTeacherAiRateLimitRemainingSeconds(now - 60_000, now, 60_000), 0);
  assert.equal(getTeacherAiRateLimitRemainingSeconds('invalid', now, 60_000), 0);
});
