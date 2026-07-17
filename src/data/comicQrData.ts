import type { ClassifiedQr } from '@/services/comic-assets/types';
import qrKubus from '@/features/comics/comic-1/assets/qr/kubus.png';
import qrBalok from '@/features/comics/comic-1/assets/qr/balok.png';
import qrPrisma from '@/features/comics/comic-1/assets/qr/prisma-segi-empat.png';
import qrLimas from '@/features/comics/comic-1/assets/qr/limas-segi-empat.png';
import qrKerucut from '@/features/comics/comic-1/assets/qr/kerucut.png';
import coverImg from '@/features/comics/comic-1/assets/cover/cover.png';
import appKubus from '@/features/comics/comic-1/assets/identification/Kubus.png';
import appBalok from '@/features/comics/comic-1/assets/identification/Balok.png';
import appPrisma from '@/features/comics/comic-1/assets/identification/Prismasegiempat.png';
import appLimas from '@/features/comics/comic-1/assets/identification/Limassegiempat.png';
import appKerucut from '@/features/comics/comic-1/assets/identification/Kerucut.png';
import comic2Qr13 from '@/features/comics/comic-2/assets/qr/13-objek-1.jpeg';
import comic2Qr15 from '@/features/comics/comic-2/assets/qr/15-objek-2.jpeg';
import comic2Qr17 from '@/features/comics/comic-2/assets/qr/17-objek-3.jpeg';
import comic2Qr18 from '@/features/comics/comic-2/assets/qr/18-objek-4.jpeg';

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
        previewImage: coverImg.src,
        qrUrl: 'https://sketchfab.com/3d-models/candi-jawi-with-precision-geometry-83da3450467747fda7872c5a9392ffac',
      },
      {
        page: 13,
        category: 'MODEL_3D',
        value: 'https://asblr.com/2DCN6k',
        image: '',
        title: 'Kubus',
        description: 'Bangun ruang dengan 6 sisi persegi yang sama besar. Temukan bagian Candi Jawi yang menyerupai kubus.',
        previewImage: appKubus.src,
        qrUrl: 'https://asblr.com/2DCN6k',
        qrImage: qrKubus.src,
      },
      {
        page: 16,
        category: 'MODEL_3D',
        value: 'https://asblr.com/KjCtQB',
        image: '',
        title: 'Balok',
        description: 'Bangun ruang dengan 6 sisi persegi panjang. Tubuh utama Candi Jawi dapat dimodelkan sebagai balok.',
        previewImage: appBalok.src,
        qrUrl: 'https://asblr.com/KjCtQB',
        qrImage: qrBalok.src,
      },
      {
        page: 17,
        category: 'MODEL_3D',
        value: 'https://asblr.com/3oXoRI',
        image: '',
        title: 'Limas',
        description: 'Bangun ruang dengan alas persegi dan 4 sisi segitiga yang bertemu di satu titik puncak. Mirip dengan atap bertingkat candi.',
        previewImage: appLimas.src,
        qrUrl: 'https://asblr.com/3oXoRI',
        qrImage: qrLimas.src,
      },
      {
        page: 22,
        category: 'MODEL_3D',
        value: 'https://asblr.com/pxMwEe',
        image: '',
        title: 'Prisma',
        description: 'Bangun ruang dengan dua alas sejajar berbentuk segitiga dan tiga sisi persegi panjang. Ditemukan pada bagian dinding candi.',
        previewImage: appPrisma.src,
        qrUrl: 'https://asblr.com/pxMwEe',
        qrImage: qrPrisma.src,
      },
      {
        page: 23,
        category: 'MODEL_3D',
        value: 'https://asblr.com/UyBHgG',
        image: '',
        title: 'Balok Selasar',
        description: 'Balok yang membentuk selasar atau lorong pada Candi Jawi. Perhatikan perbedaan ukuran panjang, lebar, dan tingginya.',
        previewImage: appBalok.src,
        qrUrl: 'https://asblr.com/UyBHgG',
        qrImage: qrBalok.src,
      },
      {
        page: 27,
        category: 'MODEL_3D',
        value: 'https://asblr.com/xCZJvU',
        image: '',
        title: 'Limas Tepi',
        description: 'Limas yang berada di bagian tepi atau sudut Candi Jawi. Amati bentuk alasnya dan jumlah sisi segitiganya.',
        previewImage: appLimas.src,
        qrUrl: 'https://asblr.com/xCZJvU',
        qrImage: qrLimas.src,
      },
      {
        page: 28,
        category: 'MODEL_3D',
        value: 'https://asblr.com/G3F41T',
        image: '',
        title: 'Kerucut',
        description: 'Bangun ruang dengan alas lingkaran dan meruncing ke satu titik puncak. Puncak Candi Jawi menyerupai kerucut.',
        previewImage: appKerucut.src,
        qrUrl: 'https://asblr.com/G3F41T',
        qrImage: qrKerucut.src,
      },
      { page: 36, category: 'VIDEO', value: 'https://youtu.be/I0lhxppFlsc?si=Vd68k8UyfsenJ1rj', image: '' },
    ],
  },
  2: {
    pageCount: 32,
    qrList: [
      { page: 13, category: 'MODEL_3D', value: 'https://asblr.com/yvcuaW', image: '', qrUrl: 'https://asblr.com/yvcuaW', qrImage: comic2Qr13.src },
      { page: 15, category: 'MODEL_3D', value: 'https://asblr.com/MmAMdg', image: '', qrUrl: 'https://asblr.com/MmAMdg', qrImage: comic2Qr15.src },
      { page: 17, category: 'MODEL_3D', value: 'https://asblr.com/ljcPsy', image: '', qrUrl: 'https://asblr.com/ljcPsy', qrImage: comic2Qr17.src },
      { page: 18, category: 'MODEL_3D', value: 'https://asblr.com/cW7Lsm', image: '', qrUrl: 'https://asblr.com/cW7Lsm', qrImage: comic2Qr18.src },
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
