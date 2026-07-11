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
 * 
 * TOTAL 7 PILIHAN:
 * - Correct: Kubus, Balok, Limas, Prisma
 * - Distractor: Kerucut, Tabung, Bola
 */
const SHAPE_OPTIONS: RawOption[] = [
  { text: 'Kubus', correct: true },
  { text: 'Balok', correct: true },
  { text: 'Limas', correct: true },
  { text: 'Prisma', correct: true },
  { text: 'Kerucut', correct: false },
  { text: 'Tabung', correct: false },
  { text: 'Bola', correct: false },
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

    const currentSelection = item.selectedOptionIds ?? [];
    const alreadySelected = currentSelection.includes(optionId);
    const nextSelection = alreadySelected
      ? currentSelection.filter((id) => id !== optionId)
      : [...currentSelection, optionId];

    return {
      ...item,
      selectedOptionIds: nextSelection,
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
          status: (item.selectedOptionIds ?? []).length > 0 ? 'OBSERVED' : item.status,
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
  id: string;
  name: string;
  icon: string;
  definition: string;
  characteristics: string[];
  faces: string;
  edges: string;
  vertices: string;
  surfaceFormula: string;
  volumeFormula: string;
  foundInTemple: boolean;
  templeLocation: string;
  comicReference: string;
  explanation: string;
  reflectionQuestion: string;
}

const IDENTIFICATION_TUTOR_DATA: Record<string, IdentificationTutorEntry> = {
  Balok: {
    id: 'balok',
    name: 'Balok',
    icon: '📦',
    definition: 'Balok adalah bangun ruang yang punya 6 sisi berbentuk persegi panjang.',
    characteristics: ['6 sisi', '12 rusuk', '8 titik sudut'],
    faces: '6',
    edges: '12',
    vertices: '8',
    surfaceFormula: '2(pl + pt + lt)',
    volumeFormula: 'p × l × t',
    foundInTemple: true,
    templeLocation: 'bagian badan candi yang tersusun dari batu bangunan besar',
    comicReference: 'Perhatikan kembali panel komik saat tokoh mengamati kaki dan badan candi.',
    explanation: 'Bentuk balok sering terlihat pada susunan batu yang kuat dan rapi. Pada panel komik, bagian ini membantu kita melihat bangunan candi yang kokoh dan tersusun rapi.',
    reflectionQuestion: 'Mengapa menurutmu batu berbentuk balok lebih cocok dipakai sebagai pondasi candi?',
  },
  Kubus: {
    id: 'kubus',
    name: 'Kubus',
    icon: '🧊',
    definition: 'Kubus adalah bangun ruang yang punya 6 sisi berbentuk persegi dan semua rusuk sama panjang.',
    characteristics: ['6 sisi persegi', '12 rusuk sama panjang', '8 titik sudut'],
    faces: '6',
    edges: '12',
    vertices: '8',
    surfaceFormula: '6s²',
    volumeFormula: 's³',
    foundInTemple: true,
    templeLocation: 'susunan batu pada bagian kaki candi',
    comicReference: 'Lihat kembali panel komik ketika tokoh mengamati bagian kaki candi yang kotak-kotak.',
    explanation: 'Bentuk kubus terlihat pada bagian batu yang tampak seperti kotak. Pada panel komik, bagian ini membantu kita melihat bahwa bentuk candi tidak selalu bulat atau runcing.',
    reflectionQuestion: 'Mengapa menurutmu bagian ini paling mirip dengan kubus dibanding bangun ruang lain?',
  },
  Limas: {
    id: 'limas',
    name: 'Limas',
    icon: '🔺',
    definition: 'Limas adalah bangun ruang yang punya satu alas dan sisi-sisi tegak berbentuk segitiga.',
    characteristics: ['satu alas', 'sisi tegak segitiga', 'puncak runcing'],
    faces: 'n + 1',
    edges: '2n',
    vertices: 'n + 1',
    surfaceFormula: 'L alas + ½ × keliling alas × t sisi',
    volumeFormula: '⅓ × luas alas × tinggi',
    foundInTemple: true,
    templeLocation: 'bagian atap candi yang meruncing ke atas',
    comicReference: 'Lihat kembali gambar atap pada komik, saat bagian puncak candi tampak runcing.',
    explanation: 'Saat atap candi mengarah ke puncak, bentuknya mirip limas. Pada panel komik, bagian ini terlihat tajam dan stabil seperti bentuk limas.',
    reflectionQuestion: 'Mengapa menurutmu atap candi lebih cocok dibuat seperti limas?',
  },
  Prisma: {
    id: 'prisma',
    name: 'Prisma',
    icon: '🔷',
    definition: 'Prisma adalah bangun ruang yang punya dua alas yang sama dan sisi-sisi tegak yang menghubungkan kedua alas itu.',
    characteristics: ['dua alas sama', 'sisi tegak lurus', 'bisa terlihat seperti balok panjang'],
    faces: 'n + 2',
    edges: '3n',
    vertices: '2n',
    surfaceFormula: '2 × luas alas + keliling alas × tinggi',
    volumeFormula: 'luas alas × tinggi',
    foundInTemple: true,
    templeLocation: 'bagian struktur dinding candi yang tersusun berlapis',
    comicReference: 'Perhatikan kembali panel komik saat tokoh melihat dinding dan susunan batu candi.',
    explanation: 'Bentuk prisma membantu kita melihat bahwa beberapa bagian candi tampak panjang dan berjajar. Pada panel komik, susunannya membuat tampilan candi terlihat lebih teratur.',
    reflectionQuestion: 'Menurutmu, apakah bagian ini lebih mirip prisma atau balok?',
  },
  Bola: {
    id: 'bola',
    name: 'Bola',
    icon: '⚽',
    definition: 'Bola adalah bangun ruang yang seluruh permukaannya melengkung.',
    characteristics: ['tidak punya rusuk', 'permukaannya bulat', 'tidak punya sudut'],
    faces: '1',
    edges: '0',
    vertices: '0',
    surfaceFormula: '4πr²',
    volumeFormula: '4/3 πr³',
    foundInTemple: false,
    templeLocation: 'tidak ada bagian utama Candi Jawi yang menyerupai bola',
    comicReference: 'Pada panel komik, tidak ada bagian utama candi yang tampak bulat seperti bola.',
    explanation: 'Bentuk bola tidak cocok untuk bagian utama candi karena candi lebih banyak memakai sisi yang datar dan runcing. Pada panel komik, bagian ini tidak terlihat seperti bola.',
    reflectionQuestion: 'Mengapa bagian utama candi lebih cocok dipelajari sebagai kubus, balok, atau limas?',
  },
  Tabung: {
    id: 'tabung',
    name: 'Tabung',
    icon: '🛢',
    definition: 'Tabung adalah bangun ruang yang punya alas dan tutup berbentuk lingkaran.',
    characteristics: ['alas lingkaran', 'tutup lingkaran', 'sisi tegak melengkung'],
    faces: '3',
    edges: '2',
    vertices: '0',
    surfaceFormula: '2πr(r + t)',
    volumeFormula: 'πr²t',
    foundInTemple: false,
    templeLocation: 'bukan bentuk dominan pada struktur utama Candi Jawi',
    comicReference: 'Perhatikan kembali panel komik, bagian candi yang kamu pilih tidak tampak seperti tabung.',
    explanation: 'Bentuk tabung lebih sering terlihat pada benda seperti kaleng, bukan pada bangunan candi yang tersusun dari batu. Pada panel komik, bagian yang kamu pilih tidak tampak seperti tabung.',
    reflectionQuestion: 'Menurutmu, bagian mana pada komik lebih cocok disebut sebagai balok atau limas daripada tabung?',
  },
  Kerucut: {
    id: 'kerucut',
    name: 'Kerucut',
    icon: '🍦',
    definition: 'Kerucut adalah bangun ruang yang punya alas berbentuk lingkaran dan satu titik puncak.',
    characteristics: ['alas lingkaran', 'satu puncak', 'sisi tegak melengkung'],
    faces: '2',
    edges: '1',
    vertices: '1',
    surfaceFormula: 'πr(r + s)',
    volumeFormula: '⅓ πr²t',
    foundInTemple: false,
    templeLocation: 'tidak menjadi bagian utama struktur Candi Jawi',
    comicReference: 'Sebaiknya lihat kembali panel komik untuk bagian yang paling dominan pada candi.',
    explanation: 'Bentuk kerucut lebih cocok untuk benda yang meruncing ke satu titik, tetapi bagian candi lebih banyak memakai bentuk yang datar. Pada panel komik, bentuk ini tidak terlihat sebagai bagian utama candi.',
    reflectionQuestion: 'Apa perbedaan paling mudah yang kamu lihat antara bentuk kerucut dan limas pada komik?',
  },
};

function getTutorEntry(shape: string): IdentificationTutorEntry {
  const trimmed = shape.trim();
  const directMatch = IDENTIFICATION_TUTOR_DATA[trimmed];
  if (directMatch) return directMatch;

  const normalized = trimmed.toLowerCase();
  const fallbackEntry = Object.values(IDENTIFICATION_TUTOR_DATA).find((entry) => entry.name.toLowerCase() === normalized);
  if (fallbackEntry) return fallbackEntry;

  return {
    id: trimmed.toLowerCase().replace(/\s+/g, '-'),
    name: trimmed || 'Bangun ruang',
    icon: '🧩',
    definition: `${trimmed || 'Bangun ruang'} adalah bangun ruang yang kamu pilih.`,
    characteristics: ['memiliki ciri khusus yang bisa kamu amati'],
    faces: 'tidak ditentukan',
    edges: 'tidak ditentukan',
    vertices: 'tidak ditentukan',
    surfaceFormula: 'ditentukan dari bentuk alas',
    volumeFormula: 'ditentukan dari bentuk alas',
    foundInTemple: false,
    templeLocation: 'belum dapat dipastikan dari panel komik yang diamati',
    comicReference: 'Perhatikan kembali panel komik untuk melihat hubungan bangun ini dengan bagian candi.',
    explanation: 'Kamu bisa mengamati bagian yang paling terlihat pada komik untuk melihat apakah bentuk ini cocok dengan bangunan candi.',
    reflectionQuestion: 'Bagian mana pada komik yang paling membantu kamu memahami bentuk ini?',
  };
}

export interface IdentificationTutorExplanation extends IdentificationTutorEntry {
  badgeLabel: string;
  statusLabel: string;
}

export function buildIdentificationTutorExplanations(selectedShapes: string[]): IdentificationTutorExplanation[] {
  const normalized = selectedShapes.filter(Boolean).map((shape) => shape.trim()).filter(Boolean);
  if (normalized.length === 0) {
    return [];
  }

  return normalized.map((shape) => {
    const entry = getTutorEntry(shape);
    const badgeLabel = entry.foundInTemple ? '✅ Ditemukan' : '❌ Tidak ditemukan';
    const statusLabel = entry.foundInTemple ? 'Ditemukan pada Candi Jawi' : 'Tidak ditemukan pada struktur utama Candi Jawi';
    return { ...entry, badgeLabel, statusLabel };
  });
}

export function buildIdentificationTutorExplanation(selectedShapes: string[]): string {
  const explanations = buildIdentificationTutorExplanations(selectedShapes);
  const content = explanations.map((item) => [
    `- ${item.name}`,
    `${item.icon} ${item.definition}`,
    `${item.badgeLabel}`,
    `Penjelasan: ${item.explanation}`,
    `Hubungan dengan komik: ${item.comicReference}`,
    `Refleksi: ${item.reflectionQuestion}`,
  ].join('\n')).join('\n\n');
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
