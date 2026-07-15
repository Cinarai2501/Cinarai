export type GuruStatCard = {
  title: string;
  value: string;
  icon: 'people' | 'school' | 'menuBook' | 'trendingUp';
  accent: string;
};

export const guruDashboardStats: GuruStatCard[] = [
  { title: 'Jumlah Siswa', value: '142', icon: 'people', accent: 'bg-primary-50 text-primary-700' },
  { title: 'Siswa Aktif', value: '118', icon: 'school', accent: 'bg-secondary-50 text-secondary-700' },
  { title: 'Modul Pembelajaran', value: '8', icon: 'menuBook', accent: 'bg-amber-50 text-amber-700' },
  { title: 'Rata-rata Progress', value: '82%', icon: 'trendingUp', accent: 'bg-emerald-50 text-emerald-700' },
];

export const guruProgressItems = [
  { label: 'Komik Interaktif', value: 88 },
  { label: 'Latihan Identifikasi', value: 74 },
  { label: 'Refleksi Siswa', value: 64 },
];

export const guruModules = [
  {
    title: 'Bangun Ruang Candi Jawi',
    description: 'Menyelami sejarah dan struktur ruang untuk memahami pelajaran budaya.',
    completed: 52,
    progress: 78,
    badge: 'Populer',
    coverLabel: 'Candi',
  },
  {
    title: 'Permainan Tradisional',
    description: 'Mengamati nilai-nilai lokal dalam kegiatan bermain bersama.',
    completed: 46,
    progress: 67,
    badge: 'Baru',
    coverLabel: 'Permainan',
  },
  {
    title: 'Batik',
    description: 'Menelusuri proses kreatif dan makna simbol dalam motif batik.',
    completed: 39,
    progress: 71,
    badge: 'Favorit',
    coverLabel: 'Batik',
  },
  {
    title: 'Narasi Rakyat',
    description: 'Membangun kemampuan siswa menghubungkan cerita lokal dengan nilai moral.',
    completed: 31,
    progress: 58,
    badge: 'Rekomendasi',
    coverLabel: 'Cerita',
  },
];

export const guruActivities = [
  {
    id: 'activity-1',
    title: 'Arie menyelesaikan Komik 1',
    detail: 'Siswa menyelesaikan seluruh tahap pembelajaran modul interaktif.',
    time: '15 menit lalu',
  },
  {
    id: 'activity-2',
    title: 'Budi mengerjakan Argumentation',
    detail: 'Progres Budi meningkat pada sesi diskusi dan alasan.',
    time: '1 jam lalu',
  },
  {
    id: 'activity-3',
    title: 'Siti menyelesaikan Reflection',
    detail: 'Siti memberikan refleksi yang kuat pada materi budaya.',
    time: '2 jam lalu',
  },
];
