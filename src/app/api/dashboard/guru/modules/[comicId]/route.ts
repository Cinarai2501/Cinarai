import { NextRequest, NextResponse } from 'next/server';
import { comicModules } from '@/features/comics';
import { adminFirestore, adminInitializationError, verifyIdToken } from '@/lib/firebase/admin';
import { AiRouter, AiRouterTimeoutError } from '@/lib/ai/router';
import { buildModuleBlueprint, getModuleStudentStatus } from '@/app/dashboard/guru/services/moduleAnalytics';
import { getCompletedModuleStages } from '@/app/dashboard/guru/services/progressStatus';
import { getModuleProgressPercentage } from '@/app/dashboard/guru/services/progressStatus';
import { normalizeStudentDocuments } from '@/app/dashboard/guru/services/studentNormalization';
import { consumeTeacherAiRateLimit } from '../../rateLimit';
import { readAllPages } from '../../pagedQuery';
import { getStudentRecordOwner } from '@/app/dashboard/guru/services/studentRecordOwnership';
import type { ModuleDetailResponse } from '@/app/dashboard/guru/services/moduleAnalytics';
import type { UserDocument } from '@/types/firestore';
import { FieldPath, type QueryDocumentSnapshot } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ comicId: string }> };
type RawDocument = Record<string, unknown> & { id: string };
type Student = { uid: string; name: string; email: string };
const MODULE_ROSTER_PAGE_SIZE = 200;
const MODULE_SAMPLE_LIMIT = 150;
const MODULE_AI_COOLDOWN_MS = 60_000;
const MAX_MODULE_AI_PROMPT_CHARS = 8_000;

function toRawDocument(id: string, data: Record<string, unknown>): RawDocument {
  return { id, ...data };
}

function timestampToIso(value: unknown): string | null {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    const date = value.toDate();
    return date instanceof Date && Number.isFinite(date.getTime()) ? date.toISOString() : null;
  }
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  if (typeof value === 'string' && Number.isFinite(Date.parse(value))) return new Date(value).toISOString();
  return null;
}

function normalizedText(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLocaleLowerCase('id') : '';
}

function stageScore(progress: RawDocument | undefined, stage: string): number | null {
  const stageData = progress?.stageData;
  if (!stageData || typeof stageData !== 'object') return null;
  const data = Reflect.get(stageData, stage) as unknown;
  if (!data || typeof data !== 'object' || !('score' in data)) return null;
  return typeof data.score === 'number' && Number.isFinite(data.score) ? data.score : null;
}

function validConfidence(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 5
    ? value
    : null;
}

async function getScopedData(request: NextRequest, comicId: number, forAi = false) {
  if (!adminFirestore) {
    return {
      response: NextResponse.json(
        { error: adminInitializationError ?? 'Firebase Admin belum tersedia. Periksa konfigurasi server.' },
        { status: 503 }
      ),
    };
  }
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return { response: NextResponse.json({ error: 'Sesi tidak valid.' }, { status: 401 }) };

  let uid: string;
  try {
    const decoded = await verifyIdToken(token);
    if (!decoded?.uid) return { response: NextResponse.json({ error: 'Sesi tidak valid.' }, { status: 401 }) };
    uid = decoded.uid;
  } catch {
    return { response: NextResponse.json({ error: 'Sesi tidak valid.' }, { status: 401 }) };
  }

  const firestore = adminFirestore;
  const profile = await firestore.collection('users').doc(uid).get();
  const profileData = profile.data();
  const role = profileData?.role;
  if (role !== 'teacher' && role !== 'admin') {
    return { response: NextResponse.json({ error: 'Akun ini tidak memiliki akses guru.' }, { status: 403 }) };
  }
  if (forAi && await consumeTeacherAiRateLimit(firestore, uid, MODULE_AI_COOLDOWN_MS)) {
    return {
      response: NextResponse.json(
        { error: 'Analisis AI dibatasi satu kali per akun setiap 60 detik. Coba lagi setelah jeda tersebut.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      ),
    };
  }

  const [comicSnapshot, studentDocuments] = await Promise.all([
    firestore.collection('comics').doc(`comic-${comicId}`).get(),
    (() => {
      const query = firestore.collection('users').where('role', '==', 'student');
      return readAllPages<QueryDocumentSnapshot>(async (cursor, pageSize) => {
        let pageQuery = query.orderBy(FieldPath.documentId()).limit(pageSize);
        if (cursor) pageQuery = pageQuery.startAfter(cursor);
        return (await pageQuery.get()).docs;
      }, MODULE_ROSTER_PAGE_SIZE);
    })(),
  ]);
  const comicDoc = comicSnapshot;
  const rawStudents: UserDocument[] = studentDocuments.map((document) => {
    const data = document.data();
    return {
      id: document.id,
      uid: document.id,
      displayName: typeof data.displayName === 'string' ? data.displayName : undefined,
      email: typeof data.email === 'string' ? data.email : '',
      role: 'student',
      schoolName: typeof data.schoolName === 'string' ? data.schoolName : undefined,
      isActive: typeof data.isActive === 'boolean' ? data.isActive : undefined,
      duplicate: data.duplicate === true,
    };
  });
  const students: Student[] = normalizeStudentDocuments(rawStudents).map((student) => ({
    uid: student.uid,
    name: student.displayName?.trim() || student.email || student.uid,
    email: student.email,
  }));
  const progressRefs = students.map((student) =>
    firestore.collection('users').doc(student.uid).collection('progress').doc(`comic-${comicId}`)
  );
  const progressSnapshots = [];
  for (let offset = 0; offset < progressRefs.length; offset += 100) {
    progressSnapshots.push(...await firestore.getAll(...progressRefs.slice(offset, offset + 100)));
  }
  const progressByUid = new Map<string, RawDocument>();
  progressSnapshots.forEach((snapshot, index) => {
    const data = snapshot.data();
    if (snapshot.exists && data) {
      const student = students[index];
      progressByUid.set(student.uid, toRawDocument(snapshot.id, data));
    }
  });

  const chunks: string[][] = [];
  for (let offset = 0; offset < students.length; offset += 10) {
    chunks.push(students.slice(offset, offset + 10).map((student) => student.uid));
  }
  const answerDocuments: QueryDocumentSnapshot[] = [];
  const applicationDocuments: QueryDocumentSnapshot[] = [];
  const reflectionDocuments = new Map<string, QueryDocumentSnapshot>();
  const readModuleRecords = (collectionName: string, uids: string[]) =>
    Promise.all((['userId', 'studentId'] as const).map((ownerField) =>
      readAllPages<QueryDocumentSnapshot>(async (cursor, pageSize) => {
        let recordsQuery = firestore.collection(collectionName)
          .where(ownerField, 'in', uids)
          .where('comicId', '==', collectionName === 'reflection' ? String(comicId) : comicId)
          .limit(pageSize);
        if (cursor) recordsQuery = recordsQuery.startAfter(cursor);
        return (await recordsQuery.get()).docs;
      }, MODULE_SAMPLE_LIMIT)
    )).then((groups) => {
      const records = new Map<string, QueryDocumentSnapshot>();
      const allowedUids = new Set(uids);
      groups.flat().forEach((document) => {
        if (getStudentRecordOwner(document.data(), allowedUids)) {
          records.set(document.id, document);
        }
      });
      return Array.from(records.values());
    });
  for (const uids of chunks) {
    const [answers, applications, reflections] = await Promise.all([
      readModuleRecords('identification_answers', uids),
      readModuleRecords('application_activity', uids),
      readModuleRecords('reflection', uids),
    ]);
    answerDocuments.push(...answers);
    applicationDocuments.push(...applications);
    reflections.forEach((document) => reflectionDocuments.set(document.id, document));
  }

  const comicData = comicDoc.data() ?? {};
  const comicModule = comicModules[comicId as keyof typeof comicModules];
  if (!comicModule) return { response: NextResponse.json({ error: 'Blueprint modul belum tersedia.' }, { status: 404 }) };
  const studentByUid = new Map(students.map((student) => [student.uid, student]));
  const studentUids = new Set(students.map((student) => student.uid));
  const rawAnswers: RawDocument[] = answerDocuments.map((document) =>
    toRawDocument(document.id, document.data())
  );
  const answered = rawAnswers.map((answer) => {
    const step = typeof answer.step === 'number' ? answer.step : -1;
    const questionDefinition = comicModule.identification.questions[step];
    const selected = typeof answer.selectedAnswer === 'string' ? answer.selectedAnswer.trim() : '';
    const selectedIds = Array.isArray(answer.selectedAnswerIds)
      ? answer.selectedAnswerIds.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      : [];
    const selectedDisplay = selected || selectedIds.join(', ');
    const declaredCorrect = typeof answer.correctAnswer === 'string' ? answer.correctAnswer : '';
    const optionCorrect = questionDefinition?.options.find((option) => option.correct)?.text ?? '';
    const correctAnswer = declaredCorrect || optionCorrect;
    const correct = selected && correctAnswer ? normalizedText(selected) === normalizedText(correctAnswer) : null;
    const uidValue = getStudentRecordOwner(answer, studentUids) ?? '';
    const student = studentByUid.get(uidValue);
    const question = questionDefinition?.question?.trim() || `Pertanyaan identifikasi ${step + 1}`;
    return {
      studentUid: uidValue,
      studentName: student?.name ?? 'Siswa',
      question,
      selectedAnswer: selectedDisplay || 'Jawaban tidak tersedia',
      hasAnswer: Boolean(selectedDisplay),
      correctAnswer: correctAnswer || null,
      correct,
      date: timestampToIso(answer.updatedAt ?? answer.createdAt),
    };
  });
  const questionMap = new Map<string, { question: string; answeredCount: number; incorrectCount: number }>();
  answered.forEach((answer) => {
    if (!answer.hasAnswer) return;
    const item = questionMap.get(answer.question) ?? { question: answer.question, answeredCount: 0, incorrectCount: 0 };
    item.answeredCount += 1;
    if (answer.correct === false) item.incorrectCount += 1;
    questionMap.set(answer.question, item);
  });
  const wrongCounts = new Map<string, number>();
  answered.forEach((answer) => {
    if (answer.correct === false) wrongCounts.set(answer.studentUid, (wrongCounts.get(answer.studentUid) ?? 0) + 1);
  });
  const quizScores = students.flatMap((student) => {
    const score = stageScore(progressByUid.get(student.uid), 'quiz');
    return score === null ? [] : [score];
  });
  const argumentationScores = students.flatMap((student) => {
    const score = stageScore(progressByUid.get(student.uid), 'argumentation');
    return score === null ? [] : [score];
  });
  const applicationScores = students.flatMap((student) => {
    const score = stageScore(progressByUid.get(student.uid), 'application');
    return score === null ? [] : [score];
  });
  const reflections = Array.from(reflectionDocuments.values(), (document) => document.data());
  const appActivities = applicationDocuments.map((document) => document.data());
  const reflectionConfidenceByUid = new Map<string, number>();
  reflections.forEach((reflection) => {
    const userId = getStudentRecordOwner(reflection, studentUids) ?? '';
    const confidence = validConfidence(reflection.confidence ?? reflection.rating);
    if (!userId || confidence === null) return;
    const current = reflectionConfidenceByUid.get(userId);
    if (current === undefined || confidence < current) reflectionConfidenceByUid.set(userId, confidence);
  });

  const progressStudents = students.map((student) => {
    const progress = progressByUid.get(student.uid);
    const completedStages = progress
      ? getCompletedModuleStages({
        completedStages: progress.completedStages,
        sintaksList: progress.sintaksList,
      })
      : new Set<string>();
    return {
      uid: student.uid,
      name: student.name,
      email: student.email,
      status: getModuleStudentStatus(progress ? {
        status: progress.status,
        percentage: progress.percentage,
        completedStages: progress.completedStages,
        currentStage: progress.currentStage,
        readerPage: progress.readerPage,
        readerCompleted: progress.readerCompleted,
        stageData: progress.stageData,
        sintaksList: progress.sintaksList,
      } : null),
      progress: progress
        ? Math.round(getModuleProgressPercentage({
          status: progress.status,
          percentage: progress.percentage,
          completedStages: progress.completedStages,
          sintaksList: progress.sintaksList,
        }))
        : null,
      completedStages: Array.from(completedStages),
      quizScore: stageScore(progress, 'quiz'),
      argumentationScore: stageScore(progress, 'argumentation'),
      applicationScore: stageScore(progress, 'application'),
      incorrectAnswers: wrongCounts.get(student.uid) ?? 0,
      lowConfidence: (() => {
        const introspection = progress?.introspection;
        const progressConfidence = introspection && typeof introspection === 'object' && 'confidence' in introspection
          ? validConfidence(introspection.confidence)
          : null;
        const reflectionConfidence = reflectionConfidenceByUid.get(student.uid) ?? null;
        if (progressConfidence === null) return reflectionConfidence;
        if (reflectionConfidence === null) return progressConfidence;
        return Math.min(progressConfidence, reflectionConfidence);
      })(),
    };
  });
  const completedCount = progressStudents.filter((student) => student.status === 'completed').length;
  const startedCount = progressStudents.filter((student) => student.status !== 'not_started').length;
  const activities = [
    ...answered.map((answer) => ({
      studentName: answer.studentName,
      stage: 'Identification',
      label: answer.correct === null ? 'Jawaban tersimpan' : answer.correct ? 'Jawaban dinilai benar' : 'Jawaban dinilai keliru',
      date: answer.date,
    })),
    ...appActivities.map((activity) => ({
      studentName: studentByUid.get(
        getStudentRecordOwner(activity, studentUids) ?? ''
      )?.name ?? 'Siswa',
      stage: 'Application',
      label: typeof activity.coachType === 'string' ? `Umpan balik: ${activity.coachType}` : 'Aktivitas tersimpan',
      date: timestampToIso(activity.timestamp ?? activity.localTimestamp),
    })),
    ...reflections.map((reflection) => ({
      studentName: studentByUid.get(
        getStudentRecordOwner(reflection, studentUids) ?? ''
      )?.name ?? 'Siswa',
      stage: 'Introspection',
      label: 'Refleksi tersimpan',
      date: timestampToIso(reflection.timestamp ?? reflection.submittedAt ?? reflection.createdAt),
    })),
  ].sort((a, b) => (b.date ? Date.parse(b.date) : 0) - (a.date ? Date.parse(a.date) : 0));
  const completedStageCounts = new Map<string, number>();
  progressStudents.forEach((student) => {
    student.completedStages.forEach((stage) => {
      completedStageCounts.set(stage, (completedStageCounts.get(stage) ?? 0) + 1);
    });
  });
  const blueprint = buildModuleBlueprint(comicModule, completedStageCounts);
  const comic = {
    comicId,
    title: typeof comicData.title === 'string' && comicData.title.trim() ? comicData.title : comicModule.metadata.title,
    subtitle: typeof comicData.subtitle === 'string' ? comicData.subtitle : comicModule.metadata.subtitle,
    description: typeof comicData.synopsis === 'string' && comicData.synopsis.trim() ? comicData.synopsis : comicModule.metadata.synopsis,
    learningTargets: Array.isArray(comicData.learningTargets)
      ? comicData.learningTargets.filter((target): target is string => typeof target === 'string')
      : comicModule.metadata.learningTargets,
    pdfUrl: typeof comicData.pdfUrl === 'string' && comicData.pdfUrl.trim() ? comicData.pdfUrl : null,
  };
  const response: ModuleDetailResponse = {
    limitations: [],
    comic,
    blueprint,
    summary: {
      studentCount: students.length,
      startedCount,
      learningCount: progressStudents.filter((student) => student.status === 'learning').length,
      completedCount,
      completionRate: students.length ? Math.round((completedCount / students.length) * 100) : null,
      answeredCount: answered.filter((answer) => answer.hasAnswer).length,
      correctAnswerCount: answered.filter((answer) => answer.correct === true).length,
      quizAverage: quizScores.length
        ? Math.round(quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length)
        : null,
      argumentationAverage: argumentationScores.length
        ? Math.round(argumentationScores.reduce((sum, score) => sum + score, 0) / argumentationScores.length)
        : null,
      applicationAverage: applicationScores.length
        ? Math.round(applicationScores.reduce((sum, score) => sum + score, 0) / applicationScores.length)
        : null,
      applicationActivityCount: appActivities.length,
      reflectionCount: reflections.length,
    },
    students: progressStudents,
    questions: Array.from(questionMap.values())
      .filter((question) => question.incorrectCount > 0)
      .sort((a, b) => b.incorrectCount - a.incorrectCount)
      .slice(0, 10),
    answers: answered
      .sort((a, b) => (b.date ? Date.parse(b.date) : 0) - (a.date ? Date.parse(a.date) : 0))
      .slice(0, 30)
      .map(({ studentName, question, selectedAnswer, correctAnswer, correct, date }) => ({
        studentName,
        question,
        selectedAnswer,
        correctAnswer,
        correct,
        date,
      })),
    activities: activities.slice(0, 40),
  };
  return { data: response };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { comicId: rawComicId } = await context.params;
  const comicId = Number(rawComicId);
  if (!Number.isInteger(comicId) || comicId < 1) {
    return NextResponse.json({ error: 'ID komik tidak valid.' }, { status: 400 });
  }
  try {
    const result = await getScopedData(request, comicId);
    if (result.response) return result.response;
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[dashboard/guru/modules] GET failed:', error);
    return NextResponse.json({ error: 'Data modul gagal dimuat.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { comicId: rawComicId } = await context.params;
  const comicId = Number(rawComicId);
  if (!Number.isInteger(comicId) || comicId < 1) {
    return NextResponse.json({ error: 'ID komik tidak valid.' }, { status: 400 });
  }
  try {
    const result = await getScopedData(request, comicId, true);
    if (result.response) return result.response;
    const data = result.data;
    if (!data) return NextResponse.json({ error: 'Data modul tidak tersedia.' }, { status: 404 });
    const hasLearningEvidence = data.summary.startedCount > 0
      || data.summary.answeredCount > 0
      || data.summary.applicationActivityCount > 0
      || data.summary.reflectionCount > 0
      || data.summary.quizAverage !== null
      || data.summary.argumentationAverage !== null
      || data.summary.applicationAverage !== null;
    if (!hasLearningEvidence) {
      return NextResponse.json(
        { error: 'Data pembelajaran belum cukup untuk meminta analisis AI.' },
        { status: 422 }
      );
    }
    const difficultQuestions = data.questions
      .filter((question) => question.incorrectCount > 0)
      .slice(0, 5)
      .map((question) => `- ${question.question}: ${question.incorrectCount} jawaban dinilai keliru`)
      .join('\n') || '- Belum ada jawaban keliru yang tercatat.';
    const stageSummary = data.blueprint
      .map((stage) => `${stage.title}: ${stage.completedStudents}/${data.summary.studentCount} siswa menyelesaikan tahap`)
      .join('\n');
    const prompt = [
      `Buat insight singkat untuk guru tentang modul "${data.comic.title}".`,
      'Gunakan hanya statistik agregat ini. Jangan menyimpulkan kemampuan dari aktivitas membaca atau dari data yang tidak tersedia.',
      `Roster: ${data.summary.studentCount}; mulai belajar: ${data.summary.startedCount}; sedang belajar: ${data.summary.learningCount}; semua tahap selesai: ${data.summary.completedCount}; tingkat penyelesaian: ${data.summary.completionRate ?? 'tidak tersedia'}%.`,
      `Rata-rata skor tersimpan (kuis/argumentasi/aplikasi): ${data.summary.quizAverage ?? 'belum tersedia'} / ${data.summary.argumentationAverage ?? 'belum tersedia'} / ${data.summary.applicationAverage ?? 'belum tersedia'}.`,
      `Aktivitas aplikasi tersimpan: ${data.summary.applicationActivityCount}; refleksi tersimpan: ${data.summary.reflectionCount}.`,
      `Pertanyaan dengan jawaban keliru terbanyak:\n${difficultQuestions}`,
      `Progres tahap:\n${stageSummary}`,
      'Berikan 2-3 kalimat berbahasa Indonesia, sebutkan bila bukti asesmen tidak tersedia, dan sarankan tindak lanjut yang spesifik.',
      ...data.limitations.map((limitation) => `Batasan data: ${limitation}`),
    ].join('\n\n');
    if (prompt.length > MAX_MODULE_AI_PROMPT_CHARS) {
      return NextResponse.json({ error: 'Konteks modul melebihi batas aman untuk analisis AI.' }, { status: 413 });
    }
    const resultFromAi = await AiRouter.createDefault().generate({
      prompt,
      systemPrompt: 'Kamu adalah asisten analisis pembelajaran CINARAI. Berikan insight berbasis data agregat saja. Jangan mengidentifikasi siswa.',
      temperature: 0.2,
      maxTokens: 220,
    });
    const insight = typeof resultFromAi.content === 'string' ? resultFromAi.content.trim().slice(0, 1800) : '';
    if (!insight) return NextResponse.json({ error: 'AI tidak menghasilkan analisis yang dapat digunakan.' }, { status: 502 });
    return NextResponse.json({ insight, provider: resultFromAi.provider });
  } catch (error) {
    if (error instanceof AiRouterTimeoutError) {
      return NextResponse.json({ error: 'Batas waktu analisis AI modul terlampaui. Silakan coba kembali.' }, { status: 504 });
    }
    console.error('[dashboard/guru/modules] POST failed:', error);
    return NextResponse.json({ error: 'Analisis AI modul gagal dibuat. Silakan coba kembali.' }, { status: 502 });
  }
}
