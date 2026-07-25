'use client';

import { AnimatePresence, motion } from 'framer-motion';
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
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-6 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="motivation-popup-title"
          className="w-full max-w-[420px] rounded-[28px] bg-white p-6 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.35)] sm:p-7"
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-3xl text-blue-600">
              ✨
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">Motivasi Hari Ini</p>
            <h2 id="motivation-popup-title" className="mt-2 text-[1.6rem] font-semibold leading-tight text-slate-900">
              Semangat belajar!
            </h2>
            <p className="mt-2 text-[15px] text-slate-500">Yuk mulai petualangan belajarmu hari ini.</p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-[17px] font-medium leading-8 text-slate-700">“{activeMotivation}”</p>
          </div>

          <div className="mt-7 flex flex-col gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-blue-600 px-4 py-3 text-[15px] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(37,99,235,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 active:scale-[0.98]"
            >
              Mulai Belajar
            </button>
            <button
              type="button"
              onClick={onShuffle}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full px-4 py-2 text-[14px] font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            >
              Motivasi lain
            </button>
          </div>

          <p className="mt-6 text-center text-[12px] font-medium text-slate-400">
            CINARAI • Selamat belajar
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
