'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { Stage } from '../../types';
import { useLearningEngine } from '../../hooks/useLearningEngine';

const OPTIONS = ['Kubus', 'Balok', 'Prisma', 'Limas', 'Kerucut', 'Tabung'] as const;
const CORRECT_ANSWER = 'LIMAS';

function shuffle<T>(array: ReadonlyArray<T>): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function ApplicationStage() {
  const { setCanAdvance, goToStage, completeCurrentStage } = useLearningEngine();
  const { user } = useAuth();
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [usedAR, setUsedAR] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isArOpen, setIsArOpen] = useState(false);
  const [arLoading, setArLoading] = useState(false);
  const [arFailed, setArFailed] = useState(false);
  const [arRetryCount, setArRetryCount] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<'correct' | 'incorrect' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});
  const timerRef = useRef<number | null>(null);
  const options = useMemo(() => shuffle(OPTIONS), []);

  useEffect(() => {
    setCanAdvance(false);
  }, [setCanAdvance]);

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setTimeSpent((value) => value + 1);
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const AR_MODEL_EMBED_URL = 'https://sketchfab.com/3d-models/candi-jawi-with-precision-geometry-83da3450467747fda7872c5a9392ffac/embed?autostart=0&ui_infos=0&ui_stop=0&ui_controls=1';

  const openArViewer = () => {
    setUsedAR(true);
    setArFailed(false);
    setArLoading(true);
    setIsArOpen(true);
  };

  const closeArViewer = () => {
    setIsArOpen(false);
    setArLoading(false);
    setArFailed(false);
  };

  const handleArRetry = () => {
    setArFailed(false);
    setArLoading(true);
    setArRetryCount((prev) => prev + 1);
  };

  const handleArLoad = () => {
    setArLoading(false);
    setArFailed(false);
  };

  const handleArError = () => {
    setArLoading(false);
    setArFailed(true);
  };

  const logApplicationActivity = async (
    chosen: string,
    correct: string,
    correctState: boolean,
    attemptNumber: number,
    feedback: string
  ) => {
    if (!user?.uid) return;

    const payload = {
      userId: user.uid,
      selectedAnswer: chosen,
      correctAnswer: correct,
      isCorrect: correctState,
      attemptCount: attemptNumber,
      usedAR,
      timeSpent,
      aiFeedback: feedback,
      timestamp: serverTimestamp(),
    };

    try {
      await addDoc(collection(firestore, 'application_activity'), payload);
    } catch (error) {
      console.error('[ApplicationStage] Firestore activity log failed', error);
      setErrorMessage('Tidak dapat menyimpan aktivitas ke server. Coba lagi nanti.');
    }
  };

  const handleCheckAnswer = async () => {
    if (!selectedAnswer) return;

    setErrorMessage(null);
    setIsThinking(true);
    setAiMessage(null);
    setAiStatus(null);

    const currentAttempt = attemptCount + 1;

    try {
      const response = await fetch('/api/ai/application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected: selectedAnswer, attempt: currentAttempt }),
      });

      const payload = await response.json();
      const message = payload?.message ?? 'Maaf, AI coach belum bisa memberikan bantuan saat ini. Coba lagi nanti.';
      const status = response.ok && payload?.status === 'correct' ? 'correct' : 'incorrect';

      setAiStatus(status);
      setAiMessage(message);
      await logApplicationActivity(selectedAnswer, CORRECT_ANSWER, status === 'correct', currentAttempt, message);

      if (status === 'correct') {
        await completeCurrentStage();
        setCanAdvance(true);
      } else {
        setCanAdvance(false);
        setAttemptCount(currentAttempt);
      }
    } catch (error) {
      console.error('[ApplicationStage] AI request failed', error);
      const fallbackMessage = 'Maaf, AI sedang bermasalah. Coba lagi sebentar lagi.';
      setAiStatus('incorrect');
      setAiMessage(fallbackMessage);
      await logApplicationActivity(selectedAnswer, CORRECT_ANSWER, false, currentAttempt, fallbackMessage);
      setCanAdvance(false);
      setAttemptCount(currentAttempt);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      <div className="rounded-[24px] bg-white px-5 py-6 shadow-sm sm:px-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-600 text-lg font-black text-white">
              7
            </span>
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-[0.32em] text-primary-600">
                APPLICATION
              </p>
              <h1 className="text-2xl font-black leading-snug text-neutral-900 sm:text-3xl">
                Tantangan Baru!
              </h1>
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-neutral-600 sm:text-base">
          Perhatikan bentuk bagian candi berikut.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              src: '/images/identification/komik1-soal4.jpg',
              alt: 'Bagian atap bertingkat Candi Jawi tampak samping',
              label: 'Bagian atap',
            },
            {
              src: '/images/identification/komik1-soal1.jpg',
              alt: 'Tubuh utama Candi Jawi tampak depan, menyerupai balok',
              label: 'Bagian tubuh',
            },
            {
              src: '/images/identification/komik1-soal2.jpg',
              alt: 'Bagian kaki atau pondasi Candi Jawi dengan susunan batu',
              label: 'Bagian pondasi',
            },
          ].map((image) => (
            <div key={image.src} className="relative overflow-hidden rounded-3xl shadow-sm">
              {!imagesLoaded[image.src] && (
                <div className="absolute inset-0 animate-pulse bg-slate-200" aria-hidden="true" />
              )}
              <div className="relative aspect-[4/3]">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  loading="lazy"
                  decoding="async"
                  className={['transition-opacity duration-500', imagesLoaded[image.src] ? 'opacity-100' : 'opacity-0'].join(' ')}
                  onLoadingComplete={() => setImagesLoaded((prev) => ({ ...prev, [image.src]: true }))}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-neutral-900 sm:text-base">Lihat bagian candi ini dalam AR.</p>
            <p className="text-xs text-neutral-500">Putar, zoom, dan jelajahi model 3D sebelum menjawab.</p>
          </div>
          <button
            type="button"
            onClick={openArViewer}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary-600 px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-primary-700 focus:outline-none"
          >
            Lihat dalam AR
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <p className="text-sm font-black text-neutral-900 sm:text-base">
              Bangun ruang apa yang paling sesuai dengan bagian candi tersebut?
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1">
              <label className="sr-only" htmlFor="application-answer">
                Pilihan jawaban
              </label>
              <select
                id="application-answer"
                value={selectedAnswer}
                onChange={(e) => {
                  setSelectedAnswer(e.target.value);
                  setAiMessage(null);
                  setAiStatus(null);
                }}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 outline-none transition-colors focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 sm:text-base"
              >
                <option value="">Pilih jawaban</option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              disabled={!selectedAnswer || isThinking}
              onClick={handleCheckAnswer}
              className={[
                'inline-flex h-12 w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] transition-colors focus:outline-none sm:w-auto sm:px-6 sm:text-sm',
                selectedAnswer && !isThinking
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-neutral-200 text-neutral-500',
              ].join(' ')}
            >
              {isThinking ? 'AI Coach sedang berpikir…' : 'CEK'}
            </button>
          </div>

          {errorMessage && (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              <p className="font-semibold">Terjadi kesalahan</p>
              <p>{errorMessage}</p>
            </div>
          )}

          {aiMessage && (
            <div className={['rounded-3xl border p-4', aiStatus === 'correct' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-950'].join(' ')} role="status" aria-live="polite">
              <div className="flex items-start gap-3">
                <Image
                  src="/images/ai/robot.svg"
                  alt="AI Coach"
                  width={28}
                  height={28}
                  className="h-7 w-7"
                />
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.24em] text-neutral-600">AI Coach</p>
                  <p className="mt-2 text-sm leading-relaxed">{aiMessage}</p>
                </div>
              </div>
              {aiStatus === 'correct' && (
                <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => { goToStage(Stage.Introspection); }}
                    className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                  >
                    Lanjut ke Introspection →
                  </button>
                </div>
              )}
            </div>
          )}

          <p className="text-xs leading-relaxed text-neutral-400 sm:text-sm">
            Belum perlu membuat validasi, AI, atau Firestore. Fokus pada layout responsif dan pengalaman AR.
          </p>
        </div>
      </div>

      {isArOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-2xl">
            <div className="flex flex-col gap-4 border-b border-neutral-200 bg-neutral-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.32em] text-primary-600">AR Viewer</p>
                <h2 className="text-xl font-black text-neutral-900">Candi Jawi 3D</h2>
                <p className="text-sm text-neutral-600">Putar, zoom, dan amati model sebelum menjawab.</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleArRetry}
                  className={['inline-flex min-h-[44px] items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition',
                    arFailed ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-neutral-200 text-neutral-700',
                  ].join(' ')}
                >
                  Coba Lagi
                </button>
                <button
                  type="button"
                  onClick={closeArViewer}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700"
                >
                  Tutup
                </button>
              </div>
            </div>

            <div className="min-h-[320px] bg-black">
              {arFailed ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-6 py-10 text-center text-white">
                  <p className="text-3xl">⚠️</p>
                  <div className="max-w-xl space-y-2">
                    <p className="text-lg font-bold">Maaf, AR Viewer gagal dimuat.</p>
                    <p className="text-sm text-neutral-200">
                      Coba lagi dengan menekan tombol Coba Lagi. Jika masih gagal, mungkin koneksi atau layanan model 3D belum tersedia.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative h-[60vh] w-full">
                  {arLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
                      <div className="rounded-2xl bg-white/90 px-6 py-5 text-center shadow-lg">
                        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                        <p className="text-sm font-semibold text-neutral-900">Memuat AR Viewer…</p>
                      </div>
                    </div>
                  )}
                  <iframe
                    key={arRetryCount}
                    src={AR_MODEL_EMBED_URL}
                    title="Candi Jawi AR Viewer"
                    className="h-full w-full border-0"
                    allow="fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    onLoad={handleArLoad}
                    onError={handleArError}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
