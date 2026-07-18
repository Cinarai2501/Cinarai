import { collectionGroup, query, where, collection, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import { safeGetDocs } from '@/app/dashboard/guru/services/guru/firestoreAudit';
import type { ComicProgressDocument, ReflectionDocument } from '@/types/firestore';

export async function loadStudentScoreSummary(studentId: string) {
  const progressSnapshot = await safeGetDocs(
    'users/{uid}/progress (collectionGroup progress)',
    `users/{${studentId}}/progress (collectionGroup progress)`,
    () => query(collectionGroup(firestore, 'progress'), where('userId', '==', studentId))
  );
  const reflectionsSnapshot = await safeGetDocs('reflection', 'reflection', () => query(collection(firestore, 'reflection'), where('userId', '==', studentId)));


  const progressDocuments: ComicProgressDocument[] = progressSnapshot.docs.map(
    (doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data() as Partial<ComicProgressDocument>;
      return {
        id: doc.id,
        ...data,
        comicId: data.comicId ?? Number(doc.id.replace('comic-', '')),
      } as ComicProgressDocument;
    }
  );

  const reflections: ReflectionDocument[] = reflectionsSnapshot.docs.map(
    (doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as ReflectionDocument)
  );

  const averageScore = progressDocuments.length
    ? Math.round(
        progressDocuments.reduce((sum: number, document: ComicProgressDocument) => sum + (document.percentage ?? 0), 0) /
          progressDocuments.length
      )
    : 0;

  return {
    averageScore,
    averageReflectionScore:
      reflections.length > 0
        ? Math.round(
            reflections.reduce((sum: number, reflection: ReflectionDocument) => sum + (reflection.rating ?? 0), 0) /
              reflections.length
          )
        : 0,
    progressDocuments,
    reflections,
  };
}
