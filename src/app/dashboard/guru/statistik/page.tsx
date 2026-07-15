'use client';

import { useMemo, useState } from 'react';
import { GuruDashboardLayout } from '@/app/dashboard/guru/components/GuruDashboardLayout';
import { GuruHeader } from '@/app/dashboard/guru/components/GuruHeader';
import { GuruSidebar } from '@/app/dashboard/guru/components/GuruSidebar';
import { useActivityStatistics } from '@/app/dashboard/guru/hooks/useActivityStatistics';
import { useAIStatistics } from '@/app/dashboard/guru/hooks/useAIStatistics';
import { useLeaderboard } from '@/app/dashboard/guru/hooks/useLeaderboard';
import { useModuleStatistics } from '@/app/dashboard/guru/hooks/useModuleStatistics';
import { useProgressStatistics } from '@/app/dashboard/guru/hooks/useProgressStatistics';
import { useReflectionStatistics } from '@/app/dashboard/guru/hooks/useReflectionStatistics';
import { useScoreStatistics } from '@/app/dashboard/guru/hooks/useScoreStatistics';
import { useStatisticsOverview } from '@/app/dashboard/guru/hooks/useStatisticsOverview';
import type { StatisticsFilter, StatisticsDateRange } from '@/app/dashboard/guru/services/guru/statistics/overview';

const initialFilter: StatisticsFilter = {
  classId: 'all',
  moduleId: 'all',
  range: '30days',
};

const metricCards = [
  { label: 'Jumlah Siswa', key: 'totalStudents' },
  { label: 'Siswa Aktif', key: 'activeStudents' },
  { label: 'Rata-rata Progress', key: 'averageProgress' },
  { label: 'Rata-rata Skor', key: 'averageScore' },
  { label: 'Refleksi Dikirim', key: 'reflectionsSubmitted' },
  { label: 'Total AI Uses', key: 'totalAIUses' },
] as const;

function formatMetricValue(key: (typeof metricCards)[number]['key'], value: number) {
  if (key === 'averageProgress' || key === 'averageScore') {
    return `${value}%`;
  }
  return value.toString();
}

function DataLoadState({ loading, error }: { loading: boolean; error: string | null }) {
  if (error) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-800">
        Terjadi kesalahan saat memuat statistik: {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
        Memuat data statistik guru…
      </div>
    );
  }

  return null;
}

export default function GuruStatisticsPage() {
  const [filter, setFilter] = useState<StatisticsFilter>(initialFilter);
  const { overview, classOptions, moduleOptions, timeOptions, loading: overviewLoading, error: overviewError } =
    useStatisticsOverview(filter);
  const { progress, loading: progressLoading, error: progressError } = useProgressStatistics(filter.moduleId, filter.range);
  const { distribution, loading: scoreLoading, error: scoreError } = useScoreStatistics(filter.classId, filter.moduleId);
  const { modules, loading: moduleLoading, error: moduleError } = useModuleStatistics(filter.classId, filter.moduleId);
  const { trend, loading: activityLoading, error: activityError } = useActivityStatistics(filter.classId, filter.moduleId, filter.range);
  const { summary: reflectionSummary, loading: reflectionLoading, error: reflectionError } =
    useReflectionStatistics(filter.classId, filter.moduleId);
  const { summary: aiSummary, loading: aiLoading, error: aiError } = useAIStatistics(filter.classId, filter.moduleId);
  const { leaderboard, attention, loading: leaderboardLoading, error: leaderboardError } =
    useLeaderboard(filter.classId, filter.moduleId);

  const loading = useMemo(
    () =>
      overviewLoading ||
      progressLoading ||
      scoreLoading ||
      moduleLoading ||
      activityLoading ||
      reflectionLoading ||
      aiLoading ||
      leaderboardLoading,
    [overviewLoading, progressLoading, scoreLoading, moduleLoading, activityLoading, reflectionLoading, aiLoading, leaderboardLoading]
  );

  const error = overviewError ?? progressError ?? scoreError ?? moduleError ?? activityError ?? reflectionError ?? aiError ?? leaderboardError;

  const selectedModuleLabel = useMemo(
    () => moduleOptions.find((option) => option.id === filter.moduleId)?.label ?? 'Semua Modul',
    [filter.moduleId, moduleOptions]
  );

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-5 sm:px-6 lg:px-8">
      <GuruDashboardLayout header={<GuruHeader />} sidebar={<GuruSidebar />}>
        <div className="space-y-6">
          <div className="rounded-[28px] border border-neutral-100 bg-white p-6 shadow-sm shadow-neutral-200/70 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">Statistik Guru</p>
                <h1 className="mt-2 text-3xl font-black text-neutral-900">Pemantauan Kelas dan Kemajuan Siswa</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
                  Lihat kemajuan nasional kelas, analisis nilai, aktivitas, dan fokus perhatian berdasarkan data Firestore nyata.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <select
                  value={filter.classId}
                  onChange={(event) => setFilter((prev) => ({ ...prev, classId: event.target.value }))}
                  className="min-w-[160px] rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                >
                  <option value="all">Semua Kelas</option>
                  {classOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filter.moduleId}
                  onChange={(event) =>
                    setFilter((prev) => ({
                      ...prev,
                      moduleId: event.target.value === 'all' ? 'all' : Number(event.target.value),
                    }))
                  }
                  className="min-w-[160px] rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                >
                  <option value="all">Semua Modul</option>
                  {moduleOptions.map((option) => (
                    <option key={option.id} value={option.id === 'all' ? 'all' : option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filter.range}
                  onChange={(event) =>
                    setFilter((prev) => ({
                      ...prev,
                      range: event.target.value as StatisticsDateRange,
                    }))
                  }
                  className="min-w-[160px] rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                >
                  {timeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <DataLoadState loading={loading} error={error} />

          <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {overview &&
                metricCards.map((card) => (
                  <div key={card.key} className="rounded-[24px] border border-neutral-100 bg-white p-5 shadow-sm shadow-neutral-200/70">
                    <p className="text-sm font-semibold text-neutral-500">{card.label}</p>
                    <p className="mt-3 text-3xl font-black text-neutral-900">{formatMetricValue(card.key, overview[card.key])}</p>
                  </div>
                ))}
            </div>

            <section className="rounded-[28px] border border-neutral-100 bg-white p-5 shadow-sm shadow-neutral-200/70 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-secondary-500">Kondisi Cepat</p>
                  <h2 className="mt-1 text-xl font-black text-neutral-900">Ringkasan Modul</h2>
                </div>
                <span className="rounded-full bg-secondary-50 px-3 py-1 text-sm font-semibold text-secondary-700">
                  {selectedModuleLabel}
                </span>
              </div>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-sm text-neutral-500">Modul terpanas</p>
                  <p className="mt-2 text-lg font-black text-neutral-900">{selectedModuleLabel}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-neutral-50 p-4">
                    <p className="text-sm text-neutral-500">Skor rata-rata kelas</p>
                    <p className="mt-2 text-2xl font-black text-neutral-900">{overview ? `${overview.averageScore}%` : '—'}</p>
                  </div>
                  <div className="rounded-2xl bg-neutral-50 p-4">
                    <p className="text-sm text-neutral-500">Refleksi terkirim</p>
                    <p className="mt-2 text-2xl font-black text-neutral-900">{overview ? overview.reflectionsSubmitted : '—'}</p>
                  </div>
                </div>
              </div>
            </section>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[28px] border border-neutral-100 bg-white p-5 shadow-sm shadow-neutral-200/70 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-500">Blueprint</p>
                  <h2 className="mt-1 text-xl font-black text-neutral-900">Progress Tahapan</h2>
                </div>
                <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700">
                  {filter.range}
                </span>
              </div>
              <div className="mt-6 space-y-4">
                {progress.map((stage) => (
                  <div key={stage.stage} className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-semibold text-neutral-700">
                      <span>{stage.stage}</span>
                      <span>{stage.percentage}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-neutral-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500" style={{ width: `${stage.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <section className="rounded-[28px] border border-neutral-100 bg-white p-5 shadow-sm shadow-neutral-200/70 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-secondary-500">Distribusi</p>
                    <h2 className="mt-1 text-xl font-black text-neutral-900">Distribusi Nilai</h2>
                  </div>
                  <span className="rounded-full bg-secondary-50 px-3 py-1 text-sm font-semibold text-secondary-700">{filter.classId === 'all' ? 'Semua Kelas' : filter.classId}</span>
                </div>
                <div className="mt-6 space-y-3">
                  {distribution.map((bucket) => {
                    const maxCount = distribution.reduce((sum, item) => Math.max(sum, item.count), 0) || 1;
                    return (
                      <div key={bucket.label} className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-neutral-700">
                          <span>{bucket.label}</span>
                          <span className="font-semibold text-neutral-900">{bucket.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-neutral-100">
                          <div
                            className="h-full rounded-full bg-primary-500"
                            style={{ width: `${Math.round((bucket.count / maxCount) * 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-[28px] border border-neutral-100 bg-white p-5 shadow-sm shadow-neutral-200/70 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-500">Captures</p>
                    <h2 className="mt-1 text-xl font-black text-neutral-900">Ringkasan Modul</h2>
                  </div>
                  <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700">{modules.length} Modul</span>
                </div>
                <div className="mt-6 space-y-4">
                  {modules.slice(0, 4).map((module) => (
                    <div key={module.comicId} className="rounded-3xl border border-neutral-100 bg-neutral-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-neutral-700">{module.title}</p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {module.completedStudents} selesai · {module.notStartedStudents} belum mulai
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-neutral-700">
                          {module.averageProgress}%
                        </span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-neutral-200">
                        <div className="h-full rounded-full bg-secondary-500" style={{ width: `${module.averageProgress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.9fr_0.7fr]">
            <div className="rounded-[28px] border border-neutral-100 bg-white p-5 shadow-sm shadow-neutral-200/70 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-500">Aktivitas</p>
                  <h2 className="mt-1 text-xl font-black text-neutral-900">Trend Aktivitas</h2>
                </div>
                <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700">{filter.range}</span>
              </div>
              <div className="mt-6 space-y-3">
                {trend.map((point) => (
                  <div key={point.day} className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-neutral-700">
                      <span>{point.day}</span>
                      <span className="font-semibold text-neutral-900">{point.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-secondary-500 to-primary-500"
                        style={{ width: `${Math.min(100, point.count * 10)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <section className="rounded-[28px] border border-neutral-100 bg-white p-5 shadow-sm shadow-neutral-200/70 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-secondary-500">AI Tutor</p>
                    <h2 className="mt-1 text-xl font-black text-neutral-900">Pemakaian AI</h2>
                  </div>
                  <span className="rounded-full bg-secondary-50 px-3 py-1 text-sm font-semibold text-secondary-700">{aiSummary ? `${aiSummary.averagePerStudent}/siswa` : '—'}</span>
                </div>
                <div className="mt-6 grid gap-3">
                  <div className="rounded-3xl bg-neutral-50 p-4">
                    <p className="text-sm text-neutral-500">Total penggunaan AI</p>
                    <p className="mt-2 text-2xl font-black text-neutral-900">{aiSummary?.totalUses ?? '—'}</p>
                  </div>
                  <div className="grid gap-3 rounded-3xl bg-neutral-50 p-4">
                    <div>
                      <p className="text-sm text-neutral-500">Tahap paling sering</p>
                      <p className="mt-1 text-base font-semibold text-neutral-900">{aiSummary?.topStage ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">Modul paling aktif</p>
                      <p className="mt-1 text-base font-semibold text-neutral-900">{aiSummary?.topModule ?? '—'}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-neutral-100 bg-white p-5 shadow-sm shadow-neutral-200/70 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-secondary-500">Refleksi</p>
                    <h2 className="mt-1 text-xl font-black text-neutral-900">Ringkasan Refleksi</h2>
                  </div>
                  <span className="rounded-full bg-secondary-50 px-3 py-1 text-sm font-semibold text-secondary-700">{reflectionSummary ? `${reflectionSummary.rate}%` : '—'}</span>
                </div>
                <div className="mt-6 grid gap-3">
                  <div className="rounded-3xl bg-neutral-50 p-4">
                    <p className="text-sm text-neutral-500">Dijawab</p>
                    <p className="mt-2 text-2xl font-black text-neutral-900">{reflectionSummary?.totalSubmitted ?? '—'}</p>
                  </div>
                  <div className="grid gap-2 rounded-3xl bg-neutral-50 p-4">
                    <div className="flex items-center justify-between text-sm text-neutral-700">
                      <span>Pending</span>
                      <span>{reflectionSummary?.totalPending ?? '—'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-neutral-700">
                      <span>Positif</span>
                      <span>{reflectionSummary?.positive ?? '—'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-neutral-700">
                      <span>Negatif</span>
                      <span>{reflectionSummary?.negative ?? '—'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-neutral-700">
                      <span>Netral</span>
                      <span>{reflectionSummary?.neutral ?? '—'}</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.9fr_0.9fr]">
            <section className="rounded-[28px] border border-neutral-100 bg-white p-5 shadow-sm shadow-neutral-200/70 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-500">Papan Peringkat</p>
                  <h2 className="mt-1 text-xl font-black text-neutral-900">Leaderboard Siswa</h2>
                </div>
                <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700">Top 5</span>
              </div>
              <div className="mt-6 space-y-4">
                <div className="rounded-3xl bg-neutral-50 p-4">
                  <p className="text-sm text-neutral-500">Progress Terbaik</p>
                  <div className="mt-3 space-y-3">
                    {leaderboard?.topProgress.map((row) => (
                      <div key={row.userId} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-sm">
                        <div>
                          <p className="font-semibold text-neutral-900">{row.displayName}</p>
                          <p className="text-xs text-neutral-500">Skor {row.score}% · Konsistensi {row.consistency}</p>
                        </div>
                        <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700">{row.progress}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-3xl bg-neutral-50 p-4">
                  <p className="text-sm text-neutral-500">Skor Terbaik</p>
                  <div className="mt-3 space-y-3">
                    {leaderboard?.topScore.map((row) => (
                      <div key={row.userId} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-sm">
                        <div>
                          <p className="font-semibold text-neutral-900">{row.displayName}</p>
                          <p className="text-xs text-neutral-500">Progress {row.progress}% · Konsistensi {row.consistency}</p>
                        </div>
                        <span className="rounded-full bg-secondary-50 px-3 py-1 text-sm font-semibold text-secondary-700">{row.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-neutral-100 bg-white p-5 shadow-sm shadow-neutral-200/70 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-secondary-500">Perhatian</p>
                  <h2 className="mt-1 text-xl font-black text-neutral-900">Daftar Perhatian</h2>
                </div>
                <span className="rounded-full bg-secondary-50 px-3 py-1 text-sm font-semibold text-secondary-700">Cepat</span>
              </div>
              <div className="mt-6 grid gap-3">
                {attention ? (
                  ['inactive', 'lowProgress', 'notCompleted', 'noReflection'].map((key) => {
                    const list = attention[key as keyof typeof attention] ?? [];
                    const title =
                      key === 'inactive'
                        ? 'Belum Aktif'
                        : key === 'lowProgress'
                        ? 'Progress Rendah'
                        : key === 'notCompleted'
                        ? 'Belum Selesai'
                        : 'Belum Refleksi';
                    return (
                      <div key={key} className="rounded-3xl bg-neutral-50 p-4">
                        <p className="text-sm font-semibold text-neutral-700">{title}</p>
                        <div className="mt-3 space-y-2 text-sm text-neutral-600">
                          {list.length > 0 ? (
                            list.slice(0, 3).map((row) => (
                              <div key={row.userId} className="rounded-2xl bg-white px-3 py-2 shadow-sm">
                                <p className="font-semibold text-neutral-900">{row.displayName}</p>
                                <p className="text-xs text-neutral-500">{row.reason}</p>
                              </div>
                            ))
                          ) : (
                            <p className="rounded-2xl bg-white px-3 py-2 text-neutral-500">Tidak ada siswa dalam kategori ini.</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-3xl bg-neutral-50 p-4 text-sm text-neutral-500">Menunggu data perhatian siswa …</div>
                )}
              </div>
            </section>
          </section>
        </div>
      </GuruDashboardLayout>
    </div>
  );
}
