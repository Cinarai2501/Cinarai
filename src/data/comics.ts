// Data ini adalah fallback lokal. Single source of truth ada di Firestore (collection: comics).
// Perbarui via: npm run seed
// Data bersumber dari isi PDF masing-masing komik.

import type { Comic, ComicStage } from '@/types/comic';

const BASE = '/comics';
const BASE_AVATAR = '/assets/avatars';

const DEFAULT_STAGES: ComicStage[] = ['comic', 'quiz', 'ar', 'reflection'];

export const COMICS: Comic[] = [
  // ── Komik 1 ──────────────────────────────────────────────────────────────
  // Sumber: public/comics/komik-1/comic.pdf
  // Tokoh (hal. 9): Kak Najwa, Aris, Ara
  {
    id: 1,
    slug: 'komik-1',
    title: 'Petualangan Bangun Ruang Candi Jawi',
    subtitle: 'Etnomatematika Bangun Ruang',
    kelas: 'VI',
    lokasi: 'Candi Jawi, Pasuruan',
    synopsis:
      'Aris dan Ara mengikuti tur edukasi ke Candi Jawi di Prigen, Pasuruan, dipandu oleh Kak Najwa. Awalnya Aris merasa tur ini akan membosankan dan mengaku tidak suka matematika. Namun Kak Najwa memperkenalkan tablet AR yang mampu menampilkan bentuk asli candi secara tiga dimensi. Melalui petualangan di dunia AR, mereka menjelajahi lima bangun ruang yang tersembunyi di arsitektur candi: kubus, balok, prisma segi empat, limas segi empat, dan kerucut. Setiap bangun ruang dipelajari melalui tantangan menghitung volume. Ketika tablet tiba-tiba error, Kak Najwa mengajarkan bahwa nenek moyang kita pun bisa membangun candi megah hanya dengan mata dan tangan. Dari hari itu, Aris dan Ara tidak lagi takut matematika.',
    characters: [
      {
        name: 'Kak Najwa',
        description: 'Tour guide pendidikan Candi Jawi, perempuan, ramah, dan ahli matematika.',
        avatar: `${BASE_AVATAR}/kak-najwa.png`,
      },
      {
        name: 'Aris',
        description: 'Anak laki-laki SD aktif, tetapi kurang suka matematika.',
        avatar: `${BASE_AVATAR}/aris.png`,
      },
      {
        name: 'Ara',
        description: 'Anak perempuan SD, rajin dan benar tetapi pemalu.',
        avatar: `${BASE_AVATAR}/ara.png`,
      },
    ],
    learningTargets: [
      'Mengidentifikasi dan menjelaskan ciri-ciri bangun ruang (kubus, balok, prisma, limas, dan kerucut) melalui pengamatan arsitektur Candi Jawi',
      'Menghitung volume beberapa jenis bangun ruang (kubus, balok, prisma, limas, dan kerucut)',
      'Mengonstruksi model sederhana bangun ruang dan mengaitkannya dengan unsur arsitektur Candi Jawi',
      'Memahami visualisasi spasial bangun ruang dari berbagai sisi',
    ],
    estimatedMinutes: 30,
    pdfPath: `${BASE}/komik-1/comic.pdf`,
    cover: `${BASE}/komik-1/cover.png`,
    thumbnail: `${BASE}/komik-1/thumbnail.png`,
    stages: DEFAULT_STAGES,
    availability: 'ACTIVE',
  },

  // ── Komik 2 ──────────────────────────────────────────────────────────────
  // Sumber: public/comics/komik-2/comic.pdf
  // Tokoh (hal. 9): Wili, Miya, Kara
  {
    id: 2,
    slug: 'komik-2',
    title: 'Petualangan Simetri Candi Penataran',
    subtitle: 'Etnomatematika Bangun Datar: Simetri Lipat dan Simetri Putar',
    kelas: 'V',
    lokasi: 'Candi Penataran, Blitar',
    synopsis:
      'Wili, Miya, dan Kara mengunjungi Candi Penataran di Blitar — kompleks candi Hindu terbesar di Jawa Timur yang dibangun pada masa Kerajaan Majapahit. Wili dan Miya bersemangat menemukan rahasia matematika di balik arsitektur candi, sementara Kara awalnya skeptis. Mereka menjelajahi berbagai bangun datar pada struktur candi: persegi pada alas umpang, persegi panjang pada Bale Agung, segitiga pada atap, dan trapesium pada relief. Melalui pengamatan langsung, mereka memahami konsep simetri lipat dan simetri putar yang tersembunyi di setiap sudut candi. Kara yang awalnya tidak percaya akhirnya ikut belajar dan memahami bahwa arsitektur kuno menyimpan kecerdasan matematika yang luar biasa.',
    characters: [
      {
        name: 'Wili',
        description: 'Anak laki-laki kelas 5 SD yang pintar dan penasaran. Berani, sabar, dan suka membantu teman. Menjadi pemimpin dalam petualangan.',
        avatar: `${BASE_AVATAR}/wili.png`,
      },
      {
        name: 'Miya',
        description: 'Anak perempuan kelas 5 SD yang ceria dan kreatif. Suka menggambar dan membantu Wili dengan ide-ide lucu. Ramah dan cepat berpikir.',
        avatar: `${BASE_AVATAR}/miya.png`,
      },
      {
        name: 'Kara',
        description: 'Anak perempuan kelas 5 SD yang suka bercanda dan tidak suka pelajaran matematika. Namun pada akhirnya mau belajar bersama Wili dan Miya.',
        avatar: `${BASE_AVATAR}/kara.png`,
      },
    ],
    learningTargets: [
      'Mengidentifikasi dan mengenali berbagai bentuk bangun datar pada relief dan arsitektur Candi Penataran',
      'Menjelaskan konsep simetri lipat dan simetri putar pada bangun datar',
      'Menghitung luas bangun datar (persegi, persegi panjang, dan segitiga) menggunakan contoh nyata dari candi',
      'Bekerja sama dan berdiskusi dalam kelompok untuk memecahkan masalah matematika',
    ],
    estimatedMinutes: 30,
    pdfPath: `${BASE}/komik-2/comic.pdf`,
    cover: `${BASE}/komik-2/cover.png`,
    thumbnail: `${BASE}/komik-2/thumbnail.png`,
    stages: DEFAULT_STAGES,
    availability: 'ACTIVE',
  },

  // ── Komik 3 ──────────────────────────────────────────────────────────────
  // Sumber: public/comics/komik-3/comic.pdf
  // Tokoh (hal. 5): Bu Rere, Damar, Bima, Sari
  // Sinopsis tersurat di hal. 4
  {
    id: 3,
    slug: 'komik-3',
    title: 'Petualangan di Rumah Gajah Mungkur',
    subtitle: 'Etnomatematika Bangun Datar — Kelas II SD',
    kelas: 'II',
    lokasi: 'Rumah Gajah Mungkur, Gresik',
    synopsis:
      'Tiga murid kelas 2 SD — Damar, Bima, dan Sari — merasa matematika membosankan. Bu Rere lalu mengajak mereka belajar di Rumah Gajah Mungkur, bangunan bersejarah di Gresik yang dibangun sejak tahun 1896 oleh Haji Djaelani. Rumah ini memadukan tiga kebudayaan: Eropa, Tionghoa, dan Jawa, dengan patung gajah yang membelakangi di depan pintu utama. Di sana, mereka menjadi "Detektif Bangun Datar" dan mencari bentuk-bentuk seperti persegi, persegi panjang, segitiga, trapesium, belah ketupat, jajargenjang, hingga lingkaran pada bangunan bersejarah tersebut. Awalnya bingung membedakan bentuk yang mirip, ketiganya akhirnya paham berkat bimbingan Bu Rere dan kerja sama mereka.',
    characters: [
      {
        name: 'Bu Rere',
        description: 'Guru matematika kelas II SD yang kreatif dan mengajak siswa belajar di luar kelas.',
        avatar: `${BASE_AVATAR}/bu-rere.png`,
      },
      {
        name: 'Damar',
        description: 'Siswa yang jeli dan suka tantangan.',
        avatar: `${BASE_AVATAR}/damar.png`,
      },
      {
        name: 'Bima',
        description: 'Siswa yang suka bersaing, terburu-buru, ingin jadi yang terbaik, kurang teliti.',
        avatar: `${BASE_AVATAR}/bima.png`,
      },
      {
        name: 'Sari',
        description: 'Siswi yang teliti, suka bekerja sama, sabar, dan perhatian pada teman.',
        avatar: `${BASE_AVATAR}/sari.png`,
      },
    ],
    learningTargets: [
      'Menyebutkan berbagai bentuk bangun datar dan menemukannya pada benda-benda di sekitar',
      'Mengenal berbagai bangun datar (segitiga, segiempat, segibanyak, lingkaran)',
      'Menyusun (komposisi) dan mengurai (dekomposisi) suatu bangun datar',
      'Menentukan posisi benda terhadap benda lain (kanan, kiri, depan, belakang)',
    ],
    estimatedMinutes: 25,
    pdfPath: `${BASE}/komik-3/comic.pdf`,
    cover: `${BASE}/komik-3/cover.png`,
    thumbnail: `${BASE}/komik-3/thumbnail.png`,
    stages: DEFAULT_STAGES,
    availability: 'ACTIVE',
  },

  // ── Komik 4 ──────────────────────────────────────────────────────────────
  // PDF belum tersedia
  {
    id: 4,
    slug: 'komik-4',
    title: 'Petualangan di Jembatan Merah',
    subtitle: 'Etnomatematika Pengukuran',
    kelas: 'IV',
    lokasi: 'Jembatan Merah, Surabaya',
    synopsis: 'Komik ini sedang dalam persiapan. Data akan diperbarui setelah PDF tersedia.',
    characters: [],
    learningTargets: [],
    estimatedMinutes: 30,
    pdfPath: null,
    cover: `${BASE}/komik-4/cover.png`,
    thumbnail: `${BASE}/komik-4/thumbnail.png`,
    stages: DEFAULT_STAGES,
    availability: 'COMING_SOON',
  },

  // ── Komik 5 ──────────────────────────────────────────────────────────────
  // PDF belum tersedia
  {
    id: 5,
    slug: 'komik-5',
    title: 'Serunya Belajar Bangun Datar di Keraton Sumenep',
    subtitle: 'Etnomatematika Bangun Datar',
    kelas: 'II',
    lokasi: 'Keraton Sumenep, Madura',
    synopsis: 'Komik ini sedang dalam persiapan. Data akan diperbarui setelah PDF tersedia.',
    characters: [],
    learningTargets: [],
    estimatedMinutes: 25,
    pdfPath: null,
    cover: `${BASE}/komik-5/cover.png`,
    thumbnail: `${BASE}/komik-5/thumbnail.png`,
    stages: DEFAULT_STAGES,
    availability: 'COMING_SOON',
  },
];
