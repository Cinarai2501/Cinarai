import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveIdentificationOptionAsset } from './optionAssetResolver';

test('comic 1 uses its own identification asset mapping for comic-specific labels', () => {
  const asset = resolveIdentificationOptionAsset(1, 'Balok', '/images/fallback.png');
  assert.ok(asset);
  assert.match(asset ?? '', /Balok\.png$/);
});

test('comic 2 uses its own identification asset mapping and does not fall back to comic 1 assets', () => {
  const asset = resolveIdentificationOptionAsset(2, 'Persegi', '/images/fallback.png');
  assert.ok(asset);
  assert.match(asset ?? '', /persegi\.svg$/);
});

test('comic 3 uses local identification icons for its shapes', () => {
  const asset = resolveIdentificationOptionAsset(3, 'Segitiga', '/comics/komik-3/question.png');
  assert.ok(asset);
  assert.match(asset ?? '', /segitiga\.svg$/);
});
