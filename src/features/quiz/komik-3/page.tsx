'use client';

import { serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import DashboardPage from '@/components/dashboard/DashboardPage';
import { useAuth } from '@/hooks/useAuth';
import { loadComicProgress, saveComicProgress } from '@/services/comicProgress';
import { COMIC_3_QUESTIONS } from './questions';
import type { Comic3Answers } from './types';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

type SavedQuiz = {
  answers?: Comic3Answers;
  completed?: boolean;
};

const QUIZ_ID = 'komik-3-quiz';

function hasAnswer(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function isComplete(answers: Comic3Answers): boolean {
  const imageAnswers = answers['komik3-q3'];
  return (
    hasAnswer(answers['komik3-q1']) &&
    hasAnswer(answers['komik3-q2']) &&
    Boolean(imageAnswers && Object.values(imageAnswers).every((answer) => hasAnswer(answer)))
  );
}

export default function Comic3QuizPage() {
  const { user, loading: authLoading } = useAuth();
  const [answers, setAnswers] = useState<Comic3Answers>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    let active = true;
    void loadComicProgress(user.uid, 3)
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
      await saveComicProgress(user.uid, 3, {
        stageData: {
          quiz: {
            quizId: QUIZ_ID,
            answers: answers as Record<string, string | Record<string, string>>,
            completed,
            ...(completed ? { submittedAt: serverTimestamp() } : {}),
          },
        },
      });
      setSaveState('saved');
      return true;
    } catch {
      setSaveState('error');
      setErrorMessage('Jawaban belum tersimpan. Coba lagi.');
      return false;
    }
  };

  const updateEssay = (id: 'komik3-q1' | 'komik3-q2', value: string) => {
    setAnswers((current) => ({ ...current, [id]: value }));
    setSaveState('idle');
  };

  const updateImageAnswer = (id: 'shape-1' | 'shape-2' | 'shape-3', value: string) => {
    setAnswers((current) => ({
      ...current,
      'komik3-q3': {
        'shape-1': current['komik3-q3']?.['shape-1'] ?? '',
        'shape-2': current['komik3-q3']?.['shape-2'] ?? '',
        'shape-3': current['komik3-q3']?.['shape-3'] ?? '',
        [id]: value,
      },
    }));
    setSaveState('idle');
  };

  const handleNext = async () => {
    const saved = await persistAnswers(false);
    if (saved) setQuestionIndex((current) => Math.min(current + 1, COMIC_3_QUESTIONS.length - 1));
  };

  const handleSubmit = async () => {
    if (!isComplete(answers)) {
      setErrorMessage('Lengkapi semua jawaban sebelum mengirim kuis.');
      return;
    }
    const saved = await persistAnswers(true);
    if (saved) {
      setIsSubmitted(true);
      setIsReviewing(false);
    }
  };

  const currentQuestion = COMIC_3_QUESTIONS[questionIndex];

  return (
    <DashboardPage
      title="Kuis Komik 3"
      subtitle="Bangun Datar"
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
            <div className="text-4xl" aria-hidden="true">✅</div>
            <h1 className="mt-3 text-2xl font-extrabold text-slate-900">Kuis selesai!</h1>
            <p className="mt-2 text-slate-600">Jawaban kamu sudah tersimpan.</p>
            <p className="mt-1 text-sm text-slate-500">Jawaban uraian akan diperiksa oleh guru.</p>
            <Link href="/dashboard/siswa/kuis" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0066FF] px-5 py-3 text-sm font-bold text-white">
              Kembali ke Menu Kuis
            </Link>
          </section>
        ) : (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-extrabold text-slate-900">Soal {questionIndex + 1} dari {COMIC_3_QUESTIONS.length}</p>
              <p className="text-xs font-semibold text-slate-500">{saveState === 'saving' ? 'Menyimpan...' : saveState === 'saved' ? 'Tersimpan' : ''}</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
              <div className="h-full rounded-full bg-[#FF6B00] transition-all" style={{ width: `${((questionIndex + 1) / COMIC_3_QUESTIONS.length) * 100}%` }} />
            </div>

            {!isReviewing ? (
              <div className="mt-6">
                <h1 className="text-lg font-extrabold leading-relaxed text-slate-900">{currentQuestion.question}</h1>
                {currentQuestion.type === 'essay' ? (
                  <textarea
                    value={answers[currentQuestion.id] ?? ''}
                    onChange={(event) => updateEssay(currentQuestion.id, event.target.value)}
                    placeholder="Tulis jawabanmu di sini..."
                    rows={7}
                    className="mt-5 min-h-40 w-full resize-y rounded-xl border border-slate-300 p-4 text-base leading-relaxed text-slate-900 outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100"
                  />
                ) : (
                  <div className="mt-5 space-y-5">
                    {currentQuestion.imagePrompts.map((prompt) => (
                      <div key={prompt.id} className="rounded-xl border border-slate-200 p-3">
                        <p className="mb-3 text-sm font-extrabold text-slate-700">{prompt.label}</p>
                        <Image src={`/quiz/komik-3/${prompt.assetPath.split('/').pop()}`} alt="Gambar bangun datar soal" width={480} height={320} className="h-auto w-full rounded-lg bg-slate-50" />
                        <label className="mt-3 block text-sm font-bold text-slate-700">
                          Jawaban:
                          <input
                            type="text"
                            value={answers['komik3-q3']?.[prompt.id] ?? ''}
                            onChange={(event) => updateImageAnswer(prompt.id, event.target.value)}
                            className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-base font-normal text-slate-900 outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100"
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <h1 className="text-lg font-extrabold text-slate-900">Periksa Jawaban</h1>
                <p className="text-sm text-slate-600">Pastikan semua jawaban sudah benar sebelum mengirim kuis.</p>
                {[answers['komik3-q1'], answers['komik3-q2'], ...Object.values(answers['komik3-q3'] ?? {})].map((answer, index) => (
                  <div key={`${index}-${answer ?? ''}`} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                    <span className="font-bold">Jawaban {index + 1}:</span> {answer || 'Belum diisi'}
                  </div>
                ))}
              </div>
            )}

            {errorMessage && <p role="alert" className="mt-4 text-sm font-semibold text-red-600">{errorMessage}</p>}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => { setIsReviewing(false); setQuestionIndex((current) => Math.max(current - 1, 0)); }} disabled={questionIndex === 0 || saveState === 'saving'} className="min-h-11 rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">
                Previous
              </button>
              {!isReviewing && questionIndex < COMIC_3_QUESTIONS.length - 1 && (
                <button type="button" onClick={() => void handleNext()} disabled={saveState === 'saving'} className="min-h-11 rounded-xl bg-[#0066FF] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
                  Berikutnya
                </button>
              )}
              {!isReviewing && questionIndex === COMIC_3_QUESTIONS.length - 1 && (
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
