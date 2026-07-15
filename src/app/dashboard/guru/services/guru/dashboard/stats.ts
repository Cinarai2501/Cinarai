import type { ComicDocument, ComicProgressDocument, UserDocument } from '@/types/firestore';

export type TeacherDashboardSummary = {
  totalStudents: number;
  activeStudents: number;
  totalModules: number;
  averageProgress: number;
};

export function buildTeacherDashboardSummary(
  students: UserDocument[],
  comics: ComicDocument[],
  progressByStudent: Map<string, ComicProgressDocument[]>
): TeacherDashboardSummary {
  const totalStudents = students.length;
  const activeStudents = students.filter((student) => student.isActive).length;
  const totalModules = comics.length;

  const progressDocuments = Array.from(progressByStudent.values()).flat();
  const averageProgress = progressDocuments.length
    ? Math.round(
        progressDocuments.reduce((sum, document) => sum + (document.percentage ?? 0), 0) /
          progressDocuments.length
      )
    : 0;

  return {
    totalStudents,
    activeStudents,
    totalModules,
    averageProgress,
  };
}
