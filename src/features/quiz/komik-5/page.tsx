'use client';

import { serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import DashboardPage from '@/components/dashboard/DashboardPage';
import { useAuth } from '@/hooks/useAuth';
import { loadComicProgress, saveComicProgress } from '@/services/comicProgress';
import { COMIC_5_QUESTIONS } from './questions';
import type { Comic5Answers } from './types';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

type SavedQuiz = {
  answers?: Comic5Answers;
  completed?: boolean;
};

const QUIZ_ID = 'komik-5-quiz';
const MANUAL_GRADING_QUESTION_IDS = COMIC_5_QUESTIONS.filter((question) => question.requiresManualGrading).map((question) => question.id);

function hasAnswer(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function isComplete(answers: Comic5Answers): boolean {
  return COMIC_5_QUESTIONS.every((question) => hasAnswer(answers[question.id]));
}

export default function Comic5QuizPage() {
  const { user, loading: authLoading } = useAuth();
  const [answers, setAnswers] = useState<Comic5Answers>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    let active = true;
    void loadComicProgress(user.uid, 5)
      .then((progress) => {
        if (!active) return;
        const savedQuiz = progress?.stageData?.quiz as SavedQuiz | undefined;
        if (savedQuiz?.answers) setAnswers(savedQuiz.answers);
        if (savedQuiz?.completed) setIsSubmitted(true);
      })
      .catch(() => {
        if (active) setErrorMessage('Jawaban sebelumnya belum dapat dimuat.');
      });

    return () => {
      active = false;
    };
  }, [user?.uid]);

  const persistAnswers = async (completed: boolean) => {
    if (!user?.uid) {
      setErrorMessage('Silakan masuk terlebih dahulu untuk menyimpan jawaban.');
      return false;
    }

    setSaveState('saving');
    setErrorMessage(null);
    try {
      await saveComicProgress(user.uid, 5, {
        stageData: {
          quiz: {
            quizId: QUIZ_ID,
            answers: answers as Record<string, string>,
            completed,
            requiresManualGrading: MANUAL_GRADING_QUESTION_IDS.length > 0,
            manualGradingQuestionIds: MANUAL_GRADING_QUESTION_IDS,
            ...(completed ? { submittedAt: serverTimestamp() } : {}),
          },
        },
      });
      setSaveState('saved');
      return true;
    } catch {
      setSaveState('error');
      setErrorMessage('Jawaban belum berhasil disimpan. Silakan coba lagi.');
      return false;
    }
  };

  const updateAnswer = (value: string) => {
    setAnswers((current) => ({ ...current, [COMIC_5_QUESTIONS[questionIndex].id]: value }));
    setSaveState('idle');
    setErrorMessage(null);
  };

  const handleNext = async () => {
    if (!hasAnswer(answers[COMIC_5_QUESTIONS[questionIndex].id])) {
      setErrorMessage('Silakan jawab soal terlebih dahulu.');
      return;
    }
    const saved = await persistAnswers(false);
    if (saved) setQuestionIndex((current) => Math.min(current + 1, COMIC_5_QUESTIONS.length - 1));
  };

  const handleSubmit = async () => {
    if (!isComplete(answers)) {
      setErrorMessage('Silakan jawab semua soal terlebih dahulu.');
      return;
    }
    const saved = await persistAnswers(true);
    if (saved) {
      setIsSubmitted(true);
      setIsReviewing(false);
    }
  };

  const currentQuestion = COMIC_5_QUESTIONS[questionIndex];

  return (
    <DashboardPage
      title="Kuis Komik 5"
      subtitle="Bangun Datar di Keraton Sumenep"
      gradientFrom="#FF6B00"
      gradientTo="#FF8800"
      rightContent={
        <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-white/20 text-4xl shadow-md ring-2 ring-white/50">
          📝
        </div>
      }
    >
      <main className="mx-auto max-w-2xl pb-8">
        <Link href="/dashboard/siswa/kuis" className="text-sm font-bold text-[#0066FF] hover:underline">
          ← Kembali ke Menu Kuis
        </Link>

        {authLoading ? (
          <div className="mt-5 h-72 animate-pulse rounded-2xl bg-slate-200" aria-label="Memuat kuis" />
        ) : isSubmitted ? (
          <section className="mt-5 rounded-2xl border border-emerald-200 bg-white p-6 text-center shadow-sm" aria-live="polite">
            <div className="text-4xl" aria-hidden="true">🎉</div>
            <h1 className="mt-3 text-2xl font-extrabold text-slate-900">Kuis selesai!</h1>
            <p className="mt-2 text-slate-600">Jawaban kamu sudah tersimpan.</p>
            <p className="mt-1 text-sm text-slate-500">Beberapa jawaban akan diperiksa oleh guru.</p>
            <Link href="/dashboard/siswa/kuis" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0066FF] px-5 py-3 text-sm font-bold text-white">
              Kembali ke Menu Kuis
            </Link>
          </section>
        ) : (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-extrabold text-slate-900">Soal {questionIndex + 1} dari {COMIC_5_QUESTIONS.length}</p>
              <p className="text-xs font-semibold text-slate-500" aria-live="polite">{saveState === 'saving' ? 'Menyimpan...' : saveState === 'saved' ? 'Tersimpan' : ''}</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
              <div className="h-full rounded-full bg-[#FF6B00] transition-all" style={{ width: `${((questionIndex + 1) / COMIC_5_QUESTIONS.length) * 100}%` }} />
            </div>

            {!isReviewing ? (
              <div className="mt-6">
                <h1 className="text-lg font-extrabold leading-relaxed text-slate-900">{currentQuestion.question}</h1>
                {currentQuestion.type === 'essay' ? (
                  <label className="mt-5 block text-sm font-bold text-slate-700">
                    Jawaban kamu:
                    <textarea
                      value={answers[currentQuestion.id] ?? ''}
                      onChange={(event) => updateAnswer(event.target.value)}
                      placeholder="Tulis jawabanmu di sini..."
                      rows={7}
                      className="mt-2 min-h-40 w-full resize-y rounded-xl border border-slate-300 p-4 text-base font-normal leading-relaxed text-slate-900 outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                ) : (
                  <fieldset className="mt-5 space-y-3">
                    <legend className="sr-only">Pilihan jawaban</legend>
                    {currentQuestion.options?.map((option) => (
                      <label key={option.key} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 text-base text-slate-800 transition has-[:checked]:border-[#0066FF] has-[:checked]:bg-blue-50">
                        <input
                          type="radio"
                          name={currentQuestion.id}
                          value={option.key}
                          checked={answers[currentQuestion.id] === option.key}
                          onChange={(event) => updateAnswer(event.target.value)}
                          className="h-5 w-5 accent-[#0066FF]"
                        />
                        <span><strong>{option.key}.</strong> {option.label}</span>
                      </label>
                    ))}
                  </fieldset>
                )}
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <h1 className="text-lg font-extrabold text-slate-900">Periksa Jawaban</h1>
                <p className="text-sm text-slate-600">Pastikan semua jawaban sudah diisi sebelum mengirim kuis.</p>
                {COMIC_5_QUESTIONS.map((question, index) => (
                  <div key={question.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                    <span className="font-semibold text-slate-700">Soal {index + 1}</span>
                    <span className={hasAnswer(answers[question.id]) ? 'font-bold text-emerald-700' : 'font-bold text-amber-700'}>
                      {hasAnswer(answers[question.id]) ? '✓ Sudah dijawab' : 'Belum dijawab'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {errorMessage && <p role="alert" className="mt-4 text-sm font-semibold text-red-600">{errorMessage}</p>}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => { setIsReviewing(false); setQuestionIndex((current) => Math.max(current - 1, 0)); }} disabled={questionIndex === 0 || saveState === 'saving'} className="min-h-11 rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">
                Sebelumnya
              </button>
              {!isReviewing && questionIndex < COMIC_5_QUESTIONS.length - 1 && (
                <button type="button" onClick={() => void handleNext()} disabled={saveState === 'saving'} className="min-h-11 rounded-xl bg-[#0066FF] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
                  Berikutnya
                </button>
              )}
              {!isReviewing && questionIndex === COMIC_5_QUESTIONS.length - 1 && (
                <button type="button" onClick={() => setIsReviewing(true)} className="min-h-11 rounded-xl bg-[#0066FF] px-5 py-3 text-sm font-bold text-white">
                  Periksa Jawaban
                </button>
              )}
              {isReviewing && (
                <button type="button" onClick={() => void handleSubmit()} disabled={saveState === 'saving'} className="min-h-11 rounded-xl bg-[#0066FF] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
                  Submit Kuis
                </button>
              )}
            </div>
          </section>
        )}
      </main>
    </DashboardPage>
  );
}
