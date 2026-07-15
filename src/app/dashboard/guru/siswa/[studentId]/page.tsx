'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { TeacherDashboardLayout } from '../../components/TeacherDashboardLayout';
import { TeacherHeader } from '../../components/TeacherHeader';
import { TeacherSidebar } from '../../components/TeacherSidebar';
import { useStudentDetail } from '../../hooks/useStudentDetail';
import { formatFirestoreDate } from '@/app/teacher/studentDetail.utils';

const stageLabelMap: Record<string, string> = {
  Cover: 'Cover',
  Contextualization: 'Contextualization',
  Identification: 'Identification',
  Navigation: 'Navigation + AR',
  Argumentation: 'Argumentation',
  Resolution: 'Resolution',
  Application: 'Application',
  Introspection: 'Introspection',
};

function stageStatusClass(status: string) {
  switch (status) {
    case 'Selesai':
      return 'bg-emerald-50 text-emerald-700';
    case 'Sedang Berjalan':
      return 'bg-sky-50 text-sky-700';
    default:
      return 'bg-neutral-100 text-neutral-700';
  }
}

function progressPillClass(value: number) {
  if (value >= 90) return 'bg-emerald-100 text-emerald-800';
  if (value >= 70) return 'bg-primary-100 text-primary-800';
  if (value >= 40) return 'bg-amber-100 text-amber-800';
  return 'bg-rose-100 text-rose-800';
}

export default function StudentDetailPage() {
  const params = useParams<{ studentId?: string | string[] }>();
  const studentId = Array.isArray(params.studentId) ? params.studentId[0] : params.studentId;
  const {
    profile,
    progressDocuments,
    progressByStage,
    overallProgress,
    averageScore,
    completedModules,
    learningDuration,
    timeline,
    reflectionSummary,
    aiTutorSummary,
    loading,
    error,
  } = useStudentDetail(studentId);

  const displayName = profile?.displayName?.trim() || profile?.email?.split('@')[0] || 'Siswa';
  const lastActivity = timeline[0];
  const lastActivityText = lastActivity?.title ?? 'Belum ada aktivitas terbaru';
  const lastActivityAt = lastActivity?.occurredAt ? formatFirestoreDate(lastActivity.occurredAt) : '—';
  const roleLabel = profile?.role === 'teacher' ? 'Guru' : 'Siswa';

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-4 sm:px-6 lg:px-8">
      <TeacherDashboardLayout header={<TeacherHeader />} sidebar={<TeacherSidebar />}>
        <div className="space-y-6">
          <div className="rounded-[28px] border border-neutral-100 bg-white p-6 shadow-sm shadow-neutral-200/70">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-500">Detail Siswa</p>
                <h1 className="mt-2 text-3xl font-black text-neutral-900">{displayName}</h1>
                <p className="mt-2 text-sm text-neutral-600">ID siswa: {studentId ?? 'Tidak tersedia'}</p>
              </div>
              <Link
                href="/dashboard/guru/siswa"
                className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                ← Kembali ke Daftar Siswa
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="rounded-[28px] border border-neutral-100 bg-white p-8 shadow-sm shadow-neutral-200/70">
              <p className="text-lg font-black text-neutral-900">Memuat detail siswa…</p>
            </div>
          ) : error ? (
            <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-8 shadow-sm shadow-rose-200/70">
              <p className="text-lg font-black text-rose-900">Gagal memuat data siswa</p>
              <p className="mt-3 text-sm text-rose-700">{error}</p>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card title="Profil siswa">
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-2xl font-black text-primary-700">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">{displayName}</p>
                        <p className="text-sm text-neutral-600">{profile?.email}</p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <SummaryStat label="Peran" value={roleLabel} />
                      <SummaryStat label="Status" value={profile?.isActive ? 'Aktif' : 'Nonaktif'} />
                      <SummaryStat label="Sekolah" value={profile?.schoolName ?? '—'} />
                      <SummaryStat label="Kelas" value={profile?.gradeLevel ? `${profile.gradeLevel}` : '—'} />
                    </div>
                  </Card>

                  <Card title="Ringkasan belajar">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <SummaryStat label="Progress" value={`${overallProgress}%`} badgeClass={progressPillClass(overallProgress)} />
                      <SummaryStat label="Nilai Rata-rata" value={`${averageScore}%`} />
                      <SummaryStat label="Modul selesai" value={`${completedModules}`} />
                      <SummaryStat label="Durasi belajar" value={learningDuration} />
                    </div>
                    <div className="mt-4 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">
                      <p className="font-semibold text-neutral-900">Aktivitas terakhir</p>
                      <p className="mt-1">{lastActivityText}</p>
                      <p className="mt-2 text-xs">{lastActivityAt}</p>
                    </div>
                  </Card>
                </div>

                <Card title="Pencapaian tahap CINARAI">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {progressByStage.map((stage) => (
                      <div key={stage.stage} className="rounded-3xl border border-neutral-100 bg-neutral-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-neutral-900">{stageLabelMap[stage.stage] ?? stage.stage}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.22em] text-neutral-500">{stage.status}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stageStatusClass(stage.status)}`}>
                            {stage.percentage}%
                          </span>
                        </div>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                          <div className="h-full rounded-full bg-primary-500" style={{ width: `${Math.max(6, stage.percentage)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                    <p className="font-semibold text-neutral-900">Report</p>
                    <p className="mt-2">Data report akan ditampilkan di akhir siklus pembelajaran dan didasarkan pada refleksi serta hasil akhir siswa.</p>
                  </div>
                </Card>

                <Card title="Refleksi terbaru">
                  {reflectionSummary ? (
                    <div className="space-y-4">
                      <div className="rounded-3xl bg-neutral-50 p-4">
                        <p className="text-sm font-semibold text-neutral-900">Tahap refleksi</p>
                        <p className="mt-1 text-sm text-neutral-600">{reflectionSummary.stage}</p>
                      </div>
                      <div className="rounded-3xl bg-neutral-50 p-4">
                        <p className="text-sm font-semibold text-neutral-900">Teks refleksi</p>
                        <p className="mt-1 text-sm text-neutral-600 whitespace-pre-line">{reflectionSummary.text || 'Belum ada catatan refleksi.'}</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <SummaryStat label="Rating" value={reflectionSummary.rating ? `${reflectionSummary.rating}/5` : '—'} />
                        <SummaryStat label="AI feedback" value={reflectionSummary.aiReflection?.suggestion ?? 'Belum tersedia'} />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-3xl bg-neutral-50 p-4 text-sm text-neutral-600">Belum ada refleksi terbaru yang dapat ditampilkan.</div>
                  )}
                </Card>

                <Card title="Riwayat aktivitas terbaru">
                  {timeline.length > 0 ? (
                    <div className="space-y-3">
                      {timeline.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="rounded-3xl border border-neutral-100 bg-neutral-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-neutral-900">{activity.title}</p>
                              <p className="mt-1 text-sm text-neutral-600">{activity.description ?? 'Tidak ada deskripsi tambahan.'}</p>
                            </div>
                            <span className="text-xs font-semibold text-neutral-500">{formatFirestoreDate(activity.occurredAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-3xl bg-neutral-50 p-4 text-sm text-neutral-600">Belum ada aktivitas siswa yang tercatat.</div>
                  )}
                </Card>
              </div>

              <div className="space-y-6">
                <Card title="AI Tutor & Aplikasi">
                  <div className="grid gap-4">
                    <SummaryStat label="Interaksi AI Tutor" value={`${aiTutorSummary.uses}`} />
                    <SummaryStat label="Pertanyaan terakhir" value={aiTutorSummary.lastQuestion ?? 'Belum ada'} />
                    <SummaryStat label="Terakhir digunakan" value={aiTutorSummary.lastUsedAt ? formatFirestoreDate(aiTutorSummary.lastUsedAt) : '—'} />
                  </div>
                </Card>

                <Card title="Pergerakan modul komik">
                  {progressDocuments.length === 0 ? (
                    <div className="rounded-3xl bg-neutral-50 p-4 text-sm text-neutral-600">Belum ada data progress komik.</div>
                  ) : (
                    <div className="space-y-3">
                      {progressDocuments.map((document) => (
                        <div key={document.id ?? `${document.comicId}-${document.status}`} className="rounded-3xl border border-neutral-100 bg-neutral-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-neutral-900">Komik {document.comicId}</p>
                              <p className="mt-1 text-xs text-neutral-500">Tahap sekarang: {document.completedStage}</p>
                            </div>
                            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${progressPillClass(document.percentage ?? 0)}`}>
                              {document.percentage ?? 0}%
                            </span>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                            <div className="h-full rounded-full bg-primary-500" style={{ width: `${Math.max(4, document.percentage ?? 0)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}
        </div>
      </TeacherDashboardLayout>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-neutral-100 bg-white p-6 shadow-sm shadow-neutral-200/70">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-neutral-400">{title}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function SummaryStat({ label, value, badgeClass }: { label: string; value: string; badgeClass?: string }) {
  return (
    <div className="rounded-3xl bg-neutral-50 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{label}</p>
      <p className={`mt-2 text-lg font-black text-neutral-900 ${badgeClass ?? ''}`}>{value}</p>
    </div>
  );
}
