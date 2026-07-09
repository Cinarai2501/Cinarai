import { NextRequest, NextResponse } from 'next/server';

const CORRECT_ANSWER = 'LIMAS';

function buildCorrectResponse() {
  return {
    status: 'correct',
    message: [
      'Bagus sekali! Jawabanmu benar dan kamu sudah memilah bentuk dengan tepat.',
      '',
      'Bagian atap Candi Jawi memang paling mirip limas karena memiliki alas datar dan beberapa sisi segitiga yang bertemu di satu titik puncak.',
      '',
      'Sebelumnya kita telah belajar tentang balok dan kubus. Sekarang kamu bisa melihat bahwa limas punya bentuk atap yang berbeda dari balok: alasnya datar dan sisi-sisinya membentuk segitiga.',
    ].join('\n'),
  };
}

function buildIncorrectResponse(attempt: number) {
  const hints = [
    'Perhatikan jumlah sisi datar pada bagian atap itu. Apakah semua sisinya sama panjang? Juga lihat bentuk puncaknya.',
    'Coba bandingkan bentuk atap dengan model AR. Apakah alasnya berbentuk persegi atau lingkaran? Apakah bagian atasnya meruncing ke satu titik?',
    'Ingat kembali apa yang membedakan limas dari balok dan kerucut. Fokus pada jumlah sisi datar dan bentuk alasnya.',
  ];

  return {
    status: 'incorrect',
    message: hints[Math.min(attempt, hints.length - 1)],
  };
}

export const runtime = 'nodejs';

type RequestBody = {
  selected?: string;
  attempt?: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody;
    const selected = (body.selected ?? '').toString().trim().toUpperCase();
    const attempt = Math.max(0, Number(body.attempt) || 0);

    if (!selected) {
      return NextResponse.json({ error: 'Pilihan diperlukan.' }, { status: 400 });
    }

    if (selected === CORRECT_ANSWER) {
      return NextResponse.json(buildCorrectResponse());
    }

    return NextResponse.json(buildIncorrectResponse(attempt));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan tidak terduga.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
