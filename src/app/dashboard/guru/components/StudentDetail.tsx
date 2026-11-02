'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Avatar, Button, Card, ErrorState, LoadingState, ProgressBar, ProgressRing, Badge, Skeleton, StatCard } from './ui';
import type { ComicDocument, ComicProgressDocument, UserDocument } from '@/types/firestore';
import type { CinaraiEvaluationProgress } from '@/types/evaluation';
import { SINTAKS } from '@/types/progress';
import { getCompletedModuleStages, getModuleStudentStatus, isModuleProgressComplete } from '../services/progressStatus';
import type { AiInsight } from '../types';

interface ComicEntry {
  comic: ComicDocument;
  progress: ComicProgressDocument | null;
}

interface Props {
  uid: string;
  profile: UserDocument | null;
  displayName: string;
  email: string;
  username?: string;
  nickname?: string;
  photoURL?: string;
  schoolId?: string;
  schoolName: string;
  classLevel: string | null;
  gradeLevel: number | null;
  isActive?: boolean;
  gender?: string;
  bio?: string;
  createdAt?: unknown;
  comicProgress: ComicEntry[];
  evaluation: CinaraiEvaluationProgress | null;
  reflections: Record<string, unknown>[];
  activities: Record<string, unknown>[];
  applicationActivities: Record<string, unknown>[];
  identificationAnswers: Record<string, unknown>[];
  moduleProgress: Record<string, unknown>[];
  aiTutorChats: Record<string, unknown>[];
  insight: AiInsight | null;
  insightLoading: boolean;
  insightError: string | null;
  insightRetryAfterSeconds: number;
  insightGeneratedAt: string | null;
  insightCacheHit: boolean;
  insightCacheWarning: string | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onGenerateInsight: (forceRefresh?: boolean) => void;
  onGeneratePdf: () => void;
}

export function StudentDetail({
  uid,
  profile,
  displayName,
  email,
  username,
  nickname,
  photoURL,
  schoolId,
  schoolName,
  classLevel,
  gradeLevel,
  isActive,
  gender,
  bio,
  createdAt,
  comicProgress,
  evaluation,
  reflections,
  activities,
  applicationActivities,
  identificationAnswers,
  moduleProgress,
  aiTutorChats,
  insight,
  insightLoading,
  insightError,
  insightRetryAfterSeconds,
  insightGeneratedAt,
  insightCacheHit,
  insightCacheWarning,
  loading,
  error,
  onBack,
  onGenerateInsight,
  onGeneratePdf,
}: Props) {
  const [activityPage, setActivityPage] = useState(0);
  const recordedProgress = comicProgress.flatMap((entry) => {
    const percentage = entry.progress?.percentage;
    return typeof percentage === 'number' && Number.isFinite(percentage) && percentage >= 0 && percentage <= 100
      ? [percentage]
      : [];
  });
  const avgProgress = recordedProgress.length
    ? Math.round(recordedProgress.reduce((sum, percentage) => sum + percentage, 0) / recordedProgress.length)
    : null;
  const startedComics = comicProgress.filter(({ progress }) => getModuleStudentStatus(progress) !== 'not_started').length;
  const completedComics = comicProgress.filter(({ progress }) => progress && isModuleProgressComplete(progress)).length;
  const completedStageCount = comicProgress.reduce(
    (sum, { progress }) => sum + (progress ? getCompletedModuleStages(progress).size : 0),
    0
  );
  const trackedStageCount = comicProgress.filter(({ progress }) => progress !== null).length * SINTAKS.length;
  const learningStatus = startedComics === 0
    ? 'Belum mulai'
    : completedComics === comicProgress.length && comicProgress.length > 0
      ? 'Tuntas'
      : avgProgress !== null && avgProgress < 40
        ? 'Perlu perhatian'
        : 'Sedang belajar';
  const judgedAnswerCount = identificationAnswers.filter((answer) =>
    textValue(answer.selectedAnswer) && textValue(answer.correctAnswer)
  ).length;
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
    .sort((left, right) => right.date.getTime() - left.date.getTime());
  const activityPageSize = 10;
  const activityPageCount = Math.max(1, Math.ceil(recentActivity.length / activityPageSize));
  const additionalProfileFields = getAdditionalProfileFields(profile);
  const visibleActivities = recentActivity.slice(
    activityPage * activityPageSize,
    (activityPage + 1) * activityPageSize
  );

  return (
    <div className="mx-auto max-w-[1440px] space-y-4 animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
        >
          <span aria-hidden="true">←</span> Kembali ke siswa
        </Button>
        <Button
          type="button"
          onClick={onGeneratePdf}
        >
          Unduh laporan PDF
        </Button>
      </div>

      {error && (
        <ErrorState title="Data siswa tidak seluruhnya dapat dimuat." message={error} />
      )}

      {loading ? (
        <LoadingState label="Memuat detail siswa">
          <div className="space-y-4">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </LoadingState>
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-brand-100 via-white to-brand-50 p-4 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <Avatar name={displayName} src={photoURL} size="lg" className="ring-4 ring-white" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-brand-700">Profil siswa</p>
                    <h2 className="guru-page-title truncate">{displayName}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {(classLevel || gradeLevel !== null) && (
                        <Badge color="info">{classLevel || `Kelas ${gradeLevel}`}</Badge>
                      )}
                      <Badge color={learningStatus === 'Tuntas' ? 'accent' : learningStatus === 'Perlu perhatian' ? 'warning' : 'primary'}>
                        {learningStatus}
                      </Badge>
                      {schoolName !== 'Belum diisi' && <span className="text-xs text-secondary-content">{schoolName}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white bg-white/80 p-3 sm:min-w-48">
                  {avgProgress === null ? (
                    <div className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-full border-4 border-ui-border text-sm font-bold text-secondary-content">—</div>
                  ) : (
                    <ProgressRing value={avgProgress} size={56} stroke={5} />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-secondary-content">Progress belajar</p>
                    <p className="text-sm font-bold text-ink">
                      {avgProgress === null ? 'Belum ada data' : `${avgProgress}% rata-rata tercatat`}
                    </p>
                    <p className="text-[11px] text-secondary-content">{recordedProgress.length} dari {comicProgress.length} komik</p>
                  </div>
                </div>
              </div>
              <details className="mt-4 border-t border-brand-100 pt-3">
              <summary className="min-h-11 cursor-pointer text-xs font-bold text-brand-800">Informasi profil lainnya</summary>
                <dl className="mt-3 grid gap-3 rounded-xl bg-white/80 p-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <ProfileValue label="UID siswa" value={uid} />
                  <ProfileValue label="Email" value={email} />
                  <ProfileValue label="Username" value={username} />
                  <ProfileValue label="Nama panggilan" value={nickname} />
                  <ProfileValue label="Jenis kelamin" value={gender} />
                  <ProfileValue label="Sekolah" value={schoolName} />
                  <ProfileValue label="ID sekolah" value={schoolId} />
                  <ProfileValue label="Kelas" value={classLevel || (gradeLevel ? `Kelas ${gradeLevel}` : undefined)} />
                  <ProfileValue label="Tanggal registrasi" value={formatTimestamp(createdAt)} />
                  <ProfileValue label="Terakhir login" value={formatTimestamp(profile?.lastLoginAt)} />
                  <ProfileValue label="Bio" value={bio} />
                  <ProfileValue label="Status akun" value={isActive === undefined ? undefined : isActive ? 'Aktif' : 'Tidak aktif'} />
                  {additionalProfileFields.map(({ key, label, value }) => (
                    <ProfileValue key={key} label={label} value={value} />
                  ))}
                </dl>
              </details>
            </div>
          </Card>

          <section aria-label="Ringkasan perkembangan" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard icon="↗" label="Progress belajar" value={avgProgress === null ? '—' : `${avgProgress}%`} />
            <StatCard icon="📖" label="Komik dimulai" value={`${startedComics}/${comicProgress.length}`} tone="info" />
            <StatCard icon="✓" label="Komik selesai" value={`${completedComics}/${comicProgress.length}`} tone="success" />
            <StatCard icon="◎" label="Tahap selesai" value={trackedStageCount ? `${completedStageCount}/${trackedStageCount}` : '—'} tone="warning" />
          </section>

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.9fr)]">
            <div className="min-w-0 space-y-4">
              <Card className="overflow-hidden">
                <SectionHeading eyebrow="Perkembangan pembelajaran" title="Progress setiap komik" />
                {comicProgress.length ? (
                  <ul className="divide-y divide-ui-border">
                    {comicProgress.map(({ comic, progress }) => {
                      const completedStages = progress ? getCompletedModuleStages(progress) : new Set<string>();
                      const percentage = typeof progress?.percentage === 'number'
                        && Number.isFinite(progress.percentage)
                        && progress.percentage >= 0
                        && progress.percentage <= 100
                        ? progress.percentage
                        : null;
                      const status = getModuleStudentStatus(progress);
                      return (
                        <li key={comic.comicId} className="p-4 sm:p-5">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="grid h-11 w-11 flex-shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-50 text-xl text-brand-700">
                              {comic.thumbnailUrl || comic.coverUrl ? (
                                <Image
                                  src={comic.thumbnailUrl || comic.coverUrl}
                                  alt=""
                                  width={44}
                                  height={44}
                                  unoptimized
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span aria-hidden="true">📘</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="truncate text-sm font-bold text-ink">{comic.title || `Komik ${comic.comicId}`}</h4>
                                <span className="flex-shrink-0 text-sm font-black text-brand-700">
                                  {percentage === null ? '—' : `${Math.round(percentage)}%`}
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs text-secondary-content">
                                {status === 'completed' ? 'Tuntas' : status === 'learning' ? 'Sedang belajar' : 'Belum mulai'}
                                {progress && ` · ${completedStages.size}/${SINTAKS.length} tahap selesai`}
                              </p>
                            </div>
                          </div>
                          {percentage !== null && <ProgressBar value={percentage} className="mt-3" />}
                          {progress && (
                            <>
                              <div className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-8">
                                {SINTAKS.map((stage) => {
                                  const completed = completedStages.has(stage);
                                  const current = progress.sintaksList?.some((item) =>
                                    item.sintaks === stage && item.status === 'CURRENT'
                                  ) ?? false;
                                  return (
                                    <span
                                      key={stage}
                                      title={stage}
                                      className={`min-w-0 rounded-lg px-1 py-1.5 text-center text-[9px] font-semibold leading-3 sm:text-[10px] ${
                                        completed
                                          ? 'bg-accent-50 text-accent-800'
                                          : current
                                            ? 'bg-brand-50 text-brand-800 ring-1 ring-brand-200'
                                            : 'bg-canvas text-secondary-content'
                                      }`}
                                    >
                                      <span className="block">{completed ? '✓' : current ? '•' : '·'}</span>
                                      <span className="block truncate">{stage}</span>
                                    </span>
                                  );
                                })}
                              </div>
                              <details className="mt-2">
                                <summary className="min-h-11 cursor-pointer text-[11px] font-semibold text-secondary-content">Waktu aktivitas komik</summary>
                                <p className="text-xs text-secondary-content">
                                  Tahap terakhir: {progress.completedStage || 'Belum ada'} · Mulai: {formatTimestamp(progress.createdAt)} · Aktivitas terakhir: {formatTimestamp(progress.updatedAt)}
                                </p>
                              </details>
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="p-4 text-sm text-secondary-content">Data komik belum tersedia.</p>
                )}
              </Card>

              <Card className="overflow-hidden">
                <SectionHeading eyebrow="Aktivitas belajar" title="Riwayat aktivitas" />
                {recentActivity.length ? (
                  <ul className="divide-y divide-ui-border">
                    {visibleActivities.map((item) => (
                      <li key={item.id} className="flex gap-3 px-4 py-3 sm:px-5">
                        <span className="mt-1 grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700" aria-hidden="true">•</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                            <p className="break-words text-sm font-semibold text-ink">{item.title}</p>
                            <time className="text-xs text-secondary-content" dateTime={item.date.toISOString()}>
                              {item.date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                            </time>
                          </div>
                          {item.description && <p className="mt-1 break-words text-sm leading-5 text-secondary-content">{item.description}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-4 text-sm text-secondary-content">Belum ada aktivitas belajar dengan waktu yang dapat ditampilkan.</p>
                )}
                {activityPageCount > 1 && (
                  <div className="flex items-center justify-between gap-2 border-t border-ui-border px-4 py-3 sm:px-5">
                    <button
                      type="button"
                      disabled={activityPage === 0}
                      onClick={() => setActivityPage((page) => Math.max(0, page - 1))}
                      className="min-h-11 rounded-lg border border-ui-border px-3 text-sm disabled:opacity-40"
                    >
                      Sebelumnya
                    </button>
                    <span className="text-xs text-secondary-content">Halaman {activityPage + 1} dari {activityPageCount}</span>
                    <button
                      type="button"
                      disabled={activityPage + 1 >= activityPageCount}
                      onClick={() => setActivityPage((page) => Math.min(activityPageCount - 1, page + 1))}
                      className="min-h-11 rounded-lg border border-ui-border px-3 text-sm disabled:opacity-40"
                    >
                      Berikutnya
                    </button>
                  </div>
                )}
              </Card>

              <Card className="p-4 sm:p-5">
                <SectionHeading eyebrow="Refleksi siswa" title="Catatan refleksi" />
                <div className="mt-3">
                  <LearningRecords title="Refleksi" records={reflections} />
                </div>
              </Card>
            </div>

            <aside className="min-w-0 space-y-4">
              <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ui-border px-4 py-4 sm:px-5">
                  <div>
                    <p className="text-xs font-semibold text-brand-700">Analisis perkembangan</p>
                    <h3 className="guru-section-title">Insight siswa</h3>
                  </div>
                  <Button
                    type="button"
                    onClick={() => onGenerateInsight(Boolean(insight))}
                    className="w-full sm:w-auto"
                    disabled={insightLoading || insightRetryAfterSeconds > 0}
                  >
                    {insightLoading
                      ? 'Menganalisis…'
                      : insightRetryAfterSeconds > 0
                        ? `Coba lagi ${insightRetryAfterSeconds} dtk`
                        : insight
                          ? 'Perbarui analisis'
                          : 'Buat analisis'}
                  </Button>
                </div>
                <div className="space-y-3 p-4 sm:p-5">
                  {insightError && (
                    <p role="alert" className="rounded-xl bg-error-50 px-3 py-2.5 text-sm text-error-700">{insightError}</p>
                  )}
                  {insightCacheWarning && (
                    <p role="status" className="rounded-lg bg-warning-50 p-2 text-xs text-warning-800">{insightCacheWarning}</p>
                  )}
                  {insight?.fallbackUsed && (
                    <p role="status" className="text-xs text-secondary-content">Analisis tersedia melalui layanan AI alternatif.</p>
                  )}
                  {insightGeneratedAt && (
                    <p className="text-[11px] text-secondary-content">
                      Dianalisis {formatTimestamp(insightGeneratedAt)}{insightCacheHit ? ' · data belum berubah.' : '.'}
                    </p>
                  )}
                  {insightLoading && (
                    <div className="space-y-2" aria-label="Memuat analisis siswa">
                      <Skeleton className="h-20 rounded-xl" />
                      <Skeleton className="h-16 rounded-xl" />
                    </div>
                  )}
                  {insight && !insightLoading ? (
                    <div className="space-y-3">
                      {insight.capabilitySummary.trim() && (
                        <InsightRow label="Ringkasan kondisi" value={insight.capabilitySummary} tone="primary" />
                      )}
                      <div className="grid gap-2 sm:grid-cols-2">
                        {insight.bestStage !== 'Lihat temuan berbasis bukti' && (
                          <InsightRow label="Kekuatan belajar" value={insight.bestStage} tone="success" />
                        )}
                        {insight.weakestStage !== 'Lihat temuan berbasis bukti' && (
                          <InsightRow label="Fokus bimbingan" value={insight.weakestStage} tone="warning" />
                        )}
                        {insight.errorPattern.trim() && (
                          <InsightRow label="Kesulitan utama" value={insight.errorPattern} tone="warning" />
                        )}
                      </div>
                      {insight.teacherRecommendation.trim() && (
                        <div className="rounded-xl border border-brand-100 bg-brand-50/70 p-3">
                          <p className="text-xs font-bold text-brand-900">Saran tindak lanjut guru</p>
                          <p className="mt-1 break-words text-sm leading-5 text-ink">{insight.teacherRecommendation}</p>
                        </div>
                      )}
                      <div className="grid gap-2 sm:grid-cols-2">
                        {insight.remedial.trim() && <InsightRow label="Dukungan belajar" value={insight.remedial} tone="neutral" />}
                        {insight.enrichment.trim() && <InsightRow label="Pengayaan" value={insight.enrichment} tone="neutral" />}
                      </div>
                      <p className="text-[11px] leading-5 text-secondary-content">
                        Ringkasan AI adalah bahan pertimbangan, bukan penilaian atau diagnosis. Cocokkan dengan bukti belajar dan pengamatan guru.
                      </p>
                    </div>
                  ) : !insightLoading && !insightError ? (
                    <p className="rounded-xl bg-canvas p-3 text-sm leading-5 text-secondary-content">
                      Buat analisis untuk meninjau kemampuan dan dukungan belajar berdasarkan data siswa yang tersedia.
                    </p>
                  ) : null}
                </div>
              </Card>

              <Card className="p-4 sm:p-5">
                <SectionHeading eyebrow="Dasar peninjauan" title="Bukti belajar tersedia" />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <EvidenceMetric label="Progress komik" value={`${recordedProgress.length}/${comicProgress.length}`} />
                  <EvidenceMetric label="Jawaban dapat dinilai" value={String(judgedAnswerCount)} />
                  <EvidenceMetric label="Aktivitas tercatat" value={String(activities.length)} />
                  <EvidenceMetric label="Refleksi tersimpan" value={String(reflections.length)} />
                </div>
                <p className="mt-3 text-xs leading-5 text-secondary-content">
                  Perkembangan tahap dan aktivitas menunjukkan catatan belajar, bukan bukti tunggal penguasaan atau karakter siswa.
                </p>
              </Card>
            </aside>
          </div>

          <details className="rounded-2xl border border-ui-border bg-white shadow-sm">
            <summary className="min-h-14 cursor-pointer px-4 py-4 text-sm font-bold text-ink sm:px-5">
              Hasil belajar dan data pendukung lainnya
            </summary>
            <div className="space-y-4 border-t border-ui-border p-4 sm:p-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <LearningRecords title="Jawaban identifikasi" records={identificationAnswers} />
                <LearningRecords title="Aktivitas penerapan" records={applicationActivities} />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <LearningRecords title="Progres modul lain" records={moduleProgress} />
                <LearningRecords title="Percakapan AI Tutor terbaru" records={aiTutorChats} />
              </div>
              <section className="rounded-xl border border-ui-border p-4">
                <h3 className="text-sm font-bold text-ink">Evaluasi CINARAI</h3>
                {!evaluation ? (
                  <p className="mt-2 text-sm text-secondary-content">Belum ada dokumen evaluasi tersimpan.</p>
                ) : (
                  <>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-secondary-content">
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
                    {Object.entries(evaluation.answers ?? {}).length > 0 && (
                      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                        {Object.entries(evaluation.answers).map(([challengeId, answer]) => (
                          <li key={challengeId} className="min-w-0 rounded-lg bg-canvas p-3">
                            <p className="text-xs font-semibold text-secondary-content">Tantangan {challengeId.replace('challenge', '')}</p>
                            <p className="mt-1 break-words text-sm text-ink">{formatProfileValue(answer) ?? 'Belum diisi'}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </section>
            </div>
          </details>
        </>
      )}
    </div>
  );
}

function textValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function formatTimestamp(value: unknown): string {
  const date = firstValidDate({ value }, ['value']);
  return date
    ? date.toLocaleDateString('id-ID')
    : 'Belum diisi';
}

function ProfileValue({ label, value }: { label: string; value: unknown }) {
  const displayValue = formatProfileValue(value) ?? 'Belum diisi';
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-secondary-content">{label}</dt>
      <dd className="mt-1 break-words text-ink">{displayValue}</dd>
    </div>
  );
}

const DISPLAYED_PROFILE_FIELDS = new Set([
  'id', 'uid', 'email', 'displayName', 'username', 'nickname', 'gender', 'schoolName',
  'schoolId', 'classLevel', 'gradeLevel', 'createdAt', 'updatedAt', 'lastLoginAt', 'bio',
  'photoURL', 'avatar', 'role', 'isActive', 'duplicate', 'teacherUid',
]);

const PROFILE_FIELD_LABELS: Record<string, string> = {
  attendanceNumber: 'Nomor absen',
  attendanceNo: 'Nomor absen',
  rollNumber: 'Nomor absen',
  nomorAbsen: 'Nomor absen',
  noAbsen: 'Nomor absen',
  studentNumber: 'Nomor siswa',
  studentNo: 'Nomor siswa',
  nis: 'NIS',
  nisn: 'NISN',
};

function getAdditionalProfileFields(profile: UserDocument | null) {
  return Object.entries(profile ?? {})
    .filter(([key, value]) => !DISPLAYED_PROFILE_FIELDS.has(key)
      && value !== undefined && value !== null && value !== '')
    .map(([key, value]) => ({
      key,
      label: PROFILE_FIELD_LABELS[key] ?? key.replace(/([a-z0-9])([A-Z])/g, '$1 $2'),
      value: formatProfileValue(value),
    }))
    .filter((entry): entry is typeof entry & { value: string } => entry.value !== null);
}

function formatProfileValue(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value && typeof value === 'object' && 'toDate' in value
    && typeof value.toDate === 'function') {
    return formatTimestamp(value);
  }
  if (value && typeof value === 'object') {
    const serialized = JSON.stringify(value);
    return serialized === '{}' || serialized === '[]' ? null : serialized;
  }
  return null;
}

function LearningRecords({
  title,
  records,
}: {
  title: string;
  records: Record<string, unknown>[];
}) {
  const [page, setPage] = useState(0);
  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(records.length / pageSize));
  const visible = records.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <section className="min-w-0">
      <h4 className="text-sm font-bold text-ink">{title}</h4>
      {visible.length ? (
        <ul className="mt-2 space-y-2">
          {visible.map((record, index) => {
            const date = firstValidDate(record, ['updatedAt', 'timestamp', 'createdAt', 'occurredAt', 'submittedAt']);
            return (
              <li key={String(record.id ?? `${title}:${page * pageSize + index}`)} className="rounded-lg bg-canvas p-3 text-xs">
                <p className="font-semibold text-ink">{recordTitle(record, title)}</p>
                {recordDetails(record, title).map((detail) => (
                  <p key={detail} className="mt-1 whitespace-pre-wrap break-words leading-5 text-secondary-content">{detail}</p>
                ))}
                {date && (
                  <time className="mt-1 block text-[10px] text-secondary-content" dateTime={date.toISOString()}>
                    {date.toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                  </time>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-2 rounded-lg bg-canvas p-3 text-xs text-secondary-content">Belum ada data.</p>
      )}
      {pageCount > 1 && (
        <div className="mt-2 flex items-center justify-between gap-2">
          <button type="button" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} className="min-h-11 rounded-lg border border-ui-border px-3 text-xs font-semibold disabled:opacity-40">Sebelumnya</button>
          <span className="text-[10px] text-secondary-content">{page + 1}/{pageCount}</span>
          <button type="button" disabled={page + 1 >= pageCount} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} className="min-h-11 rounded-lg border border-ui-border px-3 text-xs font-semibold disabled:opacity-40">Berikutnya</button>
        </div>
      )}
    </section>
  );
}

function recordTitle(record: Record<string, unknown>, section: string): string {
  if (section.includes('identifikasi')) return `Komik ${record.comicId ?? '—'} · Langkah ${record.step ?? '—'}`;
  if (section.includes('penerapan')) return `Komik ${record.comicId ?? '—'} · Penerapan`;
  if (section === 'Refleksi') return `Refleksi Komik ${record.comicId ?? record.moduleId ?? '—'}`;
  if (section.includes('AI Tutor')) return textValue(record.title) ?? 'Percakapan AI Tutor';
  return textValue(record.moduleId) ?? 'Progres modul';
}

function recordDetails(record: Record<string, unknown>, section: string): string[] {
  if (section.includes('identifikasi')) {
    const details = [
      textValue(record.selectedAnswer) ? `Jawaban: ${textValue(record.selectedAnswer)}` : null,
      textValue(record.reason) ? `Alasan: ${textValue(record.reason)}` : null,
      textValue(record.note) ? `Catatan: ${textValue(record.note)}` : null,
    ];
    if (typeof record.isCorrect === 'boolean') details.push(`Ketepatan: ${record.isCorrect ? 'Benar' : 'Belum tepat'}`);
    else if (typeof record.correct === 'boolean') details.push(`Ketepatan: ${record.correct ? 'Benar' : 'Belum tepat'}`);
    if (typeof record.score === 'number') details.push(`Skor: ${record.score}`);
    return [
      ...details.filter((detail): detail is string => Boolean(detail)),
      ...additionalRecordDetails(record, ['selectedAnswer', 'reason', 'note', 'isCorrect', 'correct', 'score']),
    ];
  }
  if (section.includes('penerapan')) {
    return [
      textValue(record.selectedAnswer) ? `Jawaban: ${textValue(record.selectedAnswer)}` : null,
      textValue(record.studentReason) ? `Alasan: ${textValue(record.studentReason)}` : null,
      textValue(record.coachMessage) ? `Umpan balik: ${textValue(record.coachMessage)}` : null,
      typeof record.score === 'number' ? `Skor: ${record.score}` : null,
      ...additionalRecordDetails(record, ['selectedAnswer', 'studentReason', 'coachMessage', 'score']),
    ].filter((detail): detail is string => Boolean(detail));
  }
  if (section === 'Refleksi') {
    return [
      textValue(record.reflectionText) ?? textValue(record.response),
      typeof record.rating === 'number' ? `Penilaian: ${record.rating}` : null,
      typeof record.confidence === 'number' ? `Keyakinan: ${record.confidence}` : null,
      ...additionalRecordDetails(record, ['reflectionText', 'response', 'rating', 'confidence']),
    ].filter((detail): detail is string => Boolean(detail));
  }
  if (section.includes('AI Tutor')) {
    const messages = Array.isArray(record.messages) ? record.messages : [];
    const question = [...messages].reverse().find((message) =>
      message && typeof message === 'object' && 'role' in message && message.role === 'user'
    );
    const content = question && typeof question === 'object' && 'content' in question
      && typeof question.content === 'string' ? question.content : null;
    return [
      typeof record.lastMessage === 'string' && record.lastMessage.trim()
        ? `Pesan terakhir: ${record.lastMessage.trim()}`
        : content ? `Pertanyaan terbaru: ${content}` : null,
      `Jumlah pesan: ${messages.length}`,
    ].filter((detail): detail is string => Boolean(detail));
  }
  return [
    typeof record.status === 'string' ? `Status: ${record.status}` : null,
    typeof record.score === 'number' ? `Skor: ${record.score}` : null,
    typeof record.completedItems === 'number' && typeof record.totalItems === 'number'
      ? `Item selesai: ${record.completedItems}/${record.totalItems}`
      : null,
    ...additionalRecordDetails(record, ['status', 'score', 'completedItems', 'totalItems', 'moduleId']),
  ].filter((detail): detail is string => Boolean(detail));
}

function additionalRecordDetails(record: Record<string, unknown>, displayedFields: string[]): string[] {
  const excludedFields = new Set([
    'id', 'uid', 'userId', 'studentId', 'createdAt', 'updatedAt', 'timestamp',
    'localTimestamp', 'occurredAt', 'submittedAt', 'comicId', 'moduleId',
  ]);
  const representedFields = new Set([...excludedFields, ...displayedFields]);
  return Object.entries(record).flatMap(([field, value]) => {
    if (representedFields.has(field) || value === undefined || value === null || value === '') return [];
    const displayValue = formatProfileValue(value);
    if (!displayValue) return [];
    const label = field.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
    return [`${label}: ${displayValue}`];
  });
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

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="border-b border-ui-border px-4 py-4 sm:px-5">
      <p className="text-[11px] font-semibold text-brand-700">{eyebrow}</p>
      <h3 className="guru-section-title mt-0.5">{title}</h3>
    </div>
  );
}

function EvidenceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-canvas p-3">
      <p className="break-words text-[11px] leading-4 text-secondary-content">{label}</p>
      <p className="mt-1 text-lg font-black text-ink">{value}</p>
    </div>
  );
}

function InsightRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'primary' | 'success' | 'warning' | 'neutral';
}) {
  const toneStyles = {
    primary: 'border-brand-100 bg-brand-50/70',
    success: 'border-accent-100 bg-accent-50/70',
    warning: 'border-warning-100 bg-warning-50/70',
    neutral: 'border-ui-border bg-canvas',
  };
  return (
    <div className={`min-w-0 rounded-xl border p-3 ${toneStyles[tone]}`}>
      <p className="text-xs font-bold text-secondary-content">{label}</p>
      <p className="mt-1 break-words text-sm leading-5 text-ink">{value}</p>
    </div>
  );
}
