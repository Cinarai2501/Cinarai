'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useStudents } from '../hooks/useStudents';
import { useStudentSearch } from '../hooks/useStudentSearch';
import { useStudentFilter } from '../hooks/useStudentFilter';
import { useStudentSort } from '../hooks/useStudentSort';
import { TeacherDashboardLayout } from './TeacherDashboardLayout';
import { TeacherHeader } from './TeacherHeader';
import { TeacherSidebar } from './TeacherSidebar';
import type { StudentDirectoryRow } from '../services/teacher/students/students';

const filterOptions = [
  { value: 'all', label: 'Semua' },
  { value: 'active', label: 'Aktif' },
  { value: 'incomplete', label: 'Belum Selesai' },
  { value: 'completed', label: 'Sudah Selesai' },
] as const;

const sortOptions = [
  { value: 'name', label: 'Nama' },
  { value: 'progress', label: 'Progress' },
  { value: 'score', label: 'Nilai' },
  { value: 'activity', label: 'Aktivitas Terakhir' },
] as const;

function statusBadgeClass(status: StudentDirectoryRow['status']) {
  switch (status) {
    case 'Aktif':
      return 'bg-emerald-50 text-emerald-700';
    case 'Sedang Belajar':
      return 'bg-sky-50 text-sky-700';
    case 'Belum Memulai':
      return 'bg-neutral-200 text-neutral-700';
    case 'Selesai':
      return 'bg-amber-50 text-amber-700';
    default:
      return 'bg-neutral-100 text-neutral-700';
  }
}

export function StudentDirectoryPage() {
  const { rows, loading, error } = useStudents();
  const { query, setQuery, filteredRows: searchedRows } = useStudentSearch(rows);
  const { filter, setFilter, filteredRows: filteredByStatus } = useStudentFilter(searchedRows);

  const { sort, setSort, sortedRows: sortedByOption } = useStudentSort(filteredByStatus);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(sortedByOption.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [query, filter, sort]);

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedByOption.slice(start, start + pageSize);
  }, [sortedByOption, currentPage]);

  const summary = useMemo(() => {
    const totalStudents = rows.length;
    const activeStudents = rows.filter((row) => row.isActive).length;
    const completedStudents = rows.filter((row) => row.isCompleted).length;
    const averageProgress = rows.length
      ? Math.round(rows.reduce((sum, row) => sum + row.progress, 0) / rows.length)
      : 0;

    return { totalStudents, activeStudents, completedStudents, averageProgress };
  }, [rows]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 py-4 sm:px-6 lg:px-8">
        <TeacherDashboardLayout header={<TeacherHeader />} sidebar={<TeacherSidebar />}>
          <div className="rounded-[28px] border border-neutral-100 bg-white p-6 shadow-sm shadow-neutral-200/70">
            <p className="text-lg font-black text-neutral-900">Memuat data siswa…</p>
          </div>
        </TeacherDashboardLayout>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 py-4 sm:px-6 lg:px-8">
        <TeacherDashboardLayout header={<TeacherHeader />} sidebar={<TeacherSidebar />}>
          <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 shadow-sm shadow-rose-200/70">
            <p className="text-lg font-black text-rose-900">Gagal memuat data siswa</p>
            <p className="mt-2 text-sm text-rose-700">{error}</p>
          </div>
        </TeacherDashboardLayout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-4 sm:px-6 lg:px-8">
      <TeacherDashboardLayout header={<TeacherHeader />} sidebar={<TeacherSidebar />}>
        <div className="space-y-6">
          <div className="rounded-[28px] border border-neutral-100 bg-white p-6 shadow-sm shadow-neutral-200/70">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-500">Manajemen Siswa</p>
                <h1 className="mt-1 text-2xl font-black text-neutral-900">Kelola seluruh siswa yang menggunakan aplikasi CINARAI.</h1>
              </div>
              <div className="rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700">Realtime</div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard label="Total Siswa" value={summary.totalStudents} accent="bg-primary-50 text-primary-700" />
              <SummaryCard label="Siswa Aktif" value={summary.activeStudents} accent="bg-secondary-50 text-secondary-700" />
              <SummaryCard label="Siswa Selesai Semua Modul" value={summary.completedStudents} accent="bg-amber-50 text-amber-700" />
              <SummaryCard label="Progress Rata-rata" value={`${summary.averageProgress}%`} accent="bg-emerald-50 text-emerald-700" />
            </div>
          </div>

          <div className="rounded-[28px] border border-neutral-100 bg-white p-4 shadow-sm shadow-neutral-200/70 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                <label className="flex-1">
                  <span className="sr-only">Cari siswa</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari nama, email, atau kelas"
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 outline-none focus:border-primary-400 focus:bg-white"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFilter(option.value as typeof filter)}
                      className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                        filter === option.value
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-neutral-600">Urutkan</label>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as typeof sort)}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 outline-none"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {sortedByOption.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
                  Tidak ditemukan siswa sesuai filter atau pencarian.
                </div>
              ) : (
                <>
                  <div className="hidden md:block overflow-hidden rounded-[24px] border border-neutral-100">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-neutral-100 text-sm">
                        <thead className="bg-neutral-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-neutral-600">Avatar</th>
                            <th className="px-4 py-3 text-left font-semibold text-neutral-600">Nama</th>
                            <th className="px-4 py-3 text-left font-semibold text-neutral-600">Kelas</th>
                            <th className="px-4 py-3 text-left font-semibold text-neutral-600">Email</th>
                            <th className="px-4 py-3 text-left font-semibold text-neutral-600">Progress</th>
                            <th className="px-4 py-3 text-left font-semibold text-neutral-600">Modul Terakhir</th>
                            <th className="px-4 py-3 text-left font-semibold text-neutral-600">Nilai Terakhir</th>
                            <th className="px-4 py-3 text-left font-semibold text-neutral-600">Aktivitas Terakhir</th>
                            <th className="px-4 py-3 text-left font-semibold text-neutral-600">Status</th>
                            <th className="px-4 py-3 text-left font-semibold text-neutral-600">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 bg-white">
                          {pageRows.map((row) => (
                            <tr key={row.id} className="hover:bg-neutral-50">
                              <td className="px-4 py-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700">
                                  {row.avatar}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-semibold text-neutral-900">{row.name}</div>
                              </td>
                              <td className="px-4 py-3 text-neutral-600">{row.grade}</td>
                              <td className="px-4 py-3 text-neutral-600">{row.email}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-2.5 w-24 rounded-full bg-neutral-100">
                                    <div className="h-2.5 rounded-full bg-primary-500" style={{ width: `${row.progress}%` }} />
                                  </div>
                                  <span className="text-sm font-semibold text-neutral-700">{row.progress}%</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-neutral-600">{row.lastModule}</td>
                              <td className="px-4 py-3 text-neutral-600">{row.lastScore}%</td>
                              <td className="px-4 py-3 text-neutral-600">{row.lastActivity}</td>
                              <td className="px-4 py-3">
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(row.status)}`}>
                                  {row.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <Link
                                  href={`/dashboard/guru/siswa/${row.id}`}
                                  className="rounded-full bg-primary-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
                                >
                                  Lihat Detail
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid gap-4 md:hidden">
                    {pageRows.map((row) => (
                      <div key={row.id} className="rounded-[24px] border border-neutral-100 bg-neutral-50 p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700">
                              {row.avatar}
                            </div>
                            <div>
                              <p className="font-semibold text-neutral-900">{row.name}</p>
                              <p className="text-sm text-neutral-600">{row.grade}</p>
                            </div>
                          </div>
                          <Link
                            href={`/dashboard/guru/siswa/${row.id}`}
                            className="rounded-full bg-primary-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
                          >
                            Detail
                          </Link>
                        </div>
                        <div className="mt-4 space-y-3 text-sm text-neutral-700">
                          <div className="flex items-center justify-between">
                            <span>Progress</span>
                            <span className="font-semibold">{row.progress}%</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-neutral-200">
                            <div className="h-full rounded-full bg-primary-500" style={{ width: `${row.progress}%` }} />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-2xl bg-white p-3">
                              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Modul</p>
                              <p className="mt-1 font-semibold text-neutral-900">{row.lastModule}</p>
                            </div>
                            <div className="rounded-2xl bg-white p-3">
                              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Nilai</p>
                              <p className="mt-1 font-semibold text-neutral-900">{row.lastScore}%</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Aktivitas</span>
                            <span className="font-semibold">{row.lastActivity}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Status</span>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(row.status)}`}>
                              {row.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            {pageCount > 1 ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-neutral-100 bg-neutral-50 p-4 text-sm text-neutral-700">
                <div>
                  Menampilkan {pageRows.length} dari {sortedByOption.length} siswa
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
                    disabled={currentPage === 1}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Sebelumnya
                  </button>
                  <span>
                    {currentPage} / {pageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((value) => Math.min(pageCount, value + 1))}
                    disabled={currentPage === pageCount}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </TeacherDashboardLayout>
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className={`rounded-[20px] p-4 ${accent}`}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}
