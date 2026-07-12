import { Comic1Module } from './comic-1';
import { Comic2Module } from './comic-2';
import { Comic3Module } from './comic-3';
import { Comic4Module } from './comic-4';
import { Comic5Module } from './comic-5';

export type { ComicModule, ComicModuleLike } from './types';

export const comicModules = {
  1: Comic1Module,
  2: Comic2Module,
  3: Comic3Module,
  4: Comic4Module,
  5: Comic5Module,
} as const;

export function getComicModule(comicId: number) {
  const comicModule = comicModules[comicId as keyof typeof comicModules];
  if (comicModule) {
    return comicModule;
  }

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
    navigation: {
      learningObjects: [],
      qrCode: [],
      model3D: [],
    },
    identification: {
      questions: [],
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
      images: [],
      options: [],
    },
    argumentation: {
      questions: [],
    },
    resolution: {
      missions: [],
    },
    introspection: {
      checklist: [],
      completionMessage: 'Pembelajaran selesai.',
      nextPrompt: 'Lanjutkan ke tahap berikutnya.',
    },
    report: {
      summary: 'Laporan generik untuk pembelajaran CINARAI.',
      learnedShapes: [],
    },
    ai: {
      navigation: 'Jelaskan objek yang diamati dengan bahasa sederhana.',
      objectTutor: 'Bantu siswa memahami bentuk dan ciri objek dengan santai.',
      application: 'Bimbing siswa menghubungkan objek dengan konteks baru.',
      argumentation: 'Beri umpan balik tentang alasan siswa.',
      resolution: 'Bantu siswa menyelesaikan soal numerasi.',
      introspection: 'Buat refleksi singkat dan positif.',
    },
    assets: {
      qrCode: [],
      model3D: [],
    },
    objects: [],
  };
}

export function loadComicModule(comicId: number) {
  return getComicModule(comicId);
}
