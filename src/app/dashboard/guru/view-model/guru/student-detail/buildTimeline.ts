import type { ActivityDocument } from '@/types/firestore';
import { toDateValue } from '@/app/teacher/studentDetail.utils';

export type StudentTimelineItem = Omit<ActivityDocument, 'occurredAt'> & {
  title: string;
  occurredAt: Date;
};

export function buildTimeline(activities: ActivityDocument[]): StudentTimelineItem[] {
  return activities
    .map((activity) => ({
      ...activity,
      title: activity.title || activity.type,
      occurredAt: toDateValue(activity.occurredAt) ?? new Date(),
    }))
    .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());
}
