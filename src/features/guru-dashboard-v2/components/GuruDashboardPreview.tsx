'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getGuruStudentApplicationActivities,
  getGuruStudentEvaluation,
  getGuruStudentProgress,
  getGuruStudentReflections,
  listGuruStudents,
} from '../services/guruDashboardReadService';
import {
  getStudentOwnedState,
  resolveGuruPreviewAccess,
} from './previewState';
import type {
  GuruDataResult,
  GuruEvaluationSummary,
  GuruReadStatus,
  GuruReflectionSummary,
  GuruSourceResult,
  GuruStudentActivityPage,
  GuruStudentPage,
  GuruStudentProgress,
  GuruStudentSummary,
} from '../types';

type DetailTab = 'progress' | 'evaluation' | 'reflections' | 'activities';
type StudentPageCursor = NonNullable<GuruStudentPage['nextCursor']>;
type StudentListState = {
  uid: string | null;
  status: 'loading' | 'success' | 'not_found' | 'error';
  students: GuruStudentSummary[];
  nextCursor: StudentPageCursor | null;
  error?: string;
};
type StudentDetailState = {
  authUid: string | null;
  uid: string | null;
  progress: GuruDataResult<GuruStudentProgress> | null;
  evaluation: GuruDataResult<GuruEvaluationSummary> | null;
  reflections: GuruDataResult<GuruReflectionSummary[]> | null;
  activities: GuruDataResult<GuruStudentActivityPage> | null;
  loading: boolean;
};

const EMPTY_DETAIL: StudentDetailState = {
  authUid: null,
  uid: null,
  progress: null,
  evaluation: null,
  reflections: null,
  activities: null,
  loading: false,
};

const TABS: Array<{ id: DetailTab; label: string }> = [
  { id: 'progress', label: 'Progres' },
  { id: 'evaluation', label: 'Evaluasi' },
  { id: 'reflections', label: 'Refleksi' },
  { id: 'activities', label: 'Aktivitas' },
];

function failureResult<T>(reason: unknown): GuruDataResult<T> {
  const code = typeof reason === 'object' && reason !== null && 'code' in reason
    && typeof (reason as { code?: unknown }).code === 'string'
    ? (reason as { code: string }).code
    : 'unknown';
  const error = { code, message: 'Data sumber ini gagal dimuat. Coba muat ulang.' };
  return {
    status: 'error',
    data: null,
    sources: { request: { status: 'error', error } },
    error,
  };
}

function studentName(student: GuruStudentSummary): string {
  return student.displayName ?? student.email ?? 'Nama belum tersedia';
}

function formatTimestamp(timestamp: { status: 'valid'; value: Date } | { status: 'unavailable'; reason: string }): string {
  if (timestamp.status !== 'valid') return 'Waktu tidak tersedia';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp.value);
}

function formatPercentage(value: number | null): string {
  return value === null ? 'Tidak tersedia' : `${value}%`;
}

function StatusNotice({
  status,
  error,
}: {
  status: 'loading' | 'success' | 'not_found' | 'error' | 'partial';
  error?: string;
}) {
  const appearance = {
    loading: 'border-blue-100 bg-blue-50 text-blue-800',
    success: 'border-emerald-100 bg-emerald-50 text-emerald-800',
    not_found: 'border-slate-200 bg-slate-50 text-slate-700',
    error: 'border-rose-100 bg-rose-50 text-rose-800',
    partial: 'border-amber-100 bg-amber-50 text-amber-900',
  }[status];
  const text = error ?? ({
    loading: 'Memuat data…',
    success: 'Data berhasil dimuat.',
    not_found: 'Belum ada data untuk ditampilkan.',
    error: 'Data gagal dimuat.',
    partial: 'Sebagian sumber gagal dimuat.',
  }[status]);

  return (
    <p role={status === 'error' || status === 'partial' ? 'alert' : 'status'} className={`rounded-xl border px-3 py-2 text-sm ${appearance}`}>
      {text}
    </p>
  );
}

function SkeletonCard() {
  return <div aria-hidden="true" className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="h-3 w-24 rounded bg-slate-200" /><div className="mt-5 h-7 w-16 rounded bg-slate-200" /><div className="mt-2 h-3 w-32 rounded bg-slate-100" /></div>;
}

export default function GuruDashboardPreview() {
  const { user, loading: authLoading, error: authError, logout } = useAuth();
  const authUid = user?.uid ?? null;
  const isTeacher = user?.role === 'teacher';
  const [listState, setList] = useState<StudentListState>({
    uid: null,
    status: 'loading',
    students: [],
    nextCursor: null,
  });
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('progress');
  const [detail, setDetail] = useState<StudentDetailState>(EMPTY_DETAIL);
  const [listRefresh, setListRefresh] = useState(0);
  const [detailRefresh, setDetailRefresh] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMoreActivities, setLoadingMoreActivities] = useState(false);
  const [activityPageError, setActivityPageError] = useState<string | null>(null);
  const [listLogoutError, setListLogoutError] = useState<string | null>(null);
  const listRequest = useRef(0);
  const detailRequest = useRef(0);
  const loadingMoreRef = useRef(false);

  const loadStudentPage = useCallback(async (
    cursor: StudentPageCursor | null,
    append: boolean
  ) => {
    const requestUid = authUid;
    if (!requestUid || !isTeacher) return;
    const requestId = ++listRequest.current;
    if (append) {
      if (loadingMoreRef.current || !cursor) return;
      loadingMoreRef.current = true;
      setLoadingMore(true);
    } else {
      setList((current) => ({ ...current, status: 'loading', error: undefined }));
    }

    try {
      const response = await listGuruStudents({ pageSize: 25, cursor });
      if (requestId !== listRequest.current) return;
      if (response.status === 'error' || !response.data) {
        const message = response.error?.message ?? 'Daftar siswa gagal dimuat. Coba lagi.';
        setList((current) => append
          ? { ...current, error: message }
          : { uid: requestUid, status: 'error', students: [], nextCursor: null, error: message });
        return;
      }

      const page = response.data;
      setList((current) => {
        const nextStudents = append
          ? [...current.students, ...page.students]
          : page.students;
        const uniqueStudents = Array.from(new Map(nextStudents.map((student) => [student.uid, student])).values());
        return {
          uid: requestUid,
          status: uniqueStudents.length ? 'success' : 'not_found',
          students: uniqueStudents,
          nextCursor: page.nextCursor,
        };
      });
    } catch {
      if (requestId !== listRequest.current) return;
      const message = 'Daftar siswa gagal dimuat. Coba lagi.';
      setList((current) => append
        ? { ...current, error: message }
        : { uid: requestUid, status: 'error', students: [], nextCursor: null, error: message });
    } finally {
      if (requestId === listRequest.current && append) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [authUid, isTeacher]);

  useEffect(() => {
    if (!authUid || !isTeacher) {
      listRequest.current += 1;
      setList({ uid: null, status: 'loading', students: [], nextCursor: null });
      setSelectedUid(null);
      setDetail(EMPTY_DETAIL);
      return;
    }
    void loadStudentPage(null, false);
    return () => {
      listRequest.current += 1;
    };
  }, [authUid, isTeacher, listRefresh, loadStudentPage]);

  useEffect(() => {
    if (!selectedUid) {
      setDetail(EMPTY_DETAIL);
      return;
    }
    let active = true;
    const requestId = ++detailRequest.current;
    setLoadingMoreActivities(false);
    setActivityPageError(null);
    setDetail({
      ...EMPTY_DETAIL,
      authUid,
      uid: selectedUid,
      loading: true,
    });

    void Promise.allSettled([
      getGuruStudentProgress(selectedUid),
      getGuruStudentEvaluation(selectedUid),
      getGuruStudentReflections(selectedUid),
      getGuruStudentApplicationActivities(selectedUid, { pageSize: 25 }),
    ]).then(([progress, evaluation, reflections, activities]) => {
      if (!active || requestId !== detailRequest.current) return;
      setDetail({
        authUid,
        uid: selectedUid,
        progress: progress.status === 'fulfilled' ? progress.value : failureResult(progress.reason),
        evaluation: evaluation.status === 'fulfilled' ? evaluation.value : failureResult(evaluation.reason),
        reflections: reflections.status === 'fulfilled' ? reflections.value : failureResult(reflections.reason),
        activities: activities.status === 'fulfilled' ? activities.value : failureResult(activities.reason),
        loading: false,
      });
    });

    return () => {
      active = false;
      detailRequest.current += 1;
    };
  }, [selectedUid, detailRefresh, authUid]);

  const access = resolveGuruPreviewAccess({
    loading: authLoading,
    uid: authUid,
    role: user?.role ?? null,
    error: authError,
  });
  const list: StudentListState = access.status === 'authorized' && listState.uid === access.uid
    ? listState
    : { uid: access.status === 'authorized' ? access.uid : null, status: 'loading', students: [], nextCursor: null };
  const detailForSelection = getStudentOwnedState(
    access.status === 'authorized' ? access.uid : null,
    selectedUid,
    detail,
    EMPTY_DETAIL
  );
  const selectedStudent = list.students.find((student) => student.uid === selectedUid) ?? null;
  const completedComics = detailForSelection.progress?.data?.comics.filter((comic) => comic.status === 'completed').length;
  const progressCount = detailForSelection.progress?.data?.comics.length;
  const evaluation = detailForSelection.evaluation?.data;
  const evaluationMetric = evaluation?.teacherRubricTotal;
  const progressSourceStatus = detailForSelection.progress?.sources.progress?.status;
  const teacherName = user?.displayName?.trim() || 'Guru';

  const retryList = () => {
    loadingMoreRef.current = false;
    setLoadingMore(false);
    setList({ uid: user?.uid ?? null, status: 'loading', students: [], nextCursor: null });
    setListRefresh((current) => current + 1);
  };

  const handleLogout = async () => {
    setListLogoutError(null);
    try {
      await logout();
    } catch {
      setListLogoutError('Tidak dapat keluar. Silakan coba lagi.');
    }
  };

  const selectedTab = (tab: DetailTab) => {
    setDetailTab(tab);
  };

  const loadMoreActivities = async () => {
    const uid = selectedUid;
    const cursor = detailForSelection.activities?.data?.nextCursor;
    if (access.status !== 'authorized' || !uid || !cursor || loadingMoreActivities) return;
    const requestId = detailRequest.current;
    setLoadingMoreActivities(true);
    setActivityPageError(null);
    try {
      const nextPage = await getGuruStudentApplicationActivities(uid, {
        pageSize: 25,
        cursor,
      });
      if (requestId !== detailRequest.current) return;
      if (!nextPage.data || nextPage.status === 'error') {
        setActivityPageError(nextPage.error?.message ?? 'Aktivitas berikutnya gagal dimuat.');
        return;
      }

      const page = nextPage.data;
      setDetail((current) => {
        if (current.activities?.data?.activities === undefined) return current;
        const activitiesById = new Map(
          current.activities.data.activities.map((activity) => [activity.id, activity])
        );
        page.activities.forEach((activity) => activitiesById.set(activity.id, activity));
        return {
          ...current,
          activities: {
            ...nextPage,
            status: nextPage.status === 'not_found' ? 'success' : nextPage.status,
            data: {
              activities: Array.from(activitiesById.values()),
              nextCursor: page.nextCursor,
            },
            sources: nextPage.status === 'not_found'
              ? { ...nextPage.sources, applicationActivity: { status: 'available' } }
              : nextPage.sources,
          },
        };
      });
    } catch {
      if (requestId === detailRequest.current) {
        setActivityPageError('Aktivitas berikutnya gagal dimuat. Coba lagi.');
      }
    } finally {
      if (requestId === detailRequest.current) setLoadingMoreActivities(false);
    }
  };

  if (access.status === 'loading') {
    return <main className="min-h-screen bg-slate-50 p-6"><StatusNotice status="loading" /></main>;
  }
  if (access.status === 'unauthenticated' || access.status === 'forbidden') {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <StatusNotice status="error" error={access.message} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-gradient-to-br from-primary-700 via-primary-800 to-indigo-950 text-white">
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">CINARAI · Preview</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Dashboard Guru</h1>
              <p className="mt-1 truncate text-sm text-blue-100">{teacherName}{user?.email ? ` · ${user.email}` : ''}</p>
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-50">
                <span className={`h-2 w-2 rounded-full ${list.status === 'error' ? 'bg-rose-300' : list.status === 'loading' ? 'bg-amber-300' : 'bg-emerald-300'}`} />
                {list.status === 'loading' ? 'Memuat daftar siswa' : list.status === 'error' ? 'Daftar siswa bermasalah' : `${list.students.length} siswa dimuat`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 rounded-xl border border-white/25 px-3 py-2 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Keluar dari akun"
            >
              Keluar
            </button>
          </div>
          {listLogoutError && <p role="alert" className="mt-3 text-sm text-rose-100">{listLogoutError}</p>}
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-blue-100">
            Pratinjau terpisah dari dashboard lama. Ringkasan hanya menggunakan data yang sudah dimuat pada halaman ini dan detail siswa yang dipilih.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section aria-labelledby="preview-summary-title">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 id="preview-summary-title" className="text-lg font-extrabold">Ringkasan</h2>
              <p className="text-xs text-slate-500">Angka siswa menunjukkan jumlah pada halaman yang telah dimuat, bukan total database.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {list.status === 'loading' ? (
              <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
            ) : (
              <>
                <SummaryCard
                  label="Siswa dimuat"
                  value={list.status === 'error' ? '—' : String(list.students.length)}
                  note={list.status === 'error' ? 'Daftar belum tersedia' : list.nextCursor ? 'Halaman ini; masih ada halaman berikutnya' : 'Semua hasil pada halaman ini'}
                  icon={<PeopleIcon />}
                />
                <SummaryCard
                  label={selectedStudent ? 'Rekaman progres komik' : 'Progres siswa'}
                  value={detailForSelection.loading ? '…' : progressSourceStatus === 'available' || progressSourceStatus === 'not_found' ? String(progressCount ?? 0) : '—'}
                  note={selectedStudent
                    ? progressSourceStatus === 'error'
                      ? 'Progres gagal dimuat'
                      : `${completedComics ?? '—'} komik selesai untuk ${studentName(selectedStudent)}`
                    : 'Pilih siswa untuk melihat progres'}
                  icon={<ProgressIcon />}
                />
                <SummaryCard
                  label="Evaluasi CINARAI"
                  value={detailForSelection.loading ? '…' : evaluationMetric?.value === null || evaluationMetric === undefined ? '—' : String(evaluationMetric.value)}
                  note={selectedStudent
                    ? detailForSelection.evaluation?.status === 'error'
                      ? 'Evaluasi gagal dimuat'
                      : evaluationStatus(evaluation?.status)
                    : 'Pilih siswa untuk melihat penilaian'}
                  icon={<EvaluationIcon />}
                />
              </>
            )}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(280px,0.82fr)_minmax(0,1.5fr)]">
          <aside aria-labelledby="students-title" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="students-title" className="text-lg font-extrabold">Daftar siswa</h2>
                <p className="mt-1 text-sm text-slate-500">Pilih siswa untuk membuka detail.</p>
              </div>
              <button
                type="button"
                onClick={retryList}
                disabled={list.status === 'loading'}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                Muat ulang
              </button>
            </div>

            {list.status === 'loading' && (
              <div className="mt-4 space-y-3" role="status" aria-label="Memuat daftar siswa">
                {[0, 1, 2, 3].map((item) => <div key={item} className="h-[68px] animate-pulse rounded-xl bg-slate-100" />)}
              </div>
            )}
            {list.status === 'error' && (
              <div className="mt-4 space-y-3">
                <StatusNotice status="error" error={list.error} />
                <button type="button" onClick={retryList} className="w-full rounded-xl bg-primary-700 px-4 py-3 text-sm font-bold text-white hover:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700">Coba lagi</button>
              </div>
            )}
            {list.status === 'not_found' && (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center">
                <p className="font-bold text-slate-800">Belum ada siswa</p>
                <p className="mt-1 text-sm text-slate-500">Daftar siswa yang dapat dibaca akan muncul di sini.</p>
                {list.nextCursor && (
                  <button
                    type="button"
                    onClick={() => void loadStudentPage(list.nextCursor, true)}
                    disabled={loadingMore}
                    className="mt-4 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-primary-800 hover:bg-primary-50 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
                  >
                    {loadingMore ? 'Memuat…' : 'Lanjutkan ke halaman berikutnya'}
                  </button>
                )}
              </div>
            )}
            {list.status === 'success' && (
              <div className="mt-4 space-y-2">
                {list.students.map((student) => (
                  <button
                    key={student.uid}
                    type="button"
                    onClick={() => {
                      setSelectedUid(student.uid);
                      setDetailTab('progress');
                    }}
                    aria-pressed={selectedUid === student.uid}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 ${
                      selectedUid === student.uid
                        ? 'border-primary-400 bg-primary-50 ring-1 ring-primary-200'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-black text-blue-800">
                      {studentName(student).slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-slate-900">{studentName(student)}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">{student.classLevel ?? student.email ?? 'Profil tambahan tidak tersedia'}</span>
                    </span>
                    <span aria-hidden="true" className="text-slate-400">›</span>
                  </button>
                ))}
                {list.error && <StatusNotice status="error" error={list.error} />}
                {list.nextCursor && (
                  <button
                    type="button"
                    onClick={() => void loadStudentPage(list.nextCursor, true)}
                    disabled={loadingMore}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-primary-800 transition hover:bg-primary-50 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
                  >
                    {loadingMore ? 'Memuat…' : 'Muat siswa berikutnya'}
                  </button>
                )}
              </div>
            )}
          </aside>

          <section aria-labelledby="student-detail-title" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            {!selectedStudent ? (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl bg-slate-50 px-5 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary-700 shadow-sm"><StudentIcon /></span>
                <h2 id="student-detail-title" className="mt-4 text-lg font-extrabold">Detail siswa</h2>
                <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-500">Pilih siswa dari daftar untuk melihat progres, evaluasi, refleksi, dan aktivitas yang tersimpan.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-700">Detail siswa</p>
                    <h2 id="student-detail-title" className="mt-1 break-words text-xl font-black">{studentName(selectedStudent)}</h2>
                    <p className="mt-1 break-all text-sm text-slate-500">{selectedStudent.email ?? 'Email tidak tersedia'}</p>
                    <p className="mt-1 text-xs text-slate-500">{selectedStudent.schoolName ?? 'Sekolah tidak tersedia'} · {selectedStudent.classLevel ?? 'Kelas tidak tersedia'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailRefresh((current) => current + 1)}
                    disabled={detailForSelection.loading}
                    className="self-start rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
                  >
                    Muat ulang detail
                  </button>
                </div>

                <div className="mt-5 overflow-x-auto border-b border-slate-200">
                  <div role="tablist" aria-label="Bagian detail siswa" className="flex min-w-max gap-1">
                    {TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        id={`guru-v2-tab-${tab.id}`}
                        aria-selected={detailTab === tab.id}
                        aria-controls="guru-v2-tab-panel"
                        onClick={() => selectedTab(tab.id)}
                        className={`rounded-t-lg border-b-2 px-3 py-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-700 ${
                          detailTab === tab.id
                            ? 'border-primary-700 text-primary-800'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div id="guru-v2-tab-panel" role="tabpanel" aria-labelledby={`guru-v2-tab-${detailTab}`} className="pt-4">
                  {detailForSelection.loading ? (
                    <div className="space-y-3" role="status" aria-label="Memuat detail siswa">
                      <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
                      <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
                    </div>
                  ) : (
                    <StudentDetailContent
                      tab={detailTab}
                      detail={detailForSelection}
                      onLoadMoreActivities={loadMoreActivities}
                      loadingMoreActivities={loadingMoreActivities}
                      activityPageError={activityPageError}
                    />
                  )}
                </div>
              </>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-600">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 truncate text-xs text-slate-500">{note}</p>
        </div>
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary-800">{icon}</span>
      </div>
    </article>
  );
}

function StudentDetailContent({
  tab,
  detail,
  onLoadMoreActivities,
  loadingMoreActivities,
  activityPageError,
}: {
  tab: DetailTab;
  detail: StudentDetailState;
  onLoadMoreActivities: () => void;
  loadingMoreActivities: boolean;
  activityPageError: string | null;
}) {
  if (tab === 'progress') return <ProgressPanel result={detail.progress} />;
  if (tab === 'evaluation') return <EvaluationPanel result={detail.evaluation} />;
  if (tab === 'reflections') return <ReflectionsPanel result={detail.reflections} />;
  return (
    <ActivitiesPanel
      result={detail.activities}
      onLoadMore={onLoadMoreActivities}
      loadingMore={loadingMoreActivities}
      pageError={activityPageError}
    />
  );
}

function SourceFailure({ sources, status }: { sources: Record<string, GuruSourceResult>; status: GuruReadStatus }) {
  const failures = Object.entries(sources).filter(([, source]) => source.status === 'error');
  if (failures.length === 0) return null;
  return (
    <div className="mb-4 space-y-2">
      <StatusNotice status={status === 'partial' ? 'partial' : 'error'} />
      {failures.map(([name, source]) => (
        <p key={name} className="text-xs text-rose-700">
          {name}: {source.error?.message ?? 'Sumber data gagal dimuat.'}
        </p>
      ))}
    </div>
  );
}

function ProgressPanel({ result }: { result: GuruDataResult<GuruStudentProgress> | null }) {
  if (!result) return <StatusNotice status="loading" />;
  if (result.status === 'error' || !result.data) return <StatusNotice status="error" error={result.error?.message} />;

  const { comics, identificationAnswers } = result.data;
  const progressSourceStatus = result.sources.progress?.status;
  const identificationSourceStatus = result.sources.identification?.status;
  return (
    <div className="space-y-4">
      <SourceFailure sources={result.sources} status={result.status} />
      {progressSourceStatus === 'error' ? (
        <StatusNotice status="error" error={result.sources.progress?.error?.message ?? 'Progres komik gagal dimuat.'} />
      ) : comics.length === 0 ? (
        <StatusNotice status="not_found" />
      ) : (
        <div className="space-y-3">
          {comics.map((comic) => (
            <article key={comic.documentId} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-extrabold">Komik {comic.comicId}</h3>
                  <p className="mt-1 text-sm text-slate-600">{progressStatus(comic.status)}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-extrabold text-slate-800">{formatPercentage(comic.percentage.value)}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {comic.stages.map((stage) => (
                  <div key={stage.stage} className={`rounded-lg px-2.5 py-2 text-xs ${
                    stage.status === 'completed' ? 'bg-emerald-50 text-emerald-800' :
                      stage.status === 'current' ? 'bg-blue-50 text-blue-800' :
                        stage.status === 'unknown' ? 'bg-amber-50 text-amber-900' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <span className="block font-bold">{stage.stage}</span>
                    <span>{stageStatus(stage.status)}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="rounded-xl border border-slate-200 p-4">
        <h3 className="font-extrabold">Jawaban identifikasi</h3>
        {identificationSourceStatus === 'error'
          ? <p role="alert" className="mt-2 text-sm text-rose-700">{result.sources.identification?.error?.message ?? 'Jawaban identifikasi gagal dimuat.'}</p>
          : identificationAnswers.length === 0
          ? <p className="mt-2 text-sm text-slate-500">Belum ada jawaban identifikasi yang tersimpan.</p>
          : <ul className="mt-3 divide-y divide-slate-100">
            {identificationAnswers.map((answer) => (
              <li key={`${answer.comicId}-${answer.step}`} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-bold">Komik {answer.comicId} · Langkah {answer.step + 1}</p>
                <p className="mt-1 text-sm text-slate-700">{answer.answer ?? 'Jawaban belum tersedia'}</p>
                {answer.reason && <p className="mt-1 text-xs text-slate-500">{answer.reason}</p>}
              </li>
            ))}
          </ul>}
      </div>
    </div>
  );
}

function EvaluationPanel({ result }: { result: GuruDataResult<GuruEvaluationSummary> | null }) {
  if (!result) return <StatusNotice status="loading" />;
  if (result.status === 'error' || !result.data) return <StatusNotice status="error" error={result.error?.message} />;
  const evaluation = result.data;
  const stateAppearance = evaluation.status === 'graded'
    ? 'bg-emerald-50 text-emerald-800'
    : evaluation.status === 'awaiting_grading'
      ? 'bg-amber-50 text-amber-900'
      : evaluation.status === 'draft'
        ? 'bg-blue-50 text-blue-800'
        : 'bg-slate-100 text-slate-700';

  return (
    <div className="space-y-4">
      {result.status === 'not_found' && <StatusNotice status="not_found" />}
      {evaluation.status === 'invalid' && <StatusNotice status="error" error="Data evaluasi ditemukan, tetapi strukturnya tidak valid." />}
      <article className="rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold">Evaluasi CINARAI</h3>
            <p className="mt-1 text-sm text-slate-600">Nilai rubrik guru · skala 0–40</p>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${stateAppearance}`}>{evaluationStatus(evaluation.status)}</span>
        </div>
        <p className="mt-5 text-3xl font-black">
          {evaluation.teacherRubricTotal.value === null ? '—' : evaluation.teacherRubricTotal.value}
          <span className="ml-1 text-base font-semibold text-slate-500">/ 40</span>
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {evaluation.teacherRubricTotal.value === null
            ? evaluation.status === 'not_found' || evaluation.status === 'draft'
              ? 'Nilai belum tersedia.'
              : 'Belum ada nilai rubrik guru yang valid.'
            : 'Nilai tersimpan dari rubrik guru.'}
        </p>
        <dl className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Dikirim</dt><dd className="mt-1 text-sm">{formatTimestamp(evaluation.submittedAt)}</dd></div>
          <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Dinilai</dt><dd className="mt-1 text-sm">{formatTimestamp(evaluation.gradedAt)}</dd></div>
        </dl>
      </article>
      {Object.entries(result.sources).map(([name, source]) => source.status === 'error' && (
        <p key={name} className="text-xs text-rose-700">{name}: {source.error?.message ?? 'Sumber gagal dimuat.'}</p>
      ))}
    </div>
  );
}

function ReflectionsPanel({ result }: { result: GuruDataResult<GuruReflectionSummary[]> | null }) {
  if (!result) return <StatusNotice status="loading" />;
  if (result.status === 'error' || !result.data) return <StatusNotice status="error" error={result.error?.message} />;
  const reflections = result.data;
  const hasFailedSource = Object.values(result.sources).some((source) => source.status === 'error');
  return (
    <div className="space-y-3">
      {result.status === 'partial' && <StatusNotice status="partial" />}
      {reflections.length === 0 && !hasFailedSource && <StatusNotice status="not_found" />}
      {reflections.map((reflection) => (
        <article key={reflection.id} className="rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-extrabold">Refleksi{reflection.comicId ? ` · Komik ${reflection.comicId}` : ''}</h3>
            <span className="text-xs text-slate-500">{formatTimestamp(reflection.submittedAt)}</span>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{reflection.text ?? 'Isi refleksi tidak tersedia.'}</p>
        </article>
      ))}
      {Object.entries(result.sources).map(([name, source]) => source.status === 'error' && (
        <p key={name} className="text-xs text-rose-700">{name}: {source.error?.message ?? 'Sumber gagal dimuat.'}</p>
      ))}
    </div>
  );
}

function ActivitiesPanel({
  result,
  onLoadMore,
  loadingMore,
  pageError,
}: {
  result: GuruDataResult<GuruStudentActivityPage> | null;
  onLoadMore: () => void;
  loadingMore: boolean;
  pageError: string | null;
}) {
  if (!result) return <StatusNotice status="loading" />;
  if (result.status === 'error' || !result.data) return <StatusNotice status="error" error={result.error?.message} />;
  const { activities } = result.data;
  return (
    <div className="space-y-3">
      {activities.length === 0 && <StatusNotice status="not_found" />}
      {activities.map((activity) => (
        <article key={activity.id} className="rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-extrabold">Penerapan{activity.comicId ? ` · Komik ${activity.comicId}` : ''}</h3>
            <span className="text-xs text-slate-500">{formatTimestamp(activity.timestamp)}</span>
          </div>
          <p className="mt-3 text-sm text-slate-700"><span className="font-bold">Jawaban:</span> {activity.selectedAnswer ?? 'Tidak tersedia'}</p>
          {activity.studentReason && <p className="mt-1 text-sm text-slate-600"><span className="font-bold">Alasan:</span> {activity.studentReason}</p>}
          {activity.attempt !== null && <p className="mt-2 text-xs text-slate-500">Percobaan {activity.attempt}</p>}
          {activity.coachMessage && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{activity.coachMessage}</p>}
        </article>
      ))}
      {pageError && <StatusNotice status="error" error={pageError} />}
      {result.data.nextCursor && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-primary-800 transition hover:bg-primary-50 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
        >
          {loadingMore ? 'Memuat aktivitas…' : 'Muat aktivitas berikutnya'}
        </button>
      )}
    </div>
  );
}

function evaluationStatus(status: GuruEvaluationSummary['status'] | undefined): string {
  switch (status) {
    case 'not_found': return 'Belum tersedia';
    case 'draft': return 'Draft siswa';
    case 'awaiting_grading': return 'Menunggu penilaian';
    case 'graded': return 'Sudah dinilai';
    case 'invalid': return 'Data tidak valid';
    default: return 'Belum dimuat';
  }
}

function progressStatus(status: 'not_started' | 'in_progress' | 'completed' | 'unknown'): string {
  switch (status) {
    case 'not_started': return 'Belum dimulai';
    case 'in_progress': return 'Sedang belajar';
    case 'completed': return 'Selesai';
    default: return 'Status tidak tersedia';
  }
}

function stageStatus(status: 'completed' | 'current' | 'not_started' | 'unknown'): string {
  switch (status) {
    case 'completed': return 'Selesai';
    case 'current': return 'Tahap aktif';
    case 'not_started': return 'Belum dimulai';
    default: return 'Status tidak tersedia';
  }
}

function PeopleIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m16 0v-2a4 4 0 0 0-3-3.87M14 3.13a4 4 0 0 1 0 7.75M10 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" /></svg>;
}

function ProgressIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5m0 14h16M8 15l3-4 3 2 5-7" /></svg>;
}

function EvaluationIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M8 4h8a2 2 0 0 1 2 2v14H6V6a2 2 0 0 1 2-2Zm2-2h4v4h-4V2Zm-1 11 2 2 4-4" /></svg>;
}

function StudentIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 7a7 7 0 0 1 14 0M3 4h18M5 4v2m14-2v2" /></svg>;
}
