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
  const [progressReady, setProgressReady] = useState(false);
  const statusRef = useRef<LearningModuleStatus>('not_started');
  const progressRequestRef = useRef(0);

  useEffect(() => {
    let active = true;
    const request = ++progressRequestRef.current;
    setProgressReady(false);
    void getLearningModuleProgress(user?.uid ?? '').then((progress) => {
      if (!active || progressRequestRef.current !== request || !progress) return;
      setStatus(progress.status);
      statusRef.current = progress.status;
      setCompletedItems(progress.completedItems);
      setTotalItems(progress.totalItems);
    }).finally(() => {
      if (active && progressRequestRef.current === request) setProgressReady(true);
    });
    return () => {
      active = false;
    };
  }, [user?.uid]);

  const handleSlideRead = useCallback((slideNumber: number, slideCount: number) => {
    setTotalItems(slideCount);
    setCompletedItems(slideNumber);
    const remainsCompleted = statusRef.current === 'completed' && slideNumber === slideCount;
    if (!remainsCompleted) {
      statusRef.current = 'in_progress';
      setStatus('in_progress');
    }
    if (user?.uid && !remainsCompleted) {
      void saveLearningModuleProgress(user.uid, { completedItems: slideNumber, totalItems: slideCount, status: 'in_progress' }).catch(() => undefined);
    } else if (!user?.uid && !remainsCompleted) {
      void saveLearningModuleProgress('', { completedItems: slideNumber, totalItems: slideCount, status: 'in_progress' }).catch(() => undefined);
    }
  }, [user?.uid]);

  const handleComplete = useCallback((slideCount: number) => {
    setStatus('completed');
    statusRef.current = 'completed';
    setCompletedItems(slideCount);
    setTotalItems(slideCount);
    if (user?.uid) {
      void saveLearningModuleProgress(user.uid, { completedItems: slideCount, totalItems: slideCount, status: 'completed' }).catch(() => undefined);
    } else {
      void saveLearningModuleProgress('', { completedItems: slideCount, totalItems: slideCount, status: 'completed' }).catch(() => undefined);
    }
    setView('detail');
  }, [user?.uid]);

  const handleResetProgress = useCallback((slideCount: number) => {
    progressRequestRef.current += 1;
    statusRef.current = 'not_started';
    setStatus('not_started');
    setCompletedItems(0);
    setTotalItems(slideCount);
    setProgressReady(true);
    if (user?.uid) {
      void saveLearningModuleProgress(user.uid, { completedItems: 0, totalItems: slideCount, status: 'not_started' }).catch(() => undefined);
    } else {
      void saveLearningModuleProgress('', { completedItems: 0, totalItems: slideCount, status: 'not_started' }).catch(() => undefined);
    }
  }, [user?.uid]);

  return (
    <main className={`overflow-x-hidden bg-[#F5F9FF] py-5 text-[#102F5B] ${view === 'viewer' ? 'px-0 sm:px-6' : 'px-3 sm:px-6'}`}>
      <div className={`mx-auto w-full ${view === 'viewer' ? 'max-w-none' : 'max-w-3xl'}`}>
        <Link href="/dashboard/siswa/komik" className="mx-3 inline-flex text-sm font-bold text-[#1685EE] sm:mx-0">← Kembali ke daftar materi</Link>
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
            <button type="button" onClick={() => setView('viewer')} disabled={!progressReady} className="mt-7 inline-flex rounded-full bg-[#0DBF7E] px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#0AA86E] disabled:cursor-wait disabled:opacity-60">
              {!progressReady ? 'Memuat progress...' : status === 'not_started' ? 'Mulai Belajar' : 'Lanjutkan Belajar'}
            </button>
          </section>
        ) : (
          <section className="mt-5">
            <div className="mb-4 flex items-center justify-between gap-3 px-3 sm:px-0">
              <h1 className="text-xl font-extrabold">{BANGUN_RUANG_MODULE.title}</h1>
              <button type="button" onClick={() => setView('detail')} className="text-sm font-bold text-[#1685EE]">Kembali</button>
            </div>
            <PptxViewer initialSlide={Math.max(completedItems - 1, 0)} onSlideRead={handleSlideRead} onComplete={handleComplete} onResetProgress={handleResetProgress} />
            <p className="mt-3 px-3 text-center text-sm font-bold text-[#536782] sm:px-0">
              Progress: {totalItems ? `${Math.round((completedItems / totalItems) * 100)}% / ${status === 'not_started' ? 'Belum Mulai' : status === 'completed' ? 'Selesai' : 'Sedang Berjalan'}` : '0% / Belum Mulai'}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}