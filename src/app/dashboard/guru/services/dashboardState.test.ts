import assert from 'node:assert/strict';
import test from 'node:test';
import {
  completeDashboardRequest,
  DashboardFirestoreQueryError,
  failDashboardRequest,
  getDashboardDataState,
  getDashboardResponseError,
  getDashboardServerFailure,
  type DashboardRequestState,
} from './dashboardState';

interface TestDashboardState extends DashboardRequestState {
  students: string[];
}

function createState(students: string[] = []): TestDashboardState {
  return {
    students,
    loading: true,
    recentActivityLoading: true,
    error: null,
    errorKind: null,
    dataState: 'loading',
    hasLoaded: false,
  };
}

test('successful roster query with students is available', () => {
  assert.equal(getDashboardDataState(2, 0), 'insufficient_data');
  assert.equal(getDashboardDataState(2, 1), 'available');
});

test('successful roster query without students is empty', () => {
  assert.equal(getDashboardDataState(0, 0), 'empty');
});

test('Firestore query failure is classified without exposing provider details', () => {
  const firestoreFailure = getDashboardServerFailure(new DashboardFirestoreQueryError());
  assert.equal(firestoreFailure.status, 503);
  assert.equal(firestoreFailure.kind, 'firestore_error');
  assert.doesNotMatch(firestoreFailure.message, /provider|endpoint/i);

  const mappedError = getDashboardResponseError(503, {
    code: 'firestore_error',
    error: 'Data dashboard belum dapat diambil dari Firestore. Silakan coba lagi.',
  });
  assert.equal(mappedError.kind, 'firestore_error');
  assert.doesNotMatch(mappedError.message, /private firestore endpoint/);
});

test('invalid authentication token is classified as authentication error', () => {
  const error = getDashboardResponseError(401, { code: 'authentication_error' });
  assert.equal(error.kind, 'authentication_error');
});

test('HTTP 500 response is classified as API error', () => {
  const error = getDashboardResponseError(500, { error: 'Dashboard gagal memuat data.' });
  assert.equal(error.kind, 'api_error');
});

test('successful retry clears the previous error and marks data loaded', () => {
  const failed = failDashboardRequest(createState(), {
    kind: 'firestore_error',
    message: 'Firestore tidak tersedia.',
  });
  const retried = completeDashboardRequest({
    ...failed,
    students: ['student-uid'],
  }, 'available');

  assert.equal(retried.loading, false);
  assert.equal(retried.error, null);
  assert.equal(retried.errorKind, null);
  assert.equal(retried.hasLoaded, true);
  assert.equal(retried.dataState, 'available');
});

test('failed refresh preserves the previously loaded roster', () => {
  const loaded = completeDashboardRequest({
    ...createState(),
    students: ['student-uid'],
  }, 'available');
  const refreshing = { ...loaded, loading: true, error: null, errorKind: null };
  const failedRefresh = failDashboardRequest(refreshing, {
    kind: 'firestore_error',
    message: 'Firestore tidak tersedia.',
  });

  assert.deepEqual(failedRefresh.students, ['student-uid']);
  assert.equal(failedRefresh.hasLoaded, true);
  assert.equal(failedRefresh.loading, false);
  assert.equal(failedRefresh.errorKind, 'firestore_error');
});
