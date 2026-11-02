import assert from 'node:assert/strict';
import test from 'node:test';
import { handleAiChatRequest } from './chatEndpoint';
import { resolveAiRequestAccess } from './requestAccess';

const requestBody = JSON.stringify({
  question: 'Apa itu kubus?',
  context: {
    moduleName: 'CINARAI',
    identification: [],
    objectInfo: { location: 'Materi', classLevel: 'SD', synopsis: 'Belajar bangun ruang', learningTargets: ['Geometri'] },
    observationAnswers: {},
    sessionHistory: [],
  },
});

function request(body = requestBody, headers: HeadersInit = { 'content-type': 'application/json' }) {
  return new Request('https://cinarai.test/api/ai/chat', { method: 'POST', headers, body });
}

test('AI Tutor handler rejects missing, invalid, and expired tokens before provider use', async () => {
  for (const authorization of [null, 'Bearer invalid-token', 'Bearer expired-token']) {
    let providerCalled = false;
    const result = await handleAiChatRequest(
      request(requestBody, {
        'content-type': 'application/json',
        ...(authorization ? { authorization } : {}),
      }),
      {
        authorize: (incoming) => resolveAiRequestAccess(
          incoming.headers.get('authorization'),
          ['student'],
          {
            verifyIdToken: async (token) => {
              if (token !== 'valid-token') throw new Error('invalid or expired');
              return { uid: 'student-uid' };
            },
            getRole: async () => 'student',
          },
        ),
        checkRateLimit: async () => ({ ok: true }),
        generate: async () => {
          providerCalled = true;
          return { answer: 'jawaban', provider: 'gemini' };
        },
      },
    );
    assert.equal(result.status, 401);
    assert.equal(providerCalled, false);
  }
});

test('AI Tutor handler rejects oversized body and overlong question without consuming quota', async () => {
  let quotaCalled = false;
  const dependencies = {
    authorize: async () => ({ ok: true as const, uid: 'student-uid' }),
    checkRateLimit: async () => {
      quotaCalled = true;
      return { ok: true as const };
    },
    generate: async () => ({ answer: 'jawaban', provider: 'gemini' }),
  };
  const oversized = await handleAiChatRequest(request('x'.repeat(16_385)), dependencies);
  const longQuestion = await handleAiChatRequest(request(JSON.stringify({
    question: 'x'.repeat(1_001),
    context: {},
  })), dependencies);

  assert.equal(oversized.status, 413);
  assert.equal(longQuestion.status, 400);
  assert.equal(quotaCalled, false);
});

test('AI Tutor handler rejects another student UID and applies a server-side repeat-request limit', async () => {
  let providerCalled = false;
  const forgedUid = await handleAiChatRequest(request(JSON.stringify({
    question: 'Apa itu kubus?',
    studentUid: 'another-student',
    context: {},
  })), {
    authorize: async () => ({ ok: true, uid: 'verified-student' }),
    checkRateLimit: async () => ({ ok: true }),
    generate: async () => {
      providerCalled = true;
      return { answer: 'tidak boleh', provider: 'gemini' };
    },
  });
  assert.equal(forgedUid.status, 400);
  assert.equal(providerCalled, false);

  const limited = await handleAiChatRequest(request(requestBody), {
    authorize: async () => ({ ok: true, uid: 'verified-student' }),
    checkRateLimit: async () => ({
      ok: false,
      status: 429,
      error: 'Batas permintaan AI internal tercapai.',
      retryAfterSeconds: 30,
    }),
    generate: async () => {
      providerCalled = true;
      return { answer: 'tidak boleh', provider: 'gemini' };
    },
  });
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('retry-after'), '30');
  assert.equal(providerCalled, false);
});

test('valid authenticated AI Tutor request gets a provider response using the verified UID', async () => {
  let quotaUid = '';
  let generatedContext = '';
  const result = await handleAiChatRequest(request(requestBody, {
    'content-type': 'application/json',
    authorization: 'Bearer valid-token',
  }), {
    authorize: (incoming) => resolveAiRequestAccess(
      incoming.headers.get('authorization'),
      ['student'],
      {
        verifyIdToken: async () => ({ uid: 'verified-student' }),
        getRole: async (uid) => uid === 'verified-student' ? 'student' : 'teacher',
      },
    ),
    checkRateLimit: async (uid) => {
      quotaUid = uid;
      return { ok: true };
    },
    generate: async (context) => {
      generatedContext = context.question;
      return { answer: 'Jawaban bertahap', provider: 'gemini' };
    },
  });

  assert.equal(result.status, 200);
  assert.equal(quotaUid, 'verified-student');
  assert.equal(generatedContext, 'Apa itu kubus?');
  assert.deepEqual(await result.json(), { answer: 'Jawaban bertahap', provider: 'gemini' });
});
