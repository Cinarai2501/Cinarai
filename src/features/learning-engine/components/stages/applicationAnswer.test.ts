import test from 'node:test';
import assert from 'node:assert/strict';
import { Comic1Module } from '@/features/comics/comic-1';

test('comic 1 application does not configure an answer key', () => {
  const application = Comic1Module.application;
  assert.equal('correctAnswer' in application, false);
  assert.equal(application.options.length > 0, true);
});