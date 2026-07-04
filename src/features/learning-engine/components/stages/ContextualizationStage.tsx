'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';

const PdfReader = dynamic(() => import('@/components/comic/PdfReader'), { ssr: false });

export default function ContextualizationStage() {
  const { comic, progress, setCanAdvance, completeAndAdvance, isSaving } = useLearningEngine();

  const alreadyCompleted = progress.sintaksList.some(
    (s) => s.sintaks === 'Contextualization' && s.status === 'COMPLETED'
  );

  useEffect(() => {
    setCanAdvance(alreadyCompleted);
    return () => setCanAdvance(true);
  }, [alreadyCompleted, setCanAdvance]);

  // Saat tombol "Selesai Membaca" ditekan:
  // 1. Simpan Contextualization ke Firestore
  // 2. Tunggu berhasil
  // 3. Baru pindah ke Identification
  const handlePdfComplete = useCallback(async () => {
    console.log('[PDF COMPLETE] comicId:', comic.id, '| currentStage: Contextualization | nextStage: Identification');
    await completeAndAdvance('Contextualization');
  }, [comic.id, completeAndAdvance]);

  if (!comic.pdfPath) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <p className="text-sm font-semibold text-neutral-500">PDF belum tersedia.</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden shadow-sm"
      style={{ height: 'calc(100dvh - 200px)', minHeight: '380px' }}
    >
      <PdfReader
        pdfPath={comic.pdfPath}
        onComplete={handlePdfComplete}
        showCompleteButton={!alreadyCompleted}
        completeButtonLabel="Saya Sudah Membaca ✅"
        completeButtonDisabled={isSaving}
      />
    </div>
  );
}
