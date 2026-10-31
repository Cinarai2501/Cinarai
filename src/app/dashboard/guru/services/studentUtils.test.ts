import test from 'node:test';
import assert from 'node:assert/strict';
import type { ComicProgressDocument, UserDocument } from '@/types/firestore';
import { normalizeComicProgressDocuments, normalizeStudentDocuments } from './studentNormalization';
import { buildDashboardSummary, filterAndSortStudents, getStudentLearningStatus } from './studentUtils';
import { getModuleStudentStatus, isModuleProgressComplete } from './progressStatus';
import type { StudentRow } from '../types';
import { SINTAKS } from '@/types/progress';

function student(uid: string, options: Partial<StudentRow> = {}): StudentRow {
  return {
    uid,
    displayName: uid,
    email: `${uid}@example.test`,
    photoURL: null,
    schoolName: 'Sekolah A',
    classLevel: null,
    gradeLevel: null,
    isActive: true,
    progressList: [],
    averageProgress: 0,
    completedComics: 0,
    lastActivity: 'Belum ada aktivitas',
    ...options,
  };
}

test('keeps distinct Firebase UIDs even when emails match', () => {
  const users: UserDocument[] = [
    { uid: 'student-a', email: 'same@example.test', role: 'student', isActive: true },
    { uid: 'student-b', email: 'SAME@example.test', role: 'student', isActive: true },
  ];

  assert.deepEqual(normalizeStudentDocuments(users).map(({ uid }) => uid), ['student-a', 'student-b']);
});

test('does not infer module completion from a 100% percentage alone', () => {
  const progress = normalizeComicProgressDocuments('student-a', [{
    id: 'comic-1',
    comicId: 1,
    percentage: 100,
    status: 'in_progress',
    currentStage: 'Orientasi',
    sintaksList: [],
  }]);

  assert.equal(progress[0].percentage, 0);
  assert.equal(progress[0].status, 'in_progress');
  assert.equal(getStudentLearningStatus(student('student-a', { progressList: progress }), 6), 'attention');
  assert.equal(isModuleProgressComplete(progress[0]), false);
});

test('only Cover completion is learning progress, not module completion', () => {
  const [progress] = normalizeComicProgressDocuments('student-cover', [{
    id: 'comic-1',
    comicId: 1,
    status: 'completed',
    percentage: 100,
    completedStages: ['Cover'],
  }]);

  assert.equal(progress.status, 'in_progress');
  assert.equal(progress.percentage, 12.5);
  assert.equal(getModuleStudentStatus(progress), 'learning');
  assert.equal(isModuleProgressComplete(progress), false);
});

test('some required stages completed stays in progress and records measured percentage', () => {
  const [progress] = normalizeComicProgressDocuments('student-partial', [{
    id: 'comic-2',
    comicId: 2,
    status: 'completed',
    percentage: 100,
    completedStages: ['Cover', 'Contextualization', 'Identification'],
  }]);

  assert.equal(progress.status, 'in_progress');
  assert.equal(progress.percentage, 37.5);
  assert.equal(getModuleStudentStatus(progress), 'learning');
  assert.equal(isModuleProgressComplete(progress), false);
});

test('all required learning-engine stages are required for completion', () => {
  const documents = normalizeComicProgressDocuments('student-finished', [{
    id: 'comic-3',
    comicId: 3,
    status: 'in_progress',
    completedStages: [...SINTAKS],
  }]);

  assert.equal(documents[0].status, 'completed');
  assert.equal(documents[0].percentage, 100);
  assert.equal(isModuleProgressComplete(documents[0]), true);
});

test('stored completed status without complete-stage evidence is not trusted', () => {
  const [progress] = normalizeComicProgressDocuments('student-stale', [{
    id: 'comic-4',
    comicId: 4,
    status: 'completed',
    percentage: 100,
    sintaksList: [],
  }]);

  assert.equal(progress.status, 'in_progress');
  assert.equal(progress.percentage, 0);
  assert.equal(isModuleProgressComplete(progress), false);

  const [unmarkedProgress] = normalizeComicProgressDocuments('student-unmarked', [{
    id: 'comic-4',
    comicId: 4,
    status: 'completed',
    percentage: 100,
  }]);
  assert.equal(unmarkedProgress.status, 'in_progress');
  assert.equal(unmarkedProgress.percentage, 0);
});

test('empty progress remains unavailable and invalid status is not learning evidence', () => {
  assert.deepEqual(normalizeComicProgressDocuments('student-empty', []), []);
  const [progress] = normalizeComicProgressDocuments('student-invalid', [{
    id: 'comic-5',
    comicId: 5,
    status: 'finished',
    percentage: 0,
    currentStage: 'not-a-stage',
    sintaksList: [{ sintaks: 'not-a-stage', status: 'COMPLETED' }],
  }]);

  assert.equal(progress.status, 'not_started');
  assert.equal(progress.percentage, 0);
  assert.equal(getModuleStudentStatus(progress), 'not_started');
});

test('filters by class and status and sorts with UID as a stable tie-breaker', () => {
  const rows = [
    student('student-b', {
      displayName: 'Ayu',
      classLevel: 'Kelas IV',
      progressList: [{ comicId: 1, completedStage: '', completedPages: 0, percentage: 10, status: 'in_progress', sintaksList: [], updatedAt: {} as ComicProgressDocument['updatedAt'] }],
      averageProgress: 10,
    }),
    student('student-a', {
      displayName: 'Ayu',
      classLevel: 'Kelas IV',
      progressList: [{ comicId: 1, completedStage: '', completedPages: 0, percentage: 10, status: 'in_progress', sintaksList: [], updatedAt: {} as ComicProgressDocument['updatedAt'] }],
      averageProgress: 10,
    }),
    student('student-c', { classLevel: 'Kelas VI' }),
  ];

  const result = filterAndSortStudents(rows, {
    search: 'kelas iv',
    status: 'attention',
    sortKey: 'name',
    sortDir: 'asc',
    totalComics: 6,
  });
  assert.deepEqual(result.map(({ uid }) => uid), ['student-a', 'student-b']);
});

test('marks a student complete only when all expected comic records are completed', () => {
  const completed = student('student-complete', {
    progressList: Array.from({ length: 6 }, (_, index) => ({
      comicId: index + 1,
      completedStage: 'Introspection',
      completedPages: 0,
      percentage: 100,
      status: 'completed' as const,
      completedStages: [...SINTAKS],
      sintaksList: [],
      updatedAt: {} as ComicProgressDocument['updatedAt'],
    })),
    completedComics: 6,
  });
  const partial = student('student-partial', {
    progressList: [{
      comicId: 1,
      completedStage: '',
      completedPages: 0,
      percentage: 100,
      status: 'completed',
      completedStages: [],
      sintaksList: [],
      updatedAt: {} as ComicProgressDocument['updatedAt'],
    }],
    averageProgress: 100,
  });

  assert.equal(getStudentLearningStatus(completed, 6), 'completed');
  assert.equal(getStudentLearningStatus(partial, 6), 'learning');
  assert.equal(getStudentLearningStatus(student('student-empty'), 6), 'not_started');
});

test('classifies no-data, learning, attention and completion consistently in filters and statistics', () => {
  const noData = student('no-data');
  const learning = student('learning', {
    progressList: [{
      comicId: 1,
      completedStage: 'Identification',
      completedPages: 0,
      percentage: 50,
      status: 'in_progress',
      completedStages: ['Cover', 'Contextualization', 'Identification'],
      sintaksList: [],
      updatedAt: {} as ComicProgressDocument['updatedAt'],
    }],
    averageProgress: 50,
  });
  const attention = student('attention', {
    progressList: [{
      comicId: 1,
      completedStage: '',
      completedPages: 0,
      percentage: 12.5,
      status: 'in_progress',
      completedStages: ['Cover'],
      sintaksList: [],
      updatedAt: {} as ComicProgressDocument['updatedAt'],
    }],
    averageProgress: 12.5,
  });
  const rows = [noData, learning, attention];

  assert.deepEqual(rows.map((row) => getStudentLearningStatus(row, 6)), [
    'not_started',
    'learning',
    'attention',
  ]);
  assert.equal(filterAndSortStudents(rows, {
    search: '',
    status: 'not_started',
    sortKey: 'name',
    sortDir: 'asc',
    totalComics: 6,
  }).length, 1);
  assert.equal(filterAndSortStudents(rows, {
    search: '',
    status: 'attention',
    sortKey: 'name',
    sortDir: 'asc',
    totalComics: 6,
  }).length, 1);
  const summary = buildDashboardSummary(rows, 6);
  assert.equal(summary.notStartedStudents, 1);
  assert.equal(summary.attentionStudents, 1);
  assert.equal(summary.activeStudents, 2);
});

test('searches email and sorts by completed comics', () => {
  const rows = [
    student('student-a', { email: 'ayu@example.test', completedComics: 2 }),
    student('student-b', { email: 'budi@example.test', completedComics: 5 }),
  ];
  const result = filterAndSortStudents(rows, {
    search: 'ayu@example',
    status: 'all',
    sortKey: 'completed',
    sortDir: 'desc',
    totalComics: 6,
  });

  assert.deepEqual(result.map(({ uid }) => uid), ['student-a']);
});

test('excludes unavailable progress records from the recorded-progress average', () => {
  const progress = [{
    comicId: 1,
    completedStage: '',
    completedPages: 0,
    percentage: 80,
    status: 'in_progress' as const,
    sintaksList: [],
    updatedAt: {} as ComicProgressDocument['updatedAt'],
  }];
  const summary = buildDashboardSummary([
    student('student-with-data', { progressList: progress, averageProgress: 80 }),
    student('student-without-data'),
  ], 6);

  assert.equal(summary.totalStudents, 2);
  assert.equal(summary.averageProgress, 80);
});
