import { NextRequest, NextResponse } from 'next/server';
import { AiRouter } from '@/lib/ai/router';
import type { AiRequestPayload } from '@/lib/ai/provider';

export const runtime = 'nodejs';

type ArgumentationRequestBody = {
  question: string;
  studentAnswer: string;
  shapeName: string;
  templePart: string;
  comicTitle: string;
  lokasi: string;
  classLevel: string;
};

type FeedbackLevel = 'SANGAT_BAIK' | 'HAMPIR_BENAR' | 'PERLU_PERBAIKAN';

type ArgumentationResponse = {
  level: FeedbackLevel;
  score: number;
  feedback: string;
  strength?: string;
  improvement?: string;
  suggestion?: string;
  // Komik 2 teacher-friendly format
  appreciation?: string;
  appreciationDetail?: string;
  explanation?: string;
  example?: string;
  motivation?: string;
  isTeacherFriendly?: boolean;
};

const SHAPE_VALIDATION_RULES: Record<
  string,
  {
    names: string[];
    keywords: string[];
    explanation: string;
  }
> = {
  persegi: {
    names: ['persegi'],
    keywords: ['empat sisi sama panjang', 'empat sudut siku-siku', 'dua diagonal sama panjang', 'empat simetri lipat'],
    explanation: 'Bagian Umpang atau pola candi lainnya memiliki sisi sama panjang dan sudut siku-siku seperti persegi.',
  },
  'persegi panjang': {
    names: ['persegi panjang'],
    keywords: ['dua sisi panjang', 'dua sisi pendek', 'empat sudut siku-siku', 'dua simetri lipat'],
    explanation: 'Bagian Balai Agung atau Pendopo tampak panjang dan lebar seperti persegi panjang.',
  },
  'segitiga sama kaki': {
    names: ['segitiga sama kaki'],
    keywords: ['dua sisi sama panjang', 'satu dasar berbeda', 'satu garis simetri', 'dua sudut sama besar'],
    explanation: 'Atap Candi Angka Tahun menunjukkan dua sisi sama panjang dan satu garis simetri seperti segitiga sama kaki.',
  },
  'segitiga sama sisi': {
    names: ['segitiga sama sisi'],
    keywords: ['tiga sisi sama panjang', 'tiga sudut sama besar', 'tiga garis simetri', 'simetri putar tingkat tiga'],
    explanation: 'Candi Induk memiliki bentuk atap yang simetris dengan tiga sisi sama panjang seperti segitiga sama sisi.',
  },
  'belah ketupat': {
    names: ['belah ketupat'],
    keywords: ['empat sisi sama panjang', 'dua diagonal saling berpotongan', 'dua garis simetri', 'sisi-sisi miring'],
    explanation: 'Pola Pendopo menyerupai belah ketupat dengan sisi sama panjang dan pola yang bergabung di tengah.',
  },
  lingkaran: {
    names: ['lingkaran'],
    keywords: ['satu sisi lengkung', 'titik pusat', 'jarak sama dari pusat', 'simetri putar'],
    explanation: 'Relief Candi memiliki bingkai melengkung yang rapi seperti lingkaran.',
  },
  balok: {
    names: ['balok'],
    keywords: ['sisi datar', 'rusuk', 'segi empat', 'permukaan datar'],
    explanation: 'Tubuh utama candi memiliki sisi datar dan rusuk yang kuat seperti balok.',
  },
  kubus: {
    names: ['kubus'],
    keywords: ['sisi sama', 'rusuk sama', 'persegi', 'semua rusuk sama panjang'],
    explanation: 'Bagian kaki candi tersusun menyerupai kubus karena semua sisinya sama.',
  },
  kerucut: {
    names: ['kerucut'],
    keywords: ['runcing', 'alas lingkaran', 'melengkung', 'ujung runcing'],
    explanation: 'Puncak candi meruncing dan alasnya bulat seperti kerucut.',
  },
  tabung: {
    names: ['tabung'],
    keywords: ['alas lingkaran', 'selimut', 'sisi melengkung', 'dua lingkaran'],
    explanation: 'Bagian ini seperti tabung karena memiliki sisi melengkung dan alas berbentuk lingkaran.',
  },
  limas: {
    names: ['limas', 'limas segi empat'],
    keywords: ['alas segi empat', 'puncak', 'sisi segitiga', 'sisi miring'],
    explanation: 'Atap bertingkat candi seperti limas karena memiliki alas segi empat dan puncak.',
  },
  prisma: {
    names: ['prisma', 'prisma segi empat'],
    keywords: ['dua alas', 'alas segi empat', 'sisi sejajar', 'bentuk prisma'],
    explanation: 'Dinding sisi candi seperti prisma karena memiliki dua alas yang sama dan sisi-sisi sejajar.',
  },
};

function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getShapeValidationRule(shapeName: string): {
  names: string[];
  keywords: string[];
  explanation: string;
} {
  const key = shapeName.toLowerCase();
  if (SHAPE_VALIDATION_RULES[key]) return SHAPE_VALIDATION_RULES[key];
  const matchedRule = Object.values(SHAPE_VALIDATION_RULES).find((rule) =>
    rule.names.some((name) => key.includes(name)),
  );
  return (
    matchedRule ?? {
      names: [shapeName.toLowerCase()],
      keywords: [],
      explanation: `Bangun ruang yang dimaksud adalah ${shapeName}.`, 
    }
  );
}

function buildFallbackFeedback(body: ArgumentationRequestBody): ArgumentationResponse {
  const answer = normalizeAnswer(body.studentAnswer);
  const rule = getShapeValidationRule(body.shapeName);
  const shapeMatch = rule.names.some((term) => answer.includes(term));
  const conceptMatches = rule.keywords.filter((keyword) => answer.includes(keyword)).length;

  if (shapeMatch && conceptMatches >= 2) {
    return {
      level: 'SANGAT_BAIK',
      score: 5,
      feedback: `Jawabanmu sudah sangat baik. Kamu menjelaskan bahwa ${body.templePart} cocok dimodelkan sebagai ${body.shapeName} karena ${rule.explanation.toLowerCase()}`,
    };
  }

  if (shapeMatch && conceptMatches >= 1) {
    return {
      level: 'HAMPIR_BENAR',
      score: 4,
      feedback: `Kamu sudah mengarah ke jawaban yang tepat. Jelaskan lebih jelas bahwa ${body.templePart} cocok dimodelkan sebagai ${body.shapeName} karena ${rule.keywords[0]}.`, 
    };
  }

  if (conceptMatches >= 1) {
    return {
      level: 'HAMPIR_BENAR',
      score: 3,
      feedback: `Jawabanmu hampir tepat karena kamu menyebutkan ciri seperti ${rule.keywords[0]}. Sekarang tambahkan bahwa bentuk yang cocok adalah ${body.shapeName}.`, 
    };
  }

  return {
    level: 'PERLU_PERBAIKAN',
    score: 2,
    feedback: `Jawabanmu perlu diperbaiki. Coba perhatikan apakah ${body.templePart} memiliki ciri-ciri ${body.shapeName}, seperti ${rule.keywords.slice(0, 2).join(' dan ')}.`, 
  };
}

function isComic2Argumentation(body: ArgumentationRequestBody): boolean {
  const title = body.comicTitle?.toLowerCase() ?? '';
  const lokasi = body.lokasi?.toLowerCase() ?? '';
  return title.includes('simetri candi penataran') || lokasi.includes('candi penataran');
}

function buildComic2ArgumentationPrompt(body: ArgumentationRequestBody): string {
  return [
    'Kamu adalah GURU SD yang ramah dan menyemangati untuk siswa kelas 4-6 di CINARAI.',
    'Siswa ini sedang belajar Komik 2: Petualangan Simetri Candi Penataran.',
    '',
    'TUGAS',
    'JANGAN memberikan jawaban lengkap. HANYA berikan umpan balik untuk membantu siswa belajar sendiri.',
    'Sifat feedback: hangat, sabar, menyemangati, bahasa guru SD.',
    '',
    'ATURAN WAJIB',
    '1. Sebutkan apa yang BENAR dari jawaban siswa terlebih dahulu (apresiasi).',
    '2. Jelaskan konsep dengan bahasa sederhana, seperti dijelaskan ibu/bapak guru.',
    '3. Berikan contoh NYATA yang bisa dibayangkan anak SD.',
    '4. Jangan gunakan istilah rumit. Kalimat pendek.',
    '5. Akhiri dengan dorongan dan motivasi positif.',
    '6. JANGAN terdengar seperti robot atau dosen.',
    '',
    'FORMAT RESPONS (JSON ketat, tidak ada teks di luar JSON)',
    '{',
    '  "level": "SANGAT_BAIK" | "HAMPIR_BENAR" | "PERLU_PERBAIKAN",',
    '  "score": 1 | 2 | 3 | 4 | 5,',
    '  "appreciation": "Emoji + judul singkat seperti \\"😊 Hebat!\\" atau \\"🙂 Hampir Benar\\"",',
    '  "appreciationDetail": "Kalimat singkat apa yang siswa dapatkan dengan benar",',
    '  "explanation": "Penjelasan singkat dan mudah (2-3 kalimat) tentang konsep bangun datar",',
    '  "example": "Contoh jawaban yang benar dalam bentuk kalimat / poin, cukup konkret",',
    '  "motivation": "Kalimat motivasi singkat seperti \\"Ayo lanjut belajar\\" atau \\"Kamu pasti bisa\\""',
    '}',
    '',
    'KONTEKS SISWA',
    `- Komik: ${body.comicTitle}`,
    `- Lokasi/Bangunan: ${body.lokasi}`,
    `- Bagian yang diamati: ${body.templePart}`,
    `- Bentuk yang diminta: ${body.shapeName}`,
    `- Pertanyaan: ${body.question}`,
    `- Jawaban siswa: ${body.studentAnswer}`,
    '',
    'PENTING:',
    '- Jika jawaban kosong: berikan dorongan lembut dan minta siswa perhatikan gambar lagi.',
    '- Jika jawaban sangat pendek: apresiasi apa yang benar, lalu minta tambahkan alasan mengapa.',
    '- Jika benar: perkuat dengan penjelasan tentang sifat bangun datar.',
    '- Jika kurang tepat: tunjukkan bagian yang benar, lalu minta pikirkan kembali.',
    '- SELALU ada apresiasi, penjelasan, contoh, dan motivasi.',
  ].join('\n');
}

function buildGenericArgumentationPrompt(body: ArgumentationRequestBody): string {
  return [
    'Kamu adalah AI Evaluator CINARAI untuk siswa Sekolah Dasar Indonesia.',
    '',
    'TUGAS',
    'Evaluasi alasan yang ditulis siswa terhadap pertanyaan argumentasi matematika.',
    'JANGAN menjawab pertanyaan. HANYA berikan umpan balik terhadap alasan siswa.',
    '',
    'ATURAN WAJIB',
    '1. Tentukan apakah alasan siswa tepat untuk bangun ruang yang diminta.',
    '2. Jika jawaban tepat dan lengkap, beri level SANGAT_BAIK.',
    '3. Jika jawaban benar tetapi kurang rinci, beri level HAMPIR_BENAR.',
    '4. Jika jawaban tidak sesuai bangun ruang yang dimaksud, beri level PERLU_PERBAIKAN.',
    '5. Jelaskan konsep bangun datar yang relevan dengan bahasa sederhana.',
    '6. Gunakan bahasa ramah, sabar, dan mudah dipahami anak SD.',
    '7. Jawaban harus minimal 120 kata dan maksimal 200 kata.',
    '8. Berikan skor 1–5 berdasarkan: ketepatan konsep, kejelasan alasan, dan hubungan dengan objek yang dibahas.',
    '',
    'FORMAT RESPONS (JSON ketat, tidak ada teks di luar JSON)',
    '{',
    '  "level": "SANGAT_BAIK" | "HAMPIR_BENAR" | "PERLU_PERBAIKAN",',
    '  "score": 1 | 2 | 3 | 4 | 5,',
    '  "feedback": "teks umpan balik panjang minimal 120 kata",',
    '  "strength": "poin kuat dari jawaban siswa",',
    '  "improvement": "saran peningkatan singkat",',
    '  "suggestion": "contoh jawaban yang lebih lengkap atau cara memperbaiki"',
    '}',
    '',
    'KONTEKS',
    `- Komik: ${body.comicTitle}`,
    `- Lokasi: ${body.lokasi}`,
    `- Bagian bangunan: ${body.templePart}`,
    `- Bangun ruang: ${body.shapeName}`,
    `- Pertanyaan: ${body.question}`,
    `- Jawaban siswa: ${body.studentAnswer}`,
    '',
    'JANGAN hanya berikan skor. Skor hanya pelengkap.',
  ].join('\n');
}

function buildArgumentationPrompt(body: ArgumentationRequestBody): string {
  return isComic2Argumentation(body) ? buildComic2ArgumentationPrompt(body) : buildGenericArgumentationPrompt(body);
}

function parseArgumentationResponse(raw: string): ArgumentationResponse | null {
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  try {
    const parsed = JSON.parse(jsonStr) as Partial<ArgumentationResponse>;

    if (
      parsed &&
      typeof parsed.level === 'string' &&
      ['SANGAT_BAIK', 'HAMPIR_BENAR', 'PERLU_PERBAIKAN'].includes(parsed.level) &&
      typeof parsed.score === 'number' &&
      parsed.score >= 1 &&
      parsed.score <= 5
    ) {
      // Check if it's the new teacher-friendly format
      const isTeacherFriendly =
        typeof parsed.appreciation === 'string' &&
        typeof parsed.appreciationDetail === 'string' &&
        typeof parsed.explanation === 'string' &&
        typeof parsed.example === 'string' &&
        typeof parsed.motivation === 'string';

      return {
        level: parsed.level as FeedbackLevel,
        score: Math.min(5, Math.max(1, parsed.score)),
        feedback: parsed.feedback ?? '',
        strength: typeof parsed.strength === 'string' ? parsed.strength : undefined,
        improvement: typeof parsed.improvement === 'string' ? parsed.improvement : undefined,
        suggestion: typeof parsed.suggestion === 'string' ? parsed.suggestion : undefined,
        appreciation: typeof parsed.appreciation === 'string' ? parsed.appreciation : undefined,
        appreciationDetail: typeof parsed.appreciationDetail === 'string' ? parsed.appreciationDetail : undefined,
        explanation: typeof parsed.explanation === 'string' ? parsed.explanation : undefined,
        example: typeof parsed.example === 'string' ? parsed.example : undefined,
        motivation: typeof parsed.motivation === 'string' ? parsed.motivation : undefined,
        isTeacherFriendly,
      };
    }
  } catch {
    // fall through to fallback
  }

  return null;
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
    const parsed = parseArgumentationResponse(raw);
    const feedback = parsed ?? buildFallbackFeedback(body);

    return NextResponse.json({
      level: feedback.level,
      score: feedback.score,
      feedback: feedback.feedback,
      strength: feedback.strength,
      improvement: feedback.improvement,
      suggestion: feedback.suggestion,
      appreciation: feedback.appreciation,
      appreciationDetail: feedback.appreciationDetail,
      explanation: feedback.explanation,
      example: feedback.example,
      motivation: feedback.motivation,
      isTeacherFriendly: feedback.isTeacherFriendly,
      provider: response?.provider,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AI error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
