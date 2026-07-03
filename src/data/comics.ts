import type { Comic, ComicStage } from "@/types/comic";

const BASE = "/comics";
const AVATARS = "/assets/avatars";

const DEFAULT_STAGES: ComicStage[] = ["comic", "quiz", "ar", "reflection"];

export const COMICS: Comic[] = [
  {
    id: 1,
    slug: "komik-1",
    title: "Petualangan Bangun Ruang Candi Jawi",
    subtitle: "Mengenal Bangun Ruang",
    kelas: "VI",
    lokasi: "Candi Jawi",
    synopsis:
      "Arka dan teman-temannya mengunjungi Candi Jawi di Pasuruan. Di sana mereka menemukan misteri bentuk-bentuk bangunan candi yang ternyata menyimpan rahasia bangun ruang. Bersama Pak Guru, mereka menjelajahi kubus, balok, prisma, dan limas yang tersembunyi di setiap sudut candi.",
    characters: [
      {
        name: "Arka",
        description: "Siswa kelas VI yang penasaran dan suka matematika.",
        avatar: `${AVATARS}/arka.png`,
      },
      {
        name: "Sari",
        description: "Sahabat Arka yang teliti dan suka mencatat.",
        avatar: `${AVATARS}/sari.png`,
      },
      {
        name: "Pak Guru",
        description: "Guru yang bijak dan selalu memberi petunjuk.",
        avatar: `${AVATARS}/pak-guru.png`,
      },
    ],
    learningTargets: [
      "Mengenal jenis-jenis bangun ruang (kubus, balok, prisma, limas)",
      "Mengidentifikasi sisi, rusuk, dan titik sudut bangun ruang",
      "Menghubungkan bentuk bangun ruang dengan benda nyata di sekitar",
    ],
    pdfPath: `${BASE}/komik-1/comic.pdf`,
    cover: `${BASE}/komik-1/cover.png`,
    thumbnail: `${BASE}/komik-1/thumbnail.png`,
    stages: DEFAULT_STAGES,
  },
  {
    id: 2,
    slug: "komik-2",
    title: "Petualangan Simetri Candi Penataran",
    subtitle: "Mengenal Simetri",
    kelas: "V",
    lokasi: "Candi Penataran",
    synopsis:
      "Di Candi Penataran, Blitar, Arka dan Sari terpesona oleh ukiran-ukiran indah yang ternyata memiliki pola simetri. Mereka belajar bahwa seni dan matematika berjalan beriringan melalui konsep simetri lipat dan simetri putar.",
    characters: [
      {
        name: "Arka",
        description: "Siswa kelas V yang suka mengamati pola.",
        avatar: `${AVATARS}/arka.png`,
      },
      {
        name: "Sari",
        description: "Sahabat Arka yang kreatif dan suka menggambar.",
        avatar: `${AVATARS}/sari.png`,
      },
    ],
    learningTargets: [
      "Memahami konsep simetri lipat pada bangun datar",
      "Menentukan sumbu simetri suatu bangun",
      "Mengenal simetri putar dan orde putarnya",
    ],
    pdfPath: `${BASE}/komik-2/comic.pdf`,
    cover: `${BASE}/komik-2/cover.png`,
    thumbnail: `${BASE}/komik-2/thumbnail.png`,
    stages: DEFAULT_STAGES,
  },
  {
    id: 3,
    slug: "komik-3",
    title: "Petualangan di Rumah Gajah Mungkur",
    subtitle: "Mengenal Bilangan",
    kelas: "II",
    lokasi: "Gajah Mungkur",
    synopsis:
      "Arka kecil mengunjungi Waduk Gajah Mungkur bersama keluarganya. Di sana ia bertemu dengan nelayan yang mengajarinya cara menghitung ikan menggunakan bilangan. Petualangan seru mengenal bilangan 1 sampai 100 dimulai!",
    characters: [
      {
        name: "Arka",
        description: "Siswa kelas II yang ceria dan suka berhitung.",
        avatar: `${AVATARS}/arka.png`,
      },
      {
        name: "Pak Nelayan",
        description: "Nelayan ramah yang suka berbagi ilmu.",
        avatar: `${AVATARS}/pak-nelayan.png`,
      },
    ],
    learningTargets: [
      "Membilang dan menulis bilangan 1 sampai 100",
      "Membandingkan dua bilangan (lebih besar, lebih kecil, sama dengan)",
      "Mengurutkan bilangan dari terkecil ke terbesar",
    ],
    pdfPath: `${BASE}/komik-3/comic.pdf`,
    cover: `${BASE}/komik-3/cover.png`,
    thumbnail: `${BASE}/komik-3/thumbnail.png`,
    stages: DEFAULT_STAGES,
  },
  {
    id: 4,
    slug: "komik-4",
    title: "Petualangan di Jembatan Merah",
    subtitle: "Mengenal Pengukuran",
    kelas: "IV",
    lokasi: "Jembatan Merah",
    synopsis:
      "Di kawasan bersejarah Jembatan Merah Surabaya, Arka dan teman-teman mendapat tantangan mengukur panjang jembatan tanpa penggaris. Mereka belajar satuan panjang baku dan tidak baku sambil menjelajahi sejarah kota.",
    characters: [
      {
        name: "Arka",
        description: "Siswa kelas IV yang suka tantangan.",
        avatar: `${AVATARS}/arka.png`,
      },
      {
        name: "Sari",
        description: "Sahabat Arka yang selalu membawa alat tulis.",
        avatar: `${AVATARS}/sari.png`,
      },
    ],
    learningTargets: [
      "Memahami satuan panjang baku (cm, m, km) dan tidak baku",
      "Mengkonversi satuan panjang",
      "Mengukur panjang benda menggunakan alat ukur yang tepat",
    ],
    pdfPath: null,
    cover: `${BASE}/komik-4/cover.png`,
    thumbnail: `${BASE}/komik-4/thumbnail.png`,
    stages: DEFAULT_STAGES,
  },
  {
    id: 5,
    slug: "komik-5",
    title: "Serunya Belajar Bangun Datar di Keraton Sumenep",
    subtitle: "Mengenal Bangun Datar",
    kelas: "II",
    lokasi: "Keraton Sumenep",
    synopsis:
      "Arka mengunjungi Keraton Sumenep di Madura dan terkagum-kagum dengan arsitekturnya. Gerbang, jendela, dan lantai keraton ternyata penuh dengan bentuk-bentuk bangun datar. Bersama pemandu keraton, Arka belajar mengenal segitiga, persegi, dan lingkaran.",
    characters: [
      {
        name: "Arka",
        description: "Siswa kelas II yang suka bertanya.",
        avatar: `${AVATARS}/arka.png`,
      },
      {
        name: "Kak Pemandu",
        description: "Pemandu keraton yang ramah dan berpengetahuan luas.",
        avatar: `${AVATARS}/kak-pemandu.png`,
      },
    ],
    learningTargets: [
      "Mengenal bangun datar: segitiga, persegi, persegi panjang, lingkaran",
      "Membedakan bangun datar berdasarkan ciri-cirinya",
      "Menemukan bangun datar pada benda-benda di sekitar",
    ],
    pdfPath: null,
    cover: `${BASE}/komik-5/cover.png`,
    thumbnail: `${BASE}/komik-5/thumbnail.png`,
    stages: DEFAULT_STAGES,
  },
];
