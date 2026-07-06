import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTutorPrompt, generateTutorResponse } from './service';
import type { AiProvider } from './provider';

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
  assert.match(prompt, /Socratic/i);
  assert.match(prompt, /contoh sederhana/i);
});

test('generateTutorResponse falls back to a friendly message when AI returns no content', async () => {
  const provider: Pick<AiProvider, 'generate'> = {
    generate: async () => ({ provider: 'gemini', content: '' }),
  };

  const response = await generateTutorResponse(
    {
      moduleName: 'Bangun Ruang',
      identification: [],
      objectInfo: {
        location: 'Kelas',
        classLevel: '5',
        synopsis: 'Belajar bangun ruang',
        learningTargets: ['Mengamati'],
      },
      observationAnswers: {},
      question: 'Apa arti rusuk?',
    },
    provider,
  );

  assert.equal(response.answer, 'Maaf, saya sedang tidak bisa merespons saat ini. Coba lagi sebentar lagi.');
});

test('buildTutorPrompt prioritizes explicit short-answer instructions from the user', () => {
  const prompt = buildTutorPrompt({
    moduleName: 'Bangun Ruang',
    identification: [],
    objectInfo: {
      location: 'Kelas',
      classLevel: '5',
      synopsis: 'Belajar bangun ruang',
      learningTargets: ['Mengamati'],
    },
    observationAnswers: {},
    question: 'Tolong balas hanya dengan kata BERHASIL',
  });

  assert.match(prompt, /Tolong balas hanya dengan kata BERHASIL/i);
  assert.match(prompt, /ikuti instruksi pengguna secara ketat/i);
});
