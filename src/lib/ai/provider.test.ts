import test from 'node:test';
import assert from 'node:assert/strict';
import { AiProviderError, createAiProviderHttpError } from './provider';
import { GeminiProvider } from './gemini';
import { GroqProvider } from './groq';
import { AiRouter } from './router';

test('HTTP error classification distinguishes quota exhaustion from rate limiting safely', () => {
  const quotaError = createAiProviderHttpError(
    new Response(JSON.stringify({
      error: {
        type: 'insufficient_quota',
        code: 'organization_spend_limit_exceeded',
        message: 'private error text',
      },
    }), { status: 429 }),
    JSON.stringify({
      error: {
        type: 'insufficient_quota',
        code: 'organization_spend_limit_exceeded',
        message: 'private error text',
      },
    }),
  );
  const rateLimitError = createAiProviderHttpError(
    new Response(JSON.stringify({
      error: { type: 'rate_limit_error', code: 'slow_down', message: 'private error text' },
    }), { status: 429 }),
    JSON.stringify({
      error: { type: 'rate_limit_error', code: 'slow_down', message: 'private error text' },
    }),
  );

  assert.equal(quotaError.failureType, 'quota_exhausted');
  assert.equal(quotaError.providerErrorCode, 'ORGANIZATION_SPEND_LIMIT_EXCEEDED');
  assert.equal(rateLimitError.failureType, 'rate_limited');
  assert.equal(rateLimitError.providerErrorCode, 'SLOW_DOWN');
  assert.doesNotMatch(JSON.stringify(quotaError), /private error text/);
});

test('HTTP status codes retain distinct key, permission, missing-model, and server meanings', () => {
  const cases: Array<[number, string]> = [
    [401, 'invalid_key'],
    [403, 'permission'],
    [404, 'not_found'],
    [500, 'provider'],
  ];

  for (const [status, expected] of cases) {
    const error = createAiProviderHttpError(new Response('secret body', { status }), 'secret body');
    assert.equal(error.failureType, expected);
    assert.match(error.message, new RegExp(`HTTP ${status}`));
    assert.doesNotMatch(JSON.stringify(error), /secret body/);
  }
});

test('Groq adapter uses the configured key as a Bearer credential without logging it', async () => {
  const originalFetch = global.fetch;
  const originalWarn = console.warn;
  const originalError = console.error;
  const secret = 'mock-groq-key';
  let observedAuthorization = '';
  const output: string[] = [];

  try {
    global.fetch = async (input, init) => {
      assert.equal(String(input), 'https://api.groq.com/openai/v1/chat/completions');
      observedAuthorization = new Headers(init?.headers).get('authorization') ?? '';
      return Response.json({ choices: [{ message: { content: 'ok' } }] });
    };
    console.warn = (...args: unknown[]) => output.push(args.join(' '));
    console.error = (...args: unknown[]) => output.push(args.join(' '));

    const response = await new GroqProvider({ apiKey: secret }).generate({ prompt: 'health' });

    assert.equal(response.content, 'ok');
    assert.equal(observedAuthorization, `Bearer ${secret}`);
    assert.doesNotMatch(output.join(' '), new RegExp(secret));
  } finally {
    global.fetch = originalFetch;
    console.warn = originalWarn;
    console.error = originalError;
  }
});

test('router maps GROQ_API_KEY to the Groq adapter and Bearer header', async () => {
  const originalFetch = global.fetch;
  const originalWarn = console.warn;
  const originalError = console.error;
  const previous = new Map<string, string>();
  const secret = 'mock-groq-environment-key';
  const environmentKeyNames = Object.keys(process.env).filter((name) =>
    /^(GEMINI|GROQ|OPENROUTER|OPENAI)_API_KEY(?:_\d+)?$/.test(name)
  );
  environmentKeyNames.forEach((name) => {
    const value = process.env[name];
    if (value !== undefined) previous.set(name, value);
    delete process.env[name];
  });
  let observedAuthorization = '';
  const output: string[] = [];

  try {
    process.env.GROQ_API_KEY = secret;
    global.fetch = async (_input, init) => {
      observedAuthorization = new Headers(init?.headers).get('authorization') ?? '';
      return Response.json({ choices: [{ message: { content: 'ok' } }] });
    };
    console.warn = (...args: unknown[]) => output.push(args.join(' '));
    console.error = (...args: unknown[]) => output.push(args.join(' '));

    const response = await AiRouter.createDefault().generate({ prompt: 'health' });

    assert.equal(response.provider, 'groq');
    assert.equal(observedAuthorization, `Bearer ${secret}`);
    assert.doesNotMatch(output.join(' '), new RegExp(secret));
  } finally {
    global.fetch = originalFetch;
    console.warn = originalWarn;
    console.error = originalError;
    delete process.env.GROQ_API_KEY;
    previous.forEach((value, name) => {
      process.env[name] = value;
    });
  }
});

test('Gemini adapter uses the supported generateContent endpoint and current model default', async () => {
  const originalFetch = global.fetch;
  const originalWarn = console.warn;
  const originalError = console.error;
  const secret = 'mock-gemini-key';
  let observedUrl = '';
  let observedApiKey = '';
  const requestBodies: Record<string, unknown>[] = [];
  const output: string[] = [];

  try {
    global.fetch = async (input, init) => {
      observedUrl = String(input);
      observedApiKey = new Headers(init?.headers).get('x-goog-api-key') ?? '';
      requestBodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      return Response.json({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] });
    };
    console.warn = (...args: unknown[]) => output.push(args.join(' '));
    console.error = (...args: unknown[]) => output.push(args.join(' '));

    await new GeminiProvider({ apiKey: secret }).generate({
      prompt: 'health',
      systemPrompt: 'Return OK.',
      maxTokens: 32,
      metadata: { aiHealthCheck: true },
    });
    await new GeminiProvider({ apiKey: secret }).generate({ prompt: 'normal request' });
    await new GeminiProvider({ apiKey: secret }).generate({
      prompt: 'tutor request',
      metadata: { aiThinkingLevel: 'MINIMAL' },
    });

    const url = new URL(observedUrl);
    assert.equal(url.origin, 'https://generativelanguage.googleapis.com');
    assert.equal(url.pathname, '/v1beta/models/gemini-3.6-flash:generateContent');
    assert.equal(url.searchParams.has('key'), false);
    assert.equal(observedApiKey, secret);
    const healthConfig = requestBodies[0].generationConfig as {
      maxOutputTokens?: number;
      thinkingConfig?: { thinkingLevel?: string };
    };
    const normalConfig = requestBodies[1].generationConfig as {
      thinkingConfig?: { thinkingLevel?: string };
    };
    const tutorConfig = requestBodies[2].generationConfig as {
      thinkingConfig?: { thinkingLevel?: string };
    };
    assert.equal(healthConfig.maxOutputTokens,
      32,
    );
    assert.equal(healthConfig.thinkingConfig?.thinkingLevel, 'MINIMAL');
    assert.equal(normalConfig.thinkingConfig?.thinkingLevel, 'LOW');
    assert.equal(tutorConfig.thinkingConfig?.thinkingLevel, 'MINIMAL');
    assert.deepEqual(requestBodies[0].systemInstruction, { parts: [{ text: 'Return OK.' }] });
    assert.doesNotMatch(output.join(' '), new RegExp(secret));
  } finally {
    global.fetch = originalFetch;
    console.warn = originalWarn;
    console.error = originalError;
  }
});

test('Gemini marks MAX_TOKENS output as a retryable failure instead of returning a truncated answer', async () => {
  const originalFetch = global.fetch;
  const originalWarn = console.warn;
  const originalError = console.error;

  try {
    global.fetch = async () => Response.json({
      candidates: [{
        finishReason: 'MAX_TOKENS',
        content: { parts: [{ text: 'Jawaban yang belum selesai' }] },
      }],
    });
    console.warn = () => undefined;
    console.error = () => undefined;

    await assert.rejects(
      () => new GeminiProvider({ apiKey: 'mock-key' }).generate({ prompt: 'prompt' }),
      (error: unknown) => {
        assert.ok(error instanceof AiProviderError);
        assert.equal(error.providerErrorCode, 'MAX_TOKENS');
        assert.equal(error.failureType, 'provider');
        return true;
      },
    );
  } finally {
    global.fetch = originalFetch;
    console.warn = originalWarn;
    console.error = originalError;
  }
});

test('router-facing provider errors never expose raw bodies', () => {
  const secretBody = 'credential rejected for internal reason';
  const error = createAiProviderHttpError(
    new Response(JSON.stringify({ error: { message: secretBody, code: 'invalid_api_key' } }), { status: 401 }),
    JSON.stringify({ error: { message: secretBody, code: 'invalid_api_key' } }),
  );

  assert.ok(error instanceof AiProviderError);
  assert.equal(error.failureType, 'invalid_key');
  assert.doesNotMatch(error.message, /credential rejected/);
  assert.doesNotMatch(JSON.stringify(error), /credential rejected/);
});
