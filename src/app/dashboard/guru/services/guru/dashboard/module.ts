import type { ComicDocument, ComicProgressDocument } from '@/types/firestore';

export type GuruModuleSummary = {
  moduleId: number;
  title: string;
  description: string;
  completed: number;
  inProgress: number;
  progress: number;
  badge: string;
  coverLabel: string;
};

export function buildGuruModuleSummaries(
  comics: ComicDocument[],
  progressByStudent: Map<string, ComicProgressDocument[]>
): GuruModuleSummary[] {
  return comics.map((comic) => {
    const progressDocuments = Array.from(progressByStudent.values())
      .flat()
      .filter((document) => document.comicId === comic.comicId);

    const completedCount = progressDocuments.filter((document) => {
      return document.status === 'completed' || (document.percentage ?? 0) >= 100;
    }).length;

    const inProgressCount = progressDocuments.filter((document) => {
      return (
        document.status === 'in_progress' ||
        ((document.percentage ?? 0) > 0 && (document.percentage ?? 0) < 100)
      );
    }).length;

    const progress = progressDocuments.length
      ? Math.round(
          progressDocuments.reduce((sum, document) => sum + (document.percentage ?? 0), 0) /
            progressDocuments.length
        )
      : 0;

    const badge = completedCount >= 5 ? 'Populer' : inProgressCount > 0 ? 'Sedang' : 'Baru';

    return {
      moduleId: comic.comicId,
      title: comic.title,
      description: comic.subtitle || comic.synopsis || 'Pelajari konsep berharga dalam modul ini.',
      completed: completedCount,
      inProgress: inProgressCount,
      progress,
      badge,
      coverLabel: comic.title.split(' ')[0] ?? 'Modul',
    };
  });
}
