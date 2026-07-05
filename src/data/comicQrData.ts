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
      { page: 5,  category: 'MODEL_3D', value: 'https://sketchfab.com/3d-models/candi-jawi-with-precision-geometry-83da3450467747fda7872c5a9392ffac', image: '', title: 'Candi Jawi' },
      { page: 13, category: 'MODEL_3D', value: 'https://asblr.com/2DCN6k',                          image: '', title: 'Kubus Dinda' },
      { page: 16, category: 'MODEL_3D', value: 'https://asblr.com/KjCtQB',                          image: '', title: 'Balok' },
      { page: 17, category: 'MODEL_3D', value: 'https://asblr.com/3oXoRI',                          image: '', title: 'Limas' },
      { page: 22, category: 'MODEL_3D', value: 'https://asblr.com/pxMwEe',                          image: '', title: 'Kubus' },
      { page: 23, category: 'MODEL_3D', value: 'https://asblr.com/UyBHgG',                          image: '', title: 'Balok Selasar' },
      { page: 27, category: 'MODEL_3D', value: 'https://asblr.com/xCZJvU',                          image: '', title: 'Limas Tepi' },
      { page: 28, category: 'MODEL_3D', value: 'https://asblr.com/G3F41T',                          image: '', title: 'Kubus Langit' },
      { page: 36, category: 'VIDEO',    value: 'https://youtu.be/I0lhxppFlsc?si=Vd68k8UyfsenJ1rj', image: '' },
    ],
  },
  2: {
    pageCount: 32,
    qrList: [
      { page: 13, category: 'MODEL_3D', value: 'https://asblr.com/yvcuaW', image: '' },
      { page: 15, category: 'MODEL_3D', value: 'https://asblr.com/MmAMdg', image: '' },
      { page: 17, category: 'MODEL_3D', value: 'https://asblr.com/ljcPsy', image: '' },
      { page: 18, category: 'MODEL_3D', value: 'https://asblr.com/cW7Lsm', image: '' },
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
