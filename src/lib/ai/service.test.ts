import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStudentInsightPrompt, buildTutorPrompt, generateStudentInsight, generateTutorResponse } from './service';
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
  assert.match(prompt, /SELALU jawab pertanyaan siswa/i);
  assert.match(prompt, /pertanyaan reflektif/i);
  assert.match(prompt, /120 kata/i);
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

  assert.equal(response.answer, 'Seluruh layanan AI sedang tidak tersedia.');
});

test('generateTutorResponse uses an injected router result when provided', async () => {
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
    undefined,
    {
      throwOnError: false,
      router: {
        generate: async () => ({ provider: 'groq', content: 'Jawaban dari router' }),
      },
    },
  );

  assert.equal(response.answer, 'Jawaban dari router');
  assert.equal(response.provider, 'groq');
});

test('buildStudentInsightPrompt includes the expected student analysis sections', () => {
  const prompt = buildStudentInsightPrompt({
    studentName: 'Ayu',
    email: 'ayu@example.com',
    progressDocuments: [{ comicId: 1, percentage: 60, status: 'in_progress', completedStage: 'Identifikasi' }],
    reflections: [{ rating: 4, stage: 'application' }],
    activities: [{ title: 'Komik dimulai', description: 'Mulai komik 1', occurredAt: undefined }],
  });

  assert.match(prompt, /Kemampuan numerasi/i);
  assert.match(prompt, /Stage terlemah/i);
  assert.match(prompt, /Stage terbaik/i);
  assert.match(prompt, /Pola kesalahan/i);
  assert.match(prompt, /Rekomendasi guru/i);
  assert.match(prompt, /Remedial/i);
  assert.match(prompt, /Pengayaan/i);
});

test('generateStudentInsight falls back to a local summary when AI is unavailable', async () => {
  const result = await generateStudentInsight(
    {
      studentName: 'Ayu',
      email: 'ayu@example.com',
      progressDocuments: [{ comicId: 1, percentage: 60, status: 'in_progress', completedStage: 'Identifikasi' }],
      reflections: [],
      activities: [],
    },
    { retryCount: 1, router: { generate: async () => ({ provider: 'gemini', content: '' }) } },
  );

  assert.match(result.capabilitySummary, /Ayu/i);
  assert.match(result.weakestStage, /Identifikasi/i);
  assert.match(result.teacherRecommendation, /fokus/i);
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

test('buildTutorPrompt includes navigation context and topic boundaries', () => {
  const prompt = buildTutorPrompt({
    moduleName: 'Bangun Ruang',
    identification: [],
    objectInfo: {
      location: 'Candi Jawi',
      classLevel: '5',
      synopsis: 'Mengamati bangun ruang',
      learningTargets: ['Mengamati bangun ruang'],
    },
    observationAnswers: {},
    question: 'Apa yang kamu lihat?',
    comicTitle: 'Komik 1',
    pageLabel: 'Halaman 13',
    objectName: 'Kubus',
    learningStage: 'Navigation',
    objectDescription: 'Relief persegi dengan simetri.',
    arProvider: 'Assemblr',
    modelUrl: 'https://example.com/model',
    learningGoal: 'Mengamati pola visual',
    numeracyConcept: 'simetri',
    cultureConcept: 'Candi Penataran',
  });

  assert.match(prompt, /Komik 1/i);
  assert.match(prompt, /Kubus/i);
  assert.match(prompt, /Navigation/i);
  assert.match(prompt, /hanya berdasarkan/i);
  assert.match(prompt, /provider AR/i);
  assert.match(prompt, /simetri/i);
  assert.match(prompt, /Candi Penataran/i);
});

test('buildTutorPrompt enforces answer-first rule and forbids Socratic-only responses', () => {
  const prompt = buildTutorPrompt({
    moduleName: 'Bangun Ruang',
    identification: [],
    objectInfo: {
      location: 'Candi Jawi',
      classLevel: '6',
      synopsis: 'Belajar bangun ruang',
      learningTargets: ['Mengidentifikasi bangun ruang'],
    },
    observationAnswers: {},
    question: 'Apa nama bangun ruang ini?',
    objectName: 'Kubus',
    learningStage: 'Navigation',
  });

  // Must instruct AI to answer first
  assert.match(prompt, /SELALU jawab pertanyaan siswa/i);
  // Must allow a follow-up reflective question only after answering
  assert.match(prompt, /pertanyaan reflektif/i);
  // Must NOT contain the old Socratic-only instruction
  assert.doesNotMatch(prompt, /Tidak langsung memberi jawaban/i);
  assert.doesNotMatch(prompt, /pertanyaan Socratic/i);
  // Must cap response length
  assert.match(prompt, /120 kata/i);
});
