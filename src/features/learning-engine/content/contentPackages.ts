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

const baseMetadata = {
  cover: '/comics/komik-1/cover.png',
  thumbnail: '/comics/komik-1/thumbnail.png',
  learningTargets: [
    'Mengamati bentuk pada komik',
    'Menghubungkan konsep bangun ruang dengan objek nyata',
    'Menggunakan alasan matematis untuk menjelaskan pola',
  ],
  synopsis: 'Pembelajaran CINARAI yang dapat dipakai untuk berbagai komik.',
};

function makeComic1Package(): LearningContentPackage {
  return {
    metadata: {
      comicId: 1,
      title: 'Petualangan Bangun Ruang Candi Jawi',
      subtitle: 'Etnomatematika Bangun Ruang',
      location: 'Candi Jawi, Pasuruan',
      classLevel: 'VI',
      cover: baseMetadata.cover,
      thumbnail: baseMetadata.thumbnail,
      learningTargets: baseMetadata.learningTargets,
      synopsis: baseMetadata.synopsis,
    },
    learningObjects: [
      {
        id: 'komik1-kubus',
        title: 'Kubus',
        description: 'Bentuk kotak pada bagian pilar utama candi.',
        page: 1,
        qrImage: '/assets/qr/komik-1/13-kubus.jpeg',
        objectImage: '/images/identification/komik1-soal1.jpg',
        modelUrl: 'https://modelviewer.dev/examples/scenegraph/index.html',
        embedUrl: 'https://modelviewer.dev/examples/scenegraph/index.html',
        viewerType: 'embed',
        provider: 'ModelViewer',
        aiPrompt: 'Jelaskan ciri kubus, sisi, rusuk, dan titik sudut yang terlihat pada objek ini.',
        question: 'Apa ciri khas kubus yang terlihat pada objek ini?',
        answer: 'Kubus memiliki 6 sisi persegi, 12 rusuk, dan 8 titik sudut.',
        feedback: 'Benar, kubus bisa dikenali dari sisi-sisinya yang sama besar dan bentuk persegi.',
      },
      {
        id: 'komik1-balok',
        title: 'Balok',
        description: 'Bentuk persegi panjang yang menyusun badan candi.',
        page: 2,
        qrImage: '/assets/qr/komik-1/16-balok.jpeg',
        objectImage: '/images/identification/komik1-soal3.jpg',
        modelUrl: 'https://modelviewer.dev/examples/scenegraph/index.html',
        embedUrl: 'https://modelviewer.dev/examples/scenegraph/index.html',
        viewerType: 'embed',
        provider: 'ModelViewer',
        aiPrompt: 'Jelaskan perbedaan balok dengan kubus berdasarkan panjang, lebar, dan tinggi.',
        question: 'Bagaimana cara membedakan balok dengan kubus?',
        answer: 'Balok memiliki sisi-sisi berbentuk persegi panjang, sedangkan kubus semua sisinya sama.',
        feedback: 'Bagus, balok dapat dikenali dari sisi-sisi yang tidak semuanya sama panjang.',
      },
      {
        id: 'komik1-prisma',
        title: 'Prisma Segi Empat',
        description: 'Bentuk prisma pada sisi bangunan yang tegak.',
        page: 3,
        qrImage: '/assets/qr/komik-1/22-prisma.jpeg',
        objectImage: '/images/identification/komik1-soal5.jpg',
        modelUrl: 'https://modelviewer.dev/examples/scenegraph/index.html',
        embedUrl: 'https://modelviewer.dev/examples/scenegraph/index.html',
        viewerType: 'embed',
        provider: 'ModelViewer',
        aiPrompt: 'Jelaskan alas, tutup, dan sisi tegak prisma segi empat.',
        question: 'Apa saja bagian utama prisma segi empat?',
        answer: 'Prisma segi empat memiliki dua alas yang sejajar dan sisi tegak berbentuk persegi panjang.',
        feedback: 'Benar, prisma segi empat mudah dikenali dari dua alas dan sisi tegak yang membentuk bidang.',
      },
      {
        id: 'komik1-limas',
        title: 'Limas Segi Empat',
        description: 'Puncak bangunan yang meruncing ke satu titik.',
        page: 4,
        qrImage: '/assets/qr/komik-1/17-limas.jpeg',
        objectImage: '/images/identification/komik1-soal4.jpg',
        modelUrl: 'https://modelviewer.dev/examples/scenegraph/index.html',
        embedUrl: 'https://modelviewer.dev/examples/scenegraph/index.html',
        viewerType: 'embed',
        provider: 'ModelViewer',
        aiPrompt: 'Jelaskan bentuk alas dan sisi tegak limas segi empat.',
        question: 'Mengapa limas segi empat punya puncak tajam?',
        answer: 'Karena semua sisi tegak bertemu di satu titik puncak.',
        feedback: 'Betul, limas segi empat memiliki satu puncak dan alas berbentuk segi empat.',
      },
      {
        id: 'komik1-kerucut',
        title: 'Kerucut',
        description: 'Bagian atap yang meruncing ke atas.',
        page: 5,
        qrImage: '/assets/qr/komik-1/28-kerucut.jpeg',
        objectImage: '/images/identification/komik1-soal4.jpg',
        modelUrl: 'https://modelviewer.dev/examples/scenegraph/index.html',
        embedUrl: 'https://modelviewer.dev/examples/scenegraph/index.html',
        viewerType: 'embed',
        provider: 'ModelViewer',
        aiPrompt: 'Jelaskan ciri kerucut dan hubungan antara alas, tinggi, dan sisi miring.',
        question: 'Apa ciri utama kerucut?',
        answer: 'Kerucut memiliki alas lingkaran dan satu titik puncak.',
        feedback: 'Ya, kerucut bisa dikenali dari alas bundar dan bentuk yang meruncing ke atas.',
      },
    ],
    qrCode: [
      { id: 'komik1-qr-1', imageSrc: '/assets/qr/komik-1/13-kubus.jpeg', alt: 'QR Kubus', label: 'Kubus', description: 'Scan untuk membuka model 3D kubus.' },
      { id: 'komik1-qr-2', imageSrc: '/assets/qr/komik-1/16-balok.jpeg', alt: 'QR Balok', label: 'Balok', description: 'Scan untuk membuka model 3D balok.' },
      { id: 'komik1-qr-3', imageSrc: '/assets/qr/komik-1/22-prisma.jpeg', alt: 'QR Prisma', label: 'Prisma', description: 'Scan untuk membuka model 3D prisma.' },
      { id: 'komik1-qr-4', imageSrc: '/assets/qr/komik-1/17-limas.jpeg', alt: 'QR Limas', label: 'Limas', description: 'Scan untuk membuka model 3D limas.' },
      { id: 'komik1-qr-5', imageSrc: '/assets/qr/komik-1/28-kerucut.jpeg', alt: 'QR Kerucut', label: 'Kerucut', description: 'Scan untuk membuka model 3D kerucut.' },
    ],
    model3D: [
      { id: 'komik1-model-1', title: 'Kubus', arUrl: 'https://modelviewer.dev/examples/scenegraph/index.html', page: 1, description: 'Model 3D kubus untuk pengamatan sisi dan rusuk.' },
      { id: 'komik1-model-2', title: 'Balok', arUrl: 'https://modelviewer.dev/examples/scenegraph/index.html', page: 2, description: 'Model 3D balok untuk pengamatan panjang, lebar, dan tinggi.' },
      { id: 'komik1-model-3', title: 'Prisma Segi Empat', arUrl: 'https://modelviewer.dev/examples/scenegraph/index.html', page: 3, description: 'Model 3D prisma segi empat.' },
      { id: 'komik1-model-4', title: 'Limas Segi Empat', arUrl: 'https://modelviewer.dev/examples/scenegraph/index.html', page: 4, description: 'Model 3D limas segi empat.' },
      { id: 'komik1-model-5', title: 'Kerucut', arUrl: 'https://modelviewer.dev/examples/scenegraph/index.html', page: 5, description: 'Model 3D kerucut.' },
    ],
    aiPrompt: {
      navigation: 'Gunakan bahasa sederhana untuk menjelaskan setiap bangun ruang yang diamati pada komik.',
      objectTutor: 'Bantu siswa menghubungkan ciri bangun ruang dengan bagian candi yang terlihat.',
      application: 'Bantu siswa menerapkan pemahaman bangun ruang pada situasi baru yang serupa.',
      argumentation: 'Berikan umpan balik tentang alasan siswa yang menjelaskan bentuk bangun ruang dari pengamatan.',
      resolution: 'Bimbing siswa menyelesaikan soal numerasi dari bangun ruang yang dipelajari.',
      introspection: 'Buat refleksi singkat yang menekankan pemahaman dan rasa percaya diri.',
    },
    identification: {
      questions: [
        {
          id: 'komik1-ident-1',
          question: 'Apa saja bangun ruang yang kamu temukan pada komik ini?',
          image: '/images/identification/komik1-soal1.jpg',
          imageAlt: 'Foto keseluruhan Candi Jawi dengan overlay bangun ruang dominan.',
          overlayType: '/images/identification/komik1-soal1-tubuh-candi.svg',
          options: [
            { text: 'Kubus', correct: true },
            { text: 'Balok', correct: true },
            { text: 'Prisma Segi Empat', correct: true },
            { text: 'Limas Segi Empat', correct: true },
            { text: 'Kerucut', correct: true },
          ],
          explanation: 'Pada komik ini, beberapa bangun ruang utama yang terlihat adalah kubus, balok, prisma, limas, dan kerucut.',
        },
        {
          id: 'komik1-ident-2',
          question: 'Bangun ruang mana yang paling cocok untuk menggambarkan pilar utama?',
          image: '/images/identification/komik1-soal2.jpg',
          imageAlt: 'Zoom bagian kaki Candi Jawi.',
          overlayType: '/images/identification/komik1-soal2-kaki-candi.svg',
          options: [
            { text: 'Kubus', correct: true },
            { text: 'Balok', correct: false },
            { text: 'Kerucut', correct: false },
            { text: 'Tabung', correct: false },
          ],
          explanation: 'Pilar utama candi sering tersusun dari bentuk kotak, sehingga kubus cocok untuk memodelkannya.',
        },
        {
          id: 'komik1-ident-3',
          question: 'Bagian badan candi paling mirip dengan bangun ruang apa?',
          image: '/images/identification/komik1-soal3.jpg',
          imageAlt: 'Zoom badan tengah Candi Jawi.',
          overlayType: '/images/identification/komik1-soal3-puncak-candi.svg',
          options: [
            { text: 'Balok', correct: true },
            { text: 'Prisma Segi Empat', correct: false },
            { text: 'Bola', correct: false },
            { text: 'Tabung', correct: false },
          ],
          explanation: 'Badan candi menyerupai bangun ruang balok.',
        },
        {
          id: 'komik1-ident-4',
          question: 'Struktur puncak yang meruncing bisa diterangkan dengan bangun ruang apa?',
          image: '/images/identification/komik1-soal4.jpg',
          imageAlt: 'Zoom atap Candi Jawi.',
          overlayType: '/images/identification/komik1-soal4-atap-candi.svg',
          options: [
            { text: 'Limas Segi Empat', correct: true },
            { text: 'Kerucut', correct: true },
            { text: 'Kubus', correct: false },
            { text: 'Bola', correct: false },
          ],
          explanation: 'Puncak candi meniru limas dan kerucut karena meruncing ke satu titik.',
        },
      ],
      feedback: {
        complete: 'Hebat! Kamu berhasil mengidentifikasi bangun ruang yang dipelajari pada komik ini.',
        partial: 'Ada beberapa jawaban yang masih perlu diperiksa lagi.',
        incomplete: 'Perhatikan kembali bagian komik untuk menemukan bentuk yang paling sesuai.',
      },
    },
    application: {
      title: 'Terapkan Ilmu di Konteks Baru',
      intro: 'Amati objek dari sudut berbeda dan pilih bangun ruang yang paling cocok.',
      prompt: 'Pilih bangun ruang yang paling cocok untuk menjelaskan objek yang kamu lihat dan jelaskan alasanmu.',
      context: 'Objek baru yang menyimpan bentuk serupa dengan bangun ruang yang dipelajari di candi.',
      images: [
        { src: '/images/identification/komik1-soal1.jpg', alt: 'Tampak depan', label: 'Tampak Depan', description: 'Perhatikan bentuk utama dari depan.' },
        { src: '/images/identification/komik1-soal3.jpg', alt: 'Sudut puncak', label: 'Sudut Puncak', description: 'Perhatikan bentuk puncak yang meruncing.' },
        { src: '/images/identification/komik1-soal5.jpg', alt: 'Sudut samping', label: 'Sudut Samping', description: 'Perhatikan sisi samping dan bentuk bidangnya.' },
      ],
      options: [
        { value: 'Kubus', label: 'Kubus' },
        { value: 'Balok', label: 'Balok' },
        { value: 'Prisma Segi Empat', label: 'Prisma Segi Empat' },
        { value: 'Limas Segi Empat', label: 'Limas Segi Empat' },
        { value: 'Kerucut', label: 'Kerucut' },
      ],
    },
    argumentation: {
      questions: [
        {
          id: 'komik1-arg-1',
          templePart: 'pilar utama',
          question: 'Mengapa pilar utama dapat dimodelkan sebagai kubus atau balok?',
          photoSrc: '/images/identification/komik1-soal1.jpg',
          photoAlt: 'Pilar utama candi terlihat kokoh dan kotak.',
          shapeName: 'Kubus',
          shapeKey: 'kubus',
          shapeSrc: '/images/navigation/kubus.svg',
          highlightColor: 'border-primary-500',
        },
        {
          id: 'komik1-arg-2',
          templePart: 'atap',
          question: 'Mengapa sisi atap dapat dianggap sebagai limas?',
          photoSrc: '/images/identification/komik1-soal4.jpg',
          photoAlt: 'Atap candi tampak meruncing.',
          shapeName: 'Limas Segi Empat',
          shapeKey: 'limas',
          shapeSrc: '/images/navigation/limas.svg',
          highlightColor: 'border-accent-500',
        },
      ],
    },
    resolution: {
      missions: [
        {
          id: 1,
          title: 'Misi 1 · Volume Kubus',
          part: 'Pilar Utama',
          shape: 'Kubus',
          prompt: 'Sebuah kubus memiliki panjang rusuk 8 cm. Berapa volumenya?',
          options: [
            { key: 'A', label: '256 cm³' },
            { key: 'B', label: '384 cm³' },
            { key: 'C', label: '512 cm³' },
            { key: 'D', label: '640 cm³' },
          ],
          correctKey: 'C',
          answer: '512 cm³',
          formula: 'V = s × s × s = 8 × 8 × 8 = 512 cm³',
          explanation: 'Kubus memiliki rusuk yang sama panjang, sehingga volumenya adalah perkalian sisi tiga kali.',
          aiHint: 'Gunakan rumus volume kubus: V = s³.',
          context: 'Pilar utama candi dapat dipandang sebagai susunan kubus yang padat.',
          accent: 'from-primary-600 to-primary-700',
          illustration: '/images/navigation/kubus.svg',
        },
        {
          id: 2,
          title: 'Misi 2 · Volume Balok',
          part: 'Badan Candi',
          shape: 'Balok',
          prompt: 'Sebuah balok panjang 10 cm, lebar 6 cm, tinggi 8 cm. Berapa volumenya?',
          options: [
            { key: 'A', label: '360 cm³' },
            { key: 'B', label: '420 cm³' },
            { key: 'C', label: '480 cm³' },
            { key: 'D', label: '520 cm³' },
          ],
          correctKey: 'C',
          answer: '480 cm³',
          formula: 'V = p × l × t = 10 × 6 × 8 = 480 cm³',
          explanation: 'Balok memiliki tiga ukuran berbeda, yaitu panjang, lebar, dan tinggi.',
          aiHint: 'Kalikan panjang, lebar, dan tinggi dengan hati-hati.',
          context: 'Badan candi menyerupai balok yang memanjang ke atas.',
          accent: 'from-secondary-500 to-secondary-600',
          illustration: '/images/navigation/balok.svg',
        },
      ],
    },
    introspection: {
      checklist: [
        'Saya memahami bangun ruang yang muncul pada komik ini.',
        'Saya dapat menjelaskan ciri-ciri kubus, balok, prisma, limas, dan kerucut.',
        'Saya percaya diri mengerjakan soal serupa tentang volume.',
      ],
      completionMessage: 'Kamu telah menyelesaikan pembelajaran komik ini dengan baik.',
      nextPrompt: 'Lanjutkan ke komik berikutnya untuk belajar lagi.',
    },
    report: {
      summary: 'Laporan ini menampilkan hasil pemahamanmu terhadap bangun ruang pada komik.',
      learnedShapes: ['Kubus', 'Balok', 'Prisma Segi Empat', 'Limas Segi Empat', 'Kerucut'],
    },
  };
}

function makeComic2Package(): LearningContentPackage {
  return {
    metadata: {
      comicId: 2,
      title: 'Petualangan Simetri Candi Penataran',
      subtitle: 'Etnomatematika Bangun Datar',
      location: 'Candi Penataran, Blitar',
      classLevel: 'V',
      cover: '/comics/komik-2/cover.png',
      thumbnail: '/comics/komik-2/thumbnail.png',
      learningTargets: [
        'Mengamati pola simetri pada relief dan struktur candi.',
        'Menghubungkan bangun datar dengan bentuk nyata pada candi.',
        'Menggunakan luas dan sifat bangun datar untuk menjelaskan pola.',
      ],
      synopsis: 'Pembelajaran untuk bangun datar di Candi Penataran.',
    },
    learningObjects: [
      {
        id: 'komik2-persegi',
        title: 'Persegi',
        description: 'Pola persegi pada relief Candi Penataran.',
        page: 1,
        qrImage: '/assets/qr/komik-2/13-objek-1.jpeg',
        objectImage: '/assets/qr/komik-2/13-objek-1.jpeg',
        modelUrl: 'https://modelviewer.dev/examples/scenegraph/index.html',
        embedUrl: 'https://modelviewer.dev/examples/scenegraph/index.html',
        viewerType: 'embed',
        provider: 'ModelViewer',
        aiPrompt: 'Jelaskan mengapa pola persegi pada relief memiliki simetri yang kuat.',
        question: 'Mengapa pola persegi terlihat berulang?',
        answer: 'Karena sisi-sisinya sama panjang dan bentuknya seimbang.',
        feedback: 'Benar, persegi memiliki sisi yang sama dan simetri yang jelas.',
      },
      {
        id: 'komik2-persegi-panjang',
        title: 'Persegi Panjang',
        description: 'Bidang panjang pada arsitektur candi.',
        page: 2,
        qrImage: '/assets/qr/komik-2/15-objek-2.jpeg',
        objectImage: '/assets/qr/komik-2/15-objek-2.jpeg',
        modelUrl: 'https://modelviewer.dev/examples/scenegraph/index.html',
        embedUrl: 'https://modelviewer.dev/examples/scenegraph/index.html',
        viewerType: 'embed',
        provider: 'ModelViewer',
        aiPrompt: 'Jelaskan ciri-ciri persegi panjang berdasarkan panjang dan lebarnya.',
        question: 'Apa ciri utama persegi panjang?',
        answer: 'Persegi panjang memiliki dua pasang sisi yang sama panjang dan empat sudut siku-siku.',
        feedback: 'Bagus, persegi panjang dapat dikenali dari sisi yang berhadapan sama dan sudut siku-siku.',
      },
      {
        id: 'komik2-segitiga',
        title: 'Segitiga',
        description: 'Ornamen tajam yang membentuk segitiga.',
        page: 3,
        qrImage: '/assets/qr/komik-2/17-objek-3.jpeg',
        objectImage: '/assets/qr/komik-2/17-objek-3.jpeg',
        modelUrl: 'https://modelviewer.dev/examples/scenegraph/index.html',
        embedUrl: 'https://modelviewer.dev/examples/scenegraph/index.html',
        viewerType: 'embed',
        provider: 'ModelViewer',
        aiPrompt: 'Jelaskan mengapa bentuk ornamen tajam bisa disebut sebagai segitiga.',
        question: 'Mengapa ornamen tajam dikatakan segitiga?',
        answer: 'Karena bentuknya memiliki tiga sisi dan tiga sudut.',
        feedback: 'Benar, segitiga mudah dikenali dari tiga sisi dan tiga sudut.',
      },
      {
        id: 'komik2-trapesium',
        title: 'Trapesium',
        description: 'Relief yang memiliki sepasang sisi sejajar.',
        page: 4,
        qrImage: '/assets/qr/komik-2/18-objek-4.jpeg',
        objectImage: '/assets/qr/komik-2/18-objek-4.jpeg',
        modelUrl: 'https://modelviewer.dev/examples/scenegraph/index.html',
        embedUrl: 'https://modelviewer.dev/examples/scenegraph/index.html',
        viewerType: 'embed',
        provider: 'ModelViewer',
        aiPrompt: 'Jelaskan sifat trapesium yang memiliki sepasang sisi sejajar.',
        question: 'Apa ciri khas trapesium?',
        answer: 'Trapesium memiliki sepasang sisi sejajar dan dua sisi lainnya bisa berbeda panjang.',
        feedback: 'Bagus, trapesium dikenali dari sepasang sisi sejajar.',
      },
    ],
    qrCode: [
      { id: 'komik2-qr-1', imageSrc: '/assets/qr/komik-2/13-objek-1.jpeg', alt: 'QR Persegi', label: 'Persegi', description: 'Scan untuk melihat pola persegi.' },
      { id: 'komik2-qr-2', imageSrc: '/assets/qr/komik-2/15-objek-2.jpeg', alt: 'QR Persegi Panjang', label: 'Persegi Panjang', description: 'Scan untuk melihat bidang panjang.' },
      { id: 'komik2-qr-3', imageSrc: '/assets/qr/komik-2/17-objek-3.jpeg', alt: 'QR Segitiga', label: 'Segitiga', description: 'Scan untuk melihat ornamen tajam.' },
      { id: 'komik2-qr-4', imageSrc: '/assets/qr/komik-2/18-objek-4.jpeg', alt: 'QR Trapesium', label: 'Trapesium', description: 'Scan untuk melihat relief trapesium.' },
    ],
    model3D: [
      { id: 'komik2-model-1', title: 'Persegi', arUrl: 'https://modelviewer.dev/examples/scenegraph/index.html', page: 1, description: 'Model 3D persegi untuk mengamati simetri.' },
      { id: 'komik2-model-2', title: 'Persegi Panjang', arUrl: 'https://modelviewer.dev/examples/scenegraph/index.html', page: 2, description: 'Model 3D persegi panjang untuk mengamati sudut.' },
      { id: 'komik2-model-3', title: 'Segitiga', arUrl: 'https://modelviewer.dev/examples/scenegraph/index.html', page: 3, description: 'Model 3D segitiga untuk melihat sisi dan sudut.' },
      { id: 'komik2-model-4', title: 'Trapesium', arUrl: 'https://modelviewer.dev/examples/scenegraph/index.html', page: 4, description: 'Model 3D trapesium untuk melihat pasangan sisi sejajar.' },
    ],
    aiPrompt: {
      navigation: 'Gunakan bahasa sederhana untuk menjelaskan bentuk dan simetri pada bangun datar.',
      objectTutor: 'Bantu siswa menghubungkan bentuk datar dengan pola relief candi.',
      application: 'Bantu siswa menghubungkan bentuk datar dengan situasi baru yang serupa.',
      argumentation: 'Beri umpan balik tentang alasan siswa memodelkan bentuk candi sebagai bangun datar.',
      resolution: 'Bimbing siswa menyelesaikan latihan pada bangun datar.',
      introspection: 'Buat refleksi singkat yang menekankan pemahaman pola dan luas.',
    },
    identification: {
      questions: [
        {
          id: 'komik2-ident-1',
          question: 'Bagian mana dari Candi Penataran yang tampak paling simetris?',
          image: '/assets/qr/komik-2/13-objek-1.jpeg',
          imageAlt: 'Pola relief Candi Penataran yang tampak berulang dan seimbang.',
          options: [
            { text: 'Garis Simetri', correct: true },
            { text: 'Sisi Kiri', correct: false },
            { text: 'Sisi Kanan', correct: false },
            { text: 'Pintu Candi', correct: false },
          ],
          explanation: 'Bagian yang tampak sama di kiri dan kanan menunjukkan garis simetri pada bangunan.',
        },
        {
          id: 'komik2-ident-2',
          question: 'Apa yang dimaksud dengan simetri pada bangunan?',
          image: '/assets/qr/komik-2/15-objek-2.jpeg',
          imageAlt: 'Bidang panjang pada candi yang menggambarkan keseimbangan bentuk.',
          options: [
            { text: 'Pencerminan', correct: true },
            { text: 'Titik Tengah', correct: false },
            { text: 'Relief', correct: false },
            { text: 'Tangga', correct: false },
          ],
          explanation: 'Simetri terjadi ketika dua sisi bangunan saling mencerminkan satu sama lain.',
        },
        {
          id: 'komik2-ident-3',
          question: 'Jika bangunan dibagi oleh garis tengah, apa yang terjadi pada bagian kiri dan kanannya?',
          image: '/assets/qr/komik-2/17-objek-3.jpeg',
          imageAlt: 'Ornamen tajam pada candi yang terlihat seimbang.',
          options: [
            { text: 'Bangunan Simetris', correct: true },
            { text: 'Bangunan Tidak Simetris', correct: false },
            { text: 'Relief Berulang', correct: false },
            { text: 'Tangga Berbeda', correct: false },
          ],
          explanation: 'Ketika bagian kiri dan kanan sama, bangunan disebut simetris dan seimbang.',
        },
        {
          id: 'komik2-ident-4',
          question: 'Bagian mana dari candi yang menunjukkan keseimbangan bentuk?',
          image: '/assets/qr/komik-2/18-objek-4.jpeg',
          imageAlt: 'Relief dengan pola yang tampak seimbang.',
          options: [
            { text: 'Sisi Kiri', correct: true },
            { text: 'Sisi Kanan', correct: true },
            { text: 'Tangga', correct: false },
            { text: 'Relief', correct: false },
          ],
          explanation: 'Keseimbangan terlihat saat sisi kiri dan kanan saling memadukan bentuk yang sama.',
        },
      ],
      feedback: {
        complete: 'Hebat! Kamu berhasil menemukan konsep simetri pada Candi Penataran.',
        partial: 'Coba perhatikan lagi bagian kiri dan kanan bangunan. Apakah keduanya saling mencerminkan?',
        incomplete: 'Perhatikan lagi garis tengah dan bagian yang sama di kiri serta kanan candi.',
      },
    },
    application: {
      title: 'Terapkan Ilmu di Konteks Baru',
      intro: 'Amati pola relief dan bentuk bangun datar pada candi, lalu pilih bangun datar yang paling cocok.',
      prompt: 'Relief Candi Penataran menampilkan pola yang simetris dan berulang. Pilih bangun datar yang paling cocok untuk menjelaskan pola tersebut dan jelaskan alasanmu.',
      context: 'Pola simetri dan bentuk bangun datar pada relief Candi Penataran.',
      images: [
        { src: '/assets/qr/komik-2/13-objek-1.jpeg', alt: 'Relief persegi', label: 'Relief Simetris', description: 'Amati pola berulang yang seimbang.' },
        { src: '/assets/qr/komik-2/15-objek-2.jpeg', alt: 'Bidang panjang', label: 'Bidang Panjang', description: 'Perhatikan sisi panjang dan pendek.' },
        { src: '/assets/qr/komik-2/17-objek-3.jpeg', alt: 'Ornamen tajam', label: 'Ornamen Tajam', description: 'Lihat sudut dan sisi yang membentuk bangun tajam.' },
      ],
      options: [
        { value: 'Persegi', label: 'Persegi' },
        { value: 'Persegi Panjang', label: 'Persegi Panjang' },
        { value: 'Segitiga', label: 'Segitiga' },
        { value: 'Trapesium', label: 'Trapesium' },
      ],
    },
    argumentation: {
      questions: [
        {
          id: 'komik2-arg-1',
          templePart: 'relief persegi',
          question: 'Mengapa pola persegi pada relief Candi Penataran dapat dikatakan memiliki simetri yang kuat?',
          photoSrc: '/assets/qr/komik-2/13-objek-1.jpeg',
          photoAlt: 'Relief Candi Penataran tampak berulang dalam pola persegi',
          shapeName: 'Persegi',
          shapeKey: 'persegi',
          shapeSrc: '/images/navigation/default.svg',
          highlightColor: 'border-primary-500',
        },
        {
          id: 'komik2-arg-2',
          templePart: 'bidang panjang',
          question: 'Mengapa bidang panjang pada arsitektur Candi Penataran cocok disebut persegi panjang?',
          photoSrc: '/assets/qr/komik-2/15-objek-2.jpeg',
          photoAlt: 'Bidang panjang pada Candi Penataran',
          shapeName: 'Persegi Panjang',
          shapeKey: 'persegi-panjang',
          shapeSrc: '/images/navigation/default.svg',
          highlightColor: 'border-secondary-500',
        },
      ],
    },
    resolution: {
      missions: [
        {
          id: 1,
          title: 'Misi 1 · Luas Persegi',
          part: 'Relief Persegi',
          shape: 'Persegi',
          prompt: 'Sebuah persegi memiliki panjang sisi 8 cm. Berapakah luasnya?',
          options: [
            { key: 'A', label: '32 cm²' },
            { key: 'B', label: '48 cm²' },
            { key: 'C', label: '64 cm²' },
            { key: 'D', label: '72 cm²' },
          ],
          correctKey: 'C',
          answer: '64 cm²',
          formula: 'L = s × s = 8 × 8 = 64 cm²',
          explanation: 'Luas persegi dihitung dari sisi dikali sisi.',
          aiHint: 'Ingat rumus luas persegi: L = s².',
          context: 'Pola persegi pada relief Candi Penataran menunjukkan susunan yang sama di kiri dan kanan.',
          accent: 'from-primary-600 to-primary-700',
          illustration: '/images/navigation/default.svg',
        },
        {
          id: 2,
          title: 'Misi 2 · Luas Persegi Panjang',
          part: 'Bidang Panjang',
          shape: 'Persegi Panjang',
          prompt: 'Sebuah persegi panjang berukuran panjang 12 cm dan lebar 6 cm. Berapakah luasnya?',
          options: [
            { key: 'A', label: '54 cm²' },
            { key: 'B', label: '60 cm²' },
            { key: 'C', label: '66 cm²' },
            { key: 'D', label: '72 cm²' },
          ],
          correctKey: 'D',
          answer: '72 cm²',
          formula: 'L = p × l = 12 × 6 = 72 cm²',
          explanation: 'Luas persegi panjang dihitung dari panjang dikali lebar.',
          aiHint: 'Kalikan panjang dan lebar dengan hati-hati.',
          context: 'Bidang panjang pada Candi Penataran membantu kita melihat bentuk yang lebih lebar dari persegi.',
          accent: 'from-secondary-500 to-secondary-600',
          illustration: '/images/navigation/default.svg',
        },
      ],
    },
    introspection: {
      checklist: [
        'Saya memahami pola simetri pada Candi Penataran.',
        'Saya dapat mengenali persegi, persegi panjang, segitiga, dan trapesium.',
        'Saya lebih percaya diri menyelesaikan soal serupa tentang luas.',
      ],
      completionMessage: 'Kamu telah menyelesaikan pembelajaran pada Candi Penataran.',
      nextPrompt: 'Lanjutkar ke komik berikutnya untuk mempelajari konsep baru.',
    },
    report: {
      summary: 'Laporan ini menampilkan hasil pemahamanmu terhadap bangun datar pada candi.',
      learnedShapes: ['Persegi', 'Persegi Panjang', 'Segitiga', 'Trapesium'],
    },
  };
}

function makeComic3Package(): LearningContentPackage {
  return {
    metadata: {
      comicId: 3,
      title: 'Petualangan di Rumah Gajah Mungkur',
      subtitle: 'Etnomatematika Bangun Datar',
      location: 'Rumah Gajah Mungkur, Gresik',
      classLevel: 'II',
      cover: '/comics/komik-3/cover.png',
      thumbnail: '/comics/komik-3/thumbnail.png',
      learningTargets: [
        'Mengenali bangun datar sederhana di sekitar rumah dan bangunan bersejarah.',
        'Membandingkan bentuk persegi, segitiga, lingkaran, dan jajargenjang.',
        'Menyusun dan mengurai bentuk bangun datar.',
      ],
      synopsis: 'Pembelajaran untuk bangun datar di Rumah Gajah Mungkur.',
    },
    learningObjects: [
      {
        id: 'komik3-persegi',
        title: 'Persegi',
        description: 'Bentuk persegi pada bagian halaman bangunan.',
        page: 1,
        qrImage: '/assets/qr/komik-2/13-objek-1.jpeg',
        objectImage: '/assets/qr/komik-2/13-objek-1.jpeg',
        modelUrl: 'https://modelviewer.dev/examples/scenegraph/index.html',
        embedUrl: 'https://modelviewer.dev/examples/scenegraph/index.html',
        viewerType: 'embed',
        provider: 'ModelViewer',
        aiPrompt: 'Jelaskan ciri persegi yang terlihat pada bangunan ini.',
        question: 'Apa ciri persegi?',
        answer: 'Persegi memiliki empat sisi sama panjang dan empat sudut siku-siku.',
        feedback: 'Benar, persegi aman dikenali karena semua sisinya sama.',
      },
      {
        id: 'komik3-segitiga',
        title: 'Segitiga',
        description: 'Bentuk atap rumah yang tajam.',
        page: 2,
        qrImage: '/assets/qr/komik-2/17-objek-3.jpeg',
        objectImage: '/assets/qr/komik-2/17-objek-3.jpeg',
        modelUrl: 'https://modelviewer.dev/examples/scenegraph/index.html',
        embedUrl: 'https://modelviewer.dev/examples/scenegraph/index.html',
        viewerType: 'embed',
        provider: 'ModelViewer',
        aiPrompt: 'Jelaskan mengapa atap dapat dipahami sebagai segitiga.',
        question: 'Mengapa atap bisa dikatakan segitiga?',
        answer: 'Karena atap memiliki tiga sisi dan tiga sudut.',
        feedback: 'Benar, segitiga memiliki tiga sisi dan tiga sudut.',
      },
    ],
    qrCode: [
      { id: 'komik3-qr-1', imageSrc: '/assets/qr/komik-2/13-objek-1.jpeg', alt: 'QR Persegi', label: 'Persegi', description: 'Scan untuk melihat bentuk persegi.' },
      { id: 'komik3-qr-2', imageSrc: '/assets/qr/komik-2/17-objek-3.jpeg', alt: 'QR Segitiga', label: 'Segitiga', description: 'Scan untuk melihat bentuk segitiga.' },
    ],
    model3D: [
      { id: 'komik3-model-1', title: 'Persegi', arUrl: 'https://modelviewer.dev/examples/scenegraph/index.html', page: 1, description: 'Model 3D persegi untuk pengamatan sederhana.' },
      { id: 'komik3-model-2', title: 'Segitiga', arUrl: 'https://modelviewer.dev/examples/scenegraph/index.html', page: 2, description: 'Model 3D segitiga untuk pengamatan sudut.' },
    ],
    aiPrompt: {
      navigation: 'Bantu siswa mengenali bangun datar sederhana dengan bahasa yang mudah dipahami.',
      objectTutor: 'Jelaskan bangun datar dengan contoh yang dekat dengan kehidupan siswa.',
      application: 'Bantu siswa menghubungkan bangun datar dengan benda nyata di sekitar.',
      argumentation: 'Beri umpan balik sederhana tentang alasan siswa.',
      resolution: 'Bimbing siswa menyelesaikan latihan bangun datar sederhana.',
      introspection: 'Buat refleksi singkat dengan bahasa yang sederhana dan positif.',
    },
    identification: {
      questions: [
        {
          id: 'komik3-ident-1',
          question: 'Bangun datar apa yang paling sering kamu lihat di rumah ini?',
          image: '/assets/qr/komik-2/13-objek-1.jpeg',
          imageAlt: 'Bentuk persegi pada bangunan.',
          options: [
            { text: 'Persegi', correct: true },
            { text: 'Segitiga', correct: false },
            { text: 'Lingkaran', correct: false },
            { text: 'Jajar Genjang', correct: false },
          ],
          explanation: 'Bentuk persegi sering muncul pada bagian bangunan yang berbentuk kotak.',
        },
        {
          id: 'komik3-ident-2',
          question: 'Bagian atap rumah ini paling cocok disebut bangun datar apa?',
          image: '/assets/qr/komik-2/17-objek-3.jpeg',
          imageAlt: 'Atap rumah terlihat berbentuk segitiga.',
          options: [
            { text: 'Segitiga', correct: true },
            { text: 'Persegi', correct: false },
            { text: 'Bujur Sangkar', correct: false },
            { text: 'Lingkaran', correct: false },
          ],
          explanation: 'Atap rumah dapat dilihat sebagai segitiga karena memiliki tiga sisi.',
        },
      ],
      feedback: {
        complete: 'Sangat bagus! Kamu mengenali bangun datar dengan baik.',
        partial: 'Masih ada beberapa bentuk yang perlu diperiksa ulang.',
        incomplete: 'Lihat kembali bentuk-bentuk yang ada pada bangunan.',
      },
    },
    application: {
      title: 'Terapkan Ilmu di Konteks Baru',
      intro: 'Temukan bangun datar yang ada di sekitar benda',
      prompt: 'Pilih bangun datar yang paling cocok dengan benda yang kamu amati.',
      context: 'Benda-benda yang ada di sekitar rumah dan bangunan bersejarah.',
      images: [
        { src: '/assets/qr/komik-2/13-objek-1.jpeg', alt: 'Bentuk persegi', label: 'Persegi', description: 'Perhatikan sisi dan sudutnya.' },
        { src: '/assets/qr/komik-2/17-objek-3.jpeg', alt: 'Bentuk segitiga', label: 'Segitiga', description: 'Perhatikan sisi dan sudutnya.' },
      ],
      options: [
        { value: 'Persegi', label: 'Persegi' },
        { value: 'Segitiga', label: 'Segitiga' },
        { value: 'Lingkaran', label: 'Lingkaran' },
      ],
    },
    argumentation: {
      questions: [
        {
          id: 'komik3-arg-1',
          templePart: 'bagian depan rumah',
          question: 'Mengapa bentuk bagian depan rumah bisa dipahami sebagai persegi?',
          photoSrc: '/assets/qr/komik-2/13-objek-1.jpeg',
          photoAlt: 'Bagian depan rumah',
          shapeName: 'Persegi',
          shapeKey: 'persegi',
          shapeSrc: '/images/navigation/default.svg',
          highlightColor: 'border-primary-500',
        },
      ],
    },
    resolution: {
      missions: [
        {
          id: 1,
          title: 'Misi 1 · Luas Persegi',
          part: 'Bagian Depan',
          shape: 'Persegi',
          prompt: 'Sebuah persegi memiliki panjang sisi 4 cm. Berapakah luasnya?',
          options: [
            { key: 'A', label: '8 cm²' },
            { key: 'B', label: '12 cm²' },
            { key: 'C', label: '16 cm²' },
            { key: 'D', label: '20 cm²' },
          ],
          correctKey: 'C',
          answer: '16 cm²',
          formula: 'L = s × s = 4 × 4 = 16 cm²',
          explanation: 'Luas persegi dihitung dari sisi dikali sisi.',
          aiHint: 'Ingat rumus luas persegi.',
          context: 'Bentuk yang kamu lihat pada bangunan rumah.',
          accent: 'from-primary-600 to-primary-700',
          illustration: '/images/navigation/default.svg',
        },
      ],
    },
    introspection: {
      checklist: [
        'Saya dapat mengenali bentuk bangun datar sederhana.',
        'Saya tahu perbedaan persegi dan segitiga.',
        'Saya lebih percaya diri mengamati benda di sekitar.',
      ],
      completionMessage: 'Kamu telah menyelesaikan pembelajaran pada komik ini.',
      nextPrompt: 'Kamu bisa mengulang lagi bila ingin lebih percaya diri.',
    },
    report: {
      summary: 'Laporan ini menampilkan hasil pemahamanmu terhadap bangun datar sederhana.',
      learnedShapes: ['Persegi', 'Segitiga'],
    },
  };
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
        qrImage: '/assets/qr/komik-1/13-kubus.jpeg',
        objectImage: '/images/identification/komik1-soal1.jpg',
        modelUrl: 'https://modelviewer.dev/examples/scenegraph/index.html',
        embedUrl: 'https://modelviewer.dev/examples/scenegraph/index.html',
        viewerType: 'embed',
        provider: 'ModelViewer',
        aiPrompt: 'Jelaskan objek ini menggunakan bahasa sederhana.',
        question: 'Apa yang dapat kamu amati dari objek ini?',
        answer: 'Objek ini memiliki bentuk yang bisa dijelaskan dengan matematika.',
        feedback: 'Bagus, kamu sudah mengamati objek dengan baik.',
      },
    ],
    qrCode: [{ id: `generic-${comicId}-qr`, imageSrc: '/assets/qr/komik-1/13-kubus.jpeg', alt: 'QR generik', label: 'Objek', description: 'QR untuk membuka model 3D generik.' }],
    model3D: [{ id: `generic-${comicId}-model`, title: 'Model 3D', arUrl: 'https://modelviewer.dev/examples/scenegraph/index.html', page: 1, description: 'Model 3D generik.' }],
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
