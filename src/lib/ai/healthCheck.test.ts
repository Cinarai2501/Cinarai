import test from 'node:test';
import assert from 'node:assert/strict';
import { AiProviderError } from './provider';
import type { AiProvider, AiProviderName, AiRequestPayload } from './provider';
import { checkAiProvidersHealth, getLastAiProviderHealthChecks } from './healthCheck';

function provider(
  name: AiProviderName,
  generate: (payload: AiRequestPayload, signal?: AbortSignal) => Promise<{ provider: AiProviderName; content: string }>,
): AiProvider {
  return { name, generate };
}

test('health check reports configured provider results without response content', async () => {
  const providers = [
    provider('gemini', async () => ({ provider: 'gemini', content: 'OK' })),
    provider('groq', async () => ({ provider: 'groq', content: 'OK' })),
  ];

  const results = await checkAiProvidersHealth(providers);

  assert.deepEqual(results.map(({ provider: name, status }) => [name, status]), [
    ['gemini', 'Healthy'],
    ['groq', 'Healthy'],
    ['openrouter', 'Unknown'],
    ['openai', 'Unknown'],
  ]);
  assert.equal(results[0].fallbackAvailable, false);
  assert.equal(results[1].fallbackAvailable, true);
  assert.equal(results[0].configuration, 'Configured');
  assert.equal(results[2].configuration, 'Not Configured');
  assert.ok(results[0].lastCheckedAt);
  assert.equal(typeof results[0].durationMs, 'number');
  assert.doesNotMatch(JSON.stringify(results), /OK/);
  assert.deepEqual(getLastAiProviderHealthChecks().slice(0, 2), results.slice(0, 2));
});

test('health check rotates to another key and classifies provider errors safely', async () => {
  let successfulKeyCalled = false;
  const providers = [
    provider('gemini', async () => {
      throw new AiProviderError('HTTP 429', 429);
    }),
    provider('gemini', async () => {
      successfulKeyCalled = true;
      return { provider: 'gemini', content: 'OK' };
    }),
  ];

  const results = await checkAiProvidersHealth(providers);

  assert.equal(successfulKeyCalled, true);
  assert.equal(results[0].status, 'Healthy');

  const cases: Array<[AiProviderName, Error, string]> = [
    ['gemini', new AiProviderError('HTTP 429', 429), 'Rate Limited'],
    ['gemini', new AiProviderError('HTTP 429', 429, undefined, 'quota_exhausted'), 'Quota Exhausted'],
    ['groq', new AiProviderError('HTTP 401', 401), 'Invalid Key'],
    ['openrouter', new AiProviderError('HTTP 403', 403, undefined, 'permission'), 'Permission Error'],
    ['openrouter', new AiProviderError('HTTP 404', 404), 'Not Found'],
    ['openai', new AiProviderError('Timeout', undefined, undefined, 'timeout'), 'Timeout'],
    ['gemini', new TypeError('Network unavailable'), 'Unavailable'],
  ];
  for (const [name, failure, expected] of cases) {
    const failed = await checkAiProvidersHealth([
      provider(name, async () => {
        throw failure;
      }),
    ]);
    assert.equal(failed.find((entry) => entry.provider === name)?.status, expected);
  }
});

test('health check timeout aborts the provider request', async () => {
  let observedSignal: AbortSignal | undefined;
  const results = await checkAiProvidersHealth([
    provider('gemini', (_payload, signal) => {
      observedSignal = signal;
      return new Promise(() => {});
    }),
  ], { timeoutMs: 5 });

  assert.equal(results[0].status, 'Timeout');
  assert.equal(observedSignal?.aborted, true);
});
