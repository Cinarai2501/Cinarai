import assert from 'node:assert/strict';
import test from 'node:test';
import { getInternalAiRetryAfter, INTERNAL_AI_RATE_LIMIT_CODE } from './rateLimitResponse';

test('only an explicitly marked internal 429 starts the internal retry countdown', () => {
  const internalResponse = new Response(null, {
    status: 429,
    headers: { 'Retry-After': '12' },
  });
  const providerResponse = new Response(null, {
    status: 429,
    headers: { 'Retry-After': '45' },
  });

  assert.equal(getInternalAiRetryAfter(internalResponse, { code: INTERNAL_AI_RATE_LIMIT_CODE }), 12);
  assert.equal(getInternalAiRetryAfter(providerResponse, { code: 'AI_PROVIDER_RATE_LIMIT' }), 0);
  assert.equal(getInternalAiRetryAfter(providerResponse, { error: 'Provider rate limit' }), 0);
});

test('internal retry countdown safely handles missing or invalid headers', () => {
  const response = new Response(null, { status: 429 });

  assert.equal(getInternalAiRetryAfter(response, { code: INTERNAL_AI_RATE_LIMIT_CODE }), 1);
  assert.equal(getInternalAiRetryAfter(new Response(null, { status: 503 }), {
    code: INTERNAL_AI_RATE_LIMIT_CODE,
  }), 0);
});
