import type { ComicProgressDocument, UserDocument } from '@/types/firestore';
import { SINTAKS } from '@/types/progress';
import { getTimestampMillis } from '@/lib/userAudit';
import { getCompletedModuleStages, getModuleProgressPercentage, getModuleStudentStatus } from './progressStatus';

type RawProgressDocument = { id: string; userId?: string; [field: string]: unknown };

export function normalizeStudentDocuments(users: UserDocument[]): UserDocument[] {
  const studentDocs = users.filter((user) => user.role === 'student' && user.duplicate !== true);

  const byUid = new Map<string, UserDocument[]>();

  for (const student of studentDocs) {
    const uid = student.uid?.trim() || student.id?.trim() || '';
    if (uid) {
      const existing = byUid.get(uid) ?? [];
      existing.push(student);
      byUid.set(uid, existing);
    }
  }

  const latestByUid = new Map<string, UserDocument>();
  for (const [uid, documents] of byUid.entries()) {
    const latest = documents.reduce((best, candidate) => {
      return getTimestampMillis(candidate.updatedAt) > getTimestampMillis(best.updatedAt) ? candidate : best;
    }, documents[0]);
    latestByUid.set(uid, { ...latest, uid });
  }

  return Array.from(latestByUid.values()).sort((left, right) => {
    const leftName = left.displayName?.trim() ?? left.email?.trim() ?? '';
    const rightName = right.displayName?.trim() ?? right.email?.trim() ?? '';
    const nameOrder = leftName.localeCompare(rightName, 'id', { sensitivity: 'base' });
    return nameOrder || left.uid.localeCompare(right.uid);
  });
}

export function normalizeComicProgressDocuments(
  uid: string,
  documents: RawProgressDocument[]
): ComicProgressDocument[] {
  const normalized = documents.flatMap((document) => {
    if (document.id === 'evaluation-cinarai') return [];

    const idComic = /^comic-(\d+)$/.exec(document.id)?.[1] ?? document.id;
    const comicId = typeof document.comicId === 'number' ? document.comicId : Number(idComic);
    if (!Number.isInteger(comicId) || comicId < 1) return [];

    const completedStages = getCompletedModuleStages({
      completedStages: document.completedStages,
      sintaksList: document.sintaksList,
    });
    const storedStages = Array.isArray(document.sintaksList)
      ? document.sintaksList as Array<{ sintaks?: unknown; status?: unknown }>
      : [];
    const storedCurrent = storedStages.find((stage) => stage.status === 'CURRENT')?.sintaks;
    const currentStage = typeof document.currentStage === 'string'
      && SINTAKS.includes(document.currentStage as (typeof SINTAKS)[number])
      ? document.currentStage
      : typeof storedCurrent === 'string'
        && SINTAKS.includes(storedCurrent as (typeof SINTAKS)[number])
        ? storedCurrent
        : SINTAKS[0];
    const sintaksList = SINTAKS.map((sintaks) => ({
      sintaks,
      status: completedStages.has(sintaks)
        ? 'COMPLETED' as const
        : currentStage === sintaks
          ? 'CURRENT' as const
          : 'LOCKED' as const,
    }));
    const percentage = getModuleProgressPercentage({
      status: document.status,
      percentage: document.percentage,
      completedStages: document.completedStages,
      sintaksList: document.sintaksList,
    });
    const storedStatus = document.status === 'in_progress' || document.status === 'completed'
      ? document.status
      : 'not_started';
    const moduleStatus = getModuleStudentStatus({
      status: storedStatus,
      percentage: document.percentage,
      completedStages: Array.from(completedStages),
      currentStage,
      stageData: document.stageData,
      readerPage: document.readerPage,
      readerCompleted: document.readerCompleted,
      sintaksList,
    });
    const status = moduleStatus === 'learning' ? 'in_progress' : moduleStatus;
    const lastCompletedStage = [...sintaksList].reverse().find((stage) => stage.status === 'COMPLETED')?.sintaks;

    return [{
      ...document,
      id: document.id,
      userId: uid,
      comicId,
      percentage,
      status,
      completedStage: typeof document.completedStage === 'string'
        ? document.completedStage
        : lastCompletedStage ?? '',
      completedPages: typeof document.completedPages === 'number' ? document.completedPages : 0,
      sintaksList,
      updatedAt: document.updatedAt as ComicProgressDocument['updatedAt'],
    } as ComicProgressDocument];
  });

  const uniqueByComic = new Map<number, ComicProgressDocument>();
  normalized.forEach((document) => {
    const current = uniqueByComic.get(document.comicId);
    const currentTime = getTimestampMillis(current?.updatedAt);
    const candidateTime = getTimestampMillis(document.updatedAt);
    if (!current || candidateTime >= currentTime) uniqueByComic.set(document.comicId, document);
  });
  return Array.from(uniqueByComic.values());
}
