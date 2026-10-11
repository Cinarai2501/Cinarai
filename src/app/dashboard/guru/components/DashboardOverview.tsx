'use client';

import { Card, ProgressBar, ProgressRing, Badge, Skeleton } from './ui';
import type { DashboardSummary, StudentRow } from '../types';
import type { GuruRecentActivity } from '../services/firestoreService';

interface Props {
  summary: DashboardSummary;
  topStudents: StudentRow[];
  recentActivities: GuruRecentActivity[];
  recentActivityLoading: boolean;
  loading: boolean;
}

export function DashboardOverview({ summary, topStudents, recentActivities, recentActivityLoading, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  const rankedStudents = topStudents.filter((student) => student.progressList.length > 0);

  return (
    <div className="space-y-4">
      {/* Completion rate card */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-5 flex items-center gap-5">
          <ProgressRing value={summary.completionRate} size={72} stroke={6} />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
              Tingkat Penyelesaian
            </p>
            <p className="mt-1 text-2xl font-black text-neutral-900">
              {summary.progressDocuments ? `${summary.completionRate}%` : '—'}
            </p>
            <p className="text-xs text-neutral-500">
              {summary.progressDocuments
                ? `${summary.totalCompleted} dari ${summary.totalStudents * summary.totalComics} modul`
                : 'Data progres belum tersedia'}
            </p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-5">
          <ProgressRing value={summary.averageProgress} size={72} stroke={6} />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
              Rata-rata Progress
            </p>
            <p className="mt-1 text-2xl font-black text-neutral-900">
              {summary.progressDocuments ? `${summary.averageProgress}%` : '—'}
            </p>
            <p className="text-xs text-neutral-500">
              {summary.progressDocuments ? `dari ${summary.totalStudents} siswa` : 'Belum ada dokumen progres'}
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="px-5 pt-4 pb-3 border-b border-neutral-100">
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Live</p>
          <h2 className="text-base font-black text-neutral-900">Aktivitas terbaru</h2>
        </div>
        {recentActivityLoading ? (
          <div className="space-y-3 px-5 py-4">
            <Skeleton className="h-10 rounded" />
            <Skeleton className="h-10 rounded" />
          </div>
        ) : recentActivities.length ? (
          <ul className="divide-y divide-neutral-100">
            {recentActivities.slice(0, 10).map((activity) => {
              const studentName = topStudents.find((student) => student.uid === activity.userId)?.displayName;
              const date = toDate(activity.timestamp);
              return (
                <li key={activity.id} className="px-5 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="text-sm font-semibold text-neutral-800">{activity.title}</p>
                    {date && <time className="text-xs text-neutral-400" dateTime={date.toISOString()}>{date.toLocaleString('id-ID')}</time>}
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">{studentName ?? 'Siswa'}</p>
                  {activity.description && <p className="mt-1 text-sm text-neutral-600">{activity.description}</p>}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-5 py-4 text-sm text-neutral-500">Belum ada aktivitas terbaru yang tersimpan.</p>
        )}
      </Card>

      {/* Top students */}
      {rankedStudents.length > 0 && (
        <Card>
          <div className="px-5 pt-4 pb-3 border-b border-neutral-100">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
              Siswa Teratas
            </p>
            <h2 className="text-base font-black text-neutral-900">Progress Terbaik 🏆</h2>
          </div>
          <ul className="divide-y divide-neutral-50">
            {rankedStudents.slice(0, 5).map((s, i) => (
              <li key={s.uid} className="flex items-center gap-3 px-5 py-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-black text-primary-700">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-800 truncate">{s.displayName}</p>
                  <ProgressBar value={s.averageProgress} className="mt-1" />
                </div>
                <Badge color={s.averageProgress >= 80 ? 'accent' : s.averageProgress >= 50 ? 'primary' : 'warning'}>
                  {s.averageProgress}%
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  if (typeof value === 'string' || typeof value === 'number') {
    const normalized = typeof value === 'number' && value < 1_000_000_000_000 ? value * 1000 : value;
    const date = new Date(normalized);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  if (typeof value === 'object' && value !== null) {
    const timestamp = value as { toDate?: () => Date; seconds?: number; nanoseconds?: number };
    if (typeof timestamp.toDate === 'function') {
      const date = timestamp.toDate();
      return date instanceof Date && Number.isFinite(date.getTime()) ? date : null;
    }
    if (typeof timestamp.seconds === 'number') {
      return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds ?? 0) / 1_000_000);
    }
  }
  return null;
}
