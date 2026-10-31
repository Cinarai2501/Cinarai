import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore, adminInitializationError, verifyIdToken } from '@/lib/firebase/admin';
import { debug } from '@/lib/debug';
import {
  normalizeComicProgressDocuments,
  normalizeStudentDocuments,
} from '@/app/dashboard/guru/services/studentNormalization';
import { buildModuleBlueprint } from '@/app/dashboard/guru/services/moduleAnalytics';
import {
  buildClassInsightFacts,
  buildClassInsightPrompt,
  parseClassInsightResponse,
  getModuleStudentStatus,
} from '@/app/dashboard/guru/services/classInsight';
import { getCompletedModuleStages, getModuleProgressPercentage } from '@/app/dashboard/guru/services/progressStatus';
import {
  buildStudentInsightFacts,
  buildStudentInsightPrompt,
  getStudentInsightPromptEvidence,
  isStudentAllowedForInsight,
  parseStudentInsightResponse,
} from '@/app/dashboard/guru/services/studentInsight';
import type {
  ClassInsightActivity,
  ClassInsightAnswer,
  ClassInsightApplication,
  ClassInsightProgress,
  ClassInsightReflection,
  ClassInsightStudent,
} from '@/app/dashboard/guru/services/classInsight';
import type {
  StudentInsightActivity,
  StudentInsightAnswer,
  StudentInsightApplication,
  StudentInsightProgress,
  StudentInsightReflection,
} from '@/app/dashboard/guru/services/studentInsight';
import { comicModules } from '@/features/comics';
import { AiRouter, AiRouterTimeoutError } from '@/lib/ai/router';
import { consumeTeacherAiRateLimit } from './rateLimit';
import { readAllPages } from './pagedQuery';
import { readBoundedJsonBody } from './requestBody';
import type { ActivityDocument, ComicDocument, ComicProgressDocument, ReflectionDocument, UserDocument } from '@/types/firestore';
import { FieldPath } from 'firebase-admin/firestore';
import type { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase-admin/firestore';

const DASHBOARD_ROSTER_PAGE_SIZE = 200;
const CLASS_INSIGHT_SAMPLE_LIMIT = 150;
const CLASS_INSIGHT_CHUNK_SIZE = 10;
const CLASS_INSIGHT_COOLDOWN_MS = 60_000;
const CLASS_INSIGHT_MAX_STUDENTS = 100;
const STUDENT_INSIGHT_SAMPLE_LIMIT = 150;
const MAX_AI_PROMPT_CHARS = 12_000;
const COMIC_IDS = [1, 2, 3, 4, 5, 6] as const;

type DashboardRoutePayload = {
  success: boolean;
  message?: string;
  error?: string;
  students: UserDocument[];
  comics: ComicDocument[];
  progressDocuments: ComicProgressDocument[];
  activities: ActivityDocument[];
  reflections: ReflectionDocument[];
  analytics: Array<Record<string, unknown>>;
  errors?: {
    users?: string;
    comics?: string;
    progress?: string;
    activity?: string;
    reflection?: string;
  };
  stats: {
    totalStudents: number;
    activeStudents: number;
    totalModules: number;
    averageProgress: number;
    completedModules: number;
    reflectionCount: number;
    recentActivityCount: number;
  };
  generatedAt: string;
};

function serializeUser(document: DocumentSnapshot): UserDocument {
  const data = document.data() as Partial<UserDocument> | undefined;
  return {
    id: document.id,
    uid: typeof data?.uid === 'string' && data.uid.trim() ? data.uid.trim() : document.id,
    email: data?.email ?? '',
    displayName: data?.displayName,
    photoURL: data?.photoURL,
    role: (data?.role as UserDocument['role']) ?? 'student',
    schoolName: data?.schoolName,
    classLevel: data?.classLevel,
    gradeLevel: data?.gradeLevel,
    isActive: data?.isActive ?? true,
    duplicate: data?.duplicate === true,
    lastLoginAt: data?.lastLoginAt as UserDocument['lastLoginAt'],
    createdAt: data?.createdAt as UserDocument['createdAt'],
    updatedAt: data?.updatedAt as UserDocument['updatedAt'],
  };
}

function serializeActivity(document: DocumentSnapshot): ActivityDocument {
  const data = document.data() as Partial<ActivityDocument> | undefined;
  return {
    id: document.id,
    userId: data?.userId ?? '',
    type: data?.type ?? 'login',
    title: data?.title ?? '',
    description: data?.description,
    metadata: data?.metadata,
    occurredAt: data?.occurredAt as ActivityDocument['occurredAt'],
  };
}

function serializeReflection(document: DocumentSnapshot): ReflectionDocument {
  const data = document.data() as Partial<ReflectionDocument> | undefined;
  return {
    id: document.id,
    userId: data?.userId,
    studentId: data?.studentId,
    moduleId: data?.moduleId,
    comicId: data?.comicId,
    prompt: data?.prompt,
    response: data?.response,
    selectedChecklist: data?.selectedChecklist,
    checklist: data?.checklist,
    rating: data?.rating,
    confidence: data?.confidence,
    reflectionText: data?.reflectionText,
    aiReflection: data?.aiReflection,
    jawaban: data?.jawaban,
    timestamp: data?.timestamp as ReflectionDocument['timestamp'],
    stage: data?.stage,
    status: data?.status,
    submittedAt: data?.submittedAt as ReflectionDocument['submittedAt'],
    createdAt: data?.createdAt as ReflectionDocument['createdAt'],
    updatedAt: data?.updatedAt as ReflectionDocument['updatedAt'],
  };
}

function serializeComic(document: DocumentSnapshot): ComicDocument {
  const data = document.data() as Partial<ComicDocument> | undefined;
  return {
    id: document.id,
    comicId: data?.comicId ?? Number(document.id),
    slug: data?.slug ?? document.id,
    title: data?.title ?? document.id,
    subtitle: data?.subtitle ?? '',
    kelas: data?.kelas ?? '',
    lokasi: data?.lokasi ?? '',
    synopsis: data?.synopsis ?? '',
    characters: data?.characters ?? [],
    learningTargets: data?.learningTargets ?? [],
    estimatedMinutes: data?.estimatedMinutes ?? 0,
    pdfUrl: data?.pdfUrl ?? null,
    coverUrl: data?.coverUrl ?? '',
    thumbnailUrl: data?.thumbnailUrl ?? '',
    order: data?.order ?? 0,
    availability: data?.availability ?? 'ACTIVE',
    createdAt: data?.createdAt as ComicDocument['createdAt'],
    updatedAt: data?.updatedAt as ComicDocument['updatedAt'],
  };
}

function buildEmptyPayload(message?: string, error?: string, status: 'success' | 'error' = 'error'): DashboardRoutePayload {
  const generatedAt = new Date().toISOString();
  return {
    success: status === 'success',
    message,
    error,
    students: [],
    comics: [],
    progressDocuments: [],
    activities: [],
    reflections: [],
    analytics: [],
    errors: {},
    stats: {
      totalStudents: 0,
      activeStudents: 0,
      totalModules: 0,
      averageProgress: 0,
      completedModules: 0,
      reflectionCount: 0,
      recentActivityCount: 0,
    },
    generatedAt,
  };
}

function buildPayloadFromCollections(payload: {
  students: UserDocument[];
  comics: ComicDocument[];
  progressDocuments: ComicProgressDocument[];
  activities: ActivityDocument[];
  reflections: ReflectionDocument[];
}, errors?: { [key: string]: string | undefined }): DashboardRoutePayload {
  const students = payload.students ?? [];
  const comics = payload.comics ?? [];
  const progressDocuments = payload.progressDocuments ?? [];
  const activities = payload.activities ?? [];
  const reflections = payload.reflections ?? [];
  const averageProgress = progressDocuments.length
    ? Math.round(progressDocuments.reduce((sum, document) => sum + (document.percentage ?? 0), 0) / progressDocuments.length)
    : 0;
  const completedModules = progressDocuments.filter((document) => document.status === 'completed').length;

  return {
    success: true,
    students,
    comics,
    progressDocuments,
    activities,
    reflections,
    analytics: [],
    errors: errors ?? {},
    stats: {
      totalStudents: students.length,
      activeStudents: students.filter((student) => student.isActive).length,
      totalModules: comics.length,
      averageProgress,
      completedModules,
      reflectionCount: reflections.length,
      recentActivityCount: activities.length,
    },
    generatedAt: new Date().toISOString(),
  };
}

async function safeGetCollection<T>(label: string, operation: () => Promise<T>): Promise<{ ok: boolean; data: T | null; error?: string }> {
  const queryDescription = operation.toString();
  debug(`[dashboard/guru] starting query for collection: ${label}`, {
    path: `/dashboard/guru/${label}`,
    query: queryDescription,
    status: 'running',
  });

  try {
    const data = await operation();
    debug(`[dashboard/guru] finished query for collection: ${label}`, {
      path: `/dashboard/guru/${label}`,
      query: queryDescription,
      status: 'success',
    });
    return { ok: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const code = error && typeof error === 'object' && 'code' in error ? String((error as { code?: unknown }).code) : 'n/a';

    debug(`[dashboard/guru] Firestore query failed for ${label}`, {
      path: `/dashboard/guru/${label}`,
      query: queryDescription,
      status: 'failed',
      error: message,
      code,
    });

    if (error instanceof Error) {
      debug(error.stack);
    }

    throw error;
  }
}

export async function GET(request: NextRequest) {
  debug('[dashboard/guru] request received');
  try {
    const envIssues = [
      ['FIREBASE_PROJECT_ID', process.env.FIREBASE_PROJECT_ID],
      ['FIREBASE_CLIENT_EMAIL', process.env.FIREBASE_CLIENT_EMAIL],
      ['FIREBASE_PRIVATE_KEY', process.env.FIREBASE_PRIVATE_KEY],
    ] as const;
    const missingEnv = envIssues.filter(([, value]) => !value || value.trim().length === 0).map(([key]) => key);

    if (missingEnv.length > 0) {
      const message = adminInitializationError
        ? adminInitializationError
        : `Firebase Admin environment variables missing: ${missingEnv.join(', ')}`;
      debug('[dashboard/guru] Firebase Admin env validation failed', { missingEnv, message });
      return NextResponse.json(buildEmptyPayload(message, 'Firebase Admin unavailable'), { status: 503 });
    }

    debug('[dashboard/guru] adminAuth present?', Boolean(adminAuth));
    if (!adminAuth) {
      const msg = adminInitializationError
        ? adminInitializationError
        : 'Admin Auth not initialized. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in environment.';
      debug('[dashboard/guru] Admin Auth unavailable', { message: msg });
      return NextResponse.json(buildEmptyPayload(msg, 'Admin Auth unavailable'), { status: 503 });
    }

    debug('[dashboard/guru] adminFirestore present?', Boolean(adminFirestore));
    if (!adminFirestore) {
      const msg = adminInitializationError
        ? adminInitializationError
        : 'Admin Firestore not initialized. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in environment.';
      debug('[dashboard/guru] Admin Firestore unavailable', { message: msg });
      return NextResponse.json(buildEmptyPayload(msg, 'Admin Firestore unavailable'), { status: 503 });
    }

    const headerValue = request.headers.get('authorization');
    const token = headerValue?.startsWith('Bearer ') ? headerValue.slice(7) : null;

    if (!token) {
      return NextResponse.json(buildEmptyPayload('Unauthorized: token not provided', 'Unauthorized'), { status: 401 });
    }

    const decodedToken = await verifyIdToken(token);
    if (!decodedToken?.uid) {
      return NextResponse.json(buildEmptyPayload('Unauthorized: invalid token', 'Unauthorized'), { status: 401 });
    }

    const uid = decodedToken.uid;
    let role: string | undefined;
    let teacherSchoolName: string | undefined;

    try {
      const profileSnapshot = await adminFirestore.collection('users').doc(uid).get();
      if (profileSnapshot.exists) {
        const userData = profileSnapshot.data() as Record<string, unknown> | undefined;
        role = typeof userData?.role === 'string' ? userData.role : undefined;
        teacherSchoolName = typeof userData?.schoolName === 'string' ? userData.schoolName.trim() : undefined;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      debug('[dashboard/guru] Failed to fetch user profile', { error: message, uid });
      return NextResponse.json(buildEmptyPayload('Failed to fetch user profile', message), { status: 500 });
    }

    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(buildEmptyPayload('Akun ini bukan akun guru.', 'Forbidden'), { status: 403 });
    }
    if (role === 'teacher' && !teacherSchoolName) {
      return NextResponse.json(
        buildEmptyPayload('Profil guru belum memiliki sekolah; data siswa tidak dapat diakses.', 'Forbidden'),
        { status: 403 }
      );
    }

    const firestore = adminFirestore;
    if (!firestore) {
      debug('[dashboard/guru] Firestore client unavailable before querying collections');
      return NextResponse.json(buildEmptyPayload('Firestore client unavailable', 'Firestore unavailable'), { status: 503 });
    }

    // Run queries sequentially with logging so we can capture the exact failing step and stack
    debug('[dashboard/guru] starting collection queries');
    const rosterSchoolName = role === 'teacher' ? teacherSchoolName : undefined;
    const studentDocuments = await readAllPages<QueryDocumentSnapshot>(
      async (cursor, pageSize) => {
        let studentQuery = firestore.collection('users').where('role', '==', 'student');
        if (rosterSchoolName) studentQuery = studentQuery.where('schoolName', '==', rosterSchoolName);
        studentQuery = studentQuery.orderBy(FieldPath.documentId()).limit(pageSize);
        if (cursor) studentQuery = studentQuery.startAfter(cursor);
        const page = await safeGetCollection('users page', () => studentQuery.get());
        return page.data?.docs ?? [];
      },
      DASHBOARD_ROSTER_PAGE_SIZE,
    );
    const [reflectionsSnapshot, activitySnapshot, comicsSnapshot] = await Promise.all([
      safeGetCollection('reflection', async () =>
        firestore.collection('reflection').orderBy('createdAt', 'desc').limit(200).get()),
      safeGetCollection('activity', async () =>
        firestore.collection('activity').orderBy('occurredAt', 'desc').limit(20).get()),
      safeGetCollection('comics', async () => getComicCatalogSnapshots(firestore)),
    ]);

    debug('[dashboard/guru] collection queries completed, mapping documents');

    const rawStudents = studentDocuments.map(serializeUser);
    const students = normalizeStudentDocuments(rawStudents);
    const studentUids = new Set(students.map((student) => student.uid));
    const comics = comicsSnapshot.data?.map(serializeComic) ?? [];
    const progressReferences = students.flatMap((student) =>
      comics
        .filter((comic) => Number.isInteger(comic.comicId) && comic.comicId > 0)
        .map((comic) => ({
          uid: student.uid,
          reference: firestore.collection('users').doc(student.uid).collection('progress').doc(`comic-${comic.comicId}`),
        }))
    );
    const progressByUid = new Map<string, Array<{ id: string; userId: string; [field: string]: unknown }>>();
    for (let offset = 0; offset < progressReferences.length; offset += 100) {
      const batch = progressReferences.slice(offset, offset + 100);
      const snapshots = await safeGetCollection('scoped progress', async () =>
        firestore.getAll(...batch.map(({ reference }) => reference))
      );
      snapshots.data?.forEach((snapshot, index) => {
        if (!snapshot.exists) return;
        const studentUid = batch[index].uid;
        const existing = progressByUid.get(studentUid) ?? [];
        existing.push({ id: snapshot.id, userId: studentUid, ...snapshot.data() });
        progressByUid.set(studentUid, existing);
      });
    }
    const progressDocuments = students.flatMap((student) =>
      normalizeComicProgressDocuments(student.uid, progressByUid.get(student.uid) ?? [])
    );
    const activities = activitySnapshot.data
      ? activitySnapshot.data.docs.map(serializeActivity).filter((activity) => studentUids.has(activity.userId))
      : [];
    const reflections = reflectionsSnapshot.data
      ? reflectionsSnapshot.data.docs
          .map(serializeReflection)
          .filter(
            (reflection) =>
              (reflection.userId && studentUids.has(reflection.userId)) ||
              (reflection.studentId && studentUids.has(reflection.studentId))
          )
      : [];

    debug('[dashboard/guru] building payload snapshot');
    const payload = buildPayloadFromCollections({ students, comics, progressDocuments, activities, reflections });
    debug('[dashboard/guru] payload built, sending response');

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    debug('[dashboard/guru] Unhandled route error', { error: message });
    if (error instanceof Error) debug(error.stack);
    // If we have context about collection failure, it should have been logged in safeGetCollection
    return NextResponse.json(buildEmptyPayload('Dashboard guru gagal memuat data', message), { status: 500 });
  }
}

function timestampToIso(value: unknown): string | null {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    const date = value.toDate();
    return date instanceof Date && Number.isFinite(date.getTime()) ? date.toISOString() : null;
  }
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  if (typeof value === 'string' && Number.isFinite(Date.parse(value))) return new Date(value).toISOString();
  return null;
}

function numericValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readNestedScore(value: unknown): number | null {
  if (!value || typeof value !== 'object' || !('score' in value)) return null;
  return numericValue(value.score);
}

function getCompletedStages(data: Record<string, unknown>): string[] {
  return Array.from(getCompletedModuleStages({
    completedStages: data.completedStages,
    sintaksList: data.sintaksList,
  }));
}

type AdminFirestore = NonNullable<typeof adminFirestore>;

function getComicCatalogSnapshots(firestore: AdminFirestore) {
  const references = COMIC_IDS.map((comicId) =>
    firestore.collection('comics').doc(`comic-${comicId}`)
  );
  return firestore.getAll(...references);
}

async function buildStudentInsightResponse(
  firestore: AdminFirestore,
  teacherRole: unknown,
  teacherSchoolName: string,
  studentUid: string,
): Promise<NextResponse> {
  let scopedStudentQuery = firestore.collection('users')
    .where('role', '==', 'student')
    .where('uid', '==', studentUid)
    .limit(10);
  if (teacherRole === 'teacher') {
    scopedStudentQuery = scopedStudentQuery.where('schoolName', '==', teacherSchoolName);
  }
  const [directProfile, matchingProfiles] = await Promise.all([
    firestore.collection('users').doc(studentUid).get(),
    scopedStudentQuery.get(),
  ]);
  const candidates = [
    ...(directProfile.exists ? [directProfile] : []),
    ...matchingProfiles.docs,
  ];
  const scopedDocuments = candidates.filter((document) => {
    const data = document.data();
    return isStudentAllowedForInsight({
      uid: data?.uid,
      id: document.id,
      role: data?.role,
      schoolName: data?.schoolName,
      duplicate: data?.duplicate,
    }, studentUid, teacherRole, teacherSchoolName);
  });
  const student = normalizeStudentDocuments(scopedDocuments.map(serializeUser))
    .find((profile) => profile.uid === studentUid);
  if (!student) {
    return NextResponse.json({ error: 'Siswa tidak ditemukan dalam cakupan kewenangan akun ini.' }, { status: 404 });
  }

  const comicSnapshots = await getComicCatalogSnapshots(firestore);
  const catalog = comicSnapshots
    .filter((document) => document.exists)
    .map((document) => serializeComic(document))
    .filter((comic) => Number.isInteger(comic.comicId) && comic.comicId > 0)
    .sort((left, right) => left.comicId - right.comicId)
    .map((comic) => {
      const definition = comicModules[comic.comicId as keyof typeof comicModules];
      return {
        comicId: comic.comicId,
        title: comic.title?.trim() || `Komik ${comic.comicId}`,
        definition,
        stages: definition
          ? buildModuleBlueprint(definition, new Map())
            .filter((stage) => stage.available && stage.id !== 'Report')
            .map((stage) => stage.id)
          : [],
      };
    });

  const progressReferences = [
    ...catalog.map((comic) =>
      firestore.collection('users').doc(studentUid).collection('progress').doc(`comic-${comic.comicId}`)
    ),
    firestore.collection('users').doc(studentUid).collection('progress').doc('evaluation-cinarai'),
  ];
  const progressSnapshots = progressReferences.length
    ? await firestore.getAll(...progressReferences)
    : [];
  const progress: StudentInsightProgress[] = [];
  let evaluationScore: number | null = null;
  progressSnapshots.forEach((snapshot, index) => {
    if (!snapshot.exists) return;
    const data = snapshot.data() as Record<string, unknown> | undefined;
    if (!data) return;
    if (snapshot.id === 'evaluation-cinarai') {
      const evaluation = data.evaluationCinarai;
      const grading = evaluation && typeof evaluation === 'object' && 'grading' in evaluation
        ? evaluation.grading
        : null;
      if (grading && typeof grading === 'object' && 'status' in grading && grading.status === 'graded'
        && 'totalScore' in grading) {
        const score = numericValue(grading.totalScore);
        if (score !== null && score >= 0 && score <= 40) evaluationScore = score;
      }
      return;
    }
    const comic = catalog[index];
    if (!comic) return;
    const storedPercentage = numericValue(data.percentage);
    const stageData = data.stageData;
    const assessments: Array<{ type: string; score: number }> = [];
    if (stageData && typeof stageData === 'object') {
      for (const stage of ['quiz', 'argumentation', 'application']) {
        const score = readNestedScore(Reflect.get(stageData, stage));
        if (score !== null) assessments.push({ type: stage, score });
      }
    }
    progress.push({
      comicId: comic.comicId,
      percentage: getModuleProgressPercentage({
        status: data.status,
        percentage: storedPercentage,
        completedStages: data.completedStages,
        sintaksList: data.sintaksList,
      }),
      status: getModuleStudentStatus({
        status: data.status,
        percentage: storedPercentage,
        completedStages: data.completedStages,
        currentStage: data.currentStage,
        readerPage: data.readerPage,
        readerCompleted: data.readerCompleted,
        stageData: data.stageData,
        sintaksList: data.sintaksList,
      }),
      completedStages: getCompletedStages(data),
      updatedAt: timestampToIso(data.updatedAt),
      assessments,
    });
  });

  const [answerSnapshot, activitySnapshot, applicationTimestampSnapshot, applicationLocalSnapshot, reflectionUserSnapshot, reflectionStudentSnapshot] = await Promise.all([
    firestore.collection('identification_answers').where('userId', '==', studentUid)
      .orderBy('updatedAt', 'desc').limit(STUDENT_INSIGHT_SAMPLE_LIMIT).get(),
    firestore.collection('activity').where('userId', '==', studentUid)
      .orderBy('occurredAt', 'desc').limit(STUDENT_INSIGHT_SAMPLE_LIMIT).get(),
    firestore.collection('application_activity').where('userId', '==', studentUid)
      .orderBy('timestamp', 'desc').limit(STUDENT_INSIGHT_SAMPLE_LIMIT).get(),
    firestore.collection('application_activity').where('userId', '==', studentUid)
      .orderBy('localTimestamp', 'desc').limit(STUDENT_INSIGHT_SAMPLE_LIMIT).get(),
    firestore.collection('reflection').where('userId', '==', studentUid)
      .orderBy('createdAt', 'desc').limit(STUDENT_INSIGHT_SAMPLE_LIMIT).get(),
    firestore.collection('reflection').where('studentId', '==', studentUid)
      .orderBy('createdAt', 'desc').limit(STUDENT_INSIGHT_SAMPLE_LIMIT).get(),
  ]);
  const sampleMayBeTruncated = [
    answerSnapshot,
    activitySnapshot,
    applicationTimestampSnapshot,
    applicationLocalSnapshot,
    reflectionUserSnapshot,
    reflectionStudentSnapshot,
  ].some((snapshot) => snapshot.size === STUDENT_INSIGHT_SAMPLE_LIMIT);
  const answers: StudentInsightAnswer[] = answerSnapshot.docs.flatMap((document) => {
    const data = document.data();
    const comicId = numericValue(data.comicId);
    const step = numericValue(data.step);
    const comic = catalog.find((entry) => entry.comicId === comicId);
    if (comicId === null || step === null || !comic) return [];
    const definition = comic.definition?.identification.questions[step];
    return [{
      comicId,
      step,
      question: definition?.question?.trim() || `Langkah identifikasi ${step + 1}`,
      selectedAnswer: stringValue(data.selectedAnswer),
      correctAnswer: stringValue(data.correctAnswer)
        ?? definition?.options.find((option) => option.correct)?.text
        ?? null,
      recordedAt: timestampToIso(data.updatedAt ?? data.createdAt),
    }];
  });
  const activities: StudentInsightActivity[] = activitySnapshot.docs.flatMap((document) => {
    const data = document.data();
    const occurredAt = timestampToIso(data.occurredAt);
    if (!occurredAt) return [];
    const knownTypes = ['login', 'lesson_started', 'lesson_completed', 'comic_started', 'comic_completed', 'reflection_submitted', 'badge_earned'];
    const rawType = stringValue(data.type);
    return [{
      type: rawType && knownTypes.includes(rawType) ? rawType : 'other',
      comicId: numericValue(data.metadata && typeof data.metadata === 'object' && 'comicId' in data.metadata
        ? data.metadata.comicId
        : null),
      occurredAt,
    }];
  });
  const applicationDocuments = new Map<string, DocumentSnapshot>();
  [...applicationTimestampSnapshot.docs, ...applicationLocalSnapshot.docs]
    .forEach((document) => applicationDocuments.set(document.id, document));
  const applications: StudentInsightApplication[] = Array.from(applicationDocuments.values()).map((document) => {
    const data = document.data();
    const coachType = ['positive', 'constructive', 'neutral'].includes(String(data?.coachType))
      ? String(data?.coachType)
      : null;
    const localTimestamp = typeof data?.localTimestamp === 'string'
      && Number.isFinite(Date.parse(data.localTimestamp))
      ? new Date(data.localTimestamp).toISOString()
      : null;
    return {
      comicId: numericValue(data?.comicId),
      coachType,
      recordedAt: timestampToIso(data?.timestamp) ?? localTimestamp,
    };
  }).sort((left, right) => Date.parse(right.recordedAt ?? '') - Date.parse(left.recordedAt ?? ''))
    .slice(0, STUDENT_INSIGHT_SAMPLE_LIMIT);
  const reflectionDocuments = new Map<string, DocumentSnapshot>();
  [...reflectionUserSnapshot.docs, ...reflectionStudentSnapshot.docs]
    .forEach((document) => reflectionDocuments.set(document.id, document));
  const reflections: StudentInsightReflection[] = Array.from(reflectionDocuments.values()).flatMap((document) => {
    const data = document.data();
    if (!data) return [];
    const rating = numericValue(data.rating);
    const confidence = numericValue(data.confidence);
    return [{
      rating: rating !== null && rating >= 1 && rating <= 5 ? rating : null,
      confidence: confidence !== null && confidence >= 1 && confidence <= 5 ? confidence : null,
      recordedAt: timestampToIso(data.submittedAt ?? data.createdAt ?? data.timestamp),
    }];
  }).sort((left, right) => Date.parse(right.recordedAt ?? '') - Date.parse(left.recordedAt ?? ''))
    .slice(0, STUDENT_INSIGHT_SAMPLE_LIMIT);
  const generatedAt = new Date();
  const facts = buildStudentInsightFacts({
    modules: catalog.map(({ comicId, title, stages }) => ({ comicId, title, stages })),
    progress,
    evaluationScore,
    answers,
    activities,
    applications,
    reflections,
    generatedAt,
    sampleLimitPerQuery: STUDENT_INSIGHT_SAMPLE_LIMIT,
    sampleMayBeTruncated,
  });
  catalog.filter((comic) => !comic.definition).forEach((comic) => {
    facts.limitations.push(`Blueprint pembelajaran komik ${comic.comicId} belum tersedia; rincian tahap untuk komik ini terbatas.`);
  });

  const profile = {
    uid: studentUid,
    displayName: student.displayName?.trim() || student.email || 'Siswa',
    email: student.email,
    schoolName: student.schoolName ?? '',
    classLevel: student.classLevel ?? null,
    gradeLevel: student.gradeLevel ?? null,
  };
  if (!facts.evidence.length) {
    return NextResponse.json({
      student: profile,
      facts,
      ai: null,
      aiError: 'Data pembelajaran yang dapat dianalisis belum tersedia. Data kosong tidak dianggap sebagai kegagalan siswa.',
      usage: null,
    });
  }

  const prompt = buildStudentInsightPrompt(facts);
  if (prompt.length > MAX_AI_PROMPT_CHARS) {
    return NextResponse.json({
      student: profile,
      facts,
      ai: null,
      aiError: 'Konteks bukti melebihi batas aman analisis AI. Fakta tersimpan tetap dapat ditinjau.',
      usage: null,
    });
  }
  const maxOutputTokens = 450;
  try {
    const response = await AiRouter.createDefault().generate({
      prompt,
      systemPrompt: 'Anda membantu guru meninjau bukti belajar seorang siswa. Input berisi agregat pendidikan yang diminimalkan. Jangan menebak identitas, mengarang fakta, atau menyimpulkan motivasi, emosi, kepribadian, maupun sebab psikologis. Progress tahap bukan bukti penguasaan. Setiap klaim dan saran wajib merujuk evidence key yang tersedia.',
      temperature: 0.2,
      maxTokens: maxOutputTokens,
    });
    const ai = parseStudentInsightResponse(
      response.content,
      new Set(getStudentInsightPromptEvidence(facts).map((item) => item.key))
    );
    if (!ai) {
      return NextResponse.json({
        student: profile,
        facts,
        ai: null,
        aiError: 'Respons AI tidak memenuhi format atau referensi bukti yang tervalidasi.',
        usage: {
          provider: response.provider,
          estimatedInputTokens: Math.ceil(prompt.length / 4),
          maxOutputTokens,
          maxProviderAttempts: 4,
          actualTokenUsageAvailable: false,
        },
      });
    }
    return NextResponse.json({
      student: profile,
      facts,
      ai,
      aiError: null,
      usage: {
        provider: response.provider,
        estimatedInputTokens: Math.ceil(prompt.length / 4),
        maxOutputTokens,
        maxProviderAttempts: 4,
        actualTokenUsageAvailable: false,
      },
    });
  } catch (error) {
    debug('[dashboard/guru] individual AI analysis failed', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    const timedOut = error instanceof AiRouterTimeoutError;
    return NextResponse.json({
      student: profile,
      facts,
      ai: null,
      aiError: timedOut
        ? 'Batas waktu analisis AI terlampaui. Fakta tersimpan tetap dapat ditinjau.'
        : 'Layanan AI tidak tersedia. Fakta tersimpan tetap dapat ditinjau.',
      usage: {
        estimatedInputTokens: Math.ceil(prompt.length / 4),
        maxOutputTokens,
        maxProviderAttempts: 4,
        actualTokenUsageAvailable: false,
      },
    });
  }
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > 16_384) {
    return NextResponse.json({ error: 'Body permintaan melebihi batas ukuran.' }, { status: 413 });
  }
  const parsedBody = await readBoundedJsonBody(request, 16_384);
  if (!parsedBody.ok && parsedBody.reason === 'too_large') {
    return NextResponse.json({ error: 'Body permintaan melebihi batas ukuran.' }, { status: 413 });
  }
  if (!parsedBody.ok) {
    return NextResponse.json({ error: 'Body permintaan tidak valid.' }, { status: 400 });
  }
  const requestBody = parsedBody.value;
  if (!requestBody || typeof requestBody !== 'object' || !('action' in requestBody)
    || (requestBody.action !== 'class-insight' && requestBody.action !== 'student-insight')) {
    return NextResponse.json({ error: 'Aksi analisis dashboard tidak valid.' }, { status: 400 });
  }
  const requestedStudentUid = 'studentUid' in requestBody && typeof requestBody.studentUid === 'string'
    ? requestBody.studentUid.trim()
    : '';
  if (requestBody.action === 'student-insight'
    && (!requestedStudentUid || requestedStudentUid.length > 128 || /[\u0000-\u001f]/.test(requestedStudentUid))) {
    return NextResponse.json({ error: 'Identitas siswa tidak valid.' }, { status: 400 });
  }
  if (!adminAuth || !adminFirestore) {
    return NextResponse.json({ error: 'Layanan dashboard belum tersedia.' }, { status: 503 });
  }

  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return NextResponse.json({ error: 'Sesi tidak valid.' }, { status: 401 });

  let decodedToken: Awaited<ReturnType<typeof verifyIdToken>>;
  try {
    decodedToken = await verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: 'Sesi tidak valid.' }, { status: 401 });
  }
  if (!decodedToken?.uid) return NextResponse.json({ error: 'Sesi tidak valid.' }, { status: 401 });

  try {
    const firestore = adminFirestore;
    const profileSnapshot = await firestore.collection('users').doc(decodedToken.uid).get();
    const profile = profileSnapshot.data();
    const role = profile?.role;
    const schoolName = typeof profile?.schoolName === 'string' ? profile.schoolName.trim() : '';
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json({ error: 'Akun ini tidak memiliki akses guru.' }, { status: 403 });
    }
    if (role === 'teacher' && !schoolName) {
      return NextResponse.json({ error: 'Profil guru belum memiliki sekolah.' }, { status: 403 });
    }
    const rateLimited = await consumeTeacherAiRateLimit(firestore, decodedToken.uid, CLASS_INSIGHT_COOLDOWN_MS);
    if (rateLimited) {
      return NextResponse.json(
        { error: 'Analisis AI dibatasi satu kali per akun setiap 60 detik. Coba lagi setelah jeda tersebut.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
    if (requestBody.action === 'student-insight') {
      return buildStudentInsightResponse(firestore, role, schoolName, requestedStudentUid);
    }

    let studentQuery = firestore.collection('users').where('role', '==', 'student');
    if (role === 'teacher') studentQuery = studentQuery.where('schoolName', '==', schoolName);
    studentQuery = studentQuery.limit(CLASS_INSIGHT_MAX_STUDENTS + 1);
    const [studentSnapshot, comicSnapshots] = await Promise.all([
      studentQuery.get(),
      getComicCatalogSnapshots(firestore),
    ]);
    const rosterMayBeTruncated = studentSnapshot.docs.length > CLASS_INSIGHT_MAX_STUDENTS;
    const students = normalizeStudentDocuments(
      studentSnapshot.docs.slice(0, CLASS_INSIGHT_MAX_STUDENTS).map(serializeUser)
    );
    const comics = comicSnapshots
      .filter((document) => document.exists)
      .map((document) => serializeComic(document))
      .filter((comic) => Number.isInteger(comic.comicId) && comic.comicId > 0)
      .sort((left, right) => left.comicId - right.comicId)
      .map((comic) => {
        const moduleDefinition = comicModules[comic.comicId as keyof typeof comicModules];
        return {
          comicId: comic.comicId,
          title: comic.title?.trim() || `Komik ${comic.comicId}`,
          stages: moduleDefinition
            ? buildModuleBlueprint(moduleDefinition, new Map())
              .filter((stage) => stage.available && stage.id !== 'Report')
              .map((stage) => stage.id)
            : [],
        };
      });

    const progressReferences = students.flatMap((student) => [
      ...comics.map((comic) =>
        firestore.collection('users').doc(student.uid).collection('progress').doc(`comic-${comic.comicId}`)
      ),
      firestore.collection('users').doc(student.uid).collection('progress').doc('evaluation-cinarai'),
    ]);
    const progressSnapshots = [];
    for (let offset = 0; offset < progressReferences.length; offset += 100) {
      progressSnapshots.push(...await firestore.getAll(...progressReferences.slice(offset, offset + 100)));
    }
    const progressByStudent = new Map<string, ClassInsightProgress[]>();
    const evaluationScores = new Map<string, number>();
    progressSnapshots.forEach((snapshot, index) => {
      if (!snapshot.exists) return;
      const studentUid = progressReferences[index].parent.parent?.id;
      const data = snapshot.data() as Record<string, unknown> | undefined;
      if (!studentUid || !data) return;
      if (snapshot.id === 'evaluation-cinarai') {
        const evaluation = data.evaluationCinarai;
        if (evaluation && typeof evaluation === 'object' && 'grading' in evaluation) {
          const grading = evaluation.grading;
          if (grading && typeof grading === 'object' && 'totalScore' in grading
            && 'status' in grading && grading.status === 'graded') {
            const score = numericValue(grading.totalScore);
            if (score !== null && score >= 0 && score <= 40) evaluationScores.set(studentUid, score);
          }
        }
        return;
      }
      const comicId = numericValue(data.comicId) ?? Number(snapshot.id.replace('comic-', ''));
      if (!Number.isInteger(comicId) || !comics.some((comic) => comic.comicId === comicId)) return;
      const storedPercentage = numericValue(data.percentage);
      const progress: ClassInsightProgress = {
        comicId,
        percentage: getModuleProgressPercentage({
          status: data.status,
          percentage: storedPercentage,
          completedStages: data.completedStages,
          sintaksList: data.sintaksList,
        }),
        status: getModuleStudentStatus({
          status: data.status,
          percentage: storedPercentage,
          completedStages: data.completedStages,
          currentStage: data.currentStage,
          readerPage: data.readerPage,
          readerCompleted: data.readerCompleted,
          stageData: data.stageData,
          sintaksList: data.sintaksList,
        }),
        completedStages: getCompletedStages(data),
        updatedAt: timestampToIso(data.updatedAt),
        assessmentScores: [],
      };
      const stageData = data.stageData;
      if (stageData && typeof stageData === 'object') {
        for (const stage of ['quiz', 'argumentation', 'application']) {
          const score = readNestedScore(Reflect.get(stageData, stage));
          if (score !== null) progress.assessmentScores.push({ type: stage, score });
        }
      }
      const list = progressByStudent.get(studentUid) ?? [];
      list.push(progress);
      progressByStudent.set(studentUid, list);
    });
    evaluationScores.forEach((score, uid) => {
      const studentProgress = progressByStudent.get(uid) ?? [];
      studentProgress.push({
        comicId: -1,
        percentage: null,
        status: 'completed',
        completedStages: [],
        updatedAt: null,
        assessmentScores: [{ type: 'Evaluasi CINARAI (0–40)', score }],
      });
      progressByStudent.set(uid, studentProgress);
    });
    const insightStudents: ClassInsightStudent[] = students.map((student) => {
      const progress = progressByStudent.get(student.uid) ?? [];
      const lastProgress = progress.flatMap((item) => item.updatedAt ? [item.updatedAt] : [])
        .sort((left, right) => Date.parse(right) - Date.parse(left))[0] ?? null;
      return {
        uid: student.uid,
        name: student.displayName?.trim() || student.email || student.uid,
        progress,
        lastRecordedProgressAt: lastProgress,
      };
    });

    const studentUids = students.map((student) => student.uid);
    const answers: ClassInsightAnswer[] = [];
    const activities: ClassInsightActivity[] = [];
    const reflections: ClassInsightReflection[] = [];
    const applications: ClassInsightApplication[] = [];
    let sampleMayBeTruncated = rosterMayBeTruncated;
    for (let offset = 0; offset < studentUids.length; offset += CLASS_INSIGHT_CHUNK_SIZE) {
      const uidChunk = studentUids.slice(offset, offset + CLASS_INSIGHT_CHUNK_SIZE);
      const [answerSnapshot, activitySnapshot, applicationSnapshot, reflectionByUserSnapshot, reflectionByStudentSnapshot] = await Promise.all([
        firestore.collection('identification_answers').where('userId', 'in', uidChunk)
          .orderBy('updatedAt', 'desc').limit(CLASS_INSIGHT_SAMPLE_LIMIT).get(),
        firestore.collection('activity').where('userId', 'in', uidChunk)
          .orderBy('occurredAt', 'desc').limit(CLASS_INSIGHT_SAMPLE_LIMIT).get(),
        firestore.collection('application_activity').where('userId', 'in', uidChunk)
          .orderBy('timestamp', 'desc').limit(CLASS_INSIGHT_SAMPLE_LIMIT).get(),
        firestore.collection('reflection').where('userId', 'in', uidChunk)
          .orderBy('createdAt', 'desc').limit(CLASS_INSIGHT_SAMPLE_LIMIT).get(),
        firestore.collection('reflection').where('studentId', 'in', uidChunk)
          .orderBy('createdAt', 'desc').limit(CLASS_INSIGHT_SAMPLE_LIMIT).get(),
      ]);
      sampleMayBeTruncated ||= [
        answerSnapshot,
        activitySnapshot,
        applicationSnapshot,
        reflectionByUserSnapshot,
        reflectionByStudentSnapshot,
      ].some((snapshot) => snapshot.size === CLASS_INSIGHT_SAMPLE_LIMIT);

      answerSnapshot.docs.forEach((document) => {
        const data = document.data();
        const userId = stringValue(data.userId);
        const comicId = numericValue(data.comicId);
        const step = numericValue(data.step);
        if (!userId || comicId === null || step === null) return;
        const definition = comicModules[comicId as keyof typeof comicModules]?.identification.questions[step];
        const selectedAnswer = stringValue(data.selectedAnswer);
        const correctAnswer = stringValue(data.correctAnswer)
          ?? definition?.options.find((option) => option.correct)?.text
          ?? null;
        answers.push({
          userId,
          comicId,
          step,
          selectedAnswer,
          correctAnswer,
          question: definition?.question?.trim() || `Langkah identifikasi ${step + 1}`,
          recordedAt: timestampToIso(data.updatedAt ?? data.createdAt),
        });
      });
      activitySnapshot.docs.forEach((document) => {
        const data = document.data();
        const userId = stringValue(data.userId);
        const type = stringValue(data.type);
        const occurredAt = timestampToIso(data.occurredAt);
        if (!userId || !type || !occurredAt) return;
        activities.push({
          userId,
          type,
          comicId: numericValue(data.metadata && typeof data.metadata === 'object' && 'comicId' in data.metadata ? data.metadata.comicId : null),
          occurredAt,
        });
      });
      applicationSnapshot.docs.forEach((document) => {
        const data = document.data();
        const userId = stringValue(data.userId);
        if (!userId) return;
        applications.push({
          userId,
          comicId: numericValue(data.comicId),
          coachType: ['positive', 'constructive', 'neutral'].includes(String(data.coachType))
            ? String(data.coachType)
            : null,
          recordedAt: timestampToIso(data.timestamp ?? data.localTimestamp),
        });
      });
      const reflectionDocuments = new Map<string, DocumentSnapshot>();
      [...reflectionByUserSnapshot.docs, ...reflectionByStudentSnapshot.docs]
        .forEach((document) => reflectionDocuments.set(document.id, document));
      reflectionDocuments.forEach((document) => {
        const data = document.data();
        if (!data) return;
        const userId = stringValue(data.userId) ?? stringValue(data.studentId);
        if (!userId) return;
        const confidenceValue = numericValue(data.confidence ?? data.rating);
        reflections.push({
          userId,
          comicId: numericValue(data.comicId ?? data.moduleId),
          confidence: confidenceValue !== null && confidenceValue >= 1 && confidenceValue <= 5 ? confidenceValue : null,
          recordedAt: timestampToIso(data.timestamp ?? data.submittedAt ?? data.createdAt),
        });
      });
    }

    const facts = buildClassInsightFacts({
      students: insightStudents,
      comics,
      answers,
      activities,
      reflections,
      applications,
      generatedAt: new Date(),
      sampleLimitPerQuery: CLASS_INSIGHT_SAMPLE_LIMIT,
      sampleMayBeTruncated,
      rosterMayBeTruncated,
    });
    const hasLearningEvidence = facts.scope.assessmentRecords > 0
      || facts.scope.activityRecords > 0
      || facts.scope.applicationRecords > 0
      || facts.scope.reflectionRecords > 0
      || facts.summary.recordedProgressCount > 0
      || facts.assessments.length > 0;
    if (!hasLearningEvidence) {
      return NextResponse.json({
        facts,
        ai: null,
        aiError: 'Data pembelajaran belum cukup untuk meminta analisis AI. Fakta kelas tetap ditampilkan.',
        usage: null,
      });
    }

    const prompt = buildClassInsightPrompt(facts);
    if (prompt.length > MAX_AI_PROMPT_CHARS) {
      return NextResponse.json({
        facts,
        ai: null,
        aiError: 'Konteks analisis melebihi batas aman; fakta kelas tetap dapat ditinjau.',
        usage: null,
      });
    }
    const maxOutputTokens = 300;
    try {
      const response = await AiRouter.createDefault().generate({
        prompt,
        systemPrompt: 'Anda membantu guru mengambil keputusan pembelajaran. Data hanyalah agregat anonim dari Firestore. Jangan mengidentifikasi siswa, menambah fakta, atau menyimpulkan sifat psikologis. Jika bukti lemah, katakan demikian.',
        temperature: 0.2,
        maxTokens: maxOutputTokens,
      });
      const ai = parseClassInsightResponse(response.content);
      if (!ai) {
        return NextResponse.json({
          facts,
          ai: null,
          aiError: 'Respons AI tidak memenuhi format analisis yang tervalidasi.',
          usage: {
            provider: response.provider,
            estimatedInputTokens: Math.ceil(prompt.length / 4),
            maxOutputTokens,
            maxProviderAttempts: 4,
            actualTokenUsageAvailable: false,
          },
        });
      }
      return NextResponse.json({
        facts,
        ai,
        aiError: null,
        usage: {
          provider: response.provider,
          estimatedInputTokens: Math.ceil(prompt.length / 4),
          maxOutputTokens,
          maxProviderAttempts: 4,
          actualTokenUsageAvailable: false,
        },
      });
    } catch (error) {
      debug('[dashboard/guru] class AI analysis failed', {
        uid: decodedToken.uid,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      const timedOut = error instanceof AiRouterTimeoutError;
      return NextResponse.json({
        facts,
        ai: null,
        aiError: timedOut
          ? 'Batas waktu analisis AI terlampaui. Fakta kelas berhasil dihitung; coba lagi nanti.'
          : 'Layanan AI tidak tersedia. Fakta kelas berhasil dihitung; coba lagi nanti.',
        usage: {
          estimatedInputTokens: Math.ceil(prompt.length / 4),
          maxOutputTokens,
          maxProviderAttempts: 4,
          actualTokenUsageAvailable: false,
        },
      });
    }
  } catch (error) {
    debug('[dashboard/guru] class insight data failed', {
      uid: decodedToken.uid,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Data analisis kelas gagal dimuat.' }, { status: 500 });
  }
}
