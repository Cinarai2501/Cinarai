import { NextRequest, NextResponse } from 'next/server';
import { AiRouter } from '@/lib/ai/router';
import type { AiRequestPayload } from '@/lib/ai/provider';

export const runtime = 'nodejs';

type ArgumentationRequestBody = {
  question: string;
  studentAnswer: string;
  shapeName: string;
  comicTitle: string;
  lokasi: string;
  classLevel: string;
};

function buildArgumentationPrompt(body: ArgumentationRequestBody): string {
  return [
    'Kamu adalah AI Evaluator CINARAI untuk siswa Sekolah Dasar Indonesia.',
    '',
    'TUGAS',
    'Evaluasi alasan yang ditulis siswa terhadap pertanyaan argumentasi matematika.',
    'JANGAN menjawab pertanyaan. HANYA berikan umpan balik terhadap alasan siswa.',
    '',
    'ATURAN WAJIB',
    '1. Validasi apakah alasan siswa tepat secara konsep matematika.',
    '2. Jelaskan konsep bangun ruang yang relevan secara singkat.',
    '3. Berikan saran jika alasan kurang tepat atau kurang lengkap.',
    '4. Gunakan bahasa sederhana, hangat, dan mudah dipahami anak SD.',
    '5. Maksimal 100 kata.',
    '6. Berikan skor 1–5 berdasarkan: ketepatan konsep, penggunaan istilah matematika, alasan logis.',
    '',
    'FORMAT RESPONS (JSON ketat, tidak ada teks di luar JSON)',
    '{',
    '  "level": "SANGAT_BAIK" | "HAMPIR_BENAR" | "PERLU_PERBAIKAN",',
    '  "score": 1 | 2 | 3 | 4 | 5,',
    '  "feedback": "teks umpan balik untuk siswa"',
    '}',
    '',
    'KONTEKS',
    `- Komik: ${body.comicTitle}`,
    `- Lokasi: ${body.lokasi}`,
    `- Kelas: ${body.classLevel}`,
    `- Bangun ruang: ${body.shapeName}`,
    `- Pertanyaan: ${body.question}`,
    `- Jawaban siswa: ${body.studentAnswer}`,
  ].join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ArgumentationRequestBody;

    if (!body.question || !body.studentAnswer) {
      return NextResponse.json({ error: 'question and studentAnswer are required' }, { status: 400 });
    }

    const router = AiRouter.createDefault();
    const payload: AiRequestPayload = {
      prompt: buildArgumentationPrompt(body),
      systemPrompt: 'Kamu adalah AI Evaluator CINARAI. Selalu balas dalam format JSON yang diminta.',
      temperature: 0.4,
      maxTokens: 300,
    };

    const response = await router.generate(payload);
    const raw = typeof response?.content === 'string' ? response.content.trim() : '';

    // Strip markdown code fences if present
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let parsed: { level: string; score: number; feedback: string };
    try {
      parsed = JSON.parse(jsonStr) as typeof parsed;
    } catch {
      // Fallback if AI doesn't return valid JSON
      parsed = {
        level: 'HAMPIR_BENAR',
        score: 3,
        feedback: raw || 'Terima kasih atas jawabanmu. Coba perhatikan kembali ciri-ciri bangun ruang tersebut.',
      };
    }

    return NextResponse.json({
      level: parsed.level ?? 'HAMPIR_BENAR',
      score: Math.min(5, Math.max(1, Number(parsed.score) || 3)),
      feedback: parsed.feedback ?? '',
      provider: response?.provider,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AI error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
