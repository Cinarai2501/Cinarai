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
    debugEntries,
    usersLoading,
    comicsLoading,
    comicsError,
    progressLoading,
    progressError,
    activitiesLoading,
    activitiesError,
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
  const debugEntriesList = Array.isArray(debugEntries) ? debugEntries : [];
  const summaryLoading = usersLoading || comicsLoading || progressLoading;
  const summaryError = comicsError ?? progressError;
  const moduleLoading = comicsLoading || progressLoading;
  const moduleError = comicsError ?? progressError;
  const progressWidgetLoading = progressLoading;
  const progressWidgetError = progressError;
  const activityWidgetLoading = activitiesLoading;
  const activityWidgetError = activitiesError;

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

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 py-5 sm:px-6 lg:px-8">
        <GuruDashboardLayout header={<GuruHeader />} sidebar={<GuruSidebar />}>
          <div className="space-y-6">
            <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 shadow-sm shadow-rose-200/70">
              <p className="text-lg font-black text-rose-900">Gagal memuat data</p>
              <p className="mt-2 text-sm text-rose-700">{error}</p>
            </div>
          </div>
        </GuruDashboardLayout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-6 sm:px-6 lg:px-8">
      <GuruDashboardLayout header={<GuruHeader />} sidebar={<GuruSidebar />}>
        <div className="space-y-6 pb-10">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="rounded-[28px] border border-neutral-100 bg-white p-6 shadow-sm shadow-neutral-200/70">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-500">Ringkasan Kelas</p>
                    <h2 className="mt-1 text-2xl font-black text-neutral-900">Dashboard Guru yang responsif</h2>
                    <p className="mt-2 text-sm text-neutral-600">Pantau jumlah siswa, progress modul, dan aktivitas terbaru secara mobile-friendly.</p>
                  </div>
                  <div className="rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700">Realtime</div>
                </div>
              </div>

              <GuruQuickActions />

              <DashboardWidget
                loading={summaryLoading}
                error={summaryError}
                loadingLabel="Memuat ringkasan kelas…"
                errorLabel="Gagal memuat beberapa data ringkasan"
              >
                <GuruStatCards stats={statCards} />
              </DashboardWidget>
            </div>

            <div className="space-y-6">
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

          {process.env.NODE_ENV === 'development' && debugEntriesList.length > 0 ? (
            <div className="rounded-[28px] border border-dashed border-amber-200 bg-amber-50 p-4 shadow-sm shadow-amber-100/70">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">Guru Dashboard Debug</p>
                  <p className="mt-1 text-sm text-amber-800">Daftar collection Firestore yang di-query oleh dashboard guru.</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {debugEntriesList.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-amber-200 bg-white p-3 text-sm text-neutral-700">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${entry.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {entry.status === 'SUCCESS' ? '✓ berhasil' : '✗ gagal'}
                      </span>
                      <span className="font-semibold text-neutral-900">{entry.collection}</span>
                      <span className="text-neutral-500">{entry.path}</span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-neutral-600">
                      <div>where: {entry.where.length > 0 ? entry.where.map((clause) => `${clause.field} ${clause.op} ${String(clause.value)}`).join(', ') : '—'}</div>
                      <div>orderBy: {entry.orderBy.length > 0 ? entry.orderBy.map((clause) => `${clause.field} ${clause.direction}`).join(', ') : '—'}</div>
                      <div>limit: {entry.limit ?? '—'}</div>
                      <div>jumlah dokumen: {entry.documentCount ?? '—'}</div>
                      <div>durasi query: {entry.durationMs}ms</div>
                      <div>error code: {entry.errorCode ?? '—'}</div>
                      <div>error message: {entry.errorMessage ?? '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </GuruDashboardLayout>
    </div>
  );
}
