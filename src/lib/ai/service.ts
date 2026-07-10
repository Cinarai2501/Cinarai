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
}

export interface TutorResponse {
  answer: string;
  provider?: string;
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

