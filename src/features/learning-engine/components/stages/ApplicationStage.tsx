'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { debug } from '@/lib/debug';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { loadComicProgress, saveComicProgress } from '@/services/comicProgress';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import { isApplicationAnswerCorrect } from './applicationAnswer';

type CoachSummary = {
  mastered: string[];
  needsImprovement: string[];
  nextPractice: string[];
};

type CoachResponse = {
  coachType: 'positive' | 'constructive' | 'neutral';
  message: string;
  summary: CoachSummary;
};

type ApplicationOption = { value: string; label: string };
type ApplicationImage = { src: string; alt: string; label: string; description: string };
type ApplicationCard = { id: string; title: string; image: string; description: string; options: string[]; correctAnswer: string };

function shuffle<T>(array: ReadonlyArray<T>): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getLocalApplicationKey(comicId: number) {
  return `cinarai.application.activity.${comicId}`;
}

function saveLocalApplicationActivity(comicId: number, payload: Record<string, unknown>) {
  if (typeof window === 'undefined') return;

  try {
    const key = getLocalApplicationKey(comicId);
    const stored = JSON.parse(window.localStorage.getItem(key) ?? '[]') as Record<string, unknown>[];
    stored.push(payload);
    window.localStorage.setItem(key, JSON.stringify(stored));
  } catch (error) {
    console.warn('[ApplicationStage] Gagal menyimpan cache lokal', error);
  }
}

export default function ApplicationStage() {
  const { comic, comicModule, setCanAdvance, completeAndAdvance } = useLearningEngine();
  const { user } = useAuth();
  const applicationConfig = comicModule.application as {
    title: string;
    intro: string;
    prompt: string;
    context: string;
    correctAnswer?: string;
    images: ApplicationImage[];
    options: ApplicationOption[];
    cards?: ApplicationCard[];
  };
  const [selectedAnswer, setSelectedAnswer] = useState<string[]>([]);
  const [studentReason, setStudentReason] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(applicationConfig.cards?.[0]?.id ?? null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState<string | null>(null);
  
  const [isThinking, setIsThinking] = useState(false);
  const [coachMessage, setCoachMessage] = useState<string | null>(null);
  const [coachSummary, setCoachSummary] = useState<CoachSummary | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});
  const [attemptCount, setAttemptCount] = useState(0);
  const [hasHydratedProgress, setHasHydratedProgress] = useState(false);
  const options = useMemo(() => shuffle(applicationConfig.options.map((option) => option.value)), [applicationConfig.options]);
  const currentCard = useMemo(() => applicationConfig.cards?.find((card) => card.id === selectedCardId) ?? applicationConfig.cards?.[0] ?? null, [applicationConfig.cards, selectedCardId]);
  const isComic1Application = comic.id === 1;

  const minReasonLength = studentReason.trim().length;
  const canSubmit = selectedAnswer.length > 0 && minReasonLength >= 20 && !isThinking;

  useEffect(() => {
    setCanAdvance(answerSubmitted);
  }, [answerSubmitted, setCanAdvance]);

  useEffect(() => {
    if (!user?.uid || !hasHydratedProgress) return;
    void saveComicProgress(user.uid, comic.id, {
      stageData: {
        application: {
          selectedCardId,
          selectedChoice: selectedAnswer,
          explanation: studentReason,
          score: answerSubmitted ? 1 : 0,
          selectedAnswer,
          studentReason,
          answerSubmitted,
          answerFeedback,
          attemptCount,
          coachMessage,
          coachSummary,
        },
      },
    });
  }, [answerFeedback, answerSubmitted, attemptCount, coachMessage, coachSummary, comic.id, hasHydratedProgress, selectedAnswer, selectedCardId, studentReason, user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    void (async () => {
      try {
        const document = await loadComicProgress(user.uid, comic.id);
        if (!active) return;
        const stageData = document?.stageData?.application;
        if (stageData) {
          if (typeof stageData.selectedCardId === 'string') {
            setSelectedCardId(stageData.selectedCardId);
          }
          if (Array.isArray(stageData.selectedChoice)) {
            setSelectedAnswer(stageData.selectedChoice);
          }
          if (typeof stageData.explanation === 'string') {
            setStudentReason(stageData.explanation);
          }
          if (typeof stageData.answerSubmitted === 'boolean') {
            setAnswerSubmitted(stageData.answerSubmitted);
            setIsAnswerCorrect(stageData.answerSubmitted);
          }
          if (typeof stageData.attemptCount === 'number') {
            setAttemptCount(stageData.attemptCount);
          }
          if (typeof stageData.coachMessage === 'string') {
            setCoachMessage(stageData.coachMessage);
          }
          if (stageData.coachSummary && typeof stageData.coachSummary === 'object') {
            setCoachSummary(stageData.coachSummary as CoachSummary);
          }
          if (typeof stageData.answerFeedback === 'string') {
            setAnswerFeedback(stageData.answerFeedback);
          }
        }
        setHasHydratedProgress(true);
        debug('[comic-progress] Progress restored.');
      } catch (error) {
        console.error('[ApplicationStage] gagal memuat progress', error);
      }
    })();
    return () => {
      active = false;
    };
  }, [comic.id, user?.uid]);

  

  const logApplicationActivity = async (payload: Record<string, unknown>) => {
    const localPayload = {
      ...payload,
      timestamp: new Date().toISOString(),
      synced: false,
    };

    if (!user?.uid) {
      saveLocalApplicationActivity(comic.id, localPayload);
      return;
    }

    try {
      await addDoc(collection(firestore, 'application_activity'), {
        ...payload,
        timestamp: serverTimestamp(),
        localTimestamp: localPayload.timestamp,
        synced: true,
      });
    } catch (error) {
      console.warn('[ApplicationStage] Firestore sync failed, storing locally', error);
      saveLocalApplicationActivity(comic.id, localPayload);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsThinking(true);
    setAiError(null);
    setCoachMessage(null);
    setCoachSummary(null);

    const currentAttempt = attemptCount + 1;
    const arViewedFlag = false;
    const explorationCompletedFlag = false;

    if (isComic1Application) {
      setAnswerFeedback(null);
    } else {
      const expectedAnswer = currentCard?.correctAnswer ?? applicationConfig.correctAnswer;
      const answerIsCorrect = isApplicationAnswerCorrect(selectedAnswer, expectedAnswer);
      const localFeedback = answerIsCorrect
        ? 'Jawabanmu benar! Kamu berhasil menerapkan konsep dari komik pada situasi baru.'
        : 'Jawabanmu belum tepat. Perhatikan kembali ciri bentuk pada situasi baru, lalu coba lagi.';
      setIsAnswerCorrect(answerIsCorrect);
      setAnswerSubmitted(answerIsCorrect);
      setAnswerFeedback(localFeedback);
    }

    const payloadBody = {
      soal: applicationConfig.prompt,
      konteks: applicationConfig.context,
      gambar: applicationConfig.images.map((image) => image.src),
      jawabanSiswa: selectedAnswer,
      jawabanAlasan: studentReason,
      attempt: currentAttempt,
    };

    setAttemptCount(currentAttempt);

    try {
      const response = await fetch('/api/ai/application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadBody),
      });

      const data = (await response.json()) as Partial<CoachResponse>;
      const message = typeof data.message === 'string'
        ? data.message
        : 'AI Coach sementara tidak tersedia. Coba lagi nanti.';
      const summary = data.summary ?? {
        mastered: [],
        needsImprovement: [],
        nextPractice: [],
      };

      setCoachMessage(message);
      setCoachSummary(summary);
      if (isComic1Application) {
        setAnswerSubmitted(true);
      }

      const activityPayload = {
        userId: user?.uid ?? 'anonymous',
        comicId: comic.id,
        selectedAnswer: selectedAnswer.join(', '),
        studentReason,
        attempt: currentAttempt,
        arViewed: arViewedFlag,
        explorationCompleted: explorationCompletedFlag,
        coachType: data.coachType ?? 'neutral',
        coachMessage: message,
        coachSummary: summary,
      };

      await logApplicationActivity(activityPayload);
    } catch (error) {
      console.error('[ApplicationStage] AI Coach request failed', error);
      setAiError('AI Coach sedang tidak tersedia. Coba lagi nanti.');
      if (isComic1Application) {
        setAnswerSubmitted(true);
        setCoachMessage('Jawabanmu sudah diterima. Sambil menunggu AI Tutor tersedia kembali, coba jelaskan bentuk yang kamu lihat dengan memperhatikan jumlah sisi, rusuk, atau titik sudutnya.');
        setCoachSummary({
          mastered: ['Berani menyampaikan pengamatan dan alasan'],
          needsImprovement: ['Menghubungkan ciri bentuk dengan objek yang diamati'],
          nextPractice: ['Amati kembali gambar dan sebutkan ciri bentuk yang paling terlihat'],
        });
      } else {
        setCoachMessage(null);
        setCoachSummary(null);
      }
    } finally {
      setIsThinking(false);
    }
  };

  const handleFinishStage = async () => {
    await completeAndAdvance('Application');
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      <div className="rounded-[24px] bg-white px-5 py-6 shadow-sm sm:px-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-600 text-lg font-black text-white">7</span>
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-[0.32em] text-primary-600">APPLICATION</p>
              <h1 className="text-2xl font-black leading-snug text-neutral-900 sm:text-3xl">{applicationConfig.title}</h1>
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-neutral-600 sm:text-base">{applicationConfig.intro}</p>
      </div>

      <div className="rounded-[24px] bg-white px-5 py-5 shadow-sm">
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {applicationConfig.images.map((item) => (
            <div key={item.src} className="overflow-hidden rounded-[20px] border border-neutral-200 bg-neutral-50">
              <div className="relative aspect-[4/3]">
                {!imagesLoaded[item.src] && <div className="absolute inset-0 animate-pulse bg-slate-200" aria-hidden="true" />}
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className={['transition-opacity duration-500', imagesLoaded[item.src] ? 'opacity-100' : 'opacity-0'].join(' ')}
                  onLoadingComplete={() => setImagesLoaded((prev) => ({ ...prev, [item.src]: true }))}
                />
              </div>
              <div className="space-y-2 p-4">
                <p className="text-sm font-black text-neutral-900">{item.label}</p>
                <p className="text-sm leading-relaxed text-neutral-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary-500">Pertanyaan Aplikasi</p>
            <h2 className="mt-1 text-lg font-black text-neutral-900">Tantangan Penerapan</h2>
          </div>
          <div className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">Siap menjawab</div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          {applicationConfig.prompt}
        </p>

        {applicationConfig.cards && applicationConfig.cards.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {applicationConfig.cards.map((card) => {
              const isActive = currentCard?.id === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => {
                    setSelectedCardId(card.id);
                    setSelectedAnswer([]);
                    setStudentReason('');
                    setAnswerSubmitted(false);
                    setIsAnswerCorrect(false);
                    setAnswerFeedback(null);
                    setCoachMessage(null);
                    setCoachSummary(null);
                    setAiError(null);
                  }}
                  className={['rounded-full border px-3 py-2 text-sm font-semibold transition', isActive ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-200'].join(' ')}
                >
                  {card.title}
                </button>
              );
            })}
          </div>
        )}

        {currentCard && (
          <div className="mt-4 rounded-[20px] border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="relative h-24 w-full max-w-[140px] overflow-hidden rounded-[16px] border border-neutral-200 bg-white">
                <Image src={currentCard.image} alt={currentCard.title} fill className="object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-neutral-900">{currentCard.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">{currentCard.description}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {(currentCard?.options ?? options).map((option) => {
              const matchedOption = applicationConfig.options.find((item) => item.value === option);
              const label = matchedOption?.label ?? option;
              const checked = selectedAnswer.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setSelectedAnswer((prev) =>
                      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option],
                    );
                  }}
                  className={['inline-flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition',
                    checked ? 'border-primary-600 bg-primary-50 text-primary-900' : 'border-neutral-200 bg-white text-neutral-800 hover:border-primary-200 hover:bg-primary-50/50',
                  ].join(' ')}
                >
                  <span>{label}</span>
                  <span className={['h-5 w-5 rounded-full border text-center text-xs font-black', checked ? 'border-primary-600 bg-primary-600 text-white' : 'border-neutral-300 bg-white text-neutral-400'].join(' ')}>
                    {checked ? '✓' : '+'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <label htmlFor="application-reason" className="block text-sm font-black text-neutral-700">
                ✏️ Jelaskan pilihanmu
              </label>
            </div>
            <textarea
              id="application-reason"
              value={studentReason}
              onChange={(event) => setStudentReason(event.target.value)}
              rows={5}
              placeholder="Tuliskan alasanmu di sini..."
              disabled={isThinking}
              className="w-full resize-none rounded-3xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-relaxed text-neutral-800 placeholder:text-neutral-400 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
              <span>{minReasonLength} / 20 karakter</span>
              <span>{selectedAnswer.length} pilihan dipilih</span>
            </div>
          </div>

          {/* simplified stage: no observation/exploration requirement */}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={['inline-flex h-14 w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-black uppercase tracking-[0.14em] transition',
              canSubmit ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-neutral-200 text-neutral-500',
            ].join(' ')}
          >
            {isThinking ? 'Meminta bantuan AI Tutor...' : isComic1Application ? 'Kirim ke AI Tutor' : 'Periksa Jawaban'}
          </button>

          {answerFeedback && !isComic1Application && (
            <div className={['rounded-[20px] border px-4 py-3 text-sm font-semibold', isAnswerCorrect ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'].join(' ')}>
              {answerFeedback}
            </div>
          )}

          {aiError && (
            <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              {aiError}
            </div>
          )}
        </div>
      </div>

      {answerSubmitted && (
        <div className="rounded-[24px] bg-white px-5 py-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary-500">AI Coach</p>
              <h2 className="mt-1 text-lg font-black text-neutral-900">Bimbingan dan Ringkasan</h2>
            </div>
            <span className="rounded-full bg-secondary-100 px-3 py-1 text-xs font-semibold text-secondary-700">Attempt ke-{attemptCount}</span>
          </div>

          {coachMessage && <div className="mt-4 rounded-[20px] border border-neutral-200 bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-700"><p>{coachMessage}</p></div>}

          {coachSummary && <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[20px] border border-primary-100 bg-primary-50 p-4">
              <p className="text-sm font-black text-primary-700">Yang sudah dikuasai</p>
              <ul className="mt-3 space-y-2 text-sm text-neutral-700">
                {coachSummary.mastered.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-black text-primary-700">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[20px] border border-amber-100 bg-amber-50 p-4">
              <p className="text-sm font-black text-amber-700">Yang masih perlu diperbaiki</p>
              <ul className="mt-3 space-y-2 text-sm text-neutral-700">
                {coachSummary.needsImprovement.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-black text-amber-700">!</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[20px] border border-accent-100 bg-accent-50 p-4">
              <p className="text-sm font-black text-accent-700">Saran latihan berikutnya</p>
              <ul className="mt-3 space-y-2 text-sm text-neutral-700">
                {coachSummary.nextPractice.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-black text-accent-700">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>}

          <button
            type="button"
            onClick={handleFinishStage}
            className="mt-5 inline-flex h-14 w-full items-center justify-center rounded-2xl bg-secondary-500 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-secondary-600"
          >
            Selesai dan lanjut ke Introspection
          </button>
        </div>
      )}

      {/* AR viewer removed for simplified Application stage */}
    </div>
  );
}
