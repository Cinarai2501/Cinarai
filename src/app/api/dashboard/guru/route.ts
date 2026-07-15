import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore, verifyIdToken } from '@/lib/firebase/admin';
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
  const headerValue = request.headers.get('authorization');
  const token = headerValue?.startsWith('Bearer ') ? headerValue.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const decodedToken = await verifyIdToken(token);
  if (!decodedToken || !decodedToken.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!adminAuth) {
    return NextResponse.json({ error: 'Admin auth unavailable' }, { status: 500 });
  }

  if (!adminFirestore) {
    return NextResponse.json({ error: 'Admin firestore unavailable' }, { status: 500 });
  }

  const profileSnapshot = await adminFirestore.collection('users').doc(decodedToken.uid).get();
  const role = profileSnapshot.exists ? (profileSnapshot.data()?.role as string | undefined) : undefined;

  if (role !== 'teacher' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [studentsSnapshot, comicsSnapshot, progressSnapshot, activitySnapshot, reflectionsSnapshot] = await Promise.all([
    adminFirestore.collection('users').where('role', '==', 'student').get(),
    adminFirestore.collection('comics').get(),
    adminFirestore.collectionGroup('progress').get(),
    adminFirestore.collection('activity').orderBy('occurredAt', 'desc').limit(20).get(),
    adminFirestore.collection('reflection').orderBy('createdAt', 'desc').limit(200).get(),
  ]);

  const students = studentsSnapshot.docs.map(serializeUser);
  const comics = comicsSnapshot.docs.map(serializeComic);
  const progressDocuments = progressSnapshot.docs.map(serializeProgress);
  const activities = activitySnapshot.docs.map(serializeActivity);
  const reflections = reflectionsSnapshot.docs.map(serializeReflection);

  return NextResponse.json({
    students,
    comics,
    progressDocuments,
    activities,
    reflections,
    generatedAt: new Date().toISOString(),
  });
}
