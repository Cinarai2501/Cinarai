export type QuizStatus = 'available' | 'not_configured' | 'pending_audit';
export type QuizType = 'internal' | 'external';

export type QuizConfig = {
  id: `komik-${1 | 2 | 3 | 4 | 5}`;
  comicId: 1 | 2 | 3 | 4 | 5;
  title: string;
  description: string;
  status: QuizStatus;
  type: QuizType;
  platform: 'wayground' | null;
  quizUrl: string | null;
  quizCode: string | null;
  questionCount: number;
};

export const QUIZ_CONFIGS: readonly QuizConfig[] = [
  {
    id: 'komik-1',
    comicId: 1,
    title: 'Kuis Bangun Ruang',
    description: 'Kuis interaktif tentang bangun ruang.',
    status: 'available',
    type: 'external',
    platform: 'wayground',
    quizUrl: 'https://wayground.com/join?gc=66544262&source=liveDashboard',
    quizCode: '66544262',
    questionCount: 0,
  },
  {
    id: 'komik-2',
    comicId: 2,
    title: 'Kuis Simetri',
    description: 'Kuis interaktif tentang simetri.',
    status: 'available',
    type: 'external',
    platform: 'wayground',
    quizUrl: 'https://wayground.com/join?gc=15745097',
    quizCode: '15745097',
    questionCount: 0,
  },
  {
    id: 'komik-3',
    comicId: 3,
    title: 'Kuis Komik 3',
    description: 'Bangun Datar',
    status: 'available',
    type: 'internal',
    platform: null,
    quizUrl: null,
    quizCode: null,
    questionCount: 3,
  },
  {
    id: 'komik-4',
    comicId: 4,
    title: 'Kuis Komik 4',
    description: 'Kuis menunggu audit.',
    status: 'pending_audit',
    type: 'internal',
    platform: null,
    quizUrl: null,
    quizCode: null,
    questionCount: 0,
  },
  {
    id: 'komik-5',
    comicId: 5,
    title: 'Kuis Komik 5',
    description: 'Kuis menunggu audit.',
    status: 'pending_audit',
    type: 'internal',
    platform: null,
    quizUrl: null,
    quizCode: null,
    questionCount: 0,
  },
] as const;
