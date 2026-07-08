'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo } from 'react';
import { buildComicAssetFromComic } from '@/lib/comicAsset';
import { useComicReadingProgress } from '@/context/ComicReadingProgressContext';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import LearningHeader from '../layout/LearningHeader';
import LearningStageNav from '../layout/LearningStageNav';

const PdfReader = dynamic(() => import('@/components/comic/PdfReader'), { ssr: false });

export default function ContextualizationStage() {
  const { comic, progress, setCanAdvance, completeAndAdvance, isSaving } = useLearningEngine();
  const { updateProgress, markCompleted, isComicCompleted } = useComicReadingProgress();

  const alreadyCompleted = progress.sintaksList.some(
    (s) => s.sintaks === 'Contextualization' && s.status === 'COMPLETED'
  );

  const comicAsset = useMemo(() => comic.asset ?? buildComicAssetFromComic(comic), [comic]);
  const isCurrentComicCompleted = isComicCompleted(comic.id);

  useEffect(() => {
    setCanAdvance(alreadyCompleted);
    return () => setCanAdvance(true);
  }, [alreadyCompleted, setCanAdvance]);

  const handlePageChange = useCallback(
    (page: number, totalPages: number) => {
      updateProgress(comic.id, page, totalPages);
    },
    [comic.id, updateProgress]
  );

  const handlePdfComplete = useCallback(async () => {
    // Simpan sebagai completed
    markCompleted(comic.id, progress.sintaksList[0]?.status !== 'COMPLETED' ? 1 : 1);
    // Advance ke Identification
    await completeAndAdvance('Contextualization');
  }, [comic.id, completeAndAdvance, markCompleted, progress.sintaksList]);

  return (
    <div
      className="flex flex-col bg-[#f0f7ff]"
      style={{ height: '100dvh', paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Shared header */}
      <div className="flex-shrink-0">
        <LearningHeader />
      </div>

      {/* Body: sidebar (lg+) + PDF reader */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden mx-auto max-w-[1400px]">

        {/* Sidebar — desktop only */}
        <aside className="hidden lg:flex flex-shrink-0 w-64 xl:w-72 flex-col border-r border-neutral-200 bg-white overflow-y-auto">
          <LearningStageNav />
        </aside>

        {/* PDF reader fills remaining space */}
        {!comic.pdfPath ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
            <span className="text-2xl md:text-6xl">📄</span>
            <p className="text-lg md:text-xl font-black text-neutral-700">PDF belum tersedia</p>
            <p className="text-base md:text-lg text-neutral-400">Komik ini belum memiliki file PDF.</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 min-w-0 bg-neutral-950">
            <PdfReader
              asset={comicAsset}
              pdfPath={comic.pdfPath}
              comicId={comic.id}
              onComplete={handlePdfComplete}
              showCompleteButton={!alreadyCompleted}
              completeButtonLabel="Saya Sudah Membaca ✅"
              completeButtonDisabled={isSaving}
              onPageChange={handlePageChange}
              isComicCompleted={isCurrentComicCompleted}
              completeButtonLabelWhenDone="Lanjut ke Identification"
            />
          </div>
        )}
      </div>
    </div>
  );
}
