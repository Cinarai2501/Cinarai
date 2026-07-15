import { SINTAKS } from '@/types/progress';
import { toDateValue } from '@/app/teacher/studentDetail.utils';
import type { ComicProgressDocument } from '@/types/firestore';

export type StudentStageProgress = {
  stage: string;
  status: 'Belum Dimulai' | 'Sedang Berjalan' | 'Selesai';
  percentage: number;
  completedCount: number;
  totalCount: number;
};

export type StudentProgressSummary = {
  overallProgress: number;
  averageScore: number;
  completedModules: number;
  learningDuration: string;
  stageProgress: StudentStageProgress[];
};

export function buildProgress(documents: ComicProgressDocument[]): StudentProgressSummary {
  const stageProgress = SINTAKS.map((stage) => {
    const completed = documents.filter((document) =>
      (document.sintaksList ?? []).some((item) => item.sintaks === stage && item.status === 'COMPLETED')
    ).length;

    const total = documents.length || 1;
    const status: 'Belum Dimulai' | 'Sedang Berjalan' | 'Selesai' =
      completed === 0 ? 'Belum Dimulai' : completed === total ? 'Selesai' : 'Sedang Berjalan';

    return {
      stage,
      status,
      percentage: Math.round((completed / total) * 100),
      completedCount: completed,
      totalCount: total,
    };
  });

  const overallProgress = documents.length
    ? Math.round(documents.reduce((sum, document) => sum + (document.percentage ?? 0), 0) / documents.length)
    : 0;

  const averageScore = documents.length
    ? Math.round(documents.reduce((sum, document) => sum + (document.percentage ?? 0), 0) / documents.length)
    : 0;

  const completedModules = documents.filter((document) => document.status === 'completed' || (document.percentage ?? 0) >= 100).length;

  const dates = documents
    .map((document) => toDateValue(document.completedAt))
    .filter((date): date is Date => date instanceof Date)
    .sort((a, b) => a.getTime() - b.getTime());

  const learningDuration = dates.length
    ? `${Math.max(1, Math.round((dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60)))} jam`
    : 'Belum tersedia';

  return {
    overallProgress,
    averageScore,
    completedModules,
    learningDuration,
    stageProgress,
  };
}
