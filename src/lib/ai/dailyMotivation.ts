import { AiRouter } from './router';
import type { AiRequestPayload, AiResponse } from './provider';

export interface DailyMotivationResponse {
  motivation: string;
  provider?: string;
}

export function buildDailyMotivationPrompt(): string {
  return [
    'Anda adalah AI Tutor untuk siswa Sekolah Dasar.',
    'Buat satu motivasi belajar dalam Bahasa Indonesia yang sederhana, hangat, positif, mudah dipahami anak usia 7–12 tahun.',
    'Fokus pada semangat belajar, rasa ingin tahu, ketekunan, berpikir kritis, percaya diri, dan pantang menyerah.',
    'Jangan menyebut aplikasi, komik, level, XP, badge, progres, skor, maupun aktivitas di aplikasi.',
    'Maksimal 40 kata.',
  ].join(' ');
}

export async function generateDailyMotivation(options?: { router?: Pick<AiRouter, 'generate'> }): Promise<DailyMotivationResponse> {
  const router = options?.router ?? AiRouter.createDefault();
  const payload: AiRequestPayload = {
    prompt: buildDailyMotivationPrompt(),
    systemPrompt: 'Kamu adalah AI Tutor CINARAI untuk siswa SD. Berikan satu kalimat motivasi singkat dan hangat dalam Bahasa Indonesia.',
    temperature: 0.75,
    maxTokens: 80,
  };

  try {
    const response = await router.generate(payload) as AiResponse;
    const motivation = response.content?.trim().replace(/\s+/g, ' ');

    return {
      motivation: motivation && motivation.length > 0 ? motivation : 'Belajar sedikit demi sedikit tetap membawa kita maju.',
      provider: response.provider,
    };
  } catch (error) {
    console.error('[generateDailyMotivation] AI request failed', error);
    return {
      motivation: 'Belajar sedikit demi sedikit tetap membawa kita maju.',
    };
  }
}
