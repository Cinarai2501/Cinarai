'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { serverTimestamp } from 'firebase/firestore';
import {
  getFirestoreDocument,
  mergeFirestoreDocument,
  queryFirestoreCollection,
} from '@/services/firestore';
import { getComicById } from '@/lib/comicRepository';
import { getCurrentUser } from '@/lib/firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { useSnackbar } from '@/context/SnackbarContext';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import { getLearningContentPackage } from '../../content/contentPackages';

function getChecklistItems(comicId: number) {
  const packageContent = getLearningContentPackage(comicId);
  if (packageContent.introspection.checklist.length > 0) {
    return packageContent.introspection.checklist as readonly string[];
  }

  return [
    'Saya memahami bangun ruang pada candi',
    'Saya dapat membedakan kubus, balok, tabung, kerucut dan limas',
    'Saya dapat menghitung volume bangun ruang',
    'Saya lebih percaya diri menyelesaikan soal serupa',
  ] as const;
}

const STAR_LABELS = ['Sangat kurang', 'Kurang', 'Cukup', 'Paham', 'Sangat paham'] as const;
const MIN_REFLECTION_LENGTH = 10;

type AiReflection = {
  appreciation: string;
  needsImprovement: string;
  suggestion: string;
};

type IdentificationAnswerSummary = {
  step: number;
  selectedAnswer: string | null;
  note: string;
  reason: string;
};

type ApplicationActivitySummary = {
  selectedAnswer: string;
  studentReason: string;
  attempt: number;
  coachType: string;
  coachMessage: string;
  coachSummary: {
    mastered: string[];
    needsImprovement: string[];
    nextPractice: string[];
  };
  timestamp?: string;
};

export default function IntrospectionStage() {
  const router = useRouter();
  const { comic, progress, completeCurrentStage } = useLearningEngine();
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();

  const checklistItems = useMemo(() => getChecklistItems(comic.id), [comic.id]);
  const [checked, setChecked] = useState<boolean[]>(() => checklistItems.map(() => false));
  const [rating, setRating] = useState<number | null>(null);
  const [reflectionText, setReflectionText] = useState('');
  const [saved, setSaved] = useState(false);
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [isSavingReflection, setIsSavingReflection] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiReflection, setAiReflection] = useState<AiReflection | null>(null);
  const [displayedReflection, setDisplayedReflection] = useState<AiReflection>({
    appreciation: '',
    needsImprovement: '',
    suggestion: '',
  });
  const [typingSectionIndex, setTypingSectionIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [identificationAnswers, setIdentificationAnswers] = useState<IdentificationAnswerSummary[]>([]);
  const [applicationActivities, setApplicationActivities] = useState<ApplicationActivitySummary[]>([]);

  const selectedChecklist = useMemo(
    () => checklistItems.filter((_, index) => checked[index]),
    [checklistItems, checked],
  );

  const hasAtLeastOneCheck = selectedChecklist.length > 0;
  const hasRating = rating !== null;
  const hasMinimumReflection = reflectionText.trim().length >= MIN_REFLECTION_LENGTH;
  const canSubmit = hasAtLeastOneCheck && hasRating && hasMinimumReflection;

  const nextComic = getComicById(comic.id + 1);

  const formatStageResult = (stageName: string) => {
    const stage = progress.sintaksList.find((item) => item.sintaks === stageName);
    if (!stage) return `Hasil ${stageName} tidak tersedia.`;
    if (stage.status === 'COMPLETED') return `${stageName} telah selesai.`;
    if (stage.status === 'CURRENT') return `${stageName} sedang dikerjakan.`;
    return `${stageName} belum dimulai.`;
  };

  const buildIntrospectionPayload = () => ({
    comicTitle: comic.title,
    lokasi: comic.lokasi,
    classLevel: comic.kelas,
    checklist: selectedChecklist,
    confidence: rating,
    reflectionText: reflectionText.trim(),
    stagePerformance: progress.sintaksList.map((item) => ({
      stage: item.sintaks,
      status: item.status,
    })),
    identificationAnswers,
    applicationActivities,
    identificationResult: formatStageResult('Identification'),
    navigationResult: formatStageResult('Navigation'),
    argumentationResult: formatStageResult('Argumentation'),
    resolutionResult: formatStageResult('Resolution'),
    applicationResult: formatStageResult('Application'),
  });

  const parseAiReflectionText = (raw: string | null | undefined): AiReflection | null => {
    if (!raw) return null;
    const appreciationMatch = raw.match(/Apresiasi\s*[\r\n]+([\s\S]*?)(?=\n\s*Yang perlu ditingkatkan|\n\s*Saran belajar|$)/i);
    const needsImprovementMatch = raw.match(/Yang perlu ditingkatkan\s*[\r\n]+([\s\S]*?)(?=\n\s*Saran belajar|$)/i);
    const suggestionMatch = raw.match(/Saran belajar\s*[\r\n]+([\s\S]*)$/i);

    if (appreciationMatch && needsImprovementMatch && suggestionMatch) {
      return {
        appreciation: appreciationMatch[1].trim(),
        needsImprovement: needsImprovementMatch[1].trim(),
        suggestion: suggestionMatch[1].trim(),
      };
    }
    return null;
  };

  const fetchAiReflection = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiReflection(null);
    setDisplayedReflection({ appreciation: '', needsImprovement: '', suggestion: '' });
    setTypingSectionIndex(0);
    setIsTyping(false);

    const payload = buildIntrospectionPayload();

    try {
      const response = await fetch('/api/ai/introspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error ?? 'AI tidak merespons.');
      }

      if (!data.appreciation || !data.needsImprovement || !data.suggestion) {
        throw new Error('Respons AI tidak lengkap.');
      }

      const newReflection: AiReflection = {
        appreciation: data.appreciation,
        needsImprovement: data.needsImprovement,
        suggestion: data.suggestion,
      };

      setAiReflection(newReflection);
      setDisplayedReflection({ appreciation: '', needsImprovement: '', suggestion: '' });
      setTypingSectionIndex(0);
      setIsTyping(true);

      const authUser = getCurrentUser();
      const uid = authUser?.uid ?? user?.uid;
      if (uid) {
        const docId = `${uid}_${comic.id}_introspection`;
        const aiReflectionText = `Apresiasi
${data.appreciation}

Yang perlu ditingkatkan
${data.needsImprovement}

Saran belajar
${data.suggestion}`;
        await mergeFirestoreDocument('reflection', docId, {
          aiReflection: newReflection,
          response: aiReflectionText,
          submittedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      const friendlyMessage = 'Terjadi kesalahan saat membuat refleksi AI. Silakan coba lagi.';
      setAiError(friendlyMessage);
      throw new Error(friendlyMessage);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (!aiReflection || !isTyping) return;

    const sections: Array<keyof AiReflection> = ['appreciation', 'needsImprovement', 'suggestion'];
    const currentSection = sections[typingSectionIndex];
    const fullText = aiReflection[currentSection];
    const currentText = displayedReflection[currentSection] || '';

    if (currentText.length >= fullText.length) {
      if (typingSectionIndex < sections.length - 1) {
        const timeout = window.setTimeout(() => setTypingSectionIndex((index) => index + 1), 300);
        return () => window.clearTimeout(timeout);
      }
      setIsTyping(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setDisplayedReflection((current) => ({
        ...current,
        [currentSection]: fullText.slice(0, currentText.length + 1),
      }));
    }, 25);

    return () => window.clearTimeout(timeout);
  }, [aiReflection, displayedReflection, isTyping, typingSectionIndex]);

  const handleToggleChecklist = (index: number) => {
    setChecked((current) => current.map((value, idx) => (idx === index ? !value : value)));
    setSaved(false);
  };

  const handleSaveReflection = async () => {
    setAttemptedSave(true);
    setSaveError(null);
    setAiError(null);

    const authUser = getCurrentUser();
    const uid = authUser?.uid ?? user?.uid;

    if (!uid) {
      showSnackbar('Silakan masuk terlebih dahulu untuk menyimpan refleksi.', 'error');
      return;
    }

    if (!canSubmit) {
      showSnackbar('Lengkapi checklist, rating, dan tulisan refleksi sebelum menyimpan.', 'error');
      return;
    }

    setIsSavingReflection(true);

    try {
      const docId = `${uid}_${comic.id}_introspection`;
      await mergeFirestoreDocument('reflection', docId, {
        userId: uid,
        comicId: String(comic.id),
        checklist: selectedChecklist,
        confidence: rating,
        rating,
        reflectionText: reflectionText.trim(),
        stage: 'introspection',
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        status: 'completed',
        submittedAt: serverTimestamp(),
      });

      const completed = await completeCurrentStage({
        introspection: {
          completed: true,
          checklist: checklistItems.map((prompt, idx) => ({ prompt, checked: checked[idx] })),
          confidence: rating,
          reflectionText: reflectionText.trim(),
          completedAt: serverTimestamp(),
        },
      });

      if (!completed) {
        throw new Error('Gagal memperbarui progress Introspection.');
      }

      setSaved(true);
      showSnackbar('Refleksi berhasil disimpan.', 'success');

      await fetchAiReflection().catch((error) => {
        console.error('[IntrospectionStage] AI reflection update gagal', error);
        setAiError('Terjadi kesalahan saat membuat refleksi AI. Silakan coba lagi.');
      });
    } catch (error) {
      console.error('[IntrospectionStage] Gagal menyimpan refleksi', error);
      setSaved(false);
      const friendlyMessage = 'Refleksi belum dapat disimpan. Silakan coba lagi.';
      setSaveError(friendlyMessage);
      showSnackbar(friendlyMessage, 'error');
    } finally {
      setIsSavingReflection(false);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;

    const loadSavedIntrospection = async () => {
      try {
        const docId = `${user.uid}_${comic.id}_introspection`;
        const [savedReflection, identificationDocs, applicationDocs] = await Promise.all([
          getFirestoreDocument('reflection', docId),
          queryFirestoreCollection('identification_answers', {
            filters: [
              { field: 'userId', operator: '==', value: user.uid },
              { field: 'comicId', operator: '==', value: comic.id },
            ],
            orderByField: 'step',
            orderDirection: 'asc',
          }),
          queryFirestoreCollection('application_activity', {
            filters: [
              { field: 'userId', operator: '==', value: user.uid },
              { field: 'comicId', operator: '==', value: comic.id },
            ],
            orderByField: 'attempt',
            orderDirection: 'asc',
          }),
        ]);

        if (!active) return;

        if (savedReflection) {
          if (Array.isArray(savedReflection.selectedChecklist)) {
            setChecked(
              checklistItems.map((prompt) => savedReflection.selectedChecklist?.includes(prompt) ?? false),
            );
          }

          if (typeof savedReflection.confidence === 'number') {
            setRating(savedReflection.confidence);
          }

          if (typeof savedReflection.reflectionText === 'string') {
            setReflectionText(savedReflection.reflectionText);
          }

          const parsedAiReflection = typeof savedReflection.aiReflection === 'string'
            ? parseAiReflectionText(savedReflection.aiReflection)
            : savedReflection.aiReflection;

          if (parsedAiReflection) {
            setAiReflection(parsedAiReflection);
            setDisplayedReflection(parsedAiReflection);
            setSaved(true);
          }
        }

        setIdentificationAnswers(
          identificationDocs.map((doc) => ({
            step: doc.step,
            selectedAnswer: doc.selectedAnswer,
            note: doc.note,
            reason: doc.reason,
          }))
        );

        setApplicationActivities(
          applicationDocs.map((doc) => ({
            selectedAnswer: doc.selectedAnswer,
            studentReason: doc.studentReason,
            attempt: doc.attempt,
            coachType: doc.coachType,
            coachMessage: doc.coachMessage,
            coachSummary: doc.coachSummary,
            timestamp:
              typeof doc.timestamp === 'string'
                ? doc.timestamp
                : doc.timestamp?.toDate?.()?.toISOString(),
          }))
        );
      } catch (error) {
        console.error('[IntrospectionStage] Gagal memuat konteks Introspection', error);
      }
    };

    void loadSavedIntrospection();
    return () => {
      active = false;
    };
  }, [checklistItems, comic.id, user?.uid]);

  const handleContinueToNextComic = async () => {
    if (!aiReflection) return;

    const completed = await completeCurrentStage({
      introspection: {
        completed: true,
        checklist: checklistItems.map((prompt, idx) => ({ prompt, checked: checked[idx] })),
        confidence: rating,
        reflectionText: reflectionText.trim(),
        ...(aiReflection ? { aiReflection } : {}),
        completedAt: serverTimestamp(),
      },
    });

    if (!completed) {
      showSnackbar('Gagal menyelesaikan refleksi. Silakan coba lagi.', 'error');
      return;
    }

    if (nextComic?.availability === 'ACTIVE') {
      router.push(`/comic/${nextComic.id}/cover`);
      return;
    }

    showSnackbar(`Komik ${comic.id} berhasil diselesaikan 🎉 Lanjutkan ke tahap berikutnya.`, 'success');
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      <section className="rounded-[24px] bg-white px-5 py-6 shadow-sm sm:px-6 sm:py-8">
        <p className="text-sm font-black uppercase tracking-[0.35em] text-primary-700">🧠 Introspection</p>
        <h1 className="mt-4 text-3xl font-black text-neutral-950 sm:text-4xl">Refleksi Pembelajaran</h1>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-[24px] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-neutral-900">Refleksi Diri</h2>
          <p className="mt-2 text-sm text-neutral-500">Hari ini saya...</p>

          <div className="mt-5 space-y-3">
            {checklistItems.map((prompt, index) => (
              <label
                key={prompt}
                className="flex cursor-pointer items-start gap-3 rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-4 transition hover:border-primary-200"
              >
                <input
                  type="checkbox"
                  checked={checked[index]}
                  onChange={() => handleToggleChecklist(index)}
                  className="mt-1 h-5 w-5 rounded-md border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm leading-relaxed text-neutral-700">{prompt}</span>
              </label>
            ))}
          </div>

          {attemptedSave && !hasAtLeastOneCheck && (
            <p className="mt-4 text-sm font-semibold text-red-600">Pilih minimal satu pernyataan refleksi.</p>
          )}
        </section>

        <div className="space-y-5">
          <section className="rounded-[24px] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-neutral-900">Seberapa yakin kamu?</h2>
                <p className="mt-2 text-sm text-neutral-500">Pilih bintang dari 1 sampai 5.</p>
              </div>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black uppercase tracking-[0.25em] text-neutral-500">
                {hasRating ? STAR_LABELS[rating - 1] : 'Belum memilih'}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-5 gap-3">
              {Array.from({ length: 5 }, (_, index) => {
                const value = index + 1;
                const selected = rating === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setRating(value);
                      setSaved(false);
                    }}
                    className={['flex h-14 flex-col items-center justify-center rounded-3xl border px-3 text-sm font-black transition',
                      selected
                        ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-200 hover:bg-primary-50',
                    ].join(' ')}
                  >
                    <span className="text-xl leading-none">★</span>
                    <span className="mt-1 text-xs">{value}</span>
                  </button>
                );
              })}
            </div>

            {attemptedSave && !hasRating && (
              <p className="mt-4 text-sm font-semibold text-red-600">Pilih rating untuk mencerminkan keyakinanmu.</p>
            )}
          </section>

          <section className="rounded-[24px] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-neutral-900">Apa hal baru yang kamu pelajari hari ini?</h2>
                <p className="mt-2 text-sm text-neutral-500">Tuliskan pengalamanmu.</p>
              </div>
              <span className="text-sm font-bold text-neutral-500">{reflectionText.trim().length} karakter</span>
            </div>

            <textarea
              value={reflectionText}
              onChange={(event) => {
                setReflectionText(event.target.value);
                setSaved(false);
              }}
              rows={7}
              placeholder="Tuliskan pengalamanmu..."
              className="mt-5 min-h-[180px] w-full resize-none rounded-[28px] border border-neutral-200 bg-neutral-50 px-5 py-4 text-sm leading-relaxed text-neutral-900 outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100"
            />

            {attemptedSave && !hasMinimumReflection && (
              <p className="mt-4 text-sm font-semibold text-red-600">Tulisan harus minimal {MIN_REFLECTION_LENGTH} karakter.</p>
            )}
          </section>

          <button
            type="button"
            onClick={handleSaveReflection}
            disabled={isSavingReflection || saved}
            className={['inline-flex w-full items-center justify-center rounded-3xl px-5 py-4 text-sm font-black uppercase tracking-[0.15em] transition',
              isSavingReflection || saved
                ? 'cursor-not-allowed bg-neutral-200 text-neutral-500'
                : 'bg-primary-600 text-white shadow-sm hover:bg-primary-700',
            ].join(' ')}
          >
            {isSavingReflection ? 'Menyimpan...' : saved ? '✓ Refleksi Tersimpan' : 'SIMPAN REFLEKSI'}
          </button>

          {(saveError || aiError) && (
            <div className="rounded-[20px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {saveError ?? aiError}
            </div>
          )}
        </div>
      </div>

      {saved && aiReflection && (
        <section className="rounded-[24px] bg-white p-5 shadow-sm animate-fade-in-up">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-primary-700">🤖 Refleksi AI</p>
              <h2 className="mt-2 text-2xl font-black text-neutral-900">Refleksi AI</h2>
            </div>
            <button
              type="button"
              onClick={handleContinueToNextComic}
              className="inline-flex min-h-[52px] items-center justify-center rounded-3xl bg-secondary-500 px-5 py-3 text-sm font-black text-white transition hover:bg-secondary-600"
            >
              Lanjut ke Komik {nextComic?.id ?? comic.id + 1} →
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-black text-neutral-900">Apresiasi</p>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                {isTyping ? displayedReflection.appreciation : aiReflection.appreciation}
              </p>
            </div>
            <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-black text-neutral-900">Yang perlu ditingkatkan</p>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                {isTyping ? displayedReflection.needsImprovement : aiReflection.needsImprovement}
              </p>
            </div>
            <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-black text-neutral-900">Saran belajar</p>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                {isTyping ? displayedReflection.suggestion : aiReflection.suggestion}
              </p>
            </div>
          </div>
        </section>
      )}

      {aiLoading && (
        <section className="rounded-[24px] bg-white p-5 shadow-sm animate-fade-in-up">
          <div className="flex items-center gap-3 text-sm font-black text-neutral-700">
            <span className="inline-flex h-3 w-3 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
            Membuat refleksi AI…
          </div>
          <div className="mt-5 space-y-3">
            <div className="h-16 rounded-[24px] bg-neutral-100" />
            <div className="h-14 rounded-[24px] bg-neutral-100" />
            <div className="h-14 rounded-[24px] bg-neutral-100" />
          </div>
        </section>
      )}
    </div>
  );
}
