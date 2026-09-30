import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeStageData } from './comicProgress';

test('mergeStageData preserves existing snapshots and adds new stage data', () => {
  const existing = {
    identification: {
      selectedShapes: ['Kubus'],
      answers: [{ step: 1, selectedAnswer: 'Kubus' }],
    },
    application: {
      selectedChoice: ['A'],
      explanation: 'Awal',
      score: 1,
    },
  };

  const result = mergeStageData(existing, {
    identification: {
      selectedShapes: ['Kubus', 'Balok'],
    },
    introspection: {
      reflection: 'Saya belajar banyak',
      aiFeedback: { summary: 'bagus' },
    },
  });

  assert.deepEqual(result, {
    identification: {
      selectedShapes: ['Kubus', 'Balok'],
      answers: [{ step: 1, selectedAnswer: 'Kubus' }],
    },
    application: {
      selectedChoice: ['A'],
      explanation: 'Awal',
      score: 1,
    },
    introspection: {
      reflection: 'Saya belajar banyak',
      aiFeedback: { summary: 'bagus' },
    },
  });
});

test('mergeStageData stores orientation answers without replacing other stages', () => {
  const result = mergeStageData({
    identification: { selectedShapes: ['Kubus'] },
  }, {
    orientation: {
      openedActivities: [1, 2],
      answers: { problem: 'Mencari bentuk yang tersembunyi' },
      choices: { sameShape: 'no' },
      hypothesisStatus: 'cukup-yakin',
      selectedInformation: ['Jumlah rusuk'],
      informationOther: '',
      readyForAr: false,
    },
  });

  assert.deepEqual(result, {
    identification: { selectedShapes: ['Kubus'] },
    orientation: {
      openedActivities: [1, 2],
      answers: { problem: 'Mencari bentuk yang tersembunyi' },
      choices: { sameShape: 'no' },
      hypothesisStatus: 'cukup-yakin',
      selectedInformation: ['Jumlah rusuk'],
      informationOther: '',
      readyForAr: false,
    },
  });
});
