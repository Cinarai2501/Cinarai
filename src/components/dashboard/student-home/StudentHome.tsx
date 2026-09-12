'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
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
  href?: string;
};

const syntaxCards: SyntaxCard[] = [
  { number: 1, title: 'Orientasi Masalah', description: 'Mengamati dan memahami masalah', color: '#DCEEFF', accent: '#2D83E8', icon: '⌕' },
  { number: 2, title: 'Eksplorasi dengan AR', description: 'Mengamati dan mengeksplorasi melalui teknologi AR', color: '#FFE0EF', accent: '#E04786', icon: '◇', href: '/dashboard/siswa/komik' },
  { number: 3, title: 'Penggalian Informasi dengan AI', description: 'Bertanya, mencari informasi, dan menganalisis data', color: '#FFF1BE', accent: '#D99D00', icon: '✦', href: '/dashboard/siswa/ai-tutor' },
  { number: 4, title: 'Analisis & Pemecahan Masalah', description: 'Menyelesaikan masalah secara kritis dan logis', color: '#DDF5E6', accent: '#42A66A', icon: '▤' },
  { number: 5, title: 'Kreasi Solusi', description: 'Membuat produk atau hasil karya sebagai solusi masalah', color: '#EAE1FF', accent: '#7548D8', icon: '✧' },
  { number: 6, title: 'Refleksi', description: 'Meninjau kembali proses dan hasil pembelajaran', color: '#FFE4D6', accent: '#E7622A', icon: '◌' },
  { number: 7, title: 'Evaluasi', description: 'Menilai pemahaman dan ketercapaian tujuan', color: '#FFDDEB', accent: '#D83272', icon: '✓' },
] as const;

export default function StudentHome() {
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
            <a href="#progress" className="shrink-0 pb-0.5 text-[12px] font-bold text-[#1685EE]">Lihat Panduan ›</a>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5 min-[390px]:gap-3">
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
              return card.href ? <Link key={card.number} href={card.href} className="block transition-transform active:scale-[0.98]" aria-label={`${card.title}, buka halaman terkait`}>{content}</Link> : <div key={card.number}>{content}</div>;
            })}
          </div>
        </section>

        <section id="progress" aria-labelledby="progress-heading">
          <div className="flex items-center justify-between px-1">
            <h2 id="progress-heading" className="text-[21px] font-extrabold tracking-[-0.03em] text-[#102F5B]">Progres Belajarmu</h2>
            <Link href="/dashboard/siswa/profil" className="text-[12px] font-bold text-[#1685EE]">Lihat Semua ›</Link>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5 min-[390px]:gap-3">
            <div className="flex min-h-[88px] items-center gap-3 rounded-[18px] bg-white px-3 shadow-[0_6px_18px_rgba(32,83,143,0.08)] ring-1 ring-[#E8F0F8]">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#FFF0E4] text-[27px]" aria-hidden="true">🔥</span>
              <span><strong className="block text-[22px] leading-none text-[#102F5B]">{completedComics > 0 ? Math.min(14, 3 + completedComics) : 3}</strong><span className="mt-1 block text-[10px] leading-tight text-[#71819A]">Hari Berturut-turut</span></span>
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