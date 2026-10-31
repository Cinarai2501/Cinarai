export type StudentInsightRecommendationCategory =
  | 'review'
  | 'activity'
  | 'support'
  | 'encouragement'
  | 'next_check';

const learningActivityTypes = new Set([
  'lesson_started',
  'lesson_completed',
  'comic_started',
  'comic_completed',
  'reflection_submitted',
]);

export interface StudentInsightAiItem {
  text: string;
  evidenceKeys: string[];
}

export interface StudentInsightRecommendation extends StudentInsightAiItem {
  category: StudentInsightRecommendationCategory;
  nextIndicator: string;
}

export interface StudentInsightAiResult {
  summary: string;
  summaryEvidenceKeys: string[];
  findings: StudentInsightAiItem[];
  recommendations: StudentInsightRecommendation[];
  limitations: StudentInsightAiItem[];
}

export interface StudentInsightModule {
  comicId: number;
  title: string;
  stages: string[];
}

export interface StudentInsightProgress {
  comicId: number;
  percentage: number | null;
  status: 'not_started' | 'learning' | 'completed';
  completedStages: string[];
  updatedAt: string | null;
  assessments: Array<{ type: string; score: number }>;
}

export interface StudentInsightAnswer {
  comicId: number;
  step: number;
  question: string;
  selectedAnswer: string | null;
  correctAnswer: string | null;
  recordedAt: string | null;
}

export interface StudentInsightActivity {
  type: string;
  comicId: number | null;
  occurredAt: string;
}

export interface StudentInsightApplication {
  comicId: number | null;
  coachType: string | null;
  recordedAt: string | null;
}

export interface StudentInsightReflection {
  rating: number | null;
  confidence: number | null;
  recordedAt: string | null;
}

export interface StudentInsightEvidence {
  key: string;
  label: string;
  detail: string;
}

export function isStudentAllowedForInsight(
  profile: { uid?: unknown; id?: string; role?: unknown; schoolName?: unknown; duplicate?: unknown },
  requestedUid: string,
  teacherRole: unknown,
  teacherSchoolName: string,
): boolean {
  const profileUid = typeof profile.uid === 'string' && profile.uid.trim()
    ? profile.uid.trim()
    : profile.id?.trim();
  return profile.role === 'student'
    && profile.duplicate !== true
    && profileUid === requestedUid
    && (teacherRole === 'admin'
      || (teacherRole === 'teacher'
        && typeof profile.schoolName === 'string'
        && profile.schoolName.trim() === teacherSchoolName));
}

export interface StudentInsightFacts {
  generatedAt: string;
  dataPeriod: { from: string | null; to: string | null };
  modules: Array<{
    comicId: number;
    title: string;
    progressAvailable: boolean;
    percentage: number | null;
    status: 'not_started' | 'learning' | 'completed' | null;
    updatedAt: string | null;
    completedStages: string[];
    remainingStages: string[];
    assessments: Array<{ type: string; score: number }>;
    answers: {
      recordCount: number;
      judgedCount: number;
      correctCount: number;
      incorrectCount: number;
      questions: Array<{
        step: number;
        question: string;
        judgedCount: number;
        correctCount: number;
        incorrectCount: number;
      }>;
    };
  }>;
  assessments: Array<{ type: string; score: number; maximum: number | null }>;
  activity: {
    recordCount: number;
    activeDays: number;
    completedEvents: number;
    byType: Array<{ type: string; count: number }>;
    byWeek: Array<{ weekStarting: string; count: number }>;
  };
  application: {
    recordCount: number;
    feedbackByType: Array<{ type: string; count: number }>;
  };
  reflection: {
    recordCount: number;
    ratedCount: number;
    averageRating: number | null;
    confidenceCount: number;
    averageConfidence: number | null;
  };
  sample: { limitPerQuery: number; mayBeTruncated: boolean };
  evidence: StudentInsightEvidence[];
  limitations: string[];
}

export function buildStudentInsightFacts(input: {
  modules: StudentInsightModule[];
  progress: StudentInsightProgress[];
  evaluationScore: number | null;
  answers: StudentInsightAnswer[];
  activities: StudentInsightActivity[];
  applications: StudentInsightApplication[];
  reflections: StudentInsightReflection[];
  generatedAt?: Date;
  sampleLimitPerQuery: number;
  sampleMayBeTruncated: boolean;
}): StudentInsightFacts {
  const generatedAt = input.generatedAt ?? new Date();
  const progressByComic = new Map(input.progress.map((progress) => [progress.comicId, progress]));
  const modules = input.modules.map((module) => {
    const progress = progressByComic.get(module.comicId);
    const completedStages = progress
      ? module.stages.filter((stage) => progress.completedStages.includes(stage))
      : [];
    const remainingStages = progress
      ? module.stages.filter((stage) => !completedStages.includes(stage))
      : [];
    const moduleAnswers = input.answers.filter((answer) => answer.comicId === module.comicId);
    const questionGroups = new Map<number, {
      step: number;
      question: string;
      judgedCount: number;
      correctCount: number;
      incorrectCount: number;
    }>();
    moduleAnswers.forEach((answer) => {
      const selected = normalize(answer.selectedAnswer);
      const correct = normalize(answer.correctAnswer);
      const group = questionGroups.get(answer.step) ?? {
        step: answer.step,
        question: answer.question,
        judgedCount: 0,
        correctCount: 0,
        incorrectCount: 0,
      };
      if (selected && correct) {
        group.judgedCount += 1;
        if (selected === correct) group.correctCount += 1;
        else group.incorrectCount += 1;
      }
      questionGroups.set(answer.step, group);
    });
    const questions = Array.from(questionGroups.values()).filter((question) => question.judgedCount > 0);
    const answers = {
      recordCount: moduleAnswers.length,
      judgedCount: questions.reduce((sum, question) => sum + question.judgedCount, 0),
      correctCount: questions.reduce((sum, question) => sum + question.correctCount, 0),
      incorrectCount: questions.reduce((sum, question) => sum + question.incorrectCount, 0),
      questions,
    };
    return {
      comicId: module.comicId,
      title: module.title,
      progressAvailable: Boolean(progress),
      percentage: progress?.percentage ?? null,
      status: progress?.status ?? null,
      updatedAt: progress?.updatedAt ?? null,
      completedStages,
      remainingStages,
      assessments: progress?.assessments ?? [],
      answers,
    };
  });

  const validActivities = input.activities.filter((activity) =>
    learningActivityTypes.has(activity.type) && Number.isFinite(Date.parse(activity.occurredAt))
  );
  const byType = countBy(validActivities.map((activity) => activity.type));
  const activeDates = new Set(validActivities.map((activity) => activity.occurredAt.slice(0, 10)));
  const weeklyCounts = new Map<string, number>();
  const activityDates: Date[] = [];
  validActivities.forEach((activity) => {
    const date = new Date(activity.occurredAt);
    if (!Number.isFinite(date.getTime())) return;
    activityDates.push(date);
    const week = weekStarting(date);
    weeklyCounts.set(week, (weeklyCounts.get(week) ?? 0) + 1);
  });
  const byWeek = Array.from({ length: 8 }, (_, index) => {
    const week = new Date(generatedAt);
    week.setUTCHours(0, 0, 0, 0);
    week.setUTCDate(week.getUTCDate() - ((week.getUTCDay() + 6) % 7) - ((7 - index) * 7));
    const weekStarting = week.toISOString().slice(0, 10);
    return { weekStarting, count: weeklyCounts.get(weekStarting) ?? 0 };
  });
  const feedbackByType = countBy(input.applications.flatMap((application) =>
    application.coachType ? [application.coachType] : []
  ));
  const ratings = input.reflections.flatMap((reflection) => reflection.rating === null ? [] : [reflection.rating]);
  const confidences = input.reflections.flatMap((reflection) => reflection.confidence === null ? [] : [reflection.confidence]);
  const evidence: StudentInsightEvidence[] = [];
  const addEvidence = (key: string, label: string, detail: string) => evidence.push({ key, label, detail });

  modules.forEach((module) => {
    if (module.progressAvailable) {
      addEvidence(
        `progress:${module.comicId}`,
        `Progress komik ${module.comicId}`,
        `${module.percentage === null ? 'Persentase tidak tersedia' : `Progress tersimpan ${module.percentage}%`}; ${module.completedStages.length}/${module.completedStages.length + module.remainingStages.length} tahap tersedia selesai; status ${module.status ?? 'tidak tersedia'}${module.updatedAt ? `; diperbarui ${module.updatedAt}` : ''}.`
      );
    }
    if (module.assessments.length) {
      addEvidence(
        `assessment:${module.comicId}`,
        `Asesmen komik ${module.comicId}`,
        module.assessments.map((assessment) => `${assessment.type}: ${assessment.score}`).join('; ')
      );
    }
    if (module.answers.judgedCount) {
      addEvidence(
        `answers:${module.comicId}`,
        `Jawaban terukur komik ${module.comicId}`,
        `${module.answers.correctCount}/${module.answers.judgedCount} jawaban benar; ${module.answers.incorrectCount} keliru. ${module.answers.questions.map((question) => `Langkah ${question.step + 1} (${question.question}): ${question.incorrectCount}/${question.judgedCount} keliru`).join('; ')}`
      );
    }
  });
  if (input.evaluationScore !== null) {
    addEvidence('assessment:evaluation-cinarai', 'Evaluasi CINARAI', `Skor penilaian tersimpan ${input.evaluationScore}/40.`);
  }
  if (validActivities.length) {
    addEvidence(
      'activity:frequency',
      'Aktivitas belajar bertimestamp',
      `${validActivities.length} event; ${activeDates.size} hari aktif; ${byType.map((item) => `${item.type}: ${item.count}`).join(', ')}.`
    );
    if (validActivities.some((activity) => activity.type === 'lesson_completed' || activity.type === 'comic_completed')) {
      addEvidence(
        'activity:completion',
        'Event penyelesaian',
        `${validActivities.filter((activity) => activity.type === 'lesson_completed' || activity.type === 'comic_completed').length} event lesson/comic_completed tercatat.`
      );
    }
  }
  if (input.applications.length) {
    addEvidence(
      'application:feedback',
      'Aktivitas penerapan',
      `${input.applications.length} aktivitas penerapan; feedback tersimpan: ${feedbackByType.map((item) => `${item.type} ${item.count}`).join(', ') || 'tidak tersedia'}.`
    );
  }
  if (input.reflections.length) {
    addEvidence(
      'reflection:ratings',
      'Refleksi',
      `${input.reflections.length} refleksi; ${ratings.length} rating dan ${confidences.length} nilai confidence bertipe 1–5 tersedia.`
    );
  }

  const timestamps = [
    ...input.progress.flatMap((progress) => progress.updatedAt ? [progress.updatedAt] : []),
    ...input.answers.flatMap((answer) => answer.recordedAt ? [answer.recordedAt] : []),
    ...activityDates.map((date) => date.toISOString()),
    ...input.applications.flatMap((application) => application.recordedAt ? [application.recordedAt] : []),
    ...input.reflections.flatMap((reflection) => reflection.recordedAt ? [reflection.recordedAt] : []),
  ].flatMap((value) => Number.isFinite(Date.parse(value)) ? [new Date(value)] : []);

  const limitations: string[] = [];
  if (!input.progress.length) limitations.push('Tidak ada dokumen progress komik tersimpan; ini bukan bukti siswa gagal atau tidak belajar.');
  else if (modules.some((module) => !module.progressAvailable)) {
    limitations.push('Sebagian modul tidak memiliki dokumen progress; data kosong bukan bukti siswa gagal atau tidak belajar.');
  }
  if (!input.answers.some((answer) => normalize(answer.selectedAnswer) && normalize(answer.correctAnswer))) {
    limitations.push('Belum ada jawaban dengan kunci yang dapat dinilai; penguasaan dari jawaban belum dapat disimpulkan.');
  }
  if (!validActivities.length) limitations.push('Tidak ada aktivitas bertimestamp valid; frekuensi dan konsistensi aktivitas belum dapat dihitung.');
  if (!input.applications.length) limitations.push('Data aktivitas penerapan/umpan balik belum tersedia.');
  if (!input.reflections.length) limitations.push('Data refleksi belum tersedia.');
  limitations.push('Riwayat snapshot progress tidak tersedia; progress saat ini tidak dapat dibandingkan sebagai tren dari waktu ke waktu.');
  if (input.sampleMayBeTruncated) {
    limitations.push(`Sedikitnya satu sumber mencapai batas ${input.sampleLimitPerQuery} dokumen; jumlah terkait hanya mewakili sampel terbaru.`);
  }

  return {
    generatedAt: generatedAt.toISOString(),
    dataPeriod: timestamps.length
      ? {
        from: new Date(Math.min(...timestamps.map((date) => date.getTime()))).toISOString(),
        to: new Date(Math.max(...timestamps.map((date) => date.getTime()))).toISOString(),
      }
      : { from: null, to: null },
    modules,
    assessments: input.evaluationScore === null
      ? []
      : [{ type: 'Evaluasi CINARAI', score: input.evaluationScore, maximum: 40 }],
    activity: {
      recordCount: validActivities.length,
      activeDays: activeDates.size,
      completedEvents: validActivities.filter((activity) =>
        activity.type === 'lesson_completed' || activity.type === 'comic_completed'
      ).length,
      byType,
      byWeek,
    },
    application: { recordCount: input.applications.length, feedbackByType },
    reflection: {
      recordCount: input.reflections.length,
      ratedCount: ratings.length,
      averageRating: ratings.length ? mean(ratings) : null,
      confidenceCount: confidences.length,
      averageConfidence: confidences.length ? mean(confidences) : null,
    },
    sample: { limitPerQuery: input.sampleLimitPerQuery, mayBeTruncated: input.sampleMayBeTruncated },
    evidence,
    limitations,
  };
}

export function buildStudentInsightPrompt(facts: StudentInsightFacts): string {
  const input = {
    modules: facts.modules.map((module) => ({
      comicId: module.comicId,
      progressAvailable: module.progressAvailable,
      percentage: module.percentage,
      status: module.status,
      completedStages: module.completedStages,
      remainingStages: module.remainingStages,
      assessments: module.assessments,
      answers: module.answers.questions.map((question) => ({
        step: question.step + 1,
        topic: question.question.slice(0, 120),
        correct: question.correctCount,
        incorrect: question.incorrectCount,
        judged: question.judgedCount,
      })),
    })),
    evaluation: facts.assessments,
    activity: {
      byType: facts.activity.byType,
      byWeek: facts.activity.byWeek,
      activeDays: facts.activity.activeDays,
      completionEvents: facts.activity.completedEvents,
    },
    application: facts.application,
    reflection: facts.reflection,
    period: facts.dataPeriod,
    evidence: getStudentInsightPromptEvidence(facts).map(({ key, label, detail }) => ({ key, label, detail })),
    limitations: facts.limitations,
  };
  return [
    'Bantu guru meninjau bukti belajar satu siswa CINARAI. Data berikut sudah diminimalkan dan tidak memuat identitas atau jawaban/refleksi bebas.',
    'Jangan simpulkan motivasi, emosi, kepribadian, atau sebab psikologis. Progress/tahap selesai bukan bukti penguasaan. Jangan anggap data kosong sebagai kegagalan.',
    'Setiap temuan dan rekomendasi wajib memakai satu atau lebih evidenceKeys persis dari daftar evidence; jangan membuat kunci atau fakta baru. Jika bukti tidak cukup, nyatakan pada limitations.',
    'Recommendations harus praktis dan tidak menghakimi. category hanya review, activity, support, encouragement, atau next_check.',
    'Kembalikan JSON valid dengan bentuk {"summary":"maksimal 3 kalimat","summaryEvidenceKeys":["progress:1"],"findings":[{"text":"temuan hati-hati","evidenceKeys":["progress:1"]}],"recommendations":[{"category":"review","text":"aksi guru","evidenceKeys":["answers:1"],"nextIndicator":"indikator berikutnya"}],"limitations":[{"text":"batasan","evidenceKeys":["progress:1"]}]}. Maksimal 4 temuan, 5 rekomendasi, 3 batasan.',
    'Data:',
    JSON.stringify(input),
  ].join('\n');
}

const MAX_STUDENT_PROMPT_EVIDENCE = 20;
const MAX_STUDENT_PROMPT_EVIDENCE_CHARS = 220;

export function getStudentInsightPromptEvidence(facts: StudentInsightFacts): StudentInsightEvidence[] {
  return facts.evidence.slice(0, MAX_STUDENT_PROMPT_EVIDENCE).map((item) => ({
    key: item.key,
    label: item.label.slice(0, 80),
    detail: item.detail.slice(0, MAX_STUDENT_PROMPT_EVIDENCE_CHARS),
  }));
}

export function parseStudentInsightResponse(content: string, allowedEvidenceKeys: Set<string>): StudentInsightAiResult | null {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const value: unknown = JSON.parse(jsonMatch[0]);
    if (!isRecord(value) || typeof value.summary !== 'string'
      || !Array.isArray(value.summaryEvidenceKeys) || !Array.isArray(value.findings)
      || !Array.isArray(value.recommendations) || !Array.isArray(value.limitations)) {
      return null;
    }
    const summaryEvidenceKeys = value.summaryEvidenceKeys.filter((key): key is string =>
      typeof key === 'string' && allowedEvidenceKeys.has(key)
    );
    if (!summaryEvidenceKeys.length || summaryEvidenceKeys.length !== value.summaryEvidenceKeys.length) return null;
    const findings = value.findings.slice(0, 4).flatMap((item) => {
      const parsed = parseAiItem(item, allowedEvidenceKeys);
      return parsed ? [parsed] : [];
    });
    const categories: StudentInsightRecommendationCategory[] = ['review', 'activity', 'support', 'encouragement', 'next_check'];
    const recommendations = value.recommendations.slice(0, 5).flatMap((item) => {
      if (!isRecord(item) || typeof item.category !== 'string' || !categories.includes(item.category as StudentInsightRecommendationCategory)
        || typeof item.nextIndicator !== 'string') return [];
      const parsed = parseAiItem(item, allowedEvidenceKeys);
      return parsed ? [{ ...parsed, category: item.category as StudentInsightRecommendationCategory, nextIndicator: item.nextIndicator.slice(0, 240) }] : [];
    });
    const limitations = value.limitations.slice(0, 3).flatMap((item) => {
      const parsed = parseAiItem(item, allowedEvidenceKeys);
      return parsed ? [parsed] : [];
    });
    if (findings.length !== value.findings.length || recommendations.length !== value.recommendations.length
      || limitations.length !== Math.min(value.limitations.length, 3)) return null;
    return {
      summary: value.summary.slice(0, 600),
      summaryEvidenceKeys,
      findings,
      recommendations,
      limitations,
    };
  } catch {
    return null;
  }
}

function parseAiItem(value: unknown, allowedEvidenceKeys: Set<string>): StudentInsightAiItem | null {
  if (!isRecord(value) || typeof value.text !== 'string' || !Array.isArray(value.evidenceKeys)) return null;
  const evidenceKeys = value.evidenceKeys.filter((key): key is string =>
    typeof key === 'string' && allowedEvidenceKeys.has(key)
  );
  if (!value.text.trim() || !evidenceKeys.length || evidenceKeys.length !== value.evidenceKeys.length) return null;
  return { text: value.text.trim().slice(0, 300), evidenceKeys };
}

function countBy(values: string[]): Array<{ type: string; count: number }> {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return Array.from(counts.entries()).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
}

function normalize(value: string | null): string {
  return value?.trim().toLocaleLowerCase('id') ?? '';
}

function mean(values: number[]): number {
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function weekStarting(date: Date): string {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  return start.toISOString().slice(0, 10);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
