'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import { getLearningContentPackage } from '../../content/contentPackages';

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

function getApplicationConfig(comicId: number) {
  const packageContent = getLearningContentPackage(comicId);
  return packageContent.application;
}

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
  const { comic, setCanAdvance, completeCurrentStage } = useLearningEngine();
  const { user } = useAuth();
  const [selectedAnswer, setSelectedAnswer] = useState<string[]>([]);
  const [studentReason, setStudentReason] = useState('');
  const [arViewed, setArViewed] = useState(false);
  const [explorationCompleted, setExplorationCompleted] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [isArOpen, setIsArOpen] = useState(false);
  const [arLoading, setArLoading] = useState(false);
  const [arFailed, setArFailed] = useState(false);
  const [arRetryCount, setArRetryCount] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [coachMessage, setCoachMessage] = useState<string | null>(null);
  const [coachSummary, setCoachSummary] = useState<CoachSummary | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});
  const [attemptCount, setAttemptCount] = useState(0);
  const packageContent = useMemo(() => getLearningContentPackage(comic.id), [comic.id]);
  const applicationConfig = useMemo(() => getApplicationConfig(comic.id), [comic.id]);
  const options = useMemo(() => shuffle(applicationConfig.options.map((option) => option.value)), [applicationConfig.options]);
  const arViewerUrl = packageContent.model3D[0]?.embedUrl || packageContent.model3D[0]?.arUrl || null;

  const hasCompletedPreparation = arViewed && explorationCompleted;
  const minReasonLength = studentReason.trim().length;
  const canSubmit = hasCompletedPreparation && selectedAnswer.length > 0 && minReasonLength >= 20 && !isThinking;

  useEffect(() => {
    setCanAdvance(answerSubmitted);
  }, [answerSubmitted, setCanAdvance]);

  const openArViewer = () => {
    setArViewed(true);
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
    const payloadBody = {
      soal: applicationConfig.prompt,
      konteks: applicationConfig.context,
      gambar: applicationConfig.images.map((image) => image.src),
      jawabanSiswa: selectedAnswer,
      jawabanAlasan: studentReason,
      attempt: currentAttempt,
    };

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
      setAnswerSubmitted(true);
      setAttemptCount(currentAttempt);

      const activityPayload = {
        userId: user?.uid ?? 'anonymous',
        comicId: comic.id,
        selectedAnswer: selectedAnswer.join(', '),
        studentReason,
        attempt: currentAttempt,
        arViewed,
        explorationCompleted,
        coachType: data.coachType ?? 'neutral',
        coachMessage: message,
        coachSummary: summary,
      };

      await logApplicationActivity(activityPayload);
    } catch (error) {
      console.error('[ApplicationStage] AI Coach request failed', error);
      setAiError('AI Coach sedang tidak tersedia. Coba lagi nanti.');
      setCoachMessage(null);
      setCoachSummary(null);
    } finally {
      setIsThinking(false);
    }
  };

  const handleFinishStage = async () => {
    await completeCurrentStage();
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
              <p className="text-xs font-black uppercase tracking-[0.32em] text-primary-600">APPLICATION</p>
              <h1 className="text-2xl font-black leading-snug text-neutral-900 sm:text-3xl">
                {applicationConfig.title}
              </h1>
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-neutral-600 sm:text-base">
          {applicationConfig.intro}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Observasi AR', active: arViewed, description: 'Buka model AR dan amati objek 3D dari berbagai sisi.' },
            { label: 'Eksplorasi', active: explorationCompleted, description: 'Amati tiga sudut pandang baru sebelum menjawab.' },
            { label: 'Menjawab', active: answerSubmitted, description: 'Kirim jawabanmu dan terima bimbingan AI Coach.' },
          ].map((step) => (
            <div
              key={step.label}
              className={['rounded-[20px] border px-4 py-4 transition', step.active ? 'border-primary-400 bg-primary-50' : 'border-neutral-200 bg-white'].join(' ')}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-neutral-500">{step.label}</p>
              <p className="mt-2 text-sm font-semibold text-neutral-900">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary-500">AR Aktivitas Utama</p>
            <h2 className="mt-1 text-lg font-black text-neutral-900">Amati Model 3D {comic.lokasi}</h2>
          </div>
          <button
            type="button"
            onClick={openArViewer}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary-600 px-5 py-3 text-sm font-black text-white transition hover:bg-primary-700"
          >
            Buka AR Viewer
          </button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          Gunakan AR sebagai bagian pertama dari tantanganmu. Putar, zoom, dan perhatikan pola atau bentuk yang muncul pada objek belajar.
        </p>
      </div>

      <div className="rounded-[24px] bg-white px-5 py-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary-500">Eksplorasi</p>
            <h2 className="mt-1 text-lg font-black text-neutral-900">Tiga sudut pandang baru</h2>
          </div>
          {!explorationCompleted ? (
            <button
              type="button"
              onClick={() => setExplorationCompleted(true)}
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-secondary-500 px-4 py-2 text-sm font-black text-white transition hover:bg-secondary-600"
            >
              Sudah diamati
            </button>
          ) : (
            <span className="rounded-full bg-secondary-100 px-3 py-1 text-xs font-semibold text-secondary-700">Eksplorasi selesai</span>
          )}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {applicationConfig.images.map((item) => (
            <div key={item.src} className="overflow-hidden rounded-[20px] border border-neutral-200 bg-neutral-50">
              <div className="relative aspect-[4/3]">
                {!imagesLoaded[item.src] && (
                  <div className="absolute inset-0 animate-pulse bg-slate-200" aria-hidden="true" />
                )}
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
            <h2 className="mt-1 text-lg font-black text-neutral-900">Pilih bangun datar yang paling sesuai</h2>
          </div>
          <div className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
            {arViewed ? 'AR sudah dilihat' : 'Buka AR terlebih dahulu'}
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          Perhatikan gambar objek, pilih bangun datar yang paling cocok, lalu jelaskan alasanmu secara singkat.
        </p>

        <div className="mt-5 grid gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {options.map((option) => {
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
            <label htmlFor="application-reason" className="mb-2 block text-sm font-black text-neutral-700">
              ✏️ Jelaskan pilihanmu
            </label>
            <textarea
              id="application-reason"
              value={studentReason}
              onChange={(event) => setStudentReason(event.target.value)}
              rows={5}
              placeholder="Tuliskan alasanmu di sini..."
              disabled={!hasCompletedPreparation || isThinking}
              className="w-full resize-none rounded-3xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-relaxed text-neutral-800 placeholder:text-neutral-400 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
              <span>{minReasonLength} / 20 karakter</span>
              <span>{selectedAnswer.length} pilihan dipilih</span>
            </div>
          </div>

          {!hasCompletedPreparation && (
            <div className="rounded-[20px] border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
              Selesaikan observasi AR dan eksplorasi gambar sebelum mengirim jawaban.
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={['inline-flex h-14 w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-black uppercase tracking-[0.14em] transition',
              canSubmit ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-neutral-200 text-neutral-500',
            ].join(' ')}
          >
            {isThinking ? 'AI Coach sedang berpikir…' : answerSubmitted ? 'Perbarui bimbingan AI Coach' : 'Minta bimbingan AI Coach'}
          </button>

          {aiError && (
            <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              {aiError}
            </div>
          )}
        </div>
      </div>

      {coachMessage && coachSummary && (
        <div className="rounded-[24px] bg-white px-5 py-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary-500">AI Coach</p>
              <h2 className="mt-1 text-lg font-black text-neutral-900">Bimbingan dan Ringkasan</h2>
            </div>
            <span className="rounded-full bg-secondary-100 px-3 py-1 text-xs font-semibold text-secondary-700">Attempt ke-{attemptCount}</span>
          </div>

          <div className="mt-4 rounded-[20px] border border-neutral-200 bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-700">
            <p>{coachMessage}</p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
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
          </div>

          <button
            type="button"
            onClick={handleFinishStage}
            className="mt-5 inline-flex h-14 w-full items-center justify-center rounded-2xl bg-secondary-500 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-secondary-600"
          >
            Selesai dan lanjut ke Introspection
          </button>
        </div>
      )}

      {isArOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-2xl">
            <div className="flex flex-col gap-4 border-b border-neutral-200 bg-neutral-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.32em] text-primary-600">AR Viewer</p>
                <h2 className="text-xl font-black text-neutral-900">{comic.lokasi} 3D</h2>
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
                    src={arViewerUrl ?? ''}
                    title={`${comic.lokasi} AR Viewer`}
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
