import assert from 'node:assert/strict';
import test from 'node:test';
import { buildClassInsightFacts, buildClassInsightPrompt, parseClassInsightResponse } from './classInsight';

const fixedNow = new Date('2026-10-30T12:00:00.000Z');

function student(uid: string, progress: Array<{
  comicId: number;
  percentage: number | null;
  status?: string;
  completedStages?: string[];
  updatedAt?: string | null;
  assessmentScores?: Array<{ type: string; score: number }>;
}> = []) {
  const updatedDates = progress
    .map((item) => item.updatedAt)
    .filter((value): value is string => Boolean(value))
    .sort();
  return {
    uid,
    name: `Nama privat ${uid}`,
    progress: progress.map((item) => ({
      comicId: item.comicId,
      percentage: item.percentage,
      status: item.status,
      completedStages: item.completedStages ?? [],
      updatedAt: item.updatedAt ?? null,
      assessmentScores: item.assessmentScores ?? [],
    })),
    lastRecordedProgressAt: updatedDates[updatedDates.length - 1] ?? null,
  };
}

function facts(overrides: Partial<Parameters<typeof buildClassInsightFacts>[0]> = {}) {
  return buildClassInsightFacts({
    students: [],
    comics: [],
    answers: [],
    activities: [],
    reflections: [],
    applications: [],
    generatedAt: fixedNow,
    sampleLimitPerQuery: 150,
    sampleMayBeTruncated: false,
    ...overrides,
  });
}

test('empty class data remains unavailable and does not manufacture progress or history', () => {
  const result = facts();
  assert.equal(result.summary.averageRecordedProgress, null);
  assert.equal(result.summary.recordedProgressCount, 0);
  assert.equal(result.historyPeriod.from, null);
  assert.equal(result.summary.studentsWithNoRecordedProgress, 0);
  assert.equal(result.comics.length, 0);
  assert.ok(result.limitations.some((item) => item.includes('Histori snapshot progress tidak tersedia')));
});

test('sampled class roster is disclosed as an analysis limitation', () => {
  const result = facts({
    students: [student('student-1')],
    rosterMayBeTruncated: true,
  });
  assert.equal(result.scope.rosterMayBeTruncated, true);
  assert.ok(result.limitations.some((item) => item.includes('maksimal 100 siswa')));
});

test('comic mastery uses roster denominator and excludes missing progress from average', () => {
  const completeStages = ['Cover', 'Contextualization', 'Identification', 'Navigation', 'Argumentation', 'Resolution', 'Application', 'Introspection'];
  const result = facts({
    students: [
      student('uid-private-1', [{
        comicId: 1,
        percentage: 100,
        status: 'completed',
        completedStages: completeStages,
        assessmentScores: [{ type: 'quiz', score: 80 }],
      }]),
      student('uid-private-2'),
      student('uid-private-3', [{ comicId: 1, percentage: 0, status: 'not_started' }]),
    ],
    comics: [{
      comicId: 1,
      title: 'Komik 1',
      stages: ['Contextualization', 'Identification', 'Navigation', 'Argumentation', 'Resolution', 'Application', 'Introspection'],
    }],
  });
  assert.equal(result.scope.studentCount, 3);
  assert.equal(result.summary.averageRecordedProgress, 50);
  assert.equal(result.summary.recordedProgressCount, 2);
  assert.equal(result.summary.studentsStarted, 1);
  assert.equal(result.summary.studentsCompletedAnyComic, 1);
  assert.equal(result.comics[0].studentsCompleted, 1);
  assert.equal(result.comics[0].studentsStarted, 1);
  assert.equal(result.comics[0].progressRecordCount, 2);
  assert.equal(result.comics[0].stages.find((stage) => stage.name === 'Identification')?.denominator, 3);
  assert.equal(result.assessments.find((assessment) => assessment.type === 'quiz')?.averageScore, 80);
});

test('difficulty frequencies ignore answers without a saved answer key', () => {
  const result = facts({
    comics: [{ comicId: 2, title: 'Komik Dua', stages: ['Identification'] }],
    answers: [
      { userId: 'u1', comicId: 2, step: 0, selectedAnswer: 'A', correctAnswer: 'B', question: 'Bentuk atap', recordedAt: '2026-10-29T10:00:00.000Z' },
      { userId: 'u2', comicId: 2, step: 0, selectedAnswer: 'b', correctAnswer: 'B', question: 'Bentuk atap', recordedAt: '2026-10-29T11:00:00.000Z' },
      { userId: 'u3', comicId: 2, step: 1, selectedAnswer: 'C', correctAnswer: null, question: 'Bangun datar', recordedAt: null },
    ],
  });
  assert.equal(result.difficulties.length, 1);
  assert.equal(result.difficulties[0].incorrectCount, 1);
  assert.equal(result.difficulties[0].judgedAnswerCount, 2);
  assert.equal(result.historyPeriod.from, '2026-10-29T10:00:00.000Z');
});

test('attention list requires multiple independent indicators and uses measured evidence', () => {
  const result = facts({
    students: [
      student('only-one-signal', [
        { comicId: 1, percentage: 20, status: 'in_progress' },
        { comicId: 2, percentage: 30, status: 'in_progress' },
      ]),
      student('two-signals', [
        { comicId: 1, percentage: 20, status: 'in_progress', updatedAt: '2026-10-01T10:00:00.000Z' },
        { comicId: 2, percentage: 30, status: 'in_progress', updatedAt: '2026-10-01T10:00:00.000Z' },
      ]),
    ],
    answers: [
      { userId: 'two-signals', comicId: 1, step: 0, selectedAnswer: 'A', correctAnswer: 'B', question: 'Q', recordedAt: null },
      { userId: 'two-signals', comicId: 1, step: 1, selectedAnswer: 'A', correctAnswer: 'B', question: 'Q2', recordedAt: null },
    ],
  });
  assert.equal(result.attentionStudents.length, 1);
  assert.equal(result.attentionStudents[0].uid, 'two-signals');
  assert.ok(result.attentionStudents[0].reasons.length >= 2);
});

test('activity series uses stored timestamps and is not named progress history', () => {
  const result = facts({
    activities: [{
      userId: 'student-1',
      type: 'lesson_completed',
      comicId: 1,
      occurredAt: '2026-10-29T10:00:00.000Z',
    }],
  });
  assert.equal(result.activityByWeek.reduce((sum, week) => sum + week.eventCount, 0), 1);
  assert.equal(result.scope.activityRecords, 1);
  assert.equal(result.scope.learningActivityRecords, 1);
});

test('class aggregates cover the complete roster and anonymize most-active student counts for AI', () => {
  const students = Array.from({ length: 201 }, (_, index) => student(`uid-${index}`));
  students[0] = student('uid-0', [
    { comicId: 1, percentage: 10, status: 'in_progress' },
    { comicId: 2, percentage: 20, status: 'in_progress' },
  ]);
  const result = facts({
    students,
    activities: [
      ...Array.from({ length: 5 }, (_, index) => ({
        userId: 'uid-0',
        type: 'lesson_started',
        comicId: 1,
        occurredAt: `2026-10-${String(25 + index).padStart(2, '0')}T10:00:00.000Z`,
      })),
      {
        userId: 'uid-1',
        type: 'comic_completed',
        comicId: 2,
        occurredAt: '2026-10-29T10:00:00.000Z',
      },
    ],
  });
  const prompt = buildClassInsightPrompt(result);

  assert.equal(result.scope.studentCount, 201);
  assert.equal(result.summary.studentsWithNoRecordedProgress, 200);
  assert.equal(result.summary.studentsWithLowRecordedProgress, 1);
  assert.equal(result.summary.studentsWithLearningActivity, 2);
  assert.deepEqual(result.mostActiveStudents.map(({ eventCount }) => eventCount), [5, 1]);
  assert.match(prompt, /"totalStudents":201/);
  assert.match(prompt, /"withLowRecordedProgress":1/);
  assert.match(prompt, /"mostActiveStudentEventCounts":\[5,1\]/);
  assert.ok(!prompt.includes('uid-0'));
  assert.ok(!prompt.includes('Nama privat'));
  assert.ok(prompt.length < 12000);
});

test('non-learning events are not presented as learning activity', () => {
  const result = facts({
    activities: [{
      userId: 'student-1',
      type: 'login',
      comicId: null,
      occurredAt: '2026-10-29T10:00:00.000Z',
    }],
  });
  assert.equal(result.scope.activityRecords, 1);
  assert.equal(result.scope.learningActivityRecords, 0);
  assert.equal(result.activityByWeek.reduce((sum, week) => sum + week.eventCount, 0), 0);
  assert.ok(result.limitations.some((item) => item.includes('event aktivitas belajar')));
});

test('AI prompt contains bounded aggregates only, with no student identifiers or names', () => {
  const result = facts({
    students: [student('uid-must-not-leak', [{ comicId: 1, percentage: 50 }])],
    comics: [{ comicId: 1, title: 'Komik 1', stages: ['Identification'] }],
  });
  const prompt = buildClassInsightPrompt(result);
  assert.ok(prompt.length < 12000);
  assert.ok(!prompt.includes('uid-must-not-leak'));
  assert.ok(!prompt.includes('Nama privat'));
  assert.ok(!prompt.includes('email'));
});

test('AI response parser accepts bounded response shape and rejects malformed output', () => {
  assert.deepEqual(
    parseClassInsightResponse('{"interpretation":"Perlu ditinjau.","recommendations":["Coba latihan berpasangan."],"limitations":[]}'),
    {
      interpretation: 'Perlu ditinjau.',
      recommendations: ['Coba latihan berpasangan.'],
      limitations: [],
    }
  );
  assert.equal(parseClassInsightResponse('not JSON'), null);
  assert.equal(parseClassInsightResponse('{"interpretation":"ok","recommendations":"not-list","limitations":[]}'), null);
});
