'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Card, ProgressBar, ProgressRing, Badge, Skeleton } from './ui';
import type { ComicDocument, ComicProgressDocument, UserDocument } from '@/types/firestore';
import type { CinaraiEvaluationProgress } from '@/types/evaluation';
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
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onGenerateInsight: () => void;
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
  loading,
  error,
  onBack,
  onGenerateInsight,
  onGeneratePdf,
}: Props) {
  const [activityPage, setActivityPage] = useState(0);
  const recordedProgress = comicProgress.flatMap((entry) =>
    entry.progress ? [entry.progress.percentage] : []
  );
  const avgProgress = recordedProgress.length
    ? Math.round(recordedProgress.reduce((sum, percentage) => sum + percentage, 0) / recordedProgress.length)
    : null;
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
              {photoURL
                ? <Image src={photoURL} alt="" width={64} height={64} unoptimized className="h-16 w-16 flex-shrink-0 rounded-full object-cover" />
                : <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-2xl font-black text-primary-700">{displayName.charAt(0).toUpperCase()}</div>}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-black text-neutral-900 truncate">{displayName}</h2>
                <p className="text-sm text-neutral-500 truncate">{email}</p>
                <p className="text-xs text-neutral-500 truncate">@{username?.trim() || 'Belum diisi'}</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <Badge color="primary">{schoolName}</Badge>
                  {classLevel
                    ? <Badge color="secondary">{classLevel}</Badge>
                    : gradeLevel !== null && <Badge color="secondary">Kelas {gradeLevel}</Badge>}
                  {isActive === undefined
                    ? <Badge color="warning">Status akun belum diisi</Badge>
                    : <Badge color={isActive ? 'accent' : 'error'}>{isActive ? 'Aktif' : 'Tidak Aktif'}</Badge>}
                </div>
              </div>
              <div className="flex-shrink-0 text-center">
                {avgProgress === null ? (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-neutral-200 text-lg font-bold text-neutral-400">
                    —
                  </div>
                ) : (
                  <ProgressRing value={avgProgress} size={64} stroke={5} />
                )}
                <p className="mt-1 text-[10px] font-medium text-neutral-500">
                  {avgProgress === null ? 'Belum ada data' : `${recordedProgress.length}/${comicProgress.length} komik`}
                </p>
              </div>
            </div>
            <dl className="mt-4 grid gap-3 border-t border-neutral-100 pt-4 text-sm sm:grid-cols-2">
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
              {additionalProfileFields.map(({ key, label, value }) => (
                <ProfileValue key={key} label={label} value={value} />
              ))}
            </dl>
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
                        ? 'Belum Mulai'
                        : progress.status === 'completed'
                        ? 'Selesai'
                        : `${progress.percentage ?? 0}%`}
                    </Badge>
                  </div>
                  {progress && <ProgressBar value={progress.percentage ?? 0} />}
                  {progress && (
                    <>
                      <p className="mt-1 text-xs text-neutral-400">
                        Tahap terakhir: {progress.completedStage || 'Belum ada'} · Mulai: {formatTimestamp(progress.createdAt)} · Aktivitas terakhir: {formatTimestamp(progress.updatedAt)}
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

          <Card>
            <div className="px-5 pt-4 pb-3 border-b border-neutral-100">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Hasil belajar</p>
              <h3 className="text-base font-black text-neutral-900">Jawaban, penerapan, dan refleksi</h3>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-3">
              <LearningRecords title="Jawaban identifikasi" records={identificationAnswers} />
              <LearningRecords title="Aktivitas penerapan" records={applicationActivities} />
              <LearningRecords title="Refleksi" records={reflections} />
            </div>
          </Card>

          <Card>
            <div className="px-5 pt-4 pb-3 border-b border-neutral-100">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Aktivitas tambahan</p>
              <h3 className="text-base font-black text-neutral-900">Modul belajar dan AI Tutor</h3>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <LearningRecords title="Progres modul lain" records={moduleProgress} />
              <LearningRecords title="Percakapan AI Tutor terbaru" records={aiTutorChats} />
            </div>
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
                <>
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
                  {Object.entries(evaluation.answers ?? {}).length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {Object.entries(evaluation.answers).map(([challengeId, answer]) => (
                        <li key={challengeId} className="rounded-lg bg-neutral-50 p-3">
                          <p className="text-xs font-semibold text-neutral-500">
                            Tantangan {challengeId.replace('challenge', '')}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-neutral-800">
                            {formatProfileValue(answer) ?? 'Belum diisi'}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
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
                {visibleActivities.map((item) => (
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
            {activityPageCount > 1 && (
              <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-3">
                <button
                  type="button"
                  disabled={activityPage === 0}
                  onClick={() => setActivityPage((page) => Math.max(0, page - 1))}
                  className="min-h-10 rounded-lg border border-neutral-200 px-3 text-sm disabled:opacity-40"
                >
                  Sebelumnya
                </button>
                <span className="text-xs text-neutral-500">Halaman {activityPage + 1} dari {activityPageCount}</span>
                <button
                  type="button"
                  disabled={activityPage + 1 >= activityPageCount}
                  onClick={() => setActivityPage((page) => Math.min(activityPageCount - 1, page + 1))}
                  className="min-h-10 rounded-lg border border-neutral-200 px-3 text-sm disabled:opacity-40"
                >
                  Berikutnya
                </button>
              </div>
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

function formatTimestamp(value: unknown): string {
  const date = value && typeof value === 'object' && 'toDate' in value
    && typeof value.toDate === 'function'
    ? value.toDate()
    : value instanceof Date
      ? value
      : null;
  return date instanceof Date && Number.isFinite(date.getTime())
    ? date.toLocaleDateString('id-ID')
    : 'Belum diisi';
}

function ProfileValue({ label, value }: { label: string; value: unknown }) {
  const displayValue = formatProfileValue(value) ?? 'Belum diisi';
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-neutral-500">{label}</dt>
      <dd className="mt-1 break-words text-neutral-800">{displayValue}</dd>
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
      <h4 className="text-sm font-bold text-neutral-800">{title}</h4>
      {visible.length ? (
        <ul className="mt-2 space-y-2">
          {visible.map((record, index) => (
            <li key={String(record.id ?? `${title}:${page * pageSize + index}`)} className="rounded-lg bg-neutral-50 p-3 text-xs">
              <p className="font-semibold text-neutral-800">{recordTitle(record, title)}</p>
              {recordDetails(record, title).map((detail) => (
                <p key={detail} className="mt-1 whitespace-pre-wrap break-words leading-5 text-neutral-600">{detail}</p>
              ))}
              <p className="mt-1 text-[10px] text-neutral-400">
                {formatTimestamp(record.updatedAt ?? record.timestamp ?? record.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 rounded-lg bg-neutral-50 p-3 text-xs text-neutral-500">Belum ada data.</p>
      )}
      {pageCount > 1 && (
        <div className="mt-2 flex items-center justify-between gap-2">
          <button type="button" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} className="min-h-9 rounded border border-neutral-200 px-2 disabled:opacity-40">Sebelumnya</button>
          <span className="text-[10px] text-neutral-500">{page + 1}/{pageCount}</span>
          <button type="button" disabled={page + 1 >= pageCount} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} className="min-h-9 rounded border border-neutral-200 px-2 disabled:opacity-40">Berikutnya</button>
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
