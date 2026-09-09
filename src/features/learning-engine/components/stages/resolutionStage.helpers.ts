import { buildResolutionTutorExplanation as buildTutorTextExplanation } from './resolutionTutorText';

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

const COMIC_1_RESOLUTION_MISSIONS: ResolutionMission[] = [
  {
    id: 1,
    title: 'Misi 1 · Volume Kubus',
    part: 'Kubus',
    shape: 'Kubus',
    prompt: 'Sebuah kubus memiliki panjang rusuk 8 cm. Hitung volumenya.',
    problemData: ['Rusuk (s) = 8 cm'],
    options: [
      { key: 'A', label: '256 cm³' },
      { key: 'B', label: '384 cm³' },
      { key: 'C', label: '512 cm³' },
      { key: 'D', label: '640 cm³' },
    ],
    correctKey: 'C',
    answer: '512 cm³',
    formula: 'V = s × s × s',
    explanation: '8 × 8 × 8 = 512',
    hint: 'Kalikan rusuk sebanyak tiga kali.',
    correctFeedback: 'Tepat! Volume kubus diperoleh dari perkalian rusuk tiga kali.',
    incorrectFeedback: 'Belum tepat. Kubus memiliki rusuk yang sama pada semua sisi, jadi volumenya adalah s × s × s.',
    aiHint: 'Gunakan rumus volume kubus: V = s³.',
    context: 'Bangun ruang kubus pada Candi Jawi membantu siswa menghubungkan bentuk tiga dimensi dengan konsep volume yang rapi.',
    accent: 'from-primary-600 to-primary-700',
    illustration: '/images/navigation/default.svg',
  },
  {
    id: 2,
    title: 'Misi 2 · Volume Balok',
    part: 'Balok',
    shape: 'Balok',
    prompt: 'Sebuah balok memiliki p = 12 cm, l = 6 cm, dan t = 5 cm. Hitung volumenya.',
    problemData: ['Panjang (p) = 12 cm', 'Lebar (l) = 6 cm', 'Tinggi (t) = 5 cm'],
    options: [
      { key: 'A', label: '300 cm³' },
      { key: 'B', label: '320 cm³' },
      { key: 'C', label: '360 cm³' },
      { key: 'D', label: '400 cm³' },
    ],
    correctKey: 'C',
    answer: '360 cm³',
    formula: 'V = p × l × t',
    explanation: '12 × 6 × 5 = 360',
    hint: 'Kalikan panjang, lebar, dan tinggi dengan hati-hati.',
    correctFeedback: 'Tepat! Volume balok diperoleh dari perkalian panjang, lebar, dan tinggi.',
    incorrectFeedback: 'Belum tepat. Periksa kembali perkalian panjang, lebar, dan tinggi pada balok.',
    aiHint: 'Kalikan panjang, lebar, dan tinggi dengan cermat.',
    context: 'Bangun ruang balok pada Candi Jawi membantu siswa melihat bentuk yang panjang, lebar, dan tinggi berbeda.',
    accent: 'from-secondary-500 to-secondary-600',
    illustration: '/images/navigation/default.svg',
  },
  {
    id: 3,
    title: 'Misi 3 · Volume Prisma Segi Empat',
    part: 'Prisma Segi Empat',
    shape: 'Prisma Segi Empat',
    prompt: 'Sebuah prisma segi empat memiliki luas alas 36 cm² dan tinggi 10 cm. Volume prisma tersebut adalah?',
    problemData: ['Luas alas = 36 cm²', 'Tinggi prisma = 10 cm'],
    options: [
      { key: 'A', label: '300 cm³' },
      { key: 'B', label: '360 cm³' },
      { key: 'C', label: '420 cm³' },
      { key: 'D', label: '480 cm³' },
    ],
    correctKey: 'B',
    answer: '360 cm³',
    formula: 'V = Luas Alas × Tinggi',
    explanation: '36 × 10 = 360',
    hint: 'Kalikan luas alas dengan tinggi prisma.',
    correctFeedback: 'Benar! Volume prisma segi empat adalah luas alas dikalikan tinggi.',
    incorrectFeedback: 'Belum tepat. Ingat, volume prisma adalah luas alas dikali tinggi.',
    aiHint: 'Gunakan rumus volume prisma: V = Luas Alas × Tinggi.',
    context: 'Prisma segi empat pada Candi Jawi membantu siswa memahami hubungan antara alas dan tinggi pada bangun ruang.',
    accent: 'from-amber-500 to-orange-500',
    illustration: '/images/navigation/default.svg',
  },
  {
    id: 4,
    title: 'Misi 4 · Volume Limas Segi Empat',
    part: 'Limas Segi Empat',
    shape: 'Limas Segi Empat',
    prompt: 'Sebuah limas segi empat memiliki luas alas 64 cm² dan tinggi 9 cm. Volume limas tersebut adalah?',
    problemData: ['Luas alas = 64 cm²', 'Tinggi limas = 9 cm'],
    options: [
      { key: 'A', label: '144 cm³' },
      { key: 'B', label: '192 cm³' },
      { key: 'C', label: '240 cm³' },
      { key: 'D', label: '288 cm³' },
    ],
    correctKey: 'B',
    answer: '192 cm³',
    formula: 'V = 1/3 × Luas Alas × Tinggi',
    explanation: '1/3 × 64 × 9 = 192',
    hint: 'Jangan lupa bagi hasilnya dengan 3.',
    correctFeedback: 'Tepat! Limas segi empat memiliki volume sepertiga dari prisma yang alas dan tingginya sama.',
    incorrectFeedback: 'Belum tepat. Ingat, volume limas adalah sepertiga dari hasil perkalian luas alas dan tinggi.',
    aiHint: 'Gunakan rumus volume limas: V = 1/3 × Luas Alas × Tinggi.',
    context: 'Limas segi empat pada Candi Jawi membantu siswa memahami bentuk yang meruncing ke satu puncak.',
    accent: 'from-emerald-500 to-emerald-600',
    illustration: '/images/navigation/default.svg',
  },
  {
    id: 5,
    title: 'Misi 5 · Volume Kerucut',
    part: 'Kerucut',
    shape: 'Kerucut',
    prompt: 'Sebuah kerucut memiliki r = 7 cm dan t = 12 cm. Gunakan π = 22/7. Volume kerucut tersebut adalah?',
    problemData: ['Jari-jari (r) = 7 cm', 'Tinggi (t) = 12 cm', 'π = 22/7'],
    options: [
      { key: 'A', label: '528 cm³' },
      { key: 'B', label: '616 cm³' },
      { key: 'C', label: '672 cm³' },
      { key: 'D', label: '728 cm³' },
    ],
    correctKey: 'B',
    answer: '616 cm³',
    formula: 'V = 1/3 × π × r² × t',
    explanation: '1/3 × 22/7 × 49 × 12 = 616',
    hint: 'Hitung r² terlebih dahulu, lalu bagi hasilnya dengan 3.',
    correctFeedback: 'Sangat tepat! Kerucut memiliki volume sepertiga dari tabung dengan jari-jari dan tinggi yang sama.',
    incorrectFeedback: 'Belum tepat. Hitung r² dulu, lalu kalikan dengan tinggi dan π, lalu bagi tiga.',
    aiHint: 'Mulai dari menghitung r² = 49, lalu kalikan dengan tinggi dan π, lalu bagi 3.',
    context: 'Kerucut pada Candi Jawi membantu siswa melihat hubungan antara alas bundar dan puncak yang meruncing.',
    accent: 'from-fuchsia-500 to-purple-600',
    illustration: '/images/navigation/default.svg',
  },
];

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

const KOMIK_4_RESOLUTION_MISSIONS: ResolutionMission[] = [
  {
    id: 1,
    title: 'Misi 1 · Perbedaan Langkah',
    part: 'Pengukuran Jembatan Merah',
    shape: 'Panjang lintasan',
    prompt: 'Mengapa jumlah langkah Hanan, Hilya, dan Aisyah berbeda saat mengukur Jembatan Merah yang sama? Perhatikan perbedaan panjang langkah mereka.',
    options: [
      { key: 'A', label: 'Karena panjang langkah setiap anak berbeda.' },
      { key: 'B', label: 'Karena panjang Jembatan Merah berubah-ubah.' },
      { key: 'C', label: 'Karena jumlah langkah tidak dapat digunakan untuk mengukur lintasan.' },
      { key: 'D', label: 'Karena semua anak berjalan di jembatan yang berbeda.' },
    ],
    correctKey: 'A',
    answer: 'Jumlah langkah berbeda karena panjang langkah setiap anak berbeda.',
    formula: 'Panjang lintasan = jumlah langkah × panjang langkah',
    explanation: 'Mereka mengukur lintasan yang sama. Anak dengan langkah lebih panjang membutuhkan lebih sedikit langkah, sedangkan langkah lebih pendek membutuhkan lebih banyak langkah.',
    aiHint: 'Bandingkan panjang langkah setiap anak, bukan panjang jembatannya.',
    context: 'Hanan, Hilya, dan Aisyah mengukur Jembatan Merah dengan langkah kaki.',
    accent: 'from-primary-600 to-primary-700',
    illustration: '/images/navigation/default.svg',
  },
  {
    id: 2,
    title: 'Misi 2 · Membandingkan Langkah',
    part: 'Data pengukuran',
    shape: 'Jumlah langkah',
    prompt: 'Data pengukuran menunjukkan Hanan 83 langkah, Hilya 76 langkah, dan Aisyah 60 langkah. Siapa yang menggunakan langkah paling banyak?',
    options: [
      { key: 'A', label: 'Hanan, yaitu 83 langkah.' },
      { key: 'B', label: 'Hilya, yaitu 76 langkah.' },
      { key: 'C', label: 'Aisyah, yaitu 60 langkah.' },
      { key: 'D', label: 'Ketiganya sama banyak.' },
    ],
    correctKey: 'A',
    answer: 'Hanan menggunakan 83 langkah, jumlah paling banyak.',
    formula: '83 > 76 > 60',
    explanation: 'Dengan membandingkan ketiga angka, 83 adalah jumlah terbesar. Jadi Hanan menggunakan langkah paling banyak.',
    aiHint: 'Bandingkan angka 83, 76, dan 60 dari yang terbesar.',
    context: 'Hasil pengukuran langkah kaki di Jembatan Merah.',
    accent: 'from-secondary-500 to-secondary-600',
    illustration: '/images/navigation/default.svg',
  },
  {
    id: 3,
    title: 'Misi 3 · Rumus Panjang Lintasan',
    part: 'Perhitungan lintasan',
    shape: 'Panjang lintasan',
    prompt: 'Hilya menempuh 76 langkah. Jika panjang setiap langkah Hilya 0,75 meter, berapa panjang lintasannya?',
    options: [
      { key: 'A', label: '56 meter' },
      { key: 'B', label: '57 meter' },
      { key: 'C', label: '57,75 meter' },
      { key: 'D', label: '76,75 meter' },
    ],
    correctKey: 'B',
    answer: '57 meter',
    formula: 'Panjang lintasan = 76 × 0,75 = 57 meter',
    explanation: 'Gunakan rumus panjang lintasan = jumlah langkah × panjang langkah. Jadi 76 × 0,75 = 57 meter.',
    aiHint: 'Kalikan jumlah langkah dengan panjang satu langkah.',
    context: 'Rumus pengukuran panjang lintasan pada Jembatan Merah.',
    accent: 'from-amber-500 to-orange-500',
    illustration: '/images/navigation/default.svg',
  },
  {
    id: 4,
    title: 'Misi 4 · Kendaraan Terbanyak',
    part: 'Grafik kendaraan',
    shape: 'Membandingkan data',
    prompt: 'Data kendaraan di Jembatan Merah adalah sepeda motor 18.450, mobil pribadi 6.230, angkutan umum 890, dan truk/bus besar 310. Kendaraan apa yang paling banyak?',
    options: [
      { key: 'A', label: 'Sepeda motor, 18.450 kendaraan.' },
      { key: 'B', label: 'Mobil pribadi, 6.230 kendaraan.' },
      { key: 'C', label: 'Angkutan umum, 890 kendaraan.' },
      { key: 'D', label: 'Truk/bus besar, 310 kendaraan.' },
    ],
    correctKey: 'A',
    answer: 'Sepeda motor, yaitu 18.450 kendaraan.',
    formula: '18.450 > 6.230 > 890 > 310',
    explanation: 'Sepeda motor memiliki angka paling besar, yaitu 18.450 kendaraan.',
    aiHint: 'Cari angka terbesar pada data kendaraan.',
    context: 'Data kendaraan yang melewati Jembatan Merah.',
    accent: 'from-emerald-500 to-emerald-600',
    illustration: '/images/navigation/default.svg',
  },
  {
    id: 5,
    title: 'Misi 5 · Kendaraan Tersedikit',
    part: 'Grafik kendaraan',
    shape: 'Membandingkan data',
    prompt: 'Dari data kendaraan di Jembatan Merah, kendaraan apa yang jumlahnya paling sedikit?',
    options: [
      { key: 'A', label: 'Sepeda motor, 18.450 kendaraan.' },
      { key: 'B', label: 'Mobil pribadi, 6.230 kendaraan.' },
      { key: 'C', label: 'Angkutan umum, 890 kendaraan.' },
      { key: 'D', label: 'Truk/bus besar, 310 kendaraan.' },
    ],
    correctKey: 'D',
    answer: 'Truk/bus besar, yaitu 310 kendaraan.',
    formula: '310 < 890 < 6.230 < 18.450',
    explanation: 'Truk/bus besar memiliki angka paling kecil, yaitu 310 kendaraan.',
    aiHint: 'Cari angka terkecil pada data kendaraan.',
    context: 'Data kendaraan yang melewati Jembatan Merah.',
    accent: 'from-sky-500 to-sky-600',
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

  if (comicId === 4) {
    return KOMIK_4_RESOLUTION_MISSIONS.map((mission) => ({
      ...mission,
      context: `${mission.context} (${lokasi})`,
    }));
  }

  return COMIC_1_RESOLUTION_MISSIONS;
}

export function isCorrectSelection(mission: ResolutionMission, selected: string | null): boolean {
  return Boolean(selected && selected.toUpperCase() === mission.correctKey);
}

export function buildResolutionTutorExplanation(mission: ResolutionMission, isCorrect: boolean): string {
  return buildTutorTextExplanation(
    {
      shape: mission.shape,
      formula: mission.formula,
      context: mission.context,
    },
    isCorrect,
  );
}

export function getMissionHint(mission: ResolutionMission, _attempt: number): string {
  return buildResolutionTutorExplanation(mission, false);
}
