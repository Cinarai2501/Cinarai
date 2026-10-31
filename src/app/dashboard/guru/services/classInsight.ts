import { getModuleStudentStatus as getSharedModuleStudentStatus } from './progressStatus';

export interface ClassInsightProgress {
  comicId: number;
  percentage: number | null;
  status?: string;
  completedStages: string[];
  updatedAt: string | null;
  assessmentScores: Array<{ type: string; score: number }>;
}

export interface ClassInsightStudent {
  uid: string;
  name: string;
  progress: ClassInsightProgress[];
  lastRecordedProgressAt: string | null;
}

export interface ClassInsightComic {
  comicId: number;
  title: string;
  stages: string[];
}

export interface ClassInsightAnswer {
  userId: string;
  comicId: number;
  step: number;
  selectedAnswer: string | null;
  correctAnswer: string | null;
  question: string;
  recordedAt: string | null;
}

export interface ClassInsightActivity {
  userId: string;
  type: string;
  comicId: number | null;
  occurredAt: string;
}

export interface ClassInsightReflection {
  userId: string;
  comicId: number | null;
  confidence: number | null;
  recordedAt: string | null;
}

export interface ClassInsightApplication {
  userId: string;
  comicId: number | null;
  coachType: string | null;
  recordedAt: string | null;
}

export interface ClassInsightFacts {
  generatedAt: string;
  historyPeriod: { from: string | null; to: string | null };
  scope: {
    studentCount: number;
    comicCount: number;
    assessmentRecords: number;
    applicationRecords: number;
    reflectionRecords: number;
    activityRecords: number;
    learningActivityRecords: number;
    sampleLimitPerQuery: number;
    sampleMayBeTruncated: boolean;
    rosterMayBeTruncated: boolean;
  };
  summary: {
    studentsStarted: number;
    studentsCompletedAnyComic: number;
    studentsWithNoRecordedProgress: number;
    studentsWithLowRecordedProgress: number;
    studentsNeedingAttention: number;
    studentsWithLearningActivity: number;
    averageRecordedProgress: number | null;
    recordedProgressCount: number;
  };
  activityByType: Array<{ type: string; eventCount: number }>;
  mostActiveStudents: Array<{ uid: string; name: string; eventCount: number }>;
  assessments: Array<{ type: string; averageScore: number; recordCount: number }>;
  comics: Array<{
    comicId: number;
    title: string;
    studentsStarted: number;
    studentsCompleted: number;
    averageRecordedProgress: number | null;
    progressRecordCount: number;
    assessmentSummaries: Array<{ type: string; averageScore: number; recordCount: number }>;
    stages: Array<{ name: string; completedStudents: number; denominator: number }>;
  }>;
  difficulties: Array<{
    comicId: number;
    comicTitle: string;
    question: string;
    incorrectCount: number;
    judgedAnswerCount: number;
  }>;
  attentionStudents: Array<{
    uid: string;
    name: string;
    reasons: string[];
  }>;
  activityByWeek: Array<{ weekStarting: string; eventCount: number }>;
  limitations: string[];
}

export interface ClassInsightAiResult {
  interpretation: string;
  recommendations: string[];
  limitations: string[];
}

export function getModuleStudentStatus(progress: {
  status?: unknown;
  percentage?: unknown;
  completedStages?: unknown;
  currentStage?: unknown;
  readerPage?: unknown;
  readerCompleted?: unknown;
  stageData?: unknown;
  sintaksList?: unknown;
}): 'not_started' | 'learning' | 'completed' {
  return getSharedModuleStudentStatus(progress);
}

export function buildClassInsightFacts(input: {
  students: ClassInsightStudent[];
  comics: ClassInsightComic[];
  answers: ClassInsightAnswer[];
  activities: ClassInsightActivity[];
  reflections: ClassInsightReflection[];
  applications: ClassInsightApplication[];
  generatedAt?: Date;
  sampleLimitPerQuery: number;
  sampleMayBeTruncated: boolean;
  rosterMayBeTruncated?: boolean;
}): ClassInsightFacts {
  const generatedAt = input.generatedAt ?? new Date();
  const allProgressRows = input.students.flatMap((student) =>
    student.progress.map((progress) => ({ student, progress }))
  );
  const progressRows = allProgressRows.filter(({ progress }) => progress.comicId > 0);
  const recordedProgress = progressRows.flatMap(({ progress }) =>
    progress.percentage === null ? [] : [progress.percentage]
  );
  const comics = input.comics.map((comic) => {
    const moduleRows = progressRows.filter(({ progress }) => progress.comicId === comic.comicId);
    const completions = moduleRows.filter(({ progress }) => progress.status === 'completed');
    const assessmentGroups = new Map<string, number[]>();
    moduleRows.forEach(({ progress }) => progress.assessmentScores.forEach((assessment) => {
      const scores = assessmentGroups.get(assessment.type) ?? [];
      scores.push(assessment.score);
      assessmentGroups.set(assessment.type, scores);
    }));
    const stages = comic.stages.map((stage) => ({
      name: stage,
      completedStudents: moduleRows.filter(({ progress }) => progress.completedStages.includes(stage)).length,
      denominator: input.students.length,
    }));
    return {
      comicId: comic.comicId,
      title: comic.title,
      studentsStarted: moduleRows.filter(({ progress }) =>
        progress.status === 'learning' || progress.status === 'in_progress' || progress.status === 'completed'
      ).length,
      studentsCompleted: completions.length,
      averageRecordedProgress: moduleRows.some(({ progress }) => progress.percentage !== null)
        ? roundedMean(moduleRows.flatMap(({ progress }) => progress.percentage === null ? [] : [progress.percentage]))
        : null,
      progressRecordCount: moduleRows.filter(({ progress }) => progress.percentage !== null).length,
      assessmentSummaries: Array.from(assessmentGroups.entries()).map(([type, scores]) => ({
        type,
        averageScore: roundedMean(scores),
        recordCount: scores.length,
      })),
      stages,
    };
  });
  const allAssessmentGroups = new Map<string, number[]>();
  allProgressRows.forEach(({ progress }) => progress.assessmentScores.forEach((assessment) => {
    const scores = allAssessmentGroups.get(assessment.type) ?? [];
    scores.push(assessment.score);
    allAssessmentGroups.set(assessment.type, scores);
  }));
  const assessments = Array.from(allAssessmentGroups.entries()).map(([type, scores]) => ({
    type,
    averageScore: roundedMean(scores),
    recordCount: scores.length,
  }));

  const answerGroups = new Map<string, {
    comicId: number;
    step: number;
    incorrectCount: number;
    judgedAnswerCount: number;
  }>();
  input.answers.forEach((answer) => {
    const selected = normalize(answer.selectedAnswer);
    const correct = normalize(answer.correctAnswer);
    if (!selected || !correct) return;
    const key = `${answer.comicId}:${answer.step}`;
    const group = answerGroups.get(key) ?? {
      comicId: answer.comicId,
      step: answer.step,
      incorrectCount: 0,
      judgedAnswerCount: 0,
    };
    group.judgedAnswerCount += 1;
    if (selected !== correct) group.incorrectCount += 1;
    answerGroups.set(key, group);
  });
  const difficulties = Array.from(answerGroups.values())
    .filter((answer) => answer.incorrectCount > 0)
    .map((answer) => ({
      ...answer,
      comicTitle: input.comics.find((comic) => comic.comicId === answer.comicId)?.title ?? `Komik ${answer.comicId}`,
      question: input.answers.find((item) =>
        item.comicId === answer.comicId && item.step === answer.step && item.question.trim()
      )?.question ?? `Langkah identifikasi ${answer.step + 1}`,
    }))
    .sort((left, right) => right.incorrectCount - left.incorrectCount)
    .slice(0, 8);

  const wrongAnswerCounts = new Map<string, number>();
  input.answers.forEach((answer) => {
    const selected = normalize(answer.selectedAnswer);
    const correct = normalize(answer.correctAnswer);
    if (answer.userId && selected && correct && selected !== correct) {
      wrongAnswerCounts.set(answer.userId, (wrongAnswerCounts.get(answer.userId) ?? 0) + 1);
    }
  });
  const confidenceByUid = new Map<string, number>();
  input.reflections.forEach((reflection) => {
    if (!reflection.userId || reflection.confidence === null) return;
    const previous = confidenceByUid.get(reflection.userId);
    if (previous === undefined || reflection.confidence < previous) {
      confidenceByUid.set(reflection.userId, reflection.confidence);
    }
  });
  const applicationFeedbackByUid = new Map<string, number>();
  input.applications.forEach((application) => {
    if (application.userId && application.coachType === 'constructive') {
      applicationFeedbackByUid.set(
        application.userId,
        (applicationFeedbackByUid.get(application.userId) ?? 0) + 1
      );
    }
  });

  const attentionStudents = input.students.flatMap((student) => {
    const reasons: string[] = [];
    const studentProgress = student.progress.filter((progress) => progress.percentage !== null);
    const average = studentProgress.length ? roundedMean(studentProgress.map((progress) => progress.percentage as number)) : null;
    if (studentProgress.length >= 2 && average !== null && average < 40) {
      reasons.push(`Rata-rata progress ${average}% pada ${studentProgress.length} komik yang memiliki data.`);
    }
    const updatedAt = student.lastRecordedProgressAt ? Date.parse(student.lastRecordedProgressAt) : Number.NaN;
    if (Number.isFinite(updatedAt) && generatedAt.getTime() - updatedAt >= 14 * 24 * 60 * 60 * 1000) {
      reasons.push(`Progress terakhir tercatat ${Math.floor((generatedAt.getTime() - updatedAt) / (24 * 60 * 60 * 1000))} hari lalu.`);
    }
    const wrongAnswers = wrongAnswerCounts.get(student.uid) ?? 0;
    if (wrongAnswers >= 2) reasons.push(`${wrongAnswers} jawaban identifikasi dinilai keliru.`);
    const confidence = confidenceByUid.get(student.uid);
    if (confidence !== undefined && confidence <= 2) {
      reasons.push(`Confidence refleksi terendah ${confidence}/5.`);
    }
    const constructiveFeedback = applicationFeedbackByUid.get(student.uid) ?? 0;
    if (constructiveFeedback >= 2) {
      reasons.push(`${constructiveFeedback} aktivitas aplikasi tersimpan menerima umpan balik konstruktif.`);
    }
    if (reasons.length < 2) return [];
    return [{ uid: student.uid, name: student.name, reasons }];
  });

  const timestamps = [
    ...input.activities.map((activity) => activity.occurredAt),
    ...input.answers.map((answer) => answer.recordedAt),
    ...input.reflections.map((reflection) => reflection.recordedAt),
    ...input.applications.map((application) => application.recordedAt),
    ...progressRows.map(({ progress }) => progress.updatedAt),
  ].flatMap((value) => value && Number.isFinite(Date.parse(value)) ? [new Date(value)] : []);
  const learningActivities = input.activities.filter((activity) =>
    [
      'lesson_started',
      'lesson_completed',
      'comic_started',
      'comic_completed',
      'reflection_submitted',
      'ai_tutor_question',
    ].includes(activity.type)
  );
  const activityCountsByType = new Map<string, number>();
  learningActivities.forEach((activity) => {
    activityCountsByType.set(
      activity.type,
      (activityCountsByType.get(activity.type) ?? 0) + 1
    );
  });
  const activityByType = Array.from(activityCountsByType.entries())
    .map(([type, eventCount]) => ({ type, eventCount }));
  const activityCountsByUid = new Map<string, number>();
  learningActivities.forEach((activity) => {
    if (activity.userId) {
      activityCountsByUid.set(activity.userId, (activityCountsByUid.get(activity.userId) ?? 0) + 1);
    }
  });
  const mostActiveStudents = Array.from(activityCountsByUid.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 5)
    .flatMap(([uid, eventCount]) => {
      const student = input.students.find((candidate) => candidate.uid === uid);
      return student ? [{ uid, name: student.name, eventCount }] : [];
    });
  const activityByWeek = buildWeeklyActivityCounts(learningActivities, generatedAt);
  const studentsWithLowRecordedProgress = input.students.filter((student) => {
    const recorded = student.progress.filter((progress) =>
      progress.comicId > 0 && progress.percentage !== null
    );
    return recorded.length >= 2 && roundedMean(recorded.map((progress) => progress.percentage as number)) < 40;
  }).length;
  const limitations: string[] = [];
  if (!input.students.length) limitations.push('Tidak ada siswa dalam cakupan kewenangan guru.');
  if (!progressRows.length) limitations.push('Belum ada dokumen progress komik tersimpan untuk roster ini.');
  if (!input.answers.some((answer) => normalize(answer.selectedAnswer) && normalize(answer.correctAnswer))) {
    limitations.push('Data jawaban identifikasi yang dapat dinilai belum tersedia.');
  }
  if (!input.activities.length) limitations.push('Belum ada aktivitas bertimestamp yang tersedia.');
  else if (!learningActivities.length) limitations.push('Tidak ada event aktivitas belajar yang dikenali pada periode data.');
  limitations.push('Histori snapshot progress tidak tersedia di struktur data saat ini; grafik hanya menghitung aktivitas bertimestamp, bukan tren persentase progress.');
  if (input.sampleMayBeTruncated) {
    limitations.push(`Beberapa sumber riwayat mencapai batas ${input.sampleLimitPerQuery} dokumen per query; metrik sumber tersebut adalah sampel terbaru, bukan hitungan seluruh histori.`);
  }
  if (input.rosterMayBeTruncated) {
    limitations.push('Analisis kelas mencakup maksimal 100 siswa pertama dalam roster; hasil tidak mewakili seluruh roster yang lebih besar.');
  }

  return {
    generatedAt: generatedAt.toISOString(),
    historyPeriod: timestamps.length
      ? {
        from: new Date(Math.min(...timestamps.map((date) => date.getTime()))).toISOString(),
        to: new Date(Math.max(...timestamps.map((date) => date.getTime()))).toISOString(),
      }
      : { from: null, to: null },
    scope: {
      studentCount: input.students.length,
      comicCount: input.comics.length,
      assessmentRecords: input.answers.length,
      applicationRecords: input.applications.length,
      reflectionRecords: input.reflections.length,
      activityRecords: input.activities.length,
      learningActivityRecords: learningActivities.length,
      sampleLimitPerQuery: input.sampleLimitPerQuery,
      sampleMayBeTruncated: input.sampleMayBeTruncated,
      rosterMayBeTruncated: input.rosterMayBeTruncated ?? false,
    },
    summary: {
      studentsStarted: new Set(progressRows
        .filter(({ progress }) =>
          progress.status === 'learning' || progress.status === 'in_progress' || progress.status === 'completed'
        )
        .map(({ student }) => student.uid)).size,
      studentsCompletedAnyComic: new Set(progressRows
        .filter(({ progress }) => progress.status === 'completed')
        .map(({ student }) => student.uid)).size,
      studentsWithNoRecordedProgress: input.students.filter((student) =>
        !student.progress.some((progress) => progress.comicId > 0 && progress.percentage !== null)
      ).length,
      studentsWithLowRecordedProgress,
      studentsNeedingAttention: attentionStudents.length,
      studentsWithLearningActivity: new Set(learningActivities.map((activity) => activity.userId)).size,
      averageRecordedProgress: recordedProgress.length ? roundedMean(recordedProgress) : null,
      recordedProgressCount: recordedProgress.length,
    },
    activityByType,
    mostActiveStudents,
    assessments,
    comics,
    difficulties,
    attentionStudents,
    activityByWeek,
    limitations,
  };
}

export function buildClassInsightPrompt(facts: ClassInsightFacts): string {
  const aggregateOnly = {
    roster: {
      totalStudents: facts.scope.studentCount,
      started: facts.summary.studentsStarted,
      completedAnyComic: facts.summary.studentsCompletedAnyComic,
      withoutRecordedProgress: facts.summary.studentsWithNoRecordedProgress,
      withLowRecordedProgress: facts.summary.studentsWithLowRecordedProgress,
      needingAttention: facts.summary.studentsNeedingAttention,
      averageRecordedProgress: facts.summary.averageRecordedProgress,
      progressRecords: facts.summary.recordedProgressCount,
    },
    modules: facts.comics.slice(0, 6).map((comic) => ({
      comicId: comic.comicId,
      started: comic.studentsStarted,
      completed: comic.studentsCompleted,
      averageRecordedProgress: comic.averageRecordedProgress,
      recordedProgressCount: comic.progressRecordCount,
      assessments: comic.assessmentSummaries,
      stageCompletion: comic.stages.map((stage) => ({
        stage: stage.name,
        completedStudents: stage.completedStudents,
        rosterDenominator: stage.denominator,
      })),
    })),
    classAssessments: facts.assessments,
    activity: {
      totalRecords: facts.scope.activityRecords,
      learningRecords: facts.scope.learningActivityRecords,
      participatingStudents: facts.summary.studentsWithLearningActivity,
      byType: facts.activityByType,
      mostActiveStudentEventCounts: facts.mostActiveStudents.map((student) => student.eventCount),
      byWeek: facts.activityByWeek,
    },
    applicationRecords: facts.scope.applicationRecords,
    reflectionRecords: facts.scope.reflectionRecords,
    difficulties: facts.difficulties.slice(0, 5).map((difficulty) => ({
      comicId: difficulty.comicId,
      step: difficulty.question,
      incorrectAnswers: difficulty.incorrectCount,
      judgedAnswers: difficulty.judgedAnswerCount,
    })),
    dataPeriod: facts.historyPeriod,
    truncated: facts.scope.sampleMayBeTruncated,
  };
  return [
    'Analisis data agregat kelas CINARAI berikut untuk membantu keputusan pembelajaran.',
    'Jangan membuat klaim fakta, skor, nama siswa, sebab psikologis, atau tren progress yang tidak didukung data.',
    'Bedakan interpretasi yang berhati-hati dari rekomendasi yang dapat dilakukan guru.',
    'Jika data kurang atau sampel terbatas, nyatakan keterbatasannya.',
    'Kembalikan JSON valid dengan bentuk {"interpretation":"maksimal 3 kalimat singkat","recommendations":["maksimal 3 langkah konkret"],"limitations":["maksimal 2 batasan"]}.',
    'Data:',
    JSON.stringify(aggregateOnly),
  ].join('\n');
}

export function parseClassInsightResponse(content: string): ClassInsightAiResult | null {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const value: unknown = JSON.parse(jsonMatch[0]);
    if (!value || typeof value !== 'object') return null;
    const record = value as Record<string, unknown>;
    if (
      typeof record.interpretation !== 'string'
      || !record.interpretation.trim()
      || !Array.isArray(record.recommendations)
      || !record.recommendations.every((item) => typeof item === 'string' && item.trim())
      || !Array.isArray(record.limitations)
      || !record.limitations.every((item) => typeof item === 'string' && item.trim())
    ) return null;
    return {
      interpretation: record.interpretation.trim().slice(0, 700),
      recommendations: record.recommendations.slice(0, 3).map((item) => item.trim().slice(0, 220)),
      limitations: record.limitations.slice(0, 2).map((item) => item.trim().slice(0, 220)),
    };
  } catch {
    return null;
  }
}

function roundedMean(values: number[]): number {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function normalize(value: string | null): string {
  return value?.trim().toLocaleLowerCase('id') ?? '';
}

function buildWeeklyActivityCounts(activities: ClassInsightActivity[], now: Date) {
  const counts = new Map<string, number>();
  const currentWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = currentWeek.getUTCDay();
  currentWeek.setUTCDate(currentWeek.getUTCDate() - ((day + 6) % 7));
  const firstWeek = new Date(currentWeek);
  firstWeek.setUTCDate(firstWeek.getUTCDate() - 7 * 7);
  activities.forEach((activity) => {
    const timestamp = Date.parse(activity.occurredAt);
    if (!Number.isFinite(timestamp)) return;
    const eventDate = new Date(timestamp);
    const week = new Date(Date.UTC(eventDate.getUTCFullYear(), eventDate.getUTCMonth(), eventDate.getUTCDate()));
    week.setUTCDate(week.getUTCDate() - ((week.getUTCDay() + 6) % 7));
    if (week < firstWeek || week > currentWeek) return;
    const key = week.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return Array.from({ length: 8 }, (_, index) => {
    const week = new Date(firstWeek);
    week.setUTCDate(week.getUTCDate() + index * 7);
    const weekStarting = week.toISOString().slice(0, 10);
    return { weekStarting, eventCount: counts.get(weekStarting) ?? 0 };
  });
}
