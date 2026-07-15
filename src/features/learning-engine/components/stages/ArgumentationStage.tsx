'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { loadComicProgress, saveComicProgress } from '@/services/comicProgress';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import { getOrderedArgumentationLearningObjects } from '../../stages/Argumentation/data/argumentationQuestions';
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
  const { comic, comicModule, setCanAdvance, nextStage, registerSlideNav, unregisterSlideNav } = useLearningEngine();
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<AiFeedback | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedIndices, setCompletedIndices] = useState<number[]>([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [hasHydratedProgress, setHasHydratedProgress] = useState(false);
  const progressHydratedRef = useRef(false);

  const orderedLearningObjects = useMemo(
    () => getOrderedArgumentationLearningObjects(comicModule.argumentation),
    [comicModule.argumentation],
  );

  const learningObject = orderedLearningObjects[currentIndex] ?? null;
  const totalPages = orderedLearningObjects.length || 1;

  const goPrevPage = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setFeedback(null);
    }
  }, [currentIndex]);

  const goNextPage = useCallback(() => {
    if (currentIndex < totalPages - 1) {
      setCurrentIndex((prev) => prev + 1);
      setFeedback(null);
    }
  }, [currentIndex, totalPages]);

  useEffect(() => {
    setCanAdvance(Boolean(feedback) && completedIndices.includes(orderedLearningObjects.length - 1));
  }, [completedIndices, feedback, orderedLearningObjects.length, setCanAdvance]);

  useEffect(() => {
    registerSlideNav({
      slideIndex: currentIndex,
      totalSlides: totalPages,
      canGoNext: currentIndex < totalPages - 1,
      canGoPrev: currentIndex > 0,
      goNext: goNextPage,
      goPrev: goPrevPage,
    });

    return () => {
      unregisterSlideNav();
    };
  }, [currentIndex, goNextPage, goPrevPage, registerSlideNav, totalPages, unregisterSlideNav]);

  const persistArgumentationProgress = useCallback(async () => {
    if (!user?.uid || !hasHydratedProgress) return;
    await saveComicProgress(user.uid, comic.id, {
      stageData: {
        argumentation: {
          currentIndex,
          completedArguments: completedIndices,
          selectedAnswer: textAnswer.trim() || null,
          textAnswer,
          feedback,
          score: feedback?.score ?? null,
        },
      },
    });
  }, [comic.id, completedIndices, feedback, hasHydratedProgress, currentIndex, textAnswer, user?.uid]);

  useEffect(() => {
    if (!user?.uid || progressHydratedRef.current) return;
    progressHydratedRef.current = true;
    let active = true;
    void (async () => {
      try {
        const document = await loadComicProgress(user.uid, comic.id);
        if (!active) return;
        const stageData = document?.stageData?.argumentation;
        if (stageData) {
          if (typeof stageData.currentIndex === 'number') {
            setCurrentIndex(stageData.currentIndex);
          }
          if (Array.isArray(stageData.completedArguments)) {
            setCompletedIndices(stageData.completedArguments.filter((value): value is number => typeof value === 'number'));
          }
          if (typeof stageData.textAnswer === 'string') {
            setTextAnswer(stageData.textAnswer);
          }
          if (stageData.feedback && typeof stageData.feedback === 'object') {
            const feedbackValue = stageData.feedback as unknown as Partial<AiFeedback>;
            if (
              typeof feedbackValue.level === 'string' &&
              typeof feedbackValue.score === 'number' &&
              typeof feedbackValue.feedback === 'string'
            ) {
              setFeedback(feedbackValue as AiFeedback);
            }
          }
        }
        setHasHydratedProgress(true);
        // eslint-disable-next-line no-console
        console.log('[comic-progress] Progress restored.');
      } catch (error) {
        console.error('[ArgumentationStage] gagal memuat progress', error);
      }
    })();
    return () => {
      active = false;
    };
  }, [comic.id, user?.uid]);

  useEffect(() => {
    void persistArgumentationProgress();
  }, [persistArgumentationProgress]);

  const handleFeedback = useCallback(
    (newFeedback: AiFeedback) => {
      setFeedback(newFeedback);
      setCompletedIndices((prev) => (prev.includes(currentIndex) ? prev : [...prev, currentIndex]));
    },
    [currentIndex]
  );

  const handleNext = useCallback(() => {
    console.log('[ArgumentationFlow] STEP 3: handleNext invoked', {
      currentIndex,
      totalPages,
      hasLearningObject: Boolean(learningObject),
      feedback: Boolean(feedback),
    });

    if (!learningObject) {
      console.log('[ArgumentationFlow] STEP 3a: no learning object; stopping');
      return;
    }

    if (currentIndex < orderedLearningObjects.length - 1) {
      console.log('[ArgumentationFlow] STEP 3b: moving to next argumentation page');
      setCurrentIndex((prev) => prev + 1);
      setFeedback(null);
      return;
    }

    console.log('[ArgumentationFlow] STEP 4: calling nextStage from ArgumentationStage');
    void nextStage();
  }, [currentIndex, feedback, learningObject, nextStage, orderedLearningObjects.length, totalPages]);

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
    const argObj = argObjs[currentIndex] ?? null;

    if (!argObj || !isComic1ArgumentationQuestion(argObj)) {
      return <div className="rounded-[20px] bg-white p-5 text-sm text-neutral-600 shadow-sm">Data pertanyaan tidak tersedia.</div>;
    }

    return (
      <Comic1ArgumentationStage
        question={argObj}
        onSubmitFeedback={handleFeedback}
        onAnswerChange={setTextAnswer}
        onNext={handleNext}
        feedback={feedback}
        comicTitle={comic.title}
        comicLocation={comic.lokasi ?? 'Lokasi'}
        classLevel={comic.kelas ?? 'Kelas VI'}
        currentIndex={currentIndex}
        totalItems={orderedLearningObjects.length}
        initialAnswer={textAnswer}
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
