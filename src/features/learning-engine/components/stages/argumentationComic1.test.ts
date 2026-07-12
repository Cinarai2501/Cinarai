import assert from 'node:assert/strict';
import test from 'node:test';

import { getComicModule } from '@/features/comics';

test('comic 1 argumentation content provides distinct visual references and labels per part', () => {
  const comicModule = getComicModule(1);
  const questions = comicModule.argumentation.questions;

  assert.ok(questions.length >= 4, 'Comic 1 should expose multiple argumentation questions');
  const uniquePhotos = new Set(questions.map((question) => question.photoSrc));
  assert.equal(uniquePhotos.size, questions.length, 'Each argumentation question should have a distinct photo reference');

  const parts = questions.map((question) => question.templePart);
  assert.ok(parts.includes('Bagian Tubuh'));
  assert.ok(parts.includes('Bagian Atap'));
  assert.ok(parts.includes('Bagian Pintu'));
  assert.ok(parts.includes('Bagian Tangga'));
});
