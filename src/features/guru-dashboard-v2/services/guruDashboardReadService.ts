import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  startAfter,
  where,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { calculatePercentage } from '@/lib/progressEngine';
import { SINTAKS } from '@/types/progress';
import type {
  GuruComicProgress,
  GuruDataResult,
  GuruEvaluationSummary,
  GuruIdentificationAnswer,
  GuruMetric,
  GuruReadStatus,
  GuruReflectionSummary,
  GuruSourceResult,
  GuruStageStatus,
  GuruStudentActivity,
  GuruStudentActivityPage,
  GuruStudentPage,
  GuruStudentProgress,
  GuruStudentSummary,
  GuruTimestamp,
} from '../types';

type RawDocument = Record<string, unknown> & { id: string };
type RawProgressDocument = RawDocument & { updatedAt?: unknown };
type RawIdentificationAnswer = RawDocument & { updatedAt?: unknown };
type ReadError = { code: string; message: string };

interface SettledGuruSource {
  status: 'available' | 'error';
  data: unknown | null;
  error?: ReadError;
}

interface SettledGuruSources {
  status: 'success' | 'partial' | 'error';
  sources: Record<string, SettledGuruSource>;
}

type FirebaseClientState =
  | { firestore: Firestore }
  | { error: ReadError }
  | null;

const EMPTY_METRIC: GuruMetric = { value: null, origin: 'unavailable' };
const MAX_STUDENT_PAGE_SIZE = 100;
const RUBRIC_CHALLENGES = Array.from({ length: 10 }, (_, index) => `challenge${index + 1}`);

function failureFrom(error: unknown): ReadError {
  let code = 'unknown';
  try {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const candidate = (error as { code?: unknown }).code;
      if (typeof candidate === 'string') code = candidate;
    }
  } catch {
    code = 'unknown';
  }
  return { code, message: 'Firestore data source could not be read.' };
}

function result<T>(
  status: GuruReadStatus,
  data: T | null,
  sources: Record<string, GuruSourceResult>,
  error?: ReadError
): GuruDataResult<T> {
  return { status, data, sources, ...(error ? { error } : {}) };
}

function authenticatedFailure<T>(): GuruDataResult<T> {
  return result<T>('error', null, {
    authentication: {
      status: 'error',
      error: { code: 'unauthenticated', message: 'Sign-in is required.' },
    },
  }, { code: 'unauthenticated', message: 'Sign-in is required.' });
}

function invalidArgument<T>(message: string): GuruDataResult<T> {
  const error = { code: 'invalid-argument', message };
  return result<T>('error', null, { request: { status: 'error', error } }, error);
}

async function getAuthenticatedFirebaseClient(): Promise<FirebaseClientState> {
  try {
    const client = await import('@/lib/firebase/client');
    return client.auth.currentUser ? { firestore: client.firestore } : null;
  } catch (error) {
    return { error: failureFrom(error) };
  }
}

function firebaseClientFailure<T>(error: ReadError): GuruDataResult<T> {
  return result<T>('error', null, {
    firebaseClient: { status: 'error', error },
  }, error);
}

function sourceFromSettled(source: SettledGuruSource, empty = false): GuruSourceResult {
  if (source.status === 'error') return { status: 'error', error: source.error };
  return { status: empty ? 'not_found' : 'available' };
}

function aggregateStatus(sources: Record<string, GuruSourceResult>): GuruReadStatus {
  const statuses = Object.values(sources);
  const failedCount = statuses.filter((source) => source.status === 'error').length;
  if (failedCount === statuses.length) return 'error';
  if (failedCount > 0) return 'partial';
  return statuses.length > 0 && statuses.every((source) => source.status === 'not_found')
    ? 'not_found'
    : 'success';
}

export async function settleGuruSources(
  requests: Record<string, Promise<unknown>>
): Promise<SettledGuruSources> {
  const entries = await Promise.all(
    Object.entries(requests).map(async ([name, request]): Promise<[string, SettledGuruSource]> => {
      try {
        return [name, { status: 'available', data: await request }];
      } catch (error) {
        return [name, { status: 'error', data: null, error: failureFrom(error) }];
      }
    })
  );
  const sources = Object.fromEntries(entries);
  const errors = Object.values(sources).filter((source) => source.status === 'error').length;
  return {
    status: errors === 0 ? 'success' : errors === Object.keys(sources).length ? 'error' : 'partial',
    sources,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function normalizeGuruTimestamp(value: unknown): GuruTimestamp {
  if (value === undefined || value === null) {
    return { status: 'unavailable', reason: 'missing' };
  }

  try {
    if (value instanceof Date) {
      return Number.isFinite(value.getTime())
        ? { status: 'valid', value: value }
        : { status: 'unavailable', reason: 'invalid' };
    }

    if (typeof value === 'string') {
      const date = new Date(value);
      return Number.isFinite(date.getTime())
        ? { status: 'valid', value: date }
        : { status: 'unavailable', reason: 'invalid' };
    }

    if (isRecord(value) && typeof value.toDate === 'function') {
      const date = (value.toDate as () => unknown)();
      return date instanceof Date && Number.isFinite(date.getTime())
        ? { status: 'valid', value: date }
        : { status: 'unavailable', reason: 'invalid' };
    }

    if (isRecord(value) && typeof value.seconds === 'number') {
      const nanoseconds = typeof value.nanoseconds === 'number' ? value.nanoseconds : 0;
      if (!Number.isInteger(value.seconds) || !Number.isInteger(nanoseconds) || nanoseconds < 0 || nanoseconds >= 1e9) {
        return { status: 'unavailable', reason: 'invalid' };
      }
      const date = new Date(value.seconds * 1000 + nanoseconds / 1e6);
      return Number.isFinite(date.getTime())
        ? { status: 'valid', value: date }
        : { status: 'unavailable', reason: 'invalid' };
    }
  } catch {
    return { status: 'unavailable', reason: 'invalid' };
  }

  return { status: 'unavailable', reason: 'invalid' };
}

function timestampMillis(timestamp: GuruTimestamp): number | null {
  return timestamp.status === 'valid' ? timestamp.value.getTime() : null;
}

function isValidComicId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function comicIdFrom(document: RawProgressDocument): number | null {
  if (isValidComicId(document.comicId)) return document.comicId;
  const match = /^comic-(\d+)$/.exec(document.id);
  if (!match) return null;
  const comicId = Number(match[1]);
  return isValidComicId(comicId) ? comicId : null;
}

function validLegacyStatus(value: unknown): 'not_started' | 'in_progress' | 'completed' | null {
  return value === 'not_started' || value === 'in_progress' || value === 'completed' ? value : null;
}

interface NormalizedComicProgress extends GuruComicProgress {
  updatedAtMillis: number | null;
}

function normalizeComicProgress(uid: string, document: RawProgressDocument): NormalizedComicProgress | null {
  if (document.id === 'evaluation-cinarai') return null;
  const comicId = comicIdFrom(document);
  if (comicId === null) return null;

  const completedStagesValue = document.completedStages;
  const currentStageValue = document.currentStage;
  const hasV2CompletedStages = Array.isArray(completedStagesValue)
    && completedStagesValue.every((stage) =>
      typeof stage === 'string' && SINTAKS.includes(stage as (typeof SINTAKS)[number])
    );
  const completedStages = hasV2CompletedStages
    ? Array.from(new Set(completedStagesValue.filter((stage): stage is string => SINTAKS.includes(stage as (typeof SINTAKS)[number]))))
    : null;
  const currentStage = typeof currentStageValue === 'string' && SINTAKS.includes(currentStageValue as (typeof SINTAKS)[number])
    ? currentStageValue
    : null;
  const isV2 = hasV2CompletedStages && typeof currentStageValue === 'string' && currentStage !== null;

  const legacyStages = Array.isArray(document.sintaksList)
    ? document.sintaksList.filter((stage): stage is Record<string, unknown> => isRecord(stage))
    : [];
  const legacyStagesByName = new Map<string, unknown>();
  for (const stage of legacyStages) {
    if (typeof stage.sintaks === 'string' && SINTAKS.includes(stage.sintaks as (typeof SINTAKS)[number])) {
      legacyStagesByName.set(stage.sintaks, stage.status);
    }
  }

  let format: 'v2' | 'legacy';
  let storedCompletedStages: string[] | null;
  let effectiveCurrentStage: string | null;
  let percentage: GuruMetric = EMPTY_METRIC;
  let status: GuruComicProgress['status'] = 'unknown';
  let stages: GuruComicProgress['stages'];

  if (isV2 && completedStages !== null) {
    format = 'v2';
    storedCompletedStages = completedStages;
    effectiveCurrentStage = currentStage;
    const completedCount = completedStages.length;
    percentage = { value: calculatePercentage(completedCount), origin: 'derived' };
    status = completedCount === SINTAKS.length
      ? 'completed'
      : completedCount > 0 || currentStage !== SINTAKS[0]
        ? 'in_progress'
        : 'not_started';
    stages = SINTAKS.map((stage) => ({
      stage,
      status: completedStages.includes(stage)
        ? 'completed'
        : stage === currentStage
          ? 'current'
          : 'not_started',
    }));
  } else {
    format = 'legacy';
    const knownLegacyStages = Array.from(legacyStagesByName.keys());
    const allLegacyStagesPresent = SINTAKS.every((stage) => {
      const stageStatus = legacyStagesByName.get(stage);
      return stageStatus === 'COMPLETED' || stageStatus === 'CURRENT' || stageStatus === 'LOCKED';
    });
    const legacyCompletedStages = knownLegacyStages.filter((stage) => legacyStagesByName.get(stage) === 'COMPLETED');
    const legacyCurrentStage = knownLegacyStages.find((stage) => legacyStagesByName.get(stage) === 'CURRENT') ?? null;
    const storedPercentage = finiteNumber(document.percentage);
    const boundedStoredPercentage = storedPercentage !== null && storedPercentage >= 0 && storedPercentage <= 100
      ? storedPercentage
      : null;
    const storedStatus = validLegacyStatus(document.status);

    storedCompletedStages = knownLegacyStages.length ? legacyCompletedStages : null;
    effectiveCurrentStage = legacyCurrentStage;
    if (boundedStoredPercentage !== null) {
      percentage = { value: boundedStoredPercentage, origin: 'stored' };
    } else if (allLegacyStagesPresent) {
      percentage = { value: calculatePercentage(legacyCompletedStages.length), origin: 'derived' };
    }

    if (storedStatus) {
      status = storedStatus;
    } else if (allLegacyStagesPresent) {
      status = legacyCompletedStages.length === SINTAKS.length
        ? 'completed'
        : legacyCompletedStages.length > 0 || legacyCurrentStage !== SINTAKS[0]
          ? 'in_progress'
          : 'not_started';
    }

    stages = SINTAKS.map((stage): { stage: string; status: GuruStageStatus } => {
      const legacyStatus = legacyStagesByName.get(stage);
      if (legacyStatus === 'COMPLETED') return { stage, status: 'completed' };
      if (legacyStatus === 'CURRENT') return { stage, status: 'current' };
      if (legacyStatus === 'LOCKED') return { stage, status: 'not_started' };
      return { stage, status: 'unknown' };
    });
  }

  const updatedAt = normalizeGuruTimestamp(document.updatedAt);
  return {
    uid,
    comicId,
    documentId: document.id,
    format,
    stored: {
      currentStage: effectiveCurrentStage,
      completedStages: storedCompletedStages,
      percentage: finiteNumber(document.percentage),
      status: validLegacyStatus(document.status),
    },
    percentage,
    status,
    stages,
    updatedAt,
    updatedAtMillis: timestampMillis(updatedAt),
  };
}

export function normalizeGuruComicProgress(
  uid: string,
  document: RawProgressDocument
): GuruComicProgress | null {
  const normalized = normalizeComicProgress(uid, document);
  return normalized ? toPublicComicProgress(normalized) : null;
}

function isPreferredProgress(candidate: NormalizedComicProgress, current: NormalizedComicProgress): boolean {
  const canonicalId = `comic-${candidate.comicId}`;
  const candidateIsCanonical = candidate.documentId === canonicalId;
  const currentIsCanonical = current.documentId === canonicalId;
  if (candidateIsCanonical !== currentIsCanonical) return candidateIsCanonical;
  if (candidate.updatedAtMillis !== current.updatedAtMillis) {
    if (candidate.updatedAtMillis === null) return false;
    if (current.updatedAtMillis === null) return true;
    return candidate.updatedAtMillis > current.updatedAtMillis;
  }
  return candidate.documentId.localeCompare(current.documentId) < 0;
}

function toPublicComicProgress(progress: NormalizedComicProgress): GuruComicProgress {
  return {
    uid: progress.uid,
    comicId: progress.comicId,
    documentId: progress.documentId,
    format: progress.format,
    stored: progress.stored,
    percentage: progress.percentage,
    status: progress.status,
    stages: progress.stages,
    updatedAt: progress.updatedAt,
  };
}

function normalizeIdentificationDocument(
  uid: string,
  document: RawIdentificationAnswer
): GuruIdentificationAnswer | null {
  if (document.userId !== uid || !isValidComicId(document.comicId)) return null;
  if (typeof document.step !== 'number' || !Number.isInteger(document.step) || document.step < 0) return null;
  return {
    uid,
    comicId: document.comicId,
    step: document.step,
    answer: typeof document.selectedAnswer === 'string' ? document.selectedAnswer : null,
    reason: nonEmptyString(document.reason),
    note: nonEmptyString(document.note),
    origin: 'identification_answers',
    documentId: document.id,
    updatedAt: normalizeGuruTimestamp(document.updatedAt),
  };
}

function normalizeLegacyIdentification(
  uid: string,
  document: RawProgressDocument
): GuruIdentificationAnswer[] {
  const comicId = comicIdFrom(document);
  const stageData = isRecord(document.stageData) ? document.stageData : null;
  const identification = stageData && isRecord(stageData.identification) ? stageData.identification : null;
  const answers = identification?.answers;
  if (comicId === null || !Array.isArray(answers)) return [];

  return answers.flatMap((answer): GuruIdentificationAnswer[] => {
    if (!isRecord(answer) || typeof answer.step !== 'number' || !Number.isInteger(answer.step) || answer.step < 0) {
      return [];
    }
    return [{
      uid,
      comicId,
      step: answer.step,
      answer: typeof answer.selectedAnswer === 'string' ? answer.selectedAnswer : null,
      reason: nonEmptyString(answer.reason),
      note: nonEmptyString(answer.note),
      origin: 'stageData',
      documentId: null,
      updatedAt: normalizeGuruTimestamp(document.updatedAt),
    }];
  });
}

function isPreferredIdentification(
  candidate: GuruIdentificationAnswer,
  current: GuruIdentificationAnswer
): boolean {
  if (candidate.origin !== current.origin) return candidate.origin === 'identification_answers';
  const candidateTime = timestampMillis(candidate.updatedAt);
  const currentTime = timestampMillis(current.updatedAt);
  if (candidateTime !== currentTime) {
    if (candidateTime === null) return false;
    if (currentTime === null) return true;
    return candidateTime > currentTime;
  }
  return (candidate.documentId ?? '').localeCompare(current.documentId ?? '') < 0;
}

export function deduplicateGuruIdentificationAnswers(
  uid: string,
  progressDocuments: RawProgressDocument[],
  answerDocuments: RawIdentificationAnswer[]
): GuruIdentificationAnswer[] {
  const selectedProgress = new Map<number, NormalizedComicProgress>();
  const stageFallbacks: GuruIdentificationAnswer[] = [];

  for (const document of progressDocuments) {
    const progress = normalizeComicProgress(uid, document);
    if (!progress) continue;
    const current = selectedProgress.get(progress.comicId);
    if (!current || isPreferredProgress(progress, current)) {
      selectedProgress.set(progress.comicId, progress);
    }
  }
  for (const document of selectedProgress.values()) {
    const rawDocument = progressDocuments.find((candidate) => candidate.id === document.documentId);
    if (rawDocument) stageFallbacks.push(...normalizeLegacyIdentification(uid, rawDocument));
  }

  const answersByKey = new Map<string, GuruIdentificationAnswer>();
  for (const answer of [...stageFallbacks, ...answerDocuments.flatMap((document) => {
    const normalized = normalizeIdentificationDocument(uid, document);
    return normalized ? [normalized] : [];
  })]) {
    const key = `${answer.comicId}:${answer.step}`;
    const current = answersByKey.get(key);
    if (!current || isPreferredIdentification(answer, current)) answersByKey.set(key, answer);
  }
  return Array.from(answersByKey.values()).sort((left, right) =>
    left.comicId - right.comicId || left.step - right.step
  );
}

export function deduplicateGuruReflections(
  uid: string,
  documents: RawDocument[]
): GuruReflectionSummary[] {
  const byId = new Map<string, GuruReflectionSummary>();
  for (const document of documents) {
    if (document.userId !== uid && document.studentId !== uid) continue;
    const stage = nonEmptyString(document.stage);
    const reflectionStatus = nonEmptyString(document.status);
    const isFinalReflection = (stage === 'introspection' && reflectionStatus === 'completed')
      || (stage === null
        && document.id.endsWith('_introspection')
        && (reflectionStatus === null || reflectionStatus === 'completed'));
    if (!isFinalReflection) continue;

    const comicIdValue = document.comicId ?? document.moduleId;
    const comicId = typeof comicIdValue === 'number'
      ? comicIdValue
      : typeof comicIdValue === 'string' && /^\d+$/.test(comicIdValue)
        ? Number(comicIdValue)
        : null;
    const summary: GuruReflectionSummary = {
      id: document.id,
      uid,
      comicId: isValidComicId(comicId) ? comicId : null,
      text: nonEmptyString(document.reflectionText) ?? nonEmptyString(document.response),
      status: nonEmptyString(document.status),
      submittedAt: normalizeGuruTimestamp(document.submittedAt ?? document.createdAt ?? document.timestamp),
    };
    byId.set(document.id, summary);
  }
  return Array.from(byId.values());
}

export function buildGuruStudentSummary(
  profile: RawDocument,
  progress?: GuruStudentProgress | null,
  progressFailed = false
): GuruStudentSummary {
  const comics = progress?.comics ?? [];
  const completedComicCount = progressFailed
    ? EMPTY_METRIC
    : { value: comics.filter((comic) => comic.status === 'completed').length, origin: 'derived' as const };
  const state: GuruStudentSummary['progress']['state'] = progressFailed
    ? 'unavailable'
    : progress
      ? comics.length === 0
        ? 'not_started'
        : comics.some((comic) => comic.status === 'in_progress' || comic.status === 'unknown')
          ? 'in_progress'
          : 'completed'
      : 'not_loaded';

  return {
    uid: profile.id,
    displayName: nonEmptyString(profile.displayName),
    email: nonEmptyString(profile.email),
    classLevel: nonEmptyString(profile.classLevel),
    schoolName: nonEmptyString(profile.schoolName),
    isActive: typeof profile.isActive === 'boolean' ? profile.isActive : null,
    duplicate: profile.duplicate === true,
    progress: {
      state,
      completedComicCount,
      knownComicCount: progress ? comics.length : null,
    },
  };
}

export function normalizeGuruEvaluation(
  uid: string,
  document: RawDocument | null
): GuruEvaluationSummary {
  const notAvailable: GuruEvaluationSummary = {
    uid,
    status: 'not_found',
    completed: null,
    gradingStatus: 'unknown',
    teacherRubricTotal: EMPTY_METRIC,
    submittedAt: { status: 'unavailable', reason: 'missing' },
    gradedAt: { status: 'unavailable', reason: 'missing' },
  };
  if (!document) return notAvailable;

  const evaluation = isRecord(document.evaluationCinarai) ? document.evaluationCinarai : null;
  if (!evaluation || typeof evaluation.completed !== 'boolean') {
    return { ...notAvailable, status: 'invalid' };
  }
  if (!evaluation.completed) {
    return {
      ...notAvailable,
      status: 'draft',
      completed: false,
      submittedAt: normalizeGuruTimestamp(evaluation.submittedAt),
    };
  }

  const grading = isRecord(evaluation.grading) ? evaluation.grading : null;
  if (!grading || grading.status === 'pending') {
    return {
      ...notAvailable,
      status: 'awaiting_grading',
      completed: true,
      gradingStatus: 'pending',
      submittedAt: normalizeGuruTimestamp(evaluation.submittedAt),
    };
  }
  if (grading.status !== 'graded') return { ...notAvailable, status: 'invalid', completed: true };

  const challengeScores = isRecord(grading.challengeScores) ? grading.challengeScores : null;
  const scoresValid = challengeScores !== null
    && RUBRIC_CHALLENGES.every((challenge) => {
      const score = challengeScores[challenge];
      return typeof score === 'number' && Number.isInteger(score) && score >= 0 && score <= 4;
    });
  const totalScore = finiteNumber(grading.totalScore);
  const gradedBy = nonEmptyString(grading.gradedBy);
  const validGrade = scoresValid
    && totalScore !== null
    && Number.isInteger(totalScore)
    && totalScore >= 0
    && totalScore <= 40
    && gradedBy !== null
    && grading.rubricVersion === 'cinarai-0-4-v1';

  if (!validGrade || totalScore === null) {
    return {
      ...notAvailable,
      status: 'invalid',
      completed: true,
      submittedAt: normalizeGuruTimestamp(evaluation.submittedAt),
    };
  }

  return {
    uid,
    status: 'graded',
    completed: true,
    gradingStatus: 'graded',
    teacherRubricTotal: { value: totalScore, origin: 'stored' },
    submittedAt: normalizeGuruTimestamp(evaluation.submittedAt),
    gradedAt: normalizeGuruTimestamp(grading.gradedAt),
  };
}

export async function listGuruStudents(options: {
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
} = {}): Promise<GuruDataResult<GuruStudentPage>> {
  const client = await getAuthenticatedFirebaseClient();
  if (!client) return authenticatedFailure();
  if ('error' in client) return firebaseClientFailure(client.error);
  const pageSize = options.pageSize ?? 25;
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_STUDENT_PAGE_SIZE) {
    return invalidArgument(`pageSize must be an integer between 1 and ${MAX_STUDENT_PAGE_SIZE}.`);
  }

  try {
    const constraints = [
      where('role', '==', 'student'),
      ...(options.cursor ? [startAfter(options.cursor)] : []),
      limit(pageSize + 1),
    ];
    const snapshot = await getDocs(query(collection(client.firestore, 'users'), ...constraints));
    const hasMore = snapshot.docs.length > pageSize;
    const pageDocuments = snapshot.docs.slice(0, pageSize);
    const students = pageDocuments
      .filter((document) => document.data().duplicate !== true)
      .map((document) => buildGuruStudentSummary({
        ...document.data(),
        id: document.id,
      }));
    const nextCursor = hasMore ? pageDocuments[pageDocuments.length - 1] ?? null : null;
    const source: GuruSourceResult = students.length ? { status: 'available' } : { status: 'not_found' };
    return result(students.length ? 'success' : 'not_found', { students, nextCursor }, { users: source });
  } catch (error) {
    const failure = failureFrom(error);
    return result<GuruStudentPage>('error', null, { users: { status: 'error', error: failure } }, failure);
  }
}

export async function getGuruStudentProgress(
  uid: string
): Promise<GuruDataResult<GuruStudentProgress>> {
  const client = await getAuthenticatedFirebaseClient();
  if (!client) return authenticatedFailure();
  if ('error' in client) return firebaseClientFailure(client.error);
  if (!uid.trim()) return invalidArgument('uid is required.');

  const settled = await settleGuruSources({
    progress: getDocs(collection(client.firestore, 'users', uid, 'progress')).then((snapshot) =>
      snapshot.docs.map((document) => ({ ...document.data(), id: document.id }))
    ),
    identification: getDocs(query(
      collection(client.firestore, 'identification_answers'),
      where('userId', '==', uid)
    )).then((snapshot) =>
      snapshot.docs.map((document) => ({ ...document.data(), id: document.id }))
    ),
  });
  const progressSource = settled.sources.progress;
  const identificationSource = settled.sources.identification;
  const progressDocuments = progressSource.status === 'available'
    ? progressSource.data as RawProgressDocument[]
    : [];
  const answerDocuments = identificationSource.status === 'available'
    ? identificationSource.data as RawIdentificationAnswer[]
    : [];
  const normalizedProgress = new Map<number, NormalizedComicProgress>();

  for (const document of progressDocuments) {
    const normalized = normalizeComicProgress(uid, document);
    if (!normalized) continue;
    const current = normalizedProgress.get(normalized.comicId);
    if (!current || isPreferredProgress(normalized, current)) normalizedProgress.set(normalized.comicId, normalized);
  }

  const comics = Array.from(normalizedProgress.values())
    .map(toPublicComicProgress)
    .sort((left, right) => left.comicId - right.comicId);
  const identificationAnswers = deduplicateGuruIdentificationAnswers(
    uid,
    progressDocuments,
    answerDocuments
  );
  const sources: Record<string, GuruSourceResult> = {
    progress: sourceFromSettled(progressSource, progressDocuments.length === 0),
    identification: sourceFromSettled(identificationSource, answerDocuments.length === 0),
  };
  const status = aggregateStatus(sources);
  if (status === 'error') {
    const failure = progressSource.error ?? identificationSource.error;
    return result<GuruStudentProgress>('error', null, sources, failure);
  }

  return result(status, { comics, identificationAnswers }, sources);
}

export async function getGuruStudentEvaluation(
  uid: string
): Promise<GuruDataResult<GuruEvaluationSummary>> {
  const client = await getAuthenticatedFirebaseClient();
  if (!client) return authenticatedFailure();
  if ('error' in client) return firebaseClientFailure(client.error);
  if (!uid.trim()) return invalidArgument('uid is required.');

  try {
    const snapshot = await getDoc(doc(client.firestore, 'users', uid, 'progress', 'evaluation-cinarai'));
    const evaluation = normalizeGuruEvaluation(uid, snapshot.exists()
      ? { ...snapshot.data(), id: snapshot.id }
      : null);
    const status = snapshot.exists() ? 'available' : 'not_found';
    return result(
      snapshot.exists() ? 'success' : 'not_found',
      evaluation,
      { evaluation: { status } }
    );
  } catch (error) {
    const failure = failureFrom(error);
    return result<GuruEvaluationSummary>('error', null, { evaluation: { status: 'error', error: failure } }, failure);
  }
}

export async function getGuruStudentReflections(
  uid: string
): Promise<GuruDataResult<GuruReflectionSummary[]>> {
  const client = await getAuthenticatedFirebaseClient();
  if (!client) return authenticatedFailure();
  if ('error' in client) return firebaseClientFailure(client.error);
  if (!uid.trim()) return invalidArgument('uid is required.');

  const settled = await settleGuruSources({
    userId: getDocs(query(collection(client.firestore, 'reflection'), where('userId', '==', uid)))
      .then((snapshot) => snapshot.docs.map((document) => ({ ...document.data(), id: document.id }))),
    studentId: getDocs(query(collection(client.firestore, 'reflection'), where('studentId', '==', uid)))
      .then((snapshot) => snapshot.docs.map((document) => ({ ...document.data(), id: document.id }))),
  });
  const userSource = settled.sources.userId;
  const studentSource = settled.sources.studentId;
  const userDocuments = userSource.status === 'available' ? userSource.data as RawDocument[] : [];
  const studentDocuments = studentSource.status === 'available' ? studentSource.data as RawDocument[] : [];
  const reflections = deduplicateGuruReflections(uid, [...studentDocuments, ...userDocuments]);
  const sources: Record<string, GuruSourceResult> = {
    userId: sourceFromSettled(userSource, userDocuments.length === 0),
    studentId: sourceFromSettled(studentSource, studentDocuments.length === 0),
  };
  const status = aggregateStatus(sources);
  if (status === 'error') {
    const failure = userSource.error ?? studentSource.error;
    return result<GuruReflectionSummary[]>('error', null, sources, failure);
  }
  return result(status, reflections, sources);
}

export async function getGuruStudentApplicationActivities(
  uid: string,
  options: {
    pageSize?: number;
    cursor?: QueryDocumentSnapshot<DocumentData> | null;
  } = {}
): Promise<GuruDataResult<GuruStudentActivityPage>> {
  const client = await getAuthenticatedFirebaseClient();
  if (!client) return authenticatedFailure();
  if ('error' in client) return firebaseClientFailure(client.error);
  if (!uid.trim()) return invalidArgument('uid is required.');
  const pageSize = options.pageSize ?? 25;
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_STUDENT_PAGE_SIZE) {
    return invalidArgument(`pageSize must be an integer between 1 and ${MAX_STUDENT_PAGE_SIZE}.`);
  }

  try {
    const snapshot = await getDocs(query(
      collection(client.firestore, 'application_activity'),
      where('userId', '==', uid),
      ...(options.cursor ? [startAfter(options.cursor)] : []),
      limit(pageSize + 1)
    ));
    const hasMore = snapshot.docs.length > pageSize;
    const pageDocuments = snapshot.docs.slice(0, pageSize);
    const activities = pageDocuments.flatMap((document): GuruStudentActivity[] => {
      const data = document.data();
      if (data.userId !== uid) return [];
      return [{
        id: document.id,
        uid,
        comicId: isValidComicId(data.comicId) ? data.comicId : null,
        attempt: finiteNumber(data.attempt),
        selectedAnswer: nonEmptyString(data.selectedAnswer),
        studentReason: nonEmptyString(data.studentReason),
        coachType: nonEmptyString(data.coachType),
        coachMessage: nonEmptyString(data.coachMessage),
        timestamp: normalizeGuruTimestamp(data.timestamp),
      }];
    });
    const nextCursor = hasMore ? pageDocuments[pageDocuments.length - 1] ?? null : null;
    return result(
      activities.length ? 'success' : 'not_found',
      { activities, nextCursor },
      { applicationActivity: { status: activities.length ? 'available' : 'not_found' } }
    );
  } catch (error) {
    const failure = failureFrom(error);
    return result<GuruStudentActivityPage>('error', null, { applicationActivity: { status: 'error', error: failure } }, failure);
  }
}
