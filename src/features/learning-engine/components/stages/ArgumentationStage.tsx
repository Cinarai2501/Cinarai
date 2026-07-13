'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import { loadIdentificationAnswers } from '../../stages/Identification/services/identificationAnswerService';
import { getArgumentationLearningObject } from '../../stages/Argumentation/data/argumentationQuestions';
import Comic1ArgumentationStage from './Comic1ArgumentationStage';
import type { Comic1ArgumentationQuestion } from '@/features/comics/comic-1/content/types';

/* eslint-disable @next/next/no-img-element */

type FeedbackLevel = 'SANGAT_BAIK' | 'HAMPIR_BENAR' | 'PERLU_PERBAIKAN';

interface AiFeedback {
  level: FeedbackLevel;
  score: number;
  feedback: string;
  strength?: string;
  improvement?: string;
  suggestion?: string;
}

function isComic1ArgumentationQuestion(question: unknown): question is Comic1ArgumentationQuestion {
  return (
    typeof question === 'object' &&
    question !== null &&
    'argumentationPhoto' in question &&
    'argumentationHighlight' in question &&
    'argumentationPrompt' in question &&
    'argumentationQuestion' in question &&
    'argumentationTitle' in question
  );
}

export default function ArgumentationStage() {
  const { comic, comicModule, setCanAdvance, nextStage } = useLearningEngine();
  const { user } = useAuth();
  const [selectedShapes, setSelectedShapes] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<AiFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.uid || !comic.id) return;

    let active = true;

    void loadIdentificationAnswers(user.uid, comic.id).then((items) => {
      if (!active) return;
      const shapes = items.flatMap((item) => item.selectedShapes ?? []);
      setSelectedShapes(shapes);
    });

    return () => {
      active = false;
    };
  }, [comic.id, user?.uid]);

  const learningObject = useMemo(
    () => getArgumentationLearningObject(selectedShapes, comicModule.argumentation),
    [selectedShapes, comicModule.argumentation],
  );

  useEffect(() => {
    setCanAdvance(Boolean(feedback));
  }, [feedback, setCanAdvance]);

  const handleFeedback = useCallback(
    (newFeedback: AiFeedback) => {
      setFeedback(newFeedback);
      setIsSubmitting(false);
    },
    []
  );

  const handleNext = useCallback(() => {
    nextStage();
  }, [nextStage]);

  if (!learningObject) {
    return (
      <div className="rounded-[20px] bg-white p-5 text-sm text-neutral-600 shadow-sm">
        Memuat objek belajar dari hasil identifikasi...
      </div>
    );
  }

  // Comic 1: Use new CINARAI Blueprint UI
  if (comic.id === 1) {
    const argObjs = comicModule.argumentation?.questions ?? [];
    const argObj = learningObject && argObjs.length > 0
      ? argObjs.find(
          (q) => q.shapeName === learningObject.solid || q.shapeKey === learningObject.solid?.toLowerCase()
        ) ?? argObjs[0]
      : argObjs[0] ?? null;

    if (!argObj || !isComic1ArgumentationQuestion(argObj)) {
      return <div className="rounded-[20px] bg-white p-5 text-sm text-neutral-600 shadow-sm">Data pertanyaan tidak tersedia.</div>;
    }

    return (
      <Comic1ArgumentationStage
        question={argObj}
        onSubmitFeedback={handleFeedback}
        onNext={handleNext}
        isSubmitting={isSubmitting}
        feedback={feedback}
        comicTitle={comic.title}
        comicLocation={comic.lokasi ?? 'Lokasi'}
        classLevel={comic.kelas ?? 'Kelas VI'}
      />
    );
  }

  // Other comics: Placeholder for future implementation
  return (
    <div className="flex flex-col gap-4">
      <header className="rounded-[20px] bg-gradient-to-br from-secondary-400 to-secondary-600 px-4 py-5 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/80">Argumentation</p>
        <h2 className="mt-1 text-lg font-black text-white">Jelaskan alasanmu berdasarkan objek yang kamu pilih.</h2>
      </header>
      <div className="rounded-[20px] bg-white p-5 text-sm text-neutral-600 shadow-sm">
        Fitur Argumentation untuk komik ini masih dalam pengembangan.
      </div>
    </div>
  );
}
