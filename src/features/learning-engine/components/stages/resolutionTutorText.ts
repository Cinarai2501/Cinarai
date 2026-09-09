export interface ResolutionTutorMission {
  shape: string;
  formula?: string;
  context: string;
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
