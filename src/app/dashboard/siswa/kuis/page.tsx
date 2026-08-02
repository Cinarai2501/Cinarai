'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { getAllComics } from '@/lib/comicRepository';
import { getAllUnlockStatuses } from '@/lib/unlockEngine';
import { useAllComicProgress } from '@/hooks/useAllComicProgress';

type QuizItem = {
  id: number;
  comicId: number;
  title: string;
  soalCount: number;
  difficulty: 'Mudah' | 'Menengah' | 'Sulit';
  iconType: 'cube' | 'pyramid' | 'cylinder' | 'cube-green' | 'search';
  bgColor: string;
};

const QUIZ_LIST: QuizItem[] = [
  {
    id: 1,
    comicId: 1,
    title: 'Kuis Bangun Ruang Dasar',
    soalCount: 10,
    difficulty: 'Mudah',
    iconType: 'cube',
    bgColor: 'bg-[#EEF6FF]',
  },
  {
    id: 2,
    comicId: 2,
    title: 'Kuis Ciri-Ciri Bangun Datar',
    soalCount: 10,
    difficulty: 'Menengah',
    iconType: 'pyramid',
    bgColor: 'bg-[#FFEFEF]',
  },
  {
    id: 3,
    comicId: 3,
    title: 'Kuis Rumus Luas',
    soalCount: 10,
    difficulty: 'Menengah',
    iconType: 'cylinder',
    bgColor: 'bg-[#FFFBEB]',
  },
  {
    id: 4,
    comicId: 4,
    title: 'Kuis Volume Bangun Ruang',
    soalCount: 15,
    difficulty: 'Sulit',
    iconType: 'cube-green',
    bgColor: 'bg-[#ECFDF5]',
  },
  {
    id: 5,
    comicId: 5,
    title: 'Kuis Identifikasi Bentuk di Sekitar Kita',
    soalCount: 15,
    difficulty: 'Mudah',
    iconType: 'search',
    bgColor: 'bg-[#F3E8FF]',
  },
];

function QuizIcon({ type }: { type: QuizItem['iconType'] }) {
  switch (type) {
    case 'cube':
      return (
        <svg viewBox="0 0 24 24" className="h-[36px] w-[36px] text-[#0066FF]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    case 'pyramid':
      return (
        <svg viewBox="0 0 24 24" className="h-[36px] w-[36px] text-[#EF4444]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 19h20L12 2z" />
          <path d="M12 2v17" />
        </svg>
      );
    case 'cylinder':
      return (
        <svg viewBox="0 0 24 24" className="h-[36px] w-[36px] text-[#F59E0B]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
        </svg>
      );
    case 'cube-green':
      return (
        <svg viewBox="0 0 24 24" className="h-[36px] w-[36px] text-[#10B981]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    case 'search':
      return (
        <svg viewBox="0 0 24 24" className="h-[36px] w-[36px] text-[#A855F7]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    default:
      return null;
  }
}

export default function DashboardSiswaKuisPage() {
  const { states, getProgress, isLoading } = useAllComicProgress();
  const [activeTab, setActiveTab] = useState<'Tersedia' | 'Riwayat'>('Tersedia');
  const comics = useMemo(() => getAllComics(), []);
  const unlockStatuses = useMemo(() => getAllUnlockStatuses(states), [states]);

  // Compute completed & progress counts for stats
  const { completedCount, totalQuestionsAnswered, avgScore } = useMemo(() => {
    let completed = 0;
    for (const comic of comics) {
      const p = getProgress(comic.id);
      if (p?.isCompleted) completed += 1;
    }
    return {
      completedCount: completed,
      totalQuestionsAnswered: completed * 10,
      avgScore: completed > 0 ? 85 : 0,
    };
  }, [comics, getProgress]);

  // In-progress quiz (e.g. comic 1 or first active)
  const inProgressQuiz = useMemo(() => {
    for (const quiz of QUIZ_LIST) {
      const p = getProgress(quiz.comicId);
      if (p && p.percentage > 0 && !p.isCompleted) {
        return { ...quiz, progressPct: p.percentage };
      }
    }
    // Fallback default in-progress display for blueprint demo
    return { ...QUIZ_LIST[0], progressPct: 60 };
  }, [getProgress]);

  const availableQuizzes = useMemo(() => {
    return QUIZ_LIST.filter((q) => unlockStatuses.get(q.comicId) !== 'COMING_SOON');
  }, [unlockStatuses]);

  return (
    <div className="mx-auto min-h-screen max-w-[1200px] bg-[#F8FAFC] pb-[88px] text-neutral-900">
      {/* 1. HEADER */}
      <section className="sticky top-0 z-40 w-full overflow-hidden rounded-b-[32px] bg-gradient-to-br from-[#FF6B00] to-[#FF8800] px-5 pb-6 pt-[max(20px,env(safe-area-inset-top))] text-white shadow-md">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-[24px] font-extrabold leading-tight tracking-tight text-white">
              Kuis
            </h1>
            <p className="mt-1 text-[13px] font-medium leading-relaxed text-white/90">
              Belajar makin seru dengan kuis!
            </p>
          </div>

          <div className="relative flex h-[70px] w-[70px] shrink-0 items-center justify-center">
            <span className="text-[54px] leading-none drop-shadow-md">🏆</span>
          </div>
        </div>
      </section>

      <div className="px-5 pt-4 space-y-4">
        {/* 2. TAB NAVIGASI (Tersedia | Riwayat) */}
        <div className="flex rounded-full bg-[#F1F5F9] p-1 text-[14px] font-bold border border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab('Tersedia')}
            className={`flex-1 rounded-full py-2.5 text-center transition-all ${
              activeTab === 'Tersedia'
                ? 'bg-[#FF6B00] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tersedia
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('Riwayat')}
            className={`flex-1 rounded-full py-2.5 text-center transition-all ${
              activeTab === 'Riwayat'
                ? 'bg-[#FF6B00] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Riwayat
          </button>
        </div>

        {activeTab === 'Tersedia' ? (
          <>
            {/* 3. LANJUTKAN KUIS SECTION */}
            {inProgressQuiz && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5 text-[15px] font-bold text-[#1E293B]">
                  <span className="text-[#FF6B00]">⭐</span>
                  <h2>Lanjutkan Kuis</h2>
                </div>
                <p className="-mt-1 text-[12px] font-medium text-slate-500">
                  Selesaikan kuis yang sedang kamu kerjakan
                </p>

                <div className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className={`flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-2xl ${inProgressQuiz.bgColor} shadow-sm border border-slate-100`}>
                      <QuizIcon type={inProgressQuiz.iconType} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[15px] font-bold text-slate-900 truncate">
                        {inProgressQuiz.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-[12px] font-medium">
                        <span className="text-[#FF6B00] font-bold">{inProgressQuiz.soalCount} Soal</span>
                        <span className="text-slate-300">|</span>
                        <span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[11px] font-bold text-[#15803D]">
                          {inProgressQuiz.difficulty}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[11px] font-medium text-slate-500">Progress</span>
                        <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#FF6B00] transition-all duration-500"
                            style={{ width: `${inProgressQuiz.progressPct}%` }}
                          />
                        </div>
                        <span className="text-[12px] font-bold text-slate-600">{inProgressQuiz.progressPct}%</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/comic/${inProgressQuiz.comicId}/learn`}
                    className="shrink-0 rounded-full bg-[#FF6B00] px-4 py-2 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#E66000] active:scale-95"
                  >
                    Lanjutkan
                  </Link>
                </div>
              </div>
            )}

            {/* 4. KUIS TERSEDIA SECTION */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-1.5 text-[15px] font-bold text-[#1E293B]">
                <span className="text-[#FF6B00]">⭐</span>
                <h2>Kuis Tersedia</h2>
              </div>
              <p className="-mt-1 text-[12px] font-medium text-slate-500">
                Pilih kuis untuk menguji pemahamanmu
              </p>

              <div className="space-y-3 pt-1">
                {isLoading ? (
                  [1, 2, 3].map((i) => (
                    <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
                  ))
                ) : (
                  availableQuizzes.map((quiz) => {
                    const progress = getProgress(quiz.comicId);
                    const isCompleted = progress?.isCompleted ?? false;
                    const isStarted = (progress?.percentage ?? 0) > 0;

                    return (
                      <div
                        key={quiz.id}
                        className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-slate-100 flex items-center justify-between gap-3 transition hover:shadow-md"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className={`flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-2xl ${quiz.bgColor} shadow-sm border border-slate-100`}>
                            <QuizIcon type={quiz.iconType} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-[15px] font-bold text-slate-900 truncate">
                              {quiz.title}
                            </h3>
                            <div className="mt-1 flex items-center gap-2 text-[12px] font-medium">
                              <span className="text-[#FF6B00] font-bold">{quiz.soalCount} Soal</span>
                              <span className="text-slate-300">|</span>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                  quiz.difficulty === 'Mudah'
                                    ? 'bg-[#DCFCE7] text-[#15803D]'
                                    : quiz.difficulty === 'Menengah'
                                    ? 'bg-[#FEF3C7] text-[#D97706]'
                                    : 'bg-[#FFE4E6] text-[#E11D48]'
                                }`}
                              >
                                {quiz.difficulty}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] font-medium text-slate-400">
                              {isCompleted ? 'Sudah selesai' : isStarted ? 'Sedang dikerjakan' : 'Belum dikerjakan'}
                            </p>
                          </div>
                        </div>

                        <Link
                          href={`/comic/${quiz.comicId}/learn`}
                          className="shrink-0 rounded-full bg-[#0066FF] px-5 py-2 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#0055FF] active:scale-95"
                        >
                          Mulai
                        </Link>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        ) : (
          /* TAB RIWAYAT */
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm border border-slate-100">
            <p className="text-[14px] font-semibold text-slate-500">
              Riwayat hasil kuis kamu akan ditampilkan di sini.
            </p>
          </div>
        )}

        {/* 5. STATISTIK KUIS SECTION */}
        <div className="space-y-2 pt-3 pb-4">
          <div className="flex items-center gap-1.5 text-[15px] font-bold text-[#1E293B]">
            <span className="text-[#FF6B00]">📊</span>
            <h2>Statistik Kuis</h2>
          </div>
          <p className="-mt-1 text-[12px] font-medium text-slate-500">
            Ringkasan performa kuis kamu
          </p>

          <div className="grid grid-cols-4 gap-2 rounded-2xl bg-white p-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-slate-100">
            {/* Stat 1: Kuis Selesai */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#0066FF] text-white shadow-sm">
                <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <p className="mt-2 text-[18px] font-extrabold leading-none text-slate-900">{completedCount}</p>
              <p className="mt-1 text-[10px] font-semibold text-slate-500 leading-tight">Kuis Selesai</p>
            </div>

            {/* Stat 2: Rata-rata Nilai */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#22C55E] text-white shadow-sm">
                <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="mt-2 text-[18px] font-extrabold leading-none text-slate-900">{avgScore}%</p>
              <p className="mt-1 text-[10px] font-semibold text-slate-500 leading-tight">Rata-rata Nilai</p>
            </div>

            {/* Stat 3: Streak Kuis */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#F97316] text-white shadow-sm">
                <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor">
                  <path d="M12 23c-4.97 0-9-4.03-9-9 0-3.53 2.04-6.58 5-8.05.55-.28 1.23.03 1.35.63.18.91.56 1.76 1.1 2.5 1.05-2.07 2.87-3.66 5.08-4.39.6-.2 1.2.25 1.2.89 0 2.21 1.79 4 4 4 .55 0 1.07-.11 1.55-.31.59-.25 1.25.16 1.25.8 0 7.18-5.82 13-11.53 13z" />
                </svg>
              </div>
              <p className="mt-2 text-[18px] font-extrabold leading-none text-slate-900">{completedCount > 0 ? 3 : 0}</p>
              <p className="mt-1 text-[10px] font-semibold text-slate-500 leading-tight">Streak Kuis</p>
            </div>

            {/* Stat 4: Total Soal Dikerjakan */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#8B5CF6] text-white shadow-sm">
                <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <p className="mt-2 text-[18px] font-extrabold leading-none text-slate-900">{totalQuestionsAnswered}</p>
              <p className="mt-1 text-[10px] font-semibold text-slate-500 leading-tight">Total Soal Dikerjakan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
