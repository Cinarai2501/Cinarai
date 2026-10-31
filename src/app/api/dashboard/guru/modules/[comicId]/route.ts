import { NextRequest, NextResponse } from 'next/server';
import { comicModules } from '@/features/comics';
import { adminFirestore, verifyIdToken } from '@/lib/firebase/admin';
import { AiRouter, AiRouterTimeoutError } from '@/lib/ai/router';
import { buildModuleBlueprint, getModuleStudentStatus } from '@/app/dashboard/guru/services/moduleAnalytics';
import { getModuleProgressPercentage } from '@/app/dashboard/guru/services/progressStatus';
import { normalizeStudentDocuments } from '@/app/dashboard/guru/services/studentNormalization';
import { consumeTeacherAiRateLimit } from '../../rateLimit';
import type { ModuleDetailResponse } from '@/app/dashboard/guru/services/moduleAnalytics';
import type { UserDocument } from '@/types/firestore';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ comicId: string }> };
type RawDocument = Record<string, unknown> & { id: string };
type Student = { uid: string; name: string; email: string };
const MAX_MODULE_ROSTER = 100;
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
    return { response: NextResponse.json({ error: 'Layanan data dashboard belum tersedia.' }, { status: 503 }) };
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
  const schoolName = typeof profileData?.schoolName === 'string' ? profileData.schoolName.trim() : '';
  if (role !== 'teacher' && role !== 'admin') {
    return { response: NextResponse.json({ error: 'Akun ini tidak memiliki akses guru.' }, { status: 403 }) };
  }
  if (role === 'teacher' && !schoolName) {
    return { response: NextResponse.json({ error: 'Profil guru belum memiliki sekolah.' }, { status: 403 }) };
  }
  if (forAi && await consumeTeacherAiRateLimit(firestore, uid, MODULE_AI_COOLDOWN_MS)) {
    return {
      response: NextResponse.json(
        { error: 'Analisis AI dibatasi satu kali per akun setiap 60 detik. Coba lagi setelah jeda tersebut.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      ),
    };
  }

  const [comicSnapshot, studentSnapshot] = await Promise.all([
    firestore.collection('comics').doc(`comic-${comicId}`).get(),
    (() => {
      let query = firestore.collection('users').where('role', '==', 'student');
      if (role === 'teacher') query = query.where('schoolName', '==', schoolName);
      return query.limit(MAX_MODULE_ROSTER + 1).get();
    })(),
  ]);
  const comicDoc = comicSnapshot;
  if (!comicDoc.exists) return { response: NextResponse.json({ error: 'Komik tidak ditemukan di katalog.' }, { status: 404 }) };

  const rosterMayBeTruncated = studentSnapshot.docs.length > MAX_MODULE_ROSTER;
  const rawStudents: UserDocument[] = studentSnapshot.docs.slice(0, MAX_MODULE_ROSTER).map((document) => {
    const data = document.data();
    return {
      id: document.id,
      uid: typeof data.uid === 'string' ? data.uid : document.id,
      displayName: typeof data.displayName === 'string' ? data.displayName : undefined,
      email: typeof data.email === 'string' ? data.email : '',
      role: 'student',
      schoolName: typeof data.schoolName === 'string' ? data.schoolName : undefined,
      isActive: data.isActive !== false,
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
  const answerSnapshots = await Promise.all(chunks.map((uids) =>
    firestore.collection('identification_answers').where('userId', 'in', uids).where('comicId', '==', comicId)
      .limit(MODULE_SAMPLE_LIMIT + 1).get()
  ));
  const applicationSnapshots = await Promise.all(chunks.map((uids) =>
    firestore.collection('application_activity').where('userId', 'in', uids).where('comicId', '==', comicId)
      .limit(MODULE_SAMPLE_LIMIT + 1).get()
  ));
  const reflectionSnapshots = await Promise.all(chunks.map((uids) =>
    firestore.collection('reflection').where('userId', 'in', uids).where('comicId', '==', String(comicId))
      .limit(MODULE_SAMPLE_LIMIT + 1).get()
  ));
  const sampleMayBeTruncated = [
    ...answerSnapshots,
    ...applicationSnapshots,
    ...reflectionSnapshots,
  ].some((snapshot) => snapshot.docs.length > MODULE_SAMPLE_LIMIT);

  const comicData = comicDoc.data() ?? {};
  const comicModule = comicModules[comicId as keyof typeof comicModules];
  if (!comicModule) return { response: NextResponse.json({ error: 'Blueprint modul belum tersedia.' }, { status: 404 }) };
  const studentByUid = new Map(students.map((student) => [student.uid, student]));
  const rawAnswers: RawDocument[] = answerSnapshots.flatMap((snapshot) =>
    snapshot.docs.slice(0, MODULE_SAMPLE_LIMIT).map((document) => toRawDocument(document.id, document.data()))
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
    const uidValue = typeof answer.userId === 'string' ? answer.userId : '';
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
  const reflections = reflectionSnapshots.flatMap((snapshot) =>
    snapshot.docs.slice(0, MODULE_SAMPLE_LIMIT).map((document) => document.data())
  );
  const appActivities = applicationSnapshots.flatMap((snapshot) =>
    snapshot.docs.slice(0, MODULE_SAMPLE_LIMIT).map((document) => document.data())
  );
  const reflectionConfidenceByUid = new Map<string, number>();
  reflections.forEach((reflection) => {
    const userId = typeof reflection.userId === 'string' ? reflection.userId : '';
    const confidence = validConfidence(reflection.confidence ?? reflection.rating);
    if (!userId || confidence === null) return;
    const current = reflectionConfidenceByUid.get(userId);
    if (current === undefined || confidence < current) reflectionConfidenceByUid.set(userId, confidence);
  });

  const progressStudents = students.map((student) => {
    const progress = progressByUid.get(student.uid);
    const completedStages = progress
      ? new Set([
        ...(Array.isArray(progress.completedStages)
          ? progress.completedStages.filter((stage): stage is string => typeof stage === 'string')
          : []),
        ...(Array.isArray(progress.sintaksList)
          ? progress.sintaksList.flatMap((stage) =>
            stage && typeof stage === 'object' && 'status' in stage && 'sintaks' in stage
              && stage.status === 'COMPLETED' && typeof stage.sintaks === 'string' ? [stage.sintaks] : []
          )
          : []),
      ])
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
      studentName: studentByUid.get(typeof activity.userId === 'string' ? activity.userId : '')?.name ?? 'Siswa',
      stage: 'Application',
      label: typeof activity.coachType === 'string' ? `Umpan balik: ${activity.coachType}` : 'Aktivitas tersimpan',
      date: timestampToIso(activity.timestamp ?? activity.localTimestamp),
    })),
    ...reflections.map((reflection) => ({
      studentName: studentByUid.get(typeof reflection.userId === 'string' ? reflection.userId : '')?.name ?? 'Siswa',
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
    limitations: [
      ...(rosterMayBeTruncated ? [`Data mencakup maksimal ${MAX_MODULE_ROSTER} siswa pertama dalam roster; jumlah di bawah ini bukan total roster.`] : []),
      ...(sampleMayBeTruncated ? [`Sebagian riwayat mencapai batas ${MODULE_SAMPLE_LIMIT} dokumen per query; metrik aktivitas, jawaban, atau refleksi adalah sampel.`] : []),
    ],
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
  } catch {
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
    return NextResponse.json({ error: 'Analisis AI modul gagal dibuat. Silakan coba kembali.' }, { status: 502 });
  }
}
