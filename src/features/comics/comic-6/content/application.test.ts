import assert from 'node:assert/strict';
import test from 'node:test';

import { packageContent } from './packageContent';

test('Komik 6 application contains five everyday application activities', () => {
  const application = packageContent.application;
  const cards = application.cards ?? [];

  assert.equal(application.title, 'PENERAPAN');
  assert.equal(cards.length, 5);
  assert.deepEqual(cards.map((card) => card.correctAnswer), [
    'Kubus',
    'Balok',
    'Tabung',
    'Kerucut',
    'Kaleng',
  ]);
  assert.ok(cards.every((card) => card.options.length >= 4));
  assert.ok(cards.every((card) => card.explanation && card.hint && card.masjidContext));
  assert.ok(cards.every((card) => card.image === ''));
});

 test('Komik 6 application keeps the five learned shapes in its choices', () => {
  const cards = packageContent.application.cards ?? [];
  const choices = new Set(cards.flatMap((card) => card.options));

  for (const shape of ['Kubus', 'Balok', 'Tabung', 'Kerucut']) {
    assert.equal(choices.has(shape), true);
  }
});
