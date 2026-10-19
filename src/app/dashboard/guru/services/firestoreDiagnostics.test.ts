import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyFirestoreFailure,
  createFirestoreOperationFailure,
} from './firestoreDiagnostics';

test('classifies Firestore permission, index, network and other errors', () => {
  assert.equal(classifyFirestoreFailure('permission-denied', 'denied'), 'permission');
  assert.equal(classifyFirestoreFailure('failed-precondition', 'The query requires an index'), 'index');
  assert.equal(classifyFirestoreFailure('unavailable', 'offline'), 'network');
  assert.equal(classifyFirestoreFailure('internal', 'unexpected'), 'other');
});

test('operation failures include operation context and redact sensitive message values', () => {
  const failure = createFirestoreOperationFailure(
    {
      code: 'permission-denied',
      message: 'Denied for teacher@example.com at https://example.test and uid 1234567890123456789012345678',
    },
    'subscribeStudentProgress',
    'users/{uid}/progress',
    'useGuruDashboard'
  );

  assert.equal(failure.category, 'permission');
  assert.equal(failure.operation, 'subscribeStudentProgress');
  assert.equal(failure.path, 'users/{uid}/progress');
  assert.equal(failure.context, 'useGuruDashboard');
  assert.equal(failure.code, 'permission-denied');
  assert.doesNotMatch(failure.message, /teacher@example\.com|https:\/\/|1234567890123456789012345678/);
});
