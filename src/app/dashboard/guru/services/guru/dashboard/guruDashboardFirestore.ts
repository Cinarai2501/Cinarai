import {
  collectionGroup,
  getDocs,
  onSnapshot,
  query,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
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
  return getFirestoreCollection('users');
}

export function subscribeToUsers(
  callback: (users: UserDocument[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeToFirestoreCollection('users', callback, undefined, onError);
}

export async function loadAllComics(): Promise<ComicDocument[]> {
  return getFirestoreCollection('comics');
}

export function subscribeToComics(
  callback: (comics: ComicDocument[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeToFirestoreCollection('comics', callback, undefined, onError);
}

export async function loadRecentActivities(limitCount = 20): Promise<ActivityDocument[]> {
  return queryFirestoreCollection('activity', {
    orderByField: 'occurredAt',
    orderDirection: 'desc',
    limitCount,
  });
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
  return getFirestoreCollection('reflection');
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
  try {
    const snapshot = await getDocs(query(collectionGroup(firestore, 'progress')));
    return snapshot.docs.map(normalizeProgressDocument);
  } catch (error) {
    throw error;
  }
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
