'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
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
  href: string;
  ariaLabel: string;
  cta: string;
};

const syntaxCards: SyntaxCard[] = [
  { number: 1, title: 'Orientasi Masalah', description: 'Mulai dengan memahami konteks masalah', color: '#DCEEFF', accent: '#2D83E8', icon: '⌕', href: '/dashboard/siswa/komik', ariaLabel: 'Pelajari Orientasi Masalah di Komik', cta: 'Mulai ›' },
  { number: 2, title: 'Eksplorasi dengan AR', description: 'Jelajahi AR melalui komik yang relevan', color: '#FFE0EF', accent: '#E04786', icon: '◇', href: '/dashboard/siswa/komik', ariaLabel: 'Jelajahi AR melalui Komik', cta: 'Jelajahi ›' },
  { number: 3, title: 'Penggalian Informasi dengan AI', description: 'Gunakan AI Tutor untuk belajar lebih dalam', color: '#FFF1BE', accent: '#D99D00', icon: '✦', href: '/dashboard/siswa/ai-tutor', ariaLabel: 'Gunakan AI Tutor', cta: 'Mulai ›' },
  { number: 4, title: 'Analisis & Pemecahan Masalah', description: 'Lanjutkan aktivitas analisis di komik', color: '#DDF5E6', accent: '#42A66A', icon: '▤', href: '/dashboard/siswa/komik', ariaLabel: 'Lanjutkan analisis dan pemecahan masalah di Komik', cta: 'Analisis ›' },
  { number: 5, title: 'Kreasi Solusi', description: 'Buat solusi dari aktivitas komik yang tersedia', color: '#EAE1FF', accent: '#7548D8', icon: '✧', href: '/dashboard/siswa/komik', ariaLabel: 'Buat solusi melalui aktivitas komik', cta: 'Buat ›' },
  { number: 6, title: 'Refleksi', description: 'Lakukan refleksi setelah aktivitas belajar', color: '#FFE4D6', accent: '#E7622A', icon: '◌', href: '/dashboard/siswa/komik', ariaLabel: 'Lakukan refleksi melalui komik', cta: 'Refleksi ›' },
  { number: 7, title: 'Evaluasi', description: 'Kerjakan kuis untuk mengevaluasi pemahaman', color: '#FFDDEB', accent: '#D83272', icon: '✓', href: '/dashboard/siswa/kuis', ariaLabel: 'Kerjakan evaluasi dan kuis', cta: 'Kerjakan ›' },
] as const;

const syntaxGuides = {
  1: {
    title: 'Orientasi Masalah',
    goal: 'Memahami cerita, situasi, dan masalah yang terdapat dalam komik.',
    actions: [
      '👀 Amati cerita dan gambar pada komik.',
      '💭 Pahami situasi yang sedang terjadi.',
      '🔍 Temukan masalah yang perlu diselesaikan.',
      '📌 Catat informasi penting yang kamu temukan.',
    ],
    result: 'Kamu memahami masalah sebelum mulai mencari solusinya.',
  },
  2: {
    title: 'Eksplorasi dengan AR',
    goal: 'Menjelajahi informasi dan objek pembelajaran melalui komik serta fitur AR yang tersedia.',
    actions: [
      '📖 Baca dan ikuti cerita pada komik.',
      '🔍 Amati objek dan informasi yang ditampilkan.',
      '📱 Gunakan fitur AR jika tersedia pada bagian pembelajaran.',
      '💡 Catat hal menarik atau informasi penting yang kamu temukan.',
    ],
    result: 'Kamu mendapatkan informasi melalui komik dan eksplorasi AR sebagai bahan untuk pembelajaran berikutnya.',
  },
  3: {
    title: 'Penggalian Informasi dengan AI',
    goal: 'Memperdalam pemahaman dengan bertanya dan berdiskusi bersama AI Tutor.',
    actions: [
      '💬 Ajukan pertanyaan tentang materi yang sedang dipelajari.',
      '🤖 Gunakan AI Tutor untuk mendapatkan penjelasan.',
      '🧠 Hubungkan jawaban AI dengan informasi dari komik.',
      '🔎 Gunakan informasi tersebut untuk memperdalam pemahamanmu.',
    ],
    result: 'Kamu mendapatkan pemahaman yang lebih mendalam dengan bantuan AI Tutor.',
  },
  4: {
    title: 'Analisis & Pemecahan Masalah',
    goal: 'Menggunakan informasi yang sudah ditemukan untuk memahami dan menyelesaikan masalah.',
    actions: [
      '🔎 Periksa informasi yang tersedia.',
      '🧩 Hubungkan informasi dengan konsep yang dipelajari.',
      '💡 Tentukan cara menyelesaikan masalah.',
      '✅ Periksa kembali jawabanmu.',
    ],
    result: 'Kamu dapat menyelesaikan masalah dengan alasan yang logis.',
  },
  5: {
    title: 'Kreasi Solusi',
    goal: 'Membuat atau menentukan solusi berdasarkan hasil pembelajaran.',
    actions: [
      '💭 Gunakan ide yang kamu miliki.',
      '🧩 Hubungkan dengan hasil pengamatan.',
      '🛠️ Buat atau pilih solusi yang sesuai.',
      '💬 Jelaskan alasanmu.',
    ],
    result: 'Kamu dapat menghasilkan solusi berdasarkan apa yang sudah dipelajari.',
  },
  6: {
    title: 'Refleksi',
    goal: 'Melihat kembali proses dan pengalaman belajar yang sudah kamu lakukan.',
    actions: [
      '💭 Ingat kembali apa yang sudah dipelajari.',
      '⭐ Temukan hal yang paling kamu pahami.',
      '🤔 Pikirkan bagian yang masih sulit.',
      '🌱 Tentukan apa yang ingin kamu pelajari lagi.',
    ],
    result: 'Kamu mengetahui apa yang sudah dipahami dan apa yang masih perlu dipelajari.',
  },
  7: {
    title: 'Evaluasi',
    goal: 'Mengetahui sejauh mana pemahamanmu setelah mengikuti pembelajaran.',
    actions: [
      '📝 Kerjakan soal evaluasi.',
      '🧠 Gunakan pengetahuan yang sudah dipelajari.',
      '🔍 Periksa kembali jawabanmu.',
      '📊 Lihat hasil belajarmu.',
    ],
    result: 'Kamu dapat mengetahui tingkat pemahamanmu setelah menyelesaikan pembelajaran.',
  },
} as const;

export default function StudentHome() {
  const { user } = useAuth();
  const { getProgress } = useAllComicProgress();
  const router = useRouter();
  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Siswa';
  const avatarAsset = getAvatarAsset(firstName);
  const comics = useMemo(() => getAllComics(), []);
  const [selectedCard, setSelectedCard] = useState<SyntaxCard | null>(null);

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

  const activeGuide = selectedCard ? syntaxGuides[selectedCard.number as keyof typeof syntaxGuides] : null;

  const handleGuideConfirm = () => {
    if (!selectedCard) return;

    const routeBySyntax: Record<number, string | null> = {
      1: null,
      2: '/dashboard/siswa/komik',
      3: '/dashboard/siswa/ai-tutor',
      4: null,
      5: null,
      6: null,
      7: null,
    };

    const destination = routeBySyntax[selectedCard.number];
    setSelectedCard(null);

    if (destination) {
      router.push(destination);
    }
  };

  useEffect(() => {
    if (!selectedCard) return;

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [selectedCard]);

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
            <a href="#syntax-cards" className="shrink-0 pb-0.5 text-[12px] font-bold text-[#1685EE]">Lihat Tahap ›</a>
          </div>
          <div id="syntax-cards" className="mt-3 grid grid-cols-2 gap-2.5 min-[390px]:gap-3">
            {syntaxCards.map((card) => {
              const isModalCard = [1, 2, 3, 4, 5, 6, 7].includes(card.number);

              if (isModalCard) {
                return (
                  <button
                    key={card.number}
                    type="button"
                    onClick={() => setSelectedCard(card)}
                    aria-label={card.ariaLabel}
                    className="group block h-full w-full cursor-pointer rounded-[17px] text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(16,47,91,0.12)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2D83E8]/30 active:scale-[0.98]"
                  >
                    <div className="flex h-full min-h-[176px] flex-col rounded-[17px] p-3" style={{ backgroundColor: card.color }}>
                      <div className="flex items-start justify-between gap-2">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[16px] font-extrabold text-white" style={{ backgroundColor: card.accent }}>{card.number}</span>
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/65 text-[31px] font-bold leading-none" style={{ color: card.accent }}>{card.icon}</span>
                      </div>

                      <div className="mt-2 flex-1">
                        <h3 className="text-[13px] font-extrabold leading-[1.12] text-[#102F5B]">{card.title}</h3>
                        <p className="mt-1.5 text-[10px] leading-[1.3] text-[#536782]">{card.description}</p>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center rounded-full bg-white/70 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#102F5B]">
                          {card.cta}
                        </span>
                        <span aria-hidden="true" className="text-[18px] font-bold text-[#102F5B]">›</span>
                      </div>
                    </div>
                  </button>
                );
              }

              return (
                <Link
                  key={card.number}
                  href={card.href}
                  aria-label={card.ariaLabel}
                  className="group block h-full w-full cursor-pointer rounded-[17px] text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(16,47,91,0.12)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2D83E8]/30 active:scale-[0.98]"
                >
                  <div className="flex h-full min-h-[176px] flex-col rounded-[17px] p-3" style={{ backgroundColor: card.color }}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[16px] font-extrabold text-white" style={{ backgroundColor: card.accent }}>{card.number}</span>
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/65 text-[31px] font-bold leading-none" style={{ color: card.accent }}>{card.icon}</span>
                    </div>

                    <div className="mt-2 flex-1">
                      <h3 className="text-[13px] font-extrabold leading-[1.12] text-[#102F5B]">{card.title}</h3>
                      <p className="mt-1.5 text-[10px] leading-[1.3] text-[#536782]">{card.description}</p>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-full bg-white/70 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#102F5B]">
                        {card.cta}
                      </span>
                      <span aria-hidden="true" className="text-[18px] font-bold text-[#102F5B]">›</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {selectedCard && activeGuide && (
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/40 p-0 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:items-center sm:p-4 sm:pb-4"
            onClick={() => setSelectedCard(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="syntax-modal-title"
              className="relative z-10 flex max-h-[calc(100dvh-90px)] w-full max-w-[540px] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-20px_60px_rgba(15,23,42,0.18)] sm:rounded-[28px]"
              onClick={(event) => event.stopPropagation()}
            >
              <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 pb-3 pt-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full text-[16px] font-extrabold text-white" style={{ backgroundColor: selectedCard.accent }}>{selectedCard.number}</span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">SINTAKS {selectedCard.number}</p>
                    <h3 id="syntax-modal-title" className="text-lg font-extrabold text-[#102F5B]">{selectedCard.title}</h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCard(null)}
                  aria-label="Tutup modal sintaks"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-600 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2D83E8]/30"
                >
                  ×
                </button>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch]">
                <div className="space-y-4 px-4 py-4">
                  <div className="rounded-[18px] p-4" style={{ backgroundColor: selectedCard.color }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">Tujuan tahap</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{activeGuide.goal}</p>
                  </div>

                  <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4 text-left">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#102F5B]">Apa yang kamu lakukan?</p>
                    <ul className="mt-2 space-y-2 text-sm leading-relaxed text-slate-700">
                      {activeGuide.actions.map((action) => (
                        <li key={action} className="flex gap-2">
                          <span className="shrink-0">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#102F5B]">Hasil yang diharapkan</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{activeGuide.result}</p>
                  </div>
                </div>
              </div>

              <footer className="shrink-0 border-t border-slate-200 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3">
                <button
                  type="button"
                  onClick={handleGuideConfirm}
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-[#1685EE] px-4 py-3 text-base font-bold text-white shadow-[0_8px_18px_rgba(22,133,238,0.2)] transition hover:bg-[#1479d4] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2D83E8]/30"
                >
                  MENGERTI
                </button>
              </footer>
            </div>
          </div>
        )}

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