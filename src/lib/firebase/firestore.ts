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
  type DocumentReference,
  type DocumentSnapshot,
  type Query,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from './client';

/**
 * Get a single document by ID
 */
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

/**
 * Get all documents from a collection
 */
export const getDocuments = async <T extends DocumentData>(
  collectionName: string
): Promise<T[]> => {
  try {
    const querySnapshot = await getDocs(collection(firestore, collectionName));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as T));
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Get documents with query conditions
 */
export const getDocumentsWithQuery = async <T extends DocumentData>(
  collectionName: string,
  conditions: Array<{ field: string; operator: any; value: any }>,
  options?: { orderByField?: string; orderDirection?: 'asc' | 'desc'; limitCount?: number }
): Promise<T[]> => {
  try {
    let q: Query = collection(firestore, collectionName);
    const queryConstraints: any[] = conditions.map((cond) =>
      where(cond.field, cond.operator, cond.value)
    );

    if (options?.orderByField) {
      queryConstraints.push(
        orderBy(options.orderByField, options.orderDirection || 'asc')
      );
    }

    if (options?.limitCount) {
      queryConstraints.push(limit(options.limitCount));
    }

    q = query(collection(firestore, collectionName), ...queryConstraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as T));
  } catch (error) {
    console.error(`Error querying ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Add a new document
 */
export const addDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> => {
  try {
    const docRef = doc(firestore, collectionName, docId);
    await setDoc(docRef, data);
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Update a document
 */
export const updateDocument = async <T extends Partial<DocumentData>>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> => {
  try {
    const docRef = doc(firestore, collectionName, docId);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (
  collectionName: string,
  docId: string
): Promise<void> => {
  try {
    const docRef = doc(firestore, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Subscribe to a single document
 */
export const subscribeToDocument = <T extends DocumentData>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void
): Unsubscribe => {
  const docRef = doc(firestore, collectionName, docId);
  return onSnapshot(docRef, (docSnap) => {
    callback(docSnap.exists() ? (docSnap.data() as T) : null);
  });
};

/**
 * Subscribe to a collection
 */
export const subscribeToCollection = <T extends DocumentData>(
  collectionName: string,
  callback: (docs: T[]) => void
): Unsubscribe => {
  return onSnapshot(collection(firestore, collectionName), (querySnapshot) => {
    const docs = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as T));
    callback(docs);
  });
};
