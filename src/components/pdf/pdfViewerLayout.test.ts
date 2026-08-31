import test from 'node:test';
import assert from 'node:assert/strict';

import { getResponsivePageSize } from './pdfViewerLayout';

test('uses near-full mobile width while preserving aspect ratio', () => {
  const result = getResponsivePageSize({
    pdfWidth: 800,
    pdfHeight: 1200,
    availableWidth: 360,
    availableHeight: 900,
  });

  assert.ok(Math.abs(result.width - 360) <= 2, `expected width near 360, got ${result.width}`);
  assert.equal(result.height, 540);
});

test('uses aspect ratio to keep the page from overflowing the available height', () => {
  const result = getResponsivePageSize({
    pdfWidth: 800,
    pdfHeight: 1200,
    availableWidth: 500,
    availableHeight: 300,
  });

  assert.equal(result.width, 200);
  assert.equal(result.height, 300);
});

test('keeps the page width dominant on portrait layouts without extra whitespace math', () => {
  const result = getResponsivePageSize({
    pdfWidth: 900,
    pdfHeight: 1350,
    availableWidth: 380,
    availableHeight: 760,
  });

  assert.ok(result.width >= 360 && result.width <= 380, `expected portrait width to stay near available width, got ${result.width}`);
  assert.equal(result.height, 570);
});

test('keeps portrait sizing driven by width instead of viewport height', () => {
  const result = getResponsivePageSize({
    pdfWidth: 800,
    pdfHeight: 1200,
    availableWidth: 360,
    availableHeight: 600,
  });

  assert.ok(Math.abs(result.width - 360) <= 2, `expected width to track available width, got ${result.width}`);
  assert.equal(result.height, 540);
  assert.ok(result.height > 360, 'expected portrait pages to keep native aspect ratio instead of shrinking to fit viewport height');
});

test('keeps mobile portrait page width near the usable viewport width instead of collapsing to ~300px', () => {
  const result = getResponsivePageSize({
    pdfWidth: 800,
    pdfHeight: 1200,
    availableWidth: 390,
    availableHeight: 760,
  });

  assert.ok(result.width > 350, `expected a wide mobile portrait page, got ${result.width}`);
  assert.ok(result.width <= 390, `expected width to stay within the mobile viewport, got ${result.width}`);
  assert.equal(result.height, 585);
});
