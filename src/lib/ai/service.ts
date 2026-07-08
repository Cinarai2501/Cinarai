import { AiRouter } from './router';
import type { AiProvider, AiRequestPayload } from './provider';
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
}

export interface TutorResponse {
  answer: string;
  provider?: string;
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
): Promise<TutorResponse> {
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
    }),
    temperature: 0.7,
    maxTokens: 220,
  };

  try {
    const response = await (providerOverride ? providerOverride.generate(payload) : router.generate(payload));
    const normalizedAnswer = typeof response?.content === 'string' ? response.content.trim() : '';

    return {
      answer: normalizedAnswer || 'Maaf, saya sedang tidak bisa merespons saat ini. Coba lagi sebentar lagi.',
      provider: response.provider,
    };
  } catch {
    return {
      answer: 'Maaf, saya sedang tidak bisa merespons saat ini. Coba lagi sebentar lagi.',
    };
  }
}
