export interface ShapeKnowledgeEntry {
  id: string;
  name: string;
  definition: string;
  characteristics: string[];
  faces: string;
  edges: string;
  vertices: string;
  surfaceFormula: string;
  volumeFormula: string;
  foundInTemple: boolean;
  templeLocation: string;
  comicReference: string;
  functionInBuilding: string;
  exampleObjects: string[];
  explanation: string;
  reflectionQuestion: string;
}

export const shapeKnowledge: Record<string, ShapeKnowledgeEntry> = {
  balok: {
    id: 'balok',
    name: 'Balok',
    definition: 'Balok adalah bangun ruang yang punya 6 sisi berbentuk persegi panjang.',
    characteristics: ['6 sisi', '12 rusuk', '8 titik sudut'],
    faces: '6',
    edges: '12',
    vertices: '8',
    surfaceFormula: '2(pl + pt + lt)',
    volumeFormula: 'p × l × t',
    foundInTemple: true,
    templeLocation: 'bagian tubuh utama Candi Jawi yang tampak memanjang',
    comicReference: 'Perhatikan panel komik saat tokoh mengamati badan candi yang kokoh dan tersusun rapi.',
    functionInBuilding: 'Balok sering dipakai sebagai bagian tubuh bangunan yang kuat dan kokoh.',
    exampleObjects: ['batu bata', 'kotak penyimpanan', 'rak buku'],
    explanation: 'Bentuk balok terlihat pada susunan batu yang kuat dan rapi. Pada Candi Jawi, bagian ini membantu mengamati struktur bangunan yang kokoh.',
    reflectionQuestion: 'Mengapa bagian ini lebih cocok disebut balok daripada bangun ruang lain?',
  },
  kubus: {
    id: 'kubus',
    name: 'Kubus',
    definition: 'Kubus adalah bangun ruang yang punya 6 sisi berbentuk persegi dan semua rusuk sama panjang.',
    characteristics: ['6 sisi persegi', '12 rusuk sama panjang', '8 titik sudut'],
    faces: '6',
    edges: '12',
    vertices: '8',
    surfaceFormula: '6s²',
    volumeFormula: 's³',
    foundInTemple: true,
    templeLocation: 'susunan batu pada bagian kaki candi yang tampak kotak-kotak',
    comicReference: 'Lihat kembali panel komik ketika tokoh mengamati bagian kaki candi yang kotak-kotak.',
    functionInBuilding: 'Kubus membantu menunjukkan bagian struktur yang sederhana, stabil, dan mudah disusun.',
    exampleObjects: ['dadu', 'kardus', 'kotak mainan'],
    explanation: 'Bentuk kubus terlihat pada bagian batu yang tampak seperti kotak. Pada panel komik, bagian ini membantu melihat bahwa bentuk candi tidak selalu bulat atau runcing.',
    reflectionQuestion: 'Mengapa menurutmu bagian ini paling mirip dengan kubus dibanding bangun ruang lain?',
  },
  limas: {
    id: 'limas',
    name: 'Limas',
    definition: 'Limas adalah bangun ruang yang punya satu alas dan sisi-sisi tegak berbentuk segitiga.',
    characteristics: ['satu alas', 'sisi tegak segitiga', 'puncak runcing'],
    faces: 'n + 1',
    edges: '2n',
    vertices: 'n + 1',
    surfaceFormula: 'L alas + ½ × keliling alas × t sisi',
    volumeFormula: '⅓ × luas alas × tinggi',
    foundInTemple: true,
    templeLocation: 'bagian atap candi yang meruncing ke atas',
    comicReference: 'Lihat kembali gambar atap pada komik, saat bagian puncak candi tampak runcing.',
    functionInBuilding: 'Limas membantu membentuk atap yang runcing dan terlihat tajam.',
    exampleObjects: ['atap rumah', 'menara', 'ornamen puncak'],
    explanation: 'Saat atap candi mengarah ke puncak, bentuknya mirip limas. Pada panel komik, bagian ini terlihat tajam dan stabil seperti bentuk limas.',
    reflectionQuestion: 'Mengapa menurutmu atap candi lebih cocok dibuat seperti limas?',
  },
  prisma: {
    id: 'prisma',
    name: 'Prisma',
    definition: 'Prisma adalah bangun ruang yang punya dua alas yang sama dan sisi-sisi tegak yang menghubungkan kedua alas itu.',
    characteristics: ['dua alas sama', 'sisi tegak lurus', 'bisa terlihat seperti balok panjang'],
    faces: 'n + 2',
    edges: '3n',
    vertices: '2n',
    surfaceFormula: '2 × luas alas + keliling alas × tinggi',
    volumeFormula: 'luas alas × tinggi',
    foundInTemple: true,
    templeLocation: 'bagian struktur dinding candi yang tersusun berlapis',
    comicReference: 'Perhatikan kembali panel komik saat tokoh melihat dinding dan susunan batu candi.',
    functionInBuilding: 'Prisma membantu membentuk bagian yang panjang dan berlapis seperti dinding penyangga.',
    exampleObjects: ['bungkus cokelat', 'kotak pensil panjang', 'tiang beraturan'],
    explanation: 'Bentuk prisma membantu melihat bahwa beberapa bagian candi tampak panjang dan berjajar. Pada panel komik, susunannya membuat tampilan candi terlihat lebih teratur.',
    reflectionQuestion: 'Menurutmu, apakah bagian ini lebih mirip prisma atau balok?',
  },
  bola: {
    id: 'bola',
    name: 'Bola',
    definition: 'Bola adalah bangun ruang yang seluruh permukaannya melengkung.',
    characteristics: ['tidak punya rusuk', 'permukaannya bulat', 'tidak punya sudut'],
    faces: '1',
    edges: '0',
    vertices: '0',
    surfaceFormula: '4πr²',
    volumeFormula: '4/3 πr³',
    foundInTemple: false,
    templeLocation: 'tidak ada bagian utama Candi Jawi yang menyerupai bola',
    comicReference: 'Pada panel komik, tidak ada bagian utama candi yang tampak bulat seperti bola.',
    functionInBuilding: 'Bola tidak cocok untuk bagian utama bangunan candi karena candi lebih banyak memakai sisi datar.',
    exampleObjects: ['bola', 'globus', 'kelereng'],
    explanation: 'Bentuk bola tidak cocok untuk bagian utama candi karena candi lebih banyak memakai sisi yang datar dan runcing. Pada panel komik, bagian ini tidak terlihat seperti bola.',
    reflectionQuestion: 'Mengapa bagian utama candi lebih cocok dipelajari sebagai kubus, balok, atau limas?',
  },
  tabung: {
    id: 'tabung',
    name: 'Tabung',
    definition: 'Tabung adalah bangun ruang yang punya alas dan tutup berbentuk lingkaran.',
    characteristics: ['alas lingkaran', 'tutup lingkaran', 'sisi tegak melengkung'],
    faces: '3',
    edges: '2',
    vertices: '0',
    surfaceFormula: '2πr(r + t)',
    volumeFormula: 'πr²t',
    foundInTemple: false,
    templeLocation: 'bukan bentuk dominan pada struktur utama Candi Jawi',
    comicReference: 'Perhatikan kembali panel komik, bagian candi yang kamu pilih tidak tampak seperti tabung.',
    functionInBuilding: 'Tabung lebih sering dipakai pada benda seperti kaleng daripada pada bagian bangunan candi.',
    exampleObjects: ['kaleng', 'gelas', 'pipa'],
    explanation: 'Bentuk tabung lebih sering terlihat pada benda seperti kaleng, bukan pada bangunan candi yang tersusun dari batu. Pada panel komik, bagian yang kamu pilih tidak tampak seperti tabung.',
    reflectionQuestion: 'Menurutmu, bagian mana pada komik lebih cocok disebut sebagai balok atau limas daripada tabung?',
  },
  kerucut: {
    id: 'kerucut',
    name: 'Kerucut',
    definition: 'Kerucut adalah bangun ruang yang punya alas berbentuk lingkaran dan satu titik puncak.',
    characteristics: ['alas lingkaran', 'satu puncak', 'sisi tegak melengkung'],
    faces: '2',
    edges: '1',
    vertices: '1',
    surfaceFormula: 'πr(r + s)',
    volumeFormula: '⅓ πr²t',
    foundInTemple: false,
    templeLocation: 'tidak menjadi bagian utama struktur Candi Jawi',
    comicReference: 'Sebaiknya lihat kembali panel komik untuk bagian yang paling dominan pada candi.',
    functionInBuilding: 'Kerucut lebih cocok untuk benda yang meruncing ke satu titik, bukan struktur utama candi.',
    exampleObjects: ['es krim cone', 'topi ulang tahun', 'corong'],
    explanation: 'Bentuk kerucut lebih cocok untuk benda yang meruncing ke satu titik, tetapi bagian candi lebih banyak memakai bentuk yang datar. Pada panel komik, bentuk ini tidak terlihat sebagai bagian utama candi.',
    reflectionQuestion: 'Apa perbedaan paling mudah yang kamu lihat antara bentuk kerucut dan limas pada komik?',
  },
};

export function normalizeShapeId(value: string | null | undefined): string {
  const normalized = (value ?? '').trim().toLowerCase();
  if (!normalized) return '';
  if (normalized.includes('limas')) return 'limas';
  if (normalized.includes('prisma')) return 'prisma';
  if (normalized.includes('balok')) return 'balok';
  if (normalized.includes('kubus')) return 'kubus';
  if (normalized.includes('kerucut')) return 'kerucut';
  if (normalized.includes('tabung')) return 'tabung';
  if (normalized.includes('bola')) return 'bola';
  return normalized;
}

export function getShapeKnowledgeEntry(value: string | null | undefined): ShapeKnowledgeEntry | null {
  const id = normalizeShapeId(value);
  if (!id) return null;
  return shapeKnowledge[id] ?? null;
}

export function buildShapeKnowledgeContext(entry: ShapeKnowledgeEntry | null | undefined): string {
  if (!entry) {
    return 'Tidak ada pengetahuan objek yang tersedia.';
  }

  return [
    `Objek: ${entry.name}`,
    `Definisi: ${entry.definition}`,
    `Ciri: ${entry.characteristics.join(', ')}`,
    `Jumlah sisi: ${entry.faces}`,
    `Jumlah rusuk: ${entry.edges}`,
    `Jumlah titik sudut: ${entry.vertices}`,
    `Rumus luas permukaan: ${entry.surfaceFormula}`,
    `Rumus volume: ${entry.volumeFormula}`,
    `Lokasi pada Candi Jawi: ${entry.templeLocation}`,
    `Fungsi pada bangunan: ${entry.functionInBuilding}`,
    `Hubungan dengan komik: ${entry.comicReference}`,
    `Contoh benda lain: ${entry.exampleObjects.join(', ')}`,
  ].join('\n');
}
