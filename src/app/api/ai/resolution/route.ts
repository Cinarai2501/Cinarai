import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type ReqBody = {
  selected?: string;
  attempt?: number;
};

const CORRECT_KEY = 'C';

function buildFullExplanation() {
  return [
    'Penjelasan lengkap:',
    '',
    'Mengapa jawaban benar:',
    'Rumus Volume Kubus = s × s × s',
    '',
    'Dengan s = 8 cm:',
    '8 × 8 × 8',
    '= 512 cm³',
    '',
    'Hubungan dengan bagian alas Candi Jawi:',
    'Bagian alas Candi Jawi yang dimaksud memiliki bentuk persegi sejajar (alas), sehingga dapat dimodelkan sebagai sisi-sisi kubus jika kita membayangkan sebuah balok beraturan.',
    'Menggunakan rumus volume kubus memberi gambaran seberapa banyak ruang yang terisi pada bangun dengan tinggi sama dengan panjang rusuknya, mirip bagaimana volume dasar (alas) menentukan ukuran bagian bawah struktur.',
  ].join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ReqBody;
    const selected = (body.selected ?? '').toString().trim().toUpperCase();
    const attempt = Math.max(0, Number(body.attempt) || 0);

    if (!selected) {
      return NextResponse.json({ error: 'selected is required' }, { status: 400 });
    }

    // Correct answer
    if (selected === CORRECT_KEY) {
      return NextResponse.json({
        correct: true,
        explanation: buildFullExplanation(),
      });
    }

    // Wrong answer — provide stepwise hints, up to 3 hints.
    const nextAttempt = attempt;
    if (nextAttempt >= 3) {
      // after 3 wrong attempts show full explanation
      return NextResponse.json({
        correct: false,
        showSolution: true,
        explanation: buildFullExplanation(),
      });
    }

    const hints = [
      'Coba ingat kembali rumus volume kubus.',
      'Ingat rumus: Volume kubus = s × s × s. Masukkan s = 8, lalu lakukan perkalian berurutan.',
      'Hitung 8 × 8 = 64, lalu 64 × 8 = 512. Jika masih belum yakin, tekan kirim lagi untuk melihat pembahasan lengkap.',
    ];

    const hint = hints[Math.min(nextAttempt, hints.length - 1)];

    return NextResponse.json({ correct: false, hint, attempts: nextAttempt });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
