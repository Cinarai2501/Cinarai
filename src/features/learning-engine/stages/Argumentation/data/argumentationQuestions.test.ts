import test from 'node:test';
import assert from 'node:assert/strict';
import { getArgumentationLearningObject } from './argumentationQuestions';

test('maps a selected kerucut to the atap learning object', () => {
  const object = getArgumentationLearningObject(['Kerucut']);

  assert.ok(object);
  assert.equal(object?.objectName, 'Bagian Atap');
  assert.equal(object?.solid, 'Kerucut');
});

test('maps a selected kubus to the tubuh learning object', () => {
  const object = getArgumentationLearningObject(['Kubus']);

  assert.ok(object);
  assert.equal(object?.objectName, 'Bagian Tubuh');
  assert.equal(object?.solid, 'Kubus');
});

test('maps a selected prisma to the tangga learning object', () => {
  const object = getArgumentationLearningObject(['Prisma Segitiga']);

  assert.ok(object);
  assert.equal(object?.objectName, 'Bagian Tangga');
  assert.equal(object?.solid, 'Prisma Segitiga');
});

test('falls back to the first object when no shape is selected', () => {
  const object = getArgumentationLearningObject([]);

  assert.ok(object);
  assert.equal(object?.id, 'atap');
});
