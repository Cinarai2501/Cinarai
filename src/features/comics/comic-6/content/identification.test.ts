import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import { packageContent } from './packageContent';
import { createIdentificationState, selectAnswer } from '@/features/learning-engine/stages/Identification/services/identificationService';

test('Komik 6 identification uses the five Masjid Al-Akbar solid shapes', () => {
  const question = packageContent.identification.questions[0];

  assert.ok(question);
  assert.deepEqual(question.options.map((option) => option.text), [
    'Kubus',
    'Balok',
    'Tabung',
    'Kerucut',
    'Setengah bola',
  ]);
  assert.ok(question.options.every((option) => option.correct));
  assert.match(question.question, /Masjid Al-Akbar/);
  assert.equal(packageContent.qrCode.length, 0);
  assert.equal(packageContent.model3D.length, 0);
  assert.ok(question.options.every((option) => option.example && option.properties?.length));
});

test('Komik 6 identification completes only after every shape is selected', () => {
  const state = createIdentificationState(packageContent.identification, {
    comicId: 6,
    lokasi: packageContent.metadata.location,
    cover: packageContent.metadata.cover,
    title: packageContent.metadata.title,
    comicSlug: 'komik-6',
  });
  const item = state.items[0];
  let next = state;

  for (const [index, option] of item.options.entries()) {
    next = selectAnswer(next, item.id, option.id);
    assert.equal(next.isComplete, index === item.options.length - 1);
  }
});

test('Komik 6 argumentation connects every object to its supporting characteristics', () => {
  const questions = packageContent.argumentation.questions;

  assert.deepEqual(questions.map((question) => question.shapeName), [
    'Tabung',
    'Kerucut',
    'Setengah bola',
    'Balok',
    'Kubus',
  ]);
  assert.deepEqual(questions.map((question) => question.characteristics?.filter((item) => item.correct).map((item) => item.id)), [
    ['a', 'b', 'c'],
    ['a', 'b', 'c'],
    ['a', 'b'],
    ['a', 'b', 'c', 'd'],
    ['a', 'b', 'c'],
  ]);
  assert.ok(questions.every((question) => question.argumentationAnswer && question.argumentationHint));
  assert.deepEqual(questions.map((question) => question.photoSrc), [
    path.join(process.cwd(), 'src', 'features', 'comics', 'comic-6', 'assets', 'argumentation', 'menaramasjid.png'),
    path.join(process.cwd(), 'src', 'features', 'comics', 'comic-6', 'assets', 'argumentation', 'kubahmasjid.png'),
    path.join(process.cwd(), 'src', 'features', 'comics', 'comic-6', 'assets', 'argumentation', 'kubahmasjid.png'),
    path.join(process.cwd(), 'src', 'features', 'comics', 'comic-6', 'assets', 'argumentation', 'ruangutama.png'),
    path.join(process.cwd(), 'src', 'features', 'comics', 'comic-6', 'assets', 'argumentation', 'tempatwudhu.png'),
  ]);
});