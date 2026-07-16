import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore, adminInitializationError, verifyIdToken } from '@/lib/firebase/admin';
import type { ActivityDocument, ComicDocument, ComicProgressDocument, ReflectionDocument, UserDocument } from '@/types/firestore';
import type { DocumentSnapshot } from 'firebase-admin/firestore';

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

export async function GET(request: NextRequest) {
  if (!adminAuth) {
    const msg = adminInitializationError
      ? adminInitializationError
      : 'Admin Auth not initialized. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in environment.';
    return NextResponse.json(
      { success: false, message: msg, error: 'Admin Auth unavailable' },
      { status: 500 }
    );
  }

  if (!adminFirestore) {
    const msg = adminInitializationError
      ? adminInitializationError
      : 'Admin Firestore not initialized. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in environment.';
    return NextResponse.json(
      { success: false, message: msg, error: 'Admin Firestore unavailable' },
      { status: 500 }
    );
  }

  const headerValue = request.headers.get('authorization');
  const token = headerValue?.startsWith('Bearer ') ? headerValue.slice(7) : null;

  if (!token) {
    return NextResponse.json({ success: false, message: 'Unauthorized: token not provided' }, { status: 401 });
  }

  const decodedToken = await verifyIdToken(token);
  if (!decodedToken?.uid) {
    return NextResponse.json({ success: false, message: 'Unauthorized: invalid token' }, { status: 401 });
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
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch user profile',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }

  if (role !== 'teacher' && role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Akun ini bukan akun guru.' }, { status: 403 });
  }

  const results = await Promise.allSettled([
    (async () => {
      try {
        return await adminFirestore.collection('users').where('role', '==', 'student').get();
      } catch {
        return null;
      }
    })(),
    (async () => {
      try {
        return await adminFirestore.collection('comics').get();
      } catch {
        return null;
      }
    })(),
    (async () => {
      try {
        return await adminFirestore.collectionGroup('progress').get();
      } catch {
        return null;
      }
    })(),
    (async () => {
      try {
        return await adminFirestore.collection('activity').orderBy('occurredAt', 'desc').limit(20).get();
      } catch {
        return null;
      }
    })(),
    (async () => {
      try {
        return await adminFirestore.collection('reflection').orderBy('createdAt', 'desc').limit(200).get();
      } catch {
        return null;
      }
    })(),
  ]);

  const studentsSnapshot = results[0]?.status === 'fulfilled' ? results[0].value : null;
  const comicsSnapshot = results[1]?.status === 'fulfilled' ? results[1].value : null;
  const progressSnapshot = results[2]?.status === 'fulfilled' ? results[2].value : null;
  const activitySnapshot = results[3]?.status === 'fulfilled' ? results[3].value : null;
  const reflectionsSnapshot = results[4]?.status === 'fulfilled' ? results[4].value : null;

  const students = studentsSnapshot ? studentsSnapshot.docs.map(serializeUser) : [];
  const comics = comicsSnapshot ? comicsSnapshot.docs.map(serializeComic) : [];
  const progressDocuments = progressSnapshot ? progressSnapshot.docs.map(serializeProgress) : [];
  const activities = activitySnapshot ? activitySnapshot.docs.map(serializeActivity) : [];
  const reflections = reflectionsSnapshot ? reflectionsSnapshot.docs.map(serializeReflection) : [];

  return NextResponse.json({
    success: true,
    students,
    comics,
    progressDocuments,
    activities,
    reflections,
    generatedAt: new Date().toISOString(),
  });
}
