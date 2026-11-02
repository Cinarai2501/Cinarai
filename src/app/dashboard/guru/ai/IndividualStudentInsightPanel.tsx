'use client';

import { useEffect, useRef, useState } from 'react';
import { auth } from '@/lib/firebase/client';
import { readJsonResponse } from '@/lib/api/readJsonResponse';
import { getInternalAiRetryAfter } from '@/lib/ai/rateLimitResponse';
import type { StudentRow } from '../types';
import { Card, LoadingState, ProgressBar, SearchInput, Skeleton } from '../components/ui';
import { releaseAiRequestLock, tryAcquireAiRequestLock } from './aiRequestLock';
import type { StudentInsightAiResult, StudentInsightEvidence, StudentInsightFacts } from '../services/studentInsight';

interface StudentInsightResponse {
  student: {
    uid: string;
    displayName: string;
    email: string;
    schoolName: string;
    classLevel: string | null;
    gradeLevel: number | null;
  };
  facts: StudentInsightFacts;
  ai: StudentInsightAiResult | null;
  aiError: string | null;
  usage: {
    provider?: string;
    fallbackUsed?: boolean;
    estimatedInputTokens: number;
    maxOutputTokens: number;
    maxProviderAttempts: number;
    actualTokenUsageAvailable: false;
  } | null;
  analysisGeneratedAt?: string;
  cacheHit?: boolean;
  cacheWarning?: string | null;
}

type ReportSection = 'summary' | 'capabilities' | 'activity' | 'evidence' | 'difficulties' | 'recommendations';

const sectionLabels: Array<{ id: ReportSection; label: string }> = [
  { id: 'summary', label: 'Ringkasan' },
  { id: 'capabilities', label: 'Kemampuan' },
  { id: 'activity', label: 'Perilaku belajar' },
  { id: 'evidence', label: 'Bukti pendukung' },
  { id: 'difficulties', label: 'Kesulitan' },
  { id: 'recommendations', label: 'Rekomendasi guru' },
];

export function IndividualStudentInsightPanel({ students }: { students: StudentRow[] }) {
  const [search, setSearch] = useState('');
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [section, setSection] = useState<ReportSection>('summary');
  const [report, setReport] = useState<StudentInsightResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewedRecommendations, setReviewedRecommendations] = useState<Set<number>>(new Set());
  const requestStarted = useRef(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);

  useEffect(() => {
    if (retryAfterSeconds <= 0) return;
    const timer = window.setTimeout(() => setRetryAfterSeconds((remaining) => Math.max(0, remaining - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [retryAfterSeconds]);

  const selectedStudent = students.find((student) => student.uid === selectedUid) ?? null;
  const matches = !selectedUid && search.trim()
    ? students.filter((student) =>
      student.displayName.toLocaleLowerCase('id').includes(search.trim().toLocaleLowerCase('id'))
    )
      .slice(0, 6)
    : [];

  const selectStudent = (student: StudentRow) => {
    if (loading) return;
    setSelectedUid(student.uid);
    setSearch(student.displayName);
    setReport(null);
    setSection('summary');
    setError(null);
    setReviewedRecommendations(new Set());
    setRetryAfterSeconds(0);
  };

  const generate = async (refresh = false) => {
    if (!selectedUid || loading || (report && !refresh) || !tryAcquireAiRequestLock(requestStarted)) return;
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
        body: JSON.stringify({ action: 'student-insight', studentUid: selectedUid, refresh }),
        cache: 'no-store',
      });
      const payload = await readJsonResponse<{ error?: string } | StudentInsightResponse>(response, endpoint);
      setRetryAfterSeconds(getInternalAiRetryAfter(response, payload));
      if (!response.ok) {
        throw new Error('error' in payload && payload.error ? payload.error : 'Analisis individu gagal dimuat.');
      }
      if (!('facts' in payload) || !payload.facts || !('student' in payload) || !payload.student) {
        throw new Error('Format data analisis individu tidak valid.');
      }
      setReport(payload);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Analisis individu gagal dimuat.');
    } finally {
      releaseAiRequestLock(requestStarted);
      setLoading(false);
    }
  };

  const toggleReviewed = (index: number) => {
    setReviewedRecommendations((previous) => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <Card className="p-4 sm:p-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-700">Analisis individu</p>
        <h2 className="guru-section-title">Tinjau perkembangan siswa</h2>
        <p className="mt-1 text-xs leading-5 text-secondary-content">
          Pilih siswa untuk meninjau kemampuan, aktivitas, bukti belajar, dan rekomendasi tindak lanjut.
        </p>
      </div>

      <div className="relative mt-3">
        <label htmlFor="student-insight-search" className="mb-1 block text-xs font-bold text-secondary-content">
          Pilih siswa
        </label>
        <SearchInput
          id="student-insight-search"
          value={search}
          disabled={loading}
          onChange={(event) => {
            setSearch(event.target.value);
            if (selectedUid) {
              setSelectedUid(null);
              setReport(null);
              setError(null);
              requestStarted.current = false;
            }
          }}
          placeholder="Ketik nama siswa…"
          autoComplete="off"
        />
        {matches.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-ui-border bg-white p-1 shadow-lg">
            {matches.map((student) => (
              <li key={student.uid}>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => selectStudent(student)}
                  className="min-h-12 w-full rounded-lg px-3 py-2 text-left hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="block truncate text-sm font-bold text-ink">{student.displayName || 'Siswa'}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {search.trim() && !selectedUid && matches.length === 0 && (
        <p className="mt-2 rounded-xl bg-canvas p-3 text-sm text-secondary-content">
          Tidak ada siswa yang cocok dalam daftar yang tersedia.
        </p>
      )}
      {!students.length && (
        <p className="mt-2 rounded-xl bg-canvas p-3 text-sm text-secondary-content">
          Belum ada siswa yang dapat dipilih dalam cakupan akun ini.
        </p>
      )}

      {selectedStudent && (
        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-brand-100 bg-brand-50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-brand-950">{selectedStudent.displayName || 'Siswa'}</p>
          </div>
          <button
            type="button"
            onClick={() => void generate(Boolean(report))}
            disabled={loading || retryAfterSeconds > 0}
            className="min-h-11 w-full flex-shrink-0 rounded-xl bg-brand-700 px-4 text-sm font-bold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {loading
              ? 'Mengambil bukti & menganalisis…'
              : retryAfterSeconds > 0
                ? `Coba lagi dalam ${retryAfterSeconds} dtk`
                : report
                  ? 'Perbarui analisis'
                  : 'Buat analisis'}
          </button>
        </div>
      )}
      {retryAfterSeconds > 0 && (
        <p role="status" className="mt-2 text-xs text-secondary-content">
          Batas 5 permintaan per menit untuk siswa ini. Coba lagi setelah hitung mundur selesai.
        </p>
      )}
      {error && <p role="alert" className="mt-3 rounded-xl bg-error-50 p-3 text-sm text-error-700">{error}</p>}
      {report?.cacheWarning && (
        <p role="status" className="mt-2 text-xs text-warning-800">{report.cacheWarning}</p>
      )}
      {loading && (
        <LoadingState label="Memuat analisis individu">
          <div className="mt-3 space-y-2">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        </LoadingState>
      )}

      {report && !loading && (
        <div className="mt-4">
          <div className="mb-3 rounded-xl bg-canvas p-3">
            <p className="text-xs font-bold text-ink">Profil pembelajaran</p>
            <p className="mt-1 text-xs text-secondary-content">
              {report.student.schoolName || 'Sekolah tidak tercatat'}
              {report.student.classLevel ? ` · ${report.student.classLevel}` : ''}
              {!report.student.classLevel && report.student.gradeLevel !== null ? ` · Kelas ${report.student.gradeLevel}` : ''}
            </p>
            <p className="mt-1 text-[10px] text-secondary-content">
              Terakhir dianalisis {report.analysisGeneratedAt ? formatDate(report.analysisGeneratedAt) : formatDate(report.facts.generatedAt)}
              {report.cacheHit ? ' · cache (data belum berubah)' : ''}
              <span className="block">Periode bukti {report.facts.dataPeriod.from && report.facts.dataPeriod.to
                ? `${formatDate(report.facts.dataPeriod.from)} – ${formatDate(report.facts.dataPeriod.to)}`
                : 'tidak tersedia'}</span>
            </p>
          </div>

          <div role="tablist" aria-label="Bagian laporan individu" className="grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1 sm:grid-cols-3">
            {sectionLabels.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={section === item.id}
                onClick={() => setSection(item.id)}
                className={`min-h-11 rounded-lg px-2 text-xs font-bold ${
                  section === item.id ? 'bg-white text-brand-800 shadow-sm' : 'text-secondary-content'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div role="tabpanel" className="mt-3 space-y-3">
            {section === 'summary' && (
              <SummarySection report={report} />
            )}
            {section === 'capabilities' && (
              <CapabilitiesSection facts={report.facts} />
            )}
            {section === 'activity' && (
              <ActivitySection facts={report.facts} />
            )}
            {section === 'evidence' && (
              <EvidenceSection facts={report.facts} />
            )}
            {section === 'difficulties' && (
              <DifficultiesSection facts={report.facts} />
            )}
            {section === 'recommendations' && (
              <RecommendationsSection
                report={report}
                reviewed={reviewedRecommendations}
                onToggleReviewed={toggleReviewed}
              />
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function SummarySection({ report }: { report: StudentInsightResponse }) {
  const { facts, ai, aiError } = report;
  const modulesWithProgress = facts.modules.filter((module) => module.progressAvailable).length;
  return (
    <section className="space-y-3">
      <div className="rounded-xl border border-brand-100 bg-brand-50 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Ringkasan AI · bukan fakta tersimpan</p>
        {ai ? (
          <>
            <p className="mt-1 line-clamp-5 text-sm leading-6 text-ink">{ai.summary}</p>
            <EvidenceReferences keys={ai.summaryEvidenceKeys} evidence={facts.evidence} />
          </>
        ) : (
          <p role="status" className="mt-1 text-sm leading-5 text-secondary-content">
            {aiError ?? 'Interpretasi AI belum tersedia. Fakta tersimpan tetap dapat ditinjau pada bagian lain.'}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Metric label="Modul dengan progress" value={`${modulesWithProgress}/${facts.modules.length}`} />
        <Metric label="Komik berstatus selesai" value={facts.modules.filter((module) => module.status === 'completed').length} />
        <Metric label="Jawaban dapat dinilai" value={facts.modules.reduce((sum, module) => sum + module.answers.judgedCount, 0)} />
        <Metric label="Event aktivitas tersimpan" value={facts.activity.recordCount} />
      </div>
      {ai?.findings.length ? (
        <div className="rounded-xl bg-canvas p-3">
          <h3 className="text-xs font-bold text-ink">Temuan yang perlu ditinjau</h3>
          <ul className="mt-2 space-y-2">
            {ai.findings.map((finding, index) => (
              <li key={`${index}:${finding.text}`} className="text-sm leading-5 text-secondary-content">
                {finding.text}
                <EvidenceReferences keys={finding.evidenceKeys} evidence={facts.evidence} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function CapabilitiesSection({ facts }: { facts: StudentInsightFacts }) {
  const correctAnswers = facts.modules.reduce((sum, module) => sum + module.answers.correctCount, 0);
  const incorrectAnswers = facts.modules.reduce((sum, module) => sum + module.answers.incorrectCount, 0);
  const modulesInProgress = facts.modules.filter((module) => module.status === 'learning').length;
  return (
    <section className="space-y-3">
      <p className="rounded-xl bg-canvas p-3 text-xs leading-5 text-secondary-content">
        Tahap selesai dan jawaban benar adalah bukti pada aktivitas yang tercatat, bukan kesimpulan penguasaan. Jawaban hanya dinilai bila kunci tersedia.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Metric label="Jawaban dinilai benar" value={correctAnswers} />
        <Metric label="Progress tahap berjalan" value={modulesInProgress} />
        <Metric label="Jawaban untuk ditinjau" value={incorrectAnswers} />
      </div>
      {facts.modules.map((module) => (
        <article key={module.comicId} className="rounded-xl border border-ui-border bg-white p-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 text-sm font-bold text-ink">{module.title}</h3>
            {module.progressAvailable && module.percentage !== null && (
              <span className="flex-shrink-0 text-xs font-bold text-brand-700">{module.percentage}%</span>
            )}
          </div>
          {!module.progressAvailable && !module.answers.recordCount && !module.assessments.length ? (
            <p className="mt-2 text-xs text-secondary-content">Belum ada data progress, jawaban terukur, atau asesmen untuk modul ini.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {module.progressAvailable && (
                <>
                  {module.percentage !== null && <ProgressBar value={module.percentage} />}
                  <p className="text-xs text-secondary-content">
                    {module.completedStages.length}/{module.completedStages.length + module.remainingStages.length} tahap tersedia tercatat selesai
                  </p>
                  {(module.completedStages.length > 0 || module.remainingStages.length > 0) && (
                    <details className="rounded-lg bg-canvas px-2 py-1">
                      <summary className="min-h-11 cursor-pointer text-xs font-semibold text-brand-800">Rincian tahap</summary>
                      <p className="text-xs leading-5 text-secondary-content">
                        Selesai: {module.completedStages.join(', ') || 'Belum ada'}.
                        {' '}Belum tercatat selesai: {module.remainingStages.join(', ') || 'Tidak ada'}.
                      </p>
                    </details>
                  )}
                </>
              )}
              {module.answers.recordCount > 0 && (
                <p className="text-xs text-secondary-content">
                  Jawaban tersimpan {module.answers.recordCount}; dapat dinilai {module.answers.judgedCount}; benar {module.answers.correctCount}; keliru {module.answers.incorrectCount}.
                </p>
              )}
              {module.assessments.map((assessment) => (
                <p key={assessment.type} className="text-xs text-secondary-content">
                  {assessment.type}: {assessment.score} (skala tidak dinormalisasi)
                </p>
              ))}
              {module.progressAvailable && (
                <EvidenceReferences keys={[`progress:${module.comicId}`]} evidence={facts.evidence} />
              )}
              {module.answers.judgedCount > 0 && (
                <EvidenceReferences keys={[`answers:${module.comicId}`]} evidence={facts.evidence} />
              )}
              {module.assessments.length > 0 && (
                <EvidenceReferences keys={[`assessment:${module.comicId}`]} evidence={facts.evidence} />
              )}
            </div>
          )}
        </article>
      ))}
      {facts.assessments.map((assessment) => (
        <p key={assessment.type} className="rounded-xl bg-brand-50 p-3 text-xs text-secondary-content">
          {assessment.type}: {assessment.score}/{assessment.maximum}
          <EvidenceReferences keys={['assessment:evaluation-cinarai']} evidence={facts.evidence} />
        </p>
      ))}
    </section>
  );
}

function EvidenceSection({ facts }: { facts: StudentInsightFacts }) {
  return (
    <section className="space-y-3">
      <EvidenceList evidence={facts.evidence} />
      {facts.limitations.length > 0 && (
        <div className="rounded-xl border border-warning-100 bg-warning-50 p-3">
          <h3 className="text-sm font-bold text-ink">Hal yang perlu diperhatikan</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-secondary-content">
            {facts.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
          </ul>
        </div>
      )}
      <details className="rounded-xl border border-ui-border bg-white p-3">
        <summary className="min-h-11 cursor-pointer text-sm font-bold text-ink">
          Cakupan dan batas analisis
        </summary>
        <div className="mt-2 space-y-1 text-xs leading-5 text-secondary-content">
          <p>Data dibaca per halaman hingga seluruh sumber tersedia; halaman berisi maksimal {facts.sample.limitPerQuery} dokumen.</p>
          <p>Jawaban dan refleksi mentah tidak dikirim ke AI. Progress tahap bukan bukti penguasaan materi.</p>
          {facts.sample.mayBeTruncated && <p>Data yang tersedia mungkin belum mencakup seluruh catatan siswa.</p>}
        </div>
      </details>
    </section>
  );
}

function DifficultiesSection({ facts }: { facts: StudentInsightFacts }) {
  const difficulties = facts.modules.flatMap((module) =>
    module.answers.questions
      .filter((question) => question.incorrectCount > 0)
      .map((question) => ({ ...question, comicId: module.comicId, title: module.title }))
  );

  return (
    <section className="space-y-3">
      {difficulties.length ? (
        <ul className="space-y-2">
          {difficulties.map((question) => (
            <li key={`${question.comicId}:${question.step}`} className="rounded-xl border border-warning-100 bg-warning-50 p-3">
              <p className="text-sm font-semibold text-ink">{question.question}</p>
              <p className="mt-1 text-xs text-secondary-content">
                {question.title} · {question.incorrectCount} keliru dari {question.judgedCount} jawaban yang dinilai
              </p>
              <EvidenceReferences keys={[`answers:${question.comicId}`]} evidence={facts.evidence} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl bg-canvas p-3 text-sm leading-5 text-secondary-content">
          Belum ada kesulitan yang dapat diukur dari jawaban tersimpan.
        </p>
      )}
    </section>
  );
}

function ActivitySection({ facts }: { facts: StudentInsightFacts }) {
  const weeklyActivity = facts.activity.byWeek.filter((week) =>
    Number.isFinite(week.count) && week.count >= 0 && Number.isFinite(Date.parse(week.weekStarting))
  );
  const max = Math.max(1, ...weeklyActivity.map((week) => week.count));
  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Metric label="Aktivitas tercatat" value={facts.activity.recordCount} />
        <Metric label="Hari dengan catatan" value={facts.activity.activeDays} />
        <Metric label="Penyelesaian tercatat" value={facts.activity.completedEvents} />
        <Metric label="Aktivitas penerapan" value={facts.application.recordCount} />
      </div>
      {!facts.activity.recordCount && (
        <p className="rounded-xl bg-canvas p-3 text-sm text-secondary-content">
          Belum ada aktivitas bertimestamp. Frekuensi dan konsistensi tidak dapat dinilai; ketiadaan catatan bukan bukti tidak belajar.
        </p>
      )}
      {weeklyActivity.length > 0 && (
        <div className="rounded-xl border border-ui-border p-3">
          <h3 className="text-xs font-bold text-ink">Aktivitas tercatat per pekan</h3>
          <div className="mt-2 space-y-2">
            {weeklyActivity.map((week) => (
              <div key={week.weekStarting} className="grid grid-cols-[4.5rem_minmax(0,1fr)_1.5rem] items-center gap-2">
                <span className="text-[10px] leading-4 text-secondary-content">{formatDate(week.weekStarting)}</span>
                <ProgressBar value={(week.count / max) * 100} />
                <span className="text-right text-xs font-bold">{week.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {facts.activity.byType.map((item) => (
              <span key={item.type} className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] text-neutral-700">
                {activityTypeLabel(item.type)}: {item.count}
              </span>
            ))}
          </div>
          <EvidenceReferences keys={['activity:frequency']} evidence={facts.evidence} />
          {facts.activity.completedEvents > 0 && <EvidenceReferences keys={['activity:completion']} evidence={facts.evidence} />}
        </div>
      )}
      <div className="rounded-xl border border-ui-border p-3">
        <h3 className="text-xs font-bold text-ink">Penerapan dan refleksi</h3>
        <p className="mt-2 text-xs text-secondary-content">
          Feedback aktivitas penerapan: {facts.application.feedbackByType.map((item) => `${item.type} ${item.count}`).join(', ') || 'belum tersedia'}.
        </p>
        <p className="mt-1 text-xs text-secondary-content">
          Refleksi: {facts.reflection.recordCount}; rating tersedia {facts.reflection.ratedCount}
          {facts.reflection.averageRating !== null ? ` (rerata ${facts.reflection.averageRating})` : ''}; confidence tersedia {facts.reflection.confidenceCount}
          {facts.reflection.averageConfidence !== null ? ` (rerata ${facts.reflection.averageConfidence}/5)` : ''}.
        </p>
        {facts.application.recordCount > 0 && <EvidenceReferences keys={['application:feedback']} evidence={facts.evidence} />}
        {facts.reflection.recordCount > 0 && <EvidenceReferences keys={['reflection:ratings']} evidence={facts.evidence} />}
        <p className="mt-2 text-[10px] leading-5 text-secondary-content">
          Catatan aktivitas menunjukkan interaksi yang tersimpan, bukan ukuran motivasi atau kepribadian dan bukan tren progress historis.
        </p>
      </div>
    </section>
  );
}

function RecommendationsSection({
  report,
  reviewed,
  onToggleReviewed,
}: {
  report: StudentInsightResponse;
  reviewed: Set<number>;
  onToggleReviewed: (index: number) => void;
}) {
  const recommendations = report.ai?.recommendations ?? [];
  return (
    <section className="space-y-3">
      {report.aiError && (
        <p role="status" className="rounded-xl bg-warning-50 p-3 text-sm text-warning-800">{report.aiError}</p>
      )}
      {report.ai?.limitations.map((limitation, index) => (
        <div key={`${index}:${limitation.text}`} className="rounded-xl bg-canvas p-3 text-xs text-secondary-content">
          {limitation.text}
          <EvidenceReferences keys={limitation.evidenceKeys} evidence={report.facts.evidence} />
        </div>
      ))}
      {recommendations.length ? recommendations.map((recommendation, index) => (
        <article key={`${index}:${recommendation.text}`} className="rounded-xl border border-success-100 bg-success-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-success-800">{categoryLabel(recommendation.category)}</p>
          <p className="mt-1 text-sm leading-5 text-ink">{recommendation.text}</p>
          <EvidenceReferences keys={recommendation.evidenceKeys} evidence={report.facts.evidence} />
          <p className="mt-2 text-xs text-secondary-content"><strong>Indikator berikutnya:</strong> {recommendation.nextIndicator}</p>
          <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-2 text-xs font-semibold text-secondary-content">
            <input
              type="checkbox"
              checked={reviewed.has(index)}
              onChange={() => onToggleReviewed(index)}
              className="h-4 w-4 accent-success-700"
            />
            Sudah ditinjau guru
          </label>
        </article>
      )) : (
        <p className="rounded-xl bg-canvas p-3 text-sm text-secondary-content">
          Rekomendasi tidak tersedia. Tinjau data sumber secara langsung sebelum menentukan tindak lanjut.
        </p>
      )}
      <p className="text-[10px] leading-5 text-secondary-content">
        Status tinjauan hanya tersimpan sementara di halaman ini. Laporan AI tidak disimpan sebagai fakta permanen.
      </p>
    </section>
  );
}

function EvidenceReferences({ keys, evidence }: { keys: string[]; evidence: StudentInsightEvidence[] }) {
  const referenced = keys.flatMap((key) => {
    const item = evidence.find((source) => source.key === key);
    return item ? [item] : [];
  });
  if (!referenced.length) return null;
  return (
    <details className="mt-2 rounded-lg bg-white/70 px-2 py-1.5">
      <summary className="min-h-8 cursor-pointer text-[10px] font-bold text-brand-800">
        Lihat bukti ({referenced.length})
      </summary>
      <ul className="space-y-1 pb-1 text-[11px] leading-5 text-secondary-content">
        {referenced.map((item) => <li key={item.key}><strong>{item.label}:</strong> {item.detail}</li>)}
      </ul>
    </details>
  );
}

function EvidenceList({ evidence }: { evidence: StudentInsightEvidence[] }) {
  return evidence.length ? (
    <ul className="mt-2 space-y-2">
      {evidence.map((item) => (
        <li key={item.key} className="rounded-lg bg-canvas p-2">
          <p className="text-[11px] font-bold text-ink">{item.label}</p>
          <p className="mt-0.5 text-xs leading-5 text-secondary-content">{item.detail}</p>
        </li>
      ))}
    </ul>
  ) : <p className="mt-2 text-xs text-secondary-content">Belum ada bukti pembelajaran yang dapat ditampilkan.</p>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-canvas p-3">
      <p className="text-[10px] leading-4 text-secondary-content">{label}</p>
      <p className="mt-1 text-lg font-black text-ink">{value}</p>
    </div>
  );
}

function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    review: 'Materi untuk diulang',
    activity: 'Aktivitas belajar',
    support: 'Bentuk pendampingan',
    encouragement: 'Apresiasi & motivasi',
    next_check: 'Evaluasi berikutnya',
  };
  return labels[category] ?? 'Rekomendasi';
}

function activityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    lesson_started: 'Mulai belajar',
    lesson_completed: 'Pembelajaran selesai',
    comic_started: 'Mulai komik',
    comic_completed: 'Komik selesai',
    reflection_submitted: 'Mengirim refleksi',
    ai_tutor_question: 'Bertanya ke AI Tutor',
  };
  return labels[type] ?? type.replace(/[_-]+/g, ' ');
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
}
