import { collection, query, where, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import { safeGetDocs, safeOnSnapshot } from '@/app/dashboard/guru/services/guru/firestoreAudit';
import { toDateValue } from '@/app/guru/studentDetail.utils';
import type { ActivityDocument } from '@/types/firestore';
import type { Unsubscribe } from 'firebase/firestore';

const eventMap: Record<string, string> = {
  login: 'Login',
  lesson_started: 'Memulai pelajaran',
  lesson_completed: 'Menyelesaikan pelajaran',
  comic_started: 'Memulai komik',
  comic_completed: 'Menyelesaikan komik',
  reflection_submitted: 'Mengisi refleksi',
  badge_earned: 'Mendapatkan lencana',
};

function normalizeActivity(documentSnapshot: QueryDocumentSnapshot<DocumentData>): ActivityDocument {
  return {
    id: documentSnapshot.id,
    ...documentSnapshot.data(),
  } as ActivityDocument;
}

export async function loadStudentTimeline(studentId: string): Promise<ActivityDocument[]> {
  const snapshot = await safeGetDocs('activity', `activity?userId=${studentId}`, () => query(collection(firestore, 'activity'), where('userId', '==', studentId)));
  return snapshot.docs.map(normalizeActivity).sort((left: ActivityDocument, right: ActivityDocument) => {
    const leftTime = toDateValue(left.occurredAt)?.getTime() ?? 0;
    const rightTime = toDateValue(right.occurredAt)?.getTime() ?? 0;
    return rightTime - leftTime;
  });
}

export function subscribeToStudentTimeline(
  studentId: string,
  callback: (activities: ActivityDocument[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return safeOnSnapshot(
    query(collection(firestore, 'activity'), where('userId', '==', studentId)),
    (snapshot) => {
      const activities = snapshot.docs.map(normalizeActivity).sort((left: ActivityDocument, right: ActivityDocument) => {
        const leftTime = toDateValue(left.occurredAt)?.getTime() ?? 0;
        const rightTime = toDateValue(right.occurredAt)?.getTime() ?? 0;
        return rightTime - leftTime;
      });
      callback(activities);
    },
    onError,
    'activity',
    `activity?userId=${studentId}`
  );
}

export function getActivityTitle(activity: ActivityDocument): string {
  return eventMap[activity.type] ?? activity.title ?? 'Aktivitas terbaru';
}
