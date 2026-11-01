'use client';

import { Card, ProgressBar, Skeleton } from './ui';
import { getModuleRosterSummary } from '../services/moduleAnalytics';
import { getStudentLearningStatus } from '../services/studentUtils';
import type { DashboardSummary, StudentRow } from '../types';
import type { ComicDocument } from '@/types/firestore';
import type { GuruRecentActivity } from '../services/firestoreService';

interface Props {
  summary: DashboardSummary;
  rows: StudentRow[];
  comics: ComicDocument[];
  recentActivities: GuruRecentActivity[];
  recentActivityLoading: boolean;
  loading: boolean;
  onSelectStudent: (uid: string) => void;
  onOpenAi: () => void;
  onOpenStudents: () => void;
  onOpenModules: () => void;
  onOpenModule: (comicId: number) => void;
}

export function DashboardOverview({
  summary,
  rows,
  comics,
  recentActivities,
  recentActivityLoading,
  loading,
  onSelectStudent,
  onOpenAi,
  onOpenStudents,
  onOpenModules,
  onOpenModule,
}: Props) {
  const attentionStudents = rows
    .filter((student) => getStudentLearningStatus(student, summary.totalComics) === 'attention')
    .sort((left, right) => left.averageProgress - right.averageProgress)
    .slice(0, 3);

  if (loading) {
    return (
      <div className="space-y-3" aria-label="Memuat ringkasan dashboard">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
      </div>
    );
  }

  const validatedActivities = recentActivities.flatMap((activity) => {
    const date = toDate(activity.timestamp);
    return date ? [{ activity, date }] : [];
  }).slice(0, 5);

  return (
    <div className="space-y-3">
      <Card className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary-700">Ringkasan pembelajaran</p>
            <p className="mt-1 text-sm leading-5 text-neutral-700">
              {rows.length === 0
                ? 'Belum ada siswa dalam roster.'
                : attentionStudents.length > 0
                  ? `${summary.attentionStudents} siswa memenuhi kriteria perlu perhatian (progress di bawah 40% dengan bukti belajar).`
                  : 'Tidak ada siswa yang saat ini memenuhi kriteria perlu perhatian.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAi}
            className="min-h-10 flex-shrink-0 rounded-xl bg-primary-600 px-3 text-xs font-bold text-white transition hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
          >
            Detail AI <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <SummaryMetric
            label="Rata-rata progress"
            value={summary.totalStudents && summary.totalComics ? `${summary.averageProgress}%` : '—'}
          />
          <SummaryMetric
            label="Tingkat penyelesaian"
            value={summary.totalStudents && summary.totalComics ? `${summary.completionRate}%` : '—'}
          />
          <SummaryMetric label="Perlu perhatian" value={summary.attentionStudents} />
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <SectionHeader title="Progress modul" action="Semua modul" onAction={onOpenModules} />
        {comics.length ? (
          <ul className="divide-y divide-neutral-100">
            {comics.slice(0, 6).map((comic) => {
              const moduleSummary = getModuleRosterSummary(rows, comic.comicId);
              const classProgress = moduleSummary.averageProgress;
              return (
                <li key={comic.id ?? comic.comicId}>
                  <button
                    type="button"
                    onClick={() => onOpenModule(comic.comicId)}
                    className="w-full py-2.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
                    aria-label={`Buka detail ${comic.title || `Komik ${comic.comicId}`}`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-sm font-semibold text-neutral-800">
                        {comic.title || `Komik ${comic.comicId}`}
                      </span>
                      <span className="flex-shrink-0 text-xs font-bold text-primary-700">
                        {classProgress === null ? '—' : `${classProgress}%`}
                      </span>
                    </span>
                    <span className="mt-1.5 flex items-center gap-2">
                      <ProgressBar value={classProgress ?? 0} className="h-1.5 flex-1 [&>div]:h-1.5" />
                      <span className="w-24 flex-shrink-0 text-right text-[10px] text-neutral-500">
                        {moduleSummary.progressRecordCount}/{rows.length} siswa
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-xl bg-neutral-50 px-3 py-4 text-sm text-neutral-600">Katalog enam komik belum tersedia.</p>
        )}
        {rows.length > 0 && (
          <p className="mt-2 text-[10px] text-neutral-500">Progress kelas menggunakan seluruh roster; siswa tanpa dokumen progress dihitung 0%.</p>
        )}
      </Card>

      <Card className="p-4 sm:p-5">
        <SectionHeader
          title="Siswa perlu perhatian"
          action="Lihat semua siswa"
          onAction={onOpenStudents}
        />
        {attentionStudents.length ? (
          <ul className="divide-y divide-neutral-100">
            {attentionStudents.map((student) => (
              <li key={student.uid}>
                <div className="flex min-h-14 items-center gap-3 py-2">
                  <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-warning-50 text-sm font-bold text-warning-700">
                    {student.displayName.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-neutral-900">{student.displayName}</p>
                    <p className="text-xs text-neutral-600">
                      {student.progressList.length ? `${student.averageProgress}% progress` : 'Progress belum tersedia'}
                      {' · '}{statusLabel(getStudentLearningStatus(student, summary.totalComics))}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectStudent(student.uid)}
                    className="min-h-10 flex-shrink-0 rounded-lg px-2 text-xs font-bold text-primary-700 hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
                    aria-label={`Lihat detail ${student.displayName}`}
                  >
                    Detail
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl bg-neutral-50 px-3 py-4 text-sm text-neutral-600">
            {rows.length ? 'Tidak ada siswa yang memenuhi kriteria perhatian saat ini.' : 'Daftar siswa akan muncul setelah data tersedia.'}
          </p>
        )}
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="mb-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Aktivitas tersimpan</p>
          <h2 className="text-base font-black text-neutral-900">Terbaru</h2>
        </div>
        {recentActivityLoading ? (
          <div className="space-y-2" aria-label="Memuat aktivitas terbaru">
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
          </div>
        ) : validatedActivities.length ? (
          <ul className="divide-y divide-neutral-100">
            {validatedActivities.map(({ activity, date }) => {
              const studentName = rows.find((student) => student.uid === activity.userId)?.displayName;
              return (
                <li key={activity.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-neutral-800">{activity.title}</p>
                    <p className="truncate text-xs text-neutral-500">{studentName || 'Siswa'}</p>
                  </div>
                  <time className="flex-shrink-0 text-right text-[10px] text-neutral-500" dateTime={date.toISOString()}>
                    {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    <span className="block">{date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  </time>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-xl bg-neutral-50 px-3 py-3 text-sm text-neutral-600">
            Belum ada aktivitas dengan timestamp valid yang tersimpan.
          </p>
        )}
      </Card>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-xl bg-neutral-50 px-2.5 py-2">
      <p className="truncate text-base font-black text-neutral-900">{value}</p>
      <p className="text-[10px] leading-4 text-neutral-600">{label}</p>
    </div>
  );
}

function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="mb-1 flex items-center justify-between gap-2">
      <h2 className="text-base font-black text-neutral-900">{title}</h2>
      <button
        type="button"
        onClick={onAction}
        className="min-h-10 flex-shrink-0 rounded-lg px-2 text-xs font-bold text-primary-700 hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
      >
        {action} <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

function statusLabel(status: ReturnType<typeof getStudentLearningStatus>): string {
  switch (status) {
    case 'attention': return 'Perlu perhatian';
    case 'completed': return 'Tuntas';
    case 'learning': return 'Sedang belajar';
    case 'not_started': return 'Belum mulai';
  }
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
