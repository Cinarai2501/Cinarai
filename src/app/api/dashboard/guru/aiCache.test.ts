import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getAiSourceFingerprint,
  getTeacherAiCacheDocumentId,
  readTeacherAiCacheSafely,
} from './aiCache';
import type { Firestore } from 'firebase-admin/firestore';

test('AI cache fingerprint ignores only generated timestamps', () => {
  const first = {
    generatedAt: '2026-10-30T12:00:00.000Z',
    summary: { studentCount: 2, averageProgress: 35 },
  };
  const second = {
    summary: { averageProgress: 35, studentCount: 2 },
    generatedAt: '2026-10-30T12:01:00.000Z',
  };
  const changedSource = {
    generatedAt: '2026-10-30T12:01:00.000Z',
    summary: { studentCount: 2, averageProgress: 36 },
  };

  assert.equal(getAiSourceFingerprint(first), getAiSourceFingerprint(second));
  assert.notEqual(getAiSourceFingerprint(first), getAiSourceFingerprint(changedSource));
});

test('class and individual AI results have separate cache identities', () => {
  assert.notEqual(
    getTeacherAiCacheDocumentId('class'),
    getTeacherAiCacheDocumentId('student', 'student-uid'),
  );
  assert.notEqual(
    getTeacherAiCacheDocumentId('student', 'student-one'),
    getTeacherAiCacheDocumentId('student', 'student-two'),
  );
});

test('raw progress, activity, assessment, and reflection edits invalidate the source fingerprint', () => {
  const sourceRecords: Array<{ path: string; data: Record<string, unknown> }> = [
    { path: 'users/student-1/progress/comic-1', data: { percentage: 0, stageData: { quiz: { score: 0 } } } },
    { path: 'activity/activity-1', data: { type: 'lesson_started', occurredAt: '2026-10-30T12:00:00.000Z' } },
    { path: 'identification_answers/answer-1', data: { selectedAnswer: 'A', correctAnswer: 'B' } },
    { path: 'reflection/reflection-1', data: { confidence: 3, submittedAt: '2026-10-30T12:00:00.000Z' } },
  ];
  const original = getAiSourceFingerprint({ facts: { summary: { studentCount: 1 } }, sources: sourceRecords });
  const edits: Array<{ path: string; data: Record<string, unknown> }> = [
    { ...sourceRecords[0], data: { ...sourceRecords[0].data, percentage: 10 } },
    { ...sourceRecords[1], data: { ...sourceRecords[1].data, occurredAt: '2026-10-30T12:01:00.000Z' } },
    { ...sourceRecords[2], data: { ...sourceRecords[2].data, selectedAnswer: 'B' } },
    { ...sourceRecords[3], data: { ...sourceRecords[3].data, confidence: 4 } },
  ];

  edits.forEach((editedRecord, index) => {
    const changedRecords = [...sourceRecords];
    changedRecords[index] = editedRecord;
    assert.notEqual(
      getAiSourceFingerprint({ facts: { summary: { studentCount: 1 } }, sources: changedRecords }),
      original,
    );
  });
});

test('cache read failures are surfaced to callers without aborting analysis', async () => {
  const firestore = {
    collection: () => {
      throw new Error('Firestore unavailable');
    },
  } as unknown as Firestore;

  const result = await readTeacherAiCacheSafely(firestore, 'teacher-uid', 'class', undefined, 'fingerprint');

  assert.equal(result.cache, null);
  assert.ok(result.error instanceof Error);
  assert.match(result.error.message, /Firestore unavailable/);
});
