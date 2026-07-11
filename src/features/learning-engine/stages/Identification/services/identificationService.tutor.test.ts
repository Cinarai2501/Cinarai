import assert from 'node:assert/strict';
import test from 'node:test';
import { buildIdentificationTutorExplanations } from './identificationService';

test('returns no tutor cards when no shapes are selected', () => {
  assert.deepEqual(buildIdentificationTutorExplanations([]), []);
});

test('includes formula and geometry details for each selected shape', () => {
  const cards = buildIdentificationTutorExplanations(['Kubus', 'Balok']);

  assert.equal(cards.length, 2);
  assert.equal(cards[0].surfaceFormula, '6s²');
  assert.equal(cards[0].volumeFormula, 's³');
  assert.equal(cards[1].surfaceFormula, '2(pl + pt + lt)');
  assert.equal(cards[1].volumeFormula, 'p × l × t');
});
