'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  type DocumentData,
  type WhereFilterOp,
  type QueryConstraint,
  type Query,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from './client';

export const getDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string
): Promise<T | null> => {
  try {
    const docRef = doc(firestore, collectionName, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as T) : null;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
};

export const getDocuments = async <T extends DocumentData>(
  collectionName: string
): Promise<T[]> => {
  try {
    const querySnapshot = await getDocs(collection(firestore, collectionName));
    return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as T));
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
};

interface QueryCondition {
  field: string;
  operator: WhereFilterOp;
  value: unknown;
}

interface QueryOptions {
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  limitCount?: number;
}

export const getDocumentsWithQuery = async <T extends DocumentData>(
  collectionName: string,
  conditions: QueryCondition[],
  options?: QueryOptions
): Promise<T[]> => {
  try {
    const constraints: QueryConstraint[] = conditions.map((c) => where(c.field, c.operator, c.value));

    if (options?.orderByField) {
      constraints.push(orderBy(options.orderByField, options.orderDirection ?? 'asc'));
    }
    if (options?.limitCount) {
      constraints.push(limit(options.limitCount));
    }

    const q: Query = query(collection(firestore, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as T));
  } catch (error) {
    console.error(`Error querying ${collectionName}:`, error);
    throw error;
  }
};

export const addDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> => {
  try {
    await setDoc(doc(firestore, collectionName, docId), data);
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

export const updateDocument = async <T extends Partial<DocumentData>>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> => {
  try {
    await updateDoc(doc(firestore, collectionName, docId), data);
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

export const deleteDocument = async (
  collectionName: string,
  docId: string
): Promise<void> => {
  try {
    await deleteDoc(doc(firestore, collectionName, docId));
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

export const subscribeToDocument = <T extends DocumentData>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void
): Unsubscribe => {
  return onSnapshot(doc(firestore, collectionName, docId), (docSnap) => {
    callback(docSnap.exists() ? (docSnap.data() as T) : null);
  });
};

export const subscribeToCollection = <T extends DocumentData>(
  collectionName: string,
  callback: (docs: T[]) => void
): Unsubscribe => {
  return onSnapshot(collection(firestore, collectionName), (querySnapshot) => {
    callback(querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as T)));
  });
};
