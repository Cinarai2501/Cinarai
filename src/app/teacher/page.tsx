'use client';

import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute';
import { firestore } from '@/lib/firebase/client';
import { getAllComics } from '@/lib/comicRepository';
import type { ActivityDocument, ComicProgressDocument, ReflectionDocument, UserDocument } from '@/types/firestore';
import {
  buildClassroomSummary,
  buildComicProgressSummary,
  buildCompletionStatusSummary,
  buildRecentActivities,
  buildStageProgressSummary,
  buildValueDistribution,
  type ClassroomSummary,
  type ComicProgressSummary,
  type CompletionStatusSummary,
  type RecentActivitySummary,
  type StageProgressSummary,
  type ValueBucketSummary,
} from './dashboardData';

import RobotMascot from '@/components/ai/RobotMascot';

const menuItems = [
  { href: '/teacher', icon: '📊', title: 'Dashboard', description: 'Ringkasan aktivitas mengajar' },
  { href: '/teacher', icon: '👥', title: 'Data Siswa', description: 'Daftar siswa dan kelas' },
  { href: '/teacher', icon: '📈', title: 'Progress', description: 'Perkembangan belajar siswa' },
  { href: '/teacher', icon: <RobotMascot variant="inline" />, title: 'Insight AI', description: 'Rekomendasi pembelajaran' },
  { href: '/teacher/report', icon: '📝', title: 'Laporan', description: 'Catatan dan evaluasi' },
  { href: '/teacher', icon: '⚙️', title: 'Pengaturan', description: 'Konfigurasi akun dan kelas' },
];

const pageSize = 5;

type StudentListItem = {
  id: string;
  name: string;
  email: string;
  progress: string;
  value: string;
  status: string;
};

function formatName(user: UserDocument): string {
  return user.displayName?.trim() || user.email?.split('@')[0] || 'Siswa';
}

function buildStudentList(users: UserDocument[]): StudentListItem[] {
  return users.map((user, index) => ({
    id: user.uid,
    name: formatName(user),
    email: user.email || '—',
    progress: `${Math.min(100, 10 + index * 8)}%`,
    value: `${Math.min(100, 70 + index * 3)}`,
    status: user.isActive ? 'Aktif' : 'Nonaktif',
  }));
}

export default function TeacherPage() {
  const { user, logout } = useAuth();
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [summary, setSummary] = useState<ClassroomSummary | null>(null);
  const [comicProgress, setComicProgress] = useState<ComicProgressSummary[]>([]);
  const [stageProgress, setStageProgress] = useState<StageProgressSummary[]>([]);
  const [valueDistribution, setValueDistribution] = useState<ValueBucketSummary[]>([]);
  const [completionStatuses, setCompletionStatuses] = useState<CompletionStatusSummary[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;

    const loadStudents = async () => {
      setLoading(true);
      setError(null);

      try {
        const [usersSnapshot, reflectionSnapshot, activitySnapshot] = await Promise.all([
          getDocs(collection(firestore, 'users')),
          getDocs(collection(firestore, 'reflection')),
          getDocs(collection(firestore, 'activity')),
        ]);

        if (!active) return;

        const users = usersSnapshot.docs
          .map((documentSnapshot) => ({ id: documentSnapshot.id, ...documentSnapshot.data() } as UserDocument));
        const studentUsers = users.filter((entry) => entry.role === 'student').sort((left, right) => {
          const leftName = left.displayName?.trim() || left.email || '';
          const rightName = right.displayName?.trim() || right.email || '';
          return leftName.localeCompare(rightName);
        });

        const progressByStudent = new Map<string, ComicProgressDocument[]>();
        const reflectionsByStudent = new Map<string, ReflectionDocument[]>();
        const usersById = new Map(users.map((entry) => [entry.uid, entry]));

        for (const student of studentUsers) {
          const studentProgressSnapshot = await getDocs(collection(firestore, 'users', student.uid, 'progress'));
          progressByStudent.set(
            student.uid,
            studentProgressSnapshot.docs.map((documentSnapshot) => ({
              id: documentSnapshot.id,
              ...documentSnapshot.data(),
            } as ComicProgressDocument))
          );
        }

        const reflections = reflectionSnapshot.docs
          .map((documentSnapshot) => ({ id: documentSnapshot.id, ...documentSnapshot.data() } as ReflectionDocument));
        for (const reflection of reflections) {
          const studentId = reflection.userId ?? reflection.studentId;
          if (!studentId) continue;
          const existing = reflectionsByStudent.get(studentId) ?? [];
          existing.push(reflection);
          reflectionsByStudent.set(studentId, existing);
        }

        const activityDocuments = activitySnapshot.docs
          .map((documentSnapshot) => ({ id: documentSnapshot.id, ...documentSnapshot.data() } as ActivityDocument));

        const comics = getAllComics();
        const comicIds = comics.map((comic) => comic.id);
        const nextSummary = buildClassroomSummary(users, progressByStudent, comicIds.length);
        const nextComicProgress = buildComicProgressSummary(progressByStudent, comicIds);
        const nextStageProgress = buildStageProgressSummary(progressByStudent);
        const nextValueDistribution = buildValueDistribution(users, progressByStudent, reflectionsByStudent);
        const nextCompletionStatuses = buildCompletionStatusSummary(progressByStudent);
        const nextRecentActivities = buildRecentActivities(activityDocuments, usersById);

        setStudents(buildStudentList(studentUsers));
        setSummary(nextSummary);
        setComicProgress(nextComicProgress);
        setStageProgress(nextStageProgress);
        setValueDistribution(nextValueDistribution);
        setCompletionStatuses(nextCompletionStatuses);
        setRecentActivities(nextRecentActivities);
        setPage(1);
      } catch (err) {
        if (!active) return;
        const message = err instanceof Error ? err.message : 'Gagal memuat data siswa.';
        setError(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadStudents();

    return () => {
      active = false;
    };
  }, [user?.uid]);

  const totalPages = Math.max(1, Math.ceil(students.length / pageSize));

  const visibleStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return students.slice(start, start + pageSize);
  }, [page, students]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Guru';

  return (
    <RoleProtectedRoute allowedRole="teacher">
      <div className="min-h-screen bg-[#f0f7ff] overflow-x-hidden">
        <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 pb-20 pt-safe overflow-hidden">
          <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -left-8 bottom-4 h-40 w-40 rounded-full bg-secondary-400/20" />
          <div className="pointer-events-none absolute right-8 bottom-8 h-20 w-20 rounded-full bg-accent-400/20" />

          <div className="relative mx-auto max-w-lg px-4 pt-10 sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary-200">Selamat datang</p>
                <h1 className="mt-0.5 text-2xl font-black text-white leading-tight truncate">
                  Halo, {firstName}! 👋
                </h1>
                <p className="mt-1 text-sm text-primary-100 leading-snug">
                  Dashboard guru sedang disiapkan dengan data siswa placeholder dari Firestore.
                </p>
              </div>
              <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl ring-4 ring-white/30 shadow-lg">
                  👩‍🏫
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white hover:bg-white/25 transition-colors"
                >
                  Keluar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="relative -mt-16 mx-auto max-w-lg px-4 pb-10 sm:px-6 space-y-4">
          <div className="rounded-3xl bg-white shadow-md overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-neutral-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Menu Utama</p>
              <h2 className="text-base font-black text-neutral-900">Panel Guru</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              {menuItems.map((item) => (
                <Link key={item.title} href={item.href} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4 transition-colors hover:border-primary-200 hover:bg-primary-50">
                  <div className="text-2xl">{item.icon}</div>
                  <p className="mt-2 text-sm font-black text-neutral-900">{item.title}</p>
                  <p className="mt-1 text-[11px] text-neutral-500 leading-snug">{item.description}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white shadow-md overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-neutral-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Ringkasan</p>
              <h2 className="text-base font-black text-neutral-900">Dashboard Guru</h2>
            </div>
            {!summary ? (
              <div className="p-4 text-sm text-neutral-500">Memuat ringkasan kelas...</div>
            ) : (
              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-primary-50 p-4">
                  <p className="text-sm font-black text-primary-700">Total Siswa</p>
                  <p className="mt-1 text-xl font-black text-neutral-900">{summary.totalStudents}</p>
                  <p className="mt-1 text-[11px] text-neutral-500 leading-snug">Jumlah siswa terdaftar.</p>
                </div>
                <div className="rounded-2xl bg-primary-50 p-4">
                  <p className="text-sm font-black text-primary-700">Total Guru</p>
                  <p className="mt-1 text-xl font-black text-neutral-900">{summary.totalTeachers}</p>
                  <p className="mt-1 text-[11px] text-neutral-500 leading-snug">Jumlah guru yang terdaftar.</p>
                </div>
                <div className="rounded-2xl bg-primary-50 p-4">
                  <p className="text-sm font-black text-primary-700">Siswa Aktif</p>
                  <p className="mt-1 text-xl font-black text-neutral-900">{summary.activeStudents}</p>
                  <p className="mt-1 text-[11px] text-neutral-500 leading-snug">Siswa dengan status aktif.</p>
                </div>
                <div className="rounded-2xl bg-primary-50 p-4">
                  <p className="text-sm font-black text-primary-700">Menyelesaikan 1+ Komik</p>
                  <p className="mt-1 text-xl font-black text-neutral-900">{summary.studentsWithAnyCompletedComic}</p>
                  <p className="mt-1 text-[11px] text-neutral-500 leading-snug">Siswa yang menyelesaikan minimal satu komik.</p>
                </div>
                <div className="rounded-2xl bg-primary-50 p-4 sm:col-span-2">
                  <p className="text-sm font-black text-primary-700">Menyelesaikan Semua Komik</p>
                  <p className="mt-1 text-xl font-black text-neutral-900">{summary.studentsCompletedAllComics}</p>
                  <p className="mt-1 text-[11px] text-neutral-500 leading-snug">Siswa yang mencapai semua komik yang tersedia.</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white shadow-md overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-neutral-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Progress Komik</p>
              <h2 className="text-base font-black text-neutral-900">Perkembangan tiap komik</h2>
            </div>
            <div className="space-y-3 p-4">
              {comicProgress.map((comic) => (
                <div key={comic.comicId} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-neutral-900">{comic.label}</p>
                    <p className="text-sm font-black text-primary-700">{comic.percentage}%</p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-primary-500" style={{ width: `${Math.max(4, comic.percentage)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white shadow-md overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-neutral-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Progress Stage CINARAI</p>
              <h2 className="text-base font-black text-neutral-900">Pencapaian tiap stage</h2>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              {stageProgress.map((stage) => (
                <div key={stage.stage} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-neutral-900">{stage.stage}</p>
                    <p className="text-sm font-black text-accent-700">{stage.percentage}%</p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-accent-500" style={{ width: `${Math.max(4, stage.percentage)}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-neutral-500">{stage.completedCount}/{stage.totalCount} progress</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white shadow-md overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-neutral-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Distribusi Nilai</p>
              <h2 className="text-base font-black text-neutral-900">Kelompok pencapaian siswa</h2>
            </div>
            <div className="space-y-3 p-4">
              {valueDistribution.map((bucket) => (
                <div key={bucket.label} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-neutral-900">{bucket.label}</p>
                    <p className="text-sm font-black text-neutral-700">{bucket.count} siswa</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white shadow-md overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-neutral-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Status Penyelesaian</p>
              <h2 className="text-base font-black text-neutral-900">Kondisi belajar siswa</h2>
            </div>
            <div className="space-y-3 p-4">
              {completionStatuses.map((status) => (
                <div key={status.label} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-neutral-900">{status.label}</p>
                      <p className="mt-1 text-xs text-neutral-500">{status.description}</p>
                    </div>
                    <p className="text-sm font-black text-primary-700">{status.count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white shadow-md overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-neutral-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Aktivitas Terakhir</p>
              <h2 className="text-base font-black text-neutral-900">10 aktivitas terbaru</h2>
            </div>
            <div className="space-y-3 p-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-3">
                  <p className="text-sm font-black text-neutral-900">{activity.studentName}</p>
                  <p className="mt-1 text-sm text-neutral-600">{activity.title}</p>
                  {activity.description ? <p className="mt-1 text-xs text-neutral-500">{activity.description}</p> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white shadow-md overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-neutral-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Daftar Siswa</p>
              <h2 className="text-base font-black text-neutral-900">Siswa Terdaftar</h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center px-5 py-8 text-sm text-neutral-500">
                Memuat data siswa...
              </div>
            ) : error ? (
              <div className="px-5 py-8 text-sm text-error-700">
                {error}
              </div>
            ) : students.length === 0 ? (
              <div className="px-5 py-8 text-sm text-neutral-500">
                Belum ada data siswa yang tersedia.
              </div>
            ) : (
              <>
                <div className="divide-y divide-neutral-100">
                  {visibleStudents.map((student) => (
                    <div key={student.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-black text-neutral-900">{student.name}</p>
                          <p className="mt-1 text-xs text-neutral-500 break-all">{student.email}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="rounded-full bg-accent-100 px-2.5 py-1 text-[10px] font-black text-accent-700">
                            {student.status}
                          </span>
                          <Link
                            href={`/teacher/${student.id}`}
                            className="rounded-full bg-primary-600 px-3 py-1.5 text-[11px] font-black text-white transition-colors hover:bg-primary-700"
                          >
                            Lihat Detail
                          </Link>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                        <div className="rounded-2xl bg-neutral-50 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-neutral-400">Progress</p>
                          <p className="mt-1 text-sm font-black text-neutral-900">{student.progress}</p>
                        </div>
                        <div className="rounded-2xl bg-neutral-50 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-neutral-400">Nilai</p>
                          <p className="mt-1 text-sm font-black text-neutral-900">{student.value}</p>
                        </div>
                        <div className="rounded-2xl bg-neutral-50 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-neutral-400">Nama</p>
                          <p className="mt-1 text-sm font-black text-neutral-900">{student.name}</p>
                        </div>
                        <div className="rounded-2xl bg-neutral-50 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-neutral-400">Email</p>
                          <p className="mt-1 text-sm font-black text-neutral-900 break-all">{student.email}</p>
                        </div>
                        <div className="rounded-2xl bg-neutral-50 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-neutral-400">Status</p>
                          <p className="mt-1 text-sm font-black text-neutral-900">{student.status}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-4 text-sm text-neutral-600">
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={page === 1}
                      className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-black disabled:opacity-50"
                    >
                      Sebelumnya
                    </button>
                    <span className="text-xs font-semibold">
                      Halaman {page} / {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      disabled={page === totalPages}
                      className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-black disabled:opacity-50"
                    >
                      Berikutnya
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </RoleProtectedRoute>
  );
}
