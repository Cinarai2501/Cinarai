import type { ComicProgressDocument, UserDocument } from '@/types/firestore';

export type TeacherProgressOverviewItem = {
  label: string;
  value: number;
};

export function buildTeacherProgressOverview(
  students: UserDocument[],
  progressByStudent: Map<string, ComicProgressDocument[]>
): TeacherProgressOverviewItem[] {
  const progressDocuments = Array.from(progressByStudent.values()).flat();

  const averageProgress = progressDocuments.length
    ? Math.round(
        progressDocuments.reduce((sum, document) => sum + (document.percentage ?? 0), 0) /
          progressDocuments.length
      )
    : 0;

  const completedModules = progressDocuments.filter((document) => {
    return document.status === 'completed' || (document.percentage ?? 0) >= 100;
  }).length;

  const totalModules = progressDocuments.length || 1;
  const completedModulesRate = Math.round((completedModules / totalModules) * 100);
  const activeStudentRate = students.length
    ? Math.round((students.filter((student) => student.isActive).length / students.length) * 100)
    : 0;

  return [
    { label: 'Progress Kelas', value: averageProgress },
    { label: 'Modul Selesai', value: completedModulesRate },
    { label: 'Siswa Aktif', value: activeStudentRate },
  ];
}
