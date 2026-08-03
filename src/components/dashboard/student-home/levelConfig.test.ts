import test from 'node:test';
import assert from 'node:assert/strict';
import { getLevelConfig } from './levelConfig';

test('getLevelConfig returns badge metadata for the current level', () => {
  const levelOne = getLevelConfig(0);
  assert.equal(levelOne.level, 1);
  assert.equal(levelOne.badgeTitle, 'Pembaca Pemula');
  assert.equal(levelOne.badgeAsset, '/assets/dashboard/home/levels/icon-level-1-v2.png');

  const levelThree = getLevelConfig(300);
  assert.equal(levelThree.level, 3);
  assert.equal(levelThree.badgeTitle, 'Petualang Candi');
  assert.equal(levelThree.badgeAsset, '/assets/dashboard/home/levels/icon-level-3-v2.png');
});
