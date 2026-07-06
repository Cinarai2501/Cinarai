import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTutorPrompt } from './service';

test('buildTutorPrompt includes learning context and coaching instructions', () => {
  const prompt = buildTutorPrompt({
    moduleName: 'Bangun Ruang',
    identification: [{ step: 1, selectedAnswer: 'Kubus', note: 'Saya melihat sisi', reason: 'Karena ada kotak' }],
    objectInfo: {
      location: 'Kelas',
      classLevel: '5',
      synopsis: 'Belajar bangun ruang',
      learningTargets: ['Mengamati', 'Membandingkan'],
    },
    observationAnswers: {
      bangunRuang: 'Kubus',
      alasan: 'Karena terlihat kotak',
      bagianMenarik: 'Sisinya',
      hubunganMatematika: 'Ada 12 rusuk',
    },
    question: 'Bagaimana saya tahu ini kubus?',
  });

  assert.match(prompt, /Bangun Ruang/i);
  assert.match(prompt, /identifikasi/i);
  assert.match(prompt, /petunjuk/i);
  assert.match(prompt, /bertanya balik/i);
  assert.match(prompt, /contoh sederhana/i);
});
