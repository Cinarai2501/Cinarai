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
const SHAPE_OPTIONS: RawOption[] = [
  { text: 'Kubus', correct: true },
  { text: 'Balok', correct: true },
  { text: 'Limas', correct: true },
  { text: 'Prisma', correct: true },
  { text: 'Kerucut', correct: false },
  { text: 'Tabung', correct: false },
  { text: 'Bola', correct: false },
  { text: 'Prisma Segitiga', correct: false },
  { text: 'Prisma Segi Lima', correct: false },
  { text: 'Prisma Segi Enam', correct: false },
  { text: 'Limas Segitiga', correct: false },
  { text: 'Limas Segi Empat', correct: false },
];

const KOMIK_1_QUESTIONS: RawQuestion[] = [
  {
    question: 'Apa saja bangun ruang yang kamu temukan di Candi Jawi?',
    imageAlt: 'Foto keseluruhan Candi Jawi dengan overlay bangun ruang dominan.',
    image: '/images/identification/komik1-soal1.jpg',
    highlight: '/images/identification/komik1-soal1-tubuh-candi.svg',
    options: SHAPE_OPTIONS,
    explanation: 'Pada Candi Jawi, bentuk yang benar-benar terlihat adalah kubus, balok, limas, dan prisma. Bangun ruang lain seperti bola, tabung, dan prisma segi enam merupakan distractor yang tidak menjadi bagian utama candi.',
  },
  {
    question: 'Apa saja bangun ruang yang kamu temukan di Candi Jawi?',
    imageAlt: 'Zoom bagian kaki Candi Jawi dengan highlight bentuk kubus dan balok.',
    image: '/images/identification/komik1-soal2.jpg',
    highlight: '/images/identification/komik1-soal2-kaki-candi.svg',
    options: SHAPE_OPTIONS,
    explanation: 'Susunan batu pada kaki candi membantu mengidentifikasi kubus dan balok. Bangun ruang yang lain tidak menjadi bentuk utama pada struktur candi.',
  },
  {
    question: 'Apa saja bangun ruang yang kamu temukan di Candi Jawi?',
    imageAlt: 'Zoom badan tengah Candi Jawi dengan highlight bentuk balok.',
    image: '/images/identification/komik1-soal3.jpg',
    highlight: '/images/identification/komik1-soal3-puncak-candi.svg',
    options: SHAPE_OPTIONS,
    explanation: 'Badan candi banyak menyerupai balok, sementara kubus dan limas terlihat pada bagian yang lain. Bentuk seperti bola dan tabung tidak muncul sebagai bagian utama.',
  },
  {
    question: 'Apa saja bangun ruang yang kamu temukan di Candi Jawi?',
    imageAlt: 'Zoom atap Candi Jawi dengan highlight bentuk limas segi empat.',
    image: '/images/identification/komik1-soal4.jpg',
    highlight: '/images/identification/komik1-soal4-atap-candi.svg',
    options: SHAPE_OPTIONS,
    explanation: 'Atap Candi Jawi memberi kesan limas, sedangkan bagian lain candi menampilkan kubus, balok, dan prisma. Distractor seperti bola dan tabung tidak sesuai.',
  },
  {
    question: 'Apa saja bangun ruang yang kamu temukan di Candi Jawi?',
    imageAlt: 'Foto keseluruhan Candi Jawi dengan highlight kombinasi kubus, balok, dan limas.',
    image: '/images/identification/komik1-soal5.jpg',
    highlight: '/images/identification/komik1-soal5-dinding-candi.svg',
    options: SHAPE_OPTIONS,
    explanation: 'Candi Jawi tersusun dari bangun ruang yang dapat diamati secara keseluruhan: kubus, balok, limas, dan prisma. Bentuk yang lain adalah distractor untuk melatih identifikasi.',
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
      selectedOptionIds: [],
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
  const updatedItems: IdentificationItem[] = state.items.map((item) => {
    if (item.id !== itemId) return item;

    const currentSelection = item.selectedOptionIds ?? (item.selectedOptionId ? [item.selectedOptionId] : []);
    const alreadySelected = currentSelection.includes(optionId);
    const nextSelection = alreadySelected
      ? currentSelection.filter((id) => id !== optionId)
      : [...currentSelection, optionId];

    return {
      ...item,
      selectedOptionIds: nextSelection,
      selectedOptionId: nextSelection[0] ?? null,
      answerStatus: nextSelection.length > 0 ? 'SAVED' : 'UNANSWERED',
      status: nextSelection.length > 0 ? 'OBSERVED' : item.status,
    };
  });

  const observedCount = updatedItems.filter((item) => item.status === 'OBSERVED').length;
  return {
    ...state,
    items: updatedItems,
    observedCount,
    isComplete: updatedItems.every((item) => (item.selectedOptionIds ?? []).length > 0),
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
  return {
    ...state,
    items: updatedItems,
    observedCount,
    isComplete: updatedItems.every((item) => (item.selectedOptionIds ?? []).length > 0),
  };
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
        selectedOptionIds: [],
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

interface IdentificationTutorEntry {
  name: string;
  definition: string;
  characteristics: string[];
  foundInCandiJawi: boolean;
  location: string;
  relationToComicPanel: string;
}

const IDENTIFICATION_TUTOR_DATA: Record<string, IdentificationTutorEntry> = {
  Balok: {
    name: 'Balok',
    definition: 'Balok adalah bangun ruang yang memiliki 6 sisi berbentuk persegi panjang.',
    characteristics: ['memiliki 6 sisi', 'memiliki 12 rusuk', 'memiliki 8 titik sudut'],
    foundInCandiJawi: true,
    location: 'bagian badan candi yang tersusun dari batu bangunan besar',
    relationToComicPanel: 'pada panel komik, bentuk ini terlihat pada bagian badan candi yang menonjol dan tersusun rapi.',
  },
  Kubus: {
    name: 'Kubus',
    definition: 'Kubus adalah bangun ruang yang memiliki 6 sisi berbentuk persegi, 12 rusuk sama panjang, dan 8 titik sudut.',
    characteristics: ['semua sisi berbentuk persegi', 'semua rusuk sama panjang', 'memiliki 8 titik sudut'],
    foundInCandiJawi: true,
    location: 'susunan batu pada bagian kaki candi',
    relationToComicPanel: 'pada panel komik, bentuk ini terlihat pada bagian kaki candi yang tersusun seperti kotak-kotak.',
  },
  Limas: {
    name: 'Limas',
    definition: 'Limas adalah bangun ruang yang memiliki satu alas dan sisi-sisi tegak berbentuk segitiga.',
    characteristics: ['memiliki satu alas', 'sisi tegak berbentuk segitiga', 'bertemu pada satu titik puncak'],
    foundInCandiJawi: true,
    location: 'bagian atap candi yang meruncing ke atas',
    relationToComicPanel: 'pada panel komik, bentuk ini terlihat ketika atap candi tampak runcing dan menuju puncak.',
  },
  Prisma: {
    name: 'Prisma',
    definition: 'Prisma adalah bangun ruang yang memiliki dua bidang alas yang kongruen dan sisi tegak berbentuk persegi panjang.',
    characteristics: ['memiliki dua alas yang sama', 'sisi tegak berbentuk persegi panjang', 'alas bisa berbentuk segitiga atau segi empat'],
    foundInCandiJawi: true,
    location: 'bagian struktur dinding candi yang tersusun berlapis',
    relationToComicPanel: 'pada panel komik, bentuk ini terlihat pada susunan dinding candi yang panjang dan berlapis.',
  },
  Bola: {
    name: 'Bola',
    definition: 'Bola adalah bangun ruang yang seluruh sisinya melengkung.',
    characteristics: ['tidak memiliki rusuk', 'seluruh permukaannya melengkung', 'memiliki bentuk bulat'],
    foundInCandiJawi: false,
    location: 'tidak ditemukan pada struktur utama Candi Jawi',
    relationToComicPanel: 'pada panel komik, bangun ini tidak muncul sebagai bagian utama bangunan candi.',
  },
  Tabung: {
    name: 'Tabung',
    definition: 'Tabung adalah bangun ruang yang memiliki dua alas berbentuk lingkaran.',
    characteristics: ['memiliki 2 alas berbentuk lingkaran', 'sisi tegaknya melengkung', 'sering terlihat seperti kaleng'],
    foundInCandiJawi: false,
    location: 'tidak menjadi bentuk dominan pada struktur Candi Jawi',
    relationToComicPanel: 'pada panel komik, bangun ini tidak menjadi bentuk utama yang membangun candi.',
  },
  Kerucut: {
    name: 'Kerucut',
    definition: 'Kerucut adalah bangun ruang yang memiliki satu alas berbentuk lingkaran dan satu titik puncak.',
    characteristics: ['memiliki satu alas lingkaran', 'memiliki satu titik puncak', 'sisi tegaknya melengkung'],
    foundInCandiJawi: false,
    location: 'tidak menjadi bagian utama struktur Candi Jawi',
    relationToComicPanel: 'pada panel komik, bentuk ini tidak menjadi bagian utama candi.',
  },
  'Limas Segitiga': {
    name: 'Limas Segitiga',
    definition: 'Limas segitiga adalah bangun ruang yang memiliki alas berbentuk segitiga dan sisi tegak berbentuk segitiga.',
    characteristics: ['alas berbentuk segitiga', 'sisi tegak berbentuk segitiga', 'bertemu pada satu puncak'],
    foundInCandiJawi: false,
    location: 'tidak menjadi bentuk utama pada struktur Candi Jawi',
    relationToComicPanel: 'pada panel komik, bentuk ini tidak menjadi bentuk dominan yang terlihat pada candi.',
  },
  'Limas Segi Empat': {
    name: 'Limas Segi Empat',
    definition: 'Limas segi empat adalah bangun ruang dengan alas berbentuk persegi dan sisi tegak berbentuk segitiga.',
    characteristics: ['alas berbentuk persegi', 'sisi tegak berbentuk segitiga', 'memiliki satu puncak'],
    foundInCandiJawi: true,
    location: 'bagian puncak candi yang runcing',
    relationToComicPanel: 'pada panel komik, bentuk ini tampak pada bagian puncak candi yang menonjol.',
  },
  'Prisma Segitiga': {
    name: 'Prisma Segitiga',
    definition: 'Prisma segitiga adalah bangun ruang yang mempunyai dua alas berbentuk segitiga.',
    characteristics: ['alas berbentuk segitiga', 'sisi tegak berbentuk persegi panjang', 'memiliki dua alas yang sama'],
    foundInCandiJawi: false,
    location: 'tidak ditemukan sebagai bentuk utama pada Candi Jawi',
    relationToComicPanel: 'pada panel komik, bentuk ini tidak menjadi bentuk utama yang terlihat pada candi.',
  },
  'Prisma Segi Lima': {
    name: 'Prisma Segi Lima',
    definition: 'Prisma segi lima adalah bangun ruang dengan dua alas berbentuk segi lima.',
    characteristics: ['alas berbentuk segi lima', 'sisi tegak berbentuk persegi panjang', 'memiliki dua alas yang kongruen'],
    foundInCandiJawi: false,
    location: 'tidak ditemukan sebagai bentuk utama pada Candi Jawi',
    relationToComicPanel: 'pada panel komik, bentuk ini tidak muncul pada struktur utama candi.',
  },
  'Prisma Segi Enam': {
    name: 'Prisma Segi Enam',
    definition: 'Prisma segi enam adalah bangun ruang dengan dua alas berbentuk segi enam.',
    characteristics: ['alas berbentuk segi enam', 'sisi tegak berbentuk persegi panjang', 'memiliki dua alas yang kongruen'],
    foundInCandiJawi: false,
    location: 'tidak ditemukan sebagai bentuk utama pada Candi Jawi',
    relationToComicPanel: 'pada panel komik, bentuk ini tidak muncul pada struktur utama candi.',
  },
};

export interface IdentificationTutorExplanation {
  name: string;
  text: string;
}

export function buildIdentificationTutorExplanations(selectedShapes: string[]): IdentificationTutorExplanation[] {
  const normalized = selectedShapes.filter(Boolean);
  if (normalized.length === 0) {
    return [{ name: 'AI Tutor', text: 'Pilih bangun ruang yang kamu temukan, lalu aku akan jelaskan ciri-cirinya dengan bahasa sederhana.' }];
  }

  return normalized.map((shape) => {
    const entry = IDENTIFICATION_TUTOR_DATA[shape] ?? {
      name: shape,
      definition: `${shape} adalah bangun ruang yang kamu pilih.`,
      characteristics: ['memiliki ciri khusus yang bisa kamu amati'],
      foundInCandiJawi: false,
      location: 'belum dapat dipastikan dari panel komik yang diamati',
      relationToComicPanel: 'hubungannya dengan panel komik masih perlu diperiksa lebih lanjut.',
    };

    const foundStatus = entry.foundInCandiJawi
      ? `Ya, bangun ini ditemukan pada Candi Jawi pada bagian ${entry.location}.`
      : `Tidak, bangun ini tidak ditemukan pada struktur utama Candi Jawi. ${entry.location}.`;

    const text = [
      `Nama bangun ruang: ${entry.name}`,
      `Definisi: ${entry.definition}`,
      `Ciri-ciri: ${entry.characteristics.join(', ')}`,
      `Apakah ditemukan pada Candi Jawi: ${foundStatus}`,
      `Kaitannya dengan panel komik: ${entry.relationToComicPanel}`,
    ].join('\n');

    return { name: entry.name, text };
  });
}

export function buildIdentificationTutorExplanation(selectedShapes: string[]): string {
  const explanations = buildIdentificationTutorExplanations(selectedShapes);
  const content = explanations.map((item) => `- ${item.name}\n${item.text}`).join('\n\n');
  return ['AI Tutor: Saya bantu jelaskan bangun ruang yang kamu pilih.', content].filter(Boolean).join('\n\n');
}

export function buildIdentificationFeedback(selectedShapes: string[], correctShapes: string[]): string {
  const normalizedSelected = selectedShapes.filter(Boolean);
  const normalizedCorrect = correctShapes.filter(Boolean);
  const isComplete = normalizedSelected.length === normalizedCorrect.length && normalizedCorrect.every((shape) => normalizedSelected.includes(shape));

  if (isComplete) {
    return 'Hebat! Kamu berhasil mengidentifikasi bangun ruang yang terdapat pada Candi Jawi.';
  }

  const incorrect = normalizedSelected.filter((shape) => !normalizedCorrect.includes(shape));
  const missing = normalizedCorrect.filter((shape) => !normalizedSelected.includes(shape));
  const issues: string[] = [];

  if (incorrect.length > 0) {
    issues.push(`Bangun ruang ${incorrect.join(', ')} tidak sesuai dengan yang ditemukan pada Candi Jawi.`);
  }

  if (missing.length > 0) {
    issues.push(`Kamu belum memilih ${missing.join(', ')} yang memang ada pada Candi Jawi.`);
  }

  return ['Ada jawaban yang belum sesuai.', ...issues, 'Perhatikan lagi bagian komik dan pilih bangun ruang yang benar-benar terlihat pada Candi Jawi.'].join(' ');
}
