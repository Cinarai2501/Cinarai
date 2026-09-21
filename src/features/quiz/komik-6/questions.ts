import type { Comic6Question } from './types';

export const COMIC_6_QUESTIONS: readonly Comic6Question[] = [
  { id: 'komik6-q1', type: 'essay', question: 'Dalam tampilan bangunan Masjid Al-Akbar Surabaya terdapat bangun ruang apa saja, sebutkan!', requiresManualGrading: true },
  { id: 'komik6-q2', type: 'essay', question: 'Di bagian atas bangunan Masjid Al-Akbar Surabaya terdapat jenis bangun ruang?', requiresManualGrading: true },
  { id: 'komik6-q3', type: 'essay', question: 'Bagaimana ciri-ciri kursi Wudhu pada Masjid Al-Akbar Surabaya?', requiresManualGrading: true },
  { id: 'komik6-q4', type: 'essay', question: 'Pada bangunan masjid Al-Akbar Surabaya terdapat bangunan yang menyerupai balok. Coba sekarang kalian sebutkan ciri-ciri balok', requiresManualGrading: true },
  { id: 'komik6-q5', type: 'drawing', question: 'Gambarlah bangun ruang dengan ciri-ciri memiliki 8 titik sudut, 6 sisi berbentuk persegi panjang, dan 12 rusuk!', requiresManualGrading: true },
] as const;
