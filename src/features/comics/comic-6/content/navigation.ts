import type { ComicContentPackageLike } from '../../types';
import menaraImage from '../assets/navigation/menaramasjid.png';
import kubahImage from '../assets/navigation/kubahmasjid.png';
import ruangUtamaImage from '../assets/navigation/ruangutama.png';
import tempatWudhuImage from '../assets/navigation/tempatwudhu.png';

function assetSrc(asset: { src: string } | string): string {
  return typeof asset === 'string' ? asset : asset.src;
}

const navigationObjects: ComicContentPackageLike['learningObjects'] = [
  {
    id: 'komik6-navigation-menara',
    title: 'Menara Masjid',
    description: 'Amati menara Masjid Al-Akbar. Bentuknya menyerupai tabung.',
    page: 11,
    navImage: assetSrc(menaraImage),
    observationQuestion: 'Menara Masjid Al-Akbar menyerupai bangun ruang apa?',
    question: 'Menara Masjid Al-Akbar menyerupai bangun ruang apa?',
    answer: 'Tabung',
    feedback: 'Benar! Menara menyerupai tabung.',
    simpleExplanation: 'Tabung memiliki dua sisi berbentuk lingkaran dan satu sisi selimut.',
    characteristics: ['3 sisi', '2 rusuk', '2 sisi berbentuk lingkaran', '1 sisi selimut'],
    shapeKey: 'tabung',
    shapeName: 'Tabung',
  },
  {
    id: 'komik6-navigation-kubah',
    title: 'Kubah Masjid',
    description: 'Amati bagian atas dan bawah kubah. Keduanya memiliki bentuk bangun ruang yang berbeda.',
    page: 12,
    navImage: assetSrc(kubahImage),
    observationQuestion: 'Bagian atas dan bawah kubah menyerupai bangun ruang apa?',
    shapes: ['Kerucut', 'Setengah bola'],
    shapeKey: 'kerucut-setengah-bola',
    shapeName: 'Kerucut & Setengah Bola',
    characteristics: ['Atas: 2 sisi, 1 rusuk, 1 titik puncak', 'Bawah: sisi lengkung', 'Setengah bola tidak memiliki titik sudut'],
  },
  {
    id: 'komik6-navigation-ruang-utama',
    title: 'Ruang Utama',
    description: 'Amati bagian utama Masjid Al-Akbar dan perhatikan bentuk ruangnya.',
    page: 13,
    navImage: assetSrc(ruangUtamaImage),
    observationQuestion: 'Bagian utama masjid menyerupai bangun ruang apa?',
    question: 'Bagian utama masjid menyerupai bangun ruang apa?',
    answer: 'Balok',
    feedback: 'Benar! Bagian utama masjid menyerupai balok.',
    simpleExplanation: 'Balok memiliki 6 sisi, 12 rusuk, dan 8 titik sudut.',
    characteristics: ['6 sisi', '12 rusuk', '8 titik sudut'],
    shapeKey: 'balok',
    shapeName: 'Balok',
  },
  {
    id: 'komik6-navigation-tempat-wudhu',
    title: 'Tempat Wudhu',
    description: 'Amati tempat duduk wudhu dan perhatikan bentuknya.',
    page: 14,
    navImage: assetSrc(tempatWudhuImage),
    observationQuestion: 'Tempat duduk wudhu menyerupai bangun ruang apa?',
    question: 'Tempat duduk wudhu menyerupai bangun ruang apa?',
    answer: 'Kubus',
    feedback: 'Benar! Tempat duduk wudhu menyerupai kubus.',
    simpleExplanation: 'Kubus memiliki 6 sisi berbentuk persegi, 12 rusuk sama panjang, dan 8 titik sudut.',
    characteristics: ['6 sisi berbentuk persegi', '12 rusuk sama panjang', '8 titik sudut'],
    shapeKey: 'kubus',
    shapeName: 'Kubus',
  },
];

export const navigation = {
  learningObjects: navigationObjects,
  qrCode: [],
  model3D: [],
};
