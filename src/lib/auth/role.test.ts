import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveUserRoleFromProfileAndClaims } from './role';

test('prefers a recognized role from the Firestore profile', () => {
  assert.equal(resolveUserRoleFromProfileAndClaims('teacher', 'student'), 'teacher');
  assert.equal(resolveUserRoleFromProfileAndClaims('student', undefined), 'student');
  assert.equal(resolveUserRoleFromProfileAndClaims('admin', undefined), 'admin');
});

test('allows the student claim for a legacy profile with no role', () => {
  assert.equal(resolveUserRoleFromProfileAndClaims(null, 'student'), 'student');
});

test('does not grant teacher or admin access from a custom claim without a profile', () => {
  assert.equal(resolveUserRoleFromProfileAndClaims(undefined, 'teacher'), null);
  assert.equal(resolveUserRoleFromProfileAndClaims(undefined, 'admin'), null);
});

test('does not use claims to override invalid profile roles or grant unknown roles', () => {
  assert.equal(resolveUserRoleFromProfileAndClaims('unknown', 'teacher'), null);
  assert.equal(resolveUserRoleFromProfileAndClaims(undefined, 'unknown'), null);
  assert.equal(resolveUserRoleFromProfileAndClaims(undefined, undefined), null);
});
