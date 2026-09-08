import assert from 'node:assert/strict';
import test from 'node:test';

import { createIdentificationState, selectAnswer } from './identificationService';

test('selectAnswer keeps previously selected options and toggles only the clicked option', () => {
  const state = createIdentificationState(
    {
      questions: [
        {
          id: 'comic-1-1',
          question: 'Apa saja bangun ruang yang kamu temukan di Candi Jawi?',
          image: '/images/identification/komik1-soal1.jpg',
          imageAlt: 'Foto keseluruhan Candi Jawi',
          options: [
            { text: 'Kubus', correct: true },
            { text: 'Balok', correct: true },
            { text: 'Kerucut', correct: false },
          ],
          explanation: 'Contoh',
        },
      ],
      feedback: {
        complete: 'Selesai',
        partial: 'Sebagian',
        incomplete: 'Belum',
      },
    },
    { comicId: 1, lokasi: 'Candi Jawi', cover: '/comics/komik-1/cover.png', title: 'Identification' },
  );
  const itemId = state.items[0].id;

  const afterKubus = selectAnswer(state, itemId, state.items[0].options[0].id);
  const afterBalok = selectAnswer(afterKubus, itemId, state.items[0].options[1].id);
  const afterBalokAgain = selectAnswer(afterBalok, itemId, state.items[0].options[1].id);

  const selectedIds = afterBalokAgain.items.find((item) => item.id === itemId)?.selectedOptionIds ?? [];

  assert.deepEqual(selectedIds, [state.items[0].options[0].id]);
});

test('comic 4 selectAnswer supports selecting all correct options and deselecting one', () => {
  const state = createIdentificationState(
    {
      questions: [{
        id: 'comic-4-1',
        question: 'Konsep apa saja?',
        imageAlt: 'Jembatan Merah',
        options: [
          { text: 'Panjang lintasan', correct: true },
          { text: 'Jumlah langkah', correct: true },
          { text: 'Bangun datar', correct: false },
        ],
        explanation: 'Contoh',
      }],
      feedback: { complete: 'Selesai', partial: 'Belum', incomplete: 'Belum' },
    },
    { comicId: 4, lokasi: 'Jembatan Merah', cover: '/cover.png', title: 'Identification' },
  );
  const item = state.items[0];
  const correctOptions = item.options.filter((option) => option.correct);

  const afterFirst = selectAnswer(state, item.id, correctOptions[0].id);
  const afterSecond = selectAnswer(afterFirst, item.id, correctOptions[1].id);
  const afterDeselect = selectAnswer(afterSecond, item.id, correctOptions[0].id);

  assert.deepEqual(afterSecond.items[0].selectedOptionIds, correctOptions.map((option) => option.id));
  assert.deepEqual(afterDeselect.items[0].selectedOptionIds, [correctOptions[1].id]);
});
