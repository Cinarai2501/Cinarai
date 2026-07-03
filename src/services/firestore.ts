'use client';

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  type Unsubscribe,
  type UpdateData,
  type WhereFilterOp,
  type WithFieldValue,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import type { FirestoreCollectionMap } from '@/types/firestore';

export const FIRESTORE_COLLECTIONS = {
  users: 'users',
  progress: 'progress',
  comicProgress: 'comic_progress',
  reflection: 'reflection',
  leaderboard: 'leaderboard',
  badge: 'badge',
  activity: 'activity',
} as const;

export type FirestoreCollectionName = keyof FirestoreCollectionMap;

export interface FirestoreQueryFilter<
  TCollectionName extends FirestoreCollectionName,
> {
  field: keyof FirestoreCollectionMap[TCollectionName] & string;
  operator: WhereFilterOp;
  value: unknown;
}

export interface FirestoreQueryOptions<
  TCollectionName extends FirestoreCollectionName,
> {
  filters?: Array<FirestoreQueryFilter<TCollectionName>>;
  orderByField?: keyof FirestoreCollectionMap[TCollectionName] & string;
  orderDirection?: 'asc' | 'desc';
  limitCount?: number;
}

const firestoreConverter = <TDocument extends DocumentData>(): FirestoreDataConverter<TDocument> => ({
  toFirestore(data: WithFieldValue<TDocument>): DocumentData {
    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): TDocument {
    return {
      id: snapshot.id,
      ...snapshot.data(options),
    } as unknown as TDocument;
  },
});

const getTypedCollection = <TCollectionName extends FirestoreCollectionName>(
  collectionName: TCollectionName
) => {
  return collection(firestore, collectionName).withConverter(
    firestoreConverter<FirestoreCollectionMap[TCollectionName]>()
  );
};

const getTypedDoc = <TCollectionName extends FirestoreCollectionName>(
  collectionName: TCollectionName,
  docId: string
) => {
  return doc(firestore, collectionName, docId).withConverter(
    firestoreConverter<FirestoreCollectionMap[TCollectionName]>()
  );
};

export const getFirestoreDocument = async <
  TCollectionName extends FirestoreCollectionName,
>(
  collectionName: TCollectionName,
  docId: string
): Promise<FirestoreCollectionMap[TCollectionName] | null> => {
  const snapshot = await getDoc(getTypedDoc(collectionName, docId));
  return snapshot.exists() ? snapshot.data() : null;
};

export const getFirestoreCollection = async <
  TCollectionName extends FirestoreCollectionName,
>(
  collectionName: TCollectionName
): Promise<Array<FirestoreCollectionMap[TCollectionName]>> => {
  const snapshot = await getDocs(getTypedCollection(collectionName));
  return snapshot.docs.map((documentSnapshot) => documentSnapshot.data());
};

export const queryFirestoreCollection = async <
  TCollectionName extends FirestoreCollectionName,
>(
  collectionName: TCollectionName,
  options: FirestoreQueryOptions<TCollectionName> = {}
): Promise<Array<FirestoreCollectionMap[TCollectionName]>> => {
  const queryConstraints: QueryConstraint[] = [];

  options.filters?.forEach((filter) => {
    queryConstraints.push(where(filter.field, filter.operator, filter.value));
  });

  if (options.orderByField) {
    queryConstraints.push(
      orderBy(options.orderByField, options.orderDirection ?? 'asc')
    );
  }

  if (options.limitCount) {
    queryConstraints.push(limit(options.limitCount));
  }

  const snapshot = await getDocs(
    query(getTypedCollection(collectionName), ...queryConstraints)
  );

  return snapshot.docs.map((documentSnapshot) => documentSnapshot.data());
};

export const setFirestoreDocument = async <
  TCollectionName extends FirestoreCollectionName,
>(
  collectionName: TCollectionName,
  docId: string,
  data: WithFieldValue<Omit<FirestoreCollectionMap[TCollectionName], 'id'>>
): Promise<void> => {
  await setDoc(getTypedDoc(collectionName, docId), data);
};

export const updateFirestoreDocument = async <
  TCollectionName extends FirestoreCollectionName,
>(
  collectionName: TCollectionName,
  docId: string,
  data: UpdateData<FirestoreCollectionMap[TCollectionName]>
): Promise<void> => {
  await updateDoc(getTypedDoc(collectionName, docId), data);
};

export const deleteFirestoreDocument = async <
  TCollectionName extends FirestoreCollectionName,
>(
  collectionName: TCollectionName,
  docId: string
): Promise<void> => {
  await deleteDoc(getTypedDoc(collectionName, docId));
};

export const subscribeToFirestoreDocument = <
  TCollectionName extends FirestoreCollectionName,
>(
  collectionName: TCollectionName,
  docId: string,
  callback: (data: FirestoreCollectionMap[TCollectionName] | null) => void
): Unsubscribe => {
  return onSnapshot(getTypedDoc(collectionName, docId), (snapshot) => {
    callback(snapshot.exists() ? snapshot.data() : null);
  });
};

export const subscribeToFirestoreCollection = <
  TCollectionName extends FirestoreCollectionName,
>(
  collectionName: TCollectionName,
  callback: (data: Array<FirestoreCollectionMap[TCollectionName]>) => void,
  options: FirestoreQueryOptions<TCollectionName> = {}
): Unsubscribe => {
  const queryConstraints: QueryConstraint[] = [];

  options.filters?.forEach((filter) => {
    queryConstraints.push(where(filter.field, filter.operator, filter.value));
  });

  if (options.orderByField) {
    queryConstraints.push(
      orderBy(options.orderByField, options.orderDirection ?? 'asc')
    );
  }

  if (options.limitCount) {
    queryConstraints.push(limit(options.limitCount));
  }

  return onSnapshot(
    query(getTypedCollection(collectionName), ...queryConstraints),
    (snapshot) => {
      callback(
        snapshot.docs.map((documentSnapshot) => documentSnapshot.data())
      );
    }
  );
};
