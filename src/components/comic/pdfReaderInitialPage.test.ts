import test from 'node:test';
import assert from 'node:assert/strict';
import { getPdfReaderInitialPage } from './pdfReaderInitialPage';

test('pdf reader always starts from page 1', () => {
  assert.equal(getPdfReaderInitialPage(10), 1);
  assert.equal(getPdfReaderInitialPage(999), 1);
  assert.equal(getPdfReaderInitialPage(null), 1);
  assert.equal(getPdfReaderInitialPage(undefined), 1);
});
