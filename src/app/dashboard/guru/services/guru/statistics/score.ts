'use client';

import type { ComicProgressDocument, ReflectionDocument, UserDocument } from '@/types/firestore';

export type ScoreBucket = {
  label: string;
  count: number;
};

export type StudentScoreSummary = {
  userId: string;
  displayName: string;
  score: number;
  progress: number;
};

export function buildScoreDistribution(
  students: UserDocument[],
  reflections: ReflectionDocument[],
  progressDocuments: ComicProgressDocument[],
  selectedClassId: string,
  selectedModuleId: number | 'all'
): ScoreBucket[] {
  const buckets: ScoreBucket[] = [
    { label: '0–59', count: 0 },
    { label: '60–69', count: 0 },
    { label: '70–79', count: 0 },
    { label: '80–89', count: 0 },
    { label: '90–100', count: 0 },
  ];

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

  filteredStudents.forEach((student) => {
    const latestReflection = reflections
      .filter((reflection) => reflection.userId === student.uid || reflection.studentId === student.uid)
      .sort((left, right) => {
        const leftTime = (left.submittedAt as { toDate?: () => Date })?.toDate?.().getTime() ?? 0;
        const rightTime = (right.submittedAt as { toDate?: () => Date })?.toDate?.().getTime() ?? 0;
        return rightTime - leftTime;
      })[0];

    const studentProgress = progressDocuments.filter(
      (document) => document.userId === student.uid && (selectedModuleId === 'all' || document.comicId === selectedModuleId)
    );

    const score = latestReflection?.rating != null
      ? Math.round((latestReflection.rating ?? 0) * 20)
      : studentProgress.length
      ? Math.round(
          studentProgress.reduce((sum, document) => sum + (document.percentage ?? 0), 0) / studentProgress.length
        )
      : 0;

    const bucket = buckets.find((bucketItem) => {
      return score >= Number(bucketItem.label.split('–')[0]) && score <= Number(bucketItem.label.split('–')[1]);
    });

    if (bucket) {
      bucket.count += 1;
    }
  });

  return buckets;
}

export function buildStudentScores(
  students: UserDocument[],
  reflections: ReflectionDocument[],
  progressDocuments: ComicProgressDocument[],
  selectedClassId: string,
  selectedModuleId: number | 'all'
): StudentScoreSummary[] {
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

  return filteredStudents.map((student) => {
    const latestReflection = reflections
      .filter((reflection) => reflection.userId === student.uid || reflection.studentId === student.uid)
      .sort((left, right) => {
        const leftTime = (left.submittedAt as { toDate?: () => Date })?.toDate?.().getTime() ?? 0;
        const rightTime = (right.submittedAt as { toDate?: () => Date })?.toDate?.().getTime() ?? 0;
        return rightTime - leftTime;
      })[0];

    const studentProgress = progressDocuments.filter(
      (document) => document.userId === student.uid && (selectedModuleId === 'all' || document.comicId === selectedModuleId)
    );

    const score = latestReflection?.rating != null
      ? Math.round((latestReflection.rating ?? 0) * 20)
      : studentProgress.length
      ? Math.round(
          studentProgress.reduce((sum, document) => sum + (document.percentage ?? 0), 0) / studentProgress.length
        )
      : 0;

    const progress = studentProgress.length
      ? Math.round(
          studentProgress.reduce((sum, document) => sum + (document.percentage ?? 0), 0) / studentProgress.length
        )
      : 0;

    return {
      userId: student.uid,
      displayName: student.displayName ?? student.email ?? 'Siswa',
      score,
      progress,
    };
  });
}
