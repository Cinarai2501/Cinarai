import { NextRequest, NextResponse } from 'next/server';
import { AiRouter } from '@/lib/ai/router';
import type { AiRequestPayload } from '@/lib/ai/provider';
import { getAiRequestAccess, checkAuthenticatedAiRateLimit } from '@/lib/ai/serverRequestAccess';
import { aiRateLimitErrorResponse, aiRequestAccessErrorResponse } from '@/lib/ai/requestAccess';
import { readBoundedJsonBody } from '@/app/api/dashboard/guru/requestBody';
import { validateApplicationRequest } from '@/lib/ai/requestValidation';

export const runtime = 'nodejs';

type ReqBody = {
  soal?: string;
  konteks?: string;
  gambar?: string[];
  jawabanSiswa?: string[];
  jawabanAlasan?: string;
  attempt?: number;
};

type CoachSummary = {
  mastered: string[];
  needsImprovement: string[];
  nextPractice: string[];
};

type RespBody = {
  coachType: 'positive' | 'constructive' | 'neutral';
  message: string;
  summary: CoachSummary;
  provider?: string;
};

function normalizeText(text?: string): string {
  return (text ?? '').trim();
}

function buildPrompt(body: ReqBody): string {
  const soal = normalizeText(body.soal);
  const konteks = normalizeText(body.konteks);
  const gambar = (body.gambar ?? []).map((g) => `- ${g}`).join('\n') || 'Tidak ada gambar';
  const siswa = (body.jawabanSiswa ?? []).join(', ') || 'Tidak memilih jawaban';
  const alasan = normalizeText(body.jawabanAlasan);

  return [
    'Kamu adalah AI Coach CINARAI untuk siswa Sekolah Dasar Indonesia.',
    '',
    'TUGAS:',
    'Berikan bimbingan yang hangat, sederhana, dan ramah kepada siswa.',
    'JANGAN menilai jawaban hanya benar atau salah; fokus pada penjelasan, petunjuk berpikir, rekomendasi, dan ringkasan belajar.',
    '',
    'FORMAT OUTPUT:',
    '{',
    '  "coachType": "positive|constructive|neutral",',
    '  "message": "Umpan balik singkat untuk siswa, jelaskan alasan dan rekomendasi.",',
    '  "summary": {',
    '    "mastered": ["..."],',
    '    "needsImprovement": ["..."],',
    '    "nextPractice": ["..."]',
    '  }',
    '}',
    '',
    'KONTEKS:',
    `- Soal: ${soal}`,
    `- Konteks: ${konteks}`,
    `- Gambar:`,
    gambar,
    `- Jawaban siswa: ${siswa}`,
    `- Alasan siswa: ${alasan}`,
    `- Catatan: Berikan rangkuman belajar dengan tiga poin di setiap bagian.`,
    '',
    'ATURAN WAJIB:',
    '1) Jelaskan mengapa pilihan siswa cocok atau perlu diperbaiki untuk konteks baru.',
    '2) Berikan setidaknya satu petunjuk berpikir yang membantu siswa menghubungkan bangun ruang dengan bentuk replika.',
    '3) Tambahkan rekomendasi latihan berikutnya yang relevan.',
    '4) Gunakan bahasa anak SD yang sederhana, hangat, dan tidak menakutkan.',
    '5) Berikan ringkasan: Yang sudah dikuasai, Yang masih perlu diperbaiki, Saran latihan berikutnya.',
    '6) Balas hanya dengan JSON ketat dan tidak ada teks lain.',
  ].join('\n');
}

function parseCoachResponse(raw: string): RespBody | null {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    const parsed = JSON.parse(cleaned) as Partial<RespBody>;
    if (
      parsed &&
      ['positive', 'constructive', 'neutral'].includes(parsed.coachType ?? '') &&
      typeof parsed.message === 'string' &&
      parsed.message.trim().length > 0 &&
      parsed.summary &&
      Array.isArray(parsed.summary.mastered) &&
      Array.isArray(parsed.summary.needsImprovement) &&
      Array.isArray(parsed.summary.nextPractice)
    ) {
      return {
        coachType: parsed.coachType as RespBody['coachType'],
        message: parsed.message.trim(),
        summary: {
          mastered: parsed.summary.mastered.map((item) => String(item)),
          needsImprovement: parsed.summary.needsImprovement.map((item) => String(item)),
          nextPractice: parsed.summary.nextPractice.map((item) => String(item)),
        },
        provider: parsed.provider,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const access = await getAiRequestAccess(request, ['student']);
  if (!access.ok) return aiRequestAccessErrorResponse(access);

  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > 16_384) {
    return NextResponse.json({ error: 'Body permintaan melebihi batas ukuran.' }, { status: 413 });
  }
  const parsedBody = await readBoundedJsonBody(request, 16_384);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === 'too_large' ? 'Body permintaan melebihi batas ukuran.' : 'Body permintaan tidak valid.' },
      { status: parsedBody.reason === 'too_large' ? 413 : 400 },
    );
  }
  const validated = validateApplicationRequest(parsedBody.value);
  if (!validated.ok) return NextResponse.json({ error: validated.error }, { status: 400 });
  const rateLimit = await checkAuthenticatedAiRateLimit(access.uid);
  if (!rateLimit.ok) return aiRateLimitErrorResponse(rateLimit);

  try {
    const body = validated.value;
    const router = AiRouter.createDefault();
    const payload: AiRequestPayload = {
      prompt: buildPrompt(body),
      systemPrompt: 'Kamu adalah AI Coach CINARAI. Balas hanya dengan JSON ketat dan bantu siswa tanpa memberi jawaban langsung.',
      temperature: 0.4,
      maxTokens: 350,
    };

    const response = await router.generate(payload);
    const raw = typeof response?.content === 'string' ? response.content.trim() : '';
    const parsed = parseCoachResponse(raw);

    if (parsed) {
      return NextResponse.json({ ...parsed, provider: response.provider });
    }

    const fallback: RespBody = {
      coachType: 'constructive',
      message: 'Jawabanmu sudah bagus sebagai permulaan. Coba perhatikan lagi apakah bangun ruang yang kamu pilih paling cocok untuk bentuk replika tersebut, lalu tambahkan alasan tentang sisi atau puncak yang kamu lihat.',
      summary: {
        mastered: ['Mulai menghubungkan bentuk replika dengan bangun ruang'],
        needsImprovement: ['Memperjelas alasan mengapa bangun ruang tersebut cocok untuk replika'],
        nextPractice: ['Coba jelaskan lagi dengan fokus pada satu sudut pandang baru dari AR'],
      },
    };

    return NextResponse.json({ ...fallback, provider: response.provider });
  } catch (error) {
    console.error('[ai/application] provider request failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json({ error: 'AI Coach sedang mengalami gangguan. Coba lagi nanti.' }, { status: 502 });
  }
}
