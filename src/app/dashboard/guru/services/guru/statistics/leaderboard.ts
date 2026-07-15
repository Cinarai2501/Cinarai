'use client';

import type { ActivityDocument, ComicProgressDocument, ReflectionDocument, UserDocument } from '@/types/firestore';

export type LeaderboardRow = {
  userId: string;
  displayName: string;
  score: number;
  progress: number;
  consistency: number;
};

export type AttentionRow = {
  userId: string;
  displayName: string;
  reason: string;
};

function toLocalDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}

export function buildLeaderboard(
  students: UserDocument[],
  activityDocuments: ActivityDocument[],
  progressDocuments: ComicProgressDocument[],
  reflections: ReflectionDocument[],
  selectedClassId: string,
  selectedModuleId: number | 'all'
): {
  topProgress: LeaderboardRow[];
  topScore: LeaderboardRow[];
  topConsistency: LeaderboardRow[];
} {
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

  const userStats = filteredStudents.map((student) => {
    const studentProgress = progressDocuments.filter(
      (document) => document.userId === student.uid && (selectedModuleId === 'all' || document.comicId === selectedModuleId)
    );
    const averageProgress = studentProgress.length
      ? Math.round(
          studentProgress.reduce((sum, document) => sum + (document.percentage ?? 0), 0) / studentProgress.length
        )
      : 0;

    const latestReflection = reflections
      .filter((reflection) => reflection.userId === student.uid || reflection.studentId === student.uid)
      .sort((left, right) => {
        const leftTime = toLocalDate(left.submittedAt)?.getTime() ?? 0;
        const rightTime = toLocalDate(right.submittedAt)?.getTime() ?? 0;
        return rightTime - leftTime;
      })[0];

    const score = latestReflection?.rating != null
      ? Math.round((latestReflection.rating ?? 0) * 20)
      : averageProgress;

    const consistency = activityDocuments.filter((activity) => activity.userId === student.uid).length;

    return {
      userId: student.uid,
      displayName: student.displayName ?? student.email ?? 'Siswa',
      score,
      progress: averageProgress,
      consistency,
    };
  });

  const topProgress = [...userStats]
    .sort((left, right) => right.progress - left.progress || right.score - left.score)
    .slice(0, 5);

  const topScore = [...userStats]
    .sort((left, right) => right.score - left.score || right.progress - left.progress)
    .slice(0, 5);

  const topConsistency = [...userStats]
    .sort((left, right) => right.consistency - left.consistency || right.progress - left.progress)
    .slice(0, 5);

  return { topProgress, topScore, topConsistency };
}

export function buildAttentionLists(
  students: UserDocument[],
  activityDocuments: ActivityDocument[],
  progressDocuments: ComicProgressDocument[],
  reflections: ReflectionDocument[],
  selectedClassId: string,
  selectedModuleId: number | 'all'
): {
  inactive: AttentionRow[];
  lowProgress: AttentionRow[];
  notCompleted: AttentionRow[];
  noReflection: AttentionRow[];
} {
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

  const activityCountByStudent = new Map<string, number>();
  activityDocuments.forEach((activity) => {
    if (!studentIds.has(activity.userId)) return;
    activityCountByStudent.set(activity.userId, (activityCountByStudent.get(activity.userId) ?? 0) + 1);
  });

  const progressByStudent = new Map<string, ComicProgressDocument[]>();
  progressDocuments.forEach((document) => {
    const userId = document.userId ?? '';
    if (!studentIds.has(userId)) return;
    if (selectedModuleId !== 'all' && document.comicId !== selectedModuleId) return;
    const list = progressByStudent.get(userId) ?? [];
    list.push(document);
    progressByStudent.set(userId, list);
  });

  const reflectionsByStudent = new Map<string, ReflectionDocument[]>();
  reflections.forEach((reflection) => {
    const userId = reflection.userId ?? reflection.studentId ?? '';
    if (!studentIds.has(userId)) return;
    const existing = reflectionsByStudent.get(userId) ?? [];
    existing.push(reflection);
    reflectionsByStudent.set(userId, existing);
  });

  const inactive = filteredStudents
    .filter((student) => !student.isActive)
    .slice(0, 5)
    .map((student) => ({ userId: student.uid, displayName: student.displayName ?? student.email ?? 'Siswa', reason: 'Belum aktif' }));

  const lowProgress = [...studentIds].map((uid) => {
    const student = filteredStudents.find((item) => item.uid === uid);
    const documents = progressByStudent.get(uid) ?? [];
    const average = documents.length
      ? Math.round(documents.reduce((sum, document) => sum + (document.percentage ?? 0), 0) / documents.length)
      : 0;
    return {
      userId: uid,
      displayName: student?.displayName ?? student?.email ?? 'Siswa',
      average,
    };
  })
    .sort((left, right) => left.average - right.average)
    .slice(0, 5)
    .map((item) => ({ userId: item.userId, displayName: item.displayName, reason: `Progress rendah (${item.average}%)` }));

  const notCompleted = [...filteredStudents]
    .map((student) => {
      const documents = progressByStudent.get(student.uid) ?? [];
      const incompleteCount = documents.filter((document) => document.status !== 'completed').length;
      return { student, incompleteCount };
    })
    .sort((left, right) => right.incompleteCount - left.incompleteCount)
    .slice(0, 5)
    .map((item) => ({ userId: item.student.uid, displayName: item.student.displayName ?? item.student.email ?? 'Siswa', reason: `Belum menyelesaikan ${item.incompleteCount} modul` }));

  const noReflection = filteredStudents
    .filter((student) => !reflectionsByStudent.has(student.uid))
    .slice(0, 5)
    .map((student) => ({ userId: student.uid, displayName: student.displayName ?? student.email ?? 'Siswa', reason: 'Belum mengisi refleksi' }));

  return {
    inactive,
    lowProgress,
    notCompleted,
    noReflection,
  };
}
