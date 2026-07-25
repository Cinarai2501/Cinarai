import test from 'node:test';
import assert from 'node:assert/strict';
import { getComicModule, loadComicModule } from './index';

test('getComicModule returns a module for comic 1', () => {
  const comicModule = getComicModule(1);
  assert.equal(comicModule.metadata.comicId, 1);
  assert.equal(comicModule.navigation.learningObjects.length > 0, true);
});

test('loadComicModule returns the same module instance for comic 2', () => {
  const first = loadComicModule(2);
  const second = loadComicModule(2);
  assert.equal(first.metadata.comicId, 2);
  assert.equal(second.metadata.comicId, 2);
  assert.equal(first.identification.questions.length, second.identification.questions.length);
});

test('comic 3 identification uses one multi-select question with all six expected shapes', () => {
  const comicModule = getComicModule(3);
  const question = comicModule.identification.questions[0];
  const expectedLabels = ['Persegi', 'Persegi Panjang', 'Segitiga', 'Trapesium', 'Belah Ketupat', 'Lingkaran'];

  assert.equal(comicModule.identification.questions.length, 1);
  assert.equal(question?.question, 'Apa saja bentuk bangun datar yang kamu temukan pada Rumah Gajah Mungkur?');
  assert.deepEqual(question?.options.map((option) => option.text), expectedLabels);
  assert.equal(question?.options.every((option) => option.correct), true);
});
