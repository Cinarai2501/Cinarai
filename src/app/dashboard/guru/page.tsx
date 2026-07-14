'use client';

import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute';
import { firestore } from '@/lib/firebase/client';
import { getAllComics } from '@/lib/comicRepository';
import type { ActivityDocument, ComicProgressDocument, UserDocument } from '@/types/firestore';
import {
  buildClassroomSummary,
  buildComicProgressSummary,
  buildRecentActivities,
  buildStageProgressSummary,
  type ClassroomSummary,
  type ComicProgressSummary,
  type RecentActivitySummary,
  type StageProgressSummary,
} from '@/app/teacher/dashboardData';
import RobotMascot from '@/components/ai/RobotMascot';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat Pagi ☀️';
  if (h < 15) return 'Selamat Siang 🌤️';
  if (h < 18) return 'Selamat Sore 🌅';
  return 'Selamat Malam 🌙';
}

// ─── AI Insight generator (lokal, tanpa API call) ────────────────────────────

function generateAiInsight(summary: ClassroomSummary, comicProgress: ComicProgressSummary[]): string {
  if (!summary.totalStudents) return 'Belum ada data siswa. Ajak siswa untuk mendaftar dan mulai belajar!';

  const activeRate = summary.totalStudents > 0
    ? Math.round((summary.activeStudents / summary.totalStudents) * 100)
    : 0;

  const avgComicProgress = comicProgress.length
    ? Math.round(comicProgress.reduce((s, c) => s + c.percentage, 0) / comicProgress.length)
    : 0;

  if (avgComicProgress >= 70) {
    return `Kelas berjalan sangat baik! ${activeRate}% siswa aktif dan rata-rata progress komik mencapai ${avgComicProgress}%. Pertahankan momentum ini dengan memberikan tantangan tambahan.`;
  }
  if (avgComicProgress >= 40) {
    return `Progress kelas cukup baik (${avgComicProgress}%). ${summary.studentsWithAnyCompletedComic} siswa sudah menyelesaikan minimal satu komik. Dorong siswa yang masih di bawah 50% untuk lebih aktif.`;
  }
  return `Progress kelas masih ${avgComicProgress}%. Sebaiknya adakan sesi motivasi atau bimbingan tambahan untuk ${summary.totalStudents - summary.activeStudents} siswa yang belum aktif.`;
}

// ─── Main content ─────────────────────────────────────────────────────────────

function TeacherDashboardContent() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState<ClassroomSummary | null>(null);
  const [comicProgress, setComicProgress] = useState<ComicProgressSummary[]>([]);
  const [stageProgress, setStageProgress] = useState<StageProgressSummary[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [usersSnap, activitySnap] = await Promise.all([
          getDocs(collection(firestore, 'users')),
          getDocs(collection(firestore, 'activity')),
        ]);

        if (!active) return;

        const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserDocument));
        const studentUsers = users.filter(u => u.role === 'student');

        const progressByStudent = new Map<string, ComicProgressDocument[]>();
        await Promise.all(
          studentUsers.map(async (student) => {
            const snap = await getDocs(collection(firestore, 'users', student.uid, 'progress'));
            progressByStudent.set(
              student.uid,
              snap.docs.map(d => ({ id: d.id, ...d.data() } as ComicProgressDocument))
            );
          })
        );

        if (!active) return;

        const usersById = new Map(users.map(u => [u.uid, u]));
        const activityDocs = activitySnap.docs.map(d => ({ id: d.id, ...d.data() } as ActivityDocument));
        const comics = getAllComics();
        const comicIds = comics.map(c => c.id);

        setSummary(buildClassroomSummary(users, progressByStudent, comicIds.length));
        setComicProgress(buildComicProgressSummary(progressByStudent, comicIds));
        setStageProgress(buildStageProgressSummary(progressByStudent));
        setRecentActivities(buildRecentActivities(activityDocs, usersById));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat data.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, [user?.uid]);

  const aiInsight = useMemo(
    () => summary ? generateAiInsight(summary, comicProgress) : null,
    [summary, comicProgress]
  );

  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Guru';
  const greeting = getGreeting();

  const handleLogout = async () => {
    try { await logout(); } catch (e) { console.error('Logout error:', e); }
  };

  return (
    <div className="min-h-screen bg-[#f0f7ff] overflow-x-hidden">

      {/* ── Header ── */}
      <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 pb-20 pt-safe overflow-hidden">
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -left-8 bottom-4 h-40 w-40 rounded-full bg-secondary-400/20" />

        <div className="relative mx-auto max-w-2xl px-4 pt-10 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary-200">{greeting}</p>
              <h1 className="mt-0.5 text-2xl font-black text-white leading-tight truncate">
                Halo, {firstName}! 👩‍🏫
              </h1>
              <p className="mt-1 text-sm text-primary-100 leading-snug">
                Panel Guru CINARAI — pantau perkembangan kelas Anda
              </p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white">
                👩‍🏫 Guru
              </span>
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

      {/* ── Content ── */}
      <div className="relative -mt-16 mx-auto max-w-2xl px-4 pb-10 sm:px-6 space-y-4">

        {error && (
          <div className="rounded-2xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
            ⚠️ {error}
          </div>
        )}

        {/* ── Tombol Aksi Cepat ── */}
        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/teacher"
            className="flex flex-col items-center gap-2 rounded-2xl bg-white px-3 py-4 shadow-sm border border-neutral-100 hover:border-primary-200 hover:bg-primary-50 transition-colors text-center"
          >
            <span className="text-2xl">👥</span>
            <span className="text-xs font-black text-neutral-700">Kelola Kelas</span>
          </Link>
          <Link
            href="/teacher/report"
            className="flex flex-col items-center gap-2 rounded-2xl bg-white px-3 py-4 shadow-sm border border-neutral-100 hover:border-primary-200 hover:bg-primary-50 transition-colors text-center"
          >
            <span className="text-2xl">📝</span>
            <span className="text-xs font-black text-neutral-700">Lihat Laporan</span>
          </Link>
          <Link
            href="/teacher"
            className="flex flex-col items-center gap-2 rounded-2xl bg-white px-3 py-4 shadow-sm border border-neutral-100 hover:border-primary-200 hover:bg-primary-50 transition-colors text-center"
          >
            <RobotMascot variant="inline" />
            <span className="text-xs font-black text-neutral-700">Analisis AI</span>
          </Link>
        </div>

        {/* ── Statistik Kelas ── */}
        {loading ? (
          <StatsSkeleton />
        ) : summary ? (
          <div className="rounded-3xl bg-white shadow-md overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-neutral-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Ringkasan Kelas</p>
              <h2 className="text-base font-black text-neutral-900">Statistik Siswa 📊</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              <StatCard
                emoji="👥"
                label="Total Siswa"
                value={`${summary.totalStudents}`}
                color="bg-primary-50"
                textColor="text-primary-700"
              />
              <StatCard
                emoji="✅"
                label="Siswa Aktif"
                value={`${summary.activeStudents}`}
                color="bg-accent-50"
                textColor="text-accent-700"
              />
              <StatCard
                emoji="📚"
                label="Selesai 1+ Komik"
                value={`${summary.studentsWithAnyCompletedComic}`}
                color="bg-secondary-50"
                textColor="text-secondary-700"
              />
              <StatCard
                emoji="🏆"
                label="Selesai Semua"
                value={`${summary.studentsCompletedAllComics}`}
                color="bg-warning-50"
                textColor="text-warning-700"
              />
            </div>
          </div>
        ) : null}

        {/* ── Progress Kelas per Komik ── */}
        {!loading && comicProgress.length > 0 && (
          <div className="rounded-3xl bg-white shadow-md overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-neutral-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Progress Kelas</p>
              <h2 className="text-base font-black text-neutral-900">Rata-rata per Komik 📈</h2>
            </div>
            <div className="space-y-3 p-4">
              {comicProgress.map((comic) => (
                <div key={comic.comicId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-neutral-700">{comic.label}</span>
                    <span className="text-sm font-black text-primary-600">{comic.percentage}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className="h-2.5 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-500"
                      style={{ width: `${Math.max(2, comic.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Progress Stage CINARAI ── */}
        {!loading && stageProgress.length > 0 && (
          <div className="rounded-3xl bg-white shadow-md overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-neutral-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Tahapan CINARAI</p>
              <h2 className="text-base font-black text-neutral-900">Pencapaian per Stage 🎯</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              {stageProgress.map((stage) => (
                <div key={stage.stage} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-3">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-black text-neutral-700 truncate">{stage.stage}</span>
                    <span className="text-xs font-black text-accent-600 flex-shrink-0">{stage.percentage}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white overflow-hidden">
                    <div
                      className="h-1.5 rounded-full bg-accent-500"
                      style={{ width: `${Math.max(2, stage.percentage)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-neutral-400">{stage.completedCount}/{stage.totalCount}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Insight AI Kelas ── */}
        {!loading && aiInsight && (
          <div className="rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 px-5 py-5 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <RobotMascot variant="inline" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary-200">Insight AI Kelas</p>
            </div>
            <p className="text-sm font-semibold text-white leading-relaxed">{aiInsight}</p>
            <Link
              href="/teacher"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-xs font-black text-white hover:bg-white/30 transition-colors"
            >
              <RobotMascot variant="inline" /> Analisis Lebih Lanjut →
            </Link>
          </div>
        )}

        {/* ── Aktivitas Siswa Terbaru ── */}
        <div className="rounded-3xl bg-white shadow-md overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-neutral-100">
            <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Aktivitas Terbaru</p>
            <h2 className="text-base font-black text-neutral-900">Aktivitas Siswa 🕐</h2>
          </div>
          {loading ? (
            <div className="px-5 py-6 text-sm text-neutral-400 text-center">Memuat aktivitas...</div>
          ) : recentActivities.length === 0 ? (
            <div className="px-5 py-6 text-sm text-neutral-400 text-center">
              Belum ada aktivitas siswa yang tercatat.
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {recentActivities.map((activity) => (
                <li key={activity.id} className="px-5 py-3 flex items-start gap-3">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm">
                    📖
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-neutral-900 truncate">{activity.studentName}</p>
                    <p className="text-xs text-neutral-500 leading-snug">{activity.title}</p>
                    {activity.description && (
                      <p className="text-[11px] text-neutral-400 leading-snug mt-0.5">{activity.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="px-5 py-3 border-t border-neutral-100">
            <Link
              href="/teacher"
              className="text-sm font-black text-primary-600 hover:text-primary-700"
            >
              Lihat semua aktivitas →
            </Link>
          </div>
        </div>

        {/* ── Link ke Panel Guru Lengkap ── */}
        <Link
          href="/teacher"
          className="flex w-full items-center justify-center gap-2 rounded-3xl bg-primary-600 px-5 py-4 text-base font-black text-white shadow-md hover:bg-primary-700 active:scale-[0.98] transition-all"
        >
          👥 Buka Panel Guru Lengkap
        </Link>

      </div>
    </div>
  );
}

export default function DashboardGuruPage() {
  return (
    <RoleProtectedRoute allowedRole="teacher">
      <TeacherDashboardContent />
    </RoleProtectedRoute>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ emoji, label, value, color, textColor }: {
  emoji: string; label: string; value: string; color: string; textColor: string;
}) {
  return (
    <div className={`rounded-2xl ${color} px-4 py-3 flex items-center gap-3`}>
      <span className="text-2xl flex-shrink-0">{emoji}</span>
      <div className="min-w-0">
        <p className={`text-lg font-black ${textColor} leading-tight`}>{value}</p>
        <p className="text-[11px] text-neutral-500 leading-tight">{label}</p>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="rounded-3xl bg-white shadow-md p-4 grid grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-16 rounded-2xl bg-neutral-100 animate-pulse" />
      ))}
    </div>
  );
}
