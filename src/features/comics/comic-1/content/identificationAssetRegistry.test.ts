import test from 'node:test';
import assert from 'node:assert/strict';
import { getComic1IdentificationAssetForObject } from './identificationAssetRegistry';

test('comic 1 identification assets resolve for all expected object names', () => {
  assert.ok(getComic1IdentificationAssetForObject('Balok'));
  assert.ok(getComic1IdentificationAssetForObject('Kubus'));
  assert.ok(getComic1IdentificationAssetForObject('Kerucut'));
  assert.ok(getComic1IdentificationAssetForObject('Prisma Segi Empat'));
  assert.ok(getComic1IdentificationAssetForObject('Limas Segi Empat'));
});
