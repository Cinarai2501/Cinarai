export const metadata = {
  comicId: 3,
  title: 'Komik 3',
  subtitle: 'Pembelajaran CINARAI',
  location: 'Lokasi belum ditentukan',
  classLevel: 'SD',
  cover: '/comics/komik-3/cover.png',
  thumbnail: '/comics/komik-3/thumbnail.png',
  learningTargets: [],
  synopsis: 'Konten untuk Komik 3 akan ditambahkan kemudian.',
};

const emptyNavigation = {
  learningObjects: [],
  qrCode: [],
  model3D: [],
};

const emptyIdentification = {
  questions: [],
  feedback: {
    complete: 'Kamu berhasil menyelesaikan identifikasi.',
    partial: 'Masih ada bagian yang perlu diperiksa.',
    incomplete: 'Amati objek dengan lebih teliti.',
  },
};

const emptyApplication = {
  title: 'Terapkan Ilmu di Konteks Baru',
  intro: 'Pilih objek yang paling sesuai dengan konsep yang dipelajari.',
  prompt: 'Jelaskan alasanmu terhadap objek yang kamu pilih.',
  context: 'Konteks belajar baru yang dekat dengan pengalaman siswa.',
  images: [],
  options: [],
};

const Comic3Module = {
  metadata,
  navigation: emptyNavigation,
  identification: emptyIdentification,
  argumentation: { questions: [] },
  resolution: { missions: [] },
  application: emptyApplication,
  introspection: { checklist: [], completionMessage: 'Pembelajaran selesai.', nextPrompt: 'Lanjutkan.' },
  report: { summary: 'Laporan Komik 3 belum tersedia.', learnedShapes: [] },
  ai: {
    navigation: 'Jelaskan objek yang diamati dengan bahasa sederhana.',
    objectTutor: 'Bantu siswa memahami model 3D dengan sederhana.',
    application: 'Bimbing siswa menghubungkan objek dengan konteks baru.',
    argumentation: 'Beri umpan balik tentang alasan siswa.',
    resolution: 'Bantu siswa menyelesaikan misi.',
    introspection: 'Buat refleksi singkat dan positif.',
  },
  assets: { qrCode: [], model3D: [] },
  objects: [],
};

export const Comic3ModuleExport = Comic3Module;
export default Comic3Module;
import { metadata } from './content/metadata';
import { navigation } from './content/navigation';
import { identification } from './content/identification';
import { argumentation } from './content/argumentation';
import { resolution } from './content/resolution';
import { application } from './content/application';
import { introspection } from './content/introspection';
import { report } from './content/report';
import { ai } from './content/ai';

const objects = navigation.learningObjects;
const assets = {
  qrCode: navigation.qrCode,
  model3D: navigation.model3D,
};

export const Comic3Module = {
  metadata,
  navigation,
  identification,
  argumentation,
  resolution,
  application,
  introspection,
  report,
  ai,
  assets,
  objects,
};
