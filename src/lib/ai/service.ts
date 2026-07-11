import { AiRouter } from './router';
import type { AiProvider, AiRequestPayload, AiResponse } from './provider';
import { buildTutorSystemPrompt } from './prompts/tutor';

export interface TutorContext {
  moduleName: string;
  identification: Array<{
    step: number;
    selectedAnswer: string | null;
    note: string;
    reason: string;
  }>;
  objectInfo: {
    location: string;
    classLevel: string;
    synopsis: string;
    learningTargets: string[];
  };
  observationAnswers: Record<string, string>;
  question: string;
  sessionHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  comicTitle?: string;
  pageLabel?: string;
  objectName?: string;
  learningStage?: string;
  objectDescription?: string;
  arProvider?: string;
  modelUrl?: string;
  learningGoal?: string;
  numeracyConcept?: string;
  cultureConcept?: string;
  knowledgeContext?: string;
}

export interface TutorResponse {
  answer: string;
  provider?: string;
}

export interface StudentInsightContext {
  studentName: string;
  email?: string;
  progressDocuments: Array<{
    comicId: number;
    percentage?: number;
    status?: string;
    completedStage?: string;
  }>;
  reflections: Array<{
    rating?: number | null;
    stage?: string;
    response?: string;
    reflectionText?: string;
  }>;
  activities: Array<{
    title?: string;
    description?: string;
    occurredAt?: unknown;
  }>;
}

export interface StudentInsightResponse {
  capabilitySummary: string;
  weakestStage: string;
  bestStage: string;
  errorPattern: string;
  teacherRecommendation: string;
  remedial: string;
  enrichment: string;
  provider?: string;
  fallbackUsed?: boolean;
}

interface GenerateTutorResponseOptions {
  throwOnError?: boolean;
  router?: Pick<AiRouter, 'generate'>;
}

interface GenerateStudentInsightOptions {
  retryCount?: number;
  router?: Pick<AiRouter, 'generate'>;
}

function formatActivitySummary(activities: StudentInsightContext['activities']): string {
  if (!activities.length) {
    return '- Belum ada riwayat aktivitas.';
  }

  return activities.slice(0, 5).map((activity) => `- ${activity.title ?? 'Aktivitas'}: ${activity.description ?? 'Tidak ada deskripsi.'}`).join('\n');
}

function getAverageProgress(progressDocuments: StudentInsightContext['progressDocuments']): number {
  if (!progressDocuments.length) {
    return 0;
  }

  const total = progressDocuments.reduce((sum, document) => sum + (document.percentage ?? 0), 0);
  return Math.round(total / progressDocuments.length);
}

function buildFallbackStudentInsight(context: StudentInsightContext): StudentInsightResponse {
  const averageProgress = getAverageProgress(context.progressDocuments);
  const latestStage = context.progressDocuments.find((document) => document.completedStage)?.completedStage ?? 'Identifikasi';
  const weakestStage = averageProgress < 50 ? latestStage : 'Identifikasi';
  const bestStage = averageProgress >= 70 ? 'Refleksi' : 'Observasi';
  const hasLowRatings = context.reflections.some((reflection) => typeof reflection.rating === 'number' && reflection.rating < 3);

  return {
    capabilitySummary: `${context.studentName} memiliki kemampuan numerasi ${averageProgress >= 70 ? 'cukup baik' : averageProgress >= 40 ? 'berkembang' : 'masih perlu pendampingan'} dengan rata-rata progres ${averageProgress}%.`,
    weakestStage: weakestStage,
    bestStage: bestStage,
    errorPattern: hasLowRatings ? 'Cenderung membuat kesalahan saat memecahkan soal yang membutuhkan penjelasan alasan.' : 'Belum ada pola kesalahan yang sangat jelas dari data yang tersedia.',
    teacherRecommendation: averageProgress < 50 ? 'Fokus pada bimbingan intensif dan latihan sederhana di tahap awal.' : 'Berikan penguatan pada bagian yang belum konsisten dan lanjutkan latihan bertahap.',
    remedial: 'Berikan latihan singkat, contoh soal bertahap, dan pantau satu tahap per sesi.',
    enrichment: 'Tingkatkan pemahaman melalui tantangan numerasi berbasis konteks dan refleksi mandiri.',
    fallbackUsed: true,
  };
}

function parseStudentInsightResponse(raw: string | undefined): StudentInsightResponse | null {
  if (!raw?.trim()) {
    return null;
  }

  const cleaned = raw.trim();
  const jsonCandidate = cleaned.startsWith('{')
    ? cleaned
    : cleaned.match(/\{[\s\S]*\}/)?.[0];

  if (!jsonCandidate) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonCandidate) as Partial<StudentInsightResponse>;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    return {
      capabilitySummary: parsed.capabilitySummary?.trim() || '—',
      weakestStage: parsed.weakestStage?.trim() || '—',
      bestStage: parsed.bestStage?.trim() || '—',
      errorPattern: parsed.errorPattern?.trim() || '—',
      teacherRecommendation: parsed.teacherRecommendation?.trim() || '—',
      remedial: parsed.remedial?.trim() || '—',
      enrichment: parsed.enrichment?.trim() || '—',
    };
  } catch {
    return null;
  }
}

export function buildStudentInsightPrompt(context: StudentInsightContext): string {
  const progressSummary = context.progressDocuments.length
    ? context.progressDocuments.map((document) => `- Komik ${document.comicId}: ${document.percentage ?? 0}% | status=${document.status ?? 'not_started'} | tahap=${document.completedStage ?? '—'}`).join('\n')
    : '- Belum ada progress komik.';

  const reflectionSummary = context.reflections.length
    ? context.reflections.map((reflection) => `- rating=${reflection.rating ?? '—'} | stage=${reflection.stage ?? '—'} | ${reflection.reflectionText || reflection.response || 'Tidak ada catatan.'}`).join('\n')
    : '- Belum ada refleksi.';

  return [
    'Analisis AI untuk guru tentang perkembangan siswa.',
    `Nama siswa: ${context.studentName}`,
    `Email: ${context.email || '—'}`,
    '',
    'Data progress komik:',
    progressSummary,
    '',
    'Data refleksi:',
    reflectionSummary,
    '',
    'Riwayat aktivitas:',
    formatActivitySummary(context.activities),
    '',
    'Tugas:',
    'Buat penjelasan singkat dalam Bahasa Indonesia yang mencakup 7 bagian berikut:',
    '- Kemampuan numerasi',
    '- Stage terlemah',
    '- Stage terbaik',
    '- Pola kesalahan',
    '- Rekomendasi guru',
    '- Remedial',
    '- Pengayaan',
    '',
    'Kembalikan jawaban sebagai JSON object dengan field: capabilitySummary, weakestStage, bestStage, errorPattern, teacherRecommendation, remedial, enrichment.',
  ].join('\n');
}

export async function generateStudentInsight(
  context: StudentInsightContext,
  options?: GenerateStudentInsightOptions,
): Promise<StudentInsightResponse> {
  const retryCount = options?.retryCount ?? 2;
  const router = options?.router ?? AiRouter.createDefault();
  const payload: AiRequestPayload = {
    prompt: buildStudentInsightPrompt(context),
    systemPrompt: 'Kamu adalah asisten guru yang menganalisis perkembangan belajar siswa. Berikan jawaban singkat, jelas, dan berbasis data.',
    temperature: 0.55,
    maxTokens: 320,
  };

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      const response = await router.generate(payload) as AiResponse;
      const parsed = parseStudentInsightResponse(response.content);
      if (parsed) {
        return {
          ...parsed,
          provider: response.provider,
          fallbackUsed: false,
        };
      }
    } catch (error) {
      console.error('[generateStudentInsight] AI request failed', error);
    }
  }

  return buildFallbackStudentInsight(context);
}

interface GenerateTutorResponseOptions {
  throwOnError?: boolean;
  router?: Pick<AiRouter, 'generate'>;
}

export function buildTutorPrompt(context: TutorContext): string {
  const identificationText = context.identification
    .map((entry) => `- Langkah ${entry.step}: jawaban=${entry.selectedAnswer ?? '—'}, catatan=${entry.note || '—'}, alasan=${entry.reason || '—'}`)
    .join('\n');

  const observationText = Object.entries(context.observationAnswers)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');

  const sessionHistoryText = (context.sessionHistory ?? []).length > 0
    ? ['Riwayat sesi modul ini:', ...context.sessionHistory!.map((entry) => `- ${entry.role === 'user' ? 'siswa' : 'tutor'}: ${entry.content}`), ''].join('\n')
    : '';

  const objectContextText = [
    context.objectDescription ? `- deskripsi objek: ${context.objectDescription}` : '',
    context.arProvider ? `- provider AR: ${context.arProvider}` : '',
    context.modelUrl ? `- tautan model: ${context.modelUrl}` : '',
    context.learningGoal ? `- tujuan belajar: ${context.learningGoal}` : '',
    context.numeracyConcept ? `- konsep numerasi: ${context.numeracyConcept}` : '',
    context.cultureConcept ? `- konsep budaya: ${context.cultureConcept}` : '',
    context.knowledgeContext ? `- pengetahuan objek:\n${context.knowledgeContext}` : '',
  ].filter(Boolean).join('\n');

  const systemPrompt = buildTutorSystemPrompt({
    modul: context.moduleName,
    identifikasi: identificationText || '- Tidak ada data identifikasi.',
    informasiObjek: `lokasi=${context.objectInfo.location}; kelas=${context.objectInfo.classLevel}; sinopsis=${context.objectInfo.synopsis}; target=${context.objectInfo.learningTargets.join(', ')}`,
    observasi: observationText || '- Tidak ada jawaban observasi.',
    pertanyaanSiswa: context.question,
    komik: context.comicTitle ?? context.moduleName,
    halaman: context.pageLabel ?? '- Tidak ada informasi halaman.',
    objek: context.objectName ?? '- Tidak ada informasi objek.',
    tahap: context.learningStage ?? 'Navigation',
    konteksObjekAr: objectContextText || '- Tidak ada konteks objek AR.',
  });

  return [
    systemPrompt,
    '',
    'Konteks tambahan:',
    sessionHistoryText || '- Tidak ada riwayat sesi.',
  ].join('\n');
}

export async function generateTutorResponse(
  context: TutorContext,
  providerOverride?: Pick<AiProvider, 'generate'>,
  options?: GenerateTutorResponseOptions,
): Promise<TutorResponse> {
  console.warn('[generateTutorResponse] generateTutorResponse() start');
  console.warn('[generateTutorResponse] Navigation -> generateTutorResponse()', {
    moduleName: context.moduleName,
    question: context.question,
  });

  const router = AiRouter.createDefault();
  const payload: AiRequestPayload = {
    prompt: buildTutorPrompt(context),
    systemPrompt: buildTutorSystemPrompt({
      modul: context.moduleName,
      identifikasi: context.identification
        .map((entry) => `Langkah ${entry.step}: ${entry.selectedAnswer ?? '—'}`)
        .join(', ') || 'Tidak ada data identifikasi.',
      informasiObjek: `lokasi=${context.objectInfo.location}; kelas=${context.objectInfo.classLevel}; sinopsis=${context.objectInfo.synopsis}; target=${context.objectInfo.learningTargets.join(', ')}`,
      observasi: Object.entries(context.observationAnswers).map(([key, value]) => `${key}: ${value}`).join(', ') || 'Tidak ada jawaban observasi.',
      pertanyaanSiswa: context.question,
      komik: context.comicTitle ?? context.moduleName,
      halaman: context.pageLabel ?? '- Tidak ada informasi halaman.',
      objek: context.objectName ?? '- Tidak ada informasi objek.',
      tahap: context.learningStage ?? 'Navigation',
      konteksObjekAr: [
        context.objectDescription ? `deskripsi objek: ${context.objectDescription}` : '',
        context.arProvider ? `provider AR: ${context.arProvider}` : '',
        context.modelUrl ? `tautan model: ${context.modelUrl}` : '',
        context.learningGoal ? `tujuan belajar: ${context.learningGoal}` : '',
        context.numeracyConcept ? `konsep numerasi: ${context.numeracyConcept}` : '',
        context.cultureConcept ? `konsep budaya: ${context.cultureConcept}` : '',
        context.knowledgeContext ? `pengetahuan objek: ${context.knowledgeContext}` : '',
      ].filter(Boolean).join('; ') || '- Tidak ada konteks objek AR.',
    }),
    temperature: 0.7,
    maxTokens: 220,
  };

  try {
    console.warn('[generateTutorResponse] generateTutorResponse() -> router');
    const routingRouter = options?.router
      ? options.router
      : providerOverride
        ? new AiRouter([{ name: 'gemini', generate: providerOverride.generate }])
        : router;
    const response = await routingRouter.generate(payload) as AiResponse;
    const normalizedAnswer = typeof response?.content === 'string' ? response.content.trim() : '';

    console.warn('[generateTutorResponse] provider used:', response?.provider);
    console.warn('[generateTutorResponse] response length:', normalizedAnswer.length);
    console.warn('[generateTutorResponse] service returned:', {
      provider: response?.provider,
      answerLength: normalizedAnswer.length,
    });

    if (!normalizedAnswer) {
      const fallback = 'Seluruh layanan AI sedang tidak tersedia.';
      if (options?.throwOnError) {
        throw new Error(fallback);
      }
      return { answer: fallback };
    }

    console.warn('[generateTutorResponse] generateTutorResponse() end');
    return {
      answer: normalizedAnswer,
      provider: response.provider,
    };
  } catch (error) {
    console.warn('[generateTutorResponse] generateTutorResponse() end with error');
    const message = error instanceof Error ? error.message : 'Unknown AI error';
    const friendlyMessage = message.includes('Seluruh layanan AI sedang tidak tersedia')
      ? 'Seluruh layanan AI sedang tidak tersedia.'
      : 'Seluruh layanan AI sedang tidak tersedia.';
    console.error('[generateTutorResponse] AI request failed', error);

    if (options?.throwOnError) {
      throw new Error(friendlyMessage);
    }

    return {
      answer: friendlyMessage,
    };
  }
}

