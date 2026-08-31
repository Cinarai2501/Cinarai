'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo } from 'react';
import { buildComicAssetFromComic } from '@/lib/comicAsset';
import { useComicReadingProgress } from '@/context/ComicReadingProgressContext';
import { useLearningEngine } from '../../hooks/useLearningEngine';

const PdfReader = dynamic(() => import('@/components/comic/PdfReader'), { ssr: false });

export default function ContextualizationStage() {
  const { comic, progress, setCanAdvance, completeAndAdvance, isSaving } = useLearningEngine();
  const { updateProgress, markCompleted, isComicCompleted, progress: readingProgress } = useComicReadingProgress();

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
    const lastPage = readingProgress?.currentPage ?? readingProgress?.lastPage ?? 1;
    const totalPages = readingProgress?.totalPages ?? lastPage;

    markCompleted(comic.id, totalPages);
    await completeAndAdvance('Contextualization');
  }, [comic.id, completeAndAdvance, markCompleted, readingProgress]);

  return (
    <div
      className="flex min-h-[100dvh] w-full flex-col bg-neutral-950"
      style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}
    >
      {!comic.pdfPath ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="text-2xl md:text-6xl">📄</span>
          <p className="text-lg font-black text-white md:text-xl">PDF belum tersedia</p>
          <p className="text-base text-neutral-400 md:text-lg">Komik ini belum memiliki file PDF.</p>
        </div>
      ) : (
        <div className="flex w-full flex-1 flex-col overflow-hidden bg-neutral-950">
          <PdfReader
            asset={comicAsset}
            pdfPath={comic.pdfPath}
            pdfVersion={comic.pdfVersion}
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
  );
}
