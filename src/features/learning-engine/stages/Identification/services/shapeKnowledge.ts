export type ShapeKnowledgeStatus = 'FOUND' | 'NOT_FOUND' | 'DISTRACTOR';

export interface ShapeKnowledgeEntry {
  id: string;
  title: string;
  comicPage: number;
  location: string;
  found: boolean;
  status: ShapeKnowledgeStatus;
  description: string;
  formula: {
    surface: string;
    volume: string;
  };
  characteristics: string[];
  name: string;
  definition: string;
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

export const shapeKnowledge: ShapeKnowledgeEntry[] = [
  {
    id: 'kubus',
    title: 'Kubus',
    comicPage: 13,
    location: 'bagian kaki candi yang tampak kotak-kotak',
    found: true,
    status: 'FOUND',
    description: 'Bangun ruang dengan 6 sisi persegi yang sama besar. Tampak pada bagian kaki Candi Jawi.',
    formula: { surface: '6s²', volume: 's³' },
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
    comicReference: 'Lihat halaman 13 pada komik saat tokoh mengamati bagian kaki candi yang kotak-kotak.',
    functionInBuilding: 'Kubus membantu menunjukkan bagian struktur yang sederhana, stabil, dan mudah disusun.',
    exampleObjects: ['dadu', 'kardus', 'kotak mainan'],
    explanation: 'Bentuk kubus terlihat pada bagian batu yang tampak seperti kotak. Pada panel komik, bagian ini membantu melihat bahwa bentuk candi tidak selalu bulat atau runcing.',
    reflectionQuestion: 'Mengapa menurutmu bagian ini paling mirip dengan kubus dibanding bangun ruang lain?',
  },
  {
    id: 'balok',
    title: 'Balok',
    comicPage: 16,
    location: 'tubuh utama candi yang tampak memanjang',
    found: true,
    status: 'FOUND',
    description: 'Bangun ruang dengan 6 sisi persegi panjang. Tampak pada tubuh utama Candi Jawi.',
    formula: { surface: '2(pl + pt + lt)', volume: 'p × l × t' },
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
    comicReference: 'Lihat halaman 16 pada komik saat tokoh mengamati badan candi yang kokoh dan tersusun rapi.',
    functionInBuilding: 'Balok sering dipakai sebagai bagian tubuh bangunan yang kuat dan kokoh.',
    exampleObjects: ['batu bata', 'kotak penyimpanan', 'rak buku'],
    explanation: 'Bentuk balok terlihat pada susunan batu yang kuat dan rapi. Pada Candi Jawi, bagian ini membantu mengamati struktur bangunan yang kokoh.',
    reflectionQuestion: 'Mengapa bagian ini lebih cocok disebut balok daripada bangun ruang lain?',
  },
  {
    id: 'limas',
    title: 'Limas',
    comicPage: 17,
    location: 'atap candi yang meruncing ke atas',
    found: true,
    status: 'FOUND',
    description: 'Bangun ruang dengan alas persegi dan 4 sisi segitiga yang bertemu di satu titik puncak. Tampak pada atap candi.',
    formula: { surface: 'L alas + ½ × keliling alas × t sisi', volume: '⅓ × luas alas × tinggi' },
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
    comicReference: 'Lihat halaman 17 pada komik saat bagian puncak candi tampak runcing.',
    functionInBuilding: 'Limas membantu membentuk atap yang runcing dan terlihat tajam.',
    exampleObjects: ['atap rumah', 'menara', 'ornamen puncak'],
    explanation: 'Saat atap candi mengarah ke puncak, bentuknya mirip limas. Pada panel komik, bagian ini terlihat tajam dan stabil seperti bentuk limas.',
    reflectionQuestion: 'Mengapa menurutmu atap candi lebih cocok dibuat seperti limas?',
  },
  {
    id: 'prisma',
    title: 'Prisma',
    comicPage: 22,
    location: 'bagian dinding candi yang tersusun berlapis',
    found: true,
    status: 'FOUND',
    description: 'Bangun ruang dengan dua alas sejajar dan sisi-sisi tegak yang menghubungkan kedua alas. Tampak pada dinding candi.',
    formula: { surface: '2 × luas alas + keliling alas × tinggi', volume: 'luas alas × tinggi' },
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
    comicReference: 'Lihat halaman 22 pada komik saat tokoh melihat dinding dan susunan batu candi.',
    functionInBuilding: 'Prisma membantu membentuk bagian yang panjang dan berlapis seperti dinding penyangga.',
    exampleObjects: ['bungkus cokelat', 'kotak pensil panjang', 'tiang beraturan'],
    explanation: 'Bentuk prisma membantu melihat bahwa beberapa bagian candi tampak panjang dan berjajar. Pada panel komik, susunannya membuat tampilan candi terlihat lebih teratur.',
    reflectionQuestion: 'Menurutmu, apakah bagian ini lebih mirip prisma atau balok?',
  },
  {
    id: 'kerucut',
    title: 'Kerucut',
    comicPage: 28,
    location: 'bagian puncak candi yang meruncing',
    found: true,
    status: 'FOUND',
    description: 'Bangun ruang dengan alas lingkaran dan satu titik puncak. Muncul pada bagian puncak candi.',
    formula: { surface: 'πr(r + s)', volume: '⅓ πr²t' },
    name: 'Kerucut',
    definition: 'Kerucut adalah bangun ruang yang punya alas berbentuk lingkaran dan satu titik puncak.',
    characteristics: ['alas lingkaran', 'satu puncak', 'sisi tegak melengkung'],
    faces: '2',
    edges: '1',
    vertices: '1',
    surfaceFormula: 'πr(r + s)',
    volumeFormula: '⅓ πr²t',
    foundInTemple: true,
    templeLocation: 'bagian puncak candi yang meruncing',
    comicReference: 'Lihat halaman 28 pada komik saat bagian puncak candi dikaitkan dengan bentuk meruncing.',
    functionInBuilding: 'Kerucut membantu menunjukkan bagian yang meruncing dan tajam.',
    exampleObjects: ['es krim cone', 'topi ulang tahun', 'corong'],
    explanation: 'Bentuk kerucut cocok untuk bagian yang meruncing pada candi. Pada panel komik, bentuk ini terlihat sebagai bagian yang membantu membentuk puncak.',
    reflectionQuestion: 'Apa perbedaan paling mudah yang kamu lihat antara bentuk kerucut dan limas pada komik?',
  },
  {
    id: 'bola',
    title: 'Bola',
    comicPage: 0,
    location: 'tidak dibahas',
    found: false,
    status: 'NOT_FOUND',
    description: 'Tidak dibahas sebagai bentuk utama pada komik 1.',
    formula: { surface: '4πr²', volume: '4/3 πr³' },
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
    comicReference: 'Tidak disebutkan sebagai bentuk utama pada komik 1.',
    functionInBuilding: 'Bola tidak dipakai sebagai bagian utama bangunan candi dalam komik ini.',
    exampleObjects: ['bola', 'globus', 'kelereng'],
    explanation: 'Bentuk bola tidak muncul sebagai bagian utama candi pada komik 1.',
    reflectionQuestion: 'Mengapa bagian utama candi lebih cocok dipelajari sebagai kubus, balok, atau limas?',
  },
  {
    id: 'tabung',
    title: 'Tabung',
    comicPage: 0,
    location: 'tidak dibahas',
    found: false,
    status: 'NOT_FOUND',
    description: 'Tidak dibahas sebagai bentuk utama pada komik 1.',
    formula: { surface: '2πr(r + t)', volume: 'πr²t' },
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
    comicReference: 'Tidak disebutkan sebagai bentuk utama pada komik 1.',
    functionInBuilding: 'Tabung tidak dipakai sebagai bagian utama bangunan candi dalam komik ini.',
    exampleObjects: ['kaleng', 'gelas', 'pipa'],
    explanation: 'Bentuk tabung tidak muncul sebagai bagian utama candi pada komik 1.',
    reflectionQuestion: 'Menurutmu, bagian mana pada komik lebih cocok disebut sebagai balok atau limas daripada tabung?',
  },
];

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

export function getShapeKnowledgeEntries(): ShapeKnowledgeEntry[] {
  return [...shapeKnowledge];
}

export function getShapeKnowledgeEntry(value: string | null | undefined): ShapeKnowledgeEntry | null {
  const id = normalizeShapeId(value);
  if (!id) return null;
  return shapeKnowledge.find((entry) => entry.id === id) ?? null;
}

export function getIdentificationOptionEntries(): ShapeKnowledgeEntry[] {
  return shapeKnowledge.filter((entry) => entry.found);
}

export function buildShapeKnowledgeContext(entry: ShapeKnowledgeEntry | null | undefined): string {
  if (!entry) {
    return 'Tidak ada pengetahuan objek yang tersedia.';
  }

  return [
    `Objek: ${entry.title}`,
    `Definisi: ${entry.definition}`,
    `Ciri: ${entry.characteristics.join(', ')}`,
    `Jumlah sisi: ${entry.faces}`,
    `Jumlah rusuk: ${entry.edges}`,
    `Jumlah titik sudut: ${entry.vertices}`,
    `Rumus luas permukaan: ${entry.formula.surface}`,
    `Rumus volume: ${entry.formula.volume}`,
    `Lokasi pada Candi Jawi: ${entry.templeLocation}`,
    `Fungsi pada bangunan: ${entry.functionInBuilding}`,
    `Hubungan dengan komik: ${entry.comicReference}`,
    `Contoh benda lain: ${entry.exampleObjects.join(', ')}`,
  ].join('\n');
}
