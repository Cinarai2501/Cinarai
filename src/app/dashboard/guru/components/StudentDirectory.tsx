'use client';

import { Card, ProgressBar, Skeleton } from './ui';
import type { StudentLearningStatus, StudentRow, StudentStatusFilter } from '../types';
import { getStudentLearningStatus } from '../services/studentUtils';

interface Props {
  rows: StudentRow[];
  totalCount: number;
  loading: boolean;
  search: string;
  onSearch: (value: string) => void;
  status: StudentStatusFilter;
  onStatus: (value: StudentStatusFilter) => void;
  sortKey: 'name' | 'progress' | 'completed';
  sortDir: 'asc' | 'desc';
  onSort: (key: 'name' | 'progress' | 'completed') => void;
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
  totalComics: number;
  onSelect: (uid: string) => void;
}

const STATUS_FILTERS: Array<{ value: StudentStatusFilter; label: string }> = [
  { value: 'all', label: 'Semua Siswa' },
  { value: 'not_started', label: 'Belum Mulai' },
  { value: 'learning', label: 'Sedang Belajar' },
  { value: 'attention', label: 'Perlu Perhatian' },
  { value: 'completed', label: 'Tuntas' },
];

const STATUS_LABELS: Record<StudentLearningStatus, string> = {
  learning: 'Sedang belajar',
  attention: 'Perlu perhatian',
  completed: 'Tuntas',
  not_started: 'Belum mulai',
};

const STATUS_STYLES: Record<StudentLearningStatus, string> = {
  learning: 'bg-primary-50 text-primary-700',
  attention: 'bg-warning-50 text-warning-700',
  completed: 'bg-success-50 text-success-700',
  not_started: 'bg-neutral-100 text-neutral-600',
};

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
      <div className="space-y-3 border-b border-neutral-100 px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Manajemen</p>
            <h2 className="text-base font-black text-neutral-900">Daftar Siswa</h2>
          </div>
          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">
            {totalCount} siswa
          </span>
        </div>

        <label className="sr-only" htmlFor="student-search">Cari siswa</label>
        <input
          id="student-search"
          type="search"
          placeholder="Cari nama, email, sekolah, kelas…"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          className="min-h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-800 placeholder-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Filter status siswa">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={status === filter.value}
              onClick={() => onStatus(filter.value)}
              className={`min-h-10 flex-shrink-0 rounded-full px-3 text-xs font-semibold transition-colors ${
                status === filter.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs text-neutral-500">Urutkan:</span>
          {(['name', 'progress', 'completed'] as const).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={sortKey === key}
              onClick={() => onSort(key)}
              className={`min-h-9 rounded-full px-3 text-xs font-semibold transition-colors ${
                sortKey === key
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {key === 'name' ? 'Nama' : key === 'progress' ? 'Progress' : 'Selesai'}{sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <ul className="divide-y divide-neutral-100" aria-label="Memuat daftar siswa">
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
      ) : totalCount === 0 ? (
        <div className="px-5 py-12 text-center" role="status">
          <p className="text-sm font-semibold text-neutral-700">
            {search || status !== 'all' ? 'Tidak ada siswa yang cocok dengan pencarian atau filter.' : 'Belum ada data siswa.'}
          </p>
          {(search || status !== 'all') && (
            <p className="mt-1 text-sm text-neutral-500">Coba ubah kata kunci atau pilih filter lain.</p>
          )}
        </div>
      ) : (
        <>
          <ul className="divide-y divide-neutral-100">
            {rows.map((student) => {
              const learningStatus = getStudentLearningStatus(student, totalComics);
              return (
                <li key={student.uid}>
                  <button
                    type="button"
                    onClick={() => onSelect(student.uid)}
                    className="flex min-h-[76px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-primary-50/50 active:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 sm:px-5"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-base font-black text-primary-700">
                      {(student.displayName || student.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-neutral-800">{student.displayName}</p>
                        <span className="flex-shrink-0 text-sm font-bold text-neutral-700">
                          {student.progressList.length ? `${student.averageProgress}%` : '—'}
                        </span>
                      </div>
                      <p className="truncate text-xs text-neutral-500">{student.email}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[learningStatus]}`}>
                          {STATUS_LABELS[learningStatus]}
                        </span>
                        {student.classLevel && <span className="text-[11px] text-neutral-500">{student.classLevel}</span>}
                        {!student.classLevel && student.gradeLevel !== null && (
                          <span className="text-[11px] text-neutral-500">Kelas {student.gradeLevel}</span>
                        )}
                        <span className="text-[11px] text-neutral-500">
                          {student.progressList.length}/{totalComics} komik ada data
                        </span>
                      </div>
                      {student.progressList.length > 0 && (
                        <ProgressBar value={student.averageProgress} className="mt-1.5" />
                      )}
                    </div>
                    <span aria-hidden="true" className="flex-shrink-0 text-sm text-neutral-300">›</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {pageCount > 1 && (
            <nav className="flex items-center justify-between gap-3 border-t border-neutral-100 px-4 py-3 sm:px-5" aria-label="Halaman daftar siswa">
              <p className="text-xs text-neutral-500">Halaman {page} dari {pageCount}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => onPage(page - 1)}
                  className="min-h-10 rounded-lg border border-neutral-200 px-3 text-xs font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sebelumnya
                </button>
                <button
                  type="button"
                  disabled={page >= pageCount}
                  onClick={() => onPage(page + 1)}
                  className="min-h-10 rounded-lg border border-neutral-200 px-3 text-xs font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
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
