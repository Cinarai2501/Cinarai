import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSuggestedQuestions, groupConversationHistoryByPeriod, getConversationTitle } from './tutorUi';

test('buildSuggestedQuestions returns topic-specific follow-ups', () => {
  assert.deepEqual(buildSuggestedQuestions('Apa perbedaan kubus dan balok?'), [
    'Apa ciri kubus?',
    'Apa ciri balok?',
    'Contoh kubus di rumah',
    'Latihan singkat',
  ]);

  assert.deepEqual(buildSuggestedQuestions('Rumus balok?'), [
    'Apa rumus volume balok?',
    'Contoh balok di rumah',
    'Apa beda balok dan kubus?',
    'Latihan singkat',
  ]);
});

test('groupConversationHistoryByPeriod groups recent conversations correctly', () => {
  const now = new Date('2026-08-03T10:00:00.000Z');
  const conversations = [
    { id: '1', title: 'Hari ini', updatedAt: now.toISOString() },
    { id: '2', title: 'Kemarin', updatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString() },
    { id: '3', title: '7 hari lalu', updatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '4', title: '30 hari lalu', updatedAt: new Date(now.getTime() - 33 * 24 * 60 * 60 * 1000).toISOString() },
  ];

  const grouped = groupConversationHistoryByPeriod(conversations, now);
  assert.deepEqual(Object.keys(grouped), ['Hari ini', 'Kemarin', '7 Hari lalu', '30 Hari lalu']);
  assert.equal(grouped['Hari ini'][0].id, '1');
  assert.equal(grouped['30 Hari lalu'][0].id, '4');
});

test('getConversationTitle derives a short title from the first question', () => {
  assert.equal(getConversationTitle('Apa itu kubus?'), 'Kubus');
  assert.equal(getConversationTitle('Bantu jelaskan balok dan rusuk'), 'Balok');
  assert.equal(getConversationTitle('Halo, saya bingung'), 'Percakapan baru');
});
