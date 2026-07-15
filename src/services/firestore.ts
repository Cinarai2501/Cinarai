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
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type FirestoreDataConverter,
  type PartialWithFieldValue,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  type Unsubscribe,
  type UpdateData,
  type WhereFilterOp,
  type WithFieldValue,
} from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase/client';
import type { FirestoreCollectionMap, UserDocument } from '@/types/firestore';

declare global {
  interface Window {
    __cinaraiAuthDebug?: {
      uid?: string;
      role?: string;
      route?: string;
    };
  }
}

export const FIRESTORE_COLLECTIONS = {
  users: 'users',
  progress: 'progress',
  reflection: 'reflection',
  leaderboard: 'leaderboard',
  badge: 'badge',
  activity: 'activity',
  identificationAnswers: 'identification_answers',
  comics: 'comics',
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

const getFirestoreDebugContext = () => {
  if (typeof window === 'undefined') {
    return { uid: auth.currentUser?.uid ?? 'anonymous', role: 'unknown', route: '/' };
  }

  return {
    uid: auth.currentUser?.uid ?? window.__cinaraiAuthDebug?.uid ?? 'anonymous',
    role: window.__cinaraiAuthDebug?.role ?? 'unknown',
    route: window.__cinaraiAuthDebug?.route ?? window.location.pathname,
  };
};

const normalizeFirestoreError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  return new Error(typeof error === 'string' ? error : 'Firestore request failed');
};

const logFirestoreRequest = (
  operation: string,
  collectionName: string,
  queryDescription: string,
  error?: unknown
) => {
  const debugContext = getFirestoreDebugContext();
  const firestoreError = error ? (error as { code?: string; message?: string }) : undefined;

  console.error('[Firestore]', {
    uid: debugContext.uid,
    role: debugContext.role,
    route: debugContext.route,
    operation,
    collection: collectionName,
    query: queryDescription,
    errorCode: firestoreError?.code ?? 'unknown',
    errorMessage: firestoreError?.message ?? 'unknown',
  });
};

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
  try {
    const snapshot = await getDoc(getTypedDoc(collectionName, docId));
    return snapshot.exists() ? snapshot.data() : null;
  } catch (error) {
    logFirestoreRequest('getDocument', collectionName, `doc:${docId}`, error);
    throw normalizeFirestoreError(error);
  }
};

export const getFirestoreCollection = async <
  TCollectionName extends FirestoreCollectionName,
>(
  collectionName: TCollectionName
): Promise<Array<FirestoreCollectionMap[TCollectionName]>> => {
  try {
    const snapshot = await getDocs(getTypedCollection(collectionName));
    return snapshot.docs.map((documentSnapshot) => documentSnapshot.data());
  } catch (error) {
    logFirestoreRequest('getCollection', collectionName, 'collection', error);
    throw normalizeFirestoreError(error);
  }
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

  try {
    const snapshot = await getDocs(
      query(getTypedCollection(collectionName), ...queryConstraints)
    );

    return snapshot.docs.map((documentSnapshot) => documentSnapshot.data());
  } catch (error) {
    logFirestoreRequest('queryCollection', collectionName, JSON.stringify(options), error);
    throw normalizeFirestoreError(error);
  }
};

export const setFirestoreDocument = async <
  TCollectionName extends FirestoreCollectionName,
>(
  collectionName: TCollectionName,
  docId: string,
  data: WithFieldValue<Omit<FirestoreCollectionMap[TCollectionName], 'id'>>
): Promise<void> => {
  try {
    await setDoc(getTypedDoc(collectionName, docId), data);
  } catch (error) {
    logFirestoreRequest('setDocument', collectionName, `doc:${docId}`, error);
    throw normalizeFirestoreError(error);
  }
};

/** setDoc dengan merge:true — aman untuk dokumen baru maupun yang sudah ada. */
export const mergeFirestoreDocument = async <
  TCollectionName extends FirestoreCollectionName,
>(
  collectionName: TCollectionName,
  docId: string,
  data: PartialWithFieldValue<FirestoreCollectionMap[TCollectionName]>
): Promise<void> => {
  try {
    await setDoc(getTypedDoc(collectionName, docId), data, { merge: true });
  } catch (error) {
    logFirestoreRequest('mergeDocument', collectionName, `doc:${docId}`, error);
    throw normalizeFirestoreError(error);
  }
};

export const updateFirestoreDocument = async <
  TCollectionName extends FirestoreCollectionName,
>(
  collectionName: TCollectionName,
  docId: string,
  data: UpdateData<FirestoreCollectionMap[TCollectionName]>
): Promise<void> => {
  try {
    await updateDoc(getTypedDoc(collectionName, docId), data);
  } catch (error) {
    logFirestoreRequest('updateDocument', collectionName, `doc:${docId}`, error);
    throw normalizeFirestoreError(error);
  }
};

export const deleteFirestoreDocument = async <
  TCollectionName extends FirestoreCollectionName,
>(
  collectionName: TCollectionName,
  docId: string
): Promise<void> => {
  try {
    await deleteDoc(getTypedDoc(collectionName, docId));
  } catch (error) {
    logFirestoreRequest('deleteDocument', collectionName, `doc:${docId}`, error);
    throw normalizeFirestoreError(error);
  }
};

export const subscribeToFirestoreDocument = <
  TCollectionName extends FirestoreCollectionName,
>(
  collectionName: TCollectionName,
  docId: string,
  callback: (data: FirestoreCollectionMap[TCollectionName] | null) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  return onSnapshot(
    getTypedDoc(collectionName, docId),
    (snapshot) => {
      callback(snapshot.exists() ? snapshot.data() : null);
    },
    (error) => {
      const normalizedError = normalizeFirestoreError(error);
      logFirestoreRequest('subscribeDocument', collectionName, `doc:${docId}`, normalizedError);
      onError?.(normalizedError);
    }
  );
};

// ─── users helpers ───────────────────────────────────────────────────────────

/** Create or update a user document (upsert). */
export const upsertUser = async (user: Omit<UserDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
  try {
    await setDoc(
      getTypedDoc('users', user.uid),
      { ...user, updatedAt: serverTimestamp() } as WithFieldValue<Omit<UserDocument, 'id'>>,
      { merge: true }
    );
  } catch (error) {
    logFirestoreRequest('upsertUser', 'users', `doc:${user.uid}`, error);
    throw normalizeFirestoreError(error);
  }
};

/** Subscribe to a user document in realtime. */
export const subscribeToUser = (
  uid: string,
  callback: (user: UserDocument | null) => void
): Unsubscribe => subscribeToFirestoreDocument('users', uid, callback);

export const subscribeToFirestoreCollection = <
  TCollectionName extends FirestoreCollectionName,
>(
  collectionName: TCollectionName,
  callback: (data: Array<FirestoreCollectionMap[TCollectionName]>) => void,
  options: FirestoreQueryOptions<TCollectionName> = {},
  onError?: (error: Error) => void
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
    },
    (error) => {
      const normalizedError = normalizeFirestoreError(error);
      logFirestoreRequest('subscribeCollection', collectionName, JSON.stringify(options), normalizedError);
      onError?.(normalizedError);
    }
  );
};
