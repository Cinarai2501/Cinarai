'use client';

import { ReactNode, useMemo } from 'react';
import { useGuruDashboard } from '../hooks/useGuruDashboard';
import { GuruDashboardLayout } from './GuruDashboardLayout';
import { GuruHeader } from './GuruHeader';
import { GuruModuleCards } from './GuruModuleCards';
import { GuruProgressOverview } from './GuruProgressOverview';
import { GuruRecentActivity } from './GuruRecentActivity';
import { GuruSidebar } from './GuruSidebar';
import { GuruStatCards } from './GuruStatCards';
import { GuruQuickActions } from './GuruQuickActions';

function DashboardWidget({
  loading,
  error,
  loadingLabel,
  errorLabel,
  children,
}: {
  loading: boolean;
  error: string | null;
  loadingLabel: string;
  errorLabel: string;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <div className="rounded-[28px] border border-neutral-100 bg-white p-6 shadow-sm shadow-neutral-200/70">
        <p className="text-sm font-semibold text-neutral-600">{loadingLabel}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 shadow-sm shadow-rose-200/70">
        <p className="text-sm font-semibold text-rose-900">{errorLabel}</p>
        <p className="mt-2 text-sm text-rose-700">{error}</p>
      </div>
    );
  }

  return <>{children}</>;
}

export default function GuruDashboardContent() {
  const {
    summary,
    progressItems,
    modules,
    recentActivities,
    loading,
    error,
    usersLoading,
    comicsLoading,
    comicsError,
    progressLoading,
    progressError,
    activitiesLoading,
    activitiesError,
    totalUsers,
    allUserRoles,
    comicsCount,
    progressCount,
    activityCount,
    reflectionCount,
  } = useGuruDashboard();

  const statCards = useMemo(() => {
    if (!summary) return [];

    return [
      { title: 'Jumlah Siswa', value: `${summary.totalStudents}`, icon: 'people' as const, accent: 'bg-primary-50 text-primary-700' },
      { title: 'Siswa Aktif', value: `${summary.activeStudents}`, icon: 'school' as const, accent: 'bg-secondary-50 text-secondary-700' },
      { title: 'Modul Pembelajaran', value: `${summary.totalModules}`, icon: 'menuBook' as const, accent: 'bg-amber-50 text-amber-700' },
      { title: 'Rata-rata Progress', value: `${summary.averageProgress}%`, icon: 'trendingUp' as const, accent: 'bg-emerald-50 text-emerald-700' },
    ];
  }, [summary]);

  const guruProgressItems = progressItems;
  const guruModules = modules;
  const guruActivities = recentActivities;
  const summaryLoading = usersLoading || comicsLoading || progressLoading;
  const summaryError = comicsError ?? progressError;
  const moduleLoading = comicsLoading || progressLoading;
  const moduleError = comicsError ?? progressError;
  const progressWidgetLoading = progressLoading;
  const progressWidgetError = progressError;
  const activityWidgetLoading = activitiesLoading;
  const activityWidgetError = activitiesError;
  const hasDashboardData = Boolean(
    summary?.totalStudents ||
    guruModules.length ||
    guruActivities.length ||
    guruProgressItems.length
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 py-5 sm:px-6 lg:px-8">
        <GuruDashboardLayout header={<GuruHeader />} sidebar={<GuruSidebar />}>
          <div className="space-y-6">
            <div className="rounded-[28px] border border-neutral-100 bg-white p-5 shadow-sm shadow-neutral-200/70">
              <p className="text-lg font-black text-neutral-900">Memuat data Dashboard Guru…</p>
              <p className="mt-2 text-sm text-neutral-600">Menyiapkan statistik kelas dan aktivitas siswa secara realtime.</p>
            </div>
          </div>
        </GuruDashboardLayout>
      </div>
    );
  }

  const hasCriticalError = Boolean(error && (error.includes('bukan akun guru') || error.includes('Sesi') || error.includes('Unauthorized')));

  if (error && hasCriticalError) {
    const isRoleError = error.includes('bukan akun guru');
    const isSesiError = error.includes('Sesi');

    return (
      <div className="min-h-screen bg-neutral-50 px-4 py-5 sm:px-6 lg:px-8">
        <GuruDashboardLayout header={<GuruHeader />} sidebar={<GuruSidebar />}>
          <div className="space-y-6">
            <div className={`rounded-[28px] border p-5 shadow-sm ${isRoleError ? 'border-amber-200 bg-amber-50 shadow-amber-200/70' : 'border-rose-200 bg-rose-50 shadow-rose-200/70'}`}>
              <p className={`text-lg font-black ${isRoleError ? 'text-amber-900' : 'text-rose-900'}`}>
                {isRoleError ? 'Akses Ditolak' : isSesiError ? 'Sesi Berakhir' : 'Gagal Memuat Dashboard'}
              </p>
              <p className={`mt-2 text-sm ${isRoleError ? 'text-amber-700' : 'text-rose-700'}`}>
                {isRoleError
                  ? 'Akun Anda bukan akun guru. Hubungi administrator untuk mengaktifkan akses guru.'
                  : isSesiError
                    ? 'Sesi Anda telah berakhir. Silakan masuk kembali untuk melanjutkan.'
                    : error}
              </p>
              {!isRoleError && !isSesiError && (
                <p className="mt-3 text-xs text-neutral-500">
                  <strong>Detail:</strong> {error}
                </p>
              )}
            </div>
          </div>
        </GuruDashboardLayout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-3 py-3 sm:px-4 lg:px-6">
      <GuruDashboardLayout header={<GuruHeader />} sidebar={<GuruSidebar />}>
        <div className="space-y-4 pb-10">
          {error ? (
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Sebagian data dashboard tidak dapat dimuat. Widget lain tetap ditampilkan dengan state kosong.
            </div>
          ) : null}
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-neutral-100 bg-white p-2 shadow-sm shadow-neutral-200/20 transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-500">Ringkasan</p>
                    <h2 className="mt-0.5 text-base font-extrabold text-neutral-900">Dashboard Guru</h2>
                  </div>
                  <div className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">Realtime</div>
                </div>
              </div>

              <GuruQuickActions />

              {process.env.NODE_ENV === 'development' ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Debug Firestore Realtime</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white p-3 shadow-sm shadow-slate-100">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Total pengguna</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{totalUsers}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3 shadow-sm shadow-slate-100">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Siswa (role filter)</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{summary?.totalStudents ?? 0}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3 shadow-sm shadow-slate-100">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Modul</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{comicsCount}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3 shadow-sm shadow-slate-100">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Progress docs</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{progressCount}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3 shadow-sm shadow-slate-100">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Aktivitas</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{activityCount}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3 shadow-sm shadow-slate-100">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Refleksi</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{reflectionCount}</p>
                    </div>
                  </div>
                  {Object.keys(allUserRoles).length ? (
                    <div className="mt-3 rounded-2xl bg-white p-3 text-xs text-slate-600 shadow-sm shadow-slate-100">
                      <p className="font-semibold text-slate-800">Role breakdown</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(allUserRoles).map(([role, count]) => (
                          <span key={role} className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">
                            {role}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {hasDashboardData ? (
                <DashboardWidget
                  loading={summaryLoading}
                  error={summaryError}
                  loadingLabel="Memuat ringkasan kelas…"
                  errorLabel="Gagal memuat beberapa data ringkasan"
                >
                  <GuruStatCards stats={statCards} />
                </DashboardWidget>
              ) : (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-600">
                  <p className="font-semibold text-neutral-900">Dashboard belum menampilkan data kelas.</p>
                  <p className="mt-2">Tambahkan siswa atau mulai progress dan aktivitas untuk melihat statistik kelas secara realtime.</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <DashboardWidget
                loading={progressWidgetLoading}
                error={progressWidgetError}
                loadingLabel="Memuat progress pembelajaran…"
                errorLabel="Gagal memuat progress siswa"
              >
                <GuruProgressOverview items={guruProgressItems} />
              </DashboardWidget>

              <DashboardWidget
                loading={moduleLoading}
                error={moduleError}
                loadingLabel="Memuat modul pembelajaran…"
                errorLabel="Gagal memuat daftar modul"
              >
                <GuruModuleCards modules={guruModules} />
              </DashboardWidget>

              <DashboardWidget
                loading={activityWidgetLoading}
                error={activityWidgetError}
                loadingLabel="Memuat aktivitas terbaru…"
                errorLabel="Gagal memuat aktivitas siswa"
              >
                <GuruRecentActivity activities={guruActivities} />
              </DashboardWidget>
            </div>
          </div>

        </div>
      </GuruDashboardLayout>
    </div>
  );
}
