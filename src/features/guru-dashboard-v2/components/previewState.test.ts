import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getStudentOwnedState,
  resolveGuruPreviewAccess,
} from './previewState';

test('does not authorize an unauthenticated user or turn auth failure into an empty list state', () => {
  assert.deepEqual(resolveGuruPreviewAccess({
    loading: false,
    uid: null,
    role: null,
    error: null,
  }), {
    status: 'unauthenticated',
    message: 'Silakan masuk dengan akun guru untuk membuka preview.',
  });
  assert.deepEqual(resolveGuruPreviewAccess({
    loading: false,
    uid: null,
    role: null,
    error: 'Profil akun gagal dibaca.',
  }), {
    status: 'unauthenticated',
    message: 'Profil akun gagal dibaca.',
  });
});

test('allows only an authenticated teacher through the preview access gate', () => {
  assert.deepEqual(resolveGuruPreviewAccess({
    loading: true,
    uid: null,
    role: null,
    error: null,
  }), { status: 'loading' });
  assert.equal(resolveGuruPreviewAccess({
    loading: false,
    uid: 'student-1',
    role: 'student',
    error: null,
  }).status, 'forbidden');
  assert.deepEqual(resolveGuruPreviewAccess({
    loading: false,
    uid: 'teacher-1',
    role: 'teacher',
    error: null,
  }), { status: 'authorized', uid: 'teacher-1' });
});

test('hides student A detail while student B is selected and while logout has no selection', () => {
  type Detail = { authUid: string | null; uid: string | null; loading: boolean; value: string | null };
  const detailA: Detail = { authUid: 'teacher-1', uid: 'student-a', loading: false, value: 'private-A' };
  const empty: Detail = { authUid: null, uid: null, loading: false, value: null };

  assert.deepEqual(getStudentOwnedState('teacher-1', 'student-b', detailA, empty), {
    authUid: 'teacher-1',
    uid: 'student-b',
    loading: true,
    value: null,
  });
  assert.deepEqual(getStudentOwnedState('teacher-1', null, detailA, empty), empty);
  assert.deepEqual(getStudentOwnedState(null, 'student-a', detailA, empty), empty);
  assert.deepEqual(getStudentOwnedState('teacher-2', 'student-a', detailA, empty), {
    authUid: 'teacher-2',
    uid: 'student-a',
    loading: true,
    value: null,
  });
  assert.deepEqual(getStudentOwnedState('teacher-1', 'student-a', detailA, empty), detailA);
});
