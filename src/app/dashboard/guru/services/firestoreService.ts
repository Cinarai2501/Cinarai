import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type Unsubscribe,
  type DocumentData,
  type Query,
  type QuerySnapshot,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import type { ComicDocument, ComicProgressDocument, UserDocument } from '@/types/firestore';
import {
  createFirestoreOperationFailure,
  logFirestoreOperationFailure,
  type FirestoreOperationFailure,
} from './firestoreDiagnostics';

export type StudentProgressSnapshot = Record<string, unknown> & { id: string; userId: string };

export interface GuruRecentActivity {
  id: string;
  userId: string;
  title: string;
  description?: string;
  timestamp: unknown;
}

function subscribeWithDiagnostics<T extends DocumentData>(
  source: Query<T>,
  operation: string,
  path: string,
  context: string,
  onData: (snapshot: QuerySnapshot<T>) => void,
  onError: (failure: FirestoreOperationFailure) => void,
  onRecovered?: (operation: string) => void
): Unsubscribe {
  return onSnapshot(source, (snapshot) => {
    onRecovered?.(operation);
    onData(snapshot);
  }, (error) => {
    const failure = createFirestoreOperationFailure(error, operation, path, context);
    logFirestoreOperationFailure(failure);
    onError(failure);
  });
}

function timestampMillis(value: unknown): number | null {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
  if (typeof value === 'string' || typeof value === 'number') {
    const normalized = typeof value === 'number' && value < 1_000_000_000_000 ? value * 1000 : value;
    const time = new Date(normalized).getTime();
    return Number.isFinite(time) ? time : null;
  }
  if (typeof value === 'object' && value !== null) {
    const timestamp = value as { toDate?: () => Date; seconds?: number; nanoseconds?: number };
    if (typeof timestamp.toDate === 'function') {
      const date = timestamp.toDate();
      return date instanceof Date && Number.isFinite(date.getTime()) ? date.getTime() : null;
    }
    if (typeof timestamp.seconds === 'number') {
      return timestamp.seconds * 1000 + (timestamp.nanoseconds ?? 0) / 1_000_000;
    }
  }
  return null;
}

export function subscribeRecentGuruActivities(
  onData: (activities: GuruRecentActivity[]) => void,
  onError: (failure: FirestoreOperationFailure) => void,
  onRecovered?: (operation: string) => void
): Unsubscribe {
  const sources = new Map<string, GuruRecentActivity[]>();
  const ready = new Set<string>();
  const sourceCount = 4;
  const emit = () => {
    if (ready.size !== sourceCount) return;
    const latest = Array.from(sources.values()).flat()
      .filter((activity) => timestampMillis(activity.timestamp) !== null)
      .sort((left, right) => (timestampMillis(right.timestamp) ?? 0) - (timestampMillis(left.timestamp) ?? 0))
      .slice(0, 20);
    onData(latest);
  };
  const subscribe = (
    source: string,
    collectionName: string,
    timestampField: string,
    createActivity: (id: string, data: Record<string, unknown>) => GuruRecentActivity
  ) => subscribeWithDiagnostics(
    query(collection(firestore, collectionName), orderBy(timestampField, 'desc'), limit(20)),
    `subscribeRecentGuruActivities.${source}`,
    collectionName,
    'useGuruDashboard',
    (snap) => {
      sources.set(source, snap.docs.map((document) => createActivity(document.id, document.data())));
      ready.add(source);
      emit();
    },
    (error) => {
      if (!sources.has(source)) sources.set(source, []);
      ready.add(source);
      onError(error);
      emit();
    },
    onRecovered
  );
  const toString = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : undefined;
  const unsubscribers = [
    subscribe('activity', 'activity', 'occurredAt', (id, data) => ({
      id: `activity:${id}`,
      userId: typeof data.userId === 'string' ? data.userId : '',
      title: toString(data.title) ?? toString(data.type) ?? 'Aktivitas belajar',
      description: toString(data.description),
      timestamp: data.occurredAt,
    })),
    subscribe('application', 'application_activity', 'timestamp', (id, data) => ({
      id: `application:${id}`,
      userId: typeof data.userId === 'string' ? data.userId : '',
      title: `Penerapan Komik ${String(data.comicId ?? '—')}`,
      description: [toString(data.selectedAnswer), toString(data.studentReason)].filter(Boolean).join(' · ') || undefined,
      timestamp: data.timestamp,
    })),
    subscribe('reflection', 'reflection', 'createdAt', (id, data) => ({
      id: `reflection:${id}`,
      userId: typeof data.userId === 'string' ? data.userId : typeof data.studentId === 'string' ? data.studentId : '',
      title: `Refleksi Komik ${String(data.comicId ?? data.moduleId ?? '—')}`,
      description: toString(data.reflectionText) ?? toString(data.response),
      timestamp: data.createdAt,
    })),
    subscribe('identification', 'identification_answers', 'updatedAt', (id, data) => ({
      id: `identification:${id}`,
      userId: typeof data.userId === 'string' ? data.userId : '',
      title: `Identifikasi Komik ${String(data.comicId ?? '—')} · Langkah ${String(data.step ?? '—')}`,
      description: [toString(data.selectedAnswer), toString(data.reason)].filter(Boolean).join(' · ') || undefined,
      timestamp: data.updatedAt,
    })),
  ];
  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

export function subscribeStudents(
  onData: (students: UserDocument[]) => void,
  onError: (failure: FirestoreOperationFailure) => void,
  onRecovered?: (operation: string) => void
): Unsubscribe {
  const q = query(
    collection(firestore, 'users'),
    where('role', '==', 'student'),
    orderBy('displayName', 'asc')
  );
  return subscribeWithDiagnostics(
    q,
    'subscribeStudents',
    'users',
    'useGuruDashboard',
    (snap) => {
      const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserDocument));
      const students = raw.filter((u) => u.duplicate !== true);
      onData(students);
    },
    onError,
    onRecovered
  );
}

export function subscribeComics(
  onData: (comics: ComicDocument[]) => void,
  onError: (failure: FirestoreOperationFailure) => void,
  onRecovered?: (operation: string) => void
): Unsubscribe {
  const q = query(collection(firestore, 'comics'), orderBy('order', 'asc'));
  return subscribeWithDiagnostics(
    q,
    'subscribeComics',
    'comics',
    'useGuruDashboard',
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ComicDocument))),
    onError,
    onRecovered
  );
}

export async function fetchStudentProgress(uid: string): Promise<ComicProgressDocument[]> {
  const snap = await getDocs(collection(firestore, 'users', uid, 'progress'));
  return snap.docs.map((d) => ({ id: d.id, userId: uid, ...d.data() } as ComicProgressDocument));
}

export async function fetchAllStudentProgress(
  uids: string[]
): Promise<ComicProgressDocument[]> {
  if (uids.length === 0) return [];
  const chunks: string[][] = [];
  for (let i = 0; i < uids.length; i += 10) chunks.push(uids.slice(i, i + 10));
  const results = await Promise.all(
    chunks.flatMap((chunk) => chunk.map((uid) => fetchStudentProgress(uid)))
  );
  return results.flat();
}

export function subscribeStudentProgress(
  uid: string,
  onData: (progress: StudentProgressSnapshot[]) => void,
  onError: (failure: FirestoreOperationFailure) => void,
  context = 'useStudentDetail',
  onRecovered?: (operation: string) => void
): Unsubscribe {
  return subscribeWithDiagnostics(
    collection(firestore, 'users', uid, 'progress'),
    'subscribeStudentProgress',
    'users/{uid}/progress',
    context,
    (snap) =>
      onData(snap.docs.map((d) => ({ id: d.id, userId: uid, ...d.data() }))),
    onError,
    onRecovered
  );
}

export function subscribeStudentDoc(
  uid: string,
  onData: (student: UserDocument | null) => void,
  onError: (failure: FirestoreOperationFailure) => void,
  onRecovered?: (operation: string) => void
): Unsubscribe {
  const q = query(collection(firestore, 'users'), where('uid', '==', uid));
  return subscribeWithDiagnostics(
    q,
    'subscribeStudentDoc',
    'users',
    'useStudentDetail',
    (snap) => {
      const document = snap.docs[0];
      onData(document ? { id: document.id, ...document.data() } as UserDocument : null);
    },
    onError,
    onRecovered
  );
}

export function subscribeStudentReflections(
  uid: string,
  onData: (reflections: Record<string, unknown>[]) => void,
  onError: (failure: FirestoreOperationFailure) => void,
  onRecovered?: (operation: string) => void
): Unsubscribe {
  const byUserId = new Map<string, Record<string, unknown>>();
  const byStudentId = new Map<string, Record<string, unknown>>();
  let userSnapshotReady = false;
  let studentSnapshotReady = false;
  const emit = () => {
    if (!userSnapshotReady || !studentSnapshotReady) return;
    const merged = new Map([...byStudentId, ...byUserId]);
    onData(Array.from(merged.values()));
  };
  const userQuery = query(collection(firestore, 'reflection'), where('userId', '==', uid));
  const studentQuery = query(collection(firestore, 'reflection'), where('studentId', '==', uid));
  const unsubscribeUser = subscribeWithDiagnostics(
    userQuery,
    'subscribeStudentReflections.userId',
    'reflection',
    'useStudentDetail',
    (snap) => {
      userSnapshotReady = true;
      byUserId.clear();
      snap.docs.forEach((document) => byUserId.set(document.id, { id: document.id, ...document.data() }));
      emit();
    },
    onError,
    onRecovered
  );
  const unsubscribeStudent = subscribeWithDiagnostics(
    studentQuery,
    'subscribeStudentReflections.studentId',
    'reflection',
    'useStudentDetail',
    (snap) => {
      studentSnapshotReady = true;
      byStudentId.clear();
      snap.docs.forEach((document) => byStudentId.set(document.id, { id: document.id, ...document.data() }));
      emit();
    },
    onError,
    onRecovered
  );
  return () => {
    unsubscribeUser();
    unsubscribeStudent();
  };
}

export function subscribeStudentActivities(
  uid: string,
  onData: (activities: Record<string, unknown>[]) => void,
  onError: (failure: FirestoreOperationFailure) => void,
  onRecovered?: (operation: string) => void
): Unsubscribe {
  const q = query(collection(firestore, 'activity'), where('userId', '==', uid));
  return subscribeWithDiagnostics(
    q,
    'subscribeStudentActivities',
    'activity',
    'useStudentDetail',
    (snap) => onData(snap.docs.map((document) => ({ id: document.id, ...document.data() }))),
    onError,
    onRecovered
  );
}

export function subscribeStudentApplicationActivities(
  uid: string,
  onData: (activities: Record<string, unknown>[]) => void,
  onError: (failure: FirestoreOperationFailure) => void,
  onRecovered?: (operation: string) => void
): Unsubscribe {
  const q = query(collection(firestore, 'application_activity'), where('userId', '==', uid));
  return subscribeWithDiagnostics(
    q,
    'subscribeStudentApplicationActivities',
    'application_activity',
    'useStudentDetail',
    (snap) => onData(snap.docs.map((document) => ({ id: document.id, ...document.data() }))),
    onError,
    onRecovered
  );
}

export function subscribeStudentIdentificationAnswers(
  uid: string,
  onData: (answers: Record<string, unknown>[]) => void,
  onError: (failure: FirestoreOperationFailure) => void,
  onRecovered?: (operation: string) => void
): Unsubscribe {
  const q = query(collection(firestore, 'identification_answers'), where('userId', '==', uid));
  return subscribeWithDiagnostics(
    q,
    'subscribeStudentIdentificationAnswers',
    'identification_answers',
    'useStudentDetail',
    (snap) => onData(snap.docs.map((document) => ({ id: document.id, ...document.data() }))),
    onError,
    onRecovered
  );
}

export async function fetchStudentReflections(uid: string) {
  const q = query(
    collection(firestore, 'reflection'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchStudentActivities(uid: string) {
  const q = query(
    collection(firestore, 'activity'),
    where('userId', '==', uid),
    orderBy('occurredAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchStudentDoc(uid: string): Promise<UserDocument | null> {
  const snap = await getDocs(
    query(collection(firestore, 'users'), where('uid', '==', uid))
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as UserDocument;
}
