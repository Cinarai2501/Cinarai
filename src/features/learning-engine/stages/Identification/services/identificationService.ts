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
  options: RawOption[];
  explanation: string;
};

/**
 * Soal Komik 1 — Candi Jawi, Pasuruan
 * Foto asli dari Wikimedia Commons (CC-licensed).
 * Setiap soal menggunakan foto nyata dengan overlay bangun ruang.
 */
const KOMIK_1_QUESTIONS: RawQuestion[] = [
  {
    question: 'Perhatikan bagian tubuh utama Candi Jawi ini. Bangun ruang apa yang paling tepat menggambarkan bentuknya?',
    imageAlt: 'Tubuh utama Candi Jawi tampak dari depan',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Candi_Jawi.jpg/800px-Candi_Jawi.jpg',
    options: [
      { text: 'Balok', correct: true },
      { text: 'Kerucut', correct: false },
      { text: 'Bola', correct: false },
      { text: 'Tabung', correct: false },
    ],
    explanation: 'Tubuh utama candi berbentuk balok karena memiliki panjang, lebar, dan tinggi yang berbeda, dengan enam sisi berbentuk persegi panjang.',
  },
  {
    question: 'Amati susunan batu pada bagian kaki Candi Jawi ini. Bangun ruang apa yang paling mirip dengan setiap batu penyusunnya?',
    imageAlt: 'Susunan batu kaki Candi Jawi',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Candi_Jawi_base.jpg/800px-Candi_Jawi_base.jpg',
    options: [
      { text: 'Kubus', correct: true },
      { text: 'Limas', correct: false },
      { text: 'Kerucut', correct: false },
      { text: 'Prisma', correct: false },
    ],
    explanation: 'Batu penyusun kaki candi berbentuk kubus karena semua sisinya sama panjang dan membentuk sudut siku-siku di setiap sudutnya.',
  },
  {
    question: 'Lihat bagian puncak Candi Jawi yang meruncing ini. Bangun ruang apa yang paling sesuai dengan bentuk puncaknya?',
    imageAlt: 'Puncak Candi Jawi yang meruncing',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Candi_Jawi.jpg/400px-Candi_Jawi.jpg',
    options: [
      { text: 'Kerucut', correct: true },
      { text: 'Kubus', correct: false },
      { text: 'Balok', correct: false },
      { text: 'Prisma segi empat', correct: false },
    ],
    explanation: 'Puncak candi yang meruncing ke satu titik di atas dengan alas berbentuk lingkaran adalah ciri khas bangun ruang kerucut.',
  },
  {
    question: 'Perhatikan bagian atap bertingkat Candi Jawi ini. Bangun ruang apa yang paling tepat menggambarkan setiap tingkatan atapnya?',
    imageAlt: 'Atap bertingkat Candi Jawi',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Candi_Jawi.jpg/600px-Candi_Jawi.jpg',
    options: [
      { text: 'Limas segi empat', correct: true },
      { text: 'Tabung', correct: false },
      { text: 'Bola', correct: false },
      { text: 'Kubus', correct: false },
    ],
    explanation: 'Setiap tingkatan atap candi berbentuk limas segi empat karena memiliki alas berbentuk persegi dan empat sisi segitiga yang bertemu di satu titik puncak.',
  },
  {
    question: 'Amati bagian dinding sisi Candi Jawi ini. Bangun ruang apa yang paling tepat menggambarkan bentuk keseluruhan dinding tersebut?',
    imageAlt: 'Dinding sisi Candi Jawi tampak samping',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Candi_Jawi.jpg/500px-Candi_Jawi.jpg',
    options: [
      { text: 'Prisma segi empat', correct: true },
      { text: 'Limas', correct: false },
      { text: 'Kerucut', correct: false },
      { text: 'Tabung', correct: false },
    ],
    explanation: 'Dinding sisi candi yang memiliki dua alas sejajar berbentuk persegi panjang dan sisi-sisi tegak berbentuk persegi panjang adalah ciri khas prisma segi empat.',
  },
];

function buildFallbackQuestions(lokasi: string, cover: string): RawQuestion[] {
  return [
    {
      question: `Bangun ruang apa yang paling banyak kamu temukan saat mengamati ${lokasi}?`,
      imageAlt: `Gambar ${lokasi}`,
      image: cover,
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
      imageAlt: `Gambar ${lokasi}`,
      image: cover,
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
      imageAlt: `Gambar ${lokasi}`,
      image: cover,
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
      imageAlt: `Gambar ${lokasi}`,
      image: cover,
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
      imageAlt: `Gambar ${lokasi}`,
      image: cover,
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

function getQuestionsForComic(comicId: number, lokasi: string, cover: string): RawQuestion[] {
  if (comicId === 1) return KOMIK_1_QUESTIONS;
  return buildFallbackQuestions(lokasi, cover);
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
  cover: string,
  title: string,
): IdentificationState {
  const questions = getQuestionsForComic(comicId, lokasi, cover);
  const items: IdentificationItem[] = questions.map((question, index) => {
    const id = `${comicId}-identification-${index}`;
    const options = buildShuffledOptions(id, question.options);
    const correctOption = options.find((o) => o.correct);
    return {
      id,
      targetIndex: index,
      targetText: question.question,
      question: question.question,
      image: question.image,
      imageAlt: question.imageAlt,
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
    cover,
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
