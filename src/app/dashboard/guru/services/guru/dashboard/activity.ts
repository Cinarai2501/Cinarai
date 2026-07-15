import type { ActivityDocument, UserDocument } from '@/types/firestore';

export type TeacherRecentActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
};

function toRelativeTimeLabel(date: Date): string {
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) {
    return `${diffSeconds} detik lalu`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} menit lalu`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} jam lalu`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari lalu`;
}

export function buildTeacherRecentActivities(
  activities: ActivityDocument[],
  students: UserDocument[]
): TeacherRecentActivityItem[] {
  const studentIds = new Set(students.map((student) => student.uid));

  return activities
    .filter((activity) => studentIds.has(activity.userId))
    .slice()
    .sort((left, right) => {
      const leftTime = (left.occurredAt as { toDate?: () => Date })?.toDate?.() ?? new Date(0);
      const rightTime = (right.occurredAt as { toDate?: () => Date })?.toDate?.() ?? new Date(0);
      return rightTime.getTime() - leftTime.getTime();
    })
    .slice(0, 5)
    .map((activity) => {
      const occurredAt = (activity.occurredAt as { toDate?: () => Date })?.toDate?.() ?? new Date();
      return {
        id: activity.id ?? `${activity.userId}-${activity.type}-${activity.occurredAt}`,
        title:
          activity.title ||
          (activity.type === 'comic_completed'
            ? 'Siswa menyelesaikan komik'
            : activity.type === 'reflection_submitted'
            ? 'Siswa menyelesaikan refleksi'
            : activity.type === 'lesson_completed'
            ? 'Siswa menyelesaikan pelajaran'
            : 'Aktivitas terbaru siswa'),
        detail: activity.description ?? 'Perkembangan terbaru siswa telah tercatat.',
        time: toRelativeTimeLabel(occurredAt),
      };
    });
}
