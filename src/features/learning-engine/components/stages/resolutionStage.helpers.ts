import { resolutionContent } from '@/features/comics/comic-1/content/resolutionContent';

export interface ResolutionMission {
  id: number;
  title: string;
  part: string;
  shape: string;
  prompt: string;
  problemData?: string[];
  options: Array<{ key: string; label: string }>;
  correctKey: string;
  answer: string;
  formula: string;
  explanation: string;
  hint?: string;
  correctFeedback?: string;
  incorrectFeedback?: string;
  aiHint: string;
  context: string;
  accent: string;
  illustration: string;
}

const COMIC_1_RESOLUTION_MISSIONS: ResolutionMission[] = resolutionContent.missions.map((mission) => ({
  ...mission,
  problemData: mission.problemData,
  hint: mission.hint,
  correctFeedback: mission.correctFeedback,
  incorrectFeedback: mission.incorrectFeedback,
  illustration: mission.illustration,
}));

export const RESOLUTION_MISSIONS: ResolutionMission[] = COMIC_1_RESOLUTION_MISSIONS;

const KOMIK_2_RESOLUTION_MISSIONS: ResolutionMission[] = [
  {
    id: 1,
    title: 'Misi 1 · Pola Persegi',
    part: 'Relief Persegi',
    shape: 'Persegi',
    prompt: 'Sebuah persegi memiliki panjang sisi 8 cm. Berapakah luasnya?',
    options: [
      { key: 'A', label: '32 cm²' },
      { key: 'B', label: '48 cm²' },
      { key: 'C', label: '64 cm²' },
      { key: 'D', label: '72 cm²' },
    ],
    correctKey: 'C',
    answer: '64 cm²',
    formula: 'L = s × s = 8 × 8 = 64 cm²',
    explanation: 'Luas persegi dihitung dari sisi dikali sisi.',
    aiHint: 'Ingat rumus luas persegi: L = s².',
    context: 'Pola persegi pada relief Candi Penataran menunjukkan susunan yang sama di kiri dan kanan.',
    accent: 'from-primary-600 to-primary-700',
    illustration: '/images/navigation/default.svg',
  },
  {
    id: 2,
    title: 'Misi 2 · Bidang Panjang',
    part: 'Bidang Panjang',
    shape: 'Persegi Panjang',
    prompt: 'Sebuah persegi panjang berukuran panjang 12 cm dan lebar 6 cm. Berapakah luasnya?',
    options: [
      { key: 'A', label: '54 cm²' },
      { key: 'B', label: '60 cm²' },
      { key: 'C', label: '66 cm²' },
      { key: 'D', label: '72 cm²' },
    ],
    correctKey: 'D',
    answer: '72 cm²',
    formula: 'L = p × l = 12 × 6 = 72 cm²',
    explanation: 'Luas persegi panjang dihitung dari panjang dikali lebar.',
    aiHint: 'Kalikan panjang dan lebar dengan hati-hati.',
    context: 'Bidang panjang pada Candi Penataran membantu kita melihat bentuk yang lebih lebar dari persegi.',
    accent: 'from-secondary-500 to-secondary-600',
    illustration: '/images/navigation/default.svg',
  },
  {
    id: 3,
    title: 'Misi 3 · Ornamen Tajam',
    part: 'Ornamen Tajam',
    shape: 'Segitiga',
    prompt: 'Sebuah segitiga memiliki alas 10 cm dan tinggi 6 cm. Berapakah luasnya?',
    options: [
      { key: 'A', label: '24 cm²' },
      { key: 'B', label: '30 cm²' },
      { key: 'C', label: '36 cm²' },
      { key: 'D', label: '40 cm²' },
    ],
    correctKey: 'B',
    answer: '30 cm²',
    formula: 'L = 1/2 × a × t = 1/2 × 10 × 6 = 30 cm²',
    explanation: 'Luas segitiga dihitung dari setengah kali alas kali tinggi.',
    aiHint: 'Ingat, segitiga adalah setengah dari persegi panjang yang sama alas dan tingginya.',
    context: 'Ornamen tajam pada Candi Penataran membentuk segitiga yang terlihat simetris.',
    accent: 'from-amber-500 to-orange-500',
    illustration: '/images/navigation/default.svg',
  },
  {
    id: 4,
    title: 'Misi 4 · Relief Trapesium',
    part: 'Relief Trapesium',
    shape: 'Trapesium',
    prompt: 'Sebuah trapesium memiliki sisi sejajar 8 cm dan 12 cm serta tinggi 5 cm. Berapakah luasnya?',
    options: [
      { key: 'A', label: '40 cm²' },
      { key: 'B', label: '45 cm²' },
      { key: 'C', label: '50 cm²' },
      { key: 'D', label: '60 cm²' },
    ],
    correctKey: 'C',
    answer: '50 cm²',
    formula: 'L = 1/2 × (a + b) × t = 1/2 × (8 + 12) × 5 = 50 cm²',
    explanation: 'Luas trapesium dihitung dari setengah kali jumlah sisi sejajar dikali tinggi.',
    aiHint: 'Jumlahkan kedua sisi sejajar terlebih dahulu, lalu kalikan tinggi dan bagi dua.',
    context: 'Relief trapesium pada Candi Penataran menunjukkan bentuk yang memiliki sepasang sisi sejajar.',
    accent: 'from-emerald-500 to-emerald-600',
    illustration: '/images/navigation/default.svg',
  },
];

export function getResolutionMissions(comicId: number, lokasi: string): ResolutionMission[] {
  if (comicId === 1) {
    return COMIC_1_RESOLUTION_MISSIONS.map((mission) => ({
      ...mission,
      context: `${mission.context} (${lokasi})`,
    }));
  }

  if (comicId === 2) {
    return KOMIK_2_RESOLUTION_MISSIONS.map((mission) => ({
      ...mission,
      context: `${mission.context} (${lokasi})`,
    }));
  }

  return COMIC_1_RESOLUTION_MISSIONS;
}

export function isCorrectSelection(mission: ResolutionMission, selected: string | null): boolean {
  return Boolean(selected && selected.toUpperCase() === mission.correctKey);
}

function getResolutionFormulaDetails(mission: ResolutionMission) {
  const shape = mission.shape.toLowerCase();

  if (shape === 'persegi') {
    return {
      volumeFormula: 'L = s × s',
      surfaceFormula: 'K = 4 × s',
      legend: 'L = Luas\ns = panjang sisi',
      substitution: 's = 8 cm',
      steps: '8 × 8 = 64',
      conclusion: '64 cm²',
    };
  }

  if (shape === 'persegi panjang') {
    return {
      volumeFormula: 'L = p × l',
      surfaceFormula: 'K = 2 × (p + l)',
      legend: 'L = Luas\np = panjang\nl = lebar',
      substitution: 'p = 12 cm\nl = 6 cm',
      steps: '12 × 6 = 72',
      conclusion: '72 cm²',
    };
  }

  if (shape === 'segitiga') {
    return {
      volumeFormula: 'L = 1/2 × a × t',
      surfaceFormula: 'K = a + b + c',
      legend: 'L = Luas\na = alas\nt = tinggi',
      substitution: 'a = 10 cm\nt = 6 cm',
      steps: '1/2 × 10 × 6 = 30',
      conclusion: '30 cm²',
    };
  }

  if (shape === 'trapesium') {
    return {
      volumeFormula: 'L = 1/2 × (a + b) × t',
      surfaceFormula: 'K = a + b + c + d',
      legend: 'L = Luas\na dan b = sisi sejajar\nt = tinggi',
      substitution: 'a = 8 cm\nb = 12 cm\nt = 5 cm',
      steps: '1/2 × (8 + 12) × 5 = 50',
      conclusion: '50 cm²',
    };
  }

  if (shape === 'kubus') {
    return {
      volumeFormula: 'V = s × s × s = s³',
      surfaceFormula: 'LP = 6 × s²',
      legend: 'V = Volume\ns = panjang rusuk kubus',
      substitution: 's = 8 cm',
      steps: '8 × 8 = 64\n64 × 8 = 512',
      conclusion: '512 cm³',
    };
  }

  if (shape === 'balok') {
    return {
      volumeFormula: 'V = p × l × t',
      surfaceFormula: 'LP = 2 × (p × l + p × t + l × t)',
      legend: 'V = Volume\np = panjang\nl = lebar\nt = tinggi',
      substitution: 'p = 12 cm\nl = 6 cm\nt = 5 cm',
      steps: '12 × 6 = 72\n72 × 5 = 360',
      conclusion: '360 cm³',
    };
  }

  if (shape === 'prisma segi empat') {
    return {
      volumeFormula: 'V = Luas Alas × Tinggi',
      surfaceFormula: 'LP = 2 × Luas Alas + Keliling Alas × Tinggi',
      legend: 'V = Volume\nLuas Alas = luas bidang alas\nTinggi = tinggi prisma',
      substitution: 'Luas Alas = 36 cm²\nTinggi = 10 cm',
      steps: '36 × 10 = 360',
      conclusion: '360 cm³',
    };
  }

  if (shape === 'limas segi empat') {
    return {
      volumeFormula: 'V = ⅓ × Luas Alas × Tinggi',
      surfaceFormula: 'LP = Luas Alas + Luas Selimut',
      legend: 'V = Volume\nLuas Alas = luas bidang alas\nTinggi = tinggi limas',
      substitution: 'Luas Alas = 64 cm²\nTinggi = 9 cm',
      steps: '64 × 9 = 576\n576 ÷ 3 = 192',
      conclusion: '192 cm³',
    };
  }

  if (shape === 'kerucut') {
    return {
      volumeFormula: 'V = ⅓ × π × r² × t',
      surfaceFormula: 'LP = π × r × (r + s)',
      legend: 'V = Volume\nπ = 22/7\nr = jari-jari alas\nt = tinggi kerucut\ns = garis pelukis',
      substitution: 'r = 7 cm\nt = 12 cm\nπ = 22/7',
      steps: 'r² = 7 × 7 = 49\nπ × r² = 22/7 × 49 = 154\n1/3 × 154 × 12 = 616',
      conclusion: '616 cm³',
    };
  }

  if (shape === 'tabung') {
    return {
      volumeFormula: 'V = π × r² × t',
      surfaceFormula: 'LP = 2 × π × r × (r + t)',
      legend: 'V = Volume\nπ = 3,14\nr = jari-jari alas\nt = tinggi tabung',
      substitution: 'r = 5 cm\nt = 12 cm\nπ = 3,14',
      steps: 'r² = 5 × 5 = 25\nπ × r² = 3,14 × 25 = 78,5\n78,5 × 12 = 942',
      conclusion: `942 cm³`,
    };
  }

  if (shape === 'bola') {
    return {
      volumeFormula: 'V = 4/3 × π × r³',
      surfaceFormula: 'LP = 4 × π × r²',
      legend: 'V = Volume\nπ = 3,14\nr = jari-jari bola',
      substitution: 'r = 6 cm\nπ = 3,14',
      steps: 'r³ = 6 × 6 × 6 = 216\nπ × r³ = 3,14 × 216 = 678,24\n4/3 × 678,24 = 904',
      conclusion: `904 cm³`,
    };
  }

  if (shape === 'prisma') {
    return {
      volumeFormula: 'V = Luas Alas × Tinggi',
      surfaceFormula: 'LP = 2 × Luas Alas + Keliling Alas × Tinggi',
      legend: 'V = Volume\nLuas Alas = luas bidang alas\nTinggi = tinggi prisma',
      substitution: 'Masukkan nilai luas alas dan tinggi sesuai soal',
      steps: 'Hitung luas alas terlebih dahulu, lalu kalikan dengan tinggi prisma.',
      conclusion: 'Volume prisma dihitung dengan mengalikan luas alas dan tinggi.',
    };
  }

  if (shape === 'limas') {
    return {
      volumeFormula: 'V = ⅓ × Luas Alas × Tinggi',
      surfaceFormula: 'LP = Luas Alas + Luas Selimut',
      legend: 'V = Volume\nLuas Alas = luas bidang alas\nTinggi = tinggi limas',
      substitution: 'Masukkan nilai luas alas dan tinggi sesuai soal',
      steps: 'Hitung luas alas terlebih dahulu, lalu kalikan dengan tinggi dan bagi 3.',
      conclusion: 'Volume limas diperoleh dari sepertiga kali luas alas dikalikan tinggi.',
    };
  }

  return {
    volumeFormula: 'V = ...',
    surfaceFormula: 'LP = ...',
    legend: 'V = Volume\nLP = Luas Permukaan',
    substitution: 'Masukkan nilai yang tersedia dari soal',
    steps: 'Gunakan rumus yang tepat berdasarkan jenis bangun ruang, lalu hitung nilai setiap komponen.',
    conclusion: mission.answer,
  };
}

export function buildResolutionTutorExplanation(mission: ResolutionMission, isCorrect: boolean): string {
  const details = getResolutionFormulaDetails(mission);
  const candiConnection = mission.context.includes('Candi Jawi')
    ? 'Hubungkan pemahamanmu dengan bentuk bangun ruang yang sering terlihat pada struktur arsitektur Candi Jawi.'
    : 'Hubungkan pemahamanmu dengan sifat bangun ruang yang sedang dipelajari.';

  if (isCorrect) {
    return [
      '✨ Jawabanmu benar. Mari kita lihat mengapa begitu.',
      '',
      `Bangun ruang: ${mission.shape}`,
      '',
      `Rumus Volume: ${details.volumeFormula}`,
      details.surfaceFormula ? `Rumus Luas Permukaan: ${details.surfaceFormula}` : 'Rumus Luas Permukaan: Tidak tersedia untuk soal ini.',
      '',
      'Keterangan:',
      details.legend,
      '',
      'Masukkan nilai dari soal:',
      details.substitution,
      '',
      'Perhitungan:',
      details.steps,
      '',
      `Hasil akhir: ${details.conclusion}`,
      '',
      candiConnection,
      '',
      'Kamu sudah menggunakan langkah yang tepat dan memahami hubungan antara rumus dengan bangun ruang.',
    ].join('\n');
  }

  return [
    '💡 Jawabanmu belum tepat. Mari kita perbaiki langkahnya.',
    '',
    `Bangun ruang: ${mission.shape}`,
    '',
    'Rumus Volume:',
    details.volumeFormula,
    '',
    'Rumus Luas Permukaan:',
    details.surfaceFormula,
    '',
    'Keterangan:',
    details.legend,
    '',
    'Masukkan nilai dari soal:',
    details.substitution,
    '',
    'Perhitungan:',
    details.steps,
    '',
    `Hasil akhir: ${details.conclusion}`,
    '',
    candiConnection,
    '',
    'Coba ulang dari awal dengan langkah yang lebih teliti agar pilihan yang benar menjadi jelas.',
  ].join('\n');
}

export function getMissionHint(mission: ResolutionMission, attempt: number): string {
  if (mission.hint) {
    if (attempt <= 0) return mission.hint;
    if (attempt === 1) return mission.hint;
    if (attempt === 2) return mission.hint;
    return `${mission.hint}\n\nCoba pelajari kembali rumus bangun ruang ini, lalu kirim jawaban lagi.`;
  }

  if (attempt <= 0) return buildResolutionTutorExplanation(mission, false);
  if (attempt === 1) return buildResolutionTutorExplanation(mission, false);
  if (attempt === 2) return buildResolutionTutorExplanation(mission, false);
  return `${buildResolutionTutorExplanation(mission, false)}\n\nCoba pelajari kembali rumus bangun ruang ini, lalu kirim jawaban lagi.`;
}
