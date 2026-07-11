import {
  buildObservationOverlaySvg,
  resolveComicObservationImage,
} from '@/lib/comic-image';
import type {
  AnswerOption,
  IdentificationItem,
  IdentificationState,
} from '../types';

/** Fisher-Yates shuffle — urutan berbeda setiap kali dipanggil */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type RawOption = { text: string; correct: boolean };

type RawQuestion = {
  question: string;
  imageAlt: string;
  image: string;
  overlayType?: string;
  crop?: string;
  highlight?: string;
  options: RawOption[];
  explanation: string;
};

/**
 * Soal Komik 2 — Candi Penataran, Blitar.
 * Soal ini fokus pada bangun datar, pola, dan simetri pada relief dan arsitektur candi.
 */
const KOMIK_2_QUESTIONS: RawQuestion[] = [
  {
    question: 'Perhatikan pola relief pada bagian ini. Bangun datar apa yang paling terlihat berulang pada susunan pola Candi Penataran?',
    imageAlt: 'Relief Candi Penataran memperlihatkan pola simetri dan susunan persegi yang teratur.',
    image: '/assets/qr/komik-2/13-objek-1.jpeg',
    overlayType: '/assets/qr/komik-2/13-objek-1.jpeg',
    crop: '/assets/qr/komik-2/13-objek-1.jpeg',
    highlight: '/assets/qr/komik-2/13-objek-1.jpeg',
    options: [
      { text: 'Persegi', correct: true },
      { text: 'Segitiga', correct: false },
      { text: 'Lingkaran', correct: false },
      { text: 'Trapesium', correct: false },
    ],
    explanation: 'Pola relief yang teratur dan sama di kiri kanan menunjukkan bentuk persegi yang sering dipakai dalam susunan dekoratif.',
  },
  {
    question: 'Amati bidang panjang pada bagian ini. Bangun datar apa yang paling sesuai dengan bentuknya?',
    imageAlt: 'Bagian bidang Candi Penataran tampak memanjang dan memiliki sisi berhadapan sama panjang.',
    image: '/assets/qr/komik-2/15-objek-2.jpeg',
    overlayType: '/assets/qr/komik-2/15-objek-2.jpeg',
    crop: '/assets/qr/komik-2/15-objek-2.jpeg',
    highlight: '/assets/qr/komik-2/15-objek-2.jpeg',
    options: [
      { text: 'Persegi panjang', correct: true },
      { text: 'Belah ketupat', correct: false },
      { text: 'Jajar genjang', correct: false },
      { text: 'Segi enam', correct: false },
    ],
    explanation: 'Bangun datar ini memiliki dua pasang sisi yang sama panjang dan keempat sudutnya siku-siku, sehingga disebut persegi panjang.',
  },
  {
    question: 'Lihat bagian bentuk lancip pada ornamen candi. Bangun datar apa yang paling cocok untuk menggambarkannya?',
    imageAlt: 'Ornamen Candi Penataran menampilkan bentuk segitiga yang tajam dan simetris.',
    image: '/assets/qr/komik-2/17-objek-3.jpeg',
    overlayType: '/assets/qr/komik-2/17-objek-3.jpeg',
    crop: '/assets/qr/komik-2/17-objek-3.jpeg',
    highlight: '/assets/qr/komik-2/17-objek-3.jpeg',
    options: [
      { text: 'Segitiga', correct: true },
      { text: 'Trapesium', correct: false },
      { text: 'Lingkaran', correct: false },
      { text: 'Layang-layang', correct: false },
    ],
    explanation: 'Bentuk yang memiliki tiga sisi dan tiga sudut ini disebut segitiga.',
  },
  {
    question: 'Pola pada relief ini tampak memiliki sepasang sisi sejajar. Bangun datar mana yang paling tepat?',
    imageAlt: 'Pola relief Candi Penataran menunjukkan bentuk trapesium dengan dua sisi sejajar.',
    image: '/assets/qr/komik-2/18-objek-4.jpeg',
    overlayType: '/assets/qr/komik-2/18-objek-4.jpeg',
    crop: '/assets/qr/komik-2/18-objek-4.jpeg',
    highlight: '/assets/qr/komik-2/18-objek-4.jpeg',
    options: [
      { text: 'Trapesium', correct: true },
      { text: 'Persegi', correct: false },
      { text: 'Segitiga', correct: false },
      { text: 'Persegi panjang', correct: false },
    ],
    explanation: 'Trapesium adalah bangun datar yang memiliki sepasang sisi sejajar, sesuai dengan bentuk pola yang diamati.',
  },
  {
    question: 'Jika kamu melipat bentuk ini pada sumbu tengah, apakah bentuk ini memiliki simetri lipat?',
    imageAlt: 'Relief Candi Penataran menunjukkan bentuk yang seimbang sehingga mudah dicerminkan pada sumbu tengah.',
    image: '/comics/komik-2/cover.png',
    overlayType: '/comics/komik-2/cover.png',
    crop: '/comics/komik-2/cover.png',
    highlight: '/comics/komik-2/cover.png',
    options: [
      { text: 'Ya, ada simetri lipat', correct: true },
      { text: 'Tidak ada simetri lipat', correct: false },
      { text: 'Hanya simetri putar', correct: false },
      { text: 'Tidak bisa ditentukan', correct: false },
    ],
    explanation: 'Bentuk yang seimbang di kiri dan kanan memiliki simetri lipat karena dapat dilipat menjadi dua bagian yang sama.',
  },
];

/**
 * Soal Komik 1 — Candi Jawi, Pasuruan.
 * Setiap soal menggunakan gambar bagian candi yang berbeda.
 * image  : foto utama bagian candi
 * highlight : SVG overlay yang menandai bangun ruang pada foto
 */
const KOMIK_1_QUESTIONS: RawQuestion[] = [
  {
    question: 'Perhatikan keseluruhan Candi Jawi. Bangun ruang apa yang paling dominan terlihat pada tubuh utama candi?',
    imageAlt: 'Foto keseluruhan Candi Jawi dengan overlay bangun ruang dominan.',
    image: '/images/identification/komik1-soal1.jpg',
    highlight: '/images/identification/komik1-soal1-tubuh-candi.svg',
    options: [
      { text: 'Balok', correct: true },
      { text: 'Kerucut', correct: false },
      { text: 'Bola', correct: false },
      { text: 'Tabung', correct: false },
    ],
    explanation: 'Tubuh utama Candi Jawi berbentuk balok — memiliki panjang, lebar, dan tinggi yang berbeda dengan enam sisi berbentuk persegi panjang.',
  },
  {
    question: 'Amati bagian kaki Candi Jawi. Bangun ruang apa yang paling tepat menggambarkan susunan batu pada kaki candi?',
    imageAlt: 'Zoom bagian kaki Candi Jawi dengan highlight bentuk kubus dan balok.',
    image: '/images/identification/komik1-soal2.jpg',
    highlight: '/images/identification/komik1-soal2-kaki-candi.svg',
    options: [
      { text: 'Kubus', correct: true },
      { text: 'Limas', correct: false },
      { text: 'Prisma segitiga', correct: false },
      { text: 'Kerucut', correct: false },
    ],
    explanation: 'Susunan batu pada kaki candi berbentuk kubus — keenam sisinya berbentuk persegi dengan panjang sisi yang sama.',
  },
  {
    question: 'Perhatikan badan (tubuh tengah) Candi Jawi. Bangun ruang apa yang paling sesuai dengan bentuknya?',
    imageAlt: 'Zoom badan tengah Candi Jawi dengan highlight bentuk balok.',
    image: '/images/identification/komik1-soal3.jpg',
    highlight: '/images/identification/komik1-soal3-puncak-candi.svg',
    options: [
      { text: 'Balok', correct: true },
      { text: 'Tabung', correct: false },
      { text: 'Kubus', correct: false },
      { text: 'Prisma segitiga', correct: false },
    ],
    explanation: 'Badan candi berbentuk balok karena memiliki tiga pasang sisi yang sejajar dan sama besar, dengan panjang, lebar, dan tinggi yang berbeda.',
  },
  {
    question: 'Amati bagian atap Candi Jawi yang meruncing ke atas. Bangun ruang apa yang paling tepat?',
    imageAlt: 'Zoom atap Candi Jawi dengan highlight bentuk limas segi empat.',
    image: '/images/identification/komik1-soal4.jpg',
    highlight: '/images/identification/komik1-soal4-atap-candi.svg',
    options: [
      { text: 'Limas segi empat', correct: true },
      { text: 'Kerucut', correct: false },
      { text: 'Balok', correct: false },
      { text: 'Prisma segitiga', correct: false },
    ],
    explanation: 'Atap Candi Jawi berbentuk limas segi empat — alasnya berbentuk persegi dan keempat sisi tegaknya berbentuk segitiga yang bertemu di satu titik puncak.',
  },
  {
    question: 'Lihat keseluruhan Candi Jawi sekali lagi. Kombinasi bangun ruang apa yang membentuk struktur candi dari bawah ke atas?',
    imageAlt: 'Foto keseluruhan Candi Jawi dengan highlight kombinasi kubus, balok, dan limas.',
    image: '/images/identification/komik1-soal5.jpg',
    highlight: '/images/identification/komik1-soal5-dinding-candi.svg',
    options: [
      { text: 'Kubus, balok, dan limas', correct: true },
      { text: 'Tabung, kerucut, dan bola', correct: false },
      { text: 'Prisma, tabung, dan kerucut', correct: false },
      { text: 'Balok, bola, dan kerucut', correct: false },
    ],
    explanation: 'Candi Jawi tersusun dari kubus (kaki), balok (badan), dan limas segi empat (atap) — kombinasi tiga bangun ruang yang membentuk struktur candi secara keseluruhan.',
  },
];

function buildFallbackQuestions(lokasi: string): RawQuestion[] {
  return [
    {
      question: `Bangun ruang apa yang paling banyak kamu temukan saat mengamati ${lokasi}?`,
      imageAlt: `Ilustrasi bangun ruang pada ${lokasi}`,
      image: '',
      options: [
        { text: 'Balok', correct: true },
        { text: 'Kerucut', correct: false },
        { text: 'Limas', correct: false },
        { text: 'Prisma', correct: false },
      ],
      explanation: 'Balok adalah bangun ruang yang paling umum ditemukan pada bangunan bersejarah.',
    },
    {
      question: `Bagian mana dari ${lokasi} yang paling mirip dengan bentuk kubus?`,
      imageAlt: `Ilustrasi kaki bangunan ${lokasi}`,
      image: '',
      options: [
        { text: 'Susunan batu kaki bangunan', correct: true },
        { text: 'Atap yang meruncing', correct: false },
        { text: 'Puncak menara', correct: false },
        { text: 'Tangga masuk', correct: false },
      ],
      explanation: 'Susunan batu pada kaki bangunan umumnya berbentuk kotak-kotak yang menyerupai kubus.',
    },
    {
      question: `Bangun ruang apa yang paling tepat menggambarkan puncak ${lokasi}?`,
      imageAlt: `Ilustrasi puncak ${lokasi}`,
      image: '',
      options: [
        { text: 'Limas segi empat', correct: true },
        { text: 'Kubus', correct: false },
        { text: 'Balok', correct: false },
        { text: 'Tabung', correct: false },
      ],
      explanation: 'Puncak bangunan yang meruncing ke satu titik dengan alas berbentuk persegi adalah ciri khas limas segi empat.',
    },
    {
      question: `Bagian dinding ${lokasi} paling mirip dengan bangun ruang apa?`,
      imageAlt: `Ilustrasi dinding ${lokasi}`,
      image: '',
      options: [
        { text: 'Prisma segi empat', correct: true },
        { text: 'Kerucut', correct: false },
        { text: 'Bola', correct: false },
        { text: 'Limas', correct: false },
      ],
      explanation: 'Dinding bangunan yang memiliki dua alas sejajar dan sisi-sisi tegak adalah ciri khas prisma segi empat.',
    },
    {
      question: `Bangun ruang apa yang paling tepat menggambarkan atap ${lokasi}?`,
      imageAlt: `Ilustrasi atap ${lokasi}`,
      image: '',
      options: [
        { text: 'Kerucut', correct: true },
        { text: 'Kubus', correct: false },
        { text: 'Balok', correct: false },
        { text: 'Prisma', correct: false },
      ],
      explanation: 'Atap yang meruncing ke satu titik di atas dengan alas berbentuk lingkaran adalah ciri khas kerucut.',
    },
  ];
}

function getQuestionsForComic(comicId: number, lokasi: string): RawQuestion[] {
  if (comicId === 1) return KOMIK_1_QUESTIONS;
  if (comicId === 2) return KOMIK_2_QUESTIONS;
  return buildFallbackQuestions(lokasi);
}

function buildShuffledOptions(itemId: string, rawOptions: RawOption[]): AnswerOption[] {
  const shuffled = shuffle(rawOptions);
  return shuffled.map((opt, index) => ({
    id: `${itemId}-opt-${index}`,
    text: opt.text,
    correct: opt.correct,
  }));
}

/**
 * Buat IdentificationState awal dari data komik.
 * Pilihan jawaban diacak (Fisher-Yates) setiap kali state dibuat.
 * correctOptionId ditentukan dari option.correct === true setelah shuffle.
 */
export function createIdentificationState(
  comicId: number,
  lokasi: string,
  _learningTargets: readonly string[],
  _cover: string,
  title: string,
  comicSlug = '',
  sourcePage = 1,
  pdfPath: string | null = null,
): IdentificationState {
  const questions = getQuestionsForComic(comicId, lokasi);
  const observationImage = resolveComicObservationImage({
    slug: comicSlug || `komik-${comicId}`,
    pdfPath,
    page: sourcePage,
  });

  const items: IdentificationItem[] = questions.map((question, index) => {
    const id = `${comicId}-identification-${index}`;
    const options = buildShuffledOptions(id, question.options);
    const correctOption = options.find((o) => o.correct);
    const imageSrc = question.image || observationImage.imageSrc;
    const hasDedicatedImage = Boolean(question.image);
    const overlaySrc = question.highlight ?? (hasDedicatedImage ? undefined : buildObservationOverlaySvg({
      label: `Soal ${index + 1}`,
      description: question.question,
    }));
    return {
      id,
      targetIndex: index,
      targetText: question.question,
      question: question.question,
      image: imageSrc,
      imageAlt: question.imageAlt,
      sourcePdfPath: hasDedicatedImage ? null : observationImage.sourcePdfPath,
      sourcePage: hasDedicatedImage ? undefined : observationImage.sourcePage,
      overlayType: question.overlayType ?? imageSrc,
      crop: question.crop ?? imageSrc,
      highlight: overlaySrc,
      options,
      correctOptionId: correctOption?.id ?? options[0].id,
      explanation: question.explanation,
      status: 'PENDING',
      selectedOptionId: null,
      note: '',
      answerStatus: 'UNANSWERED',
      reason: '',
      reasonStatus: 'EMPTY',
    };
  });

  return {
    comicId,
    lokasi,
    cover: _cover,
    title,
    observe: { note: '', isDone: false },
    items,
    observedCount: 0,
    isComplete: false,
  };
}

/** Tandai satu item sebagai OBSERVED. Idempoten. */
export function markItemObserved(
  state: IdentificationState,
  itemId: string
): IdentificationState {
  const alreadyObserved = state.items.find(
    (item) => item.id === itemId && item.status === 'OBSERVED'
  );
  if (alreadyObserved) return state;

  const updatedItems: IdentificationItem[] = state.items.map((item) =>
    item.id === itemId ? { ...item, status: 'OBSERVED' } : item
  );
  const observedCount = updatedItems.filter((item) => item.status === 'OBSERVED').length;
  return { ...state, items: updatedItems, observedCount, isComplete: observedCount === updatedItems.length };
}

export function setObserveNote(state: IdentificationState, note: string): IdentificationState {
  return { ...state, observe: { ...state.observe, note } };
}

export function completeObserve(state: IdentificationState): IdentificationState {
  return { ...state, observe: { ...state.observe, isDone: true } };
}

/** Pilih satu opsi jawaban — tandai selesai setelah memilih. */
export function resolveSelectedOptionId(item: IdentificationItem, selectedAnswer: string | null): string | null {
  if (!selectedAnswer) return null;
  const matchedOption = item.options.find((option) => option.text === selectedAnswer);
  return matchedOption?.id ?? null;
}

export function selectAnswer(
  state: IdentificationState,
  itemId: string,
  optionId: string
): IdentificationState {
  const updatedItems: IdentificationItem[] = state.items.map((item) =>
    item.id === itemId
      ? { ...item, selectedOptionId: optionId, answerStatus: 'SAVED', status: 'OBSERVED' }
      : item
  );
  const observedCount = updatedItems.filter((item) => item.status === 'OBSERVED').length;
  return {
    ...state,
    items: updatedItems,
    observedCount,
    isComplete: updatedItems.every((item) => item.selectedOptionId !== null),
  };
}

export function updateNote(state: IdentificationState, itemId: string, note: string): IdentificationState {
  return { ...state, items: state.items.map((item) => item.id === itemId ? { ...item, note } : item) };
}

export function saveAnswer(state: IdentificationState, itemId: string): IdentificationState {
  return { ...state, items: state.items.map((item) => item.id === itemId ? { ...item, answerStatus: 'SAVED' } : item) };
}

export function updateReason(state: IdentificationState, itemId: string, reason: string): IdentificationState {
  return {
    ...state,
    items: state.items.map((item) =>
      item.id === itemId
        ? { ...item, reason, reasonStatus: reason.trim().length > 0 ? 'DRAFT' : 'EMPTY' }
        : item
    ),
  };
}

export function saveReason(state: IdentificationState, itemId: string): IdentificationState {
  const updatedItems: IdentificationItem[] = state.items.map((item) =>
    item.id === itemId
      ? {
          ...item,
          status: item.selectedOptionId ? 'OBSERVED' : item.status,
          reasonStatus: item.reason.trim().length > 0 ? 'SAVED' : 'EMPTY',
        }
      : item
  );
  const observedCount = updatedItems.filter((item) => item.status === 'OBSERVED').length;
  return { ...state, items: updatedItems, observedCount, isComplete: updatedItems.every((item) => item.selectedOptionId !== null) };
}

export function resetIdentificationState(state: IdentificationState): IdentificationState {
  return {
    ...state,
    observe: { note: '', isDone: false },
    items: state.items.map((item) => {
      const options = buildShuffledOptions(item.id, item.options);
      const correctOption = options.find((o) => o.correct);
      return {
        ...item,
        options,
        correctOptionId: correctOption?.id ?? options[0].id,
        status: 'PENDING',
        selectedOptionId: null,
        note: '',
        answerStatus: 'UNANSWERED',
        reason: '',
        reasonStatus: 'EMPTY',
      };
    }),
    observedCount: 0,
    isComplete: false,
  };
}
