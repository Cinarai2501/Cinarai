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

const sparkleVariants = {
  initial: { opacity: 0, y: 8 },
  animate: (delay: number) => ({
    opacity: [0, 1, 0.8, 1],
    y: [8, 0, -4, 0],
    transition: { duration: 3.2, delay, repeat: Infinity, ease: 'easeInOut' as const },
  }),
};

export default function MotivationPopup({ open, motivation, onClose, onShuffle }: MotivationPopupProps) {
  const activeMotivation = useMemo(() => motivation || getRandomMotivation(), [motivation]);

  if (!open) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-[3px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="motivation-popup-title"
          className="relative w-full max-w-[680px] overflow-hidden rounded-[36px] border border-[#DBEAFE] bg-[#FFFDF8] p-4 shadow-[0_32px_80px_-28px_rgba(37,99,235,0.35)] sm:p-6"
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[36px]">
            <div className="absolute left-[-10%] top-[-8%] h-28 w-28 rounded-full bg-[#DBEAFE] blur-3xl" />
            <div className="absolute right-[-8%] bottom-[-10%] h-36 w-36 rounded-full bg-[#FDE68A]/60 blur-3xl" />
            <motion.span custom={0.1} initial="initial" animate="animate" variants={sparkleVariants} className="absolute left-7 top-7 text-xl text-[#FBBF24]">
              ✦
            </motion.span>
            <motion.span custom={0.3} initial="initial" animate="animate" variants={sparkleVariants} className="absolute right-8 top-16 text-lg text-[#2563EB]">
              ✧
            </motion.span>
            <motion.span custom={0.5} initial="initial" animate="animate" variants={sparkleVariants} className="absolute bottom-16 left-10 text-base text-[#22C55E]">
              ★
            </motion.span>
          </div>

          <div className="relative rounded-[30px] border border-[#E5F0FF] bg-white/80 p-5 shadow-[0_20px_40px_-28px_rgba(15,23,42,0.35)] sm:p-7">
            <div className="flex justify-center">
              <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-[radial-gradient(circle,_#EFF6FF_0%,_#DBEAFE_70%,_#BFDBFE_100%)] shadow-[0_0_0_12px_rgba(37,99,235,0.08)] sm:h-32 sm:w-32">
                <div className="absolute inset-2 rounded-full border border-white/80" />
                <svg viewBox="0 0 120 120" className="relative h-20 w-20 sm:h-24 sm:w-24" aria-hidden="true">
                  <circle cx="58" cy="44" r="18" fill="#FBBF24" />
                  <path d="M38 44c0-12 10-22 22-22s22 10 22 22v8H38v-8Z" fill="#2563EB" />
                  <rect x="34" y="50" width="48" height="32" rx="10" fill="#FDE68A" />
                  <rect x="38" y="54" width="40" height="12" rx="6" fill="#FFFDF8" />
                  <rect x="38" y="70" width="24" height="8" rx="4" fill="#2563EB" />
                  <rect x="66" y="68" width="12" height="10" rx="4" fill="#22C55E" />
                  <path d="M44 86h32" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" />
                  <path d="M54 26h10" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" />
                  <path d="M44 18h10" stroke="#22C55E" strokeWidth="5" strokeLinecap="round" />
                  <path d="M78 20l8 10" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[#2563EB] sm:text-xs">Motivasi Belajar</p>
              <h2 id="motivation-popup-title" className="mt-2 text-[1.7rem] font-black leading-tight text-[#2563EB] sm:text-[2.2rem]">
                🌟 Motivasi Belajar Hari Ini
              </h2>
              <p className="mt-2 text-[15px] font-semibold text-slate-600 sm:text-[17px]">Ayo mulai petualangan belajarmu!</p>
            </div>

            <div className="mt-6 rounded-[24px] border border-[#BFDBFE] bg-[#EFF6FF] p-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:p-6">
              <div className="mb-3 flex justify-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FBBF24]/20 text-xl text-[#B45309]">💡</div>
              </div>
              <p className="text-[17px] font-semibold leading-8 text-[#1E3A8A] sm:text-[19px]">{activeMotivation}</p>
            </div>

            <div className="mt-5 flex items-center justify-center gap-3 text-[1.35rem] sm:gap-4 sm:text-[1.6rem]">
              <span className="rounded-full bg-[#FFF7ED] p-2 shadow-sm">📖</span>
              <span className="rounded-full bg-[#FEF3C7] p-2 shadow-sm">⭐</span>
              <span className="rounded-full bg-[#ECFCCB] p-2 shadow-sm">🎓</span>
              <span className="rounded-full bg-[#DBEAFE] p-2 shadow-sm">🏛️</span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-[56px] items-center justify-center rounded-[22px] bg-[#22C55E] px-4 py-3 text-[16px] font-black text-white shadow-[0_12px_28px_-14px_rgba(34,197,94,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#16A34A] active:scale-[0.98]"
              >
                📚 Mulai Belajar
              </button>
              <button
                type="button"
                onClick={onShuffle}
                className="inline-flex min-h-[56px] items-center justify-center rounded-[22px] border border-[#93C5FD] bg-white px-4 py-3 text-[16px] font-black text-[#2563EB] shadow-[0_8px_20px_-14px_rgba(37,99,235,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#60A5FA] hover:bg-[#F8FBFF] active:scale-[0.98]"
              >
                🔄 Motivasi Lain
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
