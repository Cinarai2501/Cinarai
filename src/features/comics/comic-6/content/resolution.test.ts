import assert from 'node:assert/strict';
import test from 'node:test';

import { packageContent } from './packageContent';

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
  }
});