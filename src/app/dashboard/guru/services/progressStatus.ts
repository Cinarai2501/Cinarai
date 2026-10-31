import { SINTAKS } from '@/types/progress';
import { calculatePercentage } from '@/lib/progressEngine';

export type ModuleStudentStatus = 'not_started' | 'learning' | 'completed';

export interface ModuleProgressEvidence {
  status?: unknown;
  percentage?: unknown;
  completedStages?: unknown;
  currentStage?: unknown;
  readerPage?: unknown;
  readerCompleted?: unknown;
  stageData?: unknown;
  sintaksList?: unknown;
}

export function getCompletedModuleStages(progress: ModuleProgressEvidence): Set<string> {
  const completed = new Set<string>();
  if (Array.isArray(progress.completedStages)) {
    progress.completedStages.forEach((stage) => {
      if (typeof stage === 'string' && SINTAKS.includes(stage as (typeof SINTAKS)[number])) {
        completed.add(stage);
      }
    });
  }
  if (Array.isArray(progress.sintaksList)) {
    progress.sintaksList.forEach((stage) => {
      if (
        stage && typeof stage === 'object'
        && 'sintaks' in stage && 'status' in stage
        && stage.status === 'COMPLETED'
        && typeof stage.sintaks === 'string'
        && SINTAKS.includes(stage.sintaks as (typeof SINTAKS)[number])
      ) completed.add(stage.sintaks);
    });
  }
  return completed;
}

export function getModuleProgressPercentage(progress: ModuleProgressEvidence): number {
  const completedStages = getCompletedModuleStages(progress);
  const hasStageEvidence = Array.isArray(progress.completedStages) || Array.isArray(progress.sintaksList);
  if (hasStageEvidence || progress.status === 'completed') {
    return calculatePercentage(completedStages.size);
  }
  return typeof progress.percentage === 'number' && Number.isFinite(progress.percentage)
    ? Math.min(100, Math.max(0, progress.percentage))
    : 0;
}

export function isModuleProgressComplete(progress: ModuleProgressEvidence): boolean {
  return getCompletedModuleStages(progress).size === SINTAKS.length;
}

export function getModuleStudentStatus(progress: ModuleProgressEvidence | null): ModuleStudentStatus {
  if (!progress) return 'not_started';
  const completedStages = getCompletedModuleStages(progress);
  if (isModuleProgressComplete(progress)) return 'completed';

  const currentStage = typeof progress.currentStage === 'string'
    && SINTAKS.includes(progress.currentStage as (typeof SINTAKS)[number])
    ? progress.currentStage
    : null;
  const hasSavedStageWork = progress.stageData !== null
    && typeof progress.stageData === 'object'
    && Object.keys(progress.stageData).length > 0;
  const hasStarted = progress.status === 'in_progress'
    || getModuleProgressPercentage(progress) > 0
    || (typeof progress.percentage === 'number' && Number.isFinite(progress.percentage) && progress.percentage > 0)
    || completedStages.size > 0
    || (currentStage !== null && currentStage !== 'Cover')
    || progress.readerCompleted === true
    || (typeof progress.readerPage === 'number' && Number.isFinite(progress.readerPage) && progress.readerPage > 1)
    || hasSavedStageWork;
  return hasStarted ? 'learning' : 'not_started';
}
