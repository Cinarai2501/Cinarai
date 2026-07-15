'use client';

import type { ActivityDocument, ComicProgressDocument, UserDocument } from '@/types/firestore';

export type ActivityTrendPoint = {
  day: string;
  count: number;
};

function toLocalDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}

export function buildDateSeries(start: Date | null, end: Date): ActivityTrendPoint[] {
  const points: ActivityTrendPoint[] = [];
  if (!start) {
    const fallbackStart = new Date(end);
    fallbackStart.setDate(end.getDate() - 29);
    fallbackStart.setHours(0, 0, 0, 0);
    start = fallbackStart;
  }

  const current = new Date(start);
  current.setHours(0, 0, 0, 0);

  while (current <= end) {
    points.push({
      day: current.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      count: 0,
    });
    current.setDate(current.getDate() + 1);
  }

  return points;
}

export function buildActivityTrend(
  activities: ActivityDocument[],
  progressDocuments: ComicProgressDocument[],
  students: UserDocument[],
  selectedClassId: string,
  start: Date | null,
  end: Date
): ActivityTrendPoint[] {
  const filteredStudents = selectedClassId === 'all'
    ? students
    : students.filter((student) => {
        const label = student.schoolName
          ? student.schoolName
          : student.gradeLevel
          ? `Kelas ${student.gradeLevel}`
          : 'Tanpa kelas';
        return label === selectedClassId;
      });
  const studentIds = new Set(filteredStudents.map((student) => student.uid));

  const points = buildDateSeries(start, end);

  const incrementForDate = (date: Date | null) => {
    if (!date) return;
    const dayLabel = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const point = points.find((item) => item.day === dayLabel);
    if (point) point.count += 1;
  };

  activities.forEach((activity) => {
    if (!studentIds.has(activity.userId)) return;
    const occurredAt = toLocalDate(activity.occurredAt);
    if (!occurredAt) return;
    if (start && occurredAt < start) return;
    if (occurredAt > end) return;
    incrementForDate(occurredAt);
  });

  progressDocuments.forEach((document) => {
    if (!studentIds.has(document.userId ?? '')) return;
    const updatedAt = toLocalDate(document.updatedAt);
    if (!updatedAt) return;
    if (start && updatedAt < start) return;
    if (updatedAt > end) return;
    incrementForDate(updatedAt);
  });

  return points;
}
