'use client';

import { Card, ProgressBar, Badge, Skeleton } from './ui';
import type { StudentRow } from '../types';
import { FirestoreOperationErrors } from './FirestoreOperationErrors';
import type { FirestoreOperationFailure } from '../services/firestoreDiagnostics';

interface Props {
  rows: StudentRow[];
  loading: boolean;
  errors: FirestoreOperationFailure[];
  progressUnavailable: boolean;
  onRetry: () => void;
  search: string;
  onSearch: (v: string) => void;
  sortKey: 'name' | 'progress' | 'completed';
  sortDir: 'asc' | 'desc';
  onSort: (k: 'name' | 'progress' | 'completed') => void;
  onSelect: (uid: string) => void;
}

export function StudentDirectory({
  rows,
  loading,
  errors,
  progressUnavailable,
  onRetry,
  search,
  onSearch,
  sortKey,
  sortDir,
  onSort,
  onSelect,
}: Props) {
  const SortBtn = ({ k, label }: { k: typeof sortKey; label: string }) => (
    <button
      onClick={() => onSort(k)}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
        sortKey === k
          ? 'bg-primary-600 text-white'
          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
      }`}
    >
      {label} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </button>
  );

  return (
    <Card>
      <div className="px-5 pt-4 pb-3 border-b border-neutral-100 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Manajemen</p>
            <h2 className="text-base font-black text-neutral-900">Daftar Siswa 👨‍🎓</h2>
          </div>
          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">
            {errors.some((failure) => failure.operation === 'subscribeStudents')
              ? 'Jumlah tidak tersedia'
              : `${rows.length} siswa`}
          </span>
        </div>

        <FirestoreOperationErrors failures={errors} onRetry={onRetry} />

        <input
          type="search"
          placeholder="Cari nama, email, sekolah…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-800 placeholder-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />

        <div className="flex gap-2 flex-wrap">
          <SortBtn k="name" label="Nama" />
          <SortBtn k="progress" label="Progress" />
          <SortBtn k="completed" label="Selesai" />
        </div>
      </div>

      {loading ? (
        <ul className="divide-y divide-neutral-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 px-5 py-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-2 w-full rounded" />
              </div>
            </li>
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-neutral-400">
          {errors.some((failure) => failure.operation === 'subscribeStudents')
            ? 'Daftar siswa gagal dimuat.'
            : search ? 'Tidak ada siswa yang cocok.' : 'Belum ada data siswa.'}
        </div>
      ) : (
        <ul className="divide-y divide-neutral-50">
          {rows.map((s) => (
            <li
              key={s.uid}
              onClick={() => onSelect(s.uid)}
              className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-primary-50/50 transition-colors active:bg-primary-50"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-base font-black text-primary-700">
                {s.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-neutral-800 truncate">{s.displayName}</p>
                  <Badge
                    color={
                      progressUnavailable
                        ? 'warning'
                        : s.averageProgress >= 80
                        ? 'accent'
                        : s.averageProgress >= 50
                        ? 'primary'
                        : 'warning'
                    }
                  >
                    {progressUnavailable ? '—' : `${s.averageProgress}%`}
                  </Badge>
                </div>
                <p className="text-xs text-neutral-400 truncate">{s.email}</p>
                {!progressUnavailable && <ProgressBar value={s.averageProgress} className="mt-1.5" />}
              </div>
              <span className="text-neutral-300 text-sm flex-shrink-0">›</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
