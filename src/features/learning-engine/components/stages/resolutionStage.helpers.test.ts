import test from 'node:test';
import assert from 'node:assert/strict';
import { RESOLUTION_MISSIONS, buildResolutionTutorExplanation, getMissionHint, getResolutionMissions, isCorrectSelection } from './resolutionStage.helpers';

test('resolution missions include five sequential numeracy missions', () => {
  assert.equal(RESOLUTION_MISSIONS.length, 5);
  assert.equal(RESOLUTION_MISSIONS[0].shape, 'Kubus');
  assert.equal(RESOLUTION_MISSIONS[4].shape, 'Kerucut');
});

test('correct selection is validated per mission', () => {
  assert.equal(isCorrectSelection(RESOLUTION_MISSIONS[0], 'C'), true);
  assert.equal(isCorrectSelection(RESOLUTION_MISSIONS[1], 'C'), true);
  assert.equal(isCorrectSelection(RESOLUTION_MISSIONS[2], 'B'), true);
  assert.equal(isCorrectSelection(RESOLUTION_MISSIONS[3], 'B'), true);
  assert.equal(isCorrectSelection(RESOLUTION_MISSIONS[4], 'B'), true);
});

test('wrong-answer guidance stays scaffolded and avoids revealing the final result', () => {
  const explanation = buildResolutionTutorExplanation(RESOLUTION_MISSIONS[1], false);

  assert.match(explanation, /Bangun ruang: Balok/i);
  assert.match(explanation, /Rumus Volume:/i);
  assert.match(explanation, /p = Panjang/i);
  assert.match(explanation, /l = Lebar/i);
  assert.match(explanation, /t = Tinggi/i);
  assert.doesNotMatch(explanation, /360 cm³/i);
  assert.doesNotMatch(explanation, /12 × 6/i);
  assert.doesNotMatch(explanation, /72 × 5/i);
});

test('mission hints use the scaffolded tutor guidance', () => {
  const hint = getMissionHint(RESOLUTION_MISSIONS[0], 3);

  assert.match(hint, /Bangun ruang:/i);
  assert.match(hint, /Masukkan nilai yang ada pada soal/i);
});

test('comic 4 resolution uses Jembatan Merah measurement and vehicle data', () => {
  const missions = getResolutionMissions(4, 'Jembatan Merah Surabaya');

  assert.equal(missions.length, 5);
  assert.deepEqual(missions.map((mission) => mission.correctKey), ['A', 'A', 'B', 'A', 'D']);
  assert.match(missions[0].prompt, /panjang langkah/i);
  assert.match(missions[1].prompt, /83 langkah.*76 langkah.*60 langkah/i);
  assert.match(missions[2].formula, /76 × 0,75 = 57 meter/);
  assert.match(missions[3].prompt, /18\.450.*6\.230.*890.*310/);
  assert.match(missions[4].answer, /310/);
  assert.doesNotMatch(buildResolutionTutorExplanation(missions[3], false), /bangun ruang|volume/i);
  assert.equal(isCorrectSelection(missions[4], 'C'), false);
  assert.equal(isCorrectSelection(missions[4], 'D'), true);
});
