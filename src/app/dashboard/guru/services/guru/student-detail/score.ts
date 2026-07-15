import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import type { ComicProgressDocument, ReflectionDocument } from '@/types/firestore';

export async function loadStudentScoreSummary(studentId: string) {
  const progressSnapshot = await getDocs(query(collection(firestore, 'users', studentId, 'progress')));
  const reflectionsSnapshot = await getDocs(query(collection(firestore, 'reflection'), where('userId', '==', studentId)));

  const progressDocuments = progressSnapshot.docs.map((doc) => {
    const data = doc.data() as Partial<ComicProgressDocument>;
    return {
      id: doc.id,
      ...data,
      comicId: data.comicId ?? Number(doc.id.replace('comic-', '')),
    } as ComicProgressDocument;
  });

  const reflections = reflectionsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ReflectionDocument));

  const averageScore = progressDocuments.length
    ? Math.round(
        progressDocuments.reduce((sum, document) => sum + (document.percentage ?? 0), 0) /
          progressDocuments.length
      )
    : 0;

  return {
    averageScore,
    averageReflectionScore:
      reflections.length > 0
        ? Math.round(
            reflections.reduce((sum, reflection) => sum + (reflection.rating ?? 0), 0) /
              reflections.length
          )
        : 0,
    progressDocuments,
    reflections,
  };
}
