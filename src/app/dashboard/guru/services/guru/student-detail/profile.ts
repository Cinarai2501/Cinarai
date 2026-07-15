import { getFirestoreDocument, subscribeToFirestoreDocument } from '@/services/firestore';
import type { UserDocument } from '@/types/firestore';
import type { Unsubscribe } from 'firebase/firestore';

export async function loadStudentProfile(studentId: string): Promise<UserDocument | null> {
  return getFirestoreDocument('users', studentId);
}

export function subscribeToStudentProfile(
  studentId: string,
  callback: (student: UserDocument | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeToFirestoreDocument('users', studentId, callback, onError);
}
