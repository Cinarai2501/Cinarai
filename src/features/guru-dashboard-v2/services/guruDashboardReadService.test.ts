import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePercentage } from '@/lib/progressEngine';
import { SINTAKS } from '@/types/progress';
import {
  buildGuruStudentSummary,
  deduplicateGuruIdentificationAnswers,
  deduplicateGuruReflections,
  normalizeGuruComicProgress,
  normalizeGuruEvaluation,
  normalizeGuruTimestamp,
  settleGuruSources,
} from './guruDashboardReadService';

function v2Progress(overrides: Record<string, unknown> = {}) {
  return {
    id: 'comic-1',
    comicId: 1,
    currentStage: 'Identification',
    completedStages: ['Cover', 'Contextualization'],
    ...overrides,
  };
}

function gradedEvaluation(totalScore: number) {
  return {
    id: 'evaluation-cinarai',
    evaluationCinarai: {
      completed: true,
      submittedAt: { seconds: 1_798_000_000, nanoseconds: 0 },
      grading: {
        status: 'graded',
        challengeScores: Object.fromEntries(
          Array.from({ length: 10 }, (_, index) => [`challenge${index + 1}`, 0])
        ),
        totalScore,
        gradedBy: 'teacher-1',
        gradedAt: { seconds: 1_798_000_100, nanoseconds: 0 },
        rubricVersion: 'cinarai-0-4-v1',
      },
    },
  };
}

test('normalizes partial V2 progress using the shared stage list and percentage helper', () => {
  const progress = normalizeGuruComicProgress('student-1', v2Progress());

  assert.ok(progress);
  assert.equal(progress.format, 'v2');
  assert.deepEqual(progress.stored.completedStages, ['Cover', 'Contextualization']);
  assert.deepEqual(progress.percentage, {
    value: calculatePercentage(2),
    origin: 'derived',
  });
  assert.equal(progress.status, 'in_progress');
  assert.equal(progress.stages.find((stage) => stage.stage === 'Identification')?.status, 'current');
});

test('normalizes completed V2 progress with a derived 100 percent value', () => {
  const progress = normalizeGuruComicProgress('student-1', v2Progress({
    currentStage: 'Introspection',
    completedStages: [...SINTAKS],
  }));

  assert.ok(progress);
  assert.equal(progress.percentage.value, 100);
  assert.equal(progress.percentage.origin, 'derived');
  assert.equal(progress.status, 'completed');
});

test('uses verified legacy fields without treating absent values as zero', () => {
  const sintaksList = SINTAKS.map((sintaks, index) => ({
    sintaks,
    status: index === 0 ? 'COMPLETED' : index === 1 ? 'CURRENT' : 'LOCKED',
  }));
  const progress = normalizeGuruComicProgress('student-1', {
    id: 'comic-2',
    comicId: 2,
    sintaksList,
  });

  assert.ok(progress);
  assert.equal(progress.format, 'legacy');
  assert.deepEqual(progress.percentage, {
    value: calculatePercentage(1),
    origin: 'derived',
  });
  assert.equal(progress.status, 'in_progress');
});

test('does not fabricate progress when the document is missing or lacks supported fields', () => {
  assert.equal(normalizeGuruComicProgress('student-1', {
    id: 'legacy-extra',
    comicId: 3,
    stageData: { quiz: { score: 0 } },
  })?.percentage.value, null);
  assert.equal(normalizeGuruComicProgress('student-1', {
    id: 'evaluation-cinarai',
    evaluationCinarai: {},
  }), null);

  const noProgress = buildGuruStudentSummary({ id: 'student-1' }, { comics: [], identificationAnswers: [] });
  const notLoaded = buildGuruStudentSummary({ id: 'student-1' });
  const failed = buildGuruStudentSummary({ id: 'student-1' }, null, true);
  assert.equal(noProgress.progress.state, 'not_started');
  assert.equal(notLoaded.progress.state, 'not_loaded');
  assert.equal(failed.progress.state, 'unavailable');
});

test('preserves zero as a stored or derived metric and null as unavailable', () => {
  const zeroProgress = normalizeGuruComicProgress('student-1', v2Progress({
    currentStage: 'Cover',
    completedStages: [],
  }));
  const unavailableProgress = normalizeGuruComicProgress('student-1', {
    id: 'comic-2',
    comicId: 2,
    status: 'not_started',
  });

  assert.deepEqual(zeroProgress?.percentage, { value: 0, origin: 'derived' });
  assert.deepEqual(unavailableProgress?.percentage, { value: null, origin: 'unavailable' });
});

test('normalizes an incomplete CINARAI evaluation as a draft', () => {
  const evaluation = normalizeGuruEvaluation('student-1', {
    id: 'evaluation-cinarai',
    evaluationCinarai: { completed: false, answers: {} },
  });

  assert.equal(evaluation.status, 'draft');
  assert.equal(evaluation.completed, false);
  assert.deepEqual(evaluation.teacherRubricTotal, { value: null, origin: 'unavailable' });
});

test('normalizes a completed evaluation without a grade as awaiting grading', () => {
  const evaluation = normalizeGuruEvaluation('student-1', {
    id: 'evaluation-cinarai',
    evaluationCinarai: { completed: true, answers: {} },
  });

  assert.equal(evaluation.status, 'awaiting_grading');
  assert.equal(evaluation.gradingStatus, 'pending');
  assert.equal(evaluation.teacherRubricTotal.value, null);
});

test('accepts a valid teacher rubric grade of zero', () => {
  const evaluation = normalizeGuruEvaluation('student-1', gradedEvaluation(0));

  assert.equal(evaluation.status, 'graded');
  assert.equal(evaluation.gradingStatus, 'graded');
  assert.deepEqual(evaluation.teacherRubricTotal, { value: 0, origin: 'stored' });
});

test('distinguishes a missing evaluation document from an invalid evaluation', () => {
  assert.equal(normalizeGuruEvaluation('student-1', null).status, 'not_found');
  assert.equal(normalizeGuruEvaluation('student-1', {
    id: 'evaluation-cinarai',
    evaluationCinarai: { completed: 'yes' },
  }).status, 'invalid');
  assert.equal(normalizeGuruEvaluation('student-1', {
    ...gradedEvaluation(0),
    evaluationCinarai: {
      ...gradedEvaluation(0).evaluationCinarai,
      grading: { status: 'graded', totalScore: 0 },
    },
  }).status, 'invalid');
});

test('represents missing and malformed timestamps separately', () => {
  assert.deepEqual(normalizeGuruTimestamp(undefined), {
    status: 'unavailable',
    reason: 'missing',
  });
  assert.deepEqual(normalizeGuruTimestamp('not-a-timestamp'), {
    status: 'unavailable',
    reason: 'invalid',
  });
  assert.deepEqual(normalizeGuruTimestamp({ seconds: 5, nanoseconds: 1e9 }), {
    status: 'unavailable',
    reason: 'invalid',
  });
  assert.equal(normalizeGuruTimestamp({ seconds: 5, nanoseconds: 0 }).status, 'valid');
});

test('deduplicates identification answers and lets explicit records override stale stage snapshots', () => {
  const answers = deduplicateGuruIdentificationAnswers(
    'student-1',
    [{
      id: 'comic-1',
      comicId: 1,
      currentStage: 'Identification',
      completedStages: [],
      updatedAt: { seconds: 10, nanoseconds: 0 },
      stageData: {
        identification: {
          answers: [{ step: 0, selectedAnswer: 'stale answer', reason: 'old reason' }],
        },
      },
    }],
    [
      {
        id: 'student-1_1_0',
        userId: 'student-1',
        comicId: 1,
        step: 0,
        selectedAnswer: null,
        updatedAt: { seconds: 5, nanoseconds: 0 },
      },
      {
        id: 'student-1_1_1',
        userId: 'student-1',
        comicId: 1,
        step: 1,
        selectedAnswer: 'answer one',
      },
    ]
  );

  assert.equal(answers.length, 2);
  assert.equal(answers[0].answer, null);
  assert.equal(answers[0].origin, 'identification_answers');
  assert.equal(answers[1].answer, 'answer one');
});

test('deduplicates two reflection queries by document ID and excludes drafts or observations', () => {
  const reflection = {
    id: 'student-1_1_introspection',
    userId: 'student-1',
    studentId: 'student-1',
    comicId: '1',
    stage: 'introspection',
    status: 'completed',
    reflectionText: 'Final reflection',
  };
  const reflections = deduplicateGuruReflections('student-1', [
    reflection,
    reflection,
    { ...reflection, id: 'student-1_1_observasi', stage: 'observasi' },
    { ...reflection, id: 'other_draft', stage: 'introspection', status: 'draft' },
  ]);

  assert.equal(reflections.length, 1);
  assert.equal(reflections[0].id, 'student-1_1_introspection');
  assert.equal(reflections[0].comicId, 1);
});

test('keeps successful source data when another independent read fails', async () => {
  const reads = await settleGuruSources({
    progress: Promise.resolve([{ id: 'comic-1' }]),
    identification: Promise.reject({ code: 'unavailable' }),
  });

  assert.equal(reads.status, 'partial');
  assert.deepEqual(reads.sources.progress.data, [{ id: 'comic-1' }]);
  assert.equal(reads.sources.progress.status, 'available');
  assert.equal(reads.sources.identification.status, 'error');
  assert.equal(reads.sources.identification.error?.code, 'unavailable');
});

test('does not use quiz or AI feedback scores as comic progress or teacher rubric grades', () => {
  const progress = normalizeGuruComicProgress('student-1', {
    id: 'comic-5',
    comicId: 5,
    stageData: {
      quiz: { score: 0, completed: true },
      argumentation: { score: 5, feedback: { score: 5 } },
      application: { score: 1 },
    },
  });
  const evaluation = normalizeGuruEvaluation('student-1', {
    id: 'evaluation-cinarai',
    evaluationCinarai: { completed: true, answers: {} },
  });

  assert.equal(progress?.percentage.value, null);
  assert.equal(progress?.status, 'unknown');
  assert.equal(evaluation.teacherRubricTotal.value, null);
  assert.equal(evaluation.status, 'awaiting_grading');
});
