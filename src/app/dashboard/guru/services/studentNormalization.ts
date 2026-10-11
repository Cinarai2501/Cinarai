import type { ComicProgressDocument, UserDocument } from '@/types/firestore';
import { SINTAKS } from '@/types/progress';
import { calculatePercentage } from '@/lib/progressEngine';
import { getTimestampMillis, normalizeEmail } from '@/lib/userAudit';

type RawProgressDocument = { id: string; userId?: string; [field: string]: unknown };

export function normalizeStudentDocuments(users: UserDocument[]): UserDocument[] {
  const studentDocs = users.filter((user) => user.role === 'student' && user.duplicate !== true);

  const byUid = new Map<string, UserDocument[]>();
  const byEmail = new Map<string, UserDocument[]>();

  for (const student of studentDocs) {
    const uid = student.uid?.trim() ?? student.id?.trim() ?? '';
    const emailKey = normalizeEmail(student.email);
    if (uid) {
      const existing = byUid.get(uid) ?? [];
      existing.push(student);
      byUid.set(uid, existing);
    }
    if (emailKey) {
      const existing = byEmail.get(emailKey) ?? [];
      existing.push(student);
      byEmail.set(emailKey, existing);
    }
  }

  const latestByUid = new Map<string, UserDocument>();
  for (const [uid, documents] of byUid.entries()) {
    const latest = documents.reduce((best, candidate) => {
      return getTimestampMillis(candidate.updatedAt) > getTimestampMillis(best.updatedAt) ? candidate : best;
    }, documents[0]);
    latestByUid.set(uid, latest);
  }

  const latestByEmail = new Map<string, UserDocument>();
  for (const student of latestByUid.values()) {
    const emailKey = normalizeEmail(student.email);
    if (!emailKey) {
      latestByEmail.set(`__uid:${student.uid}`, student);
      continue;
    }
    const existing = latestByEmail.get(emailKey);
    if (!existing || getTimestampMillis(student.updatedAt) > getTimestampMillis(existing.updatedAt)) {
      latestByEmail.set(emailKey, student);
    }
  }

  return Array.from(latestByEmail.values()).sort((left, right) => {
    const leftName = left.displayName?.trim() ?? left.email?.trim() ?? '';
    const rightName = right.displayName?.trim() ?? right.email?.trim() ?? '';
    return leftName.localeCompare(rightName, 'id', { sensitivity: 'base' });
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

    const storedStages = Array.isArray(document.sintaksList)
      ? document.sintaksList as Array<{ sintaks?: unknown; status?: unknown }>
      : [];
    const completedStages = new Set<string>([
      ...(Array.isArray(document.completedStages)
        ? document.completedStages.filter((stage): stage is string => typeof stage === 'string')
        : []),
      ...storedStages
        .filter((stage) => stage.status === 'COMPLETED' && typeof stage.sintaks === 'string')
        .map((stage) => stage.sintaks as string),
    ]);
    const storedCurrent = storedStages.find((stage) => stage.status === 'CURRENT')?.sintaks;
    const currentStage = typeof document.currentStage === 'string'
      ? document.currentStage
      : typeof storedCurrent === 'string'
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
    const completedCount = sintaksList.filter((stage) => stage.status === 'COMPLETED').length;
    const storedPercentage = document.percentage;
    const percentage = typeof storedPercentage === 'number' && Number.isFinite(storedPercentage)
      ? storedPercentage
      : calculatePercentage(completedCount);
    const storedStatus = document.status;
    const status = storedStatus === 'completed' || storedStatus === 'in_progress' || storedStatus === 'not_started'
      ? storedStatus
      : completedCount === SINTAKS.length || percentage >= 100
        ? 'completed'
        : completedCount > 0 || percentage > 0 || currentStage !== SINTAKS[0]
          ? 'in_progress'
          : 'not_started';
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
