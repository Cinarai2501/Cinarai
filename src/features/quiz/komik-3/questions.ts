import type { Comic3Question } from './types';

export const COMIC_3_QUESTIONS: readonly Comic3Question[] = [
  {
    id: 'komik3-q1',
    type: 'essay',
    question: 'Sebutkan bangun datar apa saja yang kamu temukan pada Rumah Gajah Mungkur!',
  },
  {
    id: 'komik3-q2',
    type: 'essay',
    question: 'Pada dinding Rumah Gajah Mungkur terdapat hiasan berbentuk lingkaran. Sebutkan ciri-ciri bangun datar lingkaran!',
  },
  {
    id: 'komik3-q3',
    type: 'image-identification',
    question: 'Perhatikan gambar bangun datar di bawah ini. Tuliskan nama masing-masing bangun datar tersebut!',
    imagePrompts: [
      { id: 'shape-1', label: 'Bangun 1', assetPath: './assets/q3-belah-ketupat.svg' },
      { id: 'shape-2', label: 'Bangun 2', assetPath: './assets/q3-trapesium.svg' },
      { id: 'shape-3', label: 'Bangun 3', assetPath: './assets/q3-segitiga.svg' },
    ],
  },
] as const;