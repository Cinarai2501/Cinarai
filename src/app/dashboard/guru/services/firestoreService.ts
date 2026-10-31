import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import type { ComicDocument, ComicProgressDocument, UserDocument } from '@/types/firestore';
import { deduplicateActivitiesById } from './activityUtils';

export type StudentProgressSnapshot = Record<string, unknown> & { id: string; userId: string };

export interface GuruRecentActivity {
  id: string;
  userId: string;
  title: string;
  description?: string;
  timestamp: unknown;
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
  studentUids: string[],
  onData: (activities: GuruRecentActivity[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const sources = new Map<string, GuruRecentActivity[]>();
  const ready = new Set<string>();
  const uids = Array.from(new Set(studentUids.filter(Boolean)));
  if (uids.length === 0) {
    onData([]);
    return () => {};
  }
  const chunks: string[][] = [];
  for (let index = 0; index < uids.length; index += 8) chunks.push(uids.slice(index, index + 8));
  const subscriptions: Unsubscribe[] = [];
  let sourceCount = 0;
  const emit = () => {
    if (ready.size !== sourceCount) return;
    const latest = deduplicateActivitiesById(Array.from(sources.values()).flat())
      .filter((activity) => timestampMillis(activity.timestamp) !== null)
      .sort((left, right) => (timestampMillis(right.timestamp) ?? 0) - (timestampMillis(left.timestamp) ?? 0))
      .slice(0, 20);
    onData(latest);
  };
  const subscribe = (
    source: string,
    collectionName: string,
      userField: 'userId' | 'studentId',
      timestampField: string,
      createActivity: (id: string, data: Record<string, unknown>) => GuruRecentActivity
  ) => chunks.forEach((chunk, index) => {
      const key = `${source}:${index}`;
      sourceCount += 1;
      subscriptions.push(onSnapshot(
        query(
          collection(firestore, collectionName),
          where(userField, 'in', chunk),
          orderBy(timestampField, 'desc'),
          limit(20)
        ),
        (snap) => {
          sources.set(key, snap.docs.map((document) => createActivity(document.id, document.data())));
          ready.add(key);
          emit();
        },
        (error) => {
          sources.set(key, []);
          ready.add(key);
          onError(error);
          emit();
        }
      ));
  });
  const toString = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : undefined;
  subscribe('activity', 'activity', 'userId', 'occurredAt', (id, data) => ({
        id: `activity:${id}`,
        userId: typeof data.userId === 'string' ? data.userId : '',
        title: toString(data.title) ?? toString(data.type) ?? 'Aktivitas belajar',
        description: toString(data.description),
        timestamp: data.occurredAt,
      }));
  subscribe('application', 'application_activity', 'userId', 'timestamp', (id, data) => ({
        id: `application:${id}`,
        userId: typeof data.userId === 'string' ? data.userId : '',
        title: `Penerapan Komik ${String(data.comicId ?? '—')}`,
        description: [toString(data.selectedAnswer), toString(data.studentReason)].filter(Boolean).join(' · ') || undefined,
        timestamp: data.timestamp,
      }));
  subscribe('reflection-user', 'reflection', 'userId', 'createdAt', (id, data) => ({
        id: `reflection:${id}`,
        userId: typeof data.userId === 'string' ? data.userId : typeof data.studentId === 'string' ? data.studentId : '',
        title: `Refleksi Komik ${String(data.comicId ?? data.moduleId ?? '—')}`,
        description: toString(data.reflectionText) ?? toString(data.response),
        timestamp: data.createdAt,
      }));
  subscribe('reflection-student', 'reflection', 'studentId', 'createdAt', (id, data) => ({
        id: `reflection:${id}`,
        userId: typeof data.userId === 'string' ? data.userId : typeof data.studentId === 'string' ? data.studentId : '',
        title: `Refleksi Komik ${String(data.comicId ?? data.moduleId ?? '—')}`,
        description: toString(data.reflectionText) ?? toString(data.response),
        timestamp: data.createdAt,
      }));
  subscribe('identification', 'identification_answers', 'userId', 'updatedAt', (id, data) => ({
        id: `identification:${id}`,
        userId: typeof data.userId === 'string' ? data.userId : '',
        title: `Identifikasi Komik ${String(data.comicId ?? '—')} · Langkah ${String(data.step ?? '—')}`,
        description: [toString(data.selectedAnswer), toString(data.reason)].filter(Boolean).join(' · ') || undefined,
        timestamp: data.updatedAt,
      }));
  emit();
  return () => subscriptions.forEach((unsubscribe) => unsubscribe());
}

export function subscribeStudents(
  role: UserDocument['role'] | undefined,
  schoolName: string | undefined,
  onData: (students: UserDocument[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  if (role !== 'admin' && role !== 'teacher') {
      onError(new Error('Hanya akun guru yang dapat mengakses daftar siswa.'));
      return () => {};
  }
  if (role === 'teacher' && !schoolName?.trim()) {
      onError(new Error('Profil guru belum memiliki sekolah; daftar siswa tidak dapat diakses.'));
      return () => {};
  }
  const filters = [where('role', '==', 'student')];
  if (role === 'teacher') filters.push(where('schoolName', '==', schoolName?.trim() ?? ''));
  const q = query(
      collection(firestore, 'users'),
      ...filters
  );
  return onSnapshot(
    q,
    (snap) => {
      const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserDocument));
      const students = raw.filter((u) => u.duplicate !== true);
      onData(students);
    },
    onError
  );
}

export function subscribeComics(
  onData: (comics: ComicDocument[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(collection(firestore, 'comics'), orderBy('order', 'asc'));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ComicDocument))),
    onError
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
  onError: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(firestore, 'users', uid, 'progress'),
    (snap) =>
      onData(snap.docs.map((d) => ({ id: d.id, userId: uid, ...d.data() }))),
    onError
  );
}

export function subscribeStudentDoc(
  uid: string,
  onData: (student: UserDocument | null) => void,
  onError: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(firestore, 'users', uid),
    (snapshot) => onData(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as UserDocument : null),
    onError
  );
}

export function subscribeStudentReflections(
  uid: string,
  onData: (reflections: Record<string, unknown>[]) => void,
  onError: (err: Error) => void
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
  const unsubscribeUser = onSnapshot(userQuery, (snap) => {
    userSnapshotReady = true;
    byUserId.clear();
    snap.docs.forEach((document) => byUserId.set(document.id, { id: document.id, ...document.data() }));
    emit();
  }, onError);
  const unsubscribeStudent = onSnapshot(studentQuery, (snap) => {
    studentSnapshotReady = true;
    byStudentId.clear();
    snap.docs.forEach((document) => byStudentId.set(document.id, { id: document.id, ...document.data() }));
    emit();
  }, onError);
  return () => {
    unsubscribeUser();
    unsubscribeStudent();
  };
}

export function subscribeStudentActivities(
  uid: string,
  onData: (activities: Record<string, unknown>[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(collection(firestore, 'activity'), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((document) => ({ id: document.id, ...document.data() }))),
    onError
  );
}

export function subscribeStudentApplicationActivities(
  uid: string,
  onData: (activities: Record<string, unknown>[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(collection(firestore, 'application_activity'), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((document) => ({ id: document.id, ...document.data() }))),
    onError
  );
}

export function subscribeStudentIdentificationAnswers(
  uid: string,
  onData: (answers: Record<string, unknown>[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(collection(firestore, 'identification_answers'), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((document) => ({ id: document.id, ...document.data() }))),
    onError
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
  const snapshot = await getDoc(doc(firestore, 'users', uid));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as UserDocument : null;
}
