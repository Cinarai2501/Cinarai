import type { ComicContentPackageLike } from '../../types';

export const packageContent: ComicContentPackageLike = {
  metadata: {
    comicId: 4,
    title: 'Petualangan Pola di Pasar Tradisional',
    subtitle: 'Etnomatematika Bangun Datar',
    location: 'Pasar Tradisional',
    classLevel: 'III',
    cover: '/comics/komik-4/cover.png',
    thumbnail: '/comics/komik-4/thumbnail.png',
    learningTargets: ['Mengamati pola dan bentuk di sekitar pasar tradisional.', 'Membandingkan bangun datar sederhana dalam kehidupan sehari-hari.', 'Menghubungkan bangun datar dengan pengamatan visual.'],
    synopsis: 'Pembelajaran untuk bangun datar pada aktivitas pasar tradisional.',
  },
  learningObjects: [
    {
      id: 'komik4-persegi',
      title: 'Persegi',
      description: 'Bentuk persegi yang terlihat pada susunan keramik.',
      page: 1,
      qrImage: '/assets/qr/komik-2/13-objek-1.jpeg',
      objectImage: '/assets/qr/komik-2/13-objek-1.jpeg',
      modelUrl: '',
      embedUrl: '',
      viewerType: 'embed',
      provider: '',
      aiPrompt: 'Jelaskan mengapa susunan keramik tersebut memuat bentuk persegi.',
      question: 'Apa ciri utama persegi pada susunan ini?',
      answer: 'Persegi memiliki sisi yang sama panjang dan sudut siku-siku.',
      feedback: 'Benar, persegi mudah dikenali dari sisi yang sama dan sudut yang lurus.',
    },
  ],
  qrCode: [{ id: 'komik4-qr-1', imageSrc: '/assets/qr/komik-2/13-objek-1.jpeg', alt: 'QR Persegi', label: 'Persegi', description: 'Scan untuk melihat bentuk persegi.' }],
  model3D: [{ id: 'komik4-model-1', title: 'Persegi', arUrl: '', page: 1, description: 'Model 3D persegi sederhana.' }],
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
        question: 'Bangun datar mana yang paling terlihat pada susunan keramik?',
        image: '/assets/qr/komik-2/13-objek-1.jpeg',
        imageAlt: 'Susunan keramik pasar',
        options: [
          { text: 'Persegi', correct: true },
          { text: 'Segitiga', correct: false },
          { text: 'Lingkaran', correct: false },
        ],
        explanation: 'Susunan keramik pada gambar menampilkan bentuk persegi.',
      },
    ],
    feedback: {
      complete: 'Bagus! Kamu mengenali bentuk di pasar tradisional.',
      partial: 'Coba perhatikan lagi susunan objek di sekitarmu.',
      incomplete: 'Perhatikan bentuk yang lebih jelas lagi.',
    },
  },
  application: {
    title: 'Terapkan Ilmu di Konteks Baru',
    intro: 'Amati benda yang sering kamu lihat di sekitar pasar.',
    prompt: 'Pilih bangun datar yang paling cocok dengan benda yang kamu amati.',
    context: 'Benda dan kerajinan di pasar tradisional.',
    images: [{ src: '/assets/qr/komik-2/13-objek-1.jpeg', alt: 'Bentuk persegi', label: 'Persegi', description: 'Perhatikan sisi dan sudutnya.' }],
    options: [{ value: 'Persegi', label: 'Persegi' }, { value: 'Segitiga', label: 'Segitiga' }],
  },
  argumentation: {
    questions: [{ id: 'komik4-arg-1', templePart: 'susunan keramik', question: 'Mengapa susunan keramik ini cocok disebut persegi?', photoSrc: '/assets/qr/komik-2/13-objek-1.jpeg', photoAlt: 'Susunan keramik', shapeName: 'Persegi', shapeKey: 'persegi', shapeSrc: '/images/navigation/default.svg', highlightColor: 'border-primary-500' }],
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
