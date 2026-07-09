export interface ArgumentationQuestion {
  id: string;
  /** Bagian candi yang dimaksud, e.g. "atap", "tubuh", "kaki" */
  templePart: string;
  question: string;
  photoSrc: string;
  photoAlt: string;
  overlaySrc?: string;
  shapeName: string;
  /** 'balok' | 'kubus' | 'kerucut' | 'tabung' | 'limas' | 'prisma' */
  shapeKey: string;
  shapeSrc: string;
  highlightColor: string;
}

const ARGUMENTATION_QUESTIONS: Record<number, ArgumentationQuestion[]> = {
  1: [
    {
      id: 'komik1-arg-1',
      templePart: 'tubuh utama',
      question: 'Mengapa tubuh utama Candi Jawi dapat dimodelkan sebagai balok?',
      photoSrc: '/images/identification/komik1-soal1.jpg',
      photoAlt: 'Tubuh utama Candi Jawi tampak depan',
      overlaySrc: '/images/identification/komik1-soal1-tubuh-candi.svg',
      shapeName: 'Balok',
      shapeKey: 'balok',
      shapeSrc: '/images/navigation/balok.svg',
      highlightColor: 'border-primary-500',
    },
    {
      id: 'komik1-arg-2',
      templePart: 'kaki candi',
      question: 'Mengapa batu penyusun kaki Candi Jawi dapat dimodelkan sebagai kubus?',
      photoSrc: '/images/identification/komik1-soal2.jpg',
      photoAlt: 'Susunan batu kaki Candi Jawi',
      overlaySrc: '/images/identification/komik1-soal2-kaki-candi.svg',
      shapeName: 'Kubus',
      shapeKey: 'kubus',
      shapeSrc: '/images/navigation/kubus.svg',
      highlightColor: 'border-secondary-500',
    },
    {
      id: 'komik1-arg-3',
      templePart: 'puncak candi',
      question: 'Mengapa puncak Candi Jawi yang meruncing dapat dimodelkan sebagai kerucut?',
      photoSrc: '/images/identification/komik1-soal3.jpg',
      photoAlt: 'Puncak Candi Jawi yang meruncing',
      overlaySrc: '/images/identification/komik1-soal3-puncak-candi.svg',
      shapeName: 'Kerucut',
      shapeKey: 'kerucut',
      shapeSrc: '/images/navigation/kerucut.svg',
      highlightColor: 'border-accent-500',
    },
    {
      id: 'komik1-arg-4',
      templePart: 'atap bertingkat',
      question: 'Mengapa setiap tingkatan atap Candi Jawi dapat dimodelkan sebagai limas segi empat?',
      photoSrc: '/images/identification/komik1-soal4.jpg',
      photoAlt: 'Atap bertingkat Candi Jawi tampak samping',
      overlaySrc: '/images/identification/komik1-soal4-atap-candi.svg',
      shapeName: 'Limas Segi Empat',
      shapeKey: 'limas',
      shapeSrc: '/images/navigation/default.svg',
      highlightColor: 'border-warning-500',
    },
    {
      id: 'komik1-arg-5',
      templePart: 'dinding sisi',
      question: 'Mengapa dinding sisi Candi Jawi dapat dimodelkan sebagai prisma segi empat?',
      photoSrc: '/images/identification/komik1-soal5.jpg',
      photoAlt: 'Dinding sisi Candi Jawi dengan relief ukiran',
      overlaySrc: '/images/identification/komik1-soal5-dinding-candi.svg',
      shapeName: 'Prisma Segi Empat',
      shapeKey: 'prisma',
      shapeSrc: '/images/navigation/default.svg',
      highlightColor: 'border-info-500',
    },
  ],
};

function buildFallbackQuestions(lokasi: string, cover: string): ArgumentationQuestion[] {
  return [
    {
      id: 'fallback-arg-1',
      templePart: 'bagian utama',
      question: `Mengapa bagian utama ${lokasi} dapat dimodelkan sebagai balok?`,
      photoSrc: cover,
      photoAlt: `Foto ${lokasi}`,
      shapeName: 'Balok',
      shapeKey: 'balok',
      shapeSrc: '/images/navigation/balok.svg',
      highlightColor: 'border-primary-500',
    },
    {
      id: 'fallback-arg-2',
      templePart: 'bagian puncak',
      question: `Mengapa bagian puncak ${lokasi} dapat dimodelkan sebagai kerucut?`,
      photoSrc: cover,
      photoAlt: `Foto ${lokasi}`,
      shapeName: 'Kerucut',
      shapeKey: 'kerucut',
      shapeSrc: '/images/navigation/kerucut.svg',
      highlightColor: 'border-accent-500',
    },
  ];
}

export function getArgumentationQuestions(
  comicId: number,
  lokasi: string,
  cover: string,
): ArgumentationQuestion[] {
  return ARGUMENTATION_QUESTIONS[comicId] ?? buildFallbackQuestions(lokasi, cover);
}
