'use client';

import type {
  ActivityDocument,
  ApplicationActivityDocument,
  ComicDocument,
  ComicProgressDocument,
  IdentificationAnswerDocument,
  ReflectionDocument,
  UserDocument,
} from '@/types/firestore';
import { getFirestoreCollection, queryFirestoreCollection } from '@/services/firestore';
import { loadAllProgressDocuments } from '../dashboard/guruDashboardFirestore';

export type StatisticsDateRange = 'today' | '7days' | '30days' | 'semester' | 'all';

type DashboardQueryMeta = {
  collection: string;
  path: string;
  where?: string;
  orderBy?: string;
  limit?: string;
};

async function executeDashboardQuery<T>(
  _meta: DashboardQueryMeta,
  queryFn: () => Promise<T[]>
): Promise<{ documents: T[]; error: Error | null }> {
  try {
    const documents = await queryFn();
    return { documents, error: null };
  } catch (error) {
    return {
      documents: [],
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export type StatisticsFilter = {
  classId: string;
  moduleId: number | 'all';
  range: StatisticsDateRange;
};

export type StatisticsClassOption = { id: string; label: string };
export type StatisticsModuleOption = { id: number | 'all'; label: string };
export type StatisticsTimeOption = { id: StatisticsDateRange; label: string };

export type StatisticsSourceData = {
  students: UserDocument[];
  comics: ComicDocument[];
  progressDocuments: ComicProgressDocument[];
  activities: ActivityDocument[];
  reflections: ReflectionDocument[];
  identificationAnswers: IdentificationAnswerDocument[];
  applicationActivities: ApplicationActivityDocument[];
};

export type StatisticsOverview = {
  totalStudents: number;
  activeStudents: number;
  averageProgress: number;
  averageScore: number;
  reflectionsSubmitted: number;
  totalAIUses: number;
};

export function buildStatisticsOverview(
  students: UserDocument[],
  progressDocuments: ComicProgressDocument[],
  reflections: ReflectionDocument[],
  identificationAnswers: IdentificationAnswerDocument[],
  applicationActivities: ApplicationActivityDocument[],
  selectedClassId: string,
  selectedModuleId: number | 'all'
): StatisticsOverview {
  const filteredStudents = selectedClassId === 'all'
    ? students
    : students.filter((student) => {
        const label = student.schoolName
          ? student.schoolName
          : student.gradeLevel
          ? `Kelas ${student.gradeLevel}`
          : 'Tanpa kelas';
        return label === selectedClassId;
      });

  const studentIds = new Set(filteredStudents.map((student) => student.uid));

  const filteredProgress = progressDocuments.filter(
    (document) => studentIds.has(document.userId ?? '') && (selectedModuleId === 'all' || document.comicId === selectedModuleId)
  );

  const progressValues = filteredProgress.map((document) => document.percentage ?? 0);
  const averageProgress = progressValues.length
    ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length)
    : 0;

  const reflectionCounts = reflections.filter(
    (reflection) => studentIds.has(reflection.userId ?? reflection.studentId ?? '')
  ).length;

  const aiUses = new Set(
    identificationAnswers
      .filter((answer) => studentIds.has(answer.userId) && answer.aiTutorUsed)
      .map((answer) => `${answer.userId}-${answer.comicId}-${answer.step}`)
  ).size
    + applicationActivities.filter((activity) => studentIds.has(activity.userId)).length;

  const averageScore = filteredProgress.length
    ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / filteredProgress.length)
    : 0;

  return {
    totalStudents: filteredStudents.length,
    activeStudents: filteredStudents.filter((student) => student.isActive).length,
    averageProgress,
    averageScore,
    reflectionsSubmitted: reflectionCounts,
    totalAIUses: aiUses,
  };
}

let cachedStatisticsSourceData: StatisticsSourceData | null = null;
let cachedStatisticsSourceDataPromise: Promise<StatisticsSourceData> | null = null;

export async function loadStatisticsOverviewData(
  options?: { forceRefresh?: boolean }
): Promise<StatisticsSourceData> {
  if (!options?.forceRefresh && cachedStatisticsSourceData) {
    return cachedStatisticsSourceData;
  }

  if (!options?.forceRefresh && cachedStatisticsSourceDataPromise) {
    return cachedStatisticsSourceDataPromise;
  }

  const queryPromises = [
    executeDashboardQuery(
      { collection: 'users', path: '/users', where: 'none', orderBy: 'none', limit: 'none' },
      () => getFirestoreCollection('users')
    ),
    executeDashboardQuery(
      { collection: 'comics', path: '/comics', where: 'none', orderBy: 'none', limit: 'none' },
      () => getFirestoreCollection('comics')
    ),
    executeDashboardQuery(
      { collection: 'progress', path: '/users/{uid}/progress (collectionGroup)', where: 'none', orderBy: 'none', limit: 'none' },
      () => loadAllProgressDocuments()
    ),
    executeDashboardQuery(
      { collection: 'activity', path: '/activity', where: 'none', orderBy: 'occurredAt desc', limit: 'none' },
      () => queryFirestoreCollection('activity', {
        orderByField: 'occurredAt',
        orderDirection: 'desc',
      })
    ),
    executeDashboardQuery(
      { collection: 'reflection', path: '/reflection', where: 'none', orderBy: 'none', limit: 'none' },
      () => getFirestoreCollection('reflection')
    ),
    executeDashboardQuery(
      { collection: 'identification_answers', path: '/identification_answers', where: 'none', orderBy: 'none', limit: 'none' },
      () => getFirestoreCollection('identification_answers')
    ),
    executeDashboardQuery(
      { collection: 'application_activity', path: '/application_activity', where: 'none', orderBy: 'none', limit: 'none' },
      () => getFirestoreCollection('application_activity')
    ),
  ];

  const results = await Promise.allSettled(queryPromises);

  const [usersResult, comicsResult, progressResult, activitiesResult, reflectionsResult, identificationAnswersResult, applicationActivitiesResult] =
    results.map((settled) => {
      if (settled.status === 'fulfilled') {
        return settled.value;
      }

      return { documents: [], error: settled.reason instanceof Error ? settled.reason : new Error(String(settled.reason)) };
    }) as Array<{ documents: unknown[]; error: Error | null }>;

  const users = (usersResult.documents as UserDocument[]).filter((user) => user.role === 'student');
  const comics = comicsResult.documents as ComicDocument[];
  const progressDocuments = progressResult.documents as ComicProgressDocument[];
  const activities = activitiesResult.documents as ActivityDocument[];
  const reflections = reflectionsResult.documents as ReflectionDocument[];
  const identificationAnswers = identificationAnswersResult.documents as IdentificationAnswerDocument[];
  const applicationActivities = applicationActivitiesResult.documents as ApplicationActivityDocument[];

  const errors = [
    usersResult.error,
    comicsResult.error,
    progressResult.error,
    activitiesResult.error,
    reflectionsResult.error,
    identificationAnswersResult.error,
    applicationActivitiesResult.error,
  ].filter(Boolean) as Error[];

  const result: StatisticsSourceData = {
    students: users,
    comics,
    progressDocuments,
    activities,
    reflections,
    identificationAnswers,
    applicationActivities,
  };

  if (errors.length === 0) {
    cachedStatisticsSourceData = result;
  } else {
    cachedStatisticsSourceData = null;
  }

  cachedStatisticsSourceDataPromise = null;
  return result;
}

export function buildClassOptions(students: UserDocument[]): StatisticsClassOption[] {
  const classLabels = new Map<string, string>();

  students.forEach((student) => {
    const label = student.schoolName
      ? student.schoolName
      : student.gradeLevel
      ? `Kelas ${student.gradeLevel}`
      : 'Tanpa kelas';
    classLabels.set(label, label);
  });

  const options: StatisticsClassOption[] = [{ id: 'all', label: 'Semua Kelas' }];
  classLabels.forEach((label) => {
    options.push({ id: label, label });
  });

  return options;
}

export function buildModuleOptions(comics: ComicDocument[]): StatisticsModuleOption[] {
  const options: StatisticsModuleOption[] = [{ id: 'all', label: 'Semua Modul' }];
  comics
    .slice()
    .sort((a, b) => a.comicId - b.comicId)
    .forEach((comic) => {
      options.push({ id: comic.comicId, label: comic.title });
    });

  return options;
}

export function getTimeRangeLabel(range: StatisticsDateRange): string {
  switch (range) {
    case 'today':
      return 'Hari Ini';
    case '7days':
      return '7 Hari';
    case '30days':
      return '30 Hari';
    case 'semester':
      return 'Semester';
    default:
      return 'Semua';
  }
}

export function getDateRange(range: StatisticsDateRange): { start: Date | null; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  if (range === 'all') {
    return { start: null, end };
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  switch (range) {
    case 'today':
      return { start, end };
    case '7days':
      start.setDate(start.getDate() - 6);
      return { start, end };
    case '30days':
      start.setDate(start.getDate() - 29);
      return { start, end };
    case 'semester':
      start.setDate(start.getDate() - 180);
      return { start, end };
    default:
      return { start: null, end };
  }
}

export function formatStageLabel(stage: string): string {
  if (stage === 'Navigation') return 'Navigation + AR';
  return stage;
}
