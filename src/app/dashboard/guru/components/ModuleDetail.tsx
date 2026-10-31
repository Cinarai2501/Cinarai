'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/firebase/client';
import { readJsonResponse } from '@/lib/api/readJsonResponse';
import type { ComicDocument } from '@/types/firestore';
import type { ModuleDetailResponse } from '../services/moduleAnalytics';
import { Card, ProgressBar, Skeleton } from './ui';

interface Props {
  comic: ComicDocument;
  onBack: () => void;
}

const STUDENTS_PER_PAGE = 15;

export function ModuleDetail({ comic, onBack }: Props) {
  const [data, setData] = useState<ModuleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [page, setPage] = useState(0);

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
  const visibleStudents = useMemo(
    () => data?.students.slice(page * STUDENTS_PER_PAGE, (page + 1) * STUDENTS_PER_PAGE) ?? [],
    [data, page]
  );
  const pageCount = Math.ceil((data?.students.length ?? 0) / STUDENTS_PER_PAGE);

  const generateInsight = async () => {
    setAiLoading(true);
    setAiError(null);
    setInsight(null);
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('Sesi login tidak tersedia. Silakan masuk kembali.');
      const token = await firebaseUser.getIdToken();
      const endpoint = `/api/dashboard/guru/modules/${comic.comicId}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await readJsonResponse<{ insight?: string; error?: string }>(response, endpoint);
      if (!response.ok || !payload.insight) throw new Error(payload.error ?? 'Analisis AI gagal dibuat.');
      setInsight(payload.insight);
    } catch (generateError) {
      setAiError(generateError instanceof Error ? generateError.message : 'Analisis AI gagal dibuat.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onBack}
        className="min-h-11 rounded-xl px-2 text-sm font-bold text-primary-700 hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
      >
        <span aria-hidden="true">←</span> Kembali ke daftar modul
      </button>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : error ? (
        <div role="alert">
          <Card className="p-5">
            <p className="font-bold text-error-700">Data detail modul tidak dapat dimuat.</p>
            <p className="mt-1 break-words text-sm text-neutral-600">{error}</p>
            <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="mt-3 min-h-11 rounded-xl bg-primary-600 px-4 text-sm font-bold text-white">
              Muat ulang
            </button>
          </Card>
        </div>
      ) : !data ? (
        <Card className="p-5 text-sm text-neutral-600">Detail modul belum tersedia.</Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-blue-700 to-sky-500 p-4 text-white sm:p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-100">Komik {comic.comicId}</p>
              <h2 className="mt-1 text-xl font-black">{data.comic.title}</h2>
              <p className="mt-1 text-sm leading-5 text-blue-50">{data.comic.description || data.comic.subtitle || 'Deskripsi modul belum tersedia.'}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/comic/${comic.comicId}`}
                  className="inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-bold text-primary-700"
                >
                  Buka komik, QR &amp; AR
                </Link>
                {data.comic.pdfUrl && (
                  <a
                    href={data.comic.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center rounded-xl border border-white/60 px-4 text-sm font-bold text-white"
                  >
                    Buka PDF
                  </a>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
              <SummaryMetric label="Siswa dalam cakupan" value={data.summary.studentCount} />
              <SummaryMetric label="Mulai belajar" value={data.summary.startedCount} />
              <SummaryMetric label="Sedang belajar" value={data.summary.learningCount} />
              <SummaryMetric label="Tuntas" value={data.summary.completedCount} />
            </div>
            <div className="px-4 pb-4">
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-semibold text-neutral-600">Tingkat penyelesaian</span>
                <span className="font-black text-primary-700">{data.summary.completionRate === null ? '—' : `${data.summary.completionRate}%`}</span>
              </div>
              {data.summary.completionRate !== null
                ? <ProgressBar value={data.summary.completionRate} />
                : <p className="text-xs text-neutral-500">Belum ada siswa dalam cakupan.</p>}
              <p className="mt-2 text-[11px] leading-5 text-neutral-500">
                Mulai berarti ada progress di luar dokumen inisialisasi Cover (misalnya tahap, halaman lanjut, atau aktivitas tersimpan). Tuntas berarti seluruh tahap tersimpan selesai, dibagi seluruh siswa dalam cakupan guru. Progress tidak tersedia bukan 0% penguasaan.
              </p>
              {data.limitations.map((limitation) => (
                <p key={limitation} role="status" className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
                  {limitation}
                </p>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <SectionHeading title="Blueprint pembelajaran" description="Tahap dan jumlah konten mengikuti implementasi modul komik ini." />
            <ol className="mt-3 grid gap-2 sm:grid-cols-2">
              {data.blueprint.map((stage, index) => (
                <li key={stage.id} className="rounded-xl border border-neutral-100 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-neutral-800">{index + 1}. {stage.title}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {stage.available ? `${stage.contentCount} entri konten` : 'Konten khusus tahap ini belum tersedia pada blueprint.'}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-xs font-bold text-primary-700">
                      {stage.completedStudents === null ? '—' : `${stage.completedStudents}/${data.summary.studentCount}`}
                    </span>
                  </div>
                  {data.summary.studentCount > 0 && stage.completedStudents !== null && (
                    <ProgressBar
                      value={(stage.completedStudents / data.summary.studentCount) * 100}
                      className="mt-2"
                    />
                  )}
                  <p className="mt-1 text-[10px] text-neutral-500">
                    {stage.id === 'Report'
                      ? 'Report tidak memiliki status progress tersimpan yang terpisah.'
                      : !stage.available
                        ? 'Status tahap tidak dapat dinilai karena konten khusus belum tersedia.'
                        : 'Siswa dengan tahap tersimpan selesai'}
                  </p>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-4">
            <SectionHeading title="Hasil belajar dan asesmen" description="Pembacaan komik bukan bukti penguasaan. Nilai hanya dari skor tersimpan; rata-rata mengecualikan siswa tanpa skor." />
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
                <h3 className="text-sm font-bold text-neutral-800">Pertanyaan dengan jawaban keliru terbanyak</h3>
                <ul className="mt-2 space-y-2">
                  {data.questions.map((question) => (
                    <li key={question.question} className="rounded-xl bg-neutral-50 p-3">
                      <p className="text-sm font-medium text-neutral-800">{question.question}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {question.incorrectCount} keliru dari {question.answeredCount} jawaban yang tersimpan
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-3 rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600">
                {data.summary.answeredCount > 0
                  ? `Belum ada jawaban keliru yang dapat diidentifikasi dari ${data.summary.answeredCount} jawaban tersimpan.`
                  : 'Belum ada hasil jawaban identifikasi yang tersimpan untuk modul ini.'}
              </p>
            )}
            {data.answers.length > 0 && (
              <details className="mt-3 rounded-xl border border-neutral-100 p-3">
                <summary className="min-h-8 cursor-pointer text-sm font-bold text-primary-700">Lihat 10 jawaban terbaru dari {data.answers.length} catatan</summary>
                <ul className="mt-2 space-y-2">
                  {data.answers.slice(0, 10).map((answer, index) => (
                    <li key={`${answer.studentName}:${answer.question}:${index}`} className="border-t border-neutral-100 pt-2 text-xs">
                      <p className="font-bold text-neutral-800">{answer.studentName} · {answer.question}</p>
                      <p className="mt-1 text-neutral-600">Jawaban: {answer.selectedAnswer}</p>
                      {answer.correctAnswer && <p className="text-neutral-600">Kunci tersimpan: {answer.correctAnswer}</p>}
                      <p className="text-neutral-500">{answer.correct === null ? 'Belum dapat dinilai dari data tersimpan.' : answer.correct ? 'Dinilai benar' : 'Dinilai keliru'} · {formatDate(answer.date)}</p>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </Card>

          <Card className="p-4">
            <SectionHeading title="Siswa yang mungkin memerlukan pendampingan" description="Sinyal berasal dari jawaban asesmen yang dinilai keliru atau keyakinan belajar 1–2/5 yang tersimpan; bukan inferensi dari aktivitas membaca." />
            {supportStudents.length ? (
              <ul className="mt-3 space-y-2">
                {supportStudents.slice(0, 20).map((student) => (
                  <li key={student.uid} className="flex items-start justify-between gap-3 rounded-xl bg-amber-50 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-neutral-900">{student.name}</p>
                      <p className="mt-0.5 text-xs leading-5 text-neutral-700">
                        {student.incorrectAnswers > 0 && `${student.incorrectAnswers} jawaban identifikasi dinilai keliru.`}
                        {student.incorrectAnswers > 0 && student.lowConfidence !== null && student.lowConfidence <= 2 && ' '}
                        {student.lowConfidence !== null && student.lowConfidence <= 2 && `Menyatakan keyakinan belajar ${student.lowConfidence}/5.`}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-xs font-semibold text-neutral-600">
                      {student.progress === null ? 'Progress belum tersedia' : `${student.progress}%`}
                    </span>
                  </li>
                ))}
                {supportStudents.length > 20 && (
                  <li className="text-xs text-neutral-500">
                    Menampilkan 20 dari {supportStudents.length} siswa dengan sinyal pendampingan.
                  </li>
                )}
              </ul>
            ) : (
              <p className="mt-3 rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600">
                Belum ada sinyal asesmen atau refleksi yang tersimpan untuk ditampilkan.
              </p>
            )}
          </Card>

          <Card className="p-4">
            <SectionHeading title="Progress siswa" description="Progress tidak tersedia dibedakan dari 0%; status tuntas memerlukan seluruh tahap tersimpan selesai." />
            {visibleStudents.length ? (
              <>
                <ul className="mt-3 space-y-2">
                  {visibleStudents.map((student) => (
                    <li key={student.uid} className="rounded-xl border border-neutral-100 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-neutral-900">{student.name}</p>
                          <p className="truncate text-xs text-neutral-500">{student.email || 'Email tidak tersedia'}</p>
                        </div>
                        <StatusBadge status={student.status} />
                      </div>
                      {student.progress !== null ? (
                        <div className="mt-2 flex items-center gap-2">
                          <ProgressBar value={student.progress} className="flex-1" />
                          <span className="w-10 text-right text-xs font-bold text-neutral-700">{student.progress}%</span>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-neutral-500">Progress belum tersedia, bukan 0%.</p>
                      )}
                      {(student.quizScore !== null || student.argumentationScore !== null || student.applicationScore !== null) && (
                        <p className="mt-1 text-[11px] text-neutral-500">
                          Nilai tersimpan
                          {student.quizScore !== null && ` · Kuis ${student.quizScore}`}
                          {student.argumentationScore !== null && ` · Argumentasi ${student.argumentationScore}`}
                          {student.applicationScore !== null && ` · Aplikasi ${student.applicationScore}`}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
                {pageCount > 1 && (
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button type="button" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))} className="min-h-11 rounded-xl border border-neutral-200 px-3 text-sm font-semibold disabled:opacity-50">Sebelumnya</button>
                    <span className="text-xs text-neutral-500">Halaman {page + 1} dari {pageCount}</span>
                    <button type="button" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} className="min-h-11 rounded-xl border border-neutral-200 px-3 text-sm font-semibold disabled:opacity-50">Berikutnya</button>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-3 rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600">Belum ada siswa di cakupan modul.</p>
            )}
          </Card>

          <Card className="p-4">
            <SectionHeading title="Aktivitas per tahap" description="Waktu hanya berasal dari timestamp yang tersimpan." />
            {data.activities.length ? (
              <ul className="mt-3 space-y-2">
                {data.activities.map((activity, index) => (
                  <li key={`${activity.studentName}:${activity.stage}:${activity.date ?? index}`} className="flex items-start gap-3 rounded-xl bg-neutral-50 p-3">
                    <span className="mt-0.5 rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-primary-700">{activity.stage}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-neutral-800">{activity.studentName}: {activity.label}</p>
                      <p className="mt-0.5 text-[10px] text-neutral-500">{formatDate(activity.date)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600">Belum ada aktivitas bertimestamp yang tersimpan.</p>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-black text-neutral-900">Analisis AI modul</h3>
                <p className="mt-1 text-xs leading-5 text-neutral-600">Analisis dibuat hanya saat diminta dan menggunakan statistik agregat tanpa identitas siswa.</p>
              </div>
              <button
                type="button"
                onClick={() => void generateInsight()}
                disabled={aiLoading}
                className="min-h-11 rounded-xl bg-primary-600 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {aiLoading ? 'Menganalisis…' : 'Buat analisis'}
              </button>
            </div>
            {aiError && <p role="alert" className="mt-3 rounded-xl bg-error-50 p-3 text-sm text-error-700">{aiError}</p>}
            {insight && <p className="mt-3 whitespace-pre-line rounded-xl bg-primary-50 p-3 text-sm leading-6 text-neutral-800">{insight}</p>}
          </Card>
        </>
      )}
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-neutral-50 p-3">
      <p className="text-sm font-black text-neutral-900">{value}</p>
      <p className="mt-0.5 text-[10px] leading-4 text-neutral-500">{label}</p>
    </div>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h3 className="text-base font-black text-neutral-900">{title}</h3>
      <p className="mt-0.5 text-xs leading-5 text-neutral-600">{description}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: 'not_started' | 'learning' | 'completed' }) {
  const labels = {
    not_started: 'Belum mulai',
    learning: 'Sedang belajar',
    completed: 'Tuntas',
  };
  const classes = {
    not_started: 'bg-neutral-100 text-neutral-700',
    learning: 'bg-blue-50 text-blue-700',
    completed: 'bg-green-50 text-green-700',
  };
  return <span className={`flex-shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${classes[status]}`}>{labels[status]}</span>;
}

function formatDate(value: string | null): string {
  if (!value) return 'Waktu tidak tersimpan';
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
