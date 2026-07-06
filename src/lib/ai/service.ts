import { AiRouter } from './router';
import type { AiRequestPayload } from './provider';

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

  return [
    'Kamu adalah tutor pembelajaran yang membantu siswa berpikir, bukan langsung memberi jawaban.',
    'Tujuanmu adalah memberi petunjuk, bertanya balik, mengarahkan proses berpikir, memberikan contoh sederhana, dan memotivasi siswa.',
    'Jangan langsung memberikan jawaban final. Alih-alih, bantu siswa sampai mereka bisa menyusun pemahaman sendiri.',
    'Ingat riwayat percakapan sebelumnya dalam sesi modul ini dan gunakan konteks itu untuk menjaga konsistensi.',
    '',
    `Modul: ${context.moduleName}`,
    `Informasi objek: lokasi=${context.objectInfo.location}; kelas=${context.objectInfo.classLevel}; sinopsis=${context.objectInfo.synopsis}; target=${context.objectInfo.learningTargets.join(', ')}`,
    'Identifikasi:',
    identificationText || '- Tidak ada data identifikasi.',
    'Jawaban observasi:',
    observationText || '- Tidak ada jawaban observasi.',
    'Pertanyaan siswa:',
    context.question,
    '',
    sessionHistoryText,
    'Balas dengan bahasa Indonesia yang hangat, singkat, dan mendukung. Sertakan satu atau dua petunjuk, satu pertanyaan balik, dan satu contoh sederhana jika perlu.',
    'Balas dengan bahasa Indonesia yang hangat, singkat, dan mendukung. Sertakan satu atau dua petunjuk, satu pertanyaan balik, dan satu contoh sederhana jika perlu.',
    'Sertakan kata kunci: petunjuk, bertanya balik, contoh sederhana, motivasi.',
  ].join('\n');
}

export async function generateTutorResponse(context: TutorContext): Promise<TutorResponse> {
  const router = AiRouter.createDefault();
  const payload: AiRequestPayload = {
    prompt: buildTutorPrompt(context),
    systemPrompt: 'Kamu adalah tutor pembelajaran yang membantu siswa berpikir secara aktif.',
    temperature: 0.7,
    maxTokens: 220,
  };

  const response = await router.generate(payload);
  return {
    answer: response.content || 'Saya belum bisa memberikan respons saat ini. Coba lagi sebentar lagi.',
    provider: response.provider,
  };
}
