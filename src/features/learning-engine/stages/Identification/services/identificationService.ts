import {
  buildObservationOverlaySvg,
  resolveComicObservationImage,
} from '@/lib/comic-image';
import type {
  AnswerOption,
  IdentificationItem,
  IdentificationState,
} from '../types';
import type { ComicModuleLike } from '@/features/comics/types';
import { getShapeKnowledgeEntry } from './shapeKnowledge';

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

type IdentificationData = ComicModuleLike['identification'];

interface IdentificationStateContext {
  comicId: number;
  lokasi: string;
  cover: string;
  title: string;
  comicSlug?: string;
  sourcePage?: number;
  pdfPath?: string | null;
}

function buildQuestionsForIdentification(identificationData: IdentificationData): RawQuestion[] {
  return identificationData.questions.map((question) => ({
    question: question.question,
    imageAlt: question.imageAlt,
    image: question.image,
    overlayType: question.overlayType,
    crop: question.crop,
    highlight: question.highlight,
    options: question.options.map((option) => ({ text: option.text, correct: option.correct })),
    explanation: question.explanation,
  }));
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
  identificationData: IdentificationData,
  context: IdentificationStateContext,
): IdentificationState {
  const questions = buildQuestionsForIdentification(identificationData);
  const observationImage = resolveComicObservationImage({
    slug: context.comicSlug || `komik-${context.comicId}`,
    pdfPath: context.pdfPath ?? null,
    page: context.sourcePage ?? 1,
  });

  const items: IdentificationItem[] = questions.map((question, index) => {
    const id = `${context.comicId}-identification-${index}`;
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
    comicId: context.comicId,
    lokasi: context.lokasi,
    cover: context.cover,
    title: context.title,
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

function getTutorEntry(shape: string): IdentificationTutorEntry {
  const trimmed = shape.trim();
  const entry = getShapeKnowledgeEntry(trimmed);

  if (entry) {
    return {
      id: entry.id,
      name: entry.title,
      icon: entry.id === 'kubus' ? '🧊' : entry.id === 'balok' ? '📦' : entry.id === 'limas' ? '🔺' : entry.id === 'prisma' ? '🔷' : entry.id === 'kerucut' ? '🍦' : '🧩',
      definition: entry.definition,
      characteristics: entry.characteristics,
      faces: entry.faces,
      edges: entry.edges,
      vertices: entry.vertices,
      surfaceFormula: entry.surfaceFormula,
      volumeFormula: entry.volumeFormula,
      foundInTemple: entry.foundInTemple,
      templeLocation: entry.templeLocation,
      comicReference: entry.comicReference,
      explanation: entry.explanation,
      reflectionQuestion: entry.reflectionQuestion,
    };
  }

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
