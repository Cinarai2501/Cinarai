// Note: avoid importing runtime or type dependency on contentPackages from Stage layer.

export interface ArgumentationLearningObject {
  id: string;
  objectName: string;
  image: string;
  overlaySrc?: string;
  solid: string;
  question: string;
  explanation: string;
  aiFeedback: string;
}

export interface ArgumentationQuestion {
  id: string;
  title?: string;
  templePart: string;
  question: string;
  photoSrc: string;
  image?: string;
  photoAlt: string;
  overlaySrc?: string;
  shape?: string;
  shapeName: string;
  shapeKey: string;
  shapeSrc: string;
  icon?: string;
  aiContext?: string;
  feedback?: string;
  highlightColor: string;
}

const ARGUMENTATION_OBJECTS: ArgumentationLearningObject[] = [
  {
    id: 'atap',
    objectName: 'Bagian Atap',
    image: '/images/identification/komik1-soal4.jpg',
    overlaySrc: '/images/identification/komik1-soal4-atap-candi.svg',
    solid: 'Kerucut',
    question: 'Mengapa bagian atap Candi Jawi dapat dimodelkan sebagai kerucut?',
    explanation: 'Bagian atap Candi Jawi memiliki bentuk yang meruncing ke satu titik sehingga mudah dimodelkan sebagai kerucut.',
    aiFeedback: 'Bagus! Alasanmu sudah tepat karena atap Candi Jawi memiliki bentuk yang meruncing dan memusat ke puncak seperti kerucut.',
  },
  {
    id: 'tubuh',
    objectName: 'Bagian Tubuh',
    image: '/images/identification/komik1-soal1.jpg',
    overlaySrc: '/images/identification/komik1-soal1-tubuh-candi.svg',
    solid: 'Kubus',
    question: 'Mengapa bagian tubuh Candi Jawi dapat dimodelkan sebagai kubus?',
    explanation: 'Bagian tubuh Candi Jawi tampak kuat, kotak, dan berdimensi sehingga cocok dipahami sebagai kubus.',
    aiFeedback: 'Bagus! Kamu melihat bahwa bagian tubuh candi memiliki sisi-sisi yang tegas dan bentuk kotak sehingga cocok disebut kubus.',
  },
  {
    id: 'pintu',
    objectName: 'Bagian Pintu',
    image: '/images/identification/komik1-soal2.jpg',
    overlaySrc: '/images/identification/komik1-soal2-kaki-candi.svg',
    solid: 'Balok',
    question: 'Mengapa bagian pintu Candi Jawi dapat dimodelkan sebagai balok?',
    explanation: 'Bagian pintu candi memiliki bentuk panjang, lebar, dan tinggi yang jelas sehingga lebih tepat dipandang sebagai balok.',
    aiFeedback: 'Bagus! Bagian pintu ini tampak panjang dan kokoh, sehingga alasanmu bahwa bentuknya menyerupai balok sangat masuk akal.',
  },
  {
    id: 'tangga',
    objectName: 'Bagian Tangga',
    image: '/images/identification/komik1-soal5.jpg',
    overlaySrc: '/images/identification/komik1-soal5-dinding-candi.svg',
    solid: 'Prisma Segi Empat',
    question: 'Mengapa bagian tangga Candi Jawi dapat dimodelkan sebagai prisma segi empat?',
    explanation: 'Bagian tangga Candi Jawi memiliki sisi yang memanjang dan bidang yang sejajar sehingga cocok disebut prisma segi empat.',
    aiFeedback: 'Bagus! Tangga memiliki sisi yang memanjang dan bagian alas yang sejajar sehingga bentuknya cocok disebut prisma.',
  },
  {
    id: 'alas',
    objectName: 'Bagian Alas',
    image: '/images/identification/komik1-soal2.jpg',
    overlaySrc: '/images/identification/komik1-soal2-kaki-candi.svg',
    solid: 'Balok',
    question: 'Mengapa bagian alas Candi Jawi dapat dimodelkan sebagai balok?',
    explanation: 'Bagian alas candi terlihat kokoh dan berbentuk kotak memanjang yang paling cocok dimodelkan sebagai balok.',
    aiFeedback: 'Bagus! Alas candi memiliki bentuk yang kuat dan memanjang, sehingga model balok sangat tepat.',
  },
  {
    id: 'stupa',
    objectName: 'Bagian Stupa',
    image: '/images/identification/komik1-soal3.jpg',
    solid: 'Kerucut',
    question: 'Mengapa bagian stupa Candi Jawi dapat dimodelkan sebagai kerucut?',
    explanation: 'Bagian stupa tampak meruncing ke atas sehingga sangat cocok dimodelkan sebagai kerucut.',
    aiFeedback: 'Bagus! Stupa yang runcing ke atas sangat sesuai dengan bentuk kerucut.',
  },
];

const SOLID_TO_OBJECT_ID: Record<string, string> = {
  Kerucut: 'atap',
  Kubus: 'tubuh',
  Balok: 'pintu',
  'Prisma Segi Empat': 'tangga',
  Prisma: 'tangga',
};

function normalizeShape(shape: string) {
  return shape?.trim().toLowerCase();
}

function matchesShape(object: ArgumentationLearningObject, shape: string) {
  const normalizedObject = normalizeShape(object.solid);
  const normalizedShape = normalizeShape(shape);

  if (!normalizedObject || !normalizedShape) return false;
  if (normalizedObject === normalizedShape) return true;
  if (normalizedObject.includes(normalizedShape)) return true;
  if (normalizedShape.includes('prisma') && normalizedObject.includes('prisma')) return true;
  if (normalizedShape.includes('limas') && normalizedObject.includes('limas')) return true;
  return false;
}

function buildObjectName(templePart: string) {
  const label = templePart?.trim() ?? '';
  return label.toLowerCase().startsWith('bagian') ? label : `Bagian ${label}`;
}

function buildAiFeedback(objectName: string, solid: string) {
  const normalizedSolid = normalizeShape(solid);
  if (normalizedSolid?.includes('kerucut')) {
    return `Bagus! ${objectName} Candi Jawi memiliki bentuk yang meruncing dan memusat ke puncak seperti kerucut.`;
  }
  if (normalizedSolid?.includes('kubus')) {
    return `Bagus! ${objectName} Candi Jawi memiliki sisi-sisi yang tegas dan bentuk kotak sehingga cocok disebut kubus.`;
  }
  if (normalizedSolid?.includes('balok')) {
    return `Bagus! ${objectName} Candi Jawi terlihat panjang dan kokoh sehingga cocok dimodelkan sebagai balok.`;
  }
  if (normalizedSolid?.includes('prisma')) {
    return `Bagus! ${objectName} memiliki sisi yang memanjang dan bagian alas yang sejajar seperti prisma.`;
  }
  return `Bagus! ${objectName} Candi Jawi dapat dimodelkan sebagai ${solid}.`;
}

function mapPackageQuestionsToLearningObjects(questions: ArgumentationQuestion[]): ArgumentationLearningObject[] {
  return questions.map((question) => ({
    id: question.id,
    objectName: question.title ?? buildObjectName(question.templePart),
    image: question.image ?? question.photoSrc,
    overlaySrc: question.overlaySrc,
    solid: question.shapeName,
    question: question.question,
    explanation: question.feedback ?? question.question,
    aiFeedback: question.feedback ?? buildAiFeedback(question.title ?? buildObjectName(question.templePart), question.shapeName),
  }));
}

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

export function getArgumentationLearningObject(
  selectedShapes: string[] = [],
  argumentationPackage?: { questions?: ArgumentationQuestion[] } | null,
): ArgumentationLearningObject | null {
  const normalized = selectedShapes
    .map((shape) => shape?.trim())
    .filter(Boolean);

  const packageObjects = argumentationPackage?.questions ? mapPackageQuestionsToLearningObjects(argumentationPackage.questions) : ARGUMENTATION_OBJECTS;

  if (normalized.length === 0) {
    return packageObjects[0] ?? null;
  }

  const match = packageObjects.find((entry) => normalized.some((shape) => matchesShape(entry, shape)));
  if (match) return match;

  const fallbackId = normalized.find((shape) => SOLID_TO_OBJECT_ID[shape])
    ? SOLID_TO_OBJECT_ID[normalized.find((shape) => SOLID_TO_OBJECT_ID[shape]) as string]
    : normalized.find((shape) => shape.toLowerCase().includes('prisma'))
      ? 'tangga'
      : normalized.find((shape) => shape.toLowerCase().includes('kerucut'))
        ? 'atap'
        : normalized.find((shape) => shape.toLowerCase().includes('kubus'))
          ? 'tubuh'
          : normalized.find((shape) => shape.toLowerCase().includes('balok'))
            ? 'pintu'
            : 'atap';

  return packageObjects.find((entry) => entry.id === fallbackId) ?? packageObjects[0] ?? null;
}

export function getArgumentationLearningObjects(argumentationPackage?: { questions?: ArgumentationQuestion[] } | null): ArgumentationLearningObject[] {
  return argumentationPackage?.questions ? mapPackageQuestionsToLearningObjects(argumentationPackage.questions) : ARGUMENTATION_OBJECTS;
}

export function getArgumentationQuestions(
  argumentationPackage: { questions?: Array<Partial<ArgumentationQuestion>> } | null | undefined,
  lokasi: string,
  cover: string,
): ArgumentationQuestion[] {
  const packageQuestions = argumentationPackage?.questions ?? [];

  if (packageQuestions.length > 0) {
    return packageQuestions.map((question) => ({
      id: question.id ?? 'unknown-argumentation',
      templePart: question.templePart ?? 'Bagian Candi',
      question: question.question ?? `Mengapa bagian candi ini dapat dimodelkan sebagai bangun ruang?`,
      photoSrc: question.photoSrc ?? cover,
      photoAlt: question.photoAlt ?? `Bagian candi di ${lokasi}`,
      overlaySrc: question.overlaySrc,
      shapeName: question.shapeName ?? 'Bangun Ruang',
      shapeKey: question.shapeKey ?? 'default',
      shapeSrc: question.shapeSrc ?? '/images/navigation/default.svg',
      highlightColor: question.highlightColor ?? 'border-neutral-200',
    } as ArgumentationQuestion));
  }

  return buildFallbackQuestions(lokasi, cover);
}
