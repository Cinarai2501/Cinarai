import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyFirestoreFailure,
  createFirestoreOperationFailure,
  logFirestoreOperationFailure,
} from './firestoreDiagnostics';

test('classifies Firestore permission, index, network and other errors', () => {
  assert.equal(classifyFirestoreFailure('permission-denied', 'denied'), 'permission');
  assert.equal(classifyFirestoreFailure('unauthenticated', 'unauthenticated'), 'permission');
  assert.equal(classifyFirestoreFailure('failed-precondition', 'The query requires an index'), 'index');
  assert.equal(classifyFirestoreFailure('unavailable', 'offline'), 'network');
  assert.equal(classifyFirestoreFailure('internal', 'unexpected'), 'other');
});

test('preserves distinct permission-denied and unauthenticated error codes', () => {
  const permissionFailure = createFirestoreOperationFailure(
    { code: 'permission-denied', message: 'denied' },
    'subscribeStudents',
    'users',
    'useGuruDashboard'
  );
  const unauthenticatedFailure = createFirestoreOperationFailure(
    { code: 'unauthenticated', message: 'unauthenticated' },
    'subscribeStudents',
    'users',
    'useGuruDashboard'
  );

  assert.equal(permissionFailure.code, 'permission-denied');
  assert.equal(unauthenticatedFailure.code, 'unauthenticated');
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
  assert.match(failure.timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  assert.doesNotMatch(failure.message, /teacher@example\.com|https:\/\/|1234567890123456789012345678/);
});

test('diagnostic logs preserve safe fields without logging the error message', () => {
  const failure = createFirestoreOperationFailure(
    {
      code: 'permission-denied',
      message: 'Denied for Student Name, student@example.com with token secret-token-value',
    },
    'subscribeStudentProgress',
    'users/{uid}/progress',
    'useGuruDashboard',
    'progress-random-correlation'
  );
  const originalError = console.error;
  let loggedValues: unknown[] = [];
  console.error = (...values: unknown[]) => {
    loggedValues = values;
  };

  try {
    logFirestoreOperationFailure(failure);
  } finally {
    console.error = originalError;
  }

  const serialized = JSON.stringify(loggedValues);
  assert.match(serialized, /permission-denied/);
  assert.match(serialized, /subscribeStudentProgress/);
  assert.match(serialized, /progress-random-correlation/);
  assert.match(serialized, /useGuruDashboard/);
  assert.match(serialized, /"category":"permission"/);
  assert.match(serialized, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
  assert.doesNotMatch(serialized, /Student Name|student@example\.com|secret-token-value/);
});

test('diagnostic creation does not throw for malformed Firestore errors', () => {
  const error = Object.defineProperty({}, 'code', {
    get() {
      throw new Error('unreadable');
    },
  });

  assert.doesNotThrow(() => createFirestoreOperationFailure(
    error,
    'subscribeStudents',
    'users',
    'useGuruDashboard'
  ));
  assert.doesNotThrow(() => createFirestoreOperationFailure(
    null,
    'subscribeComics',
    'comics',
    'useGuruDashboard'
  ));
});

test('diagnostic logging does not throw if the console logger fails', () => {
  const originalError = console.error;
  console.error = () => {
    throw new Error('console unavailable');
  };

  try {
    assert.doesNotThrow(() => logFirestoreOperationFailure(
      createFirestoreOperationFailure(
        { code: 'unauthenticated', message: 'Authentication required' },
        'subscribeStudents',
        'users',
        'useGuruDashboard'
      )
    ));
  } finally {
    console.error = originalError;
  }
});
