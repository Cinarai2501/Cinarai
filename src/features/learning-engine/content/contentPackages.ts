export interface LearningObjectContent {
  id: string;
  title: string;
  description: string;
  page: number;
  qrImage?: string;
  objectImage?: string;
  modelUrl?: string;
  embedUrl?: string;
  viewerType?: 'embed' | 'url';
  provider?: string;
  aiPrompt?: string;
  question?: string;
  answer?: string;
  feedback?: string;
  shapeKey?: string;
  shapeName?: string;
}

export interface LearningContentQuestion {
  id: string;
  question: string;
  image: string;
  imageAlt: string;
  overlayType?: string;
  crop?: string;
  highlight?: string;
  options: Array<{ text: string; correct: boolean }>;
  explanation: string;
}

export interface LearningContentApplicationImage {
  src: string;
  alt: string;
  label: string;
  description: string;
}

export interface LearningContentApplication {
  title: string;
  intro: string;
  prompt: string;
  context: string;
  images: LearningContentApplicationImage[];
  options: Array<{ value: string; label: string }>;
}

export interface LearningContentArgumentationQuestion {
  id: string;
  templePart: string;
  question: string;
  photoSrc: string;
  photoAlt: string;
  overlaySrc?: string;
  shapeName: string;
  shapeKey: string;
  shapeSrc: string;
  highlightColor: string;
}

export interface LearningContentResolutionMission {
  id: number;
  title: string;
  part: string;
  shape: string;
  prompt: string;
  options: Array<{ key: string; label: string }>;
  correctKey: string;
  answer: string;
  formula: string;
  explanation: string;
  aiHint: string;
  context: string;
  accent: string;
  illustration: string;
}

export interface LearningContentPackage {
  metadata: {
    comicId: number;
    title: string;
    subtitle: string;
    location: string;
    classLevel: string;
    cover: string;
    thumbnail: string;
    learningTargets: string[];
    synopsis: string;
  };
  learningObjects: LearningObjectContent[];
  qrCode: Array<{ id: string; imageSrc: string; alt: string; label: string; description: string }>;
  model3D: Array<{ id: string; title: string; arUrl: string; embedUrl?: string; viewerType?: 'embed' | 'url'; page: number; description: string; provider?: string }>;
  aiPrompt: {
    navigation: string;
    objectTutor: string;
    application: string;
    argumentation: string;
    resolution: string;
    introspection: string;
  };
  identification: {
    questions: LearningContentQuestion[];
    feedback: {
      complete: string;
      partial: string;
      incomplete: string;
    };
  };
  application: LearningContentApplication;
  argumentation: {
    questions: LearningContentArgumentationQuestion[];
  };
  resolution: {
    missions: LearningContentResolutionMission[];
  };
  introspection: {
    checklist: string[];
    completionMessage: string;
    nextPrompt: string;
  };
  report: {
    summary: string;
    learnedShapes: string[];
  };
}

function makeComic1Package(): LearningContentPackage {
  return makeFallbackPackage(1);
}

function makeComic2Package(): LearningContentPackage {
  return makeFallbackPackage(2);
}

function makeComic3Package(): LearningContentPackage {
  return makeFallbackPackage(3);
}

function makeFallbackPackage(comicId: number): LearningContentPackage {
  return {
    metadata: {
      comicId,
      title: `Komik ${comicId}`,
      subtitle: 'Pembelajaran CINARAI',
      location: 'Lokasi belum ditentukan',
      classLevel: 'SD',
      cover: '/comics/komik-1/cover.png',
      thumbnail: '/comics/komik-1/thumbnail.png',
      learningTargets: ['Mengamati objek', 'Menghubungkan bentuk dengan konsep matematika'],
      synopsis: 'Konten generik untuk pembelajaran CINARAI.',
    },
    learningObjects: [
      {
        id: `generic-${comicId}-object-1`,
        title: 'Objek 1',
        description: 'Objek pembelajaran generik.',
        page: 1,
        qrImage: '/features/comics/comic-1/assets/qr/kubus.png',
        objectImage: '/images/identification/komik1-soal1.jpg',
        modelUrl: '',
        embedUrl: '',
        viewerType: 'url',
        provider: 'Assemblr',
        aiPrompt: 'Jelaskan objek ini menggunakan bahasa sederhana.',
        question: 'Apa yang dapat kamu amati dari objek ini?',
        answer: 'Objek ini memiliki bentuk yang bisa dijelaskan dengan matematika.',
        feedback: 'Bagus, kamu sudah mengamati objek dengan baik.',
      },
    ],
    qrCode: [{ id: `generic-${comicId}-qr`, imageSrc: '/features/comics/comic-1/assets/qr/kubus.png', alt: 'QR generik', label: 'Objek', description: 'QR untuk membuka model 3D generik.' }],
    model3D: [{ id: `generic-${comicId}-model`, title: 'Model 3D', arUrl: '', page: 1, description: 'Model 3D generik.' }],
    aiPrompt: {
      navigation: 'Jelaskan objek yang diamati dengan bahasa sederhana.',
      objectTutor: 'Bantu siswa memahami bentuk dan ciri objek dengan santai.',
      application: 'Bimbing siswa menghubungkan objek dengan konteks baru.',
      argumentation: 'Beri umpan balik tentang alasan siswa.',
      resolution: 'Bantu siswa menyelesaikan soal numerasi.',
      introspection: 'Buat refleksi singkat dan positif.',
    },
    identification: {
      questions: [
        {
          id: `generic-${comicId}-q1`,
          question: 'Apa yang paling menarik dari objek ini?',
          image: '/images/identification/komik1-soal1.jpg',
          imageAlt: 'Objek generik',
          options: [
            { text: 'Bentuk', correct: true },
            { text: 'Warna', correct: false },
            { text: 'Ukuran', correct: false },
          ],
          explanation: 'Objek ini bisa dijelaskan melalui bentuknya.',
        },
      ],
      feedback: {
        complete: 'Kamu berhasil menyelesaikan identifikasi.',
        partial: 'Masih ada bagian yang perlu diperiksa.',
        incomplete: 'Amati objek dengan lebih teliti.',
      },
    },
    application: {
      title: 'Terapkan Ilmu di Konteks Baru',
      intro: 'Pilih objek yang paling sesuai dengan konsep yang dipelajari.',
      prompt: 'Jelaskan alasanmu terhadap objek yang kamu pilih.',
      context: 'Konteks belajar baru yang dekat dengan pengalaman siswa.',
      images: [{ src: '/images/identification/komik1-soal1.jpg', alt: 'Objek', label: 'Objek', description: 'Amati objek ini.' }],
      options: [{ value: 'Objek 1', label: 'Objek 1' }],
    },
    argumentation: {
      questions: [
        {
          id: `generic-${comicId}-arg-1`,
          templePart: 'objek utama',
          question: 'Mengapa objek ini cocok dengan konsep yang dipelajari?',
          photoSrc: '/images/identification/komik1-soal1.jpg',
          photoAlt: 'Objek generik',
          shapeName: 'Objek',
          shapeKey: 'objek',
          shapeSrc: '/images/navigation/default.svg',
          highlightColor: 'border-primary-500',
        },
      ],
    },
    resolution: {
      missions: [
        {
          id: 1,
          title: 'Misi 1',
          part: 'Objek',
          shape: 'Objek',
          prompt: 'Pilih jawaban yang paling tepat.',
          options: [{ key: 'A', label: 'Benar' }, { key: 'B', label: 'Salah' }],
          correctKey: 'A',
          answer: 'Benar',
          formula: 'Jawaban ditentukan oleh pemahaman konsep.',
          explanation: 'Penjelasan singkat.',
          aiHint: 'Periksa kembali konsep yang dipelajari.',
          context: 'Konteks generik.',
          accent: 'from-primary-600 to-primary-700',
          illustration: '/images/navigation/default.svg',
        },
      ],
    },
    introspection: {
      checklist: ['Saya memahami materi.', 'Saya siap melanjutkan.'],
      completionMessage: 'Pembelajaran selesai.',
      nextPrompt: 'Lanjutkan ke tahap berikutnya.',
    },
    report: {
      summary: 'Laporan generik untuk pembelajaran CINARAI.',
      learnedShapes: ['Objek 1'],
    },
  };
}

export function getLearningContentPackage(comicId: number): LearningContentPackage {
  if (comicId === 1) return makeComic1Package();
  if (comicId === 2) return makeComic2Package();
  if (comicId === 3) return makeComic3Package();
  return makeFallbackPackage(comicId);
}
