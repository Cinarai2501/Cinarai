'use client';

import { useMemo } from 'react';

const MOTIVATION_MESSAGES = [
  'Hari ini adalah kesempatan untuk belajar hal baru.',
  'Kesalahan adalah bagian dari proses menjadi lebih pintar.',
  'Setiap halaman yang kamu baca membuatmu semakin hebat.',
  'Berani mencoba adalah langkah pertama menuju keberhasilan.',
  'Belajar sedikit setiap hari lebih baik daripada tidak sama sekali.',
  'Ilmu adalah bekal terbaik untuk masa depan.',
  'Jangan takut bertanya, karena dari bertanya kita belajar.',
  'Semangat belajar hari ini akan menjadi prestasi esok hari.',
  'Temukan rasa ingin tahu dan jadikan itu teman belajarmu.',
  'Kamu bisa jika kamu terus berlatih dan tidak menyerah.',
  'Waktu belajar yang kamu gunakan hari ini akan membuatmu bangga nanti.',
  'Setiap tugas kecil adalah langkah menuju mimpi besar.',
  'Pelajaran baru membuat otakmu jadi lebih kuat.',
  'Ayo belajar dengan senyum dan rasa ingin tahu.',
  'Tiap kesulitan adalah kesempatan untuk jadi lebih baik.',
  'Kamu lebih cerdas dari yang kamu kira, teruslah mencoba.',
  'Mimpi besar dimulai dari kebiasaan belajar yang kecil.',
  'Belajar bersama teman bisa membuatnya jadi lebih seru.',
  'Jangan menyerah saat tidak langsung paham, semuanya butuh waktu.',
  'Baca, tanya, dan coba lagi — itulah cara pintar belajar.',
  'Kamu adalah pahlawan kecil yang sedang belajar setiap hari.',
  'Semua orang hebat mulai dari langkah kecil seperti kamu.',
  'Hari ini kamu lebih tahu daripada kemarin.',
  'Belajar bukan hanya untuk nilai, tapi untuk masa depanmu.',
  'Bangun kebiasaan belajar yang menyenangkan setiap hari.',
  'Kalau kamu terus berusaha, hasilnya akan terlihat nanti.',
  'Ayo jadikan belajar sebagai petualangan seru.',
  'Semakin banyak bertanya, semakin cepat kamu mengerti.',
  'Pikiranmu tumbuh makin cepat ketika kamu terus membaca.',
  'Kegigihanmu hari ini akan membuatmu bangga besok.',
  'Jadilah anak yang selalu ingin tahu dan berani mencoba.',
  'Belajar dengan hati yang tenang membuatmu lebih mudah mengingat.',
];

type MotivationPopupProps = {
  open: boolean;
  motivation: string;
  onClose: () => void;
  onShuffle: () => void;
};

export function getRandomMotivation(excludeIndex?: number) {
  const max = MOTIVATION_MESSAGES.length;
  if (max === 0) return '';

  let next = Math.floor(Math.random() * max);
  if (typeof excludeIndex === 'number' && max > 1) {
    while (next === excludeIndex) {
      next = Math.floor(Math.random() * max);
    }
  }
  return MOTIVATION_MESSAGES[next];
}

export default function MotivationPopup({ open, motivation, onClose, onShuffle }: MotivationPopupProps) {
  const activeMotivation = useMemo(() => motivation || getRandomMotivation(), [motivation]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-[32px] bg-gradient-to-br from-primary-100 via-secondary-50 to-accent-100 p-6 shadow-2xl ring-1 ring-white/50 transition-all duration-300 ease-out">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]">
          <span className="absolute left-6 top-6 h-3 w-3 rounded-full bg-white/80 animate-pulse" />
          <span className="absolute right-8 top-14 h-2 w-2 rounded-full bg-white/70 animate-pulse" />
          <span className="absolute left-20 bottom-10 h-2 w-2 rounded-full bg-white/70 animate-pulse" />
        </div>

        <div className="relative rounded-[32px] bg-white/95 p-6 shadow-xl">
          <div className="flex items-center justify-center gap-3 rounded-3xl bg-gradient-to-r from-primary-500 to-secondary-500 px-4 py-3 text-center text-white shadow-md">
            <span className="text-3xl">📚</span>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary-100">Motivasi Belajar</p>
              <h2 className="text-2xl font-black">🌟 Motivasi Belajar Hari Ini</h2>
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-primary-200 bg-primary-50 p-5 text-center shadow-sm">
            <p className="text-base font-semibold text-primary-900 sm:text-lg">{activeMotivation}</p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-3xl bg-primary-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-primary-700"
            >
              📖 Mulai Belajar
            </button>
            <button
              type="button"
              onClick={onShuffle}
              className="inline-flex items-center justify-center rounded-3xl border border-primary-200 bg-white px-4 py-3 text-sm font-black text-primary-700 shadow-sm transition hover:border-primary-300 hover:bg-primary-50"
            >
              🔄 Motivasi Lain
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
