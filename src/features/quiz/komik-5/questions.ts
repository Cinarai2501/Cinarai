import type { Comic5Question } from './types';

export const COMIC_5_QUESTIONS: readonly Comic5Question[] = [
  {
    id: 'komik5-q1',
    type: 'essay',
    question: 'Di dalam komik, Nanda berdebat dengan Zitur tentang segitiga sama kaki, apa yang kamu ketahui tentang segitiga sama kaki?',
    requiresManualGrading: true,
  },
  {
    id: 'komik5-q2',
    type: 'multiple_choice',
    question: 'Ubin keraton Sumenep berbentuk bangun datar apa?',
    options: [
      { key: 'A', label: 'Persegi' },
      { key: 'B', label: 'Persegi panjang' },
      { key: 'C', label: 'Segitiga' },
      { key: 'D', label: 'Lingkaran' },
    ],
    requiresManualGrading: true,
  },
  {
    id: 'komik5-q3',
    type: 'essay',
    question: 'Pada komik, Vira melihat roda meriam berbentuk lingkaran, sebutkan benda lain yang berbentuk lingkaran yang kamu ketahui!',
    requiresManualGrading: true,
  },
  {
    id: 'komik5-q4',
    type: 'multiple_choice',
    question: 'Gerbang Keraton Sumenep memiliki motif berbentuk segitiga, berapa jumlah sisi dan sudut pada segitiga?',
    options: [
      { key: 'A', label: '2 sisi dan 2 sudut' },
      { key: 'B', label: '3 sisi dan 3 sudut' },
      { key: 'C', label: '4 sisi dan 4 sudut' },
      { key: 'D', label: '5 sisi dan 5 sudut' },
    ],
    correctAnswer: 'B',
    requiresManualGrading: false,
  },
  {
    id: 'komik5-q5',
    type: 'essay',
    question: 'Sebutkan bangun datar apa saja yang kamu ketahui di dalam komik tersebut!',
    requiresManualGrading: true,
  },
] as const;
