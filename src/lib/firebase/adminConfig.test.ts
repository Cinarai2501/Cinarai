import assert from 'node:assert/strict';
import test from 'node:test';
import { getFirebaseAdminConfig } from './adminConfig';

test('reports missing Firebase Admin configuration without throwing or exposing values', () => {
  const result = getFirebaseAdminConfig({});

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.error, /FIREBASE_PROJECT_ID/);
  assert.match(result.error, /FIREBASE_CLIENT_EMAIL/);
  assert.match(result.error, /FIREBASE_PRIVATE_KEY/);
});

test('reads credentials from the documented service-account JSON variable', () => {
  const result = getFirebaseAdminConfig({
    FIREBASE_ADMIN_SDK_KEY: JSON.stringify({
      project_id: 'test-project',
      client_email: 'service-account@example.invalid',
      private_key: 'test-private-key\\nline-two',
    }),
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.credentials, {
    projectId: 'test-project',
    clientEmail: 'service-account@example.invalid',
    privateKey: 'test-private-key\nline-two',
  });
});

test('does not expose malformed service-account values in diagnostics', () => {
  const result = getFirebaseAdminConfig({
    FIREBASE_ADMIN_SDK_KEY: 'private-value-not-json',
  });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.error, /FIREBASE_ADMIN_SDK_KEY/);
  assert.doesNotMatch(result.error, /private-value-not-json/);
});
