'use client';

import { Card, ProgressBar, ProgressRing, Badge, Skeleton } from './ui';
import type { ComicDocument, ComicProgressDocument } from '@/types/firestore';
import type { CinaraiEvaluationProgress } from '@/types/evaluation';
import type { AiInsight } from '../types';

interface ComicEntry {
  comic: ComicDocument;
  progress: ComicProgressDocument | null;
}

interface Props {
  uid: string;
  displayName: string;
  email: string;
  schoolName: string;
  gradeLevel: number | null;
  isActive: boolean;
  comicProgress: ComicEntry[];
  evaluation: CinaraiEvaluationProgress | null;
  reflections: Record<string, unknown>[];
  activities: Record<string, unknown>[];
  applicationActivities: Record<string, unknown>[];
  identificationAnswers: Record<string, unknown>[];
  insight: AiInsight | null;
  insightLoading: boolean;
  insightError: string | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onGenerateInsight: () => void;
  onGeneratePdf: () => void;
}

export function StudentDetail({
  uid,
  displayName,
  email,
  schoolName,
  gradeLevel,
  isActive,
  comicProgress,
  evaluation,
  reflections,
  activities,
  applicationActivities,
  identificationAnswers,
  insight,
  insightLoading,
  insightError,
  loading,
  error,
  onBack,
  onGenerateInsight,
  onGeneratePdf,
}: Props) {
  void uid;
  const avgProgress =
    comicProgress.length > 0
      ? Math.round(
          comicProgress.reduce((s, e) => s + (e.progress?.percentage ?? 0), 0) /
            comicProgress.length
        )
      : 0;
  const recentActivity = [
    ...activities.map((activity, index) => ({
      id: `activity:${String(activity.id ?? index)}`,
      title: textValue(activity.title) ?? textValue(activity.type) ?? 'Aktivitas belajar',
      description: textValue(activity.description),
      date: firstValidDate(activity, ['occurredAt', 'createdAt', 'updatedAt']),
    })),
    ...applicationActivities.map((activity, index) => ({
      id: `application:${String(activity.id ?? index)}`,
      title: `Penerapan Komik ${String(activity.comicId ?? '—')}`,
      description: [textValue(activity.selectedAnswer), textValue(activity.studentReason)].filter(Boolean).join(' · '),
      date: firstValidDate(activity, ['timestamp', 'localTimestamp', 'createdAt']),
    })),
    ...identificationAnswers.map((answer, index) => ({
      id: `identification:${String(answer.id ?? index)}`,
      title: `Identifikasi Komik ${String(answer.comicId ?? '—')} · Langkah ${String(answer.step ?? '—')}`,
      description: [textValue(answer.selectedAnswer), textValue(answer.reason), textValue(answer.note)].filter(Boolean).join(' · '),
      date: firstValidDate(answer, ['updatedAt', 'createdAt']),
    })),
    ...reflections.map((reflection, index) => ({
      id: `reflection:${String(reflection.id ?? index)}`,
      title: `Refleksi Komik ${String(reflection.comicId ?? reflection.moduleId ?? '—')}`,
      description: textValue(reflection.reflectionText) ?? textValue(reflection.response),
      date: firstValidDate(reflection, ['submittedAt', 'createdAt', 'timestamp', 'updatedAt']),
    })),
  ].filter((item): item is typeof item & { date: Date } => item.date !== null)
    .sort((left, right) => right.date.getTime() - left.date.getTime())
    .slice(0, 10);

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Back + actions */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm border border-neutral-200 hover:bg-neutral-50 transition-colors"
        >
          ← Kembali
        </button>
        <button
          onClick={onGeneratePdf}
          className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
        >
          📄 Unduh PDF
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
          Data siswa tidak seluruhnya dapat dimuat: {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Identity */}
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-2xl font-black text-primary-700">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-black text-neutral-900 truncate">{displayName}</h2>
                <p className="text-sm text-neutral-500 truncate">{email}</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <Badge color="primary">{schoolName}</Badge>
                  {gradeLevel && <Badge color="secondary">Kelas {gradeLevel}</Badge>}
                  <Badge color={isActive ? 'accent' : 'error'}>
                    {isActive ? 'Aktif' : 'Tidak Aktif'}
                  </Badge>
                </div>
              </div>
              <ProgressRing value={avgProgress} size={64} stroke={5} className="flex-shrink-0" />
            </div>
          </Card>

          {/* Comic progress */}
          <Card>
            <div className="px-5 pt-4 pb-3 border-b border-neutral-100">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Progress</p>
              <h3 className="text-base font-black text-neutral-900">Semua Komik 📚</h3>
            </div>
            <ul className="divide-y divide-neutral-50">
              {comicProgress.map(({ comic, progress }) => (
                <li key={comic.comicId} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <p className="text-sm font-semibold text-neutral-800 truncate flex-1">
                      {comic.title}
                    </p>
                    <Badge
                      color={
                        !progress
                          ? 'warning'
                          : progress.status === 'completed'
                          ? 'accent'
                          : 'primary'
                      }
                    >
                      {!progress
                        ? 'Belum ada data'
                        : progress.status === 'completed'
                        ? 'Selesai'
                        : `${progress.percentage ?? 0}%`}
                    </Badge>
                  </div>
                  {progress && <ProgressBar value={progress.percentage ?? 0} />}
                  {progress && (
                    <>
                      <p className="mt-1 text-xs text-neutral-400">
                        Tahap terakhir: {progress.completedStage || '—'}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {progress.sintaksList?.map((stage) => (
                          <span
                            key={stage.sintaks}
                            className={`rounded px-2 py-1 text-[11px] ${
                              stage.status === 'COMPLETED'
                                ? 'bg-success-50 text-success-700'
                                : stage.status === 'CURRENT'
                                  ? 'bg-primary-50 text-primary-700'
                                  : 'bg-neutral-50 text-neutral-400'
                            }`}
                          >
                            {stage.sintaks}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </li>
              ))}
              {comicProgress.length === 0 && (
                <li className="px-5 py-4 text-sm text-neutral-500">Metadata komik belum tersedia.</li>
              )}
            </ul>
          </Card>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard emoji="📝" label="Refleksi" value={String(reflections.length)} />
            <StatCard emoji="⚡" label="Aktivitas" value={String(activities.length)} />
            <StatCard
              emoji="✅"
              label="Komik Selesai"
              value={String(comicProgress.filter((e) => e.progress?.status === 'completed').length)}
            />
          </div>

          <Card>
            <div className="px-5 pt-4 pb-3 border-b border-neutral-100">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Evaluasi</p>
              <h3 className="text-base font-black text-neutral-900">Evaluasi CINARAI</h3>
            </div>
            <div className="px-5 py-4 text-sm text-neutral-700">
              {!evaluation ? (
                <p className="text-neutral-500">Belum ada dokumen evaluasi tersimpan.</p>
              ) : (
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <p>Status: <strong>{evaluation.completed ? 'Selesai' : 'Dalam proses'}</strong></p>
                  <p>Jawaban tersimpan: <strong>{Object.keys(evaluation.answers ?? {}).length}</strong></p>
                  <p>Penilaian: <strong>
                    {evaluation.grading?.status === 'graded' && typeof evaluation.grading.totalScore === 'number'
                      ? `${evaluation.grading.totalScore}/40`
                      : evaluation.grading?.status === 'pending'
                        ? 'Menunggu penilaian'
                        : 'Belum tersedia'}
                  </strong></p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="px-5 pt-4 pb-3 border-b border-neutral-100">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Linimasa</p>
              <h3 className="text-base font-black text-neutral-900">Aktivitas terbaru</h3>
            </div>
            {recentActivity.length ? (
              <ul className="divide-y divide-neutral-100">
                {recentActivity.map((item) => (
                  <li key={item.id} className="px-5 py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="text-sm font-semibold text-neutral-800">{item.title}</p>
                      <time className="text-xs text-neutral-400" dateTime={item.date.toISOString()}>
                        {item.date.toLocaleString('id-ID')}
                      </time>
                    </div>
                    {item.description && <p className="mt-1 text-sm text-neutral-600">{item.description}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-4 text-sm text-neutral-500">Belum ada aktivitas dengan timestamp valid.</p>
            )}
          </Card>

          {/* AI Insight */}
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                  AI Assistant
                </p>
                <h3 className="text-base font-black text-neutral-900">Analisis Siswa 🤖</h3>
              </div>
              {!insight && (
                <button
                  onClick={onGenerateInsight}
                  disabled={insightLoading}
                  className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60 transition-colors"
                >
                  {insightLoading ? 'Menganalisis…' : 'Analisis'}
                </button>
              )}
            </div>

            {insightError && (
              <p className="text-sm text-error-600 bg-error-50 rounded-xl px-4 py-3">{insightError}</p>
            )}

            {insightLoading && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-4 w-5/6 rounded" />
              </div>
            )}

            {insight && !insightLoading && (
              <div className="space-y-3 text-sm">
                <InsightRow label="Kemampuan" value={insight.capabilitySummary} />
                <InsightRow label="Tahap Terbaik" value={insight.bestStage} />
                <InsightRow label="Tahap Terlemah" value={insight.weakestStage} />
                <InsightRow label="Pola Kesalahan" value={insight.errorPattern} />
                <InsightRow label="Rekomendasi" value={insight.teacherRecommendation} />
                <InsightRow label="Remedial" value={insight.remedial} />
                <InsightRow label="Pengayaan" value={insight.enrichment} />
                {insight.provider && (
                  <p className="text-xs text-neutral-400 pt-1">Provider: {insight.provider}</p>
                )}
              </div>
            )}

            {!insight && !insightLoading && !insightError && (
              <p className="text-sm text-neutral-400">
                Klik &ldquo;Analisis&rdquo; untuk mendapatkan insight AI tentang perkembangan siswa ini.
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function textValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function firstValidDate(record: Record<string, unknown>, fields: string[]): Date | null {
  for (const field of fields) {
    const value = record[field];
    if (value instanceof Date && Number.isFinite(value.getTime())) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const numericValue = typeof value === 'number' && value < 1_000_000_000_000 ? value * 1000 : value;
      const date = new Date(numericValue);
      if (Number.isFinite(date.getTime())) return date;
    }
    if (typeof value === 'object' && value !== null) {
      const timestamp = value as { toDate?: () => Date; seconds?: number; nanoseconds?: number };
      if (typeof timestamp.toDate === 'function') {
        const date = timestamp.toDate();
        if (date instanceof Date && Number.isFinite(date.getTime())) return date;
      }
      if (typeof timestamp.seconds === 'number') {
        const date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds ?? 0) / 1_000_000);
        if (Number.isFinite(date.getTime())) return date;
      }
    }
  }
  return null;
}

function StatCard({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className="text-lg font-black text-neutral-900">{value}</p>
        <p className="text-xs text-neutral-500">{label}</p>
      </div>
    </Card>
  );
}

function InsightRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-neutral-50 px-4 py-3">
      <p className="text-xs font-bold text-neutral-500 mb-0.5">{label}</p>
      <p className="text-sm text-neutral-800 leading-relaxed">{value}</p>
    </div>
  );
}
