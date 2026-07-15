'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { getAllComics } from '@/lib/comicRepository';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import type { ActivityDocument, ComicProgressDocument, ReflectionDocument, UserDocument } from '@/types/firestore';
import {
  escapeCsvValue,
  filterReportRows,
  formatReportDate,
  summarizeReportRows,
  type GuruReportFilters,
  type GuruReportRow,
} from './reportData';

const defaultFilters: GuruReportFilters = {
  comicId: null,
  studentId: null,
  date: null,
};

export default function GuruReportClient() {
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<GuruReportRow[]>([]);
  const [filters, setFilters] = useState<GuruReportFilters>(defaultFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const comics = useMemo(() => getAllComics(), []);
  const comicMap = useMemo(() => new Map(comics.map((comic) => [comic.id, comic])), [comics]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setIsLoading(false);
      return;
    }

    let active = true;

    const loadReportData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [studentsSnapshot, reflectionSnapshot, activitySnapshot] = await Promise.all([
          getDocs(collection(firestore, 'users')),
          getDocs(collection(firestore, 'reflection')),
          getDocs(collection(firestore, 'activity')),
        ]);

        if (!active) return;

        const students = studentsSnapshot.docs
          .map((documentSnapshot) => ({ id: documentSnapshot.id, ...documentSnapshot.data() } as UserDocument))
          .filter((student) => student.role === 'student');

        const reflections = reflectionSnapshot.docs
          .map((documentSnapshot) => ({ id: documentSnapshot.id, ...documentSnapshot.data() } as ReflectionDocument));

        const activities = activitySnapshot.docs
          .map((documentSnapshot) => ({ id: documentSnapshot.id, ...documentSnapshot.data() } as ActivityDocument));

        const progressSnapshots = await Promise.all(
          students.map((student) => getDocs(collection(firestore, 'users', student.uid, 'progress')))
        );

        const guruRows: GuruReportRow[] = students.flatMap((student, index) => {
          const progressDocuments = progressSnapshots[index]?.docs
            .map((documentSnapshot) => ({ id: documentSnapshot.id, ...documentSnapshot.data() } as ComicProgressDocument))
            .filter((document) => typeof document.comicId === 'number');

          return (progressDocuments ?? []).map((document) => {
            const comic = comicMap.get(document.comicId);
            const latestActivity = activities
              .filter((activity) => activity.userId === student.uid)
              .sort((left, right) => {
                const leftTime = left.occurredAt instanceof Date ? left.occurredAt.getTime() : 0;
                const rightTime = right.occurredAt instanceof Date ? right.occurredAt.getTime() : 0;
                return rightTime - leftTime;
              })[0];
            const latestReflection = reflections
              .filter((reflection) => reflection.userId === student.uid || reflection.studentId === student.uid)
              .sort((left, right) => {
                const leftTime = left.submittedAt instanceof Date ? left.submittedAt.getTime() : 0;
                const rightTime = right.submittedAt instanceof Date ? right.submittedAt.getTime() : 0;
                return rightTime - leftTime;
              })[0];

            return {
              studentId: student.uid,
              studentName: student.displayName?.trim() || student.email?.split('@')[0] || 'Siswa',
              studentEmail: student.email || '—',
              comicId: document.comicId,
              comicTitle: comic?.title ?? `Komik ${document.comicId}`,
              progress: Math.round(document.percentage ?? 0),
              value: Math.round((latestReflection?.rating ?? 0) * 20),
              status: document.status === 'completed' ? 'completed' : document.percentage && document.percentage >= 60 ? 'in_progress' : 'not_started',
              updatedAt: latestActivity?.occurredAt ?? latestReflection?.submittedAt ?? document.updatedAt,
            };
          });
        });

        setRows(guruRows);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat laporan guru.');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadReportData();

    return () => {
      active = false;
    };
  }, [comicMap, loading, user]);

  const filteredRows = useMemo(() => filterReportRows(rows, filters), [filters, rows]);
  const summary = useMemo(() => summarizeReportRows(filteredRows), [filteredRows]);

  const handleExportCsv = () => {
    const header = ['Nama Siswa', 'Email', 'Komik', 'Progress', 'Nilai', 'Status', 'Terakhir Diupdate'];
    const csvRows = filteredRows.map((row) => [
      escapeCsvValue(row.studentName),
      escapeCsvValue(row.studentEmail),
      escapeCsvValue(row.comicTitle),
      escapeCsvValue(row.progress),
      escapeCsvValue(row.value),
      escapeCsvValue(row.status),
      escapeCsvValue(formatReportDate(row.updatedAt)),
    ]);

    const csvContent = [header, ...csvRows].map((line) => line.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'laporan-guru.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const content = [
      'Laporan Guru CINARAI',
      `Total siswa: ${summary.totalStudents}`,
      `Total komik: ${summary.totalComics}`,
      `Rata-rata progress: ${summary.averageProgress}%`,
      `Rata-rata nilai: ${summary.averageValue}`,
      '',
      ...filteredRows.map((row) => `${row.studentName} | ${row.comicTitle} | ${row.progress}% | ${row.value} | ${row.status}`),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'laporan-guru.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const studentOptions = useMemo(() => {
    return Array.from(new Map(rows.map((row) => [row.studentId, row.studentName])).entries()).map(([studentId, studentName]) => ({
      value: studentId,
      label: studentName,
    }));
  }, [rows]);

  const dateOptions = useMemo(() => {
    return Array.from(new Set(rows.map((row) => formatReportDate(row.updatedAt)))).filter(Boolean).sort();
  }, [rows]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[#f0f7ff] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[32px] bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-black text-neutral-900">Mengumpulkan data laporan...</p>
          <p className="mt-2 text-sm text-neutral-500">Sedang membaca progress dan refleksi siswa dari Firestore.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f0f7ff] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[32px] bg-white p-8 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-primary-600">Laporan Guru</p>
          <h1 className="mt-2 text-2xl font-black text-neutral-900">Tidak dapat memuat laporan</h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">{error}</p>
          <Link href="/dashboard/guru" className="mt-6 inline-flex rounded-2xl bg-primary-600 px-4 py-3 text-sm font-black text-white">
            Kembali ke dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <RoleProtectedRoute allowedRole="teacher">
      <div className="min-h-screen bg-[#f0f7ff] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <div className="rounded-[32px] bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 px-6 py-8 text-white shadow-lg sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.3em] text-primary-100">Laporan Guru</p>
                <h1 className="mt-2 text-3xl font-black sm:text-4xl">Ringkasan capaian siswa</h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-primary-100 sm:text-base">
                  Pantau progres, nilai, dan aktivitas siswa dari data Firestore yang sudah terkumpul.
                </p>
              </div>
              <Link href="/dashboard/guru" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                ← Dashboard Guru
              </Link>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[28px] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-primary-600">Rekap</p>
                  <h2 className="text-xl font-black text-neutral-900">Ringkasan kelas</h2>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-primary-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-600">Total siswa</p>
                  <p className="mt-2 text-2xl font-black text-neutral-900">{summary.totalStudents}</p>
                </div>
                <div className="rounded-2xl bg-accent-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-accent-700">Komik terpantau</p>
                  <p className="mt-2 text-2xl font-black text-neutral-900">{summary.totalComics}</p>
                </div>
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">Rata-rata progress</p>
                  <p className="mt-2 text-2xl font-black text-neutral-900">{summary.averageProgress}%</p>
                </div>
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">Rata-rata nilai</p>
                  <p className="mt-2 text-2xl font-black text-neutral-900">{summary.averageValue}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-primary-600">Ekspor</p>
                  <h2 className="text-xl font-black text-neutral-900">Unduh hasil</h2>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={handleExportCsv} className="rounded-2xl bg-primary-600 px-4 py-3 text-sm font-black text-white">
                  Export CSV
                </button>
                <button type="button" onClick={handleExportPdf} className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-black text-neutral-700">
                  Export TXT
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-sm">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm font-semibold text-neutral-700">
                <span>Filter komik</span>
                <select
                  value={filters.comicId ?? ''}
                  onChange={(event) => setFilters((current) => ({ ...current, comicId: event.target.value ? Number(event.target.value) : null }))}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm"
                >
                  <option value="">Semua komik</option>
                  {comics.map((comic) => (
                    <option key={comic.id} value={comic.id}>{comic.title}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-neutral-700">
                <span>Filter siswa</span>
                <select
                  value={filters.studentId ?? ''}
                  onChange={(event) => setFilters((current) => ({ ...current, studentId: event.target.value || null }))}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm"
                >
                  <option value="">Semua siswa</option>
                  {studentOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-neutral-700">
                <span>Filter tanggal</span>
                <select
                  value={filters.date ?? ''}
                  onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value || null }))}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm"
                >
                  <option value="">Semua tanggal</option>
                  {dateOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" onClick={() => setFilters(defaultFilters)} className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700">
                Reset filter
              </button>
              <p className="text-sm text-neutral-500">{filteredRows.length} entri ditampilkan</p>
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-primary-600">Daftar</p>
                <h2 className="text-xl font-black text-neutral-900">Progress siswa per komik</h2>
              </div>
            </div>
            {filteredRows.length === 0 ? (
              <div className="mt-4 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-500">Tidak ada data sesuai filter saat ini.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {filteredRows.map((row) => (
                  <div key={`${row.studentId}-${row.comicId}`} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-black text-neutral-900">{row.studentName}</p>
                        <p className="mt-1 text-xs text-neutral-500">{row.studentEmail}</p>
                      </div>
                      <div className="rounded-full bg-white px-3 py-1 text-xs font-black text-primary-700">{row.comicTitle}</div>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-4">
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-[10px] uppercase tracking-wide text-neutral-400">Progress</p>
                        <p className="mt-1 text-sm font-black text-neutral-900">{row.progress}%</p>
                      </div>
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-[10px] uppercase tracking-wide text-neutral-400">Nilai</p>
                        <p className="mt-1 text-sm font-black text-neutral-900">{row.value}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-[10px] uppercase tracking-wide text-neutral-400">Status</p>
                        <p className="mt-1 text-sm font-black text-neutral-900">{row.status}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-[10px] uppercase tracking-wide text-neutral-400">Terakhir update</p>
                        <p className="mt-1 text-sm font-black text-neutral-900">{formatReportDate(row.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleProtectedRoute>
  );
}
