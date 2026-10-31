'use client';

import { useRef, useState } from 'react';
import { auth } from '@/lib/firebase/client';
import type { StudentRow } from '../types';
import { Card, ProgressBar, Skeleton } from '../components/ui';
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
    estimatedInputTokens: number;
    maxOutputTokens: number;
    maxProviderAttempts: number;
    actualTokenUsageAvailable: false;
  } | null;
}

type ReportSection = 'summary' | 'capabilities' | 'activity' | 'recommendations';

const sectionLabels: Array<{ id: ReportSection; label: string }> = [
  { id: 'summary', label: 'Ringkasan' },
  { id: 'capabilities', label: 'Kemampuan' },
  { id: 'activity', label: 'Aktivitas' },
  { id: 'recommendations', label: 'Rekomendasi' },
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

  const selectedStudent = students.find((student) => student.uid === selectedUid) ?? null;
  const matches = !selectedUid && search.trim()
    ? students.filter((student) => [
      student.displayName,
      student.email,
      student.uid,
      student.classLevel ?? '',
      student.schoolName,
    ].some((value) => value.toLocaleLowerCase('id').includes(search.trim().toLocaleLowerCase('id'))))
      .slice(0, 6)
    : [];

  const selectStudent = (student: StudentRow) => {
    requestStarted.current = false;
    setSelectedUid(student.uid);
    setSearch(student.displayName);
    setReport(null);
    setSection('summary');
    setError(null);
    setReviewedRecommendations(new Set());
  };

  const generate = async () => {
    if (!selectedUid || requestStarted.current) return;
    requestStarted.current = true;
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Sesi login tidak tersedia. Silakan masuk kembali.');
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/dashboard/guru', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'student-insight', studentUid: selectedUid }),
        cache: 'no-store',
      });
      const payload = await response.json() as { error?: string } | StudentInsightResponse;
      if (!response.ok) {
        throw new Error('error' in payload && payload.error ? payload.error : 'Analisis individu gagal dimuat.');
      }
      if (!('facts' in payload) || !payload.facts || !('student' in payload) || !payload.student) {
        throw new Error('Format data analisis individu tidak valid.');
      }
      setReport(payload);
    } catch (requestError) {
      requestStarted.current = false;
      setError(requestError instanceof Error ? requestError.message : 'Analisis individu gagal dimuat.');
    } finally {
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
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary-600">Analisis individu</p>
        <h2 className="text-lg font-black text-neutral-900">Tinjau perkembangan siswa</h2>
        <p className="mt-1 text-xs leading-5 text-neutral-600">
          Pilih siswa berdasarkan UID unik. Identitas hanya ditampilkan kepada guru yang berwenang dan tidak dikirim ke model AI.
        </p>
      </div>

      <div className="relative mt-3">
        <label htmlFor="student-insight-search" className="mb-1 block text-xs font-bold text-neutral-700">
          Cari nama, email, UID, kelas, atau sekolah
        </label>
        <input
          id="student-insight-search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            if (selectedUid) {
              setSelectedUid(null);
              setReport(null);
              setError(null);
              requestStarted.current = false;
            }
          }}
          placeholder="Ketik identitas siswa…"
          autoComplete="off"
          className="min-h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
        {matches.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white p-1 shadow-lg">
            {matches.map((student) => (
              <li key={student.uid}>
                <button
                  type="button"
                  onClick={() => selectStudent(student)}
                  className="min-h-12 w-full rounded-lg px-3 py-2 text-left hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
                >
                  <span className="block truncate text-sm font-bold text-neutral-900">{student.displayName || 'Siswa'}</span>
                  <span className="block truncate text-xs text-neutral-600">{student.email || 'Email tidak tersedia'}</span>
                  <span className="block truncate font-mono text-[10px] text-neutral-400">UID: {student.uid}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {search.trim() && !selectedUid && matches.length === 0 && (
        <p className="mt-2 rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600">
          Tidak ada siswa yang cocok dalam daftar yang tersedia.
        </p>
      )}
      {!students.length && (
        <p className="mt-2 rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600">
          Belum ada siswa yang dapat dipilih dalam cakupan akun ini.
        </p>
      )}

      {selectedStudent && (
        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-primary-100 bg-primary-50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-primary-950">{selectedStudent.displayName || 'Siswa'}</p>
            <p className="truncate text-xs text-neutral-700">{selectedStudent.email || 'Email tidak tersedia'}</p>
            <p className="break-all font-mono text-[10px] text-neutral-600">UID: {selectedStudent.uid}</p>
          </div>
          <button
            type="button"
            onClick={() => void generate()}
            disabled={loading || Boolean(report)}
            className="min-h-11 w-full flex-shrink-0 rounded-xl bg-primary-700 px-4 text-sm font-bold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {loading ? 'Mengambil bukti & menganalisis…' : report ? 'Analisis tersedia' : 'Buat analisis'}
          </button>
        </div>
      )}
      {error && <p role="alert" className="mt-3 rounded-xl bg-error-50 p-3 text-sm text-error-700">{error}</p>}
      {loading && (
        <div className="mt-3 space-y-2" aria-label="Memuat analisis individu">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      )}

      {report && !loading && (
        <div className="mt-4">
          <div className="mb-3 rounded-xl bg-neutral-50 p-3">
            <p className="text-xs font-bold text-neutral-800">Profil pembelajaran</p>
            <p className="mt-1 text-xs text-neutral-700">
              {report.student.schoolName || 'Sekolah tidak tercatat'}
              {report.student.classLevel ? ` · ${report.student.classLevel}` : ''}
              {!report.student.classLevel && report.student.gradeLevel !== null ? ` · Kelas ${report.student.gradeLevel}` : ''}
            </p>
            <p className="mt-1 text-[10px] text-neutral-500">
              Snapshot {formatDate(report.facts.generatedAt)} · Periode bukti {report.facts.dataPeriod.from && report.facts.dataPeriod.to
                ? `${formatDate(report.facts.dataPeriod.from)} – ${formatDate(report.facts.dataPeriod.to)}`
                : 'tidak tersedia'}
            </p>
          </div>

          <div role="tablist" aria-label="Bagian laporan individu" className="grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1 sm:grid-cols-4">
            {sectionLabels.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={section === item.id}
                onClick={() => setSection(item.id)}
                className={`min-h-10 rounded-lg px-2 text-xs font-bold ${
                  section === item.id ? 'bg-white text-primary-800 shadow-sm' : 'text-neutral-600'
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
            {section === 'recommendations' && (
              <RecommendationsSection
                report={report}
                reviewed={reviewedRecommendations}
                onToggleReviewed={toggleReviewed}
              />
            )}
          </div>
          <details className="mt-3 rounded-xl border border-neutral-200 bg-white p-3">
            <summary className="min-h-9 cursor-pointer text-sm font-bold text-neutral-800">
              Sumber data, cakupan, dan keterbatasan
            </summary>
            <EvidenceList evidence={report.facts.evidence} />
            <div className="mt-2 space-y-1 text-xs leading-5 text-neutral-600">
              <p>Query dibatasi {report.facts.sample.limitPerQuery} dokumen per sumber; hasil sampel terpotong: {report.facts.sample.mayBeTruncated ? 'ya' : 'tidak'}.</p>
              <p>Pemanggilan analisis dibatasi satu kali per akun guru setiap 60 detik.</p>
              <p>Data tidak dikirim sebagai jawaban/refleksi mentah. Progress tahap bukan bukti penguasaan.</p>
              {report.facts.limitations.map((limitation) => <p key={limitation}>• {limitation}</p>)}
              {report.usage && (
                <p>
                  Penggunaan AI: estimasi input ±{report.usage.estimatedInputTokens} token; batas output {report.usage.maxOutputTokens} token; maksimal {report.usage.maxProviderAttempts} percobaan provider. Token aktual dan biaya tidak tersedia.
                </p>
              )}
            </div>
          </details>
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
      <div className="rounded-xl border border-primary-100 bg-primary-50 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary-700">Ringkasan AI · bukan fakta tersimpan</p>
        {ai ? (
          <>
            <p className="mt-1 text-sm leading-6 text-neutral-800">{ai.summary}</p>
            <EvidenceReferences keys={ai.summaryEvidenceKeys} evidence={facts.evidence} />
          </>
        ) : (
          <p role="status" className="mt-1 text-sm leading-5 text-neutral-700">
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
      <ul className="space-y-2">
        {facts.modules.map((module) => (
          <li key={module.comicId} className="rounded-xl border border-neutral-100 p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0 text-sm font-bold text-neutral-800">{module.comicId}. {module.title}</span>
              <span className="flex-shrink-0 text-xs font-bold text-neutral-700">
                {!module.progressAvailable ? 'Belum ada data' : module.percentage === null ? 'Progress tidak tersedia' : `${module.percentage}%`}
              </span>
            </div>
            {module.progressAvailable && (
              <>
                {module.percentage !== null && <ProgressBar value={module.percentage} className="mt-2" />}
                <p className="mt-1 text-[10px] text-neutral-500">
                  {module.completedStages.length}/{module.completedStages.length + module.remainingStages.length} tahap tersedia tercatat selesai · {module.status === 'completed' ? 'semua tahap tersedia selesai' : module.status === 'learning' ? 'sedang berjalan' : 'belum ada aktivitas mulai tercatat'}
                </p>
              </>
            )}
          </li>
        ))}
        {!facts.modules.length && <li className="rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600">Katalog komik belum tersedia.</li>}
      </ul>
      {ai?.findings.length ? (
        <div className="rounded-xl bg-neutral-50 p-3">
          <h3 className="text-xs font-bold text-neutral-800">Temuan yang perlu ditinjau</h3>
          <ul className="mt-2 space-y-2">
            {ai.findings.map((finding, index) => (
              <li key={`${index}:${finding.text}`} className="text-sm leading-5 text-neutral-700">
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
  return (
    <section className="space-y-3">
      <p className="rounded-xl bg-neutral-50 p-3 text-xs leading-5 text-neutral-600">
        Fakta tahap menunjukkan alur yang tercatat, bukan penguasaan materi. Jawaban hanya dinilai bila kunci jawaban tersedia; skala asesmen tidak digabung.
      </p>
      {facts.modules.map((module) => (
        <article key={module.comicId} className="rounded-xl border border-neutral-200 p-3">
          <h3 className="text-sm font-bold text-neutral-900">{module.comicId}. {module.title}</h3>
          {!module.progressAvailable && !module.answers.recordCount && !module.assessments.length ? (
            <p className="mt-2 text-xs text-neutral-500">Belum ada data progress, jawaban terukur, atau asesmen untuk modul ini.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {module.progressAvailable && (
                <div>
                  <p className="text-xs font-semibold text-neutral-700">Tahap sudah tercatat selesai ({module.completedStages.length})</p>
                  <p className="mt-1 text-xs text-neutral-600">{module.completedStages.join(', ') || 'Belum ada tahap selesai yang tercatat.'}</p>
                  <p className="mt-2 text-xs font-semibold text-neutral-700">Tahap belum tercatat selesai ({module.remainingStages.length})</p>
                  <p className="mt-1 text-xs text-neutral-600">{module.remainingStages.join(', ') || 'Semua tahap tersedia tercatat selesai.'}</p>
                </div>
              )}
              {module.answers.recordCount > 0 && (
                <p className="text-xs text-neutral-700">
                  Jawaban tersimpan {module.answers.recordCount}; dapat dinilai {module.answers.judgedCount}; benar {module.answers.correctCount}; keliru {module.answers.incorrectCount}.
                </p>
              )}
              {module.answers.questions.map((question) => (
                <p key={question.step} className="rounded-lg bg-amber-50 p-2 text-xs leading-5 text-neutral-700">
                  Langkah {question.step + 1} · {question.question}: {question.incorrectCount}/{question.judgedCount} jawaban dinilai keliru.
                </p>
              ))}
              {module.assessments.map((assessment) => (
                <p key={assessment.type} className="text-xs text-neutral-700">
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
        <p key={assessment.type} className="rounded-xl bg-primary-50 p-3 text-xs text-neutral-700">
          {assessment.type}: {assessment.score}/{assessment.maximum}
          <EvidenceReferences keys={['assessment:evaluation-cinarai']} evidence={facts.evidence} />
        </p>
      ))}
    </section>
  );
}

function ActivitySection({ facts }: { facts: StudentInsightFacts }) {
  const max = Math.max(1, ...facts.activity.byWeek.map((week) => week.count));
  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Metric label="Event aktivitas" value={facts.activity.recordCount} />
        <Metric label="Hari aktif bertimestamp" value={facts.activity.activeDays} />
        <Metric label="Event lesson/comic selesai" value={facts.activity.completedEvents} />
        <Metric label="Aktivitas penerapan" value={facts.application.recordCount} />
      </div>
      {!facts.activity.recordCount && (
        <p className="rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600">
          Belum ada aktivitas bertimestamp. Frekuensi dan konsistensi tidak dapat dinilai; ketiadaan catatan bukan bukti tidak belajar.
        </p>
      )}
      {facts.activity.recordCount > 0 && (
        <div className="rounded-xl border border-neutral-100 p-3">
          <h3 className="text-xs font-bold text-neutral-800">Frekuensi aktivitas per pekan · delapan pekan</h3>
          <div className="mt-2 space-y-2">
            {facts.activity.byWeek.map((week) => (
              <div key={week.weekStarting} className="grid grid-cols-[4.5rem_1fr_1.5rem] items-center gap-2">
                <span className="text-[10px] text-neutral-600">{formatDate(week.weekStarting)}</span>
                <ProgressBar value={(week.count / max) * 100} />
                <span className="text-right text-xs font-bold">{week.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {facts.activity.byType.map((item) => (
              <span key={item.type} className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] text-neutral-700">
                {item.type}: {item.count}
              </span>
            ))}
          </div>
          <EvidenceReferences keys={['activity:frequency']} evidence={facts.evidence} />
          {facts.activity.completedEvents > 0 && <EvidenceReferences keys={['activity:completion']} evidence={facts.evidence} />}
        </div>
      )}
      <div className="rounded-xl border border-neutral-100 p-3">
        <h3 className="text-xs font-bold text-neutral-800">Respons kegiatan & refleksi yang tersimpan</h3>
        <p className="mt-2 text-xs text-neutral-700">
          Feedback aktivitas penerapan: {facts.application.feedbackByType.map((item) => `${item.type} ${item.count}`).join(', ') || 'belum tersedia'}.
        </p>
        <p className="mt-1 text-xs text-neutral-700">
          Refleksi: {facts.reflection.recordCount}; rating tersedia {facts.reflection.ratedCount}
          {facts.reflection.averageRating !== null ? ` (rerata ${facts.reflection.averageRating})` : ''}; confidence tersedia {facts.reflection.confidenceCount}
          {facts.reflection.averageConfidence !== null ? ` (rerata ${facts.reflection.averageConfidence}/5)` : ''}.
        </p>
        {facts.application.recordCount > 0 && <EvidenceReferences keys={['application:feedback']} evidence={facts.evidence} />}
        {facts.reflection.recordCount > 0 && <EvidenceReferences keys={['reflection:ratings']} evidence={facts.evidence} />}
        <p className="mt-2 text-[10px] leading-5 text-neutral-500">
          Event merupakan catatan sistem, bukan ukuran motivasi atau kepribadian. Riwayat aktivitas bukan tren progress historis.
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
        <div key={`${index}:${limitation.text}`} className="rounded-xl bg-neutral-50 p-3 text-xs text-neutral-700">
          {limitation.text}
          <EvidenceReferences keys={limitation.evidenceKeys} evidence={report.facts.evidence} />
        </div>
      ))}
      {recommendations.length ? recommendations.map((recommendation, index) => (
        <article key={`${index}:${recommendation.text}`} className="rounded-xl border border-green-100 bg-green-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-green-800">{categoryLabel(recommendation.category)}</p>
          <p className="mt-1 text-sm leading-5 text-neutral-800">{recommendation.text}</p>
          <EvidenceReferences keys={recommendation.evidenceKeys} evidence={report.facts.evidence} />
          <p className="mt-2 text-xs text-neutral-700"><strong>Indikator berikutnya:</strong> {recommendation.nextIndicator}</p>
          <label className="mt-3 flex min-h-10 cursor-pointer items-center gap-2 text-xs font-semibold text-neutral-700">
            <input
              type="checkbox"
              checked={reviewed.has(index)}
              onChange={() => onToggleReviewed(index)}
              className="h-4 w-4 accent-green-700"
            />
            Sudah ditinjau guru
          </label>
        </article>
      )) : (
        <p className="rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600">
          Rekomendasi tidak tersedia. Tinjau data sumber secara langsung sebelum menentukan tindak lanjut.
        </p>
      )}
      <p className="text-[10px] leading-5 text-neutral-500">
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
      <summary className="min-h-8 cursor-pointer text-[10px] font-bold text-primary-800">
        Lihat bukti ({referenced.length})
      </summary>
      <ul className="space-y-1 pb-1 text-[11px] leading-5 text-neutral-700">
        {referenced.map((item) => <li key={item.key}><strong>{item.label}:</strong> {item.detail}</li>)}
      </ul>
    </details>
  );
}

function EvidenceList({ evidence }: { evidence: StudentInsightEvidence[] }) {
  return evidence.length ? (
    <ul className="mt-2 space-y-2">
      {evidence.map((item) => (
        <li key={item.key} className="rounded-lg bg-neutral-50 p-2">
          <p className="text-[11px] font-bold text-neutral-800">{item.label} <span className="font-mono font-normal text-neutral-400">({item.key})</span></p>
          <p className="mt-0.5 text-xs leading-5 text-neutral-700">{item.detail}</p>
        </li>
      ))}
    </ul>
  ) : <p className="mt-2 text-xs text-neutral-500">Belum ada bukti pembelajaran yang dapat ditampilkan.</p>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-neutral-50 p-3">
      <p className="text-[10px] leading-4 text-neutral-600">{label}</p>
      <p className="mt-1 text-lg font-black text-neutral-900">{value}</p>
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

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
}
