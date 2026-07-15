import { collection, getDocs, onSnapshot, query, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import type { ComicProgressDocument } from '@/types/firestore';
import type { Unsubscribe } from 'firebase/firestore';

function normalizeProgressDocument(documentSnapshot: QueryDocumentSnapshot<DocumentData>): ComicProgressDocument {
  const data = documentSnapshot.data() as Partial<ComicProgressDocument>;
  return {
    id: documentSnapshot.id,
    ...data,
    comicId: data.comicId ?? Number(documentSnapshot.id.replace('comic-', '')),
  } as ComicProgressDocument;
}

export async function loadStudentProgress(studentId: string): Promise<ComicProgressDocument[]> {
  const snapshot = await getDocs(query(collection(firestore, 'users', studentId, 'progress')));
  return snapshot.docs.map(normalizeProgressDocument);
}

export function subscribeToStudentProgress(
  studentId: string,
  callback: (progress: ComicProgressDocument[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    query(collection(firestore, 'users', studentId, 'progress')),
    (snapshot) => callback(snapshot.docs.map(normalizeProgressDocument)),
    onError
  );
}
