'use client';

import { useRef, useState } from 'react';
import { auth } from '@/lib/firebase/client';
import { readJsonResponse } from '@/lib/api/readJsonResponse';
import { Card, ProgressBar, Skeleton } from '../components/ui';
import type { ClassInsightAiResult, ClassInsightFacts } from '../services/classInsight';
import type { StudentRow } from '../types';
import { IndividualStudentInsightPanel } from './IndividualStudentInsightPanel';

interface ClassInsightResponse {
  facts: ClassInsightFacts;
  ai: ClassInsightAiResult | null;
  aiError: string | null;
  usage: {
    provider?: string;
    estimatedInputTokens: number;
    maxOutputTokens: number;
    maxProviderAttempts: number;
    actualTokenUsageAvailable: false;
  } | null;
}

interface Props {
  students: StudentRow[];
  studentCount: number;
  dashboardLoading: boolean;
  onSelectStudent: (uid: string) => void;
}

export function AiAssistantPanel({ students, studentCount, dashboardLoading, onSelectStudent }: Props) {
  const [analysis, setAnalysis] = useState<ClassInsightResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestStarted = useRef(false);
  const [mode, setMode] = useState<'class' | 'student'>('class');

  const analyze = async () => {
    if (requestStarted.current || analysis) return;
    requestStarted.current = true;
    setLoading(true);
    setError(null);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Sesi login tidak tersedia. Silakan masuk kembali.');
      const token = await currentUser.getIdToken();
      const endpoint = '/api/dashboard/guru';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'class-insight' }),
        cache: 'no-store',
      });
      const payload = await readJsonResponse<{ error?: string } | ClassInsightResponse>(response, endpoint);
      if (!response.ok) {
        throw new Error('error' in payload && payload.error ? payload.error : 'Analisis kelas gagal dimuat.');
      }
      if (!('facts' in payload) || !payload.facts) throw new Error('Format data analisis tidak valid.');
      setAnalysis(payload);
    } catch (requestError) {
      requestStarted.current = false;
      setError(requestError instanceof Error ? requestError.message : 'Analisis kelas gagal dimuat.');
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div role="tablist" aria-label="Jenis analisis AI" className="grid grid-cols-2 gap-1 rounded-xl bg-white p-1 shadow-sm">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'class'}
          onClick={() => setMode('class')}
          className={`min-h-11 rounded-lg px-3 text-sm font-bold ${mode === 'class' ? 'bg-primary-600 text-white' : 'text-neutral-700'}`}
        >
          Analisis kelas
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'student'}
          onClick={() => setMode('student')}
          className={`min-h-11 rounded-lg px-3 text-sm font-bold ${mode === 'student' ? 'bg-primary-600 text-white' : 'text-neutral-700'}`}
        >
          Analisis individu
        </button>
      </div>
      <div hidden={mode !== 'student'}>
        <IndividualStudentInsightPanel students={students} />
      </div>
      <div hidden={mode !== 'class'} className="space-y-3">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary-600">AI Assistant</p>
            <h2 className="text-lg font-black text-neutral-900">Insight pembelajaran kelas</h2>
            <p className="mt-1 text-xs leading-5 text-neutral-600">
              Fakta dihitung dari seluruh roster siswa, progress, asesmen, refleksi, dan aktivitas yang tersedia.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void analyze()}
            disabled={loading || dashboardLoading || studentCount === 0 || Boolean(analysis)}
            className="min-h-11 w-full flex-shrink-0 rounded-xl bg-primary-600 px-4 text-sm font-bold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {loading ? 'Memuat data & menganalisis…' : analysis ? 'Snapshot analisis dimuat' : 'Analisis kelas'}
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-error-50 px-3 py-2 text-sm text-error-700">
            {error}
          </p>
        )}
        {dashboardLoading && (
          <div className="mt-4 space-y-2" aria-label="Memuat data dashboard">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
          </div>
        )}
        {!dashboardLoading && studentCount === 0 && (
          <p className="mt-3 rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600">
            Belum ada siswa dalam cakupan. Analisis tidak dijalankan dan tidak ada pemanggilan model AI.
          </p>
        )}
        {!analysis && !loading && !error && studentCount > 0 && (
          <p className="mt-3 rounded-xl bg-neutral-50 p-3 text-sm leading-5 text-neutral-600">
            Pilih analisis untuk mengambil snapshot terbaru. Fakta kelas ditampilkan terpisah dari interpretasi dan rekomendasi AI.
          </p>
        )}
        {analysis && (
          <p className="mt-2 text-[10px] leading-5 text-neutral-500">
            Analisis dibatasi satu kali per akun setiap 60 detik. Muat ulang dashboard setelah jeda tersebut untuk mengambil snapshot baru.
          </p>
        )}
      </Card>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-52 rounded-2xl" />
        </div>
      )}

      {analysis && !loading && (
        <>
          <FactsSummary facts={analysis.facts} />
          <ComicMastery facts={analysis.facts} />
          <LearningDifficulties facts={analysis.facts} />
          <AttentionList facts={analysis.facts} onSelectStudent={onSelectStudent} />
          <ActivityTrend facts={analysis.facts} />
          <AiInterpretation ai={analysis.ai} error={analysis.aiError} />
          <DataLimitations facts={analysis.facts} usage={analysis.usage} />
        </>
      )}
      </div>
    </div>
  );
}

function FactsSummary({ facts }: { facts: ClassInsightFacts }) {
  const summary = facts.summary;
  const measuredAt = new Date(facts.generatedAt);
  return (
    <Card className="p-4 sm:p-5">
      <SectionHeading
        eyebrow="Fakta terukur"
        title="Ringkasan kondisi kelas"
        description={`Snapshot ${formatDate(measuredAt.toISOString())}. Progress rata-rata hanya menghitung ${summary.recordedProgressCount} dokumen progress yang memiliki nilai tersimpan.`}
      />
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Siswa dalam cakupan" value={facts.scope.studentCount} />
        <Metric label="Mulai belajar" value={summary.studentsStarted} />
        <Metric label="Tuntas ≥1 komik" value={summary.studentsCompletedAnyComic} />
        <Metric label="Tanpa progress tercatat" value={summary.studentsWithNoRecordedProgress} />
      </div>
      <div className="mt-2 rounded-xl bg-primary-50 p-3">
        <p className="text-xs font-semibold text-primary-700">Rata-rata progress tersimpan</p>
        <p className="mt-1 text-2xl font-black text-primary-900">
          {summary.averageRecordedProgress === null ? 'Belum tersedia' : `${summary.averageRecordedProgress}%`}
        </p>
        <p className="mt-1 text-[11px] leading-5 text-neutral-600">
          Rata-rata dari progress komik tersimpan; bukan ukuran penguasaan materi.
        </p>
      </div>
      {facts.assessments.length > 0 && (
        <div className="mt-3">
          <h3 className="text-sm font-bold text-neutral-800">Skor asesmen yang tersimpan</h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {facts.assessments.map((assessment) => (
              <li key={assessment.type} className="flex items-center justify-between gap-2 rounded-xl bg-neutral-50 p-3">
                <span className="text-xs text-neutral-700">{assessment.type}</span>
                <span className="flex-shrink-0 text-sm font-black text-neutral-900">
                  {assessment.averageScore} <span className="text-[10px] font-normal text-neutral-500">({assessment.recordCount} nilai)</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[10px] text-neutral-500">Skor ditampilkan terpisah sesuai jenisnya; skala antarasesmen tidak diasumsikan sama.</p>
        </div>
      )}
    </Card>
  );
}

function ComicMastery({ facts }: { facts: ClassInsightFacts }) {
  return (
    <Card className="p-4 sm:p-5">
      <SectionHeading
        eyebrow="Progress & asesmen"
        title="Penguasaan materi per komik"
        description="Progress tahap dan skor asesmen adalah indikator berbeda; pembacaan komik tidak dianggap sebagai penguasaan."
      />
      {facts.comics.length ? (
        <ul className="mt-3 space-y-2">
          {facts.comics.map((comic) => (
            <li key={comic.comicId} className="rounded-xl border border-neutral-100 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-sm font-bold text-neutral-900">Komik {comic.comicId}: {comic.title}</h3>
                  <p className="mt-1 text-[11px] text-neutral-600">
                    Mulai {comic.studentsStarted} · Tuntas seluruh tahap {comic.studentsCompleted} dari {facts.scope.studentCount}
                  </p>
                </div>
                <span className="flex-shrink-0 text-xs font-bold text-primary-700">
                  {comic.averageRecordedProgress === null ? '—' : `${comic.averageRecordedProgress}%`}
                </span>
              </div>
              {comic.averageRecordedProgress !== null && (
                <ProgressBar value={comic.averageRecordedProgress} className="mt-2" />
              )}
              <p className="mt-1 text-[10px] text-neutral-500">
                Progress tercatat: {comic.progressRecordCount}/{facts.scope.studentCount} siswa
              </p>
              {comic.assessmentSummaries.length > 0 && (
                <p className="mt-2 text-[11px] leading-5 text-neutral-600">
                  {comic.assessmentSummaries.map((assessment) =>
                    `${assessment.type}: rata-rata ${assessment.averageScore} (${assessment.recordCount} nilai)`
                  ).join(' · ')}
                </p>
              )}
              <details className="mt-2">
                <summary className="min-h-9 cursor-pointer text-xs font-bold text-primary-700">Rincian tahap tersimpan</summary>
                <ul className="mt-1 grid grid-cols-2 gap-1">
                  {comic.stages.map((stage) => (
                    <li key={stage.name} className="rounded-lg bg-neutral-50 px-2 py-1.5 text-[10px] text-neutral-700">
                      {stage.name}: {stage.completedStudents}/{stage.denominator}
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyNotice text="Katalog komik belum memuat modul yang dapat dianalisis." />
      )}
    </Card>
  );
}

function LearningDifficulties({ facts }: { facts: ClassInsightFacts }) {
  return (
    <Card className="p-4 sm:p-5">
      <SectionHeading
        eyebrow="Bukti asesmen"
        title="Kesulitan yang sering muncul"
        description="Dihitung dari jawaban identifikasi yang memiliki jawaban siswa dan kunci jawaban."
      />
      {facts.difficulties.length ? (
        <ul className="mt-3 space-y-2">
          {facts.difficulties.map((difficulty) => (
            <li key={`${difficulty.comicId}:${difficulty.question}`} className="rounded-xl bg-amber-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 text-sm font-semibold text-neutral-800">{difficulty.question}</p>
                <span className="flex-shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-amber-800">
                  {difficulty.incorrectCount} keliru
                </span>
              </div>
              <p className="mt-1 text-xs text-neutral-600">Komik {difficulty.comicId}: {difficulty.comicTitle}</p>
              <p className="text-[10px] text-neutral-500">
                {difficulty.incorrectCount}/{difficulty.judgedAnswerCount} jawaban yang dapat dinilai
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyNotice text="Belum ditemukan jawaban keliru yang dapat diidentifikasi, atau kunci jawaban tidak tersedia." />
      )}
    </Card>
  );
}

function AttentionList({ facts, onSelectStudent }: { facts: ClassInsightFacts; onSelectStudent: (uid: string) => void }) {
  return (
    <Card className="p-4 sm:p-5">
      <SectionHeading
        eyebrow="Indikator, bukan label"
        title="Siswa untuk ditinjau bersama"
        description="Hanya ditampilkan bila ada sedikitnya dua indikator terukur. Tidak menyimpulkan karakter atau diagnosis siswa."
      />
      {facts.attentionStudents.length ? (
        <ul className="mt-3 space-y-2">
          {facts.attentionStudents.map((student) => (
            <li key={student.uid} className="rounded-xl border border-amber-100 bg-amber-50 p-3">
              <button
                type="button"
                onClick={() => onSelectStudent(student.uid)}
                className="min-h-9 text-left text-sm font-bold text-primary-800 underline decoration-primary-300 underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
              >
                {student.name}
              </button>
              <ul className="mt-1 space-y-1">
                {student.reasons.map((reason) => (
                  <li key={reason} className="text-xs leading-5 text-neutral-700">• {reason}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyNotice text="Belum ada siswa dengan dua atau lebih indikator pendampingan yang dapat dihitung." />
      )}
    </Card>
  );
}

function ActivityTrend({ facts }: { facts: ClassInsightFacts }) {
  const hasActivities = facts.scope.learningActivityRecords > 0;
  const max = Math.max(1, ...facts.activityByWeek.map((week) => week.eventCount));
  return (
    <Card className="p-4 sm:p-5">
      <SectionHeading
        eyebrow="Riwayat tersimpan"
        title="Aktivitas belajar per pekan"
        description="Ini jumlah event aktivitas bertimestamp dalam delapan pekan terakhir, bukan tren persentase progress."
      />
      {hasActivities ? (
        <div className="mt-3 space-y-2">
          {facts.activityByWeek.map((week) => (
            <div key={week.weekStarting} className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-2">
              <span className="text-[10px] text-neutral-600">{formatWeek(week.weekStarting)}</span>
              <ProgressBar value={(week.eventCount / max) * 100} />
              <span className="text-right text-xs font-bold text-neutral-800">{week.eventCount}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyNotice text="Belum ada activity bertimestamp; tren aktivitas tidak dapat dibuat." />
      )}
      <p className="mt-3 text-[10px] leading-5 text-neutral-500">
        Struktur progress saat ini hanya menyimpan status terkini, bukan snapshot historis. Karena itu tren progress dari waktu ke waktu belum dapat dihitung.
      </p>
    </Card>
  );
}

function AiInterpretation({ ai, error }: { ai: ClassInsightAiResult | null; error: string | null }) {
  return (
    <Card className="p-4 sm:p-5">
      <SectionHeading
        eyebrow="Interpretasi model"
        title="Interpretasi & strategi"
        description="Model menerima agregat anonim saja. Fakta terukur di bagian lain berasal langsung dari data tersimpan."
      />
      {error && (
        <p role="status" className="mt-3 rounded-xl bg-warning-50 p-3 text-sm text-warning-800">
          {error}
        </p>
      )}
      {ai ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-xl bg-primary-50 p-3">
            <h3 className="text-xs font-bold text-primary-700">Interpretasi AI</h3>
            <p className="mt-1 text-sm leading-6 text-neutral-800">{ai.interpretation}</p>
          </div>
          {ai.recommendations.length > 0 ? (
            <div className="rounded-xl bg-green-50 p-3">
              <h3 className="text-xs font-bold text-green-800">Strategi yang dapat dicoba</h3>
              <ol className="mt-2 space-y-2">
                {ai.recommendations.map((recommendation, index) => (
                  <li key={`${index}:${recommendation}`} className="flex gap-2 text-sm leading-5 text-neutral-800">
                    <span className="font-black text-green-800">{index + 1}.</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <EmptyNotice text="Model tidak memberikan rekomendasi yang tervalidasi." />
          )}
          {ai.limitations.length > 0 && (
            <ul className="space-y-1 text-xs leading-5 text-neutral-600">
              {ai.limitations.map((limitation) => <li key={limitation}>• {limitation}</li>)}
            </ul>
          )}
        </div>
      ) : !error ? (
        <EmptyNotice text="Analisis AI tidak dijalankan karena bukti belajar belum cukup." />
      ) : null}
    </Card>
  );
}

function DataLimitations({ facts, usage }: { facts: ClassInsightFacts; usage: ClassInsightResponse['usage'] }) {
  return (
    <Card className="p-4">
      <details>
        <summary className="min-h-9 cursor-pointer text-sm font-bold text-neutral-800">
          Periode, cakupan data &amp; keterbatasan
        </summary>
        <div className="mt-2 space-y-2 text-xs leading-5 text-neutral-600">
          <p>Data dihitung pada: {formatDate(facts.generatedAt)}.</p>
          <p>
            Periode riwayat bertimestamp: {facts.historyPeriod.from && facts.historyPeriod.to
              ? `${formatDate(facts.historyPeriod.from)} – ${formatDate(facts.historyPeriod.to)}`
              : 'tidak tersedia'}.
          </p>
          <p>
            Sumber: {facts.scope.studentCount} siswa, {facts.scope.comicCount} komik, {facts.scope.assessmentRecords} jawaban asesmen, {facts.scope.activityRecords} aktivitas, {facts.scope.applicationRecords} aktivitas aplikasi, dan {facts.scope.reflectionRecords} refleksi.
          </p>
          {facts.limitations.map((limitation) => <p key={limitation}>• {limitation}</p>)}
          {usage && (
            <p>
              Penggunaan AI: 1 permintaan router, maksimal {usage.maxProviderAttempts} percobaan provider jika terjadi fallback, estimasi input ±{usage.estimatedInputTokens} token (perkiraan dari karakter), batas output {usage.maxOutputTokens} token
              {usage.provider ? `, provider ${usage.provider}` : ''}. Token aktual/biaya tidak tersedia dari respons provider. Router dapat berpindah provider saat gagal; harga bergantung konfigurasi provider.
            </p>
          )}
        </div>
      </details>
    </Card>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-primary-600">{eyebrow}</p>
      <h3 className="mt-0.5 text-base font-black text-neutral-900">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-neutral-600">{description}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-neutral-50 p-3">
      <p className="text-lg font-black text-neutral-900">{value}</p>
      <p className="text-[10px] leading-4 text-neutral-600">{label}</p>
    </div>
  );
}

function EmptyNotice({ text }: { text: string }) {
  return <p className="mt-3 rounded-xl bg-neutral-50 p-3 text-sm leading-5 text-neutral-600">{text}</p>;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'waktu tidak tersedia';
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatWeek(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(date)
    : value;
}
