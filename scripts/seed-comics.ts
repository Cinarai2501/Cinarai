/**
 * Seed script — jalankan SATU KALI untuk mengisi collection `comics` di Firestore.
 *
 * Data bersumber langsung dari isi PDF masing-masing komik.
 *
 * LANGKAH SEBELUM MENJALANKAN:
 * 1. Buka Firebase Console → Firestore → Rules
 * 2. Pastikan rule comics: allow write: if true;
 * 3. Klik Publish
 * 4. Jalankan: npm run seed
 * 5. Setelah selesai, kembalikan: allow write: if false; lalu Publish lagi
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─── Load .env.local ──────────────────────────────────────────────────────────

function loadEnv(): void {
  const envPath = resolve(process.cwd(), '.env.local');
  try {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    console.error('❌  .env.local tidak ditemukan.');
    process.exit(1);
  }
}

loadEnv();

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;

if (!PROJECT_ID || !API_KEY) {
  console.error('❌  NEXT_PUBLIC_FIREBASE_PROJECT_ID atau NEXT_PUBLIC_FIREBASE_API_KEY tidak ditemukan.');
  process.exit(1);
}

// ─── Comic data — bersumber dari isi PDF ─────────────────────────────────────

const BASE_COVER = '/comics';
const BASE_AVATAR = '/assets/avatars';

const COMICS = [
  // ── Komik 1 ──────────────────────────────────────────────────────────────
  // Sumber: public/comics/komik-1/comic.pdf
  // Halaman pengenalan tokoh (hal. 9): Kak Najwa, Aris, Ara
  // Tujuan pembelajaran (hal. 4): identifikasi & konstruksi bangun ruang Candi Jawi
  {
    docId: 'comic-1',
    comicId: 1,
    slug: 'komik-1',
    title: 'Petualangan Bangun Ruang Candi Jawi',
    subtitle: 'Etnomatematika Bangun Ruang',
    kelas: 'VI',
    lokasi: 'Candi Jawi, Pasuruan',
    synopsis: 'Aris dan Ara mengikuti tur edukasi ke Candi Jawi di Prigen, Pasuruan, dipandu oleh Kak Najwa. Awalnya Aris merasa tur ini akan membosankan dan mengaku tidak suka matematika. Namun Kak Najwa memperkenalkan tablet AR yang mampu menampilkan bentuk asli candi secara tiga dimensi. Melalui petualangan di dunia AR, mereka menjelajahi lima bangun ruang yang tersembunyi di arsitektur candi: kubus, balok, prisma segi empat, limas segi empat, dan kerucut. Setiap bangun ruang dipelajari melalui tantangan menghitung volume. Ketika tablet tiba-tiba error, Kak Najwa mengajarkan bahwa nenek moyang kita pun bisa membangun candi megah hanya dengan mata dan tangan — tanpa teknologi. Dari hari itu, Aris dan Ara tidak lagi takut matematika.',
    characters: [
      {
        name: 'Kak Najwa',
        role: 'Tour Guide',
        description: 'Tour guide pendidikan Candi Jawi, perempuan, ramah, dan ahli matematika.',
        avatar: `${BASE_AVATAR}/kak-najwa.png`,
      },
      {
        name: 'Aris',
        role: 'Tokoh Utama',
        description: 'Anak laki-laki SD aktif, tetapi kurang suka matematika.',
        avatar: `${BASE_AVATAR}/aris.png`,
      },
      {
        name: 'Ara',
        role: 'Tokoh Utama',
        description: 'Anak perempuan SD, rajin dan benar tetapi pemalu.',
        avatar: `${BASE_AVATAR}/ara.png`,
      },
    ],
    learningTargets: [
      'Mengidentifikasi dan menjelaskan ciri-ciri bangun ruang (kubus, balok, prisma, limas, dan kerucut) melalui pengamatan arsitektur Candi Jawi',
      'Menghitung volume beberapa jenis bangun ruang (kubus, balok, prisma, limas, dan kerucut)',
      'Mengonstruksi model sederhana bangun ruang dan mengaitkannya dengan unsur arsitektur Candi Jawi',
      'Memahami visualisasi spasial bangun ruang dari berbagai sisi',
    ],
    estimatedMinutes: 30,
    pdfUrl: `${BASE_COVER}/komik-1/comic.pdf`,
    coverUrl: `${BASE_COVER}/komik-1/cover.png`,
    thumbnailUrl: `${BASE_COVER}/komik-1/thumbnail.png`,
    order: 1,
    availability: 'ACTIVE',
  },

  // ── Komik 2 ──────────────────────────────────────────────────────────────
  // Sumber: public/comics/komik-2/comic.pdf
  // Halaman pengenalan tokoh (hal. 9): Wili, Miya, Kara
  // Tujuan pembelajaran (hal. 3): simetri lipat, simetri putar, luas bangun datar
  {
    docId: 'comic-2',
    comicId: 2,
    slug: 'komik-2',
    title: 'Petualangan Simetri Candi Penataran',
    subtitle: 'Etnomatematika Bangun Datar: Simetri Lipat dan Simetri Putar',
    kelas: 'V',
    lokasi: 'Candi Penataran, Blitar',
    synopsis: 'Wili, Miya, dan Kara mengunjungi Candi Penataran di Blitar — kompleks candi Hindu terbesar di Jawa Timur yang dibangun pada masa Kerajaan Majapahit. Wili dan Miya bersemangat menemukan rahasia matematika di balik arsitektur candi, sementara Kara awalnya skeptis dan menganggap candi hanya bangunan tua. Mereka menjelajahi berbagai bangun datar pada struktur candi: persegi pada alas umpang, persegi panjang pada Bale Agung, segitiga pada atap, dan trapesium pada relief. Melalui pengamatan langsung, mereka memahami konsep simetri lipat dan simetri putar yang tersembunyi di setiap sudut candi. Kara yang awalnya tidak percaya akhirnya ikut belajar bersama dan memahami bahwa arsitektur kuno menyimpan kecerdasan matematika yang luar biasa.',
    characters: [
      {
        name: 'Wili',
        role: 'Tokoh Utama',
        description: 'Anak laki-laki kelas 5 SD yang pintar dan penasaran. Suka matematika dan selalu ingin tahu lebih dalam. Berani, sabar, dan suka membantu teman. Menjadi pemimpin dalam petualangan.',
        avatar: `${BASE_AVATAR}/wili.png`,
      },
      {
        name: 'Miya',
        role: 'Sahabat',
        description: 'Anak perempuan kelas 5 SD yang ceria dan kreatif. Suka menggambar dan membantu Wili dengan ide-ide lucu. Ramah, lucu, dan cepat berpikir, tapi kadang takut dengan hal-hal aneh.',
        avatar: `${BASE_AVATAR}/miya.png`,
      },
      {
        name: 'Kara',
        role: 'Sahabat',
        description: 'Anak perempuan kelas 5 SD yang suka bercanda, tidak suka pelajaran matematika, sering salah paham dan mengganggu. Namun pada akhirnya Kara mau belajar bersama Wili dan Miya.',
        avatar: `${BASE_AVATAR}/kara.png`,
      },
    ],
    learningTargets: [
      'Mengidentifikasi dan mengenali berbagai bentuk bangun datar pada relief dan arsitektur Candi Penataran',
      'Menjelaskan konsep simetri lipat dan simetri putar pada bangun datar',
      'Menghitung luas bangun datar (persegi, persegi panjang, dan segitiga) menggunakan contoh nyata dari candi',
      'Bekerja sama dan berdiskusi dalam kelompok untuk memecahkan masalah matematika',
    ],
    estimatedMinutes: 30,
    pdfUrl: `${BASE_COVER}/komik-2/comic.pdf`,
    coverUrl: `${BASE_COVER}/komik-2/cover.png`,
    thumbnailUrl: `${BASE_COVER}/komik-2/thumbnail.png`,
    order: 2,
    availability: 'ACTIVE',
  },

  // ── Komik 3 ──────────────────────────────────────────────────────────────
  // Sumber: public/comics/komik-3/comic.pdf
  // Halaman pengenalan tokoh (hal. 5): Bu Rere, Damar, Bima, Sari
  // Sinopsis (hal. 4): tersurat langsung di PDF
  // Tujuan pembelajaran (hal. 3): mengenal bangun datar, komposisi & dekomposisi
  {
    docId: 'comic-3',
    comicId: 3,
    slug: 'komik-3',
    title: 'Petualangan di Rumah Gajah Mungkur',
    subtitle: 'Etnomatematika Bangun Datar — Kelas II SD',
    kelas: 'II',
    lokasi: 'Rumah Gajah Mungkur, Gresik',
    synopsis: 'Tiga murid kelas 2 SD — Damar, Bima, dan Sari — merasa matematika membosankan. Bu Rere lalu mengajak mereka belajar di Rumah Gajah Mungkur, bangunan bersejarah di Gresik yang dibangun sejak tahun 1896 oleh Haji Djaelani. Rumah ini memadukan tiga kebudayaan: Eropa, Tionghoa, dan Jawa, dengan patung gajah yang membelakangi di depan pintu utama. Di sana, mereka menjadi "Detektif Bangun Datar" dan mencari bentuk-bentuk seperti persegi, persegi panjang, segitiga, trapesium, belah ketupat, jajargenjang, hingga lingkaran pada bangunan bersejarah tersebut. Awalnya bingung membedakan bentuk yang mirip, ketiganya akhirnya paham berkat bimbingan Bu Rere dan kerja sama mereka. Petualangan ini mengajarkan bahwa matematika menyenangkan dan bisa ditemukan di sekitar kita.',
    characters: [
      {
        name: 'Bu Rere',
        role: 'Guru',
        description: 'Guru matematika kelas II SD yang kreatif dan mengajak siswa belajar di luar kelas.',
        avatar: `${BASE_AVATAR}/bu-rere.png`,
      },
      {
        name: 'Damar',
        role: 'Tokoh Utama',
        description: 'Siswa yang jeli dan suka tantangan.',
        avatar: `${BASE_AVATAR}/damar.png`,
      },
      {
        name: 'Bima',
        role: 'Tokoh Utama',
        description: 'Siswa yang suka bersaing, terburu-buru, ingin jadi yang terbaik, kurang teliti.',
        avatar: `${BASE_AVATAR}/bima.png`,
      },
      {
        name: 'Sari',
        role: 'Tokoh Utama',
        description: 'Siswi yang teliti, suka bekerja sama, sabar, dan perhatian pada teman.',
        avatar: `${BASE_AVATAR}/sari.png`,
      },
    ],
    learningTargets: [
      'Menyebutkan berbagai bentuk bangun datar dan menemukannya pada benda-benda di sekitar',
      'Mengenal berbagai bangun datar (segitiga, segiempat, segibanyak, lingkaran)',
      'Menyusun (komposisi) dan mengurai (dekomposisi) suatu bangun datar',
      'Menentukan posisi benda terhadap benda lain (kanan, kiri, depan, belakang)',
    ],
    estimatedMinutes: 25,
    pdfUrl: `${BASE_COVER}/komik-3/comic.pdf`,
    coverUrl: `${BASE_COVER}/komik-3/cover.png`,
    thumbnailUrl: `${BASE_COVER}/komik-3/thumbnail.png`,
    order: 3,
    availability: 'ACTIVE',
  },

  // ── Komik 4 ──────────────────────────────────────────────────────────────
  // PDF belum tersedia — data akan diperbarui setelah PDF diterima
  {
    docId: 'comic-4',
    comicId: 4,
    slug: 'komik-4',
    title: 'Petualangan di Jembatan Merah',
    subtitle: 'Etnomatematika Pengukuran',
    kelas: 'IV',
    lokasi: 'Jembatan Merah, Surabaya',
    synopsis: 'Komik ini sedang dalam persiapan. Data akan diperbarui setelah PDF tersedia.',
    characters: [],
    learningTargets: [],
    estimatedMinutes: 30,
    pdfUrl: null,
    coverUrl: `${BASE_COVER}/komik-4/cover.png`,
    thumbnailUrl: `${BASE_COVER}/komik-4/thumbnail.png`,
    order: 4,
    availability: 'COMING_SOON',
  },

  // ── Komik 5 ──────────────────────────────────────────────────────────────
  // PDF belum tersedia — data akan diperbarui setelah PDF diterima
  {
    docId: 'comic-5',
    comicId: 5,
    slug: 'komik-5',
    title: 'Serunya Belajar Bangun Datar di Keraton Sumenep',
    subtitle: 'Etnomatematika Bangun Datar',
    kelas: 'II',
    lokasi: 'Keraton Sumenep, Madura',
    synopsis: 'Komik ini sedang dalam persiapan. Data akan diperbarui setelah PDF tersedia.',
    characters: [],
    learningTargets: [],
    estimatedMinutes: 25,
    pdfUrl: null,
    coverUrl: `${BASE_COVER}/komik-5/cover.png`,
    thumbnailUrl: `${BASE_COVER}/komik-5/thumbnail.png`,
    order: 5,
    availability: 'COMING_SOON',
  },
] as const;

// ─── Firestore REST helpers ───────────────────────────────────────────────────

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { arrayValue: { values: FirestoreValue[] } }
  | { mapValue: { fields: Record<string, FirestoreValue> } };

function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return { integerValue: String(value) };
  if (typeof value === 'string') return { stringValue: value };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === 'object') {
    const fields: Record<string, FirestoreValue> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function toFirestoreFields(obj: Record<string, unknown>): Record<string, FirestoreValue> {
  const fields: Record<string, FirestoreValue> = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toFirestoreValue(v);
  }
  return fields;
}

async function writeDocument(docId: string, data: Record<string, unknown>): Promise<void> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/comics/${docId}?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err}`);
  }
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  console.log(`\n🌱  Seeding Firestore project: ${PROJECT_ID}\n`);
  console.log('   Data bersumber dari isi PDF komik.\n');

  for (const comic of COMICS) {
    const { docId, ...data } = comic;
    await writeDocument(docId, data as unknown as Record<string, unknown>);
    console.log(`  ✅  ${docId}  —  ${data.title}`);
  }

  console.log('\n🎉  Seed selesai. Collection `comics` berisi 5 dokumen.');
  console.log('⚠️   Kembalikan Firestore rules: allow write: if false;\n');
  process.exit(0);
}

seed().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
    console.error('\n❌  PERMISSION_DENIED');
    console.error('   Ubah Firestore rules: allow write: if true;');
    console.error('   https://console.firebase.google.com/project/' + PROJECT_ID + '/firestore/rules\n');
  } else {
    console.error('❌  Seed gagal:', msg);
  }
  process.exit(1);
});
