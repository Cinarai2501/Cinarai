export interface ResolutionTutorMission {
  shape: string;
  formula?: string;
  context: string;
  object?: string;
  comicId?: number;
}

export const COMIC_6_RESOLUTION_TUTOR_SYSTEM_PROMPT = 'Kamu adalah AI Tutor untuk Komik 6 tentang bangun ruang di Masjid Al-Akbar Surabaya. Jawablah hanya berdasarkan materi Komik 6 dan konteks soal yang sedang dikerjakan. Jangan mengganti bangun ruang yang sedang dibahas. Jangan memberikan rumus volume atau luas jika tidak diminta dan tidak terdapat dalam materi. Jika siswa meminta materi di luar konteks Komik 6, arahkan kembali ke materi bangun ruang Komik 6.';

function buildComic6Explanation(mission: ResolutionTutorMission, isCorrect: boolean): string {
  const shapeFacts: Record<string, string> = {
    tabung: 'Tabung memiliki sisi atas dan alas berbentuk lingkaran, sisi selimut, dan 2 rusuk.',
    kerucut: 'Kerucut memiliki 2 sisi, 1 rusuk, dan 1 titik puncak.',
    balok: 'Balok memiliki 6 sisi berbentuk persegi panjang, 12 rusuk, dan 8 titik sudut.',
    kubus: 'Kubus memiliki 6 sisi berbentuk persegi, 12 rusuk sama panjang, dan 8 titik sudut.',
    'setengah bola': 'Setengah bola memiliki sisi lengkung, bagian yang tertutup, dan tidak memiliki titik sudut.',
  };
  const facts = shapeFacts[mission.shape.toLowerCase()] ?? `Perhatikan ciri ${mission.shape} pada materi Komik 6.`;
  const object = mission.object ? `${mission.object} menyerupai ${mission.shape}.` : `Soal ini membahas ${mission.shape}.`;

  return [
    isCorrect ? 'Jawabanmu benar.' : 'Belum tepat. Mari kita perhatikan ciri bangunnya.',
    '',
    object,
    facts,
    '',
    isCorrect
      ? 'Ciri tersebut sesuai dengan jawaban pada soal.'
      : `Bandingkan ciri itu dengan pilihanmu. ${mission.shape} bukan bangun ruang lain.`,
  ].join('\n');
}

function getVariableLegend(mission: ResolutionTutorMission): string[] {
  const shape = mission.shape.toLowerCase();

  if (shape === 'panjang lintasan') {
    return ['Panjang lintasan = jumlah langkah × panjang langkah'];
  }

  if (shape === 'jumlah langkah') {
    return ['Bandingkan jumlah langkah dari yang terbesar ke yang terkecil'];
  }

  if (shape === 'membandingkan data') {
    return ['Angka terbesar menunjukkan jumlah terbanyak', 'Angka terkecil menunjukkan jumlah tersedikit'];
  }

  if (shape === 'kubus') {
    return ['V = Volume', 's = panjang rusuk kubus'];
  }

  if (shape === 'balok') {
    return ['V = Volume', 'p = Panjang', 'l = Lebar', 't = Tinggi'];
  }

  if (shape === 'prisma segi empat') {
    return ['V = Volume', 'Luas Alas = luas bidang alas', 'Tinggi = tinggi prisma'];
  }

  if (shape === 'limas segi empat') {
    return ['V = Volume', 'Luas Alas = luas bidang alas', 'Tinggi = tinggi limas'];
  }

  if (shape === 'kerucut') {
    return ['V = Volume', 'π = 22/7', 'r = jari-jari alas', 't = tinggi kerucut'];
  }

  return ['V = Volume', 'Gunakan variabel yang sesuai dari soal'];
}

export function buildResolutionTutorExplanation(mission: ResolutionTutorMission, isCorrect: boolean): string {
  if (mission.comicId === 6) {
    return buildComic6Explanation(mission, isCorrect);
  }

  const formula = mission.formula || 'V = ...';
  const isBridgeMeasurement = ['panjang lintasan', 'jumlah langkah', 'membandingkan data'].includes(mission.shape.toLowerCase());
  if (isBridgeMeasurement) {
    const variableLegend = getVariableLegend(mission);
    return [
      isCorrect ? '✨ Jawabanmu benar. Bagus sekali!' : '💡 Jawabanmu belum tepat. Mari kita periksa datanya.',
      '',
      `Materi Jembatan Merah: ${mission.shape}`,
      '',
      `Rumus/perbandingan: ${formula}`,
      '',
      'Petunjuk:',
      ...variableLegend,
      '',
      isCorrect
        ? 'Kamu sudah menggunakan data Jembatan Merah dengan tepat. Lanjutkan ke misi berikutnya.'
        : 'Baca kembali angka dan hubungan antar data, lalu coba pilih jawaban lagi.',
    ].join('\n');
  }
  const candiConnection = mission.context.includes('Candi Jawi')
    ? 'Hubungkan pemahamanmu dengan bentuk bangun ruang yang sering terlihat pada struktur arsitektur Candi Jawi.'
    : 'Hubungkan pemahamanmu dengan sifat bangun ruang yang sedang dipelajari.';
  const variableLegend = getVariableLegend(mission);

  if (isCorrect) {
    return [
      '✨ Jawabanmu benar. Bagus sekali!',
      '',
      `Bangun ruang: ${mission.shape}`,
      '',
      `Rumus Volume: ${formula}`,
      '',
      'Kenapa rumus ini dipakai?',
      'Karena bangun ruang ini memiliki ukuran utama yang sesuai dengan rumus volume yang digunakan untuk mengukur isi ruangnya.',
      '',
      'Keterangan:',
      ...variableLegend,
      '',
      'Peran rumus ini adalah membantu kamu memahami hubungan antara bentuk bangun ruang dan cara menghitung volumenya.',
      '',
      candiConnection,
      '',
      'Kamu sudah memahami konsep yang tepat. Lanjutkan dengan percaya diri.',
    ].join('\n');
  }

  return [
    '💡 Jawabanmu belum tepat. Mari kita perbaiki pemahamanmu.',
    '',
    `Bangun ruang: ${mission.shape}`,
    '',
    `Rumus Volume: ${formula}`,
    '',
    'Keterangan:',
    ...variableLegend,
    '',
    'Masukkan nilai yang ada pada soal ke dalam rumus tersebut, lalu hitung hasilnya sendiri secara bertahap.',
    '',
    'Fokuslah pada nama bangun ruang, rumus yang sesuai, dan arti setiap variabel sebelum memilih jawaban.',
    '',
    candiConnection,
    '',
    'Coba lagi dengan langkah yang lebih hati-hati.',
  ].join('\n');
}
