import { NextRequest, NextResponse } from 'next/server';
import { AiRouter } from '@/lib/ai/router';
import type { AiRequestPayload } from '@/lib/ai/provider';

export const runtime = 'nodejs';

type IntrospectionRequestBody = {
  comicTitle?: string;
  lokasi?: string;
  classLevel?: string;
  checklist?: string[];
  confidence?: number | null;
  reflectionText?: string;
  stagePerformance?: Array<{ stage: string; status: string }>;
  identificationAnswers?: Array<{
    step: number;
    selectedAnswer: string | null;
    note: string;
    reason: string;
  }>;
  applicationActivities?: Array<{
    selectedAnswer: string;
    studentReason: string;
    attempt: number;
    coachType: string;
    coachMessage: string;
    coachSummary: {
      mastered: string[];
      needsImprovement: string[];
      nextPractice: string[];
    };
  }>;
  identificationResult?: string;
  navigationResult?: string;
  argumentationResult?: string;
  resolutionResult?: string;
  applicationResult?: string;
};

type IntrospectionResponseBody = {
  appreciation: string;
  needsImprovement: string;
  suggestion: string;
  provider?: string;
};

function normalize(input?: string): string {
  return (input ?? '').trim();
}

function formatAnswers(items?: IntrospectionRequestBody['identificationAnswers']): string {
  if (!items || items.length === 0) return '- Tidak ada jawaban identifikasi yang tersimpan.';
  return items
    .map((item) => `  • Langkah ${item.step}: Jawaban=${item.selectedAnswer ?? '—'}, Catatan="${normalize(item.note)}", Alasan="${normalize(item.reason)}"`)
    .join('\n');
}

function formatActivities(items?: IntrospectionRequestBody['applicationActivities']): string {
  if (!items || items.length === 0) return '- Tidak ada aktivitas application yang tersimpan.';
  return items
    .map((item) => `  • Upaya ${item.attempt}: Jawaban=${item.selectedAnswer}, Alasan="${normalize(item.studentReason)}", Coach=${item.coachType}, Rekomendasi="${normalize(item.coachMessage)}"`)
    .join('\n');
}

function buildIntrospectionPrompt(body: IntrospectionRequestBody): string {
  const checklistItems = body.checklist ?? [];
  const checklist = checklistItems.length > 0
    ? checklistItems.map((item) => `- ${item}`).join('\n')
    : '- Tidak ada checklist refleksi';

  const stagePerformance = body.stagePerformance?.length
    ? body.stagePerformance.map((item) => `- ${item.stage}: ${item.status}`).join('\n')
    : '- Tidak ada data performa tahap.';

  return [
    'Kamu adalah AI Tutor CINARAI.',
    '',
    'Analisis seluruh aktivitas siswa pada komik ini dengan cermat menggunakan data yang tersedia.',
    'Gunakan data asli berikut:',
    '- status dan hasil setiap tahap pembelajaran',
    '- jawaban identifikasi dari Firestore',
    '- aktivitas Application dari Firestore',
    '- checklist refleksi',
    '- tingkat keyakinan siswa',
    '- teks refleksi siswa',
    'Jika suatu stage tidak memiliki data tersimpan, abaikan detail stage tersebut dan jangan membuat informasi baru.',
    'Jangan mengarang jawaban, gunakan hanya data nyata yang tersedia.',
    'Buat respons singkat maksimal 150 kata.',
    '',
    'FORMAT:',
    'Apresiasi',
    'Yang Perlu Ditingkatkan',
    'Saran Belajar.',
    '',
    'Data siswa:',
    `- Komik: ${normalize(body.comicTitle) || 'Tidak diketahui'}`,
    `- Lokasi: ${normalize(body.lokasi) || 'Tidak diketahui'}`,
    `- Kelas: ${normalize(body.classLevel) || 'Tidak diketahui'}`,
    `- Checklist refleksi:\n${checklist}`,
    `- Tingkat keyakinan: ${body.confidence ?? 'Tidak tersedia'}`,
    `- Catatan siswa: ${normalize(body.reflectionText) || 'Tidak tersedia'}`,
    '',
    'Ringkasan performa tiap tahap:',
    stagePerformance,
    '',
    'Hasil Identifikasi:',
    `${normalize(body.identificationResult) || 'Tidak tersedia'}`,
    '',
    'Hasil Navigasi:',
    `${normalize(body.navigationResult) || 'Tidak tersedia'}`,
    '',
    'Hasil Argumentasi:',
    `${normalize(body.argumentationResult) || 'Tidak tersedia'}`,
    '',
    'Hasil Resolusi:',
    `${normalize(body.resolutionResult) || 'Tidak tersedia'}`,
    '',
    'Hasil Aplikasi:',
    `${normalize(body.applicationResult) || 'Tidak tersedia'}`,
    '',
    'Detail jawaban identifikasi:',
    formatAnswers(body.identificationAnswers),
    '',
    'Detail application activity:',
    formatActivities(body.applicationActivities),
    '',
    'Gunakan konteks nyata dari data di atas untuk menjelaskan kekuatan dan area yang perlu ditingkatkan.',
    '',
    'Jawab dalam format JSON ketat tanpa teks lain:',
    '{',
    '  "appreciation": "...",',
    '  "needsImprovement": "...",',
    '  "suggestion": "..."',
    '}',
  ].join('\n');
}

function parseResponse(raw: string): IntrospectionResponseBody | null {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    const parsed = JSON.parse(cleaned) as Partial<IntrospectionResponseBody>;
    if (
      parsed &&
      typeof parsed.appreciation === 'string' && parsed.appreciation.trim() &&
      typeof parsed.needsImprovement === 'string' && parsed.needsImprovement.trim() &&
      typeof parsed.suggestion === 'string' && parsed.suggestion.trim()
    ) {
      return {
        appreciation: parsed.appreciation.trim(),
        needsImprovement: parsed.needsImprovement.trim(),
        suggestion: parsed.suggestion.trim(),
        provider: parsed.provider,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as IntrospectionRequestBody;
    if (!body.reflectionText || !body.reflectionText.trim()) {
      return NextResponse.json({ error: 'reflectionText is required' }, { status: 400 });
    }

    const router = AiRouter.createDefault();
    const payload: AiRequestPayload = {
      prompt: buildIntrospectionPrompt(body),
      systemPrompt: 'Kamu adalah AI Tutor CINARAI. Balas hanya dengan JSON ketat, ringkas, dan gunakan data nyata yang tersedia.',
      temperature: 0.4,
      maxTokens: 250,
    };

    const response = await router.generate(payload);
    const raw = typeof response?.content === 'string' ? response.content.trim() : '';
    const parsed = parseResponse(raw);

    if (parsed) {
      return NextResponse.json({ ...parsed, provider: response.provider });
    }

    return NextResponse.json(
      { error: 'AI response tidak memenuhi format JSON yang diharapkan.' },
      { status: 502 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AI error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
