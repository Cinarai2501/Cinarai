import test from 'node:test';
import assert from 'node:assert/strict';
import { Comic1Module } from '@/features/comics/comic-1';
import { isApplicationAnswerCorrect } from './applicationAnswer';

test('comic 1 application accepts its configured answer key', () => {
  const application = Comic1Module.application;
  const correctOption = application.options.find((option) => option.value === application.correctAnswer);

  assert.ok(correctOption);
  assert.equal(isApplicationAnswerCorrect([correctOption.value], application.correctAnswer), true);
  assert.equal(application.correctAnswer, 'Limas Segi Empat');
  assert.equal(isApplicationAnswerCorrect([' limas   segi empat '], 'Limas Segi Empat'), true);
  assert.equal(isApplicationAnswerCorrect(['Kubus'], 'Limas Segi Empat'), false);
  assert.equal(isApplicationAnswerCorrect(['Limas Segi Empat', 'Kubus'], 'Limas Segi Empat'), false);
});