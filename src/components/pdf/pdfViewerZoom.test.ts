import test from 'node:test';
import assert from 'node:assert/strict';

import { clampZoom, DEFAULT_ZOOM, MAX_ZOOM, MIN_ZOOM, stepZoom } from './pdfViewerZoom';

test('clamps zoom to the supported range', () => {
  assert.equal(clampZoom(0.2), MIN_ZOOM);
  assert.equal(clampZoom(4), MAX_ZOOM);
});

test('moves through the requested zoom levels', () => {
  assert.equal(stepZoom(DEFAULT_ZOOM, -1), MIN_ZOOM);
  assert.equal(stepZoom(DEFAULT_ZOOM, 1), 1.25);
  assert.equal(stepZoom(2.75, 1), MAX_ZOOM);
  assert.equal(stepZoom(MAX_ZOOM, 1), MAX_ZOOM);
});