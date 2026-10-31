'use client';

import { Badge, Card, ProgressBar, Skeleton } from './ui';
import { ComicProgressList } from './ComicProgressList';
import { getStudentLearningStatus } from '../services/studentUtils';
import type { DashboardSummary, StudentRow } from '../types';
import type { ComicDocument } from '@/types/firestore';
import type { GuruRecentActivity } from '../services/firestoreService';

interface Props {
  summary: DashboardSummary;
  rows: StudentRow[];
  topStudents: StudentRow[];
  comics: ComicDocument[];
  recentActivities: GuruRecentActivity[];
  recentActivityLoading: boolean;
  loading: boolean;
  onSelectStudent: (uid: string) => void;
  onOpenAi: () => void;
  onOpenStudents: () => void;
  onOpenModules: () => void;
}

export function DashboardOverview({
  summary,
  rows,
  topStudents,
  comics,
  recentActivities,
  recentActivityLoading,
  loading,
  onSelectStudent,
  onOpenAi,
  onOpenStudents,
  onOpenModules,
}: Props) {
  const attentionCandidates = [...rows]
    .filter((student) => getStudentLearningStatus(student, summary.totalComics) === 'attention')
    .sort((left, right) => left.averageProgress - right.averageProgress)
  const needsAttention = attentionCandidates.slice(0, 4);
  const rankedStudents = topStudents.filter((student) => student.progressList.length > 0).slice(0, 3);

  if (loading) {
    return (
      <div className="space-y-3" aria-label="Memuat ringkasan dashboard">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Card className="border-primary-100 bg-gradient-to-br from-white to-primary-50/70 p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-primary-100 text-lg" aria-hidden="true">
            ✦
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary-700">Insight AI kelas</p>
            <h2 className="mt-0.5 text-base font-black text-neutral-900">Ringkasan pembelajaran</h2>
          </div>
        </div>
        <p className="mt-3 text-sm leading-5 text-neutral-700">
          {rows.length === 0
            ? 'Belum ada data siswa untuk diringkas.'
            : `${attentionCandidates.length > 0
              ? `${attentionCandidates.length} siswa memiliki progress tercatat di bawah 40% dan perlu ditinjau.`
              : 'Tidak ada siswa dengan indikator progress rendah yang perlu ditinjau.'} ${
              summary.progressDocuments
                ? `Rata-rata progress tersimpan kelas ${summary.averageProgress}%.`
                : 'Progress belajar belum tersedia.'
            }`}
        </p>
        <p className="mt-1 text-[11px] text-neutral-500">
          Pratinjau ini dihitung dari data tersimpan. Analisis dan rekomendasi AI lengkap tersedia di tab AI.
        </p>
        <button
          type="button"
          onClick={onOpenAi}
          className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-primary-600 px-4 text-sm font-bold text-white transition hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
        >
          Buka analisis AI <span className="ml-2" aria-hidden="true">→</span>
        </button>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Tindak lanjut</p>
            <h2 className="text-base font-black text-neutral-900">Siswa perlu perhatian</h2>
          </div>
          <button
            type="button"
            onClick={onOpenStudents}
            className="min-h-11 flex-shrink-0 rounded-xl px-2 text-xs font-bold text-primary-700 hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
          >
            Semua siswa <span aria-hidden="true">→</span>
          </button>
        </div>

        {needsAttention.length > 0 ? (
          <ul className="divide-y divide-neutral-100">
            {needsAttention.map((student) => (
              <li key={student.uid}>
                <button
                  type="button"
                  onClick={() => onSelectStudent(student.uid)}
                  className="flex min-h-[60px] w-full items-center gap-3 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
                >
                  <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-warning-50 text-sm font-bold text-warning-700">
                    {student.displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-neutral-800">{student.displayName}</span>
                    <span className="block truncate text-xs text-neutral-600">
                      {`${student.averageProgress}% rata-rata dari ${student.progressList.length} komik tercatat`}
                    </span>
                  </span>
                  <Badge color="warning">
                    {`${student.averageProgress}%`}
                  </Badge>
                  <span className="text-neutral-400" aria-hidden="true">›</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl bg-neutral-50 px-3 py-4 text-sm text-neutral-600">
            {rows.length === 0
              ? 'Daftar siswa akan muncul setelah data tersedia.'
              : 'Tidak ada siswa yang memenuhi kriteria perhatian saat ini.'}
          </p>
        )}
      </Card>

      <ComicProgressList
        comics={comics}
        rows={rows}
        loading={false}
        compact
        onOpenModules={onOpenModules}
      />

      <Card>
        <div className="border-b border-neutral-100 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Aktivitas tersimpan</p>
          <h2 className="text-base font-black text-neutral-900">Terbaru</h2>
        </div>
        {recentActivityLoading ? (
          <div className="space-y-2 px-4 py-3">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
        ) : recentActivities.length > 0 ? (
          <ul className="divide-y divide-neutral-100">
            {recentActivities.slice(0, 5).map((activity) => {
              const date = toDate(activity.timestamp);
              if (!date) return null;
              const studentName = rows.find((student) => student.uid === activity.userId)?.displayName;
              return (
                <li key={activity.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-neutral-800">{activity.title}</p>
                      <p className="mt-0.5 truncate text-xs text-neutral-600">{studentName ?? 'Siswa'}</p>
                    </div>
                    <time
                      className="flex-shrink-0 text-right text-[11px] leading-4 text-neutral-500"
                      dateTime={date.toISOString()}
                    >
                      {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      <span className="block">{date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </time>
                  </div>
                  {activity.description && (
                    <p className="mt-1 break-words text-xs leading-5 text-neutral-600">{activity.description}</p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-4 py-4 text-sm text-neutral-600">
            Belum ada aktivitas dengan timestamp valid yang tersimpan.
          </p>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Apresiasi kelas</p>
            <h2 className="text-base font-black text-neutral-900">Progress terbaik</h2>
          </div>
          <span className="text-xl" aria-hidden="true">🏆</span>
        </div>
        {rankedStudents.length > 0 ? (
          <ul className="mt-2 divide-y divide-neutral-100">
            {rankedStudents.map((student, index) => (
              <li key={student.uid}>
                <button
                  type="button"
                  onClick={() => onSelectStudent(student.uid)}
                  className="flex min-h-14 w-full items-center gap-3 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
                >
                  <span className="w-5 text-center text-xs font-black text-neutral-500">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-800">{student.displayName}</span>
                  <span className="w-12 text-right text-xs font-bold text-primary-700">{student.averageProgress}%</span>
                  <ProgressBar value={student.averageProgress} className="w-16 flex-shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-neutral-600">Belum ada progress siswa untuk ditampilkan.</p>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-2 pb-1">
        <MiniMetric label="Tingkat penyelesaian" value={summary.progressDocuments ? `${summary.completionRate}%` : '—'} />
        <MiniMetric label="Rata-rata progress" value={summary.progressDocuments ? `${summary.averageProgress}%` : '—'} />
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white px-3 py-2.5 shadow-sm">
      <p className="text-lg font-black text-neutral-900">{value}</p>
      <p className="text-[11px] leading-4 text-neutral-600">{label}</p>
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
      const date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds ?? 0) / 1_000_000);
      return Number.isFinite(date.getTime()) ? date : null;
    }
  }
  return null;
}
