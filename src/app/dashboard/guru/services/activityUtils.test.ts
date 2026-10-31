import assert from 'node:assert/strict';
import test from 'node:test';
import { deduplicateActivitiesById } from './activityUtils';

test('deduplicates reflection results from userId and studentId queries by Firestore document ID', () => {
  const userIdQueryResult = {
    id: 'reflection:document-1',
    userId: 'student-uid',
    title: 'Refleksi Komik 1',
  };
  const studentIdQueryResult = {
    ...userIdQueryResult,
    studentId: 'student-uid',
  };

  assert.deepEqual(
    deduplicateActivitiesById([userIdQueryResult, studentIdQueryResult]),
    [userIdQueryResult]
  );
});
