import test from 'node:test';
import assert from 'node:assert/strict';
import { getTimestampVersion, versionImageUrl } from './imageUrl';

test('versionImageUrl adds a stable version without replacing existing query parameters', () => {
  assert.equal(versionImageUrl('/images/cover.png', '2026-08-28'), '/images/cover.png?v=2026-08-28');
  assert.equal(versionImageUrl('https://storage.example/cover.png?token=abc', 42), 'https://storage.example/cover.png?token=abc&v=42');
  assert.equal(versionImageUrl('/images/cover.png'), '/images/cover.png');
});

test('getTimestampVersion supports Firestore-like timestamps and ISO values', () => {
  assert.equal(getTimestampVersion({ seconds: 1700000000, nanoseconds: 500000000 }), 1700000000500);
  assert.equal(getTimestampVersion('2026-08-28T00:00:00.000Z'), Date.parse('2026-08-28T00:00:00.000Z'));
  assert.equal(getTimestampVersion({}), null);
});
