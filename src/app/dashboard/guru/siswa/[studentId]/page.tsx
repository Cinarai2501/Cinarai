'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { TeacherDashboardLayout } from '../../components/TeacherDashboardLayout';
import { TeacherHeader } from '../../components/TeacherHeader';
import { TeacherSidebar } from '../../components/TeacherSidebar';
import { useStudentDetail } from '../../hooks/useStudentDetail';
import { StudentDetailContent } from '../../components/StudentDetailContent';

export default function StudentDetailPage() {
  const params = useParams<{ studentId?: string | string[] }>();
  const studentId = Array.isArray(params.studentId) ? params.studentId[0] : params.studentId;
  const { profile, progressDocuments, studentSummary, progressSummary, timelineItems, reflectionSummary, aiUsageSummary, loading, error } = useStudentDetail(studentId);

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-4 sm:px-6 lg:px-8">
      <TeacherDashboardLayout header={<TeacherHeader />} sidebar={<TeacherSidebar />}>
        <div className="space-y-6">
          <div className="rounded-[28px] border border-neutral-100 bg-white p-6 shadow-sm shadow-neutral-200/70">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-500">Detail Siswa</p>
                <h1 className="mt-2 text-3xl font-black text-neutral-900">{studentSummary.displayName}</h1>
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
            <StudentDetailContent
              profile={profile}
              studentSummary={studentSummary}
              progressSummary={progressSummary}
              timelineItems={timelineItems}
              reflectionSummary={reflectionSummary}
              aiUsageSummary={aiUsageSummary}
              progressDocuments={progressDocuments}
            />
          )}
        </div>
      </TeacherDashboardLayout>
    </div>
  );
}
