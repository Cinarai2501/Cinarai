import { collection, getDocs, onSnapshot, query, where, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import type { ApplicationActivityDocument } from '@/types/firestore';
import type { Unsubscribe } from 'firebase/firestore';

function normalizeApplicationActivity(documentSnapshot: QueryDocumentSnapshot<DocumentData>): ApplicationActivityDocument {
  return {
    id: documentSnapshot.id,
    ...documentSnapshot.data(),
  } as ApplicationActivityDocument;
}

export async function loadStudentApplicationActivities(studentId: string): Promise<ApplicationActivityDocument[]> {
  const snapshot = await getDocs(
    query(collection(firestore, 'application_activity'), where('userId', '==', studentId))
  );
  return snapshot.docs.map(normalizeApplicationActivity);
}

export function subscribeToStudentApplicationActivities(
  studentId: string,
  callback: (activities: ApplicationActivityDocument[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    query(collection(firestore, 'application_activity'), where('userId', '==', studentId)),
    (snapshot) => callback(snapshot.docs.map(normalizeApplicationActivity)),
    onError
  );
}
