import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildStudentInsightFacts,
  buildStudentInsightPrompt,
  getStudentInsightPromptEvidence,
  isStudentAllowedForInsight,
  parseStudentInsightResponse,
} from './studentInsight';

const now = new Date('2026-10-30T12:00:00.000Z');
const modules = [
  { comicId: 1, title: 'Komik Satu', stages: ['Identification', 'Application'] },
  { comicId: 2, title: 'Komik Dua', stages: ['Contextualization', 'Resolution'] },
];

test('student insight authorization binds UID, role, and teacher school', () => {
  const scopedProfile = { uid: 'student-uid', role: 'student', schoolName: 'Sekolah A' };
  assert.equal(isStudentAllowedForInsight(scopedProfile, 'student-uid', 'teacher', 'Sekolah A'), true);
  assert.equal(isStudentAllowedForInsight(scopedProfile, 'student-uid', 'teacher', 'Sekolah B'), false);
  assert.equal(isStudentAllowedForInsight(scopedProfile, 'other-uid', 'teacher', 'Sekolah A'), false);
  assert.equal(isStudentAllowedForInsight({ ...scopedProfile, role: 'teacher' }, 'student-uid', 'teacher', 'Sekolah A'), false);
  assert.equal(isStudentAllowedForInsight({ ...scopedProfile, duplicate: true }, 'student-uid', 'teacher', 'Sekolah A'), false);
  assert.equal(isStudentAllowedForInsight(scopedProfile, 'student-uid', 'admin', ''), true);
  assert.equal(isStudentAllowedForInsight({ id: 'student-uid', role: 'student', schoolName: 'Sekolah A' }, 'student-uid', 'teacher', 'Sekolah A'), true);
});

function facts(overrides: Partial<Parameters<typeof buildStudentInsightFacts>[0]> = {}) {
  return buildStudentInsightFacts({
    modules,
    progress: [],
    evaluationScore: null,
    answers: [],
    activities: [],
    applications: [],
    reflections: [],
    generatedAt: now,
    sampleLimitPerQuery: 150,
    sampleMayBeTruncated: false,
    ...overrides,
  });
}

test('complete individual data covers all modules and creates evidence-backed summaries', () => {
  const result = facts({
    progress: [
      {
        comicId: 1,
        percentage: 75,
        status: 'learning',
        completedStages: ['Identification'],
        updatedAt: '2026-10-29T10:00:00.000Z',
        assessments: [{ type: 'quiz', score: 7 }],
      },
      {
        comicId: 2,
        percentage: 100,
        status: 'completed',
        completedStages: ['Contextualization', 'Resolution'],
        updatedAt: '2026-10-30T10:00:00.000Z',
        assessments: [],
      },
    ],
    evaluationScore: 30,
    answers: [
      { comicId: 1, step: 0, question: 'Pertanyaan bentuk', selectedAnswer: 'A', correctAnswer: 'B', recordedAt: '2026-10-29T10:00:00.000Z' },
      { comicId: 1, step: 0, question: 'Pertanyaan bentuk', selectedAnswer: 'B', correctAnswer: 'B', recordedAt: '2026-10-30T10:00:00.000Z' },
    ],
    activities: [
      { type: 'lesson_started', comicId: 1, occurredAt: '2026-10-29T10:00:00.000Z' },
      { type: 'lesson_completed', comicId: 2, occurredAt: '2026-10-30T10:00:00.000Z' },
    ],
    applications: [{ comicId: 1, coachType: 'constructive', recordedAt: '2026-10-29T10:00:00.000Z' }],
    reflections: [{ rating: 4, confidence: 3, recordedAt: '2026-10-29T10:00:00.000Z' }],
  });

  assert.equal(result.modules.length, 2);
  assert.deepEqual(result.modules[0].completedStages, ['Identification']);
  assert.deepEqual(result.modules[0].remainingStages, ['Application']);
  assert.equal(result.modules[0].answers.correctCount, 1);
  assert.equal(result.modules[0].answers.incorrectCount, 1);
  assert.equal(result.modules[0].assessments[0].score, 7);
  assert.equal(result.activity.recordCount, 2);
  assert.equal(result.activity.completedEvents, 1);
  assert.equal(result.activity.activeDays, 2);
  assert.equal(result.assessments[0].score, 30);
  assert.ok(result.evidence.some((item) => item.key === 'answers:1'));
  assert.ok(result.evidence.some((item) => item.key === 'activity:completion'));
});

test('all catalog modules are included instead of only the latest progress document', () => {
  const allModules = Array.from({ length: 6 }, (_, index) => ({
    comicId: index + 1,
    title: `Komik ${index + 1}`,
    stages: ['Identification', 'Application'],
  }));
  const result = facts({
    modules: allModules,
    progress: [
      { comicId: 1, percentage: 10, status: 'learning', completedStages: [], updatedAt: '2026-10-01T10:00:00.000Z', assessments: [] },
      { comicId: 6, percentage: 90, status: 'learning', completedStages: ['Identification'], updatedAt: '2026-10-29T10:00:00.000Z', assessments: [] },
    ],
  });

  assert.deepEqual(result.modules.map((module) => module.comicId), [1, 2, 3, 4, 5, 6]);
  assert.equal(result.modules[0].progressAvailable, true);
  assert.equal(result.modules[5].progressAvailable, true);
  assert.equal(result.modules[2].progressAvailable, false);
  assert.ok(result.limitations.some((item) => item.includes('Sebagian modul tidak memiliki dokumen progress')));
});

test('missing module progress and missing evidence stay unavailable rather than becoming failure', () => {
  const result = facts({
    progress: [{
      comicId: 1,
      percentage: null,
      status: 'not_started',
      completedStages: [],
      updatedAt: null,
      assessments: [],
    }],
  });

  assert.equal(result.modules[0].progressAvailable, true);
  assert.equal(result.modules[0].percentage, null);
  assert.equal(result.modules[1].progressAvailable, false);
  assert.equal(result.modules[1].status, null);
  assert.deepEqual(result.modules[1].remainingStages, []);
  assert.equal(result.activity.recordCount, 0);
  assert.equal(result.activity.activeDays, 0);
  assert.ok(result.limitations.some((item) => item.includes('Tidak ada aktivitas')));
  assert.ok(result.limitations.some((item) => item.includes('bukan bukti siswa gagal')));
});

test('no activity and differing current timestamps do not manufacture progress history', () => {
  const result = facts({
    progress: [
      { comicId: 1, percentage: 20, status: 'learning', completedStages: [], updatedAt: '2026-10-01T10:00:00.000Z', assessments: [] },
      { comicId: 2, percentage: 50, status: 'learning', completedStages: ['Resolution'], updatedAt: '2026-10-28T10:00:00.000Z', assessments: [] },
    ],
  });

  assert.equal(result.dataPeriod.from, '2026-10-01T10:00:00.000Z');
  assert.equal(result.dataPeriod.to, '2026-10-28T10:00:00.000Z');
  assert.ok(result.limitations.some((item) => item.includes('Riwayat snapshot progress tidak tersedia')));
  assert.equal(result.activity.byWeek.reduce((sum, week) => sum + week.count, 0), 0);
});

test('login and other non-learning events are excluded from learning frequency', () => {
  const result = facts({
    activities: [
      { type: 'login', comicId: null, occurredAt: '2026-10-29T10:00:00.000Z' },
      { type: 'other', comicId: null, occurredAt: '2026-10-29T11:00:00.000Z' },
    ],
  });
  assert.equal(result.activity.recordCount, 0);
  assert.equal(result.activity.activeDays, 0);
  assert.ok(result.limitations.some((item) => item.includes('Tidak ada aktivitas bertimestamp valid')));
});

test('AI prompt excludes identity and raw answer text and only supplies aggregates', () => {
  const result = facts({
    answers: [{
      comicId: 1,
      step: 0,
      question: 'Topik pembelajaran',
      selectedAnswer: 'jawaban-pribadi-tidak-boleh-dikirim',
      correctAnswer: 'kunci',
      recordedAt: null,
    }],
  });
  const prompt = buildStudentInsightPrompt(result);

  assert.ok(prompt.length < 12000);
  assert.ok(!prompt.includes('jawaban-pribadi-tidak-boleh-dikirim'));
  assert.ok(!prompt.includes('email'));
  assert.ok(!prompt.includes('uid'));
});

test('AI prompt evidence is bounded in count and field size', () => {
  const result = facts({
    progress: modules.map((module) => ({
      comicId: module.comicId,
      percentage: 20,
      status: 'learning' as const,
      completedStages: [],
      updatedAt: null,
      assessments: [],
    })),
  });
  result.evidence = Array.from({ length: 60 }, (_, index) => ({
    key: `evidence:${index}`,
    label: 'l'.repeat(200),
    detail: 'd'.repeat(1_000),
  }));
  const evidence = getStudentInsightPromptEvidence(result);
  const prompt = buildStudentInsightPrompt(result);

  assert.equal(evidence.length, 20);
  assert.ok(evidence.every((item) => item.label.length <= 80 && item.detail.length <= 220));
  assert.ok(prompt.length < 12_000);
  assert.ok(!prompt.includes('evidence:20'));
});

test('AI output requires valid evidence references and recommendation categories', () => {
  const allowedEvidence = new Set(['progress:1']);
  const valid = parseStudentInsightResponse(JSON.stringify({
    summary: 'Bukti progress tersedia.',
    summaryEvidenceKeys: ['progress:1'],
    findings: [{ text: 'Satu tahap tercatat selesai.', evidenceKeys: ['progress:1'] }],
    recommendations: [{
      category: 'review',
      text: 'Tinjau kembali tahap yang belum tercatat.',
      evidenceKeys: ['progress:1'],
      nextIndicator: 'Periksa penyelesaian tahap pada snapshot berikutnya.',
    }],
    limitations: [],
  }), allowedEvidence);
  assert.equal(valid?.recommendations[0].category, 'review');
  assert.equal(parseStudentInsightResponse(JSON.stringify({
    summary: 'Temuan tanpa bukti.',
    summaryEvidenceKeys: ['unverified'],
    findings: [{ text: 'Kesimpulan.', evidenceKeys: ['unverified'] }],
    recommendations: [],
    limitations: [],
  }), allowedEvidence), null);
  assert.equal(parseStudentInsightResponse('not JSON', allowedEvidence), null);
});
