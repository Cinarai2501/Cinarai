'use client';

import type { ComicProgressDocument, ReflectionDocument, UserDocument } from '@/types/firestore';

export type ReflectionSummary = {
  totalSubmitted: number;
  totalPending: number;
  positive: number;
  negative: number;
  neutral: number;
  rate: number;
};

export function buildReflectionSummary(
  students: UserDocument[],
  progressDocuments: ComicProgressDocument[],
  reflections: ReflectionDocument[],
  selectedClassId: string,
  selectedModuleId: number | 'all'
): ReflectionSummary {
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

  const moduleProgressDocs = progressDocuments.filter(
    (document) => (selectedModuleId === 'all' || document.comicId === selectedModuleId)
      && studentIds.has(document.userId ?? '')
  );

  const moduleStudentIds = new Set(moduleProgressDocs.map((document) => document.userId));
  const relevantReflections = reflections.filter(
    (reflection) => moduleStudentIds.has(reflection.userId ?? reflection.studentId ?? '')
  );

  const totalSubmitted = relevantReflections.length;
  const totalPending = Math.max(moduleStudentIds.size - totalSubmitted, 0);

  let positive = 0;
  let negative = 0;
  let neutral = 0;

  relevantReflections.forEach((reflection) => {
    const value = reflection.rating ?? null;
    if (value === null) {
      neutral += 1;
      return;
    }
    if (value >= 4) {
      positive += 1;
    } else if (value <= 2) {
      negative += 1;
    } else {
      neutral += 1;
    }
  });

  return {
    totalSubmitted,
    totalPending,
    positive,
    negative,
    neutral,
    rate: moduleStudentIds.size ? Math.round((totalSubmitted / moduleStudentIds.size) * 100) : 0,
  };
}
