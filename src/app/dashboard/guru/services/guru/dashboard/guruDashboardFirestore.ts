import {
  collectionGroup,
  getDocs,
  onSnapshot,
  query,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { GuruFirestoreInspector } from '@/app/dashboard/guru/services/guru/debug/GuruFirestoreInspector';
import { firestore } from '@/lib/firebase/client';
import {
  getFirestoreCollection,
  queryFirestoreCollection,
  subscribeToFirestoreCollection,
} from '@/services/firestore';
import type {
  ActivityDocument,
  ComicDocument,
  ComicProgressDocument,
  ReflectionDocument,
  UserDocument,
} from '@/types/firestore';

export async function loadAllUsers(): Promise<UserDocument[]> {
  return GuruFirestoreInspector.run(
    {
      collection: 'users',
      path: 'users',
      where: [],
      orderBy: [],
      limit: null,
    },
    async () => {
      const users = await getFirestoreCollection('users');
      return users.filter((user) => user.role === 'student');
    }
  );
}

export function subscribeToUsers(
  callback: (users: UserDocument[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeToFirestoreCollection(
    'users',
    callback,
    { filters: [{ field: 'role', operator: '==', value: 'student' }] },
    onError
  );
}

export async function loadAllComics(): Promise<ComicDocument[]> {
  return GuruFirestoreInspector.run(
    {
      collection: 'comics',
      path: 'comics',
      where: [],
      orderBy: [],
      limit: null,
    },
    () => getFirestoreCollection('comics')
  );
}

export function subscribeToComics(
  callback: (comics: ComicDocument[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeToFirestoreCollection('comics', callback, undefined, onError);
}

export async function loadRecentActivities(limitCount = 20): Promise<ActivityDocument[]> {
  return GuruFirestoreInspector.run(
    {
      collection: 'activity',
      path: 'activity',
      where: [],
      orderBy: [{ field: 'occurredAt', direction: 'desc' }],
      limit: limitCount,
    },
    () => queryFirestoreCollection('activity', {
      orderByField: 'occurredAt',
      orderDirection: 'desc',
      limitCount,
    })
  );
}

export function subscribeToRecentActivities(
  callback: (activities: ActivityDocument[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeToFirestoreCollection(
    'activity',
    callback,
    { orderByField: 'occurredAt', orderDirection: 'desc', limitCount: 20 },
    onError
  );
}

export async function loadAllReflections(): Promise<ReflectionDocument[]> {
  return GuruFirestoreInspector.run(
    {
      collection: 'reflection',
      path: 'reflection',
      where: [],
      orderBy: [],
      limit: null,
    },
    // Limit reflections to recent 500 to avoid loading entire collection for dashboard.
    () => queryFirestoreCollection('reflection', {
      orderByField: 'createdAt',
      orderDirection: 'desc',
      limitCount: 500,
    })
  );
}

export function subscribeToReflections(
  callback: (reflections: ReflectionDocument[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeToFirestoreCollection('reflection', callback, undefined, onError);
}

function normalizeProgressDocument(documentSnapshot: QueryDocumentSnapshot): ComicProgressDocument {
  const data = documentSnapshot.data() as Partial<ComicProgressDocument>;
  const userId = documentSnapshot.ref.parent.parent?.id ?? '';
  return {
    id: documentSnapshot.id,
    ...data,
    userId,
    comicId: data.comicId ?? Number(documentSnapshot.id.replace('comic-', '')),
  } as ComicProgressDocument;
}

export async function loadAllProgressDocuments(): Promise<ComicProgressDocument[]> {
  return GuruFirestoreInspector.run(
    {
      collection: 'progress',
      path: 'progress (collectionGroup)',
      where: [],
      orderBy: [],
      limit: null,
    },
    async () => {
      const snapshot = await getDocs(query(collectionGroup(firestore, 'progress')));
      return snapshot.docs.map(normalizeProgressDocument);
    }
  );
}

export function subscribeToAllProgressDocuments(
  callback: (progressDocuments: ComicProgressDocument[]) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    query(collectionGroup(firestore, 'progress')),
    (snapshot) => {
      callback(snapshot.docs.map(normalizeProgressDocument));
    },
    onError
  );
}
