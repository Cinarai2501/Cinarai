import assert from 'node:assert/strict';
import test from 'node:test';
import { readBoundedJsonBody } from './requestBody';

test('reads valid JSON within the byte limit', async () => {
  const request = new Request('https://example.test', {
    method: 'POST',
    body: JSON.stringify({ action: 'class-insight' }),
  });

  assert.deepEqual(await readBoundedJsonBody(request, 128), {
    ok: true,
    value: { action: 'class-insight' },
  });
});

test('rejects JSON larger than the byte limit without relying on Content-Length', async () => {
  const request = new Request('https://example.test', {
    method: 'POST',
    body: JSON.stringify({ action: 'class-insight', extra: 'x'.repeat(256) }),
  });

  assert.deepEqual(await readBoundedJsonBody(request, 128), {
    ok: false,
    reason: 'too_large',
  });
});

test('rejects malformed JSON', async () => {
  const request = new Request('https://example.test', { method: 'POST', body: '{invalid' });

  assert.deepEqual(await readBoundedJsonBody(request, 128), {
    ok: false,
    reason: 'invalid',
  });
});
