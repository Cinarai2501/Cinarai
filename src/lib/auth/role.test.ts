import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveUserRoleFromProfileAndClaims } from './role';

test('prefers a recognized role from the Firestore profile', () => {
  assert.equal(resolveUserRoleFromProfileAndClaims('teacher', 'student'), 'teacher');
  assert.equal(resolveUserRoleFromProfileAndClaims('student', undefined), 'student');
  assert.equal(resolveUserRoleFromProfileAndClaims('admin', undefined), 'admin');
});

test('supports a recognized Firebase custom claim when a legacy profile has no role', () => {
  assert.equal(resolveUserRoleFromProfileAndClaims(undefined, 'teacher'), 'teacher');
  assert.equal(resolveUserRoleFromProfileAndClaims(null, 'student'), 'student');
});

test('does not use claims to override invalid profile roles or grant missing roles', () => {
  assert.equal(resolveUserRoleFromProfileAndClaims('unknown', 'teacher'), null);
  assert.equal(resolveUserRoleFromProfileAndClaims(undefined, 'unknown'), null);
  assert.equal(resolveUserRoleFromProfileAndClaims(undefined, undefined), null);
});
