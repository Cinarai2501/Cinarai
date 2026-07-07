import type {
  AnswerOption,
  IdentificationItem,
  IdentificationState,
} from '../types';

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function buildOptions(itemId: string, texts: string[]): AnswerOption[] {
  return texts.map((text, index) => ({
    id: `${itemId}-opt-${index}`,
    text,
  }));
}

function buildStoryQuestions(
  comicId: number,
  lokasi: string,
  learningTargets: readonly string[],
  title: string,
  cover: string,
): Array<{ question: string; image: string; options: string[]; correctIndex: number; explanation: string }> {
  const conceptHints = learningTargets.slice(0, 4).join(' • ');

  const baseQuestions = [
    {
      question: `Di bagian mana tokoh menemukan bentuk yang paling dekat dengan kubus saat mengamati ${title} di ${lokasi}?`,
      image: cover,
      options: [
        'Pada susunan batu bagian kaki bangunan',
        'Pada atap yang melengkung',
        'Pada pepohonan di sekitar area',
        'Pada tangga yang menuju pintu masuk',
      ],
      correctIndex: 0,
      explanation: 'Susunan batu pada kaki bangunan candi umumnya berbentuk kotak-kotak yang menyerupai kubus, sehingga bagian inilah yang paling tepat untuk mengidentifikasi bentuk kubus.',
    },
    {
      question: `Tokoh menyebut bangun ruang apa ketika mengamati bagian penyangga utama dari ${title}?`,
      image: cover,
      options: [
        'Balok',
        'Kerucut',
        'Lingkaran',
        'Trapesium',
      ],
      correctIndex: 0,
      explanation: 'Penyangga utama bangunan biasanya berbentuk balok karena memiliki panjang, lebar, dan tinggi yang berbeda-beda namun sisi-sisinya tetap berbentuk persegi panjang.',
    },
    {
      question: `Bagian mana dari cerita yang membantu tokoh memahami bentuk prisma saat mengamati ${lokasi}?`,
      image: cover,
      options: [
        'Bagian dinding yang tersusun berjejer',
        'Bagian langit-langit yang membentuk puncak',
        'Bagian pohon di halaman',
        'Bagian jalan yang melingkar',
      ],
      correctIndex: 0,
      explanation: 'Dinding yang tersusun berjejer membentuk bidang-bidang sejajar yang merupakan ciri khas prisma, yaitu dua alas yang sama dan sisi-sisi tegak berbentuk persegi panjang.',
    },
    {
      question: `Mengapa bagian yang diamati bisa disebut limas menurut tokoh dalam ${title}?`,
      image: cover,
      options: [
        'Karena bentuknya bertumpu pada satu titik puncak',
        'Karena bentuknya selalu membulat',
        'Karena tidak memiliki sisi',
        'Karena terbuat dari kaca',
      ],
      correctIndex: 0,
      explanation: 'Limas memiliki ciri khas berupa satu titik puncak di atas dan alas berbentuk segi banyak di bawah. Semua sisi tegaknya berbentuk segitiga yang bertemu di satu titik puncak.',
    },
    {
      question: `Objek apa yang tokoh amati saat menemukan bentuk kerucut pada ${lokasi}?`,
      image: cover,
      options: [
        'Bagian atap yang meruncing',
        'Bagian lantai yang rata',
        'Bagian pagar yang panjang',
        'Bagian pohon yang menjulang',
      ],
      correctIndex: 0,
      explanation: 'Atap yang meruncing ke atas adalah contoh nyata bentuk kerucut dalam arsitektur, karena memiliki alas lingkaran dan satu titik puncak di bagian atas.',
    },
    {
      question: `Apa alasan tokoh menyebut bagian tersebut sebagai bangun ruang yang berbeda dari kubus?`,
      image: cover,
      options: [
        'Karena sisi-sisinya tidak sama panjang dan bentuknya lebih panjang',
        'Karena warnanya lebih gelap',
        'Karena memiliki lebih banyak daun',
        'Karena hanya terlihat dari jauh',
      ],
      correctIndex: 0,
      explanation: 'Perbedaan utama kubus dan balok adalah pada panjang sisinya. Kubus memiliki semua sisi sama panjang, sedangkan balok memiliki panjang, lebar, dan tinggi yang berbeda.',
    },
    {
      question: `Bangun ruang apa yang paling banyak membantu tokoh memahami bentuk arsitektur di ${title}?`,
      image: cover,
      options: [
        'Balok',
        'Kerucut',
        'Lingkaran',
        'Segitiga',
      ],
      correctIndex: 0,
      explanation: 'Balok adalah bangun ruang yang paling sering ditemukan dalam arsitektur bangunan karena bentuknya yang praktis dan mudah disusun untuk membentuk dinding, lantai, dan atap.',
    },
    {
      question: `Saat membaca ulang cerita, informasi apa yang paling penting untuk menjawab soal tentang ${conceptHints}?`,
      image: cover,
      options: [
        'Ciri bentuk dan bagian objek yang diamati',
        'Nama tokoh yang paling sering muncul',
        'Warna pakaian tokoh',
        'Jumlah langkah menuju pintu masuk',
      ],
      correctIndex: 0,
      explanation: 'Untuk mengidentifikasi bangun ruang, yang paling penting adalah memperhatikan ciri-ciri bentuk seperti jumlah sisi, bentuk alas, dan apakah ada titik puncak atau tidak.',
    },
  ];

  if (comicId === 2) {
    baseQuestions[0].question = `Di bagian mana tokoh menemukan pola simetri saat mengamati ${title} di ${lokasi}?`;
    baseQuestions[0].options = [
      'Pada relief yang terbagi dua secara seimbang',
      'Pada jalan keluar yang tidak rata',
      'Pada pohon yang tumbuh acak',
      'Pada air yang mengalir',
    ];
    baseQuestions[0].correctIndex = 0;
    baseQuestions[0].explanation = 'Simetri berarti dua bagian yang sama persis jika dilipat. Relief yang terbagi dua secara seimbang menunjukkan simetri lipat karena kedua sisinya adalah bayangan cermin satu sama lain.';
  }

  if (comicId === 3) {
    baseQuestions[0].question = `Di bagian mana tokoh menemukan bentuk datar yang paling mudah diamati di ${title}?`;
    baseQuestions[0].options = [
      'Pada sisi dinding dan pola lantai',
      'Pada awan di langit',
      'Pada gerakan tumbuhan',
      'Pada suara tokoh',
    ];
    baseQuestions[0].correctIndex = 0;
    baseQuestions[0].explanation = 'Sisi dinding dan pola lantai adalah tempat paling mudah menemukan bangun datar seperti persegi dan persegi panjang karena permukaannya rata dan batasnya jelas.';
    baseQuestions[1].question = `Bangun apa yang paling membantu tokoh mengidentifikasi bentuk pada rumah bersejarah di ${lokasi}?`;
    baseQuestions[1].options = [
      'Persegi dan persegi panjang',
      'Bola dan lingkaran',
      'Segitiga dan elips',
      'Garis dan titik',
    ];
    baseQuestions[1].correctIndex = 0;
    baseQuestions[1].explanation = 'Persegi dan persegi panjang adalah bangun datar yang paling umum ditemukan pada bangunan bersejarah karena digunakan pada pintu, jendela, dinding, dan lantai.';
  }

  return shuffle(baseQuestions).slice(0, 8);
}

/**
 * Buat IdentificationState awal dari data komik.
 * Soal dibuat dari isi cerita agar siswa perlu membaca ulang komik.
 */
export function createIdentificationState(
  comicId: number,
  lokasi: string,
  learningTargets: readonly string[],
  cover: string,
  title: string,
): IdentificationState {
  const questions = buildStoryQuestions(comicId, lokasi, learningTargets, title, cover);
  const items: IdentificationItem[] = questions.map((question, index) => {
    const id = `${comicId}-identification-${index}`;
    const options = buildOptions(id, question.options);
    return {
      id,
      targetIndex: index,
      targetText: question.question,
      question: question.question,
      image: question.image,
      options,
      correctOptionId: options[question.correctIndex]?.id ?? options[0].id,
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

/**
 * Tandai satu item sebagai OBSERVED.
 * Idempoten — memanggil ulang pada item yang sudah OBSERVED tidak mengubah apapun.
 */
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

  return {
    ...state,
    items: updatedItems,
    observedCount,
    isComplete: observedCount === updatedItems.length,
  };
}

/** Update catatan observasi Step Amati. */
export function setObserveNote(
  state: IdentificationState,
  note: string,
): IdentificationState {
  return { ...state, observe: { ...state.observe, note } };
}

/** Selesaikan Step Amati — tandai isDone = true. */
export function completeObserve(
  state: IdentificationState,
): IdentificationState {
  return { ...state, observe: { ...state.observe, isDone: true } };
}

/** Pilih satu opsi jawaban untuk item tertentu — tandai selesai setelah memilih jawaban. */
export function selectAnswer(
  state: IdentificationState,
  itemId: string,
  optionId: string
): IdentificationState {
  const updatedItems: IdentificationItem[] = state.items.map((item) =>
    item.id === itemId
      ? {
          ...item,
          selectedOptionId: optionId,
          answerStatus: 'SAVED',
          status: 'OBSERVED',
        }
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

/** Update teks catatan untuk item tertentu. */
export function updateNote(
  state: IdentificationState,
  itemId: string,
  note: string
): IdentificationState {
  return {
    ...state,
    items: state.items.map((item) =>
      item.id === itemId ? { ...item, note } : item
    ),
  };
}

/**
 * Simpan jawaban item — tandai sebagai SAVED.
 * Progress lanjut saat soal terjawab, bukan saat alasan diisi.
 */
export function saveAnswer(
  state: IdentificationState,
  itemId: string
): IdentificationState {
  const updatedItems: IdentificationItem[] = state.items.map((item) =>
    item.id === itemId
      ? { ...item, answerStatus: 'SAVED' }
      : item
  );

  return {
    ...state,
    items: updatedItems,
  };
}

/** Update teks alasan untuk item tertentu. */
export function updateReason(
  state: IdentificationState,
  itemId: string,
  reason: string,
): IdentificationState {
  return {
    ...state,
    items: state.items.map((item) =>
      item.id === itemId
        ? { ...item, reason, reasonStatus: reason.trim().length > 0 ? 'DRAFT' : 'EMPTY' }
        : item
    ),
  };
}

/** Simpan alasan item — opsional, tidak mengunci progres. */
export function saveReason(
  state: IdentificationState,
  itemId: string,
): IdentificationState {
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
  const isComplete = updatedItems.every((item) => item.selectedOptionId !== null);

  return {
    ...state,
    items: updatedItems,
    observedCount,
    isComplete,
  };
}

/**
 * Reset semua item ke PENDING.
 */
export function resetIdentificationState(
  state: IdentificationState
): IdentificationState {
  return {
    ...state,
    observe: { note: '', isDone: false },
    items: state.items.map((item) => ({
      ...item,
      status: 'PENDING',
      selectedOptionId: null,
      note: '',
      answerStatus: 'UNANSWERED',
      reason: '',
      reasonStatus: 'EMPTY',
    })),
    observedCount: 0,
    isComplete: false,
  };
}
