import test from 'node:test';
import assert from 'node:assert/strict';
import { RESOLUTION_MISSIONS, getMissionHint, isCorrectSelection } from './resolutionStage.helpers';

test('resolution missions include five sequential numeracy missions', () => {
  assert.equal(RESOLUTION_MISSIONS.length, 5);
  assert.equal(RESOLUTION_MISSIONS[0].shape, 'Kubus');
  assert.equal(RESOLUTION_MISSIONS[4].shape, 'Bola');
});

test('correct selection is validated per mission', () => {
  assert.equal(isCorrectSelection(RESOLUTION_MISSIONS[0], 'C'), true);
  assert.equal(isCorrectSelection(RESOLUTION_MISSIONS[1], 'C'), true);
  assert.equal(isCorrectSelection(RESOLUTION_MISSIONS[2], 'B'), true);
  assert.equal(isCorrectSelection(RESOLUTION_MISSIONS[3], 'B'), true);
  assert.equal(isCorrectSelection(RESOLUTION_MISSIONS[4], 'A'), true);
});

test('hints are capped at three clues for each mission', () => {
  const hint3 = getMissionHint(RESOLUTION_MISSIONS[0], 2);
  const hint4 = getMissionHint(RESOLUTION_MISSIONS[0], 3);

  assert.match(hint3, /Volume/);
  assert.equal(hint4, 'Coba pelajari kembali rumus bangun ruang ini, lalu kirim jawaban lagi.');
});
