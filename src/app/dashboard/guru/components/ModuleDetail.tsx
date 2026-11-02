'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { auth } from '@/lib/firebase/client';
import { readJsonResponse } from '@/lib/api/readJsonResponse';
import { getInternalAiRetryAfter } from '@/lib/ai/rateLimitResponse';
import { SINTAKS, type Sintaks } from '@/types/progress';
import type { ComicDocument } from '@/types/firestore';
import type { StudentRow } from '../types';
import type { ModuleDetailResponse } from '../services/moduleAnalytics';
import { getCompletedModuleStages } from '../services/progressStatus';
import { releaseAiRequestLock, tryAcquireAiRequestLock } from '../ai/aiRequestLock';
import { Avatar, Button, Card, EmptyState, ErrorState, LoadingState, ProgressBar, SearchInput, SectionHeader, Skeleton, StatusBadge } from './ui';

interface Props {
  comic: ComicDocument;
  rows: StudentRow[];
  onBack: () => void;
  onSelectStudent: (uid: string) => void;
}

const STUDENTS_PER_PAGE = 15;
const stageTitles: Record<Sintaks, string> = {
  Cover: 'Cover',
  Contextualization: 'Contextualization',
  Identification: 'Identification',
  Navigation: 'Navigation',
  Argumentation: 'Argumentation',
  Resolution: 'Resolution',
  Application: 'Application',
  Introspection: 'Introspection',
};
const moduleCovers: Record<number, string> = {
  1: '/assets/dashboard/home/covers/cover-komik-1.png',
  2: '/assets/dashboard/home/covers/cover-komik-2.png',
  3: '/assets/dashboard/home/covers/cover-komik-3.png',
  4: '/assets/dashboard/home/covers/cover-komik-4.png',
  5: '/assets/dashboard/home/covers/cover-komik-5.png',
  6: '/comics/komik-6/cover.png',
};
type StudentFilter = 'all' | 'not_started' | 'learning' | 'completed' | 'attention';

export function ModuleDetail({ comic, rows, onBack, onSelectStudent }: Props) {
  const coverImage = comic.thumbnailUrl || comic.coverUrl || moduleCovers[comic.comicId];
  const [data, setData] = useState<ModuleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightGeneratedAt, setInsightGeneratedAt] = useState<string | null>(null);
  const [insightFromCache, setInsightFromCache] = useState(false);
  const [insightCacheWarning, setInsightCacheWarning] = useState<string | null>(null);
  const [insightUsedFallback, setInsightUsedFallback] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);
  const [page, setPage] = useState(0);
  const [studentFilter, setStudentFilter] = useState<StudentFilter>('all');
  const [studentSearch, setStudentSearch] = useState('');
  const aiRequestInFlight = useRef(false);

  useEffect(() => {
    if (retryAfterSeconds <= 0) return;
    const timer = window.setTimeout(() => setRetryAfterSeconds((remaining) => Math.max(0, remaining - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [retryAfterSeconds]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) throw new Error('Sesi login tidak tersedia. Silakan masuk kembali.');
        const token = await firebaseUser.getIdToken();
        const endpoint = `/api/dashboard/guru/modules/${comic.comicId}`;
        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const payload = await readJsonResponse<ModuleDetailResponse | { error?: string }>(response, endpoint);
        if (!response.ok) throw new Error('error' in payload && payload.error ? payload.error : 'Detail modul gagal dimuat.');
        if (active && 'comic' in payload) setData(payload);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Detail modul gagal dimuat.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [comic.comicId, retryCount]);

  const supportStudents = useMemo(
    () => data?.students.filter((student) => student.incorrectAnswers > 0 || (student.lowConfidence !== null && student.lowConfidence <= 2)) ?? [],
    [data]
  );
  const supportStudentUids = useMemo(() => new Set(supportStudents.map((student) => student.uid)), [supportStudents]);
  const visibleStudents = useMemo(
    () => {
      const query = studentSearch.trim().toLocaleLowerCase('id');
      return (data?.students ?? [])
        .filter((student) => {
          if (query && !displayStudentName(student.name).toLocaleLowerCase('id').includes(query)) return false;
          if (studentFilter === 'attention') return supportStudentUids.has(student.uid);
          return studentFilter === 'all' || student.status === studentFilter;
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'id'))
        .slice(page * STUDENTS_PER_PAGE, (page + 1) * STUDENTS_PER_PAGE);
    },
    [data, page, studentFilter, studentSearch, supportStudentUids]
  );
  const filteredStudentCount = useMemo(() => {
    const query = studentSearch.trim().toLocaleLowerCase('id');
    return (data?.students ?? []).filter((student) => {
      if (query && !displayStudentName(student.name).toLocaleLowerCase('id').includes(query)) return false;
      if (studentFilter === 'attention') return supportStudentUids.has(student.uid);
      return studentFilter === 'all' || student.status === studentFilter;
    }).length;
  }, [data, studentFilter, studentSearch, supportStudentUids]);
  const pageCount = Math.ceil(filteredStudentCount / STUDENTS_PER_PAGE);
  const classStages = useMemo(
    () => SINTAKS.map((stage) => {
      let completedCount = 0;
      let currentCount = 0;
      data?.students.forEach((student) => {
        const row = rows.find((item) => item.uid === student.uid);
        const progress = row?.progressList.find((item) => item.comicId === comic.comicId);
        const completed = new Set(student.completedStages);
        if (progress) getCompletedModuleStages(progress).forEach((item) => completed.add(item));
        if (completed.has(stage)) {
          completedCount += 1;
          return;
        }
        const currentStage = progress?.currentStage
          ?? progress?.sintaksList.find((item) => item.status === 'CURRENT')?.sintaks;
        if (currentStage === stage) currentCount += 1;
      });
      const studentCount = data?.summary.studentCount ?? 0;
      return {
        id: stage,
        title: stageTitles[stage],
        completedCount,
        currentCount,
        studentCount,
        percentage: studentCount ? Math.round((completedCount / studentCount) * 100) : null,
        status: studentCount > 0 && completedCount === studentCount
          ? 'completed'
          : completedCount > 0 || currentCount > 0
            ? 'learning'
            : 'not_started',
      } as const;
    }),
    [comic.comicId, data, rows]
  );

  useEffect(() => {
    setPage(0);
  }, [studentFilter, studentSearch]);

  const generateInsight = async (refresh = false) => {
    if (aiLoading || retryAfterSeconds > 0 || !tryAcquireAiRequestLock(aiRequestInFlight)) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('Sesi login tidak tersedia. Silakan masuk kembali.');
      const token = await firebaseUser.getIdToken();
      const endpoint = `/api/dashboard/guru/modules/${comic.comicId}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ refresh }),
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await readJsonResponse<{
        insight?: string;
        error?: string;
        code?: string;
        analysisGeneratedAt?: string;
        cacheHit?: boolean;
        cacheWarning?: string | null;
        fallbackUsed?: boolean;
      }>(response, endpoint);
      setRetryAfterSeconds(getInternalAiRetryAfter(response, payload));
      if (!response.ok || !payload.insight) throw new Error(payload.error ?? 'Analisis AI gagal dibuat.');
      setInsight(payload.insight);
      setInsightGeneratedAt(payload.analysisGeneratedAt ?? null);
      setInsightFromCache(payload.cacheHit === true);
      setInsightCacheWarning(payload.cacheWarning ?? null);
      setInsightUsedFallback(payload.fallbackUsed === true);
    } catch (generateError) {
      setAiError(generateError instanceof Error ? generateError.message : 'Analisis AI gagal dibuat.');
    } finally {
      releaseAiRequestLock(aiRequestInFlight);
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onBack}
        className="min-h-11 rounded-xl px-2 text-sm font-bold text-brand-700 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
      >
        <span aria-hidden="true">←</span> Kembali ke daftar modul
      </button>

      {loading ? (
        <LoadingState label="Memuat detail modul">
          <div className="space-y-3">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </LoadingState>
      ) : error ? (
        <ErrorState
          title="Data detail modul tidak dapat dimuat."
          message={error}
          action={<Button onClick={() => setRetryCount((count) => count + 1)}>Muat ulang</Button>}
        />
      ) : !data ? (
        <EmptyState>Detail modul belum tersedia.</EmptyState>
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="grid gap-4 p-4 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-5 sm:p-5">
              <div className="relative aspect-[4/5] w-28 overflow-hidden rounded-xl bg-brand-50">
                {coverImage ? (
                  <Image
                    src={coverImage}
                    alt={`Cover ${data.comic.title}`}
                    fill
                    unoptimized
                    sizes="112px"
                    className="object-cover"
                  />
                ) : (
                  <span className="grid h-full place-items-center px-2 text-center text-xs text-secondary-content">
                    Cover belum tersedia
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Modul {comic.comicId}</p>
                <h2 className="guru-page-title mt-1 break-words">{data.comic.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm leading-5 text-secondary-content">
                  {data.comic.description || data.comic.subtitle || 'Deskripsi modul belum tersedia.'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/comic/${comic.comicId}`}
                    className="inline-flex min-h-11 items-center rounded-xl bg-brand-700 px-4 text-sm font-bold text-white hover:bg-brand-800"
                  >
                    Buka komik, QR &amp; AR
                  </Link>
                  {data.comic.pdfUrl && (
                    <a
                      href={data.comic.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center rounded-xl border border-ui-border px-4 text-sm font-bold text-secondary-content hover:bg-canvas"
                    >
                      Buka PDF
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-ui-border p-3 sm:gap-3 sm:p-4">
              <SummaryMetric label="Belum mulai" value={Math.max(0, data.summary.studentCount - data.summary.startedCount)} />
              <SummaryMetric label="Sedang belajar" value={data.summary.learningCount} />
              <SummaryMetric label="Tuntas" value={data.summary.completedCount} />
            </div>
            <div className="px-4 pb-4 sm:px-5">
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-semibold text-secondary-content">Progress penyelesaian kelas</span>
                <span className="font-black text-brand-700">{data.summary.completionRate === null ? '—' : `${data.summary.completionRate}%`}</span>
              </div>
              {data.summary.completionRate !== null
                ? <ProgressBar value={data.summary.completionRate} />
                : <p className="text-xs text-secondary-content">Belum ada siswa dalam cakupan.</p>}
              <p className="mt-2 text-[11px] text-secondary-content">{data.summary.studentCount} siswa dalam cakupan</p>
              {data.limitations.map((limitation) => (
                <p key={limitation} role="status" className="mt-2 rounded-lg bg-warning-50 p-2 text-xs text-warning-900">
                  {limitation}
                </p>
              ))}
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <SectionHeader title="Perjalanan belajar CINARAI" description="Urutan tahap tetap mengikuti alur pembelajaran modul." />
            <ol className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-8">
              {classStages.map((stage, index) => (
                <StageCard key={stage.id} stage={stage} index={index} />
              ))}
            </ol>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <SectionHeader
                title="Perkembangan siswa"
                description={`${filteredStudentCount} siswa sesuai pencarian dan filter`}
              />
              <label className="w-full md:max-w-xs">
                <span className="sr-only">Cari nama siswa</span>
                <SearchInput
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder="Cari nama siswa"
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Filter status siswa">
              {([
                ['all', 'Semua'],
                ['not_started', 'Belum mulai'],
                ['learning', 'Sedang belajar'],
                ['completed', 'Tuntas'],
                ['attention', 'Perlu perhatian'],
              ] as const).map(([filter, label]) => (
                <button
                  key={filter}
                  type="button"
                  aria-pressed={studentFilter === filter}
                  onClick={() => setStudentFilter(filter)}
                  className={`min-h-11 rounded-full px-3 text-xs font-bold ${
                    studentFilter === filter
                      ? 'bg-brand-700 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {visibleStudents.length ? (
              <>
                <ul className="mt-3 divide-y divide-ui-border">
                  {visibleStudents.map((student) => {
                    const row = rows.find((item) => item.uid === student.uid);
                    const progress = row?.progressList.find((item) => item.comicId === comic.comicId);
                    const completedStages = new Set(student.completedStages);
                    if (progress) getCompletedModuleStages(progress).forEach((stage) => completedStages.add(stage));
                    const currentStage = progress?.currentStage
                      ?? progress?.sintaksList.find((item) => item.status === 'CURRENT')?.sintaks
                      ?? null;
                    const lastCompletedStage = [...SINTAKS].reverse().find((stage) => completedStages.has(stage));
                    const pendingStages = SINTAKS.filter((stage) => !completedStages.has(stage));
                    const hasEvidence = student.incorrectAnswers > 0
                      || (student.lowConfidence !== null && student.lowConfidence <= 2);
                    return (
                      <li key={student.uid} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <Avatar name={displayStudentName(student.name)} />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="break-words text-sm font-bold text-ink">{displayStudentName(student.name)}</p>
                                <StatusBadge status={student.status} />
                                {hasEvidence && <span className="rounded-full bg-warning-50 px-2 py-1 text-[10px] font-bold text-warning-800">Perlu ditinjau</span>}
                              </div>
                              {student.progress !== null ? (
                                <div className="mt-2 flex items-center gap-2">
                                  <ProgressBar value={student.progress} className="min-w-0 flex-1" />
                                  <span className="w-10 flex-shrink-0 text-right text-xs font-bold text-secondary-content">{student.progress}%</span>
                                </div>
                              ) : (
                                <p className="mt-2 text-xs text-secondary-content">Progress belum tersedia.</p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 sm:justify-end">
                            <button
                              type="button"
                              onClick={() => onSelectStudent(student.uid)}
                              className="min-h-11 flex-1 rounded-xl border border-brand-200 px-3 text-xs font-bold text-brand-700 hover:bg-brand-50 sm:flex-none"
                            >
                              Lihat detail siswa
                            </button>
                          </div>
                        </div>
                        <details className="ml-0 mt-2 sm:ml-[52px]">
                          <summary className="min-h-11 cursor-pointer py-2 text-xs font-semibold text-brand-700">
                            Tahap dan bukti pembelajaran
                          </summary>
                          <div className="rounded-xl bg-canvas p-3">
                            <div className="grid gap-2 sm:grid-cols-2">
                              <p className="text-xs leading-5 text-secondary-content">
                                Tahap terakhir selesai: <strong>{lastCompletedStage ? stageTitles[lastCompletedStage] : 'Belum tercatat'}</strong>
                              </p>
                              <p className="text-xs leading-5 text-secondary-content">
                                Tahap saat ini: <strong>{getStageTitle(currentStage)}</strong>
                              </p>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-secondary-content">
                              Tahap belum selesai: {pendingStages.length ? pendingStages.map((stage) => stageTitles[stage]).join(', ') : 'Tidak ada'}
                            </p>
                            {(student.quizScore !== null || student.argumentationScore !== null || student.applicationScore !== null
                              || student.incorrectAnswers > 0 || student.lowConfidence !== null) && (
                              <p className="mt-2 text-xs leading-5 text-secondary-content">
                                Bukti tersimpan
                                {student.quizScore !== null && ` · Kuis ${student.quizScore}`}
                                {student.argumentationScore !== null && ` · Argumentasi ${student.argumentationScore}`}
                                {student.applicationScore !== null && ` · Aplikasi ${student.applicationScore}`}
                                {student.incorrectAnswers > 0 && ` · ${student.incorrectAnswers} jawaban identifikasi keliru`}
                                {student.lowConfidence !== null && ` · Refleksi keyakinan ${student.lowConfidence}/5`}
                              </p>
                            )}
                            <p className="mt-2 text-[11px] leading-5 text-secondary-content">
                              Riwayat aktivitas dan refleksi terperinci dapat ditinjau pada halaman detail siswa.
                            </p>
                          </div>
                        </details>
                      </li>
                    );
                  })}
                </ul>
                {pageCount > 1 && (
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-ui-border pt-3">
                    <button type="button" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))} className="min-h-11 rounded-xl border border-ui-border px-3 text-sm font-semibold disabled:opacity-50">Sebelumnya</button>
                    <span className="text-xs text-secondary-content">Halaman {page + 1} dari {pageCount}</span>
                    <button type="button" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} className="min-h-11 rounded-xl border border-ui-border px-3 text-sm font-semibold disabled:opacity-50">Berikutnya</button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState className="mt-3">
                Tidak ada siswa yang cocok dengan pencarian atau filter ini.
              </EmptyState>
            )}
          </Card>

          <details className="rounded-2xl border border-ui-border bg-white p-4 shadow-sm">
            <summary className="min-h-11 cursor-pointer text-sm font-bold text-ink">Hasil belajar dan asesmen</summary>
            <Card className="mt-3 border-0 p-0 shadow-none">
            <SectionHeader title="Hasil belajar dan asesmen" description="Pembacaan komik bukan bukti penguasaan. Nilai hanya dari skor tersimpan; rata-rata mengecualikan siswa tanpa skor." />
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <SummaryMetric label="Jawaban identifikasi" value={data.summary.answeredCount} />
              <SummaryMetric label="Dinilai benar" value={data.summary.correctAnswerCount} />
              <SummaryMetric label="Rata-rata skor kuis" value={data.summary.quizAverage ?? '—'} />
              <SummaryMetric label="Rata-rata skor argumentasi" value={data.summary.argumentationAverage ?? '—'} />
              <SummaryMetric label="Rata-rata skor aplikasi" value={data.summary.applicationAverage ?? '—'} />
              <SummaryMetric label="Aktivitas aplikasi tersimpan" value={data.summary.applicationActivityCount} />
              <SummaryMetric label="Refleksi tersimpan" value={data.summary.reflectionCount} />
            </div>
            {data.questions.length > 0 ? (
              <div className="mt-4">
                <h3 className="text-sm font-bold text-ink">Pertanyaan dengan jawaban keliru terbanyak</h3>
                <ul className="mt-2 space-y-2">
                  {data.questions.map((question) => (
                    <li key={question.question} className="rounded-xl bg-canvas p-3">
                      <p className="text-sm font-medium text-ink">{question.question}</p>
                      <p className="mt-1 text-xs text-secondary-content">
                        {question.incorrectCount} keliru dari {question.answeredCount} jawaban yang tersimpan
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-3 rounded-xl bg-canvas p-3 text-sm text-secondary-content">
                {data.summary.answeredCount > 0
                  ? `Belum ada jawaban keliru yang dapat diidentifikasi dari ${data.summary.answeredCount} jawaban tersimpan.`
                  : 'Belum ada hasil jawaban identifikasi yang tersimpan untuk modul ini.'}
              </p>
            )}
            {data.answers.length > 0 && (
              <details className="mt-3 rounded-xl border border-ui-border p-3">
                <summary className="min-h-8 cursor-pointer text-sm font-bold text-brand-700">Lihat 10 jawaban terbaru dari {data.answers.length} catatan</summary>
                <ul className="mt-2 space-y-2">
                  {data.answers.slice(0, 10).map((answer, index) => (
                    <li key={`${answer.studentName}:${answer.question}:${index}`} className="border-t border-ui-border pt-2 text-xs">
                      <p className="font-bold text-ink">{answer.studentName} · {answer.question}</p>
                      <p className="mt-1 text-secondary-content">Jawaban: {answer.selectedAnswer}</p>
                      {answer.correctAnswer && <p className="text-secondary-content">Kunci tersimpan: {answer.correctAnswer}</p>}
                      <p className="text-secondary-content">{answer.correct === null ? 'Belum dapat dinilai dari data tersimpan.' : answer.correct ? 'Dinilai benar' : 'Dinilai keliru'} · {formatDate(answer.date)}</p>
                    </li>
                  ))}
                </ul>
              </details>
            )}
            </Card>
          </details>

          <details className="rounded-2xl border border-ui-border bg-white p-4 shadow-sm">
            <summary className="min-h-11 cursor-pointer text-sm font-bold text-ink">Sinyal pendampingan</summary>
            <Card className="mt-3 border-0 p-0 shadow-none">
            <SectionHeader title="Siswa yang mungkin memerlukan pendampingan" description="Sinyal berasal dari jawaban asesmen yang dinilai keliru atau keyakinan belajar 1–2/5 yang tersimpan; bukan inferensi dari aktivitas membaca." />
            {supportStudents.length ? (
              <ul className="mt-3 space-y-2">
                {supportStudents.slice(0, 20).map((student) => (
                  <li key={student.uid} className="flex items-start justify-between gap-3 rounded-xl bg-warning-50 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{displayStudentName(student.name)}</p>
                      <p className="mt-0.5 text-xs leading-5 text-secondary-content">
                        {student.incorrectAnswers > 0 && `${student.incorrectAnswers} jawaban identifikasi dinilai keliru.`}
                        {student.incorrectAnswers > 0 && student.lowConfidence !== null && student.lowConfidence <= 2 && ' '}
                        {student.lowConfidence !== null && student.lowConfidence <= 2 && `Menyatakan keyakinan belajar ${student.lowConfidence}/5.`}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-xs font-semibold text-secondary-content">
                      {student.progress === null ? 'Progress belum tersedia' : `${student.progress}%`}
                    </span>
                  </li>
                ))}
                {supportStudents.length > 20 && (
                  <li className="text-xs text-secondary-content">
                    Menampilkan 20 dari {supportStudents.length} siswa dengan sinyal pendampingan.
                  </li>
                )}
              </ul>
            ) : (
              <p className="mt-3 rounded-xl bg-canvas p-3 text-sm text-secondary-content">
                Belum ada sinyal asesmen atau refleksi yang tersimpan untuk ditampilkan.
              </p>
            )}
            </Card>
          </details>

          <details className="rounded-2xl border border-ui-border bg-white p-4 shadow-sm">
            <summary className="min-h-11 cursor-pointer text-sm font-bold text-ink">Aktivitas dan analisis lanjutan</summary>
            <Card className="mt-3 border-0 p-0 shadow-none">
            <SectionHeader title="Aktivitas per tahap" description="Waktu hanya berasal dari timestamp yang tersimpan." />
            {data.activities.length ? (
              <ul className="mt-3 space-y-2">
                {data.activities.map((activity, index) => (
                  <li key={`${activity.studentName}:${activity.stage}:${activity.date ?? index}`} className="flex items-start gap-3 rounded-xl bg-canvas p-3">
                    <span className="mt-0.5 rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-brand-700">{activity.stage}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-ink">{displayStudentName(activity.studentName)}: {activity.label}</p>
                      <p className="mt-0.5 text-[10px] text-secondary-content">{formatDate(activity.date)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-xl bg-canvas p-3 text-sm text-secondary-content">Belum ada aktivitas bertimestamp yang tersimpan.</p>
            )}
            </Card>

            <Card className="mt-3 border-0 p-0 shadow-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="guru-section-title">Analisis AI modul</h3>
                <p className="mt-1 text-xs leading-5 text-secondary-content">Analisis dibuat hanya saat diminta dan menggunakan statistik agregat tanpa identitas siswa.</p>
              </div>
              <button
                type="button"
                onClick={() => void generateInsight(Boolean(insight))}
                disabled={aiLoading || retryAfterSeconds > 0}
                className="min-h-11 rounded-xl bg-brand-700 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {aiLoading
                  ? 'Menganalisis…'
                  : retryAfterSeconds > 0
                    ? `Coba lagi dalam ${retryAfterSeconds} dtk`
                    : insight
                      ? 'Perbarui analisis'
                      : 'Buat analisis'}
              </button>
            </div>
            {aiError && <p role="alert" className="mt-3 rounded-xl bg-error-50 p-3 text-sm text-error-700">{aiError}</p>}
            {retryAfterSeconds > 0 && (
              <p role="status" className="mt-2 text-xs text-secondary-content">Batas permintaan internal untuk modul ini tercapai.</p>
            )}
            {insightGeneratedAt && (
              <p className="mt-2 text-[10px] text-secondary-content">
                Terakhir dianalisis {formatDate(insightGeneratedAt)}{insightFromCache ? ' · cache, data belum berubah.' : '.'}
              </p>
            )}
            {insightCacheWarning && (
              <p role="status" className="mt-2 text-xs text-warning-800">{insightCacheWarning}</p>
            )}
            {insightUsedFallback && (
              <p role="status" className="mt-2 text-xs text-secondary-content">
                Analisis berhasil menggunakan layanan AI alternatif setelah provider utama terganggu.
              </p>
            )}
            {insight && <p className="mt-3 whitespace-pre-line rounded-xl bg-brand-50 p-3 text-sm leading-6 text-ink">{insight}</p>}
            </Card>
          </details>
        </>
      )}
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-xl bg-canvas p-2.5 sm:p-3">
      <p className="text-lg font-black text-ink">{value}</p>
      <p className="mt-0.5 break-words text-xs leading-4 text-secondary-content">{label}</p>
    </div>
  );
}

function displayStudentName(value: string): string {
  const name = value.trim();
  if (!name || name.includes('@') || /^[A-Za-z0-9_-]{20,}$/.test(name)) return 'Siswa';
  return name;
}

function getStageTitle(value: string | null): string {
  return value && SINTAKS.includes(value as Sintaks) ? stageTitles[value as Sintaks] : 'Belum tercatat';
}

function StageCard({
  stage,
  index,
}: {
  stage: {
    id: Sintaks;
    title: string;
    completedCount: number;
    currentCount: number;
    studentCount: number;
    percentage: number | null;
    status: 'not_started' | 'learning' | 'completed';
  };
  index: number;
}) {
  const stateLabel = {
    not_started: 'Belum dimulai',
    learning: 'Sedang dikerjakan',
    completed: 'Selesai',
  }[stage.status];
  const stateClasses = {
    not_started: 'border-ui-border bg-canvas text-secondary-content',
    learning: 'border-brand-200 bg-brand-50 text-brand-800',
    completed: 'border-accent-200 bg-accent-50 text-accent-800',
  }[stage.status];
  return (
    <li className={`min-w-0 rounded-xl border p-3 ${stateClasses}`}>
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-white text-xs font-black text-secondary-content" aria-hidden="true">
          {index + 1}
        </span>
        <span className="min-w-0 break-words text-xs font-bold leading-4">{stage.title}</span>
      </div>
      <p className="mt-2 text-[11px] font-semibold">{stateLabel}</p>
      {stage.percentage !== null ? (
        <>
          <ProgressBar value={stage.percentage} className="mt-2" />
          <p className="mt-1 break-words text-[10px] leading-4">
            {stage.completedCount}/{stage.studentCount} tuntas · {stage.percentage}%
          </p>
          {stage.currentCount > 0 && (
            <p className="text-[10px] leading-4">{stage.currentCount} sedang di tahap ini</p>
          )}
        </>
      ) : (
        <p className="mt-2 text-[10px] leading-4">Belum ada siswa dalam cakupan.</p>
      )}
    </li>
  );
}

function formatDate(value: string | null): string {
  if (!value) return 'Waktu tidak tersimpan';
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
