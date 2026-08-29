import test from 'node:test';
import assert from 'node:assert/strict';

import { getResponsivePageSize } from './pdfViewerLayout';

test('uses page aspect ratio instead of forcing full viewport height', () => {
  const result = getResponsivePageSize({
    pdfWidth: 800,
    pdfHeight: 1200,
    availableWidth: 360,
    availableHeight: 900,
  });

  assert.equal(result.width, 360);
  assert.equal(result.height, 540);
});

test('clamps to viewport height only when page would overflow the available space', () => {
  const result = getResponsivePageSize({
    pdfWidth: 800,
    pdfHeight: 1200,
    availableWidth: 500,
    availableHeight: 300,
  });

  assert.equal(result.width, 200);
  assert.equal(result.height, 300);
});
