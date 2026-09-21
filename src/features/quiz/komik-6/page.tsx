'use client';

import { serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import DashboardPage from '@/components/dashboard/DashboardPage';
import { useAuth } from '@/hooks/useAuth';
import { uploadStringData } from '@/lib/firebase/storage';
import { loadComicProgress, saveComicProgress } from '@/services/comicProgress';
import { COMIC_6_QUESTIONS } from './questions';
import DrawingCanvas from './components/DrawingCanvas';
import type { Comic6Answers, Comic6DrawingAnswer } from './types';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type SavedQuiz = { answers?: Comic6Answers; completed?: boolean };
const QUIZ_ID = 'komik-6-quiz';
const MANUAL_GRADING_QUESTION_IDS = COMIC_6_QUESTIONS.map((question) => question.id);

function hasTextAnswer(value: string | undefined) { return Boolean(value?.trim()); }
function hasDrawingAnswer(value: Comic6Answers['komik6-q5']) { return Boolean(value?.type === 'drawing' && value.submitted && value.downloadUrl); }
function answerIsPresent(questionIndex: number, answers: Comic6Answers, drawingDraft: string) {
  const question = COMIC_6_QUESTIONS[questionIndex];
  return question.type === 'drawing' ? hasDrawingAnswer(answers['komik6-q5']) || Boolean(drawingDraft) : hasTextAnswer(answers[question.id]);
}

export default function Comic6QuizPage() {
  const { user, loading: authLoading } = useAuth();
  const [answers, setAnswers] = useState<Comic6Answers>({});
  const [drawingDraft, setDrawingDraft] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    void loadComicProgress(user.uid, 6).then((progress) => {
      if (!active) return;
      const savedQuiz = progress?.stageData?.quiz as SavedQuiz | undefined;
      if (savedQuiz?.answers) setAnswers(savedQuiz.answers);
      if (savedQuiz?.completed) setIsSubmitted(true);
    }).catch(() => { if (active) setErrorMessage('Jawaban sebelumnya belum dapat dimuat.'); });
    return () => { active = false; };
  }, [user?.uid]);

  const persistAnswers = async (nextAnswers: Comic6Answers, completed: boolean) => {
    if (!user?.uid) { setErrorMessage('Silakan masuk terlebih dahulu untuk menyimpan jawaban.'); return false; }
    setSaveState('saving');
    try {
      await saveComicProgress(user.uid, 6, { stageData: { quiz: { quizId: QUIZ_ID, answers: nextAnswers as Record<string, string | Record<string, string> | Comic6DrawingAnswer>, completed, requiresManualGrading: true, manualGradingQuestionIds: MANUAL_GRADING_QUESTION_IDS, ...(completed ? { submittedAt: serverTimestamp() } : {}) } } });
      setAnswers(nextAnswers); setSaveState('saved'); return true;
    } catch { setSaveState('error'); setErrorMessage('Jawaban belum berhasil disimpan. Silakan coba lagi.'); return false; }
  };

  const updateEssay = (value: string) => {
    const questionId = COMIC_6_QUESTIONS[questionIndex].id;
    if (questionId === 'komik6-q5') return;
    setAnswers((current) => ({ ...current, [questionId]: value })); setSaveState('idle'); setErrorMessage(null);
  };
  const handleNext = async () => {
    if (!answerIsPresent(questionIndex, answers, drawingDraft)) { setErrorMessage(COMIC_6_QUESTIONS[questionIndex].type === 'drawing' ? 'Silakan gambar bangun ruang terlebih dahulu.' : 'Silakan isi jawaban terlebih dahulu.'); return; }
    if (await persistAnswers(answers, false)) setQuestionIndex((current) => Math.min(current + 1, COMIC_6_QUESTIONS.length - 1));
  };
  const handleSubmit = async () => {
    if (!drawingDraft && !hasDrawingAnswer(answers['komik6-q5'])) { setErrorMessage('Silakan gambar bangun ruang terlebih dahulu.'); return; }
    setSaveState('saving'); setErrorMessage(null);
    try {
      if (!user?.uid) throw new Error('auth');
      let drawingAnswer = answers['komik6-q5'];
      if (drawingDraft) {
        const storagePath = `student-quiz/${user.uid}/${QUIZ_ID}/komik6-q5-${Date.now()}.png`;
        const downloadUrl = await uploadStringData(storagePath, drawingDraft, 'data_url');
        drawingAnswer = { type: 'drawing', storagePath, downloadUrl, submitted: true };
      }
      const saved = await persistAnswers({ ...answers, 'komik6-q5': drawingAnswer as Comic6DrawingAnswer }, true);
      if (saved) { setIsSubmitted(true); setIsReviewing(false); }
    } catch { setSaveState('error'); setErrorMessage('Gambar belum berhasil disimpan. Silakan coba lagi.'); }
  };

  const currentQuestion = COMIC_6_QUESTIONS[questionIndex];
  const currentEssayAnswer = currentQuestion.type === 'essay' ? answers[currentQuestion.id] : undefined;
  const reviewAnswers = COMIC_6_QUESTIONS.map((question, index) => ({ question, answered: answerIsPresent(index, answers, drawingDraft) }));
  return <DashboardPage title="Kuis Komik 6" subtitle="Bangun Ruang di Masjid Al-Akbar Surabaya" gradientFrom="#FF6B00" gradientTo="#FF8800" rightContent={<div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-white/20 text-4xl shadow-md ring-2 ring-white/50">📝</div>}>
    <main className="mx-auto max-w-2xl overflow-x-hidden pb-8"><Link href="/dashboard/siswa/kuis" className="text-sm font-bold text-[#0066FF] hover:underline">← Kembali ke Menu Kuis</Link>
      {authLoading ? <div className="mt-5 h-72 animate-pulse rounded-2xl bg-slate-200" aria-label="Memuat kuis" /> : isSubmitted ? <section className="mt-5 rounded-2xl border border-emerald-200 bg-white p-6 text-center shadow-sm" aria-live="polite"><div className="text-4xl" aria-hidden="true">🎉</div><h1 className="mt-3 text-2xl font-extrabold text-slate-900">Kuis selesai!</h1><p className="mt-2 text-slate-600">Jawaban kamu sudah tersimpan.</p><p className="mt-1 text-sm text-slate-500">Jawaban akan diperiksa oleh guru.</p><Link href="/dashboard/siswa/kuis" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0066FF] px-5 py-3 text-sm font-bold text-white">Kembali ke Menu Kuis</Link></section> : <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3"><p className="text-sm font-extrabold text-slate-900">Soal {questionIndex + 1} dari {COMIC_6_QUESTIONS.length}</p><p className="text-xs font-semibold text-slate-500" aria-live="polite">{saveState === 'saving' ? 'Menyimpan...' : saveState === 'saved' ? 'Tersimpan' : ''}</p></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true"><div className="h-full rounded-full bg-[#FF6B00] transition-all" style={{ width: `${((questionIndex + 1) / COMIC_6_QUESTIONS.length) * 100}%` }} /></div>
        {!isReviewing ? <div className="mt-6"><h1 className="text-lg font-extrabold leading-relaxed text-slate-900">{currentQuestion.question}</h1>{currentQuestion.type === 'essay' ? <label className="mt-5 block text-sm font-bold text-slate-700">Jawaban kamu:<textarea value={typeof currentEssayAnswer === 'string' ? currentEssayAnswer : ''} onChange={(event) => updateEssay(event.target.value)} placeholder="Tulis jawabanmu di sini..." rows={7} className="mt-2 min-h-40 w-full resize-y rounded-xl border border-slate-300 p-4 text-base font-normal leading-relaxed text-slate-900 outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100" /></label> : <DrawingCanvas initialImage={drawingDraft} onChange={setDrawingDraft} />}</div> : <div className="mt-6 space-y-3"><h1 className="text-lg font-extrabold text-slate-900">Periksa Jawaban</h1><p className="text-sm text-slate-600">Pastikan semua jawaban sudah diisi sebelum mengirim kuis.</p>{reviewAnswers.map(({ question, answered }, index) => <div key={question.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm"><span className="font-semibold text-slate-700">Soal {index + 1}</span><span className={answered ? 'font-bold text-emerald-700' : 'font-bold text-amber-700'}>{answered ? (question.type === 'drawing' ? '✓ Gambar sudah dibuat' : '✓ Sudah dijawab') : (question.type === 'drawing' ? '⚠ Belum menggambar' : '⚠ Belum dijawab')}</span></div>)}</div>}
        {errorMessage && <p role="alert" className="mt-4 text-sm font-semibold text-red-600">{errorMessage}</p>}<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><button type="button" onClick={() => { setIsReviewing(false); setQuestionIndex((current) => Math.max(current - 1, 0)); }} disabled={questionIndex === 0 || saveState === 'saving'} className="min-h-11 rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Sebelumnya</button>{!isReviewing && questionIndex < COMIC_6_QUESTIONS.length - 1 && <button type="button" onClick={() => void handleNext()} disabled={saveState === 'saving'} className="min-h-11 rounded-xl bg-[#0066FF] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">Berikutnya</button>}{!isReviewing && questionIndex === COMIC_6_QUESTIONS.length - 1 && <button type="button" onClick={() => { if (reviewAnswers.every((item) => item.answered)) setIsReviewing(true); else setErrorMessage('Lengkapi semua jawaban sebelum memeriksa.'); }} className="min-h-11 rounded-xl bg-[#0066FF] px-5 py-3 text-sm font-bold text-white">Periksa Jawaban</button>}{isReviewing && <button type="button" onClick={() => void handleSubmit()} disabled={saveState === 'saving'} className="min-h-11 rounded-xl bg-[#0066FF] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">Submit Kuis</button>}</div>
      </section>}
    </main>
  </DashboardPage>;
}
