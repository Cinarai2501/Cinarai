export type QuizStatus = 'available' | 'not_configured' | 'pending_audit';
export type QuizType = 'internal' | 'external';

export type QuizConfig = {
  id: `komik-${1 | 2 | 3 | 4 | 5 | 6}`;
  comicId: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  description: string;
  status: QuizStatus;
  type: QuizType;
  platform: 'wayground' | 'quizwhizzer' | null;
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
    description: 'Petualangan di Jembatan Merah',
    status: 'available',
    type: 'external',
    platform: 'quizwhizzer',
    quizUrl: 'https://app.quizwhizzer.com/play?code=35733',
    quizCode: '35733',
    questionCount: 0,
  },
  {
    id: 'komik-5',
    comicId: 5,
    title: 'Kuis Komik 5',
    description: 'Bangun Datar di Keraton Sumenep',
    status: 'available',
    type: 'internal',
    platform: null,
    quizUrl: null,
    quizCode: null,
    questionCount: 5,
  },
  {
    id: 'komik-6',
    comicId: 6,
    title: 'Kuis Komik 6',
    description: 'Bangun Ruang di Masjid Al-Akbar Surabaya',
    status: 'available',
    type: 'internal',
    platform: null,
    quizUrl: null,
    quizCode: null,
    questionCount: 5,
  },
] as const;
