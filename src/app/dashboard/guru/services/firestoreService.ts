import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import type { ComicDocument, ComicProgressDocument, UserDocument } from '@/types/firestore';

export function subscribeStudents(
  onData: (students: UserDocument[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(firestore, 'users'),
    where('role', '==', 'student'),
    where('duplicate', '==', false),
    orderBy('displayName', 'asc')
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserDocument))),
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
  onData: (progress: ComicProgressDocument[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(firestore, 'users', uid, 'progress'),
    (snap) =>
      onData(snap.docs.map((d) => ({ id: d.id, userId: uid, ...d.data() } as ComicProgressDocument))),
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
  const snap = await getDocs(
    query(collection(firestore, 'users'), where('uid', '==', uid))
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as UserDocument;
}
