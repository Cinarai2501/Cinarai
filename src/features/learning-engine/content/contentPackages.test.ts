import test from 'node:test';
import assert from 'node:assert/strict';
import { getLearningContentPackage } from './contentPackages';
import { createIdentificationState } from '../stages/Identification/services/identificationService';

test('getLearningContentPackage returns different content for different comic ids', () => {
  const comic1 = getLearningContentPackage(1);
  const comic2 = getLearningContentPackage(2);
  const comic3 = getLearningContentPackage(3);

  assert.equal(comic1.metadata.comicId, 1);
  assert.equal(comic2.metadata.comicId, 2);
  assert.equal(comic3.metadata.comicId, 3);
  assert.notEqual(comic1.metadata.title, comic2.metadata.title);
  assert.notEqual(comic1.learningObjects[0]?.id, comic2.learningObjects[0]?.id);
  assert.equal(comic1.learningObjects.length > 0, true);
  assert.equal(comic2.learningObjects.length > 0, true);
  assert.equal(comic3.learningObjects.length > 0, true);
});

test('getLearningContentPackage falls back to a reusable generic package for unknown comic ids', () => {
  const fallback = getLearningContentPackage(99);

  assert.equal(fallback.metadata.comicId, 99);
  assert.equal(fallback.learningObjects.length > 0, true);
  assert.equal(fallback.identification.questions.length > 0, true);
  assert.equal(fallback.application.prompt.length > 0, true);
});

test('identification state can be built from the content package content', () => {
  const packageContent = getLearningContentPackage(2);
  const state = createIdentificationState(2, 'Candi Penataran', [], 'cover', 'Penataran', 'komik-2', 1, null);

  assert.equal(state.items.length, packageContent.identification.questions.length);
  assert.equal(state.items[0]?.question, packageContent.identification.questions[0]?.question);
  assert.equal(state.items[0]?.image, packageContent.identification.questions[0]?.image);
});

test('comic 2 identification uses symmetry-specific questions and no comic 1 wording', () => {
  const packageContent = getLearningContentPackage(2);
  const questions = packageContent.identification.questions.map((question) => question.question);

  assert.ok(questions.some((question) => /simetri|garis simetri|kiri|kanan|seimbang|cermin/i.test(question)));
  assert.ok(questions.every((question) => !/bangun ruang|Candi Jawi/i.test(question)));
  assert.ok(packageContent.identification.questions.some((question) => question.options.some((option) => /garis simetri|cermin|kiri|kanan|pencerminan|titik tengah/i.test(option.text))));
});
