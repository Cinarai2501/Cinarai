import test from 'node:test';
import assert from 'node:assert/strict';
import { AiRouter, AiRouterError, AiRouterTimeoutError } from './router';
import { AiProviderError, createAiProviderHttpError } from './provider';
import type { AiProvider, AiRequestPayload, AiResponse } from './provider';

class StubProvider implements AiProvider {
  public readonly name: 'gemini' | 'groq' | 'openrouter' | 'openai';
  private readonly behavior: 'success' | 'quota' | 'timeout' | 'network' | 'rate-limit' | 'generic' | 'hang' | 'invalid-key' | 'server-error' | 'permission' | 'not-found';
  private readonly content: string;
  private readonly delayMs: number;
  private readonly onCall?: () => void;

  constructor(
    name: 'gemini' | 'groq' | 'openrouter' | 'openai',
    behavior: 'success' | 'quota' | 'timeout' | 'network' | 'rate-limit' | 'generic' | 'hang' | 'invalid-key' | 'server-error' | 'permission' | 'not-found',
    content = 'ok',
    delayMs = 0,
    onCall?: () => void,
  ) {
    this.name = name;
    this.behavior = behavior;
    this.content = content;
    this.delayMs = delayMs;
    this.onCall = onCall;
  }

  async generate(_payload: AiRequestPayload): Promise<AiResponse> {
    this.onCall?.();
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (this.behavior === 'success') {
      return { provider: this.name, content: this.content };
    }

    if (this.behavior === 'hang') {
      // Never resolves — simulates a provider that hangs indefinitely
      await new Promise<never>(() => {});
    }

    if (this.behavior === 'quota') {
      throw new AiProviderError('HTTP 429', 429, 60_000, 'quota_exhausted', undefined, 'INSUFFICIENT_QUOTA');
    }
    if (this.behavior === 'rate-limit') {
      throw new AiProviderError('HTTP 429', 429, 60_000, 'rate_limited', undefined, 'RATE_LIMIT_EXCEEDED');
    }
    if (this.behavior === 'timeout') throw new AiProviderError('Timeout', 503, undefined, 'timeout');
    if (this.behavior === 'network') throw new TypeError('Network unavailable');
    if (this.behavior === 'invalid-key') throw new AiProviderError('HTTP 401', 401);
    if (this.behavior === 'permission') throw new AiProviderError('HTTP 403', 403, undefined, 'permission');
    if (this.behavior === 'not-found') throw new AiProviderError('HTTP 404', 404, undefined, 'not_found');
    if (this.behavior === 'server-error') throw new AiProviderError('HTTP 503', 503);
    if (this.behavior === 'generic') throw new AiProviderError('Invalid provider response', undefined, undefined, 'provider');
    throw new Error(this.behavior);
  }
}

const silentLogger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

test('falls back to the next provider when the first one hits a retryable error', async () => {
  const diagnostics: unknown[] = [];
  const router = new AiRouter([
    new StubProvider('gemini', 'quota'),
    new StubProvider('groq', 'success', 'fallback ok'),
  ], {
    info: (...args: unknown[]) => diagnostics.push(args),
    warn: () => undefined,
    error: () => undefined,
  });

  const response = await router.generate({ prompt: 'Halo' });
  const diagnosticEntry = diagnostics.find((entry) =>
    Array.isArray(entry) && entry[0] === '[AI Router] Request diagnostics'
  ) as unknown[] | undefined;
  const details = diagnosticEntry?.[1] as Record<string, unknown> | undefined;

  assert.equal(response.provider, 'groq');
  assert.equal(response.content, 'fallback ok');
  assert.equal(response.fallbackUsed, true);
  assert.equal(details?.firstProviderAttempted, 'gemini');
  assert.equal(details?.successfulProvider, 'groq');
  assert.equal(details?.providerCountTried, 2);
  assert.deepEqual(details?.providerTransitions, [{
    from: 'gemini',
    to: 'groq',
    reason: 'HTTP 429 (quota exhausted)',
    failureCategory: 'quota_exhausted',
  }]);
});

test('permission and missing-model failures are classified and fall back without quota labels', async () => {
  for (const [failure, category] of [
    ['permission', 'permission', 403],
    ['not-found', 'not_found', 404],
  ] as const) {
    const diagnostics: unknown[] = [];
    const router = new AiRouter([
      new StubProvider('gemini', failure),
      new StubProvider('groq', 'success'),
    ], {
      info: (...args: unknown[]) => diagnostics.push(args),
      warn: () => undefined,
      error: () => undefined,
    });

    const response = await router.generate({ prompt: 'Halo' });
    const entry = diagnostics.find((item) =>
      Array.isArray(item) && item[0] === '[AI Router] Request diagnostics'
    ) as unknown[] | undefined;
    const summary = entry?.[1] as {
      previousProviderFailures?: Array<{ failureCategory?: string; reason?: string }>;
    } | undefined;

    assert.equal(response.provider, 'groq');
    assert.equal(summary?.previousProviderFailures?.[0]?.failureCategory, category);
    assert.match(summary?.previousProviderFailures?.[0]?.reason ?? '', new RegExp(`HTTP ${failure === 'permission' ? 403 : 404}`));
  }
});

test('skips providers that do not have an API key configured', () => {
  const previousEnv = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };

  process.env.GEMINI_API_KEY = 'gemini-key';
  delete process.env.GROQ_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.OPENAI_API_KEY;

  try {
    const router = AiRouter.createDefault();
    const providers = (router as unknown as { providers: AiProvider[] }).providers;

    assert.deepEqual(providers.map((provider) => provider.name), ['gemini']);
  } finally {
    Object.entries(previousEnv).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  }
});

test('createDefault uses the requested provider priority order', () => {
  const previousEnv = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };

  process.env.GEMINI_API_KEY = 'gemini-key';
  process.env.OPENAI_API_KEY = 'openai-key';
  process.env.GROQ_API_KEY = 'groq-key';
  process.env.OPENROUTER_API_KEY = 'openrouter-key';

  try {
    const router = AiRouter.createDefault();
    const providers = (router as unknown as { providers: AiProvider[] }).providers;

    assert.deepEqual(providers.map((provider) => provider.name), ['gemini', 'groq', 'openrouter', 'openai']);
  } finally {
    Object.entries(previousEnv).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  }
});

test('returns a friendly error when every provider fails', async () => {
  const router = new AiRouter([
    new StubProvider('gemini', 'timeout'),
    new StubProvider('groq', 'network'),
    new StubProvider('openrouter', 'rate-limit'),
    new StubProvider('openai', 'generic'),
  ]);

  await assert.rejects(
    () => router.generate({ prompt: 'Halo' }),
    (error: unknown) => {
      assert.ok(error instanceof AiRouterError);
      assert.match(error.message, /seluruh layanan ai sedang tidak tersedia/i);
      assert.equal(error.logs.length, 4);
      return true;
    },
  );
});

test('falls back to next provider when first provider times out', async () => {
  // Use a very short timeout so the test runs fast
  const SHORT_TIMEOUT = 80;
  const router = new AiRouter(
    [
      // hangs indefinitely — will be killed by timeout
      new StubProvider('gemini', 'hang'),
      new StubProvider('openai', 'success', 'fallback after timeout'),
    ],
    console,
    SHORT_TIMEOUT,
  );

  const response = await router.generate({ prompt: 'Halo' });

  assert.equal(response.provider, 'openai');
  assert.equal(response.content, 'fallback after timeout');
});

test('aborts the timed-out provider request before falling back', async () => {
  let observedSignal: AbortSignal | undefined;
  const slowProvider: AiProvider = {
    name: 'gemini',
    generate: (_payload: AiRequestPayload, signal?: AbortSignal) => {
      observedSignal = signal;
      return new Promise<AiResponse>(() => {});
    },
  };
  const router = new AiRouter(
    [slowProvider, new StubProvider('openai', 'success', 'fallback')],
    console,
    20,
  );

  const response = await router.generate({ prompt: 'Halo' });

  assert.equal(response.provider, 'openai');
  assert.equal(observedSignal?.aborted, true);
});

test('logs timeout with provider name, elapsed time, and reason', async () => {
  const SHORT_TIMEOUT = 80;
  const logs: Array<{ level: string; args: unknown[] }> = [];
  const mockLogger = {
    info:  (...args: unknown[]) => logs.push({ level: 'info',  args }),
    warn:  (...args: unknown[]) => logs.push({ level: 'warn',  args }),
    error: (...args: unknown[]) => logs.push({ level: 'error', args }),
  };

  const router = new AiRouter(
    [
      new StubProvider('gemini', 'hang'),
      new StubProvider('groq', 'success', 'ok'),
    ],
    mockLogger,
    SHORT_TIMEOUT,
  );

  await router.generate({ prompt: 'Halo' });

  const warnMessages = logs.filter((l) => l.level === 'warn').map((l) => String(l.args[0]));
  assert.ok(warnMessages.some((m) => m.includes('Timeout')), 'Expected a Timeout warn log');
  assert.ok(warnMessages.some((m) => m.includes('Gemini')), 'Expected provider name in warn log');
  assert.ok(warnMessages.some((m) => m.includes('Elapsed')), 'Expected elapsed time in warn log');
});

test('throws AiRouterError when all providers time out', async () => {
  const SHORT_TIMEOUT = 80;
  const router = new AiRouter(
    [
      new StubProvider('gemini',     'hang'),
      new StubProvider('openai',     'hang'),
      new StubProvider('groq',       'hang'),
      new StubProvider('openrouter', 'hang'),
    ],
    console,
    SHORT_TIMEOUT,
  );

  await assert.rejects(
    () => router.generate({ prompt: 'Halo' }),
    (error: unknown) => {
      assert.ok(error instanceof AiRouterError);
      assert.match(error.message, /seluruh layanan ai sedang tidak tersedia/i);
      assert.equal(error.logs.length, 4);
      assert.ok(
        error.logs.every((l) => l.reason?.startsWith('Timeout after')),
        'All log entries should have a Timeout reason',
      );
      return true;
    },
  );
});

test('enforces the global deadline and aborts the active slow request', async () => {
  let observedSignal: AbortSignal | undefined;
  const slowProvider: AiProvider = {
    name: 'gemini',
    generate: (_payload: AiRequestPayload, signal?: AbortSignal) => {
      observedSignal = signal;
      return new Promise<AiResponse>((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new Error('request aborted')), { once: true });
      });
    },
  };
  const router = new AiRouter(
    [slowProvider],
    console,
    500,
    80,
  );

  await assert.rejects(
    () => router.generate({ prompt: 'Halo' }),
    (error: unknown) => {
      assert.ok(error instanceof AiRouterTimeoutError);
      assert.ok(error instanceof AiRouterError);
      assert.match(error.message, /batas waktu keseluruhan/i);
      return true;
    },
  );
  assert.equal(observedSignal?.aborted, true);
});

test('does not abort a provider that succeeds before the global deadline', async () => {
  let observedSignal: AbortSignal | undefined;
  const slowSuccess: AiProvider = {
    name: 'gemini',
    generate: async (_payload: AiRequestPayload, signal?: AbortSignal) => {
      observedSignal = signal;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return { provider: 'gemini', content: 'success before deadline' };
    },
  };
  const response = await new AiRouter([slowSuccess], console, 500, 300).generate({ prompt: 'Halo' });

  assert.equal(response.content, 'success before deadline');
  assert.equal(observedSignal?.aborted, false);
});

test('returns a successful fallback completed before the shared deadline', async () => {
  const router = new AiRouter(
    [
      new StubProvider('gemini', 'quota'),
      new StubProvider('groq', 'success', 'fallback before deadline', 20),
    ],
    console,
    500,
    300,
  );

  const response = await router.generate({ prompt: 'Halo' });

  assert.equal(response.provider, 'groq');
  assert.equal(response.content, 'fallback before deadline');
});

test('a provider with one key remains compatible', async () => {
  const router = new AiRouter([new StubProvider('gemini', 'success', 'single key')], silentLogger);
  const response = await router.generate({ prompt: 'Halo' });

  assert.equal(response.provider, 'gemini');
  assert.equal(response.content, 'single key');
});

test('round robin rotates three keys for a provider', async () => {
  const usedKeys: number[] = [];
  const router = new AiRouter([
    new StubProvider('gemini', 'success', 'key 1', 0, () => usedKeys.push(1)),
    new StubProvider('gemini', 'success', 'key 2', 0, () => usedKeys.push(2)),
    new StubProvider('gemini', 'success', 'key 3', 0, () => usedKeys.push(3)),
  ], silentLogger);

  for (let request = 0; request < 6; request += 1) {
    await router.generate({ prompt: 'Halo' });
  }

  assert.deepEqual(usedKeys, [1, 2, 3, 1, 2, 3]);
});

test('a key rate limit immediately falls back to another key of the same provider', async () => {
  const attempts: number[] = [];
  const router = new AiRouter([
    new StubProvider('gemini', 'rate-limit', 'unused', 0, () => attempts.push(1)),
    new StubProvider('gemini', 'success', 'alternate key', 0, () => attempts.push(2)),
  ], silentLogger);

  const response = await router.generate({ prompt: 'Halo' });

  assert.equal(response.content, 'alternate key');
  assert.deepEqual(attempts, [1, 2]);
});

test('all failed Gemini keys fall back to Groq', async () => {
  const attempts: string[] = [];
  const router = new AiRouter([
    new StubProvider('gemini', 'rate-limit', 'unused', 0, () => attempts.push('gemini-1')),
    new StubProvider('gemini', 'invalid-key', 'unused', 0, () => attempts.push('gemini-2')),
    new StubProvider('groq', 'success', 'groq success', 0, () => attempts.push('groq')),
  ], silentLogger);

  const response = await router.generate({ prompt: 'Halo' });

  assert.equal(response.provider, 'groq');
  assert.deepEqual(attempts, ['gemini-1', 'gemini-2', 'groq']);
});

test('Gemini and Groq failures fall back to OpenRouter', async () => {
  const attempts: string[] = [];
  const router = new AiRouter([
    new StubProvider('gemini', 'rate-limit', 'unused', 0, () => attempts.push('gemini')),
    new StubProvider('groq', 'server-error', 'unused', 0, () => attempts.push('groq')),
    new StubProvider('openrouter', 'success', 'openrouter success', 0, () => attempts.push('openrouter')),
    new StubProvider('openai', 'success', 'must not run', 0, () => attempts.push('openai')),
  ], silentLogger);

  const response = await router.generate({ prompt: 'Halo' });

  assert.equal(response.provider, 'openrouter');
  assert.deepEqual(attempts, ['gemini', 'groq', 'openrouter']);
});

test('three provider failures fall back to OpenAI', async () => {
  const attempts: string[] = [];
  const router = new AiRouter([
    new StubProvider('openai', 'success', 'openai success', 0, () => attempts.push('openai')),
    new StubProvider('openrouter', 'server-error', 'unused', 0, () => attempts.push('openrouter')),
    new StubProvider('groq', 'rate-limit', 'unused', 0, () => attempts.push('groq')),
    new StubProvider('gemini', 'invalid-key', 'unused', 0, () => attempts.push('gemini')),
  ], silentLogger);

  const response = await router.generate({ prompt: 'Halo' });

  assert.equal(response.provider, 'openai');
  assert.deepEqual(attempts, ['gemini', 'groq', 'openrouter', 'openai']);
});

test('provider-level cooldown skips the provider and continues to the next provider', async () => {
  const attempts: string[] = [];
  const router = new AiRouter([
    new StubProvider('gemini', 'rate-limit', 'unused', 0, () => attempts.push('gemini')),
    new StubProvider('groq', 'success', 'groq success', 0, () => attempts.push('groq')),
  ], silentLogger);

  const firstResponse = await router.generate({ prompt: 'Halo' });
  const secondResponse = await router.generate({ prompt: 'Halo lagi' });

  assert.equal(firstResponse.provider, 'groq');
  assert.equal(secondResponse.provider, 'groq');
  assert.deepEqual(attempts, ['gemini', 'groq', 'groq']);
});

test('an invalid key is skipped and the next key succeeds', async () => {
  const attempts: number[] = [];
  const router = new AiRouter([
    new StubProvider('openai', 'invalid-key', 'unused', 0, () => attempts.push(1)),
    new StubProvider('openai', 'success', 'valid key', 0, () => attempts.push(2)),
  ], silentLogger);

  const response = await router.generate({ prompt: 'Halo' });

  assert.equal(response.content, 'valid key');
  assert.deepEqual(attempts, [1, 2]);
});

test('a timed-out key falls back to the next key within the request deadline', async () => {
  const attempts: number[] = [];
  const router = new AiRouter([
    new StubProvider('groq', 'hang', 'unused', 0, () => attempts.push(1)),
    new StubProvider('groq', 'success', 'after timeout', 0, () => attempts.push(2)),
  ], silentLogger, 20, 200);

  const response = await router.generate({ prompt: 'Halo' });

  assert.equal(response.content, 'after timeout');
  assert.deepEqual(attempts, [1, 2]);
});

test('all rate-limited keys are skipped until their retry time', async () => {
  let attempts = 0;
  const router = new AiRouter([
    new StubProvider('gemini', 'rate-limit', 'unused', 0, () => { attempts += 1; }),
    new StubProvider('gemini', 'rate-limit', 'unused', 0, () => { attempts += 1; }),
  ], silentLogger);

  await assert.rejects(() => router.generate({ prompt: 'Halo' }), (error: unknown) => {
    assert.ok(error instanceof AiRouterError);
    assert.match(error.logs[0]?.reason ?? '', /HTTP 429/);
    return true;
  });
  await assert.rejects(() => router.generate({ prompt: 'Halo' }));

  assert.equal(attempts, 2);
});

test('all invalid keys are not retried on later requests', async () => {
  let attempts = 0;
  const router = new AiRouter([
    new StubProvider('openai', 'invalid-key', 'unused', 0, () => { attempts += 1; }),
    new StubProvider('openai', 'invalid-key', 'unused', 0, () => { attempts += 1; }),
  ], silentLogger);

  await assert.rejects(() => router.generate({ prompt: 'Halo' }));
  await assert.rejects(() => router.generate({ prompt: 'Halo' }));

  assert.equal(attempts, 2);
});

test('a provider request never attempts the same key twice', async () => {
  const attempts: number[] = [];
  const router = new AiRouter([
    new StubProvider('openrouter', 'server-error', 'unused', 0, () => attempts.push(1)),
    new StubProvider('openrouter', 'rate-limit', 'unused', 0, () => attempts.push(2)),
    new StubProvider('openrouter', 'success', 'third key', 0, () => attempts.push(3)),
  ], silentLogger);

  const response = await router.generate({ prompt: 'Halo' });

  assert.equal(response.content, 'third key');
  assert.deepEqual(attempts, [1, 2, 3]);
  assert.equal(new Set(attempts).size, attempts.length);
});

test('concurrent requests rotate keys without corrupting the round-robin cursor', async () => {
  const attempts: number[] = [];
  const router = new AiRouter([
    new StubProvider('groq', 'success', 'key 1', 0, () => attempts.push(1)),
    new StubProvider('groq', 'success', 'key 2', 0, () => attempts.push(2)),
    new StubProvider('groq', 'success', 'key 3', 0, () => attempts.push(3)),
  ], silentLogger);

  await Promise.all(Array.from({ length: 12 }, () => router.generate({ prompt: 'Halo' })));

  assert.deepEqual(attempts.reduce((counts, key) => {
    counts[key - 1] += 1;
    return counts;
  }, [0, 0, 0]), [4, 4, 4]);
});

test('empty indexed keys are ignored and legacy API key config still works', () => {
  const envNames = ['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3'];
  const previous = new Map(envNames.map((name) => [name, process.env[name]]));
  try {
    process.env.GEMINI_API_KEY = '  ';
    process.env.GEMINI_API_KEY_2 = 'second-key';
    process.env.GEMINI_API_KEY_3 = '';
    const fromEnv = AiRouter.createDefault();
    assert.deepEqual(
      (fromEnv as unknown as { providers: AiProvider[] }).providers.map((provider) => provider.name),
      ['gemini'],
    );
    const fromLegacyConfig = AiRouter.createDefault({ gemini: { apiKey: 'legacy-key' } });
    assert.deepEqual(
      (fromLegacyConfig as unknown as { providers: AiProvider[] }).providers.map((provider) => provider.name),
      ['gemini'],
    );
  } finally {
    previous.forEach((value, name) => {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    });
  }
});

test('createDefault round-robin cursor survives router instances in the same runtime', async () => {
  const envNames = ['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3'];
  const previous = new Map(envNames.map((name) => [name, process.env[name]]));
  const originalFetch = global.fetch;
  const usedKeys: string[] = [];
  try {
    process.env.GEMINI_API_KEY = 'round-robin-runtime-key-one';
    process.env.GEMINI_API_KEY_2 = 'round-robin-runtime-key-two';
    delete process.env.GEMINI_API_KEY_3;
    global.fetch = async (_input, init) => {
      usedKeys.push(new Headers(init?.headers).get('x-goog-api-key') ?? '');
      return Response.json({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] });
    };

    await AiRouter.createDefault().generate({ prompt: 'Halo' });
    await AiRouter.createDefault().generate({ prompt: 'Halo' });

    assert.deepEqual(usedKeys, ['round-robin-runtime-key-one', 'round-robin-runtime-key-two']);
  } finally {
    global.fetch = originalFetch;
    previous.forEach((value, name) => {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    });
  }
});

test('invalid-key status survives router instances in the same runtime', async () => {
  const originalFetch = global.fetch;
  let attempts = 0;
  const configs = {
    gemini: { apiKeys: ['runtime-invalid-key-one', 'runtime-invalid-key-two'] },
    openai: { apiKeys: [] },
    groq: { apiKeys: [] },
    openrouter: { apiKeys: [] },
  };
  try {
    global.fetch = async () => {
      attempts += 1;
      return new Response('invalid key', { status: 401 });
    };

    await assert.rejects(() => AiRouter.createDefault(configs).generate({ prompt: 'Halo' }));
    await assert.rejects(() => AiRouter.createDefault(configs).generate({ prompt: 'Halo' }));

    assert.equal(attempts, 2);
  } finally {
    global.fetch = originalFetch;
  }
});

test('provider Retry-After headers are parsed without retaining response content', () => {
  const error = createAiProviderHttpError(new Response('sensitive provider body', {
    status: 429,
    headers: { 'Retry-After': '17' },
  }));

  assert.equal(error.statusCode, 429);
  assert.equal(error.retryAfterMs, 17_000);
  assert.doesNotMatch(error.message, /sensitive provider body/);
});

test('non-retryable prompt errors do not try other keys or providers', async () => {
  let attempts = 0;
  const router = new AiRouter([
    {
      name: 'gemini',
      generate: async () => {
        attempts += 1;
        throw new AiProviderError('HTTP 400', 400);
      },
    },
    new StubProvider('gemini', 'success', 'must not run', 0, () => { attempts += 1; }),
    new StubProvider('openai', 'success', 'must not run', 0, () => { attempts += 1; }),
  ], silentLogger);

  await assert.rejects(() => router.generate({ prompt: 'Halo' }));
  assert.equal(attempts, 1);
});

test('provider errors and router logs never include API key values or response bodies', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const secretKey = 'test-secret-key';
  const originalFetch = global.fetch;
  const originalWarn = console.warn;
  const originalError = console.error;
  const output: string[] = [];
  try {
    process.env.GEMINI_API_KEY = secretKey;
    global.fetch = async () => new Response(secretKey, { status: 401 });
    console.warn = (...args: unknown[]) => output.push(args.join(' '));
    console.error = (...args: unknown[]) => output.push(args.join(' '));
    const router = AiRouter.createDefault();

    await assert.rejects(() => router.generate({ prompt: 'Halo' }), (error: unknown) => {
      assert.ok(error instanceof AiRouterError);
      assert.doesNotMatch(error.message, new RegExp(secretKey));
      assert.doesNotMatch(JSON.stringify(error.logs), new RegExp(secretKey));
      return true;
    });
    assert.doesNotMatch(output.join(' '), new RegExp(secretKey));
  } finally {
    global.fetch = originalFetch;
    console.warn = originalWarn;
    console.error = originalError;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});
