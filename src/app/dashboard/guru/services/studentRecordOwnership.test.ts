import assert from 'node:assert/strict';
import test from 'node:test';
import { getStudentRecordOwner } from './studentRecordOwnership';

test('resolves both owner fields used by learning records', () => {
  assert.equal(getStudentRecordOwner({ userId: 'student-a' }), 'student-a');
  assert.equal(getStudentRecordOwner({ studentId: 'student-b' }), 'student-b');
  assert.equal(
    getStudentRecordOwner({ userId: ' student-c ', studentId: 'student-c' }),
    'student-c',
  );
});

test('rejects missing, conflicting, or out-of-roster owner identities', () => {
  assert.equal(getStudentRecordOwner({ uid: 'student-a' }), null);
  assert.equal(getStudentRecordOwner({ userId: 'student-a', studentId: 'student-b' }), null);
  assert.equal(getStudentRecordOwner({ userId: 'student-a' }, new Set(['student-b'])), null);
});
