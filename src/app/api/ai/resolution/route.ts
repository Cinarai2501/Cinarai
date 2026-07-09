import { NextRequest, NextResponse } from 'next/server';
import { RESOLUTION_MISSIONS } from '../../../../features/learning-engine/components/stages/resolutionStage.helpers';

export const runtime = 'nodejs';

type ReqBody = {
  selected?: string;
  attempt?: number;
  missionId?: number;
};

function buildExplanation(mission: (typeof RESOLUTION_MISSIONS)[number]): string {
  return [
    '✨ Selamat! Jawabanmu benar!',
    '',
    'Aku bangga dengan kamu. Mari kita lihat bagaimana cara mengerjakannya:',
    '',
    `📚 Bangun yang kita gunakan: ${mission.shape}`,
    '',
    `📏 Rumusnya adalah: ${mission.formula}`,
    '',
    `📌 Jadi hasilnya adalah: ${mission.answer}`,
    '',
    `🏛️ Hubungan dengan Candi Jawi: ${mission.context}`,
    '',
    'Kamu sudah memahami konsep yang penting. Sangat bagus! 👏',
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
        hint: '📖 Mari kita lihat penjelasan lengkapnya:\n\nBelajarlah dari pengalaman ini. Kamu akan lebih mahir seiring waktu! 🚀',
      });
    }

    const hints = [
      `💡 Hmm, jawaban itu belum tepat. Jangan khawatir!\n\nBangun: ${mission.shape}\nRumus: ${mission.formula.split('=')[0].trim()}\n\nCoba perhatikan langkah-langkahnya lebih teliti.`,
      `🤔 Mari kita coba pendekatan lain:\n\nIngat langkah-langkahnya:\n1. Identifikasi bangun: ${mission.shape}\n2. Gunakan rumus: ${mission.formula.split('=')[0].trim()}\n3. Masukkan nilai-nilainya\n\nAyo coba lagi!`,
      `📖 Mari kita lihat penjelasan lengkapnya:\n\nBangun: ${mission.shape}\nRumus: ${mission.formula}\nHasil: ${mission.answer}`,
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
