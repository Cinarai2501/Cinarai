'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import PptxViewer from '@/features/learning-modules/bangun-ruang/PptxViewer';
import { BANGUN_RUANG_MODULE } from '@/features/learning-modules/bangun-ruang/module';
import { getLearningModuleProgress, saveLearningModuleProgress, type LearningModuleStatus } from '@/features/learning-modules/bangun-ruang/progress';

export default function BangunRuangModulePage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<LearningModuleStatus>('not_started');
  const [completedItems, setCompletedItems] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [view, setView] = useState<'detail' | 'viewer'>('detail');
  const maxCompletedItemsRef = useRef(0);
  const statusRef = useRef<LearningModuleStatus>('not_started');

  useEffect(() => {
    if (!user?.uid) return;
    void getLearningModuleProgress(user.uid).then((progress) => {
      if (!progress) return;
      setStatus(progress.status);
      statusRef.current = progress.status;
      setCompletedItems(progress.completedItems);
      setTotalItems(progress.totalItems);
      maxCompletedItemsRef.current = progress.completedItems;
    });
  }, [user?.uid]);

  const handleSlideRead = useCallback((slideNumber: number, slideCount: number) => {
    const nextCompletedItems = Math.max(maxCompletedItemsRef.current, slideNumber);
    maxCompletedItemsRef.current = nextCompletedItems;
    setTotalItems(slideCount);
    setCompletedItems(nextCompletedItems);
    if (statusRef.current !== 'completed') {
      statusRef.current = 'in_progress';
      setStatus('in_progress');
    }
    if (user?.uid && statusRef.current !== 'completed') {
      void saveLearningModuleProgress(user.uid, { completedItems: nextCompletedItems, totalItems: slideCount, status: 'in_progress' });
    }
  }, [user?.uid]);

  const handleComplete = useCallback((slideCount: number) => {
    setStatus('completed');
    statusRef.current = 'completed';
    setCompletedItems(slideCount);
    setTotalItems(slideCount);
    maxCompletedItemsRef.current = slideCount;
    if (user?.uid) {
      void saveLearningModuleProgress(user.uid, { completedItems: slideCount, totalItems: slideCount, status: 'completed' });
    }
    setView('detail');
  }, [user?.uid]);

  const handleResetProgress = useCallback((slideCount: number) => {
    statusRef.current = 'not_started';
    maxCompletedItemsRef.current = 0;
    setStatus('not_started');
    setCompletedItems(0);
    setTotalItems(slideCount);
    if (user?.uid) {
      void saveLearningModuleProgress(user.uid, { completedItems: 0, totalItems: slideCount, status: 'not_started' });
    }
  }, [user?.uid]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F5F9FF] px-4 py-5 text-[#102F5B] sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/dashboard/siswa/komik" className="inline-flex text-sm font-bold text-[#1685EE]">← Kembali ke daftar materi</Link>
        {view === 'detail' ? (
          <section className="mt-5 rounded-[24px] bg-white p-6 shadow-[0_12px_30px_rgba(16,47,91,0.08)] sm:p-8">
            <div className="flex items-start gap-3">
              <span className="text-3xl" aria-hidden="true">📘</span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#0DBF7E]">{BANGUN_RUANG_MODULE.label}</p>
                <h1 className="mt-1 text-2xl font-extrabold leading-tight">{BANGUN_RUANG_MODULE.title}</h1>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-[#536782]">{BANGUN_RUANG_MODULE.description}</p>
            {totalItems > 0 && <p className="mt-4 text-sm font-bold text-[#536782]">Progress: {completedItems} / {totalItems} slide</p>}
            {status === 'completed' && <p className="mt-3 inline-flex rounded-full bg-[#DCFCE7] px-3 py-1 text-sm font-bold text-[#15803D]">Selesai</p>}
            <button type="button" onClick={() => setView('viewer')} className="mt-7 inline-flex rounded-full bg-[#0DBF7E] px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#0AA86E]">
              {status === 'not_started' ? 'Mulai Belajar' : 'Lanjutkan Belajar'}
            </button>
          </section>
        ) : (
          <section className="mt-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h1 className="text-xl font-extrabold">{BANGUN_RUANG_MODULE.title}</h1>
              <button type="button" onClick={() => setView('detail')} className="text-sm font-bold text-[#1685EE]">Kembali</button>
            </div>
            <PptxViewer initialSlide={Math.max(completedItems - 1, 0)} onSlideRead={handleSlideRead} onComplete={handleComplete} onResetProgress={handleResetProgress} />
            <p className="mt-3 text-center text-sm font-bold text-[#536782]">
              Progress: {totalItems ? `${Math.round((completedItems / totalItems) * 100)}% / ${status === 'not_started' ? 'Belum Mulai' : status === 'completed' ? 'Selesai' : 'Sedang Berjalan'}` : '0% / Belum Mulai'}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}