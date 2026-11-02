'use client';

import { Avatar, Card, EmptyState, LoadingState, ProgressBar, SearchInput, Skeleton, StatusBadge } from './ui';
import type { StudentRow, StudentStatusFilter } from '../types';
import { getStudentLearningStatus } from '../services/studentUtils';

interface Props {
  rows: StudentRow[];
  totalCount: number;
  loading: boolean;
  search: string;
  onSearch: (value: string) => void;
  status: StudentStatusFilter;
  onStatus: (value: StudentStatusFilter) => void;
  sortKey: 'name' | 'progress';
  sortDir: 'asc' | 'desc';
  onSort: (key: 'name' | 'progress') => void;
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
  totalComics: number;
  onSelect: (uid: string) => void;
}

const STATUS_FILTERS: Array<{ value: StudentStatusFilter; label: string }> = [
  { value: 'all', label: 'Semua siswa' },
  { value: 'not_started', label: 'Belum mulai' },
  { value: 'learning', label: 'Sedang belajar' },
  { value: 'completed', label: 'Tuntas' },
  { value: 'attention', label: 'Perlu perhatian' },
];

export function StudentDirectory({
  rows,
  totalCount,
  loading,
  search,
  onSearch,
  status,
  onStatus,
  sortKey,
  sortDir,
  onSort,
  page,
  pageCount,
  onPage,
  totalComics,
  onSelect,
}: Props) {
  return (
    <Card>
      <div className="space-y-3 border-b border-ui-border px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
              <h2 className="guru-section-title">Daftar siswa</h2>
          </div>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
            {totalCount} siswa
          </span>
        </div>

        <label className="sr-only" htmlFor="student-search">Cari siswa</label>
        <SearchInput
          id="student-search"
          placeholder="Cari nama siswa…"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          className="bg-canvas px-4"
        />

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Filter status siswa">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={status === filter.value}
              onClick={() => onStatus(filter.value)}
              className={`min-h-11 flex-shrink-0 rounded-full px-3 text-xs font-semibold transition-colors ${
                status === filter.value
                  ? 'bg-brand-700 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs text-secondary-content">Urutkan:</span>
          {(['name', 'progress'] as const).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={sortKey === key}
              onClick={() => onSort(key)}
              className={`min-h-11 rounded-full px-3 text-xs font-semibold transition-colors ${
                sortKey === key
                  ? 'bg-brand-700 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {key === 'name' ? 'Nama' : 'Progress'}{sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState label="Memuat daftar siswa">
          <ul className="divide-y divide-ui-border">
            {Array.from({ length: 5 }).map((_, index) => (
              <li key={index} className="flex items-center gap-3 px-4 py-4 sm:px-5">
                <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40 rounded" />
                  <Skeleton className="h-2 w-full rounded" />
                </div>
              </li>
            ))}
          </ul>
        </LoadingState>
      ) : totalCount === 0 ? (
        <EmptyState className="mx-4 my-5">
          <p className="font-semibold text-ink">
            {search || status !== 'all' ? 'Tidak ada siswa yang cocok dengan pencarian atau filter.' : 'Belum ada data siswa.'}
          </p>
          {(search || status !== 'all') && (
            <p className="mt-1 text-sm text-secondary-content">Coba ubah kata kunci atau pilih filter lain.</p>
          )}
        </EmptyState>
      ) : (
        <>
          <ul className="divide-y divide-ui-border">
            {rows.map((student) => {
              const learningStatus = getStudentLearningStatus(student, totalComics);
              return (
                <li key={student.uid}>
                  <button
                    type="button"
                    onClick={() => onSelect(student.uid)}
                    className="flex min-h-[76px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-50/50 active:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 sm:px-5"
                  >
                    <Avatar name={student.displayName} src={student.photoURL} />
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-ink">{student.displayName}</p>
                        <span className="flex-shrink-0 text-sm font-bold text-secondary-content">
                          {student.progressList.length ? `${student.averageProgress}%` : '—'}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <StatusBadge status={learningStatus} />
                      </div>
                      <ProgressBar value={student.averageProgress} className="mt-2" />
                    </div>
                    <span className="flex-shrink-0 rounded-lg px-2 py-2 text-xs font-bold text-brand-700" aria-hidden="true">Detail ›</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {pageCount > 1 && (
            <nav className="flex items-center justify-between gap-3 border-t border-ui-border px-4 py-3 sm:px-5" aria-label="Halaman daftar siswa">
              <p className="text-xs text-secondary-content">Halaman {page} dari {pageCount}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => onPage(page - 1)}
                  className="min-h-11 rounded-lg border border-ui-border px-3 text-xs font-semibold text-secondary-content disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sebelumnya
                </button>
                <button
                  type="button"
                  disabled={page >= pageCount}
                  onClick={() => onPage(page + 1)}
                  className="min-h-11 rounded-lg border border-ui-border px-3 text-xs font-semibold text-secondary-content disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Berikutnya
                </button>
              </div>
            </nav>
          )}
        </>
      )}
    </Card>
  );
}
