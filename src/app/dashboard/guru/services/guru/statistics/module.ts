'use client';

import type { ComicDocument, ComicProgressDocument, UserDocument } from '@/types/firestore';

export type ModuleProgressSummary = {
  comicId: number;
  title: string;
  completedStudents: number;
  inProgressStudents: number;
  notStartedStudents: number;
  averageProgress: number;
};

export function buildModuleProgressSummaries(
  comics: ComicDocument[],
  students: UserDocument[],
  progressDocuments: ComicProgressDocument[],
  selectedClassId: string,
  selectedModuleId: number | 'all'
): ModuleProgressSummary[] {
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

  const comicsToShow = selectedModuleId === 'all'
    ? comics.slice().sort((a, b) => a.comicId - b.comicId)
    : comics.filter((comic) => comic.comicId === selectedModuleId);

  return comicsToShow.map((comic) => {
    const studentsForModule = new Set(filteredStudents.map((student) => student.uid));
    const progressByStudent = progressDocuments.filter(
      (document) => document.comicId === comic.comicId && studentsForModule.has(document.userId ?? '')
    );

    const completedStudents = progressByStudent.filter(
      (document) => document.status === 'completed' || (document.percentage ?? 0) >= 100
    ).length;

    const inProgressStudents = progressByStudent.filter(
      (document) =>
        document.status === 'in_progress' || ((document.percentage ?? 0) > 0 && (document.percentage ?? 0) < 100)
    ).length;

    const averageProgress = progressByStudent.length
      ? Math.round(
          progressByStudent.reduce((sum, document) => sum + (document.percentage ?? 0), 0) /
            progressByStudent.length
        )
      : 0;

    return {
      comicId: comic.comicId,
      title: comic.title,
      completedStudents,
      inProgressStudents,
      notStartedStudents: Math.max(filteredStudents.length - progressByStudent.length, 0),
      averageProgress,
    };
  });
}
