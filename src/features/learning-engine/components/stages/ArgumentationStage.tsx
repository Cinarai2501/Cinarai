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
  const { comic, comicModule, setCanAdvance, completeAndAdvance, registerSlideNav, unregisterSlideNav, registerStageAdvance, unregisterStageAdvance } = useLearningEngine();
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<AiFeedback | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedIndices, setCompletedIndices] = useState<number[]>([]);
  const [textAnswer, setTextAnswer] = useState('');
  const progressHydratedRef = useRef(false);
  const saveInFlightRef = useRef<Promise<void> | null>(null);

  const orderedLearningObjects = useMemo(
    () => getOrderedArgumentationLearningObjects(comicModule.argumentation),
    [comicModule.argumentation],
  );

  const learningObject = orderedLearningObjects[currentIndex] ?? null;
  const totalPages = orderedLearningObjects.length || 1;
  const lastQuestionIndex = totalPages - 1;
  const lastPageAnswered = feedback !== null && completedIndices.includes(lastQuestionIndex);

  const goPrevPage = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setFeedback(null);
      setCanAdvance(false);
    }
  }, [currentIndex, setCanAdvance]);

  const goNextPage = useCallback(() => {
    if (currentIndex < totalPages - 1) {
      setCurrentIndex((prev) => prev + 1);
      setFeedback(null);
      setCanAdvance(false);
    }
  }, [currentIndex, setCanAdvance, totalPages]);

  useEffect(() => {
    setCanAdvance(lastPageAnswered);
  }, [lastPageAnswered, setCanAdvance]);

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

  const persistArgumentationProgress = useCallback(
    async (override?: {
      currentIndex?: number;
      completedIndices?: number[];
      textAnswer?: string;
      feedback?: AiFeedback | null;
    }) => {
      if (!user?.uid) return;

      const currentSaveIndex = override?.currentIndex ?? currentIndex;
      const currentCompletedIndices = override?.completedIndices ?? completedIndices;
      const currentTextAnswer = override?.textAnswer ?? textAnswer;
      const currentFeedback = override?.feedback ?? feedback;

      if (saveInFlightRef.current) {
        try {
          await saveInFlightRef.current;
        } catch {
          // ignore existing save failure; continue with latest state
        }
      }

      const savePromise = (async () => {
        try {
          await saveComicProgress(user.uid, comic.id, {
            stageData: {
              argumentation: {
                currentIndex: currentSaveIndex,
                completedArguments: currentCompletedIndices,
                selectedAnswer: currentTextAnswer.trim() || null,
                textAnswer: currentTextAnswer,
                feedback: currentFeedback,
                score: currentFeedback?.score ?? null,
              },
            },
          });
        } catch (error) {
          console.error(
            '[ArgumentationStage] gagal menyimpan progress argumentasi',
            error instanceof Error ? error.stack ?? error.message : String(error)
          );
          throw error;
        }
      })();

      saveInFlightRef.current = savePromise;
      try {
        await savePromise;
      } finally {
        if (saveInFlightRef.current === savePromise) {
          saveInFlightRef.current = null;
        }
      }
    },
    [comic.id, completedIndices, currentIndex, feedback, textAnswer, user?.uid]
  );

  useEffect(() => {
    if (!user?.uid || progressHydratedRef.current) return;
    progressHydratedRef.current = true;
    let active = true;

    const parseNumber = (value: unknown): number | null => {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    };

    void (async () => {
      try {
        const document = await loadComicProgress(user.uid, comic.id);
        if (!active) return;
        const stageData = document?.stageData?.argumentation;
        if (stageData) {
          const currentIndexValue = parseNumber(stageData.currentIndex);
          if (currentIndexValue !== null) {
            setCurrentIndex(Math.min(Math.max(currentIndexValue, 0), totalPages - 1));
          }

          if (Array.isArray(stageData.completedArguments)) {
            setCompletedIndices(
              stageData.completedArguments
                .map((value) => parseNumber(value))
                .filter((value): value is number => value !== null)
            );
          }

          if (typeof stageData.textAnswer === 'string') {
            setTextAnswer(stageData.textAnswer);
          }

          if (stageData.feedback && typeof stageData.feedback === 'object') {
            const feedbackValue = stageData.feedback as unknown as Partial<AiFeedback>;
            const scoreValue = parseNumber(feedbackValue.score);
            if (
              typeof feedbackValue.level === 'string' &&
              typeof feedbackValue.feedback === 'string' &&
              scoreValue !== null
            ) {
              setFeedback({
                level: feedbackValue.level as FeedbackLevel,
                score: scoreValue,
                feedback: feedbackValue.feedback,
                strength: typeof feedbackValue.strength === 'string' ? feedbackValue.strength : undefined,
                improvement: typeof feedbackValue.improvement === 'string' ? feedbackValue.improvement : undefined,
                suggestion: typeof feedbackValue.suggestion === 'string' ? feedbackValue.suggestion : undefined,
              });
            }
          }
        }
      } catch (error) {
        console.error('[ArgumentationStage] gagal memuat progress', error);
      }
    })();
    return () => {
      active = false;
    };
  }, [comic.id, totalPages, user?.uid]);


  const handleNext = useCallback(async () => {
    if (!learningObject) {
      return;
    }

    if (currentIndex < orderedLearningObjects.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setFeedback(null);
      setCanAdvance(false);
      return;
    }

    try {
      await persistArgumentationProgress();
      await completeAndAdvance('Argumentation');
    } catch (error) {
      console.error(
        '[ArgumentationStage] gagal melanjutkan setelah argumentasi selesai',
        error instanceof Error ? error.stack ?? error.message : String(error)
      );
    }
  }, [completeAndAdvance, currentIndex, learningObject, orderedLearningObjects.length, persistArgumentationProgress, setCanAdvance]);

  useEffect(() => {
    if (lastPageAnswered) {
      registerStageAdvance(handleNext);
      return () => {
        unregisterStageAdvance();
      };
    }

    unregisterStageAdvance();
    return undefined;
  }, [handleNext, lastPageAnswered, registerStageAdvance, unregisterStageAdvance]);

  const handleFeedback = useCallback(
    async (newFeedback: AiFeedback) => {
      const nextCompletedIndices = completedIndices.includes(currentIndex)
        ? completedIndices
        : [...completedIndices, currentIndex];

      setFeedback(newFeedback);
      setCompletedIndices(nextCompletedIndices);

      if (currentIndex === orderedLearningObjects.length - 1) {
        setCanAdvance(true);
      }

      try {
        await persistArgumentationProgress({
          completedIndices: nextCompletedIndices,
          feedback: newFeedback,
        });
      } catch (error) {
        console.error(
          '[ArgumentationStage] gagal menyimpan progress setelah menerima feedback',
          error instanceof Error ? error.stack ?? error.message : String(error)
        );
      }
    },
    [completedIndices, currentIndex, orderedLearningObjects.length, persistArgumentationProgress, setCanAdvance]
  );

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
