import test from 'node:test';
import assert from 'node:assert/strict';
import { Comic1Module } from '@/features/comics/comic-1';
import { areApplicationCardsCompleted, isApplicationAnswerCorrect } from './applicationAnswer';

test('comic 1 application does not configure an answer key', () => {
  const application = Comic1Module.application;
  assert.equal('correctAnswer' in application, false);
  assert.equal(application.options.length > 0, true);
});

test('application answers ignore case and surrounding whitespace', () => {
  assert.equal(isApplicationAnswerCorrect(['  sEgItIgA  '], 'Segitiga'), true);
});

test('application accepts a valid explanation longer than the minimum', () => {
  const explanation = 'Atap memiliki tiga sisi dan satu titik puncak.';
  assert.equal(explanation.trim().length >= 20, true);
  assert.equal(isApplicationAnswerCorrect(['Segitiga'], 'Segitiga'), true);
});

test('application rejects an incorrect answer and accepts the corrected answer', () => {
  assert.equal(isApplicationAnswerCorrect(['Lingkaran'], 'Segitiga'), false);
  assert.equal(isApplicationAnswerCorrect(['Segitiga'], 'Segitiga'), true);
});

test('application accepts configured shape synonyms', () => {
  assert.equal(isApplicationAnswerCorrect(['segitiga sama kaki'], 'Segitiga', ['Segitiga Sama Kaki']), true);
});

test('application is complete only when every card is correct', () => {
  const cardIds = ['atap', 'jendela', 'ban', 'keramik'];
  assert.equal(areApplicationCardsCompleted(cardIds, { atap: true, jendela: true, ban: true }), false);
  assert.equal(areApplicationCardsCompleted(cardIds, { atap: true, jendela: true, ban: true, keramik: true }), true);
});