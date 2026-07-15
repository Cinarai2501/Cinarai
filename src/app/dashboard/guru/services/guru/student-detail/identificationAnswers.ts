import { collection, getDocs, onSnapshot, orderBy, query, where, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import type { IdentificationAnswerDocument } from '@/types/firestore';
import type { Unsubscribe } from 'firebase/firestore';

function normalizeIdentificationAnswer(documentSnapshot: QueryDocumentSnapshot<DocumentData>): IdentificationAnswerDocument {
  return {
    id: documentSnapshot.id,
    ...documentSnapshot.data(),
  } as IdentificationAnswerDocument;
}

export async function loadStudentIdentificationAnswers(studentId: string): Promise<IdentificationAnswerDocument[]> {
  const snapshot = await getDocs(
    query(
      collection(firestore, 'identification_answers'),
      where('userId', '==', studentId),
      orderBy('createdAt', 'desc')
    )
  );
  return snapshot.docs.map(normalizeIdentificationAnswer);
}

export function subscribeToStudentIdentificationAnswers(
  studentId: string,
  callback: (answers: IdentificationAnswerDocument[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    query(
      collection(firestore, 'identification_answers'),
      where('userId', '==', studentId),
      orderBy('createdAt', 'desc')
    ),
    (snapshot) => callback(snapshot.docs.map(normalizeIdentificationAnswer)),
    onError
  );
}
