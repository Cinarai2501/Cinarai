import type { ClassifiedQr } from '@/services/comic-assets/types';

/**
 * Hasil QR Classifier per komik.
 * Sumber: audit Comic Asset Pipeline + QR Classifier.
 * Tidak perlu scan PDF ulang — data ini adalah sumber tunggal untuk metadata.
 */
export const COMIC_QR_DATA: Record<number, { pageCount: number; qrList: ClassifiedQr[] }> = {
  1: {
    pageCount: 37,
    qrList: [
      {
        page: 5,
        category: 'MODEL_3D',
        value: 'https://sketchfab.com/3d-models/candi-jawi-with-precision-geometry-83da3450467747fda7872c5a9392ffac',
        image: '',
        title: 'Candi Jawi',
        description: 'Model 3D Candi Jawi secara utuh. Amati seluruh bagian candi dan temukan bangun ruang yang tersembunyi di dalamnya.',
        previewImage: '/comics/komik-1/cover.png',
        qrUrl: 'https://sketchfab.com/3d-models/candi-jawi-with-precision-geometry-83da3450467747fda7872c5a9392ffac',
      },
      {
        page: 13,
        category: 'MODEL_3D',
        value: 'https://asblr.com/2DCN6k',
        image: '',
        title: 'Kubus',
        description: 'Bangun ruang dengan 6 sisi persegi yang sama besar. Temukan bagian Candi Jawi yang menyerupai kubus.',
        previewImage: '/images/identification/komik1-soal2.jpg',
        qrUrl: 'https://asblr.com/2DCN6k',
        qrImage: '/assets/qr/komik-1/13-kubus.jpeg',
      },
      {
        page: 16,
        category: 'MODEL_3D',
        value: 'https://asblr.com/KjCtQB',
        image: '',
        title: 'Balok',
        description: 'Bangun ruang dengan 6 sisi persegi panjang. Tubuh utama Candi Jawi dapat dimodelkan sebagai balok.',
        previewImage: '/images/identification/komik1-soal1.jpg',
        qrUrl: 'https://asblr.com/KjCtQB',
        qrImage: '/assets/qr/komik-1/16-balok.jpeg',
      },
      {
        page: 17,
        category: 'MODEL_3D',
        value: 'https://asblr.com/3oXoRI',
        image: '',
        title: 'Limas',
        description: 'Bangun ruang dengan alas persegi dan 4 sisi segitiga yang bertemu di satu titik puncak. Mirip dengan atap bertingkat candi.',
        previewImage: '/images/identification/komik1-soal4.jpg',
        qrUrl: 'https://asblr.com/3oXoRI',
        qrImage: '/assets/qr/komik-1/17-limas.jpeg',
      },
      {
        page: 22,
        category: 'MODEL_3D',
        value: 'https://asblr.com/pxMwEe',
        image: '',
        title: 'Prisma',
        description: 'Bangun ruang dengan dua alas sejajar berbentuk segitiga dan tiga sisi persegi panjang. Ditemukan pada bagian dinding candi.',
        previewImage: '/images/identification/komik1-soal5.jpg',
        qrUrl: 'https://asblr.com/pxMwEe',
        qrImage: '/assets/qr/komik-1/22-prisma.jpeg',
      },
      {
        page: 23,
        category: 'MODEL_3D',
        value: 'https://asblr.com/UyBHgG',
        image: '',
        title: 'Balok Selasar',
        description: 'Balok yang membentuk selasar atau lorong pada Candi Jawi. Perhatikan perbedaan ukuran panjang, lebar, dan tingginya.',
        previewImage: '/images/identification/komik1-soal1.jpg',
        qrUrl: 'https://asblr.com/UyBHgG',
        qrImage: '/assets/qr/komik-1/23-balok-selasar.jpeg',
      },
      {
        page: 27,
        category: 'MODEL_3D',
        value: 'https://asblr.com/xCZJvU',
        image: '',
        title: 'Limas Tepi',
        description: 'Limas yang berada di bagian tepi atau sudut Candi Jawi. Amati bentuk alasnya dan jumlah sisi segitiganya.',
        previewImage: '/images/identification/komik1-soal4.jpg',
        qrUrl: 'https://asblr.com/xCZJvU',
        qrImage: '/assets/qr/komik-1/27-limas-tepi.jpeg',
      },
      {
        page: 28,
        category: 'MODEL_3D',
        value: 'https://asblr.com/G3F41T',
        image: '',
        title: 'Kerucut',
        description: 'Bangun ruang dengan alas lingkaran dan meruncing ke satu titik puncak. Puncak Candi Jawi menyerupai kerucut.',
        previewImage: '/images/identification/komik1-soal3.jpg',
        qrUrl: 'https://asblr.com/G3F41T',
        qrImage: '/assets/qr/komik-1/28-kerucut.jpeg',
      },
      { page: 36, category: 'VIDEO', value: 'https://youtu.be/I0lhxppFlsc?si=Vd68k8UyfsenJ1rj', image: '' },
    ],
  },
  2: {
    pageCount: 32,
    qrList: [
      { page: 13, category: 'MODEL_3D', value: 'https://asblr.com/yvcuaW', image: '', qrUrl: 'https://asblr.com/yvcuaW', qrImage: '/assets/qr/komik-2/13-objek-1.jpeg' },
      { page: 15, category: 'MODEL_3D', value: 'https://asblr.com/MmAMdg', image: '', qrUrl: 'https://asblr.com/MmAMdg', qrImage: '/assets/qr/komik-2/15-objek-2.jpeg' },
      { page: 17, category: 'MODEL_3D', value: 'https://asblr.com/ljcPsy', image: '', qrUrl: 'https://asblr.com/ljcPsy', qrImage: '/assets/qr/komik-2/17-objek-3.jpeg' },
      { page: 18, category: 'MODEL_3D', value: 'https://asblr.com/cW7Lsm', image: '', qrUrl: 'https://asblr.com/cW7Lsm', qrImage: '/assets/qr/komik-2/18-objek-4.jpeg' },
    ],
  },
  3: {
    pageCount: 28,
    qrList: [],
  },
  4: {
    pageCount: 0,
    qrList: [],
  },
  5: {
    pageCount: 0,
    qrList: [],
  },
};
