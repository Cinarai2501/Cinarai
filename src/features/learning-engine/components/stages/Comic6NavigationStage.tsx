'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { loadComicProgress, saveComicProgress } from '@/services/comicProgress';
import { getShapeIcon } from '@/features/learning-engine/stages/Identification/components/ui/ShapeIcons';
import { useAuth } from '@/hooks/useAuth';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import { navigation } from '@/features/comics/comic-6/content/navigation';

type Feedback = { correct: boolean; text: string } | null;

interface NavigationQuestion {
  prompt: string;
  options: string[];
  answer: string;
  correctFeedback: string;
  wrongFeedback: string;
}

const QUESTIONS: Record<string, NavigationQuestion[]> = {
  'komik6-navigation-menara': [{
    prompt: 'Menara Masjid Al-Akbar menyerupai bangun ruang apa?',
    options: ['Kubus', 'Balok', 'Tabung', 'Kerucut'],
    answer: 'Tabung',
    correctFeedback: 'Benar! Menara menyerupai tabung.',
    wrongFeedback: 'Belum tepat. Menara memiliki sisi atas, sisi bawah, dan sisi selimut seperti tabung.',
  }],
  'komik6-navigation-kubah': [
    {
      prompt: 'Bagian atas kubah menyerupai bangun ruang apa?',
      options: ['Kubus', 'Balok', 'Kerucut', 'Tabung'],
      answer: 'Kerucut',
      correctFeedback: 'Benar! Bagian atas kubah menyerupai kerucut karena memiliki titik puncak.',
      wrongFeedback: 'Belum tepat. Bagian atas kubah meruncing ke satu titik puncak seperti kerucut.',
    },
    {
      prompt: 'Bagian bawah kubah menyerupai bangun ruang apa?',
      options: ['Kubus', 'Balok', 'Setengah bola', 'Tabung'],
      answer: 'Setengah bola',
      correctFeedback: 'Benar! Bagian bawah kubah menyerupai setengah bola yang melengkung.',
      wrongFeedback: 'Belum tepat. Bagian bawah kubah tampak melengkung seperti sebagian bola dan tidak memiliki titik sudut.',
    },
  ],
  'komik6-navigation-ruang-utama': [{
    prompt: 'Bagian utama masjid menyerupai bangun ruang apa?',
    options: ['Kubus', 'Balok', 'Kerucut', 'Tabung'],
    answer: 'Balok',
    correctFeedback: 'Benar! Bagian utama masjid menyerupai balok.',
    wrongFeedback: 'Belum tepat. Bagian utama masjid memiliki bentuk memanjang dengan 6 sisi seperti balok.',
  }],
  'komik6-navigation-tempat-wudhu': [{
    prompt: 'Tempat duduk wudhu menyerupai bangun ruang apa?',
    options: ['Kubus', 'Balok', 'Tabung', 'Kerucut'],
    answer: 'Kubus',
    correctFeedback: 'Benar! Tempat duduk wudhu menyerupai kubus.',
    wrongFeedback: 'Belum tepat. Tempat duduk wudhu memiliki sisi-sisi persegi dan rusuk sama panjang seperti kubus.',
  }],
};

const SHAPE_DETAILS: Record<string, { shape: string; labels: string[] }[]> = {
  'komik6-navigation-menara': [{ shape: 'Tabung', labels: ['Sisi atas', 'Sisi selimut', 'Sisi bawah', 'Rusuk'] }],
  'komik6-navigation-kubah': [
    { shape: 'Kerucut', labels: ['2 sisi', '1 rusuk', 'Titik puncak', 'Tanpa titik sudut'] },
    { shape: 'Setengah bola', labels: ['Sisi lengkung', 'Bagian bola tertutup', 'Tanpa titik sudut'] },
  ],
  'komik6-navigation-ruang-utama': [{ shape: 'Balok', labels: ['6 sisi', '12 rusuk', '8 titik sudut'] }],
  'komik6-navigation-tempat-wudhu': [{ shape: 'Kubus', labels: ['6 sisi persegi', '12 rusuk sama panjang', '8 titik sudut'] }],
};

const objects = navigation.learningObjects;

export default function Comic6NavigationStage() {
  const { user } = useAuth();
  const { comic, setCanAdvance } = useLearningEngine();
  const [selectedObjectId, setSelectedObjectId] = useState(objects[0]?.id ?? '');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [objectVisited, setObjectVisited] = useState<string[]>([]);
  const [completedObjects, setCompletedObjects] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [hasHydratedProgress, setHasHydratedProgress] = useState(false);

  const selectedObject = objects.find((object) => object.id === selectedObjectId) ?? objects[0];
  const questions = selectedObject ? QUESTIONS[selectedObject.id] ?? [] : [];
  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const isSelectedComplete = Boolean(selectedObject && completedObjects.includes(selectedObject.id));
  const isNavigationComplete = completedObjects.length === objects.length;
  const progressCount = objectVisited.length;

  useEffect(() => {
    if (!user?.uid) {
      setHasHydratedProgress(true);
      return;
    }

    let active = true;
    void (async () => {
      try {
        const progress = await loadComicProgress(user.uid, comic.id);
        if (!active) return;
        const stageData = progress?.stageData?.navigation;
        if (Array.isArray(stageData?.objectVisited)) setObjectVisited(stageData.objectVisited);
        if (Array.isArray(stageData?.completedObjects)) setCompletedObjects(stageData.completedObjects);
      } catch (error) {
        console.error('[Comic6NavigationStage] gagal memuat progress', error);
      } finally {
        if (active) setHasHydratedProgress(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [comic.id, user?.uid]);

  useEffect(() => {
    setCanAdvance(isNavigationComplete);
  }, [isNavigationComplete, setCanAdvance]);

  useEffect(() => {
    if (!user?.uid || !hasHydratedProgress) return;
    void saveComicProgress(user.uid, comic.id, {
      stageData: { navigation: { objectVisited, completedObjects, openedObjects: objectVisited } },
    });
  }, [comic.id, completedObjects, hasHydratedProgress, objectVisited, user?.uid]);

  const details = useMemo(
    () => (selectedObject ? SHAPE_DETAILS[selectedObject.id] ?? [] : []),
    [selectedObject],
  );

  const selectObject = (objectId: string) => {
    setSelectedObjectId(objectId);
    setCurrentQuestionIndex(0);
    setFeedback(null);
    setShowDetails(false);
    setObjectVisited((previous) => Array.from(new Set([...previous, objectId])));
  };

  const answerQuestion = (answer: string) => {
    if (!selectedObject || !currentQuestion || isSelectedComplete) return;

    if (answer !== currentQuestion.answer) {
      setFeedback({ correct: false, text: currentQuestion.wrongFeedback });
      return;
    }

    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    setFeedback({ correct: true, text: currentQuestion.correctFeedback });
    if (isLastQuestion) {
      setCompletedObjects((previous) => Array.from(new Set([...previous, selectedObject.id])));
      setShowDetails(true);
      return;
    }

    setCurrentQuestionIndex((previous) => previous + 1);
  };

  if (!selectedObject) return null;

  return (
    <div className="flex min-w-0 flex-col gap-5 px-4 py-4 sm:gap-6 sm:py-6">
      <header className="space-y-2">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary-600">Navigation Observasi</p>
        <h1 className="text-2xl font-black text-neutral-900 sm:text-3xl">JELAJAHI MASJID AL-AKBAR</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-600">
          Ayo amati bagian-bagian Masjid Al-Akbar dan temukan bangun ruangnya!
        </p>
        <Link href={`/ai-tutor/${comic.id}`} className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-primary-200 bg-white px-4 py-2 text-sm font-black text-primary-700 transition hover:bg-primary-50">
          Tanya AI Tutor
        </Link>
      </header>

      <section className="overflow-hidden rounded-[22px] border border-primary-100 bg-primary-50/70 p-3 shadow-sm sm:p-4">
        <div className="relative aspect-[16/9] overflow-hidden rounded-[16px] bg-neutral-200">
          <Image src={comic.cover} alt="Masjid Al-Akbar Surabaya" fill priority className="object-cover" sizes="(max-width: 640px) 100vw, 720px" />
          <div className="absolute inset-x-3 bottom-3 rounded-xl bg-neutral-950/75 px-3 py-2 text-center text-xs font-black uppercase tracking-[0.18em] text-white">
            Peta pengamatan Masjid Al-Akbar
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm font-black text-primary-800">Objek diamati</p>
          <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-primary-700">{progressCount}/4</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-primary-600 transition-all duration-500" style={{ width: `${(progressCount / objects.length) * 100}%` }} />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2" aria-label="Titik eksplorasi Masjid Al-Akbar">
        {objects.map((object, index) => {
          const isActive = selectedObject.id === object.id;
          const isComplete = completedObjects.includes(object.id);
          return (
            <button
              key={object.id}
              type="button"
              onClick={() => selectObject(object.id)}
              className={[
                'flex min-h-[92px] items-center gap-3 rounded-[18px] border p-3 text-left transition-all active:scale-[0.98]',
                isActive ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-100' : 'border-neutral-200 bg-white hover:border-primary-300',
              ].join(' ')}
            >
              <span className={['flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-lg font-black', isComplete ? 'bg-accent-500 text-white' : 'bg-neutral-100 text-neutral-600'].join(' ')}>
                {isComplete ? '✓' : index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-black text-neutral-900">{object.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-neutral-600">{object.shapeName}</span>
              </span>
            </button>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-[22px] border border-neutral-200 bg-white shadow-sm">
        <div className="relative aspect-[16/9] bg-neutral-100">
          <Image src={selectedObject.navImage ?? comic.cover} alt={selectedObject.title} fill className="object-contain" sizes="(max-width: 640px) 100vw, 720px" />
          <span className="absolute left-3 top-3 rounded-full bg-neutral-950/75 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white">Lihat</span>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary-600">Amati objek</p>
            <h2 className="mt-1 text-xl font-black text-neutral-900">{selectedObject.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{selectedObject.description}</p>
          </div>

          {isSelectedComplete ? (
            <div className="rounded-[16px] border border-accent-200 bg-accent-50 p-4">
              <p className="font-black text-accent-800">✓ Teridentifikasi!</p>
              <p className="mt-1 text-sm leading-relaxed text-neutral-700">Amati ciri-cirinya agar kamu semakin mengenal bentuk ini.</p>
            </div>
          ) : currentQuestion ? (
            <div className="space-y-3">
              <p className="text-base font-black leading-relaxed text-neutral-900">{currentQuestion.prompt}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => answerQuestion(option)}
                    className="min-h-[48px] rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left text-sm font-bold text-neutral-800 transition hover:border-primary-400 hover:bg-primary-50 active:scale-[0.98]"
                  >
                    {option}
                  </button>
                ))}
              </div>
              {feedback ? (
                <div className={['rounded-[16px] p-3 text-sm leading-relaxed', feedback.correct ? 'bg-accent-50 text-accent-800' : 'bg-amber-50 text-amber-900'].join(' ')}>
                  {feedback.correct ? '✓ ' : '💡 '}{feedback.text}
                </div>
              ) : null}
            </div>
          ) : null}

          {feedback?.correct && !isSelectedComplete ? (
            <p className="rounded-[16px] bg-primary-50 p-3 text-sm font-semibold leading-relaxed text-primary-800">Lanjutkan mengamati bagian berikutnya.</p>
          ) : null}

          {isSelectedComplete && !showDetails ? (
            <button type="button" onClick={() => setShowDetails(true)} className="w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-black text-white transition hover:bg-primary-700">
              Amati Ciri-Cirinya
            </button>
          ) : null}

          {showDetails ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {details.map((detail) => {
                const ShapeIcon = getShapeIcon(detail.shape);
                return (
                  <div key={detail.shape} className="rounded-[16px] border border-primary-100 bg-primary-50/60 p-3">
                    <div className="flex items-center gap-3">
                      <ShapeIcon className="h-14 w-14 flex-shrink-0" />
                      <p className="font-black text-neutral-900">{detail.shape}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {detail.labels.map((label) => <span key={label} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700">{label}</span>)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      {isNavigationComplete ? (
        <div className="rounded-[18px] border border-accent-200 bg-accent-50 p-4 text-center">
          <p className="font-black text-accent-800">Hebat! Kamu sudah menjelajahi Masjid Al-Akbar.</p>
          <p className="mt-1 text-sm text-neutral-700">Semua objek sudah diamati dan dihubungkan dengan bangun ruang.</p>
        </div>
      ) : null}
    </div>
  );
}