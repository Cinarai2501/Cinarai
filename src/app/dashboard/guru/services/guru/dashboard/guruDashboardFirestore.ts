import { collectionGroup, onSnapshot, query } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import { subscribeToFirestoreCollection } from '@/services/firestore';
import type {
  ActivityDocument,
  ComicDocument,
  ComicProgressDocument,
  ReflectionDocument,
  UserDocument,
} from '@/types/firestore';

export async function loadAllUsers(): Promise<UserDocument[]> {
  throw new Error('This method is not supported for realtime dashboard data.');
}

export function subscribeToUsers(
  callback: (users: UserDocument[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeToFirestoreCollection(
    'users',
    callback,
    {
      filters: [{ field: 'role', operator: '==', value: 'student' }],
      orderByField: 'displayName',
      orderDirection: 'asc',
    },
    onError
  );
}

export function subscribeToAllUsers(
  callback: (users: UserDocument[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeToFirestoreCollection(
    'users',
    callback,
    {
      orderByField: 'displayName',
      orderDirection: 'asc',
    },
    onError
  );
}

export async function loadAllComics(): Promise<ComicDocument[]> {
  throw new Error('This method is not supported for realtime dashboard data.');
}

export function subscribeToComics(
  callback: (comics: ComicDocument[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeToFirestoreCollection(
    'comics',
    callback,
    {
      orderByField: 'order',
      orderDirection: 'asc',
    },
    onError
  );
}

export async function loadRecentActivities(): Promise<ActivityDocument[]> {
  throw new Error('This method is not supported for realtime dashboard data.');
}

export function subscribeToRecentActivities(
  callback: (activities: ActivityDocument[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeToFirestoreCollection(
    'activity',
    callback,
    {
      orderByField: 'occurredAt',
      orderDirection: 'desc',
      limitCount: 20,
    },
    onError
  );
}

export async function loadAllReflections(): Promise<ReflectionDocument[]> {
  throw new Error('This method is not supported for realtime dashboard data.');
}

export function subscribeToReflections(
  callback: (reflections: ReflectionDocument[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeToFirestoreCollection(
    'reflection',
    callback,
    {
      orderByField: 'createdAt',
      orderDirection: 'desc',
      limitCount: 200,
    },
    onError
  );
}

export async function loadAllProgressDocuments(): Promise<ComicProgressDocument[]> {
  throw new Error('This method is not supported for realtime dashboard data.');
}

export function subscribeToAllProgressDocuments(
  callback: (progressDocuments: ComicProgressDocument[]) => void,
  onError?: (error: Error) => void
) {
  const progressQuery = query(collectionGroup(firestore, 'progress'));
  return onSnapshot(
    progressQuery,
    (snapshot) => {
      callback(snapshot.docs.map((documentSnapshot) => documentSnapshot.data() as ComicProgressDocument));
    },
    (error) => {
      onError?.(error instanceof Error ? error : new Error('Failed to load progress'));
    }
  );
}
