import type { ComicContentPackageLike } from '../../types';

export const packageContent: ComicContentPackageLike = {
  metadata: {
    comicId: 5,
    title: 'Petualangan di Tepi Sungai',
    subtitle: 'Etnomatematika Bentuk dan Pola',
    location: 'Tepi Sungai',
    classLevel: 'IV',
    cover: '/comics/komik-5/cover.png',
    thumbnail: '/comics/komik-5/thumbnail.png',
    learningTargets: ['Mengamati bentuk dan pola yang muncul di alam.', 'Mengenali bangun datar dalam lingkungan sekitar.', 'Menghubungkan bentuk dengan pemahaman awal matematika.'],
    synopsis: 'Pembelajaran untuk bangun datar yang ditemukan di tepi sungai.',
  },
  learningObjects: [
    {
      id: 'komik5-lingkaran',
      title: 'Lingkaran',
      description: 'Bentuk lingkaran yang terlihat pada riak air.',
      page: 1,
      qrImage: '/assets/qr/komik-2/13-objek-1.jpeg',
      objectImage: '/assets/qr/komik-2/13-objek-1.jpeg',
      modelUrl: '',
      embedUrl: '',
      viewerType: 'embed',
      provider: '',
      aiPrompt: 'Jelaskan mengapa riak air tersebut menyerupai lingkaran.',
      question: 'Apa ciri utama lingkaran?',
      answer: 'Lingkaran memiliki bentuk lengkung yang simetris.',
      feedback: 'Benar, lingkaran mudah dikenali dari bentuknya yang bundar.',
    },
  ],
  qrCode: [{ id: 'komik5-qr-1', imageSrc: '/assets/qr/komik-2/13-objek-1.jpeg', alt: 'QR Lingkaran', label: 'Lingkaran', description: 'Scan untuk melihat bentuk lingkaran.' }],
  model3D: [{ id: 'komik5-model-1', title: 'Lingkaran', arUrl: '', page: 1, description: 'Model 3D lingkaran sederhana.' }],
  aiPrompt: {
    navigation: 'Bantu siswa mengamati bentuk yang muncul di alam dengan bahasa sederhana.',
    objectTutor: 'Jelaskan bentuk yang terlihat pada alam sekitar.',
    application: 'Bantu siswa menghubungkan bentuk dengan situasi baru.',
    argumentation: 'Beri alasan singkat tentang bentuk yang dipilih.',
    resolution: 'Bimbing siswa menyelesaikan soal sederhana.',
    introspection: 'Buat refleksi singkat yang positif.',
  },
  identification: {
    questions: [
      {
        id: 'komik5-ident-1',
        question: 'Bangun datar mana yang paling terlihat pada riak air?',
        image: '/assets/qr/komik-2/13-objek-1.jpeg',
        imageAlt: 'Riak air di sungai',
        options: [
          { text: 'Lingkaran', correct: true },
          { text: 'Persegi', correct: false },
          { text: 'Segitiga', correct: false },
        ],
        explanation: 'Riak air yang melingkar menunjukkan bentuk lingkaran.',
      },
    ],
    feedback: {
      complete: 'Bagus! Kamu mengenali bentuk di sekitar sungai.',
      partial: 'Perhatikan lagi bentuk riak air secara keseluruhan.',
      incomplete: 'Bandingkan bentuk ini dengan bentuk lain yang kamu kenal.',
    },
  },
  application: {
    title: 'Terapkan Ilmu di Konteks Baru',
    intro: 'Amati bentuk yang muncul di sekitar alam.',
    prompt: 'Pilih bangun datar yang paling cocok dengan benda yang kamu amati.',
    context: 'Bentuk yang muncul pada alam sekitar.',
    images: [{ src: '/assets/qr/komik-2/13-objek-1.jpeg', alt: 'Bentuk lingkaran', label: 'Lingkaran', description: 'Perhatikan bentuknya yang bundar.' }],
    options: [{ value: 'Lingkaran', label: 'Lingkaran' }, { value: 'Persegi', label: 'Persegi' }],
  },
  argumentation: {
    questions: [{ id: 'komik5-arg-1', templePart: 'riak air', question: 'Mengapa riak air ini cocok disebut lingkaran?', photoSrc: '/assets/qr/komik-2/13-objek-1.jpeg', photoAlt: 'Riak air', shapeName: 'Lingkaran', shapeKey: 'lingkaran', shapeSrc: '/images/navigation/default.svg', highlightColor: 'border-primary-500' }],
  },
  resolution: {
    missions: [{ id: 1, title: 'Misi 1 · Luas Lingkaran', part: 'Riak Air', shape: 'Lingkaran', prompt: 'Sebuah lingkaran memiliki jari-jari 3 cm. Berapakah luasnya?', options: [{ key: 'A', label: '9π cm²' }, { key: 'B', label: '6π cm²' }, { key: 'C', label: '3π cm²' }], correctKey: 'A', answer: '9π cm²', formula: 'L = π × r² = π × 3² = 9π cm²', explanation: 'Luas lingkaran dihitung dengan rumus L = πr².', aiHint: 'Ingat rumus luas lingkaran.', context: 'Bentuk yang kamu lihat pada riak air.', accent: 'from-primary-600 to-primary-700', illustration: '/images/navigation/default.svg' }],
  },
  introspection: {
    checklist: ['Saya mengenali bentuk lingkaran di sekitar.', 'Saya lebih percaya diri mengamati pola alam.'],
    completionMessage: 'Kamu telah menyelesaikan pembelajaran pada komik ini.',
    nextPrompt: 'Kamu bisa mengulang lagi bila ingin lebih percaya diri.',
  },
  report: { summary: 'Laporan sederhana untuk pembelajaran bentuk di alam.', learnedShapes: ['Lingkaran'] },
};
