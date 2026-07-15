'use client';

import { SINTAKS } from '@/types/progress';
import type { ComicProgressDocument } from '@/types/firestore';

export type BlueprintStageProgress = {
  stage: string;
  percentage: number;
};

export function buildBlueprintProgress(
  progressDocuments: ComicProgressDocument[],
  selectedModuleId: number | 'all'
): BlueprintStageProgress[] {
  const filteredProgress = selectedModuleId === 'all'
    ? progressDocuments
    : progressDocuments.filter((document) => document.comicId === selectedModuleId);

  const total = filteredProgress.length;
  const stageNames = [...SINTAKS, 'Report'];

  return stageNames.map((stage) => {
    if (stage === 'Report') {
      const completedCount = filteredProgress.filter(
        (document) => document.introspection?.completed === true
      ).length;
      return {
        stage: 'Report',
        percentage: total ? Math.round((completedCount / total) * 100) : 0,
      };
    }

    const completedCount = filteredProgress.filter((document) => {
      return (document.sintaksList ?? []).some(
        (item) => item.sintaks === stage && item.status === 'COMPLETED'
      );
    }).length;

    return {
      stage: stage === 'Navigation' ? 'Navigation + AR' : stage,
      percentage: total ? Math.round((completedCount / total) * 100) : 0,
    };
  });
}

export function buildStageProgressOverview(
  progressDocuments: ComicProgressDocument[],
  selectedClassIds: string[]
): { label: string; value: number }[] {
  const validProgress = selectedClassIds.length
    ? progressDocuments.filter((document) => selectedClassIds.includes(document.userId ?? ''))
    : progressDocuments;

  const covered = progressDocuments.reduce((sum, document) => sum + (document.percentage ?? 0), 0);
  const average = validProgress.length ? Math.round(covered / validProgress.length) : 0;

  return [
    { label: 'Rata-rata Penyelesaian', value: average },
    { label: 'Dokumen progress', value: validProgress.length },
  ];
}
