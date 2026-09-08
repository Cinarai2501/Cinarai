import type { ComicContentPackageLike } from '../../types';

export const packageContent: ComicContentPackageLike = {
  metadata: {
    comicId: 4,
    title: 'Petualangan di Jembatan Merah',
    subtitle: 'Panjang lintasan & Analisis data',
    location: 'Jembatan Merah Surabaya',
    classLevel: 'SD/MI',
    cover: '/comics/komik-4/cover.png',
    thumbnail: '/comics/komik-4/thumbnail.png',
    learningTargets: [
      'Mengukur panjang lintasan menggunakan langkah.',
      'Menghubungkan jumlah langkah dengan panjang setiap langkah.',
      'Menganalisis dan membandingkan data hasil pengukuran.',
      'Menyajikan data dalam grafik batang.',
    ],
    synopsis:
      'Dito dan teman-temannya berpetualang di Jembatan Merah Surabaya untuk belajar mengukur panjang lintasan menggunakan langkah. Mereka menemukan bahwa hasil pengukuran berbeda karena panjang langkah setiap orang berbeda, lalu menganalisis data dan menyajikannya dalam grafik batang.',
  },
  learningObjects: [],
  qrCode: [
    {
      id: 'komik4-qr-page-3',
      imageSrc: '',
      alt: 'QR AR Jembatan Merah Surabaya',
      label: 'AR Jembatan Merah Surabaya',
      type: 'AR',
      url: 'https://asblr.com/uL6tfC',
      page: 3,
      description: 'Aktifkan AR untuk melihat pengalaman interaktif Jembatan Merah Surabaya dan mengenal kisah di balik Jembatan Merah.',
    },
    {
      id: 'komik4-qr-page-14',
      imageSrc: '',
      alt: 'QR AR Hasil Pengukuran Jembatan',
      label: 'AR Hasil Pengukuran Jembatan',
      type: 'AR',
      url: 'https://asblr.com/mkyfiC',
      page: 14,
      description: 'Jelajahi AR setelah membandingkan hasil pengukuran panjang lintasan Jembatan Merah menggunakan data Hanan 60 langkah, Hilya 76 langkah, dan Aisyah 83 langkah.',
    },
    {
      id: 'komik4-qr-page-20',
      imageSrc: '/comics/komik-4/qr/page-20.png',
      alt: 'QR Kuis Jembatan Merah',
      label: 'Kuis Jembatan Merah',
      type: 'QUIZ',
      url: 'https://app.quizwhizzer.com/play?code=35733',
      page: 20,
      description: 'Kerjakan kuis untuk menguji pemahamanmu tentang panjang lintasan, pengukuran dengan langkah, grafik batang, dan pembacaan data dalam petualangan Jembatan Merah.',
    },
  ],
  model3D: [],
  aiPrompt: {
    navigation: 'Bantu siswa mengamati pola dan bentuk sederhana dengan bahasa yang dekat dengan pengalaman mereka.',
    objectTutor: 'Jelaskan bentuk yang terlihat pada aktivitas sehari-hari.',
    application: 'Bantu siswa menghubungkan bangun datar dengan situasi baru yang familiar.',
    argumentation: 'Beri alasan singkat tentang bentuk yang dipilih.',
    resolution: 'Bimbing siswa menyelesaikan soal sederhana.',
    introspection: 'Buat refleksi singkat yang positif.',
  },
  identification: {
    questions: [
      {
        id: 'komik4-ident-1',
        question: 'Apa saja konsep matematika yang kamu temukan dalam petualangan di Jembatan Merah?',
        imageAlt: 'Ilustrasi pengukuran panjang Jembatan Merah menggunakan langkah',
        options: [
          { text: 'Pengukuran panjang lintasan', correct: true },
          { text: 'Menghitung panjang berdasarkan jumlah langkah dan panjang langkah', correct: true },
          { text: 'Menganalisis dan membandingkan data hasil pengukuran', correct: true },
          { text: 'Menyajikan data dalam grafik batang', correct: true },
          { text: 'Bangun datar', correct: false },
          { text: 'Simetri', correct: false },
        ],
        explanation: 'Benar! Dalam petualangan di Jembatan Merah, kamu belajar mengukur panjang lintasan menggunakan jumlah langkah dan panjang satu langkah, menghitung panjang lintasan, menganalisis data hasil pengukuran, serta menyajikannya dalam grafik batang.',
      },
    ],
    feedback: {
      complete: 'Benar! Dalam petualangan di Jembatan Merah, kamu belajar mengukur panjang lintasan menggunakan jumlah langkah dan panjang satu langkah, menghitung panjang lintasan, menganalisis data hasil pengukuran, serta menyajikannya dalam grafik batang.',
      partial: 'Belum tepat. Ingat kembali petualangan di Jembatan Merah. Mereka menggunakan langkah untuk mengukur panjang lintasan, menghitung panjang berdasarkan panjang langkah, membandingkan hasil pengukuran, dan menyajikan data dalam grafik.',
      incomplete: 'Belum tepat. Ingat kembali petualangan di Jembatan Merah. Mereka menggunakan langkah untuk mengukur panjang lintasan, menghitung panjang berdasarkan panjang langkah, membandingkan hasil pengukuran, dan menyajikan data dalam grafik.',
    },
  },
  application: {
    title: 'Terapkan Ilmu di Konteks Baru',
    intro: 'Amati benda yang sering kamu lihat di sekitar pasar.',
    prompt: 'Pilih bangun datar yang paling cocok dengan benda yang kamu amati.',
    context: 'Benda dan kerajinan di pasar tradisional.',
    images: [{ src: '/images/navigation/default.svg', alt: 'Bentuk persegi', label: 'Persegi', description: 'Perhatikan sisi dan sudutnya.' }],
    options: [{ value: 'Persegi', label: 'Persegi' }, { value: 'Segitiga', label: 'Segitiga' }],
  },
  argumentation: {
    questions: [{ id: 'komik4-arg-1', templePart: 'susunan keramik', question: 'Mengapa susunan keramik ini cocok disebut persegi?', photoSrc: '/images/navigation/default.svg', photoAlt: 'Susunan keramik', shapeName: 'Persegi', shapeKey: 'persegi', shapeSrc: '/images/navigation/default.svg', highlightColor: 'border-primary-500' }],
  },
  resolution: {
    missions: [{ id: 1, title: 'Misi 1 · Luas Persegi', part: 'Susunan Keramik', shape: 'Persegi', prompt: 'Sebuah persegi memiliki panjang sisi 5 cm. Berapakah luasnya?', options: [{ key: 'A', label: '20 cm²' }, { key: 'B', label: '25 cm²' }, { key: 'C', label: '30 cm²' }], correctKey: 'B', answer: '25 cm²', formula: 'L = s × s = 5 × 5 = 25 cm²', explanation: 'Luas persegi dihitung dari sisi dikali sisi.', aiHint: 'Ingat rumus luas persegi.', context: 'Bentuk pada susunan keramik.', accent: 'from-primary-600 to-primary-700', illustration: '/images/navigation/default.svg' }],
  },
  introspection: {
    checklist: ['Saya mengenali bentuk persegi di lingkungan sekitar.', 'Saya lebih percaya diri mengamati pola sederhana.'],
    completionMessage: 'Kamu telah menyelesaikan pembelajaran pada komik ini.',
    nextPrompt: 'Kamu bisa mengulang lagi bila ingin lebih percaya diri.',
  },
  report: { summary: 'Laporan sederhana untuk pembelajaran bentuk di pasar.', learnedShapes: ['Persegi'] },
};
