import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePreviewImagePath } from './navigationStage.helpers';

test('returns known preview assets for common geometry titles', () => {
  assert.equal(resolvePreviewImagePath('Kubus'), '/images/navigation/kubus.svg');
  assert.equal(resolvePreviewImagePath('Balok'), '/images/navigation/balok.svg');
  assert.equal(resolvePreviewImagePath('Limas'), '/images/navigation/default.svg');
  assert.equal(resolvePreviewImagePath('Prisma'), '/images/navigation/default.svg');
  assert.equal(resolvePreviewImagePath('Kerucut'), '/images/navigation/kerucut.svg');
});

test('falls back to the default preview for unknown titles', () => {
  assert.equal(resolvePreviewImagePath('Objek Baru'), '/images/navigation/default.svg');
});
