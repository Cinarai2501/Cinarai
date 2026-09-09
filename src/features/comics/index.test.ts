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

test('comic 4 identification uses the bridge measurement concepts and stable multi-select options', () => {
  const comicModule = getComicModule(4);
  const question = comicModule.identification.questions[0];

  assert.equal(question?.question, 'Apa saja konsep matematika yang kamu temukan dalam petualangan di Jembatan Merah?');
  assert.deepEqual(question?.options.map((option) => option.text), [
    'Pengukuran panjang lintasan',
    'Menghitung panjang berdasarkan jumlah langkah dan panjang langkah',
    'Menganalisis dan membandingkan data hasil pengukuran',
    'Menyajikan data dalam grafik batang',
    'Bangun datar',
    'Simetri',
  ]);
  assert.equal(question?.options.filter((option) => option.correct).length, 4);
  assert.match(comicModule.identification.feedback.complete, /grafik batang/);
  assert.doesNotMatch(comicModule.identification.feedback.complete, /keramik|persegi|simetri/i);
});

test('comic 4 argumentation uses eight ordered bridge measurement and vehicle data questions', () => {
  const comicModule = getComicModule(4);
  const questions = comicModule.argumentation.questions;
  const argumentationText = questions
    .map((question) => `${question.context ?? ''} ${question.question} ${question.explanation ?? ''}`)
    .join(' ')
    .toLowerCase();

  assert.equal(questions.length, 8);
  assert.deepEqual(questions.map((question) => question.id), [
    'komik4-arg-1',
    'komik4-arg-2',
    'komik4-arg-3',
    'komik4-arg-4',
    'komik4-arg-5',
    'komik4-arg-6',
    'komik4-arg-7',
    'komik4-arg-8',
  ]);
  assert.match(argumentationText, /60 langkah/);
  assert.match(argumentationText, /76 langkah/);
  assert.match(argumentationText, /83 langkah/);
  assert.match(argumentationText, /120.*0,75|0,75.*120/);
  assert.match(argumentationText, /18\.450/);
  assert.match(argumentationText, /6\.230/);
  assert.match(argumentationText, /890/);
  assert.match(argumentationText, /310/);
  assert.match(argumentationText, /25\.880/);
  assert.match(argumentationText, /grafik batang/);
  assert.doesNotMatch(argumentationText, /bangun datar|simetri|pecahan|luas|keliling/);
  assert.equal(questions.filter((question) => question.answerType === 'choice').length, 3);
  assert.equal(questions.filter((question) => question.answerType === 'text').length, 5);
  assert.ok(questions.every((question) => question.explanation && question.explanation.length > 0));
});
