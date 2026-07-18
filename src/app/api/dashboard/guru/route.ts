import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore, adminInitializationError, verifyIdToken } from '@/lib/firebase/admin';
import type { ActivityDocument, ComicDocument, ComicProgressDocument, ReflectionDocument, UserDocument } from '@/types/firestore';
import type { DocumentSnapshot } from 'firebase-admin/firestore';

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
    uid: data?.uid ?? document.id,
    email: data?.email ?? '',
    displayName: data?.displayName,
    photoURL: data?.photoURL,
    role: (data?.role as UserDocument['role']) ?? 'student',
    schoolName: data?.schoolName,
    gradeLevel: data?.gradeLevel,
    isActive: data?.isActive ?? true,
    lastLoginAt: data?.lastLoginAt as UserDocument['lastLoginAt'],
    createdAt: data?.createdAt as UserDocument['createdAt'],
    updatedAt: data?.updatedAt as UserDocument['updatedAt'],
  };
}

function serializeProgress(document: DocumentSnapshot): ComicProgressDocument {
  const data = document.data() as Partial<ComicProgressDocument> | undefined;
  return {
    id: document.id,
    userId: data?.userId ?? document.ref.parent.parent?.id ?? '',
    comicId: data?.comicId ?? Number(document.id.replace('comic-', '')),
    completedStage: data?.completedStage ?? '',
    completedPages: data?.completedPages ?? 0,
    percentage: data?.percentage ?? 0,
    status: data?.status ?? 'not_started',
    sintaksList: data?.sintaksList ?? [],
    introspection: data?.introspection,
    completedAt: data?.completedAt as ComicProgressDocument['completedAt'],
    updatedAt: data?.updatedAt as ComicProgressDocument['updatedAt'],
    createdAt: data?.createdAt as ComicProgressDocument['createdAt'],
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
}): DashboardRoutePayload {
  const students = payload.students ?? [];
  const comics = payload.comics ?? [];
  const progressDocuments = payload.progressDocuments ?? [];
  const activities = payload.activities ?? [];
  const reflections = payload.reflections ?? [];
  const averageProgress = progressDocuments.length
    ? Math.round(progressDocuments.reduce((sum, document) => sum + (document.percentage ?? 0), 0) / progressDocuments.length)
    : 0;
  const completedModules = progressDocuments.filter((document) => document.status === 'completed' || (document.percentage ?? 0) >= 100).length;

  return {
    success: true,
    students,
    comics,
    progressDocuments,
    activities,
    reflections,
    analytics: [],
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
  try {
    const data = await operation();
    return { ok: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[dashboard/guru] Firestore query failed for ${label}`, { error: message });
    return { ok: false, data: null, error: message };
  }
}

export async function GET(request: NextRequest) {
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
      console.error('[dashboard/guru] Firebase Admin env validation failed', { missingEnv, message });
      return NextResponse.json(buildEmptyPayload(message, 'Firebase Admin unavailable'), { status: 200 });
    }

    if (!adminAuth) {
      const msg = adminInitializationError
        ? adminInitializationError
        : 'Admin Auth not initialized. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in environment.';
      console.error('[dashboard/guru] Admin Auth unavailable', { message: msg });
      return NextResponse.json(buildEmptyPayload(msg, 'Admin Auth unavailable'), { status: 200 });
    }

    if (!adminFirestore) {
      const msg = adminInitializationError
        ? adminInitializationError
        : 'Admin Firestore not initialized. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in environment.';
      console.error('[dashboard/guru] Admin Firestore unavailable', { message: msg });
      return NextResponse.json(buildEmptyPayload(msg, 'Admin Firestore unavailable'), { status: 200 });
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

    try {
      const profileSnapshot = await adminFirestore.collection('users').doc(uid).get();
      if (profileSnapshot.exists) {
        const userData = profileSnapshot.data() as Record<string, unknown> | undefined;
        role = typeof userData?.role === 'string' ? userData.role : undefined;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[dashboard/guru] Failed to fetch user profile', { error: message, uid });
      return NextResponse.json(buildEmptyPayload('Failed to fetch user profile', message), { status: 200 });
    }

    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(buildEmptyPayload('Akun ini bukan akun guru.', 'Forbidden'), { status: 403 });
    }

    const firestore = adminFirestore;
    if (!firestore) {
      console.error('[dashboard/guru] Firestore client unavailable before querying collections');
      return NextResponse.json(buildEmptyPayload('Firestore client unavailable', 'Firestore unavailable'), { status: 200 });
    }

    const [studentsResult, comicsResult, progressResult, activityResult, reflectionsResult] = await Promise.all([
      safeGetCollection('users', async () => firestore.collection('users').where('role', '==', 'student').get()),
      safeGetCollection('comics', async () => firestore.collection('comics').get()),
      safeGetCollection('progress', async () => firestore.collectionGroup('progress').get()),
      safeGetCollection('activity', async () => firestore.collection('activity').orderBy('occurredAt', 'desc').limit(20).get()),
      safeGetCollection('reflection', async () => firestore.collection('reflection').orderBy('createdAt', 'desc').limit(200).get()),
    ]);

    const studentsSnapshot = studentsResult.ok && studentsResult.data ? studentsResult.data : null;
    const comicsSnapshot = comicsResult.ok && comicsResult.data ? comicsResult.data : null;
    const progressSnapshot = progressResult.ok && progressResult.data ? progressResult.data : null;
    const activitySnapshot = activityResult.ok && activityResult.data ? activityResult.data : null;
    const reflectionsSnapshot = reflectionsResult.ok && reflectionsResult.data ? reflectionsResult.data : null;

    const students = studentsSnapshot ? studentsSnapshot.docs.map(serializeUser) : [];
    const comics = comicsSnapshot ? comicsSnapshot.docs.map(serializeComic) : [];
    const progressDocuments = progressSnapshot ? progressSnapshot.docs.map(serializeProgress) : [];
    const activities = activitySnapshot ? activitySnapshot.docs.map(serializeActivity) : [];
    const reflections = reflectionsSnapshot ? reflectionsSnapshot.docs.map(serializeReflection) : [];

    return NextResponse.json(buildPayloadFromCollections({ students, comics, progressDocuments, activities, reflections }), { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[dashboard/guru] Unhandled route error', { error: message });
    return NextResponse.json(buildEmptyPayload('Dashboard guru gagal memuat data', message), { status: 200 });
  }
}
