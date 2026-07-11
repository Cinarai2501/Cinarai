'use client';

import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute';
import { firestore } from '@/lib/firebase/client';
import { generateStudentInsight, type StudentInsightResponse } from '@/lib/ai/service';
import { getAllComics } from '@/lib/comicRepository';
import { SINTAKS } from '@/types/progress';
import type { ActivityDocument, ComicProgressDocument, ReflectionDocument, UserDocument } from '@/types/firestore';
import { calculateStudentValue, formatFirestoreDate, formatLearningDuration, toDateValue } from '../studentDetail.utils';

type StudentDetailState = {
  student: UserDocument | null;
  progressDocuments: ComicProgressDocument[];
  reflections: ReflectionDocument[];
  activities: ActivityDocument[];
  loading: boolean;
  error: string | null;
};

const insightSections = [
  { key: 'capabilitySummary', title: 'Kemampuan numerasi' },
  { key: 'weakestStage', title: 'Stage terlemah' },
  { key: 'bestStage', title: 'Stage terbaik' },
  { key: 'errorPattern', title: 'Pola kesalahan' },
  { key: 'teacherRecommendation', title: 'Rekomendasi guru' },
  { key: 'remedial', title: 'Remedial' },
  { key: 'enrichment', title: 'Pengayaan' },
] as const;

function formatDisplayName(user: UserDocument | null): string {
  if (!user) return 'Siswa';
  return user.displayName?.trim() || user.email?.split('@')[0] || 'Siswa';
}

export default function StudentDetailPage() {
  const params = useParams<{ studentId?: string | string[] }>();
  const studentId = Array.isArray(params.studentId) ? params.studentId[0] : params.studentId;

  const [state, setState] = useState<StudentDetailState>({
    student: null,
    progressDocuments: [],
    reflections: [],
    activities: [],
    loading: true,
    error: null,
  });
  const [insight, setInsight] = useState<StudentInsightResponse | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setState((current) => ({ ...current, loading: false, error: 'ID siswa tidak tersedia.' }));
      return;
    }

    let active = true;

    const loadStudentDetail = async () => {
      setState((current) => ({ ...current, loading: true, error: null }));

      try {
        const studentRef = doc(firestore, 'users', studentId);
        const [studentSnapshot, progressSnapshot, reflectionSnapshot, activitySnapshot] = await Promise.all([
          getDoc(studentRef),
          getDocs(collection(firestore, 'users', studentId, 'progress')),
          getDocs(collection(firestore, 'reflection')),
          getDocs(collection(firestore, 'activity')),
        ]);

        if (!active) return;

        const progressDocuments = progressSnapshot.docs.map((documentSnapshot) => {
          const data = documentSnapshot.data() as Partial<ComicProgressDocument>;
          return {
            ...data,
            id: documentSnapshot.id,
            comicId: data.comicId ?? Number(documentSnapshot.id.replace('comic-', '')),
          } as ComicProgressDocument;
        });

        const reflections = reflectionSnapshot.docs
          .map((documentSnapshot) => ({ id: documentSnapshot.id, ...documentSnapshot.data() } as ReflectionDocument))
          .filter((reflection) => reflection.userId === studentId || reflection.studentId === studentId);

        const activities = activitySnapshot.docs
          .map((documentSnapshot) => ({ id: documentSnapshot.id, ...documentSnapshot.data() } as ActivityDocument))
          .filter((activity) => activity.userId === studentId)
          .sort((left, right) => {
            const leftTime = toDateValue(left.occurredAt)?.getTime() ?? 0;
            const rightTime = toDateValue(right.occurredAt)?.getTime() ?? 0;
            return rightTime - leftTime;
          });

        setState({
          student: studentSnapshot.exists() ? ({ id: studentSnapshot.id, ...studentSnapshot.data() } as UserDocument) : null,
          progressDocuments,
          reflections,
          activities,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (!active) return;
        setState({
          student: null,
          progressDocuments: [],
          reflections: [],
          activities: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Gagal memuat data siswa.',
        });
      }
    };

    void loadStudentDetail();

    return () => {
      active = false;
    };
  }, [studentId]);

  useEffect(() => {
    if (!studentId || !state.student || state.loading) {
      setInsight(null);
      setInsightLoading(false);
      setInsightError(null);
      return;
    }

    let active = true;

    const loadInsight = async () => {
      setInsightLoading(true);
      setInsightError(null);

      const student = state.student;

      if (!student) {
        setInsight(null);
        setInsightLoading(false);
        setInsightError(null);
        return;
      }

      try {
        const result = await generateStudentInsight(
          {
            studentName: formatDisplayName(student),
            email: student.email,
            progressDocuments: state.progressDocuments.map((document) => ({
              comicId: document.comicId,
              percentage: document.percentage,
              status: document.status,
              completedStage: document.completedStage,
            })),
            reflections: state.reflections.map((reflection) => ({
              rating: reflection.rating,
              stage: reflection.stage,
              response: reflection.response,
              reflectionText: reflection.reflectionText,
            })),
            activities: state.activities.map((activity) => ({
              title: activity.title,
              description: activity.description,
              occurredAt: activity.occurredAt,
            })),
          },
          { retryCount: 2 }
        );

        if (!active) return;
        setInsight(result);
      } catch (error) {
        if (!active) return;
        setInsightError(error instanceof Error ? error.message : 'AI insight gagal dimuat.');
        setInsight(null);
      } finally {
        if (active) {
          setInsightLoading(false);
        }
      }
    };

    void loadInsight();

    return () => {
      active = false;
    };
  }, [state.activities, state.loading, state.progressDocuments, state.reflections, state.student, studentId]);

  const { student, progressDocuments, reflections, activities, loading, error } = state;

  const comics = useMemo(() => getAllComics(), []);
  const comicMap = useMemo(() => new Map(comics.map((comic) => [comic.id, comic])), [comics]);

  const comicProgress = useMemo(
    () =>
      progressDocuments
        .map((document) => {
          const comic = comicMap.get(document.comicId);
          return {
            comicId: document.comicId,
            title: comic?.title ?? `Komik ${document.comicId}`,
            percentage: document.percentage ?? 0,
            status: document.status ?? 'not_started',
            currentStage: document.completedStage ?? 'Cover',
          };
        })
        .sort((left, right) => left.comicId - right.comicId),
    [comicMap, progressDocuments]
  );

  const stageProgress = useMemo(() => {
    const totalComics = progressDocuments.length || 1;
    return SINTAKS.map((stage) => {
      const completedCount = progressDocuments.reduce((sum, document) => {
        const stages = document.sintaksList ?? [];
        return sum + stages.filter((item) => item.sintaks === stage && item.status === 'COMPLETED').length;
      }, 0);

      return {
        stage,
        completedCount,
        totalCount: totalComics,
        percentage: Math.round((completedCount / totalComics) * 100),
      };
    });
  }, [progressDocuments]);

  const value = useMemo(() => calculateStudentValue(progressDocuments, reflections), [progressDocuments, reflections]);

  const firstActivity = activities[0];
  const lastActivity = activities[activities.length - 1];
  const activeSince = student?.createdAt ?? firstActivity?.occurredAt;
  const lastSeenAt = lastActivity?.occurredAt ?? student?.lastLoginAt;

  const displayName = formatDisplayName(student);

  return (
    <RoleProtectedRoute allowedRole="teacher">
      <div className="min-h-screen bg-[#f7fbff] px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-primary-600">Detail siswa</p>
              <h1 className="text-2xl font-black text-neutral-900">{displayName}</h1>
            </div>
            <Link
              href="/teacher"
              className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 shadow-sm"
            >
              ← Kembali
            </Link>
          </div>

          {loading ? (
            <div className="rounded-3xl bg-white p-6 text-sm text-neutral-500 shadow-sm">Memuat detail siswa...</div>
          ) : error ? (
            <div className="rounded-3xl bg-white p-6 text-sm text-error-700 shadow-sm">{error}</div>
          ) : !student ? (
            <div className="rounded-3xl bg-white p-6 text-sm text-neutral-500 shadow-sm">Siswa tidak ditemukan.</div>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-xl font-black text-primary-700">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">Profil</p>
                      <h2 className="text-lg font-black text-neutral-900">{displayName}</h2>
                      <p className="text-sm text-neutral-500">{student.email}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-neutral-50 p-3">
                      <p className="text-[10px] uppercase tracking-wide text-neutral-400">Peran</p>
                      <p className="mt-1 font-black text-neutral-900">{student.role === 'teacher' ? 'Guru' : 'Siswa'}</p>
                    </div>
                    <div className="rounded-2xl bg-neutral-50 p-3">
                      <p className="text-[10px] uppercase tracking-wide text-neutral-400">Status</p>
                      <p className="mt-1 font-black text-neutral-900">{student.isActive ? 'Aktif' : 'Nonaktif'}</p>
                    </div>
                    <div className="rounded-2xl bg-neutral-50 p-3">
                      <p className="text-[10px] uppercase tracking-wide text-neutral-400">Sekolah</p>
                      <p className="mt-1 font-black text-neutral-900">{student.schoolName || '—'}</p>
                    </div>
                    <div className="rounded-2xl bg-neutral-50 p-3">
                      <p className="text-[10px] uppercase tracking-wide text-neutral-400">Kelas</p>
                      <p className="mt-1 font-black text-neutral-900">{student.gradeLevel ? `${student.gradeLevel}` : '—'}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">Ringkasan</p>
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl bg-primary-50 p-3">
                      <p className="text-sm font-black text-primary-700">Nilai</p>
                      <p className="mt-1 text-2xl font-black text-neutral-900">{value}</p>
                    </div>
                    <div className="rounded-2xl bg-accent-50 p-3">
                      <p className="text-sm font-black text-accent-700">Waktu belajar</p>
                      <p className="mt-1 text-sm font-semibold text-neutral-700">{formatLearningDuration(activeSince, lastSeenAt)}</p>
                      <p className="mt-1 text-xs text-neutral-500">Terakhir aktif: {formatFirestoreDate(lastSeenAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">Progress setiap komik</p>
                    <h2 className="text-lg font-black text-neutral-900">Perkembangan pembelajaran</h2>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {comicProgress.length === 0 ? (
                    <div className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-500 md:col-span-2">
                      Belum ada progress komik tersimpan.
                    </div>
                  ) : (
                    comicProgress.map((comic) => (
                      <div key={comic.comicId} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-neutral-900">{comic.title}</p>
                            <p className="mt-1 text-xs text-neutral-500">Tahap saat ini: {comic.currentStage}</p>
                          </div>
                          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-neutral-600">
                            {comic.status === 'completed' ? 'Selesai' : comic.status === 'in_progress' ? 'Berjalan' : 'Belum mulai'}
                          </span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                          <div className="h-full rounded-full bg-primary-500" style={{ width: `${Math.max(4, comic.percentage)}%` }} />
                        </div>
                        <p className="mt-2 text-sm font-black text-neutral-900">{comic.percentage}%</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">Progress setiap Stage CINARAI</p>
                <h2 className="text-lg font-black text-neutral-900">Pencapaian tahap belajar</h2>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {stageProgress.map((stage) => (
                    <div key={stage.stage} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-neutral-900">{stage.stage}</p>
                        <span className="text-xs font-semibold text-neutral-500">{stage.completedCount}/{stage.totalCount}</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                        <div className="h-full rounded-full bg-accent-500" style={{ width: `${Math.max(4, stage.percentage)}%` }} />
                      </div>
                      <p className="mt-2 text-sm font-black text-neutral-900">{stage.percentage}% selesai</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">AI Insight</p>
                    <h2 className="text-lg font-black text-neutral-900">Analisis pembelajaran</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!student) return;
                      setInsightLoading(true);
                      setInsightError(null);
                      void generateStudentInsight(
                        {
                          studentName: formatDisplayName(student),
                          email: student.email,
                          progressDocuments: progressDocuments.map((document) => ({
                            comicId: document.comicId,
                            percentage: document.percentage,
                            status: document.status,
                            completedStage: document.completedStage,
                          })),
                          reflections: reflections.map((reflection) => ({
                            rating: reflection.rating,
                            stage: reflection.stage,
                            response: reflection.response,
                            reflectionText: reflection.reflectionText,
                          })),
                          activities: activities.map((activity) => ({
                            title: activity.title,
                            description: activity.description,
                            occurredAt: activity.occurredAt,
                          })),
                        },
                        { retryCount: 2 }
                      ).then((result) => {
                        setInsight(result);
                      }).catch((error) => {
                        setInsightError(error instanceof Error ? error.message : 'AI insight gagal dimuat.');
                        setInsight(null);
                      }).finally(() => {
                        setInsightLoading(false);
                      });
                    }}
                    disabled={insightLoading}
                    className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-black text-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {insightLoading ? 'Memuat...' : 'Coba lagi'}
                  </button>
                </div>

                {insightLoading ? (
                  <div className="mt-4 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-500">AI sedang menganalisis data siswa...</div>
                ) : insightError ? (
                  <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">{insightError}</div>
                ) : insight ? (
                  <div className="mt-4 space-y-3">
                    {insightSections.map((section) => (
                      <div key={section.key} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                        <p className="text-sm font-black text-neutral-900">{section.title}</p>
                        <p className="mt-2 text-sm text-neutral-600">{insight[section.key]}</p>
                      </div>
                    ))}
                    {insight.fallbackUsed ? (
                      <p className="text-xs text-amber-600">Ringkasan ini dibuat dari data Firestore karena AI tidak tersedia saat ini.</p>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-500">Belum ada insight AI yang dapat ditampilkan.</div>
                )}
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">Riwayat aktivitas</p>
                <h2 className="text-lg font-black text-neutral-900">Aktivitas terbaru</h2>

                {activities.length === 0 ? (
                  <div className="mt-4 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-500">
                    Belum ada riwayat aktivitas yang tercatat.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {activities.slice(0, 6).map((activity) => (
                      <div key={activity.id} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-neutral-900">{activity.title}</p>
                            <p className="mt-1 text-sm text-neutral-600">{activity.description || 'Tidak ada deskripsi.'}</p>
                          </div>
                          <span className="text-xs font-semibold text-neutral-500">{formatFirestoreDate(activity.occurredAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </RoleProtectedRoute>
  );
}
