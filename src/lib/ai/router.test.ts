import test from 'node:test';
import assert from 'node:assert/strict';
import { AiRouter, AiRouterError, AiRouterTimeoutError } from './router';
import type { AiProvider, AiRequestPayload, AiResponse } from './provider';

class StubProvider implements AiProvider {
  public readonly name: 'gemini' | 'groq' | 'openrouter' | 'openai';
  private readonly behavior: 'success' | 'quota' | 'timeout' | 'network' | 'rate-limit' | 'generic' | 'hang';
  private readonly content: string;
  private readonly delayMs: number;

  constructor(
    name: 'gemini' | 'groq' | 'openrouter' | 'openai',
    behavior: 'success' | 'quota' | 'timeout' | 'network' | 'rate-limit' | 'generic' | 'hang',
    content = 'ok',
    delayMs = 0,
  ) {
    this.name = name;
    this.behavior = behavior;
    this.content = content;
    this.delayMs = delayMs;
  }

  async generate(_payload: AiRequestPayload): Promise<AiResponse> {
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

    throw new Error(this.behavior);
  }
}

test('falls back to the next provider when the first one hits a retryable error', async () => {
  const router = new AiRouter([
    new StubProvider('gemini', 'quota'),
    new StubProvider('groq', 'success', 'fallback ok'),
  ]);

  const response = await router.generate({ prompt: 'Halo' });

  assert.equal(response.provider, 'groq');
  assert.equal(response.content, 'fallback ok');
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

    assert.deepEqual(providers.map((provider) => provider.name), ['gemini', 'openai', 'groq', 'openrouter']);
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

test('enforces one global deadline across providers and aborts the active slow request', async () => {
  let observedSignal: AbortSignal | undefined;
  let fallbackCalled = false;
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
    [
      slowProvider,
      {
        name: 'openai',
        generate: async () => {
          fallbackCalled = true;
          return { provider: 'openai', content: 'late fallback' };
        },
      },
    ],
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
  assert.equal(fallbackCalled, false);
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
