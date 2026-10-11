import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveUserRoleFromProfile } from './role';

test('resolves recognized roles from the Firestore profile', () => {
  assert.equal(resolveUserRoleFromProfile('teacher'), 'teacher');
  assert.equal(resolveUserRoleFromProfile('student'), 'student');
  assert.equal(resolveUserRoleFromProfile('admin'), 'admin');
});

test('does not grant a role when the Firestore profile role is missing or invalid', () => {
  assert.equal(resolveUserRoleFromProfile(undefined), null);
  assert.equal(resolveUserRoleFromProfile(null), null);
  assert.equal(resolveUserRoleFromProfile('unknown'), null);
});
