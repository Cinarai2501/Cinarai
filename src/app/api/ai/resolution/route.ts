import { NextRequest, NextResponse } from 'next/server';
import { RESOLUTION_MISSIONS } from '../../../../features/learning-engine/components/stages/resolutionStage.helpers';

export const runtime = 'nodejs';

type ReqBody = {
  selected?: string;
  attempt?: number;
  missionId?: number;
};

function buildExplanation(mission: (typeof RESOLUTION_MISSIONS)[number]) {
  return [
    'Penjelasan AI:',
    '',
    mission.formula,
    '',
    mission.explanation,
    '',
    `Hubungan dengan Candi Jawi: ${mission.context}`,
  ].join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ReqBody;
    const selected = (body.selected ?? '').toString().trim().toUpperCase();
    const attempt = Math.max(0, Number(body.attempt) || 0);
    const missionId = Number(body.missionId) || 1;
    const mission = RESOLUTION_MISSIONS.find((item) => item.id === missionId) ?? RESOLUTION_MISSIONS[0];

    if (!selected) {
      return NextResponse.json({ error: 'selected is required' }, { status: 400 });
    }

    if (selected === mission.correctKey) {
      return NextResponse.json({
        correct: true,
        explanation: buildExplanation(mission),
        answer: mission.answer,
      });
    }

    if (attempt >= 3) {
      return NextResponse.json({
        correct: false,
        hint: 'Coba pelajari kembali rumus bangun ruang ini dan kirim jawaban lagi.',
      });
    }

    const hints = [
      mission.aiHint,
      `Periksa satu langkah penting pada rumus ${mission.shape.toLowerCase()} sebelum menjawab.`,
      `Coba hitung kembali dengan teliti sampai kamu yakin dengan pilihan yang paling sesuai.`,
    ];

    return NextResponse.json({
      correct: false,
      hint: hints[Math.min(attempt, hints.length - 1)],
      attempts: attempt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
