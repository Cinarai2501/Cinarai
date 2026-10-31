import assert from 'node:assert/strict';
import test from 'node:test';
import { comicModules } from '@/features/comics';
import type { ComicProgressDocument } from '@/types/firestore';
import { SINTAKS } from '@/types/progress';
import type { StudentRow } from '../types';
import {
  buildModuleBlueprint,
  getModuleRosterSummary,
  getModuleStudentStatus,
} from './moduleAnalytics';

function makeProgress(
  status: ComicProgressDocument['status'],
  percentage: number,
  completed: string[] = [],
  currentStage = 'Cover',
): ComicProgressDocument {
  return {
    comicId: 1,
    completedStage: completed[completed.length - 1] ?? '',
    completedPages: 0,
    percentage,
    status,
    sintaksList: SINTAKS.map((sintaks) => ({
      sintaks,
      status: completed.includes(sintaks) ? 'COMPLETED' : sintaks === currentStage ? 'CURRENT' : 'LOCKED',
    })),
    updatedAt: {} as ComicProgressDocument['updatedAt'],
  };
}

function makeStudent(progressList: ComicProgressDocument[]): StudentRow {
  return {
    uid: `student-${progressList.length}`,
    displayName: 'Siswa Uji',
    email: 'siswa@example.test',
    photoURL: null,
    schoolName: 'Sekolah',
    classLevel: null,
    gradeLevel: null,
    isActive: true,
    progressList,
    averageProgress: 0,
    completedComics: 0,
    lastActivity: '',
  };
}

test('initialized Cover document is not counted as started', () => {
  const initialized = makeProgress('not_started', 0);
  assert.equal(getModuleStudentStatus(initialized), 'not_started');
  assert.equal(getModuleStudentStatus({
    currentStage: 'Cover',
    completedStages: [],
    readerPage: 1,
    readerCompleted: false,
    stageData: {},
  }), 'not_started');
  assert.equal(getModuleStudentStatus({
    currentStage: 'Cover',
    completedStages: [],
    readerPage: 2,
    readerCompleted: false,
    stageData: {},
  }), 'learning');
  const summary = getModuleRosterSummary([makeStudent([initialized])], 1);
  assert.equal(summary.startedCount, 0);
  assert.equal(summary.completionRate, 0);
});

test('saved work starts learning, but 100 percent alone does not mean complete', () => {
  assert.equal(getModuleStudentStatus(makeProgress('in_progress', 20, [], 'Identification')), 'learning');
  assert.equal(getModuleStudentStatus(makeProgress('in_progress', 100, [], 'Cover')), 'learning');
  assert.equal(getModuleStudentStatus(makeProgress('completed', 10)), 'learning');
});

test('completion requires every persisted CINARAI stage and uses all roster students as denominator', () => {
  const completed = makeProgress('completed', 100, [...SINTAKS]);
  const initialized = makeProgress('not_started', 0);
  const summary = getModuleRosterSummary([
    makeStudent([completed]),
    makeStudent([initialized]),
  ], 1);
  assert.equal(getModuleStudentStatus(completed), 'completed');
  assert.equal(summary.startedCount, 1);
  assert.equal(summary.learningCount, 0);
  assert.equal(summary.completedCount, 1);
  assert.equal(summary.completionRate, 50);
});

test('missing progress and an empty roster remain distinct', () => {
  const missing = getModuleRosterSummary([makeStudent([])], 1);
  assert.equal(missing.startedCount, 0);
  assert.equal(missing.completionRate, 0);
  assert.equal(getModuleStudentStatus(null), 'not_started');
  assert.equal(getModuleRosterSummary([], 1).completionRate, null);
});

test('all six implemented modules expose stage blueprint counts from their own content', () => {
  const moduleEntries = Object.entries(comicModules);
  assert.equal(moduleEntries.length, 6);
  for (const [, module] of moduleEntries) {
    const blueprint = buildModuleBlueprint(module, new Map([['Identification', 4]]));
    assert.deepEqual(blueprint.map((stage) => stage.id), [
      'Contextualization',
      'Identification',
      'Navigation',
      'Argumentation',
      'Resolution',
      'Application',
      'Introspection',
      'Report',
    ]);
    assert.ok(blueprint.every((stage) => stage.contentCount >= 0));
    assert.equal(blueprint.find((stage) => stage.id === 'Identification')?.contentCount, module.identification.questions.length);
    assert.equal(blueprint.find((stage) => stage.id === 'Resolution')?.contentCount, module.resolution.missions.length);
    assert.equal(blueprint.find((stage) => stage.id === 'Identification')?.completedStudents, module.identification.questions.length ? 4 : null);
    assert.equal(blueprint.find((stage) => stage.id === 'Report')?.completedStudents, null);
  }
});
