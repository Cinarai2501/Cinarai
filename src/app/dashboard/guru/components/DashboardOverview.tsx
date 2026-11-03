'use client';

import Image from 'next/image';
import { Avatar, Button, Card, EmptyState, LoadingState, ProgressBar, SectionHeader, Skeleton, StatCard } from './ui';
import { getModuleRosterSummary } from '../services/moduleAnalytics';
import { getStudentLearningStatus } from '../services/studentUtils';
import type { DashboardSummary, StudentRow } from '../types';
import type { ComicDocument } from '@/types/firestore';
import type { DashboardDataState } from '../services/dashboardState';

interface Props {
  summary: DashboardSummary;
  rows: StudentRow[];
  comics: ComicDocument[];
  loading: boolean;
  hasLoaded: boolean;
  dataState: DashboardDataState;
  error: string | null;
  onRetry: () => void;
  onSelectStudent: (uid: string) => void;
  onOpenStudents: () => void;
  onOpenModules: () => void;
  onOpenModule: (comicId: number) => void;
}

const moduleCovers: Record<number, string> = {
  1: '/assets/dashboard/home/covers/cover-komik-1.png',
  2: '/assets/dashboard/home/covers/cover-komik-2.png',
  3: '/assets/dashboard/home/covers/cover-komik-3.png',
  4: '/assets/dashboard/home/covers/cover-komik-4.png',
  5: '/assets/dashboard/home/covers/cover-komik-5.png',
  6: '/comics/komik-6/cover.png',
};

const stats = [
  { key: 'totalStudents', label: 'Total siswa', icon: '👥', tone: 'brand' },
  { key: 'learningStudents', label: 'Sedang belajar', icon: '📘', tone: 'info' },
  { key: 'studentsCompleted', label: 'Tuntas', icon: '✓', tone: 'success' },
  { key: 'attentionStudents', label: 'Perlu perhatian', icon: '!', tone: 'warning' },
] as const;

export function DashboardOverview({
  summary,
  rows,
  comics,
  loading,
  hasLoaded,
  dataState,
  error,
  onRetry,
  onSelectStudent,
  onOpenStudents,
  onOpenModules,
  onOpenModule,
}: Props) {
  const attentionStudents = rows
    .filter((student) => getStudentLearningStatus(student, summary.totalComics) === 'attention')
    .sort((left, right) => left.averageProgress - right.averageProgress)
    .slice(0, 3);

  if (loading && !hasLoaded) {
    return (
      <LoadingState label="Memuat ringkasan dashboard">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((item) => <Skeleton key={item.key} className="h-24 rounded-2xl" />)}
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
        </div>
      </LoadingState>
    );
  }

  if (error && !hasLoaded) {
    return (
      <div role="alert">
        <Card className="p-5">
          <p className="font-bold text-error-700">Dashboard gagal memuat data.</p>
          <p className="mt-1 text-sm text-error-700">{error}</p>
          <Button className="mt-3" onClick={onRetry}>Coba lagi</Button>
        </Card>
      </div>
    );
  }

  if (dataState === 'empty' && !loading) {
    return (
      <div className="space-y-4">
        {error && (
          <div role="alert" className="rounded-2xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
            <p className="font-bold">Data dashboard belum dapat diperbarui.</p>
            <p className="mt-1">{error}</p>
            <Button className="mt-3" onClick={onRetry}>Coba lagi</Button>
          </div>
        )}
        <Card>
          <EmptyState>
            <p className="font-semibold text-ink">Belum ada siswa terdaftar.</p>
            <p className="mt-1 text-sm text-secondary-content">Siswa akan tampil setelah terdaftar sebagai student.</p>
          </EmptyState>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div role="alert" className="rounded-2xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
          <p className="font-bold">Data dashboard belum dapat diperbarui.</p>
          <p className="mt-1">{error}</p>
          <Button className="mt-3" onClick={onRetry}>Coba lagi</Button>
        </div>
      )}
      {dataState === 'insufficient_data' && (
        <p role="status" className="rounded-2xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800">
          Data siswa tersedia, tetapi belum ada progress pembelajaran yang cukup untuk analisis.
        </p>
      )}
      <section aria-label="Statistik siswa" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((item) => (
          <StatCard
            key={item.key}
            icon={item.icon}
            label={item.label}
            value={summary[item.key]}
            tone={item.tone}
            className="min-h-[104px] p-4 sm:p-5"
          />
        ))}
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
        <Card className="order-2 min-w-0 p-4 sm:p-5 lg:order-1">
          <SectionHeader
            title="Progress modul"
            action={<Button variant="ghost" className="px-2 text-xs" onClick={onOpenModules}>Lihat semua modul →</Button>}
          />
          {comics.length ? (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {comics.slice(0, 4).map((comic) => {
                const moduleSummary = getModuleRosterSummary(rows, comic.comicId);
                const classProgress = moduleSummary.averageProgress;
                const cover = moduleCovers[comic.comicId];
                return (
                  <li key={comic.id ?? comic.comicId} className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onOpenModule(comic.comicId)}
                      className="group w-full overflow-hidden rounded-2xl border border-ui-border bg-white text-left transition hover:border-brand-200 hover:bg-brand-50/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
                      aria-label={`Buka detail ${comic.title || `Komik ${comic.comicId}`}`}
                    >
                      <div className="flex h-24 items-center justify-center overflow-hidden bg-brand-100">
                        {cover ? (
                          <Image
                            src={cover}
                            alt=""
                            width={240}
                            height={120}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <span className="text-4xl" aria-hidden="true">📚</span>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-ink">
                            {comic.title || `Komik ${comic.comicId}`}
                          </span>
                          <span className="flex-shrink-0 text-sm font-black text-brand-700">
                            {classProgress === null ? '—' : `${classProgress}%`}
                          </span>
                        </div>
                        <ProgressBar value={classProgress ?? 0} className="mt-2" />
                        <span className="mt-2 flex min-h-8 items-center justify-between gap-2 text-xs font-bold text-brand-700">
                          Detail Modul <span aria-hidden="true">→</span>
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState className="mt-3">Modul akan tampil setelah katalog tersedia.</EmptyState>
          )}
        </Card>

        <Card className="order-1 min-w-0 p-4 sm:p-5 lg:order-2">
          <SectionHeader
            title="Siswa perlu perhatian"
            action={<Button variant="ghost" className="px-2 text-xs" onClick={onOpenStudents}>Semua siswa →</Button>}
          />
          {attentionStudents.length ? (
            <ul className="mt-2 divide-y divide-ui-border">
              {attentionStudents.map((student) => (
                <li key={student.uid} className="flex min-h-[68px] items-center gap-3 py-2.5">
                  <Avatar name={student.displayName} className="bg-warning-50 text-warning-800" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{student.displayName}</p>
                    <p className="mt-0.5 text-xs text-secondary-content">
                      {student.progressList.length ? `${student.averageProgress}% progress` : 'Progress belum tersedia'}
                    </p>
                    <span className="mt-1 inline-flex rounded-full bg-warning-50 px-2 py-0.5 text-[10px] font-semibold text-warning-800">
                      Perlu perhatian
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectStudent(student.uid)}
                    className="min-h-11 flex-shrink-0 rounded-lg px-2 text-xs font-bold text-brand-700 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
                    aria-label={`Lihat detail ${student.displayName}`}
                  >
                    Detail
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState className="mt-3">
              {rows.length ? 'Tidak ada siswa yang perlu perhatian saat ini.' : 'Belum ada siswa dalam daftar.'}
            </EmptyState>
          )}
        </Card>
      </div>
    </div>
  );
}
