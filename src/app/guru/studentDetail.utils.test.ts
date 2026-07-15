import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateStudentValue, formatLearningDuration } from './studentDetail.utils.ts';

test('calculateStudentValue falls back to average progress when no reflections exist', () => {
  const value = calculateStudentValue([{ percentage: 80 }], []);
  assert.equal(value, 80);
});

test('formatLearningDuration converts a time span to a human readable string', () => {
  const value = formatLearningDuration('2024-01-01T10:00:00.000Z', '2024-01-01T12:30:00.000Z');
  assert.equal(value, '3 jam');
});
