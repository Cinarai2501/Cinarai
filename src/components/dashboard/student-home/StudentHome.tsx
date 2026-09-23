'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAllComicProgress } from '@/hooks/useAllComicProgress';
import { getAllComics } from '@/lib/comicRepository';
import HomeHeader from './HomeHeader';

function getAvatarAsset(firstName: string) {
  const normalizedName = firstName.toLowerCase();
  if (normalizedName.includes('ara') || normalizedName.includes('ani') || normalizedName.endsWith('a')) {
    return '/assets/dashboard/home/avatars/avatar-anak-perempuan.png';
  }
  return '/assets/dashboard/home/avatars/avatar-anak-laki-laki.png';
}

type SyntaxCard = {
  number: number;
  title: string;
  description: string;
  color: string;
  accent: string;
  icon: string;
};

const syntaxCards: SyntaxCard[] = [
  { number: 1, title: 'Orientasi Masalah', description: 'Mengamati dan memahami konteks masalah', color: '#DCEEFF', accent: '#2D83E8', icon: '⌕' },
  { number: 2, title: 'Eksplorasi dengan AR', description: 'Mengamati dan mengeksplorasi melalui teknologi AR', color: '#FFE0EF', accent: '#E04786', icon: '◇' },
  { number: 3, title: 'Penggalian Informasi dengan AI', description: 'Bertanya, mencari informasi, dan menganalisis data', color: '#FFF1BE', accent: '#D99D00', icon: '✦' },
  { number: 4, title: 'Analisis & Pemecahan Masalah', description: 'Menyelesaikan masalah secara kritis dan logis', color: '#DDF5E6', accent: '#42A66A', icon: '▤' },
  { number: 5, title: 'Kreasi Solusi', description: 'Membuat produk atau karya sebagai solusi masalah', color: '#EAE1FF', accent: '#7548D8', icon: '✧' },
  { number: 6, title: 'Refleksi', description: 'Meninjau kembali proses dan hasil pembelajaran', color: '#FFE4D6', accent: '#E7622A', icon: '◌' },
  { number: 7, title: 'Evaluasi', description: 'Menilai pemahaman dan ketercapaian tujuan', color: '#FFDDEB', accent: '#D83272', icon: '✓' },
] as const;

export default function StudentHome() {
  const [isOrientationGuideOpen, setIsOrientationGuideOpen] = useState(false);
  const [isArExplorationGuideOpen, setIsArExplorationGuideOpen] = useState(false);
  const [isAiInformationGuideOpen, setIsAiInformationGuideOpen] = useState(false);
  const [isProblemSolvingGuideOpen, setIsProblemSolvingGuideOpen] = useState(false);
  const [isSolutionCreationGuideOpen, setIsSolutionCreationGuideOpen] = useState(false);
  const [isReflectionGuideOpen, setIsReflectionGuideOpen] = useState(false);
  const [isEvaluationGuideOpen, setIsEvaluationGuideOpen] = useState(false);
  const { user } = useAuth();
  const { getProgress } = useAllComicProgress();
  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Siswa';
  const avatarAsset = getAvatarAsset(firstName);
  const comics = useMemo(() => getAllComics(), []);

  const { completedComics, completedSyntax } = useMemo(() => {
    let totalCompletedSyntax = 0;
    let completedComicCount = 0;
    for (const comic of comics) {
      const progress = getProgress(comic.id);
      if (!progress) continue;
      totalCompletedSyntax += progress.completedCount;
      if (progress.isCompleted) completedComicCount += 1;
    }
    return { completedComics: completedComicCount, completedSyntax: totalCompletedSyntax };
  }, [comics, getProgress]);

  return (
    <main className="min-h-[calc(100dvh-88px)] overflow-hidden bg-[#F5F9FF] pb-5 text-[#102F5B]">
      <HomeHeader firstName={firstName} avatarAsset={avatarAsset} />
      <div className="space-y-6 px-4 pb-4 pt-4 sm:px-5">
        <section className="relative min-h-[218px] overflow-hidden rounded-[24px] bg-[#B9DFFF] px-5 py-5 shadow-[0_10px_24px_rgba(55,139,219,0.14)] sm:px-6">
          <div className="relative z-10 max-w-[58%]">
            <h1 className="text-[27px] font-extrabold leading-[1.03] tracking-[-0.04em] text-[#092C62]">Tingkatkan<br />Kemampuan<br />Numerasi Kritis</h1>
            <p className="mt-2 text-[12px] font-medium leading-[1.35] text-[#365576]">dengan Komik, AR, dan AI untuk Pembelajaran yang Lebih Bermakna</p>
            <Link href="/dashboard/siswa/komik" className="mt-4 inline-flex min-h-11 items-center gap-3 rounded-full bg-[#1685EE] px-5 text-[14px] font-bold text-white shadow-[0_8px_16px_rgba(22,133,238,0.25)] transition-transform active:scale-95">Mulai Belajar <span aria-hidden="true" className="text-xl leading-none">›</span></Link>
          </div>
          <Image src="/images/ai/RobotAI.png" alt="Robot AI CINARAI" width={190} height={190} priority className="animate-ai-float absolute -bottom-2 -right-3 h-[175px] w-[175px] object-contain sm:right-2" />
          <span className="absolute right-4 top-5 rounded-xl bg-white/45 px-2 py-2 text-[10px] font-bold leading-tight text-[#24527B]">Numerasi<br />untuk masa depan</span>
        </section>

        <section id="sintaks" aria-labelledby="syntax-heading">
          <div className="flex items-end justify-between gap-3 px-1">
            <div>
              <h2 id="syntax-heading" className="text-[21px] font-extrabold leading-tight tracking-[-0.03em] text-[#102F5B]">Sintaks Model CINARAI</h2>
              <p className="mt-1 text-[12px] leading-snug text-[#667895]">Ikuti 7 langkah pembelajaran untuk mengembangkan numerasi kritis Anda.</p>
            </div>
            <a href="#syntax-cards" className="shrink-0 pb-0.5 text-[12px] font-bold text-[#1685EE]">Lihat Panduan ›</a>
          </div>
          <div id="syntax-cards" className="mt-3 grid grid-cols-2 gap-2.5 min-[390px]:gap-3">
            {syntaxCards.map((card) => {
              const content = (
                <div className="flex h-full min-h-[176px] flex-col rounded-[17px] p-3" style={{ backgroundColor: card.color }}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[16px] font-extrabold text-white" style={{ backgroundColor: card.accent }}>{card.number}</span>
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/65 text-[31px] font-bold leading-none" style={{ color: card.accent }}>{card.icon}</span>
                  </div>
                  <h3 className="mt-2 text-[13px] font-extrabold leading-[1.12] text-[#102F5B]">{card.title}</h3>
                  <p className="mt-1.5 text-[10px] leading-[1.3] text-[#536782]">{card.description}</p>
                </div>
              );
              if (card.number === 1) {
                return (
                  <button
                    key={card.number}
                    type="button"
                    onClick={() => setIsOrientationGuideOpen(true)}
                    aria-label="Buka panduan Orientasi Masalah"
                    className="h-full w-full rounded-[17px] text-left transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(45,131,232,0.18)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2D83E8]/30 active:scale-[0.98]"
                  >
                    {content}
                  </button>
                );
              }
              if (card.number === 2) {
                return (
                  <button
                    key={card.number}
                    type="button"
                    onClick={() => setIsArExplorationGuideOpen(true)}
                    aria-label="Buka panduan Eksplorasi dengan AR"
                    className="h-full w-full rounded-[17px] text-left transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(224,71,134,0.18)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E04786]/30 active:scale-[0.98]"
                  >
                    {content}
                  </button>
                );
              }
              if (card.number === 3) {
                return (
                  <button
                    key={card.number}
                    type="button"
                    onClick={() => setIsAiInformationGuideOpen(true)}
                    aria-label="Buka panduan Penggalian Informasi dengan AI"
                    className="h-full w-full rounded-[17px] text-left transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(217,157,0,0.18)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D99D00]/30 active:scale-[0.98]"
                  >
                    {content}
                  </button>
                );
              }
              if (card.number === 4) {
                return (
                  <button
                    key={card.number}
                    type="button"
                    onClick={() => setIsProblemSolvingGuideOpen(true)}
                    aria-label="Buka panduan Analisis dan Pemecahan Masalah"
                    className="h-full w-full rounded-[17px] text-left transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(66,166,106,0.18)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#42A66A]/30 active:scale-[0.98]"
                  >
                    {content}
                  </button>
                );
              }
              if (card.number === 5) {
                return (
                  <button
                    key={card.number}
                    type="button"
                    onClick={() => setIsSolutionCreationGuideOpen(true)}
                    aria-label="Buka panduan Kreasi Solusi"
                    className="h-full w-full rounded-[17px] text-left transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(117,72,216,0.18)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7548D8]/30 active:scale-[0.98]"
                  >
                    {content}
                  </button>
                );
              }
              if (card.number === 6) {
                return (
                  <button
                    key={card.number}
                    type="button"
                    onClick={() => setIsReflectionGuideOpen(true)}
                    aria-label="Buka panduan Refleksi"
                    className="h-full w-full rounded-[17px] text-left transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(231,98,42,0.18)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E7622A]/30 active:scale-[0.98]"
                  >
                    {content}
                  </button>
                );
              }
              if (card.number === 7) {
                return (
                  <button
                    key={card.number}
                    type="button"
                    onClick={() => setIsEvaluationGuideOpen(true)}
                    aria-label="Buka panduan Evaluasi"
                    className="h-full w-full rounded-[17px] text-left transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(216,50,114,0.18)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D83272]/30 active:scale-[0.98]"
                  >
                    {content}
                  </button>
                );
              }
              return <div key={card.number}>{content}</div>;
            })}
          </div>
        </section>

        {isOrientationGuideOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-[#102F5B]/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
            role="presentation"
            onClick={() => setIsOrientationGuideOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="orientation-guide-title"
              className="relative flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-[28px] bg-white p-5 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(16,47,91,0.2)] sm:max-w-[440px] sm:rounded-[28px] sm:shadow-[0_20px_60px_rgba(16,47,91,0.2)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#DCEEFF] sm:hidden" aria-hidden="true" />
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#DCEEFF] text-2xl text-[#2D83E8]" aria-hidden="true">🔎</span>
                <div>
                  <h2 id="orientation-guide-title" className="text-[22px] font-extrabold leading-tight text-[#102F5B]">Orientasi Masalah</h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#536782]">Kamu akan mengamati cerita dan situasi dalam komik untuk memahami masalah yang sedang terjadi.</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-[#DCEEFF] p-4">
                <h3 className="text-[15px] font-extrabold text-[#102F5B]">🎯 Tujuan</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-[#365576]">Mengenali masalah, informasi penting, dan hal yang perlu dicari tahu.</p>
              </div>

              <div className="mt-5">
                <h3 className="text-[15px] font-extrabold text-[#102F5B]">📌 Apa yang perlu kamu lakukan?</h3>
                <ol className="mt-2 space-y-2 text-[13px] leading-relaxed text-[#536782]">
                  <li>1. 👀 Amati gambar dan cerita</li>
                  <li>2. 💭 Pahami masalah yang terjadi</li>
                  <li>3. 🔍 Temukan informasi penting</li>
                </ol>
              </div>

              <div className="mt-5">
                <h3 className="text-[15px] font-extrabold text-[#102F5B]">💡 Contoh pertanyaan</h3>
                <div className="mt-2 space-y-2 text-[13px] leading-relaxed text-[#536782]">
                  <p className="rounded-xl bg-[#F5F9FF] px-3 py-2">“Masalah apa yang terjadi?”</p>
                  <p className="rounded-xl bg-[#F5F9FF] px-3 py-2">“Informasi apa yang sudah kamu ketahui?”</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOrientationGuideOpen(false)}
                className="mt-6 inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-full bg-[#2D83E8] px-4 text-[15px] font-extrabold text-white shadow-[0_8px_18px_rgba(45,131,232,0.25)] transition-transform hover:bg-[#1F72D1] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2D83E8]/30 active:scale-[0.98]"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}

        <AnimatePresence>
          {isArExplorationGuideOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex animate-fade-in items-end justify-center bg-[#102F5B]/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
            role="presentation"
            onClick={() => setIsArExplorationGuideOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="ar-exploration-guide-title"
              className="relative flex max-h-[92dvh] w-full animate-card-enter flex-col overflow-y-auto rounded-t-[28px] bg-white p-5 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(16,47,91,0.2)] sm:max-w-[440px] sm:rounded-[28px] sm:shadow-[0_20px_60px_rgba(16,47,91,0.2)]"
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#FFE0EF] sm:hidden" aria-hidden="true" />
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#FFE0EF] text-2xl text-[#E04786]" aria-hidden="true">📱</span>
                <div>
                  <h2 id="ar-exploration-guide-title" className="text-[22px] font-extrabold leading-tight text-[#102F5B]">Eksplorasi dengan AR</h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#536782]">Kamu akan menggunakan AR untuk mengamati dan mengeksplorasi objek pembelajaran secara langsung.</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-[#FFE0EF] p-4">
                <h3 className="text-[15px] font-extrabold text-[#102F5B]">🎯 Tujuan</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-[#6B4960]">Menemukan informasi dari objek yang kamu lihat melalui teknologi AR.</p>
              </div>

              <div className="mt-5">
                <h3 className="text-[15px] font-extrabold text-[#102F5B]">📌 Apa yang perlu kamu lakukan?</h3>
                <ol className="mt-2 space-y-2 text-[13px] leading-relaxed text-[#6B4960]">
                  <li>1. 📱 Buka fitur AR</li>
                  <li>2. 👀 Amati objek dari berbagai sisi</li>
                  <li>3. 🔄 Putar dan perhatikan bentuk objek</li>
                  <li>4. 📏 Perhatikan ukuran, bentuk, atau bagian penting objek</li>
                </ol>
              </div>

              <div className="mt-5 rounded-2xl bg-[#FFF7FB] p-4">
                <h3 className="text-[15px] font-extrabold text-[#102F5B]">💡 Ingat</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-[#6B4960]">Amati dengan teliti. Kamu bisa menggunakan hasil pengamatan untuk membantu menyelesaikan masalah.</p>
              </div>

              <button
                type="button"
                onClick={() => setIsArExplorationGuideOpen(false)}
                className="mt-6 inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-full bg-[#E04786] px-4 text-[15px] font-extrabold text-white shadow-[0_8px_18px_rgba(224,71,134,0.25)] transition-transform hover:bg-[#C93673] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E04786]/30 active:scale-[0.98]"
              >
                Mengerti
              </button>
            </motion.div>
          </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isAiInformationGuideOpen && (
            <motion.div
              className="fixed inset-0 z-[100] flex items-end justify-center bg-[#102F5B]/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
              role="presentation"
              onClick={() => setIsAiInformationGuideOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="ai-information-guide-title"
                className="relative flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-[28px] bg-white p-5 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(16,47,91,0.2)] sm:max-w-[440px] sm:rounded-[28px] sm:shadow-[0_20px_60px_rgba(16,47,91,0.2)]"
                onClick={(event) => event.stopPropagation()}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 18 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#FFF1BE] sm:hidden" aria-hidden="true" />
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#FFF1BE] text-2xl text-[#D99D00]" aria-hidden="true">✨</span>
                  <div>
                    <h2 id="ai-information-guide-title" className="text-[22px] font-extrabold leading-tight text-[#102F5B]">Penggalian Informasi dengan AI</h2>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#6B5A2A]">Gunakan AI sebagai teman belajar untuk bertanya, mencari informasi, dan memahami sesuatu yang belum kamu ketahui.</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-[#FFF1BE] p-4">
                  <h3 className="text-[15px] font-extrabold text-[#102F5B]">🎯 Tujuan</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#6B5A2A]">Memperoleh informasi dan petunjuk yang dapat membantu kamu memahami masalah.</p>
                </div>

                <div className="mt-5">
                  <h3 className="text-[15px] font-extrabold text-[#102F5B]">📌 Apa yang perlu kamu lakukan?</h3>
                  <ol className="mt-2 space-y-2 text-[13px] leading-relaxed text-[#6B5A2A]">
                    <li>1. ❓ Tentukan apa yang ingin kamu ketahui</li>
                    <li>2. 🤖 Ajukan pertanyaan kepada AI</li>
                    <li>3. 📚 Baca dan pahami jawabannya</li>
                    <li>4. 🔍 Periksa apakah informasi tersebut sesuai dengan masalah yang sedang dipelajari</li>
                  </ol>
                </div>

                <div className="mt-5 rounded-2xl bg-[#FFFCF0] p-4">
                  <h3 className="text-[15px] font-extrabold text-[#102F5B]">💡 Tips</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#6B5A2A]">Jangan hanya menerima jawaban AI. Pahami alasannya dan gunakan informasi tersebut untuk membantu berpikir.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAiInformationGuideOpen(false)}
                  className="mt-6 inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-full bg-[#D99D00] px-4 text-[15px] font-extrabold text-white shadow-[0_8px_18px_rgba(217,157,0,0.25)] transition-transform hover:bg-[#B98400] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D99D00]/30 active:scale-[0.98]"
                >
                  Mengerti
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isProblemSolvingGuideOpen && (
            <motion.div
              className="fixed inset-0 z-[100] flex items-end justify-center bg-[#102F5B]/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
              role="presentation"
              onClick={() => setIsProblemSolvingGuideOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="problem-solving-guide-title"
                className="relative flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-[28px] bg-white p-5 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(16,47,91,0.2)] sm:max-w-[440px] sm:rounded-[28px] sm:shadow-[0_20px_60px_rgba(16,47,91,0.2)]"
                onClick={(event) => event.stopPropagation()}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 18 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#DDF5E6] sm:hidden" aria-hidden="true" />
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#DDF5E6] text-2xl text-[#42A66A]" aria-hidden="true">📊</span>
                  <div>
                    <h2 id="problem-solving-guide-title" className="text-[22px] font-extrabold leading-tight text-[#102F5B]">Analisis &amp; Pemecahan Masalah</h2>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#42634D]">Gunakan informasi yang sudah kamu temukan untuk memahami masalah dan mencari cara menyelesaikannya.</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-[#DDF5E6] p-4">
                  <h3 className="text-[15px] font-extrabold text-[#102F5B]">🎯 Tujuan</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#42634D]">Melatih kemampuan berpikir kritis, logis, dan menggunakan konsep numerasi untuk menyelesaikan masalah.</p>
                </div>

                <div className="mt-5">
                  <h3 className="text-[15px] font-extrabold text-[#102F5B]">📌 Apa yang perlu kamu lakukan?</h3>
                  <ol className="mt-2 space-y-2 text-[13px] leading-relaxed text-[#42634D]">
                    <li>1. 🔎 Tentukan apa yang diketahui</li>
                    <li>2. ❓ Tentukan apa yang harus dicari</li>
                    <li>3. 🧠 Pilih cara atau strategi penyelesaian</li>
                    <li>4. ✏️ Kerjakan langkah demi langkah</li>
                    <li>5. ✅ Periksa kembali jawabanmu</li>
                  </ol>
                </div>

                <div className="mt-5 rounded-2xl bg-[#F4FBF6] p-4">
                  <h3 className="text-[15px] font-extrabold text-[#102F5B]">💡 Tips</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#42634D]">Jangan terburu-buru. Jelaskan alasanmu pada setiap langkah.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsProblemSolvingGuideOpen(false)}
                  className="mt-6 inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-full bg-[#42A66A] px-4 text-[15px] font-extrabold text-white shadow-[0_8px_18px_rgba(66,166,106,0.25)] transition-transform hover:bg-[#358D58] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#42A66A]/30 active:scale-[0.98]"
                >
                  Mengerti
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isSolutionCreationGuideOpen && (
            <motion.div
              className="fixed inset-0 z-[100] flex items-end justify-center bg-[#102F5B]/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
              role="presentation"
              onClick={() => setIsSolutionCreationGuideOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="solution-creation-guide-title"
                className="relative flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-[28px] bg-white p-5 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(16,47,91,0.2)] sm:max-w-[440px] sm:rounded-[28px] sm:shadow-[0_20px_60px_rgba(16,47,91,0.2)]"
                onClick={(event) => event.stopPropagation()}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 18 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#EAE1FF] sm:hidden" aria-hidden="true" />
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#EAE1FF] text-2xl text-[#7548D8]" aria-hidden="true">✨</span>
                  <div>
                    <h2 id="solution-creation-guide-title" className="text-[22px] font-extrabold leading-tight text-[#102F5B]">Kreasi Solusi</h2>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#574B70]">Sekarang waktunya membuat ide atau karya yang dapat menjadi solusi dari masalah yang sudah kamu pelajari.</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-[#EAE1FF] p-4">
                  <h3 className="text-[15px] font-extrabold text-[#102F5B]">🎯 Tujuan</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#574B70]">Mengubah hasil pemikiran menjadi sebuah solusi atau karya.</p>
                </div>

                <div className="mt-5">
                  <h3 className="text-[15px] font-extrabold text-[#102F5B]">📌 Apa yang perlu kamu lakukan?</h3>
                  <ol className="mt-2 space-y-2 text-[13px] leading-relaxed text-[#574B70]">
                    <li>1. 💡 Buat ide solusi</li>
                    <li>2. ✏️ Rancang bentuk atau cara kerjanya</li>
                    <li>3. 🛠️ Buat karya atau model sederhana</li>
                    <li>4. 🔍 Periksa apakah solusi tersebut dapat membantu menyelesaikan masalah</li>
                  </ol>
                </div>

                <div className="mt-5 rounded-2xl bg-[#F8F5FF] p-4">
                  <h3 className="text-[15px] font-extrabold text-[#102F5B]">💡 Tips</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#574B70]">Gunakan ide sendiri dan jangan takut mencoba cara yang berbeda.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSolutionCreationGuideOpen(false)}
                  className="mt-6 inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-full bg-[#7548D8] px-4 text-[15px] font-extrabold text-white shadow-[0_8px_18px_rgba(117,72,216,0.25)] transition-transform hover:bg-[#6238BB] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7548D8]/30 active:scale-[0.98]"
                >
                  Mengerti
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isReflectionGuideOpen && (
            <motion.div
              className="fixed inset-0 z-[100] flex items-end justify-center bg-[#102F5B]/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
              role="presentation"
              onClick={() => setIsReflectionGuideOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="reflection-guide-title"
                className="relative flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-[28px] bg-white p-5 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(16,47,91,0.2)] sm:max-w-[440px] sm:rounded-[28px] sm:shadow-[0_20px_60px_rgba(16,47,91,0.2)]"
                onClick={(event) => event.stopPropagation()}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 18 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#FFE4D6] sm:hidden" aria-hidden="true" />
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#FFE4D6] text-2xl text-[#E7622A]" aria-hidden="true">💭</span>
                  <div>
                    <h2 id="reflection-guide-title" className="text-[22px] font-extrabold leading-tight text-[#102F5B]">Refleksi</h2>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#79533F]">Berhenti sejenak dan pikirkan kembali apa yang sudah kamu pelajari.</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-[#FFE4D6] p-4">
                  <h3 className="text-[15px] font-extrabold text-[#102F5B]">🎯 Tujuan</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#79533F]">Mengetahui apa yang sudah dipahami, apa yang masih sulit, dan pengalaman selama belajar.</p>
                </div>

                <div className="mt-5">
                  <h3 className="text-[15px] font-extrabold text-[#102F5B]">📌 Apa yang perlu kamu lakukan?</h3>
                  <ol className="mt-2 space-y-2 text-[13px] leading-relaxed text-[#79533F]">
                    <li>1. 🧠 Ingat kembali apa yang sudah dipelajari</li>
                    <li>2. 💡 Tuliskan hal baru yang kamu pahami</li>
                    <li>3. 🤔 Pikirkan bagian yang masih sulit</li>
                    <li>4. 🌱 Tentukan apa yang ingin kamu pelajari lagi</li>
                  </ol>
                </div>

                <div className="mt-5">
                  <h3 className="text-[15px] font-extrabold text-[#102F5B]">💡 Pertanyaan untukmu</h3>
                  <div className="mt-2 space-y-2 text-[13px] leading-relaxed text-[#79533F]">
                    <p className="rounded-xl bg-[#FFF8F4] px-3 py-2">“Apa hal paling menarik yang kamu pelajari?”</p>
                    <p className="rounded-xl bg-[#FFF8F4] px-3 py-2">“Bagian mana yang paling sulit?”</p>
                    <p className="rounded-xl bg-[#FFF8F4] px-3 py-2">“Apa yang sekarang sudah bisa kamu lakukan?”</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsReflectionGuideOpen(false)}
                  className="mt-6 inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-full bg-[#E7622A] px-4 text-[15px] font-extrabold text-white shadow-[0_8px_18px_rgba(231,98,42,0.25)] transition-transform hover:bg-[#D15220] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E7622A]/30 active:scale-[0.98]"
                >
                  Mengerti
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isEvaluationGuideOpen && (
            <motion.div
              className="fixed inset-0 z-[100] flex items-end justify-center bg-[#102F5B]/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
              role="presentation"
              onClick={() => setIsEvaluationGuideOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="evaluation-guide-title"
                className="relative flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-[28px] bg-white p-5 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(16,47,91,0.2)] sm:max-w-[440px] sm:rounded-[28px] sm:shadow-[0_20px_60px_rgba(16,47,91,0.2)]"
                onClick={(event) => event.stopPropagation()}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 18 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#FFDDEB] sm:hidden" aria-hidden="true" />
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#FFDDEB] text-2xl text-[#D83272]" aria-hidden="true">✅</span>
                  <div>
                    <h2 id="evaluation-guide-title" className="text-[22px] font-extrabold leading-tight text-[#102F5B]">Evaluasi</h2>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#76465A]">Uji kembali pemahamanmu dan lihat sejauh mana kamu sudah mencapai tujuan pembelajaran.</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-[#FFDDEB] p-4">
                  <h3 className="text-[15px] font-extrabold text-[#102F5B]">🎯 Tujuan</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#76465A]">Mengetahui pemahaman dan kemampuan setelah menyelesaikan proses pembelajaran.</p>
                </div>

                <div className="mt-5">
                  <h3 className="text-[15px] font-extrabold text-[#102F5B]">📌 Apa yang perlu kamu lakukan?</h3>
                  <ol className="mt-2 space-y-2 text-[13px] leading-relaxed text-[#76465A]">
                    <li>1. 📝 Kerjakan kuis atau tugas</li>
                    <li>2. 🧠 Gunakan apa yang sudah kamu pelajari</li>
                    <li>3. 🔍 Periksa kembali jawabanmu</li>
                    <li>4. 🎯 Lihat hasil dan pencapaianmu</li>
                  </ol>
                </div>

                <div className="mt-5 rounded-2xl bg-[#FFF6FA] p-4">
                  <h3 className="text-[15px] font-extrabold text-[#102F5B]">💡 Ingat</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#76465A]">Kesalahan bukan berarti gagal. Gunakan hasil evaluasi untuk mengetahui bagian yang perlu kamu pelajari lagi.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEvaluationGuideOpen(false)}
                  className="mt-6 inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-full bg-[#D83272] px-4 text-[15px] font-extrabold text-white shadow-[0_8px_18px_rgba(216,50,114,0.25)] transition-transform hover:bg-[#BF2861] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D83272]/30 active:scale-[0.98]"
                >
                  Mengerti
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <section id="progress" aria-labelledby="progress-heading">
          <div className="flex items-center justify-between px-1">
            <h2 id="progress-heading" className="text-[21px] font-extrabold tracking-[-0.03em] text-[#102F5B]">Progres Belajarmu</h2>
            <Link href="/dashboard/siswa/profil" className="text-[12px] font-bold text-[#1685EE]">Lihat Semua ›</Link>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5 min-[390px]:gap-3">
            <div className="flex min-h-[88px] items-center gap-3 rounded-[18px] bg-white px-3 shadow-[0_6px_18px_rgba(32,83,143,0.08)] ring-1 ring-[#E8F0F8]">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#FFF0E4] text-[27px]" aria-hidden="true">🔥</span>
              <span><strong className="block text-[22px] leading-none text-[#102F5B]">{completedComics > 0 ? Math.min(14, 3 + completedComics) : 0}</strong><span className="mt-1 block text-[10px] leading-tight text-[#71819A]">Hari Berturut-turut</span></span>
            </div>
            <div className="flex min-h-[88px] items-center gap-3 rounded-[18px] bg-white px-3 shadow-[0_6px_18px_rgba(32,83,143,0.08)] ring-1 ring-[#E8F0F8]">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#FFF0E4] text-[27px]" aria-hidden="true">🎯</span>
              <span><strong className="block text-[22px] leading-none text-[#102F5B]">{Math.min(7, completedSyntax)}/7</strong><span className="mt-1 block text-[10px] leading-tight text-[#71819A]">Sintaks Selesai</span></span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}