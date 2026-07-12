import { getLearningContentPackage } from '../../../content/contentPackages';

export interface ArgumentationLearningObject {
  id: string;
  objectName: string;
  image: string;
  solid: string;
  explanation: string;
  aiFeedback: string;
}

export interface ArgumentationQuestion {
  id: string;
  templePart: string;
  question: string;
  photoSrc: string;
  photoAlt: string;
  overlaySrc?: string;
  shapeName: string;
  shapeKey: string;
  shapeSrc: string;
  highlightColor: string;
}

const ARGUMENTATION_OBJECTS: ArgumentationLearningObject[] = [
  {
    id: 'atap',
    objectName: 'Bagian Atap',
    image: '/images/identification/komik1-soal4.jpg',
    solid: 'Kerucut',
    explanation: 'Bagian atap Candi Jawi memiliki bentuk yang meruncing ke satu titik sehingga mudah dimodelkan sebagai kerucut.',
    aiFeedback: 'Bagus! Alasanmu sudah tepat karena atap Candi Jawi memiliki bentuk yang meruncing dan memusat ke puncak seperti kerucut.',
  },
  {
    id: 'tubuh',
    objectName: 'Bagian Tubuh',
    image: '/images/identification/komik1-soal1.jpg',
    solid: 'Kubus',
    explanation: 'Bagian tubuh Candi Jawi tampak kuat, kotak, dan berdimensi sehingga cocok dipahami sebagai kubus.',
    aiFeedback: 'Bagus! Kamu melihat bahwa bagian tubuh candi memiliki sisi-sisi yang tegas dan bentuk kotak sehingga cocok disebut kubus.',
  },
  {
    id: 'pintu',
    objectName: 'Bagian Pintu',
    image: '/images/identification/komik1-soal2.jpg',
    solid: 'Balok',
    explanation: 'Bagian pintu candi memiliki bentuk panjang, lebar, dan tinggi yang jelas sehingga lebih tepat dipandang sebagai balok.',
    aiFeedback: 'Bagus! Bagian pintu ini tampak panjang dan kokoh, sehingga alasanmu bahwa bentuknya menyerupai balok sangat masuk akal.',
  },
  {
    id: 'tangga',
    objectName: 'Bagian Tangga',
    image: '/images/identification/komik1-soal5.jpg',
    solid: 'Prisma Segitiga',
    explanation: 'Bagian tangga Candi Jawi memiliki bentuk persegi panjang dengan sisi yang membentuk prisma, sehingga cocok disebut prisma segitiga.',
    aiFeedback: 'Bagus! Tangga memiliki sisi yang memanjang dan ujungnya tampak seperti bentuk prisma, jadi alasanmu sangat sesuai.',
  },
  {
    id: 'alas',
    objectName: 'Bagian Alas',
    image: '/images/identification/komik1-soal2.jpg',
    solid: 'Balok',
    explanation: 'Bagian alas candi terlihat kokoh dan berbentuk kotak memanjang yang paling cocok dimodelkan sebagai balok.',
    aiFeedback: 'Bagus! Alas candi memiliki bentuk yang kuat dan memanjang, sehingga model balok sangat tepat.',
  },
  {
    id: 'stupa',
    objectName: 'Bagian Stupa',
    image: '/images/identification/komik1-soal3.jpg',
    solid: 'Kerucut',
    explanation: 'Bagian stupa tampak meruncing ke atas sehingga sangat cocok dimodelkan sebagai kerucut.',
    aiFeedback: 'Bagus! Stupa yang runcing ke atas sangat sesuai dengan bentuk kerucut.',
  },
];

const SOLID_TO_OBJECT_ID: Record<string, string> = {
  Kerucut: 'atap',
  Kubus: 'tubuh',
  Balok: 'pintu',
  'Prisma Segitiga': 'tangga',
  Prisma: 'tangga',
};

function buildFallbackQuestions(lokasi: string, cover: string): ArgumentationQuestion[] {
  return [
    {
      id: 'atap',
      templePart: 'Bagian Atap',
      question: `Mengapa bagian atap di ${lokasi} dapat dimodelkan sebagai bangun ruang?`,
      photoSrc: cover,
      photoAlt: `Bagian atap di ${lokasi}`,
      shapeName: 'Kerucut',
      shapeKey: 'kerucut',
      shapeSrc: '/images/identification/komik1-soal4.jpg',
      highlightColor: '#ef4444',
    },
    {
      id: 'tubuh',
      templePart: 'Bagian Tubuh',
      question: `Mengapa bagian tubuh di ${lokasi} dapat dimodelkan sebagai bangun ruang?`,
      photoSrc: cover,
      photoAlt: `Bagian tubuh di ${lokasi}`,
      shapeName: 'Kubus',
      shapeKey: 'kubus',
      shapeSrc: '/images/identification/komik1-soal1.jpg',
      highlightColor: '#3b82f6',
    },
  ];
}

export function getArgumentationLearningObject(selectedShapes: string[] = []): ArgumentationLearningObject | null {
  const normalized = selectedShapes
    .map((shape) => shape?.trim())
    .filter(Boolean);

  if (normalized.length === 0) {
    return ARGUMENTATION_OBJECTS[0] ?? null;
  }

  const match = normalized.find((shape) => {
    const directMatch = SOLID_TO_OBJECT_ID[shape];
    if (directMatch) return true;
    return shape.toLowerCase().includes('prisma') || shape.toLowerCase().includes('kerucut') || shape.toLowerCase().includes('kubus') || shape.toLowerCase().includes('balok');
  });

  const objectId = match
    ? (
        SOLID_TO_OBJECT_ID[match] ??
        (match.toLowerCase().includes('prisma') ? 'tangga' : match.toLowerCase().includes('kerucut') ? 'atap' : match.toLowerCase().includes('kubus') ? 'tubuh' : match.toLowerCase().includes('balok') ? 'pintu' : 'atap')
      )
    : 'atap';

  return ARGUMENTATION_OBJECTS.find((entry) => entry.id === objectId) ?? ARGUMENTATION_OBJECTS[0] ?? null;
}

export function getArgumentationLearningObjects(): ArgumentationLearningObject[] {
  return ARGUMENTATION_OBJECTS;
}

export function getArgumentationQuestions(
  comicId: number,
  lokasi: string,
  cover: string,
): ArgumentationQuestion[] {
  const packageContent = getLearningContentPackage(comicId);
  const packageQuestions = packageContent.argumentation.questions;

  if (packageQuestions.length > 0) {
    return packageQuestions.map((question) => ({
      id: question.id,
      templePart: question.templePart,
      question: question.question,
      photoSrc: question.photoSrc,
      photoAlt: question.photoAlt,
      overlaySrc: question.overlaySrc,
      shapeName: question.shapeName,
      shapeKey: question.shapeKey,
      shapeSrc: question.shapeSrc,
      highlightColor: question.highlightColor,
    }));
  }

  return buildFallbackQuestions(lokasi, cover);
}
