'use client';

import { useCallback, useEffect } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import { IdentificationProvider } from '../../stages/Identification/context/IdentificationContext';
import IdentificationNavigation from '../../stages/Identification/components/IdentificationNavigation';
import IdentificationPage from '../../stages/Identification/components/IdentificationPage';

export default function IdentificationStage() {
  const { comic, setCanAdvance } = useLearningEngine();

  useEffect(() => {
    setCanAdvance(false);
  }, [setCanAdvance]);

  const handleCompleteChange = useCallback(
    (isComplete: boolean) => setCanAdvance(isComplete),
    [setCanAdvance]
  );

  return (
    <IdentificationProvider
      comicId={comic.id}
      lokasi={comic.lokasi}
      subtitle={comic.subtitle}
      kelas={comic.kelas}
      cover={comic.cover}
      title={comic.title}
      learningTargets={comic.learningTargets}
      onCompleteChange={handleCompleteChange}
    >
      <IdentificationNavigation />
      <IdentificationPage />
    </IdentificationProvider>
  );
}
