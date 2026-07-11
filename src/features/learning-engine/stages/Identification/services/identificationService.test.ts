import assert from 'node:assert/strict';
import test from 'node:test';

import { buildIdentificationFeedback, buildIdentificationTutorExplanations, buildIdentificationTutorExplanation, createIdentificationState, resolveSelectedOptionId } from './identificationService';

test('identification questions for comic 1 use dedicated Candi Jawi photo assets', () => {
  const state = createIdentificationState(
    1,
    'Candi Jawi',
    [],
    '/comics/komik-1/cover.png',
    'Candi Jawi Identification',
  );
  const firstItem = state.items[0];

  assert.equal(firstItem.image, '/images/identification/komik1-soal1.jpg');
  assert.match(firstItem.imageAlt, /Candi Jawi|keseluruhan|overlay/i);
  assert.match(firstItem.question, /keseluruhan Candi Jawi|bangun ruang|tubuh utama/i);
  assert.equal(firstItem.highlight, '/images/identification/komik1-soal1-tubuh-candi.svg');
  assert.equal(firstItem.sourcePdfPath, null);
  assert.equal(firstItem.sourcePage, undefined);

  const correctOption = firstItem.options.find((option) => option.correct);
  assert.equal(firstItem.correctOptionId, correctOption?.id);
});

test('identification state preserves per-question images and nulls PDF fallback for dedicated identification assets', () => {
  const state = createIdentificationState(
    1,
    'Candi Jawi',
    [],
    '/comics/komik-1/cover.png',
    'Candi Jawi Identification',
    'komik-1',
    7,
  );
  const firstItem = state.items[0];

  assert.equal(firstItem.image, '/images/identification/komik1-soal1.jpg');
  assert.equal(firstItem.sourcePdfPath, null);
  assert.equal(firstItem.sourcePage, undefined);
  assert.equal(state.items[1].image, '/images/identification/komik1-soal2.jpg');
  assert.equal(state.items[4].image, '/images/identification/komik1-soal5.jpg');
});

test('stored answer text resolves to the shuffled option id', () => {
  const state = createIdentificationState(
    2,
    'Candi Penataran',
    [],
    '/comics/komik-2/cover.png',
    'Petualangan Simetri Candi Penataran',
    'komik-2',
    1,
  );
  const firstItem = state.items[0];
  const correctOption = firstItem.options.find((option) => option.correct);

  assert.ok(correctOption);
  assert.equal(resolveSelectedOptionId(firstItem, correctOption?.text ?? null), correctOption?.id);
});

test('buildIdentificationTutorExplanation explains selected shapes in child-friendly language', () => {
  const explanation = buildIdentificationTutorExplanation(['Kubus', 'Bola']);

  assert.match(explanation, /Kubus/i);
  assert.match(explanation, /Bola/i);
  assert.match(explanation, /tidak ditemukan/i);
});

test('buildIdentificationTutorExplanations returns structured sections for every selected shape', () => {
  const explanations = buildIdentificationTutorExplanations(['Kubus', 'Bola']);

  assert.equal(explanations.length, 2);
  assert.match(explanations[0].text, /Kubus/i);
  assert.match(explanations[0].text, /Definisi/i);
  assert.match(explanations[0].text, /Ciri-ciri/i);
  assert.match(explanations[0].text, /ditemukan/i);
  assert.match(explanations[1].text, /Bola/i);
  assert.match(explanations[1].text, /tidak ditemukan/i);
});

test('buildIdentificationFeedback praises complete identification and flags distractors', () => {
  const praise = buildIdentificationFeedback(['Balok', 'Kubus', 'Limas', 'Prisma'], ['Balok', 'Kubus', 'Limas', 'Prisma']);
  const corrective = buildIdentificationFeedback(['Balok', 'Bola'], ['Balok', 'Kubus', 'Limas', 'Prisma']);

  assert.match(praise, /Hebat/i);
  assert.match(corrective, /tidak sesuai/i);
});
