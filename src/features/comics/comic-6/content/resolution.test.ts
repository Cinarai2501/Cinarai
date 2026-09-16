import assert from 'node:assert/strict';
import test from 'node:test';

import { packageContent } from './packageContent';
import { buildResolutionTutorExplanation, getResolutionMissions } from '../../../learning-engine/components/stages/resolutionStage.helpers';

test('Komik 6 resolution keeps five missions with four single-answer choices', () => {
  const missions = packageContent.resolution.missions;

  assert.equal(missions.length, 5);
  assert.deepEqual(missions.map((mission) => mission.title), [
    'Misi Menara',
    'Misi Kubah Atas',
    'Misi Ruang Utama',
    'Misi Tempat Duduk Wudu',
    'Misi Kubah Bawah',
  ]);
  assert.deepEqual(missions.map((mission) => mission.shape), [
    'Tabung',
    'Kerucut',
    'Balok',
    'Kubus',
    'Setengah bola',
  ]);
  assert.deepEqual(missions.map((mission) => mission.correctKey), ['B', 'C', 'D', 'B', 'C']);

  for (const mission of missions) {
    assert.deepEqual(mission.options.map((option) => option.key), ['A', 'B', 'C', 'D']);
    assert.equal(mission.options.length, 4);
    assert.equal(mission.options.filter((option) => option.key === mission.correctKey).length, 1);
    assert.ok(mission.illustration, `${mission.title} harus memiliki asset ilustrasi`);
  }
});

test('Komik 6 tutor resolution mengikuti bangun aktif tanpa rumus volume', () => {
  const missions = getResolutionMissions(6, 'Masjid Al-Akbar Surabaya');

  assert.deepEqual(missions.map((mission) => mission.shape), ['Tabung', 'Kerucut', 'Balok', 'Kubus', 'Setengah bola']);
  for (const mission of missions) {
    const explanation = buildResolutionTutorExplanation(mission, false);
    assert.match(explanation, new RegExp(mission.shape, 'i'));
    assert.doesNotMatch(explanation, /rumus volume|V\s*=/i);
  }
});