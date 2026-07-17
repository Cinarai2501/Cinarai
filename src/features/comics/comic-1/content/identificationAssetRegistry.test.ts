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

test('comic 1 identification asset resolver returns correct asset filenames', () => {
  assert.match(getComic1IdentificationAssetForObject('Balok') ?? '', /Balok\.png$/);
  assert.match(getComic1IdentificationAssetForObject('Kubus') ?? '', /Kubus\.png$/);
  assert.match(getComic1IdentificationAssetForObject('Kerucut') ?? '', /Kerucut\.png$/);
  assert.match(getComic1IdentificationAssetForObject('Prisma Segi Empat') ?? '', /Prismasegiempat\.png$/);
  assert.match(getComic1IdentificationAssetForObject('Limas Segi Empat') ?? '', /Limassegiempat\.png$/);
});

test('comic 1 identification asset resolver is robust to case and whitespace', () => {
  assert.ok(getComic1IdentificationAssetForObject(' balok '));
  assert.ok(getComic1IdentificationAssetForObject('kubus'));
  assert.ok(getComic1IdentificationAssetForObject('KERUCUT'));
  assert.ok(getComic1IdentificationAssetForObject('Prisma Segi Empat'));
  assert.ok(getComic1IdentificationAssetForObject('Limas Segi Empat'));
});
