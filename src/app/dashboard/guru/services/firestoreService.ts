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
import { getStudentRecordOwner } from './studentRecordOwnership';

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
  const allowedUids = new Set(uids);
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
    timestampField: string,
    createActivity: (id: string, uid: string, data: Record<string, unknown>) => GuruRecentActivity,
  ) => chunks.forEach((chunk, index) => (['userId', 'studentId'] as const).forEach((userField) => {
      const key = `${source}:${userField}:${index}`;
      sourceCount += 1;
      subscriptions.push(onSnapshot(
        query(
          collection(firestore, collectionName),
          where(userField, 'in', chunk),
          orderBy(timestampField, 'desc'),
          limit(20)
        ),
        (snap) => {
          sources.set(key, snap.docs.flatMap((document) => {
            const data = document.data();
            const uid = getStudentRecordOwner(data, allowedUids);
            return uid ? [createActivity(document.id, uid, data)] : [];
          }));
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
  }));
  const toString = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : undefined;
  subscribe('activity', 'activity', 'occurredAt', (id, userId, data) => ({
        id: `activity:${id}`,
        userId,
        title: toString(data.title) ?? toString(data.type) ?? 'Aktivitas belajar',
        description: toString(data.description),
        timestamp: data.occurredAt,
      }));
  subscribe('application', 'application_activity', 'timestamp', (id, userId, data) => ({
        id: `application:${id}`,
        userId,
        title: `Penerapan Komik ${String(data.comicId ?? '—')}`,
        description: [toString(data.selectedAnswer), toString(data.studentReason)].filter(Boolean).join(' · ') || undefined,
        timestamp: data.timestamp,
      }));
  subscribe('reflection', 'reflection', 'createdAt', (id, userId, data) => ({
        id: `reflection:${id}`,
        userId,
        title: `Refleksi Komik ${String(data.comicId ?? data.moduleId ?? '—')}`,
        description: toString(data.reflectionText) ?? toString(data.response),
        timestamp: data.createdAt,
      }));
  subscribe('identification', 'identification_answers', 'updatedAt', (id, userId, data) => ({
        id: `identification:${id}`,
        userId,
        title: `Identifikasi Komik ${String(data.comicId ?? '—')} · Langkah ${String(data.step ?? '—')}`,
        description: [toString(data.selectedAnswer), toString(data.reason)].filter(Boolean).join(' · ') || undefined,
        timestamp: data.updatedAt,
      }));
  emit();
  return () => subscriptions.forEach((unsubscribe) => unsubscribe());
}

export function subscribeStudents(
  role: UserDocument['role'] | undefined,
  onData: (students: UserDocument[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  if (role !== 'admin' && role !== 'teacher') {
      onError(new Error('Hanya akun guru yang dapat mengakses daftar siswa.'));
      return () => {};
  }
  const q = query(
      collection(firestore, 'users'),
      where('role', '==', 'student')
  );
  return onSnapshot(
    q,
    (snap) => {
      const raw = snap.docs.map((document) => {
        const data = document.data();
        return {
          ...data,
          id: document.id,
          uid: document.id,
          email: typeof data.email === 'string' ? data.email : '',
          displayName: typeof data.displayName === 'string' ? data.displayName : undefined,
          username: typeof data.username === 'string' ? data.username : undefined,
          nickname: typeof data.nickname === 'string' ? data.nickname : undefined,
          gender: typeof data.gender === 'string' ? data.gender as UserDocument['gender'] : undefined,
          classLevel: typeof data.classLevel === 'string' ? data.classLevel as UserDocument['classLevel'] : undefined,
          gradeLevel: typeof data.gradeLevel === 'number' ? data.gradeLevel : undefined,
          bio: typeof data.bio === 'string' ? data.bio : undefined,
          avatar: typeof data.avatar === 'string' ? data.avatar : undefined,
          photoURL: typeof data.photoURL === 'string' ? data.photoURL : undefined,
          role: data.role as UserDocument['role'],
          schoolId: typeof data.schoolId === 'string' ? data.schoolId : undefined,
          schoolName: typeof data.schoolName === 'string' ? data.schoolName : undefined,
          teacherUid: typeof data.teacherUid === 'string' ? data.teacherUid : undefined,
          isActive: typeof data.isActive === 'boolean' ? data.isActive : undefined,
          duplicate: data.duplicate === true,
          createdAt: data.createdAt as UserDocument['createdAt'],
          updatedAt: data.updatedAt as UserDocument['updatedAt'],
          lastLoginAt: data.lastLoginAt as UserDocument['lastLoginAt'],
        } satisfies UserDocument;
      });
      onData(raw);
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

export function subscribeStudentModuleProgress(
  uid: string,
  onData: (progress: Record<string, unknown>[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(firestore, 'users', uid, 'learning-module-progress'),
    (snap) => onData(snap.docs.map((document) => ({ id: document.id, ...document.data() }))),
    onError
  );
}

export function subscribeStudentAiTutorChats(
  uid: string,
  onData: (chats: Record<string, unknown>[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const chatsQuery = query(
    collection(firestore, 'users', uid, 'aiTutorChats'),
    orderBy('updatedAt', 'desc'),
    limit(20)
  );
  return onSnapshot(
    chatsQuery,
    (snap) => onData(snap.docs.map((document) => ({ id: document.id, ...document.data() }))),
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
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      const data = snapshot.data();
      onData({
        ...data,
        id: snapshot.id,
        uid: snapshot.id,
        email: typeof data.email === 'string' ? data.email : '',
      } as UserDocument);
    },
    onError
  );
}

function subscribeStudentRecords(
  collectionName: string,
  uid: string,
  onData: (records: Record<string, unknown>[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const sourceRecords = new Map<'userId' | 'studentId', Map<string, Record<string, unknown>>>();
  const ready = new Set<'userId' | 'studentId'>();
  const ownerFields = ['userId', 'studentId'] as const;
  const emit = () => {
    if (ready.size !== ownerFields.length) return;
    const records = new Map<string, Record<string, unknown>>();
    ownerFields.forEach((field) => {
      sourceRecords.get(field)?.forEach((record, id) => {
        if (getStudentRecordOwner(record, new Set([uid])) === uid) records.set(id, record);
      });
    });
    onData(Array.from(records.values()));
  };
  const unsubscribers = ownerFields.map((field) => onSnapshot(
    query(collection(firestore, collectionName), where(field, '==', uid)),
    (snapshot) => {
      sourceRecords.set(field, new Map(
        snapshot.docs.map((document) => [document.id, { id: document.id, ...document.data() }])
      ));
      ready.add(field);
      emit();
    },
    (error) => {
      sourceRecords.set(field, new Map());
      ready.add(field);
      onError(error);
      emit();
    }
  ));
  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

export function subscribeStudentReflections(
  uid: string,
  onData: (reflections: Record<string, unknown>[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  return subscribeStudentRecords('reflection', uid, onData, onError);
}

export function subscribeStudentActivities(
  uid: string,
  onData: (activities: Record<string, unknown>[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  return subscribeStudentRecords('activity', uid, onData, onError);
}

export function subscribeStudentApplicationActivities(
  uid: string,
  onData: (activities: Record<string, unknown>[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  return subscribeStudentRecords('application_activity', uid, onData, onError);
}

export function subscribeStudentIdentificationAnswers(
  uid: string,
  onData: (answers: Record<string, unknown>[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  return subscribeStudentRecords('identification_answers', uid, onData, onError);
}

export async function fetchStudentRecords(collectionName: string, uid: string, timestampField: string) {
  const ownerFields = ['userId', 'studentId'] as const;
  const snapshots = await Promise.all(ownerFields.map((field) =>
    getDocs(query(collection(firestore, collectionName), where(field, '==', uid)))
  ));
  const records = new Map<string, Record<string, unknown>>();
  snapshots.flatMap((snapshot) => snapshot.docs).forEach((document) => {
    const data = document.data();
    if (getStudentRecordOwner(data, new Set([uid])) === uid) {
      records.set(document.id, { id: document.id, ...data });
    }
  });
  return Array.from(records.values()).sort((left, right) =>
    (timestampMillis(right[timestampField]) ?? 0) - (timestampMillis(left[timestampField]) ?? 0)
  );
}

export async function fetchStudentReflections(uid: string) {
  return fetchStudentRecords('reflection', uid, 'createdAt');
}

export async function fetchStudentActivities(uid: string) {
  return fetchStudentRecords('activity', uid, 'occurredAt');
}

export async function fetchStudentDoc(uid: string): Promise<UserDocument | null> {
  const snapshot = await getDoc(doc(firestore, 'users', uid));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as UserDocument : null;
}
