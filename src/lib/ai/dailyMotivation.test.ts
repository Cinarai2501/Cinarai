import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDailyMotivationPrompt } from './dailyMotivation';

test('buildDailyMotivationPrompt includes the required guidance', () => {
  const prompt = buildDailyMotivationPrompt();

  assert.match(prompt, /Bahasa Indonesia/i);
  assert.match(prompt, /40 kata/i);
  assert.match(prompt, /anak usia 7-12 tahun/i);
  assert.match(prompt, /jangan menyebut/i);
});
