import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReflectionDocumentPayload, saveReflection, type ReflectionDependencies } from './reflection';

const serverTimestampCalls: Array<{ caller: string }> = [];
const mergeFirestoreDocumentCalls: Array<{ collection: string; docId: string; payload: Record<string, unknown> }> = [];

const mockServerTimestamp = () => {
  serverTimestampCalls.push({ caller: 'serverTimestamp' });
  return { __type: 'serverTimestamp' };
};

const createDeps = (overrides: Partial<ReflectionDependencies> = {}): ReflectionDependencies => {
  const getFirestoreDocument = overrides.getFirestoreDocument ?? (async () => null);
  const mergeFirestoreDocument = overrides.mergeFirestoreDocument ?? (async () => undefined);

  return {
    getCurrentUser: overrides.getCurrentUser ?? (() => ({ uid: 'user-123' })),
    getFirestoreDocument,
    mergeFirestoreDocument: async (collection, docId, payload) => {
      mergeFirestoreDocumentCalls.push({ collection, docId, payload });
      await mergeFirestoreDocument(collection, docId, payload);
    },
    serverTimestamp: overrides.serverTimestamp ?? mockServerTimestamp,
  };
};

test('buildReflectionDocumentPayload includes the aliases expected by the app and rules', () => {
  const payload = buildReflectionDocumentPayload({
    userId: 'user-123',
    comicId: 2,
    checklist: ['Saya paham'],
    confidence: 4,
    reflectionText: 'Saya belajar banyak hari ini.',
    stage: 'introspection',
  });

  assert.equal(payload.userId, 'user-123');
  assert.equal(payload.studentId, 'user-123');
  assert.equal(payload.moduleId, '2');
  assert.equal(payload.comicId, '2');
  assert.equal(payload.reflectionText, 'Saya belajar banyak hari ini.');
  assert.deepEqual(payload.checklist, ['Saya paham']);
  assert.equal(payload.stage, 'introspection');
  assert.equal(payload.status, 'completed');
  assert.deepEqual(payload.selectedChecklist, ['Saya paham']);
});

test('saveReflection writes a reflection payload when data is valid', async () => {
  mergeFirestoreDocumentCalls.length = 0;
  serverTimestampCalls.length = 0;

  await saveReflection({
    userId: 'user-123',
    comicId: 2,
    checklist: ['Saya paham'],
    confidence: 4,
    reflectionText: 'Saya belajar banyak hari ini dan merasa lebih siap.',
    stage: 'introspection',
  }, createDeps());

  assert.equal(mergeFirestoreDocumentCalls.length, 1);
  assert.equal(mergeFirestoreDocumentCalls[0]?.collection, 'reflection');
  assert.equal(mergeFirestoreDocumentCalls[0]?.docId, 'user-123_2_introspection');
  assert.equal(mergeFirestoreDocumentCalls[0]?.payload.userId, 'user-123');
  assert.equal(mergeFirestoreDocumentCalls[0]?.payload.studentId, 'user-123');
  assert.equal(mergeFirestoreDocumentCalls[0]?.payload.reflectionText, 'Saya belajar banyak hari ini dan merasa lebih siap.');
  assert.equal(mergeFirestoreDocumentCalls[0]?.payload.status, 'completed');
  assert.deepEqual(mergeFirestoreDocumentCalls[0]?.payload.checklist, ['Saya paham']);
  assert.deepEqual(mergeFirestoreDocumentCalls[0]?.payload.selectedChecklist, ['Saya paham']);
  assert.equal(serverTimestampCalls.length, 3);
});

test('saveReflection throws for invalid user', async () => {
  mergeFirestoreDocumentCalls.length = 0;
  await assert.rejects(
    () => saveReflection({
      userId: '',
      comicId: 2,
      checklist: ['Saya paham'],
      confidence: 4,
      reflectionText: 'Saya belajar banyak hari ini dan merasa lebih siap.',
      stage: 'introspection',
    }, createDeps({ getCurrentUser: () => null })),
    /Invalid user/
  );
  assert.equal(mergeFirestoreDocumentCalls.length, 0);
});

test('saveReflection throws for invalid reflection', async () => {
  mergeFirestoreDocumentCalls.length = 0;
  await assert.rejects(
    () => saveReflection({
      userId: 'user-123',
      comicId: 2,
      checklist: ['Saya paham'],
      confidence: 4,
      reflectionText: 'Singkat',
      stage: 'introspection',
    }, createDeps()),
    /Invalid reflection/
  );
  assert.equal(mergeFirestoreDocumentCalls.length, 0);
});

test('saveReflection throws for duplicate submissions', async () => {
  mergeFirestoreDocumentCalls.length = 0;
  const duplicateDeps = createDeps({
    getFirestoreDocument: async () => ({ id: 'existing' }),
  });

  await assert.rejects(
    () => saveReflection({
      userId: 'user-123',
      comicId: 2,
      checklist: ['Saya paham'],
      confidence: 4,
      reflectionText: 'Saya belajar banyak hari ini dan merasa lebih siap.',
      stage: 'introspection',
    }, duplicateDeps),
    /Duplicate reflection submission/
  );
  assert.equal(mergeFirestoreDocumentCalls.length, 0);
});
