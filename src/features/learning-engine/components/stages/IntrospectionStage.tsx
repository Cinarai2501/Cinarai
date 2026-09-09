'use client';

import { useEffect, useMemo, useState } from 'react';
import { getCurrentUser } from '@/lib/firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { useSnackbar } from '@/context/SnackbarContext';
import { saveReflectionDocument } from '@/services/reflection';
import { loadComicProgress, saveComicProgress } from '@/services/comicProgress';
import { useLearningEngine } from '../../hooks/useLearningEngine';

const MIN_DAILY_USE_LENGTH = 10;

type ReflectionAnswers = {
  understood: string[];
  interesting: string;
  dailyUse: string;
  difficult: string;
};

function getUnderstandingItems(checklist: readonly string[], targets: readonly string[]) {
  if (checklist.length > 0) return checklist;
  return targets.length > 0 ? targets : ['Konsep utama pada komik ini'];
}

export default function IntrospectionStage() {
  const { comic, comicModule, completeAndAdvance } = useLearningEngine();
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const understandingItems = useMemo(
    () => getUnderstandingItems(comicModule.introspection.checklist, comicModule.metadata.learningTargets),
    [comicModule.introspection.checklist, comicModule.metadata.learningTargets],
  );
  const objectLabels = useMemo(
    () => comicModule.navigation.learningObjects.map((item) => item.title).filter(Boolean),
    [comicModule.navigation.learningObjects],
  );
  const difficultItems = useMemo(
    () => ['Belum ada bagian yang sulit', ...understandingItems],
    [understandingItems],
  );
  const [answers, setAnswers] = useState<ReflectionAnswers>({ understood: [], interesting: '', dailyUse: '', difficult: '' });
  const [isSaved, setIsSaved] = useState(false);
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasHydratedProgress, setHasHydratedProgress] = useState(false);

  const isComplete = answers.understood.length > 0
    && answers.interesting.length > 0
    && answers.dailyUse.trim().length >= MIN_DAILY_USE_LENGTH
    && answers.difficult.length > 0;

  useEffect(() => {
    if (!user?.uid) {
      setHasHydratedProgress(true);
      return;
    }

    let active = true;
    void loadComicProgress(user.uid, comic.id).then((document) => {
      if (!active) return;
      const saved = document?.stageData?.introspection;
      if (saved) {
        setAnswers({
          understood: Array.isArray(saved.understood) ? saved.understood : [],
          interesting: typeof saved.interesting === 'string' ? saved.interesting : '',
          dailyUse: typeof saved.dailyUse === 'string' ? saved.dailyUse : '',
          difficult: typeof saved.difficult === 'string' ? saved.difficult : '',
        });
        setIsSaved(saved.saved === true);
      }
      setHasHydratedProgress(true);
    }).catch((error) => {
      console.error('[IntrospectionStage] Gagal memuat progress refleksi', error);
      setHasHydratedProgress(true);
    });

    return () => {
      active = false;
    };
  }, [comic.id, user?.uid]);

  useEffect(() => {
    if (!user?.uid || !hasHydratedProgress) return;
    void saveComicProgress(user.uid, comic.id, {
      stageData: {
        introspection: {
          understood: answers.understood,
          interesting: answers.interesting,
          dailyUse: answers.dailyUse,
          difficult: answers.difficult,
          saved: isSaved,
        },
      },
    });
  }, [answers, comic.id, hasHydratedProgress, isSaved, user?.uid]);

  const updateAnswers = (patch: Partial<ReflectionAnswers>) => {
    setAnswers((current) => ({ ...current, ...patch }));
    setIsSaved(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    setAttemptedSave(true);
    if (!isComplete) return;

    const uid = getCurrentUser()?.uid ?? user?.uid;
    if (!uid) {
      showSnackbar('Silakan masuk terlebih dahulu untuk menyimpan refleksi.', 'error');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    const reflectionText = [
      `Yang sudah dipahami: ${answers.understood.join(', ')}`,
      `Yang paling menarik: ${answers.interesting}`,
      `Penggunaan sehari-hari: ${answers.dailyUse.trim()}`,
      `Yang masih sulit: ${answers.difficult}`,
    ].join('\n');

    try {
      await saveReflectionDocument({
        userId: uid,
        comicId: comic.id,
        checklist: answers.understood,
        confidence: null,
        reflectionText,
        stage: 'introspection',
        status: 'completed',
      });
      setIsSaved(true);
      showSnackbar('Refleksi berhasil disimpan.', 'success');
    } catch (error) {
      console.error('[IntrospectionStage] Gagal menyimpan refleksi', error);
      setSaveError('Refleksi belum dapat disimpan. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinue = async () => {
    if (!isSaved) return;
    await completeAndAdvance('Introspection');
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      <section className="rounded-[24px] bg-white px-5 py-6 shadow-sm sm:px-6 sm:py-8">
        <p className="text-sm font-black uppercase tracking-[0.35em] text-primary-700">REFLEKSI</p>
        <h1 className="mt-3 text-2xl font-black leading-tight text-neutral-950 sm:text-3xl">Apa yang kamu pelajari?</h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-base">
          Refleksikan pengalamanmu dari komik <span className="font-bold text-neutral-900">{comic.title}</span>.
        </p>
      </section>

      <section className="rounded-[24px] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-neutral-900">Apa yang sudah dipahami?</h2>
        <p className="mt-2 text-sm text-neutral-500">Pilih semua konsep yang menurutmu sudah kamu pahami.</p>
        <div className="mt-4 grid gap-3">
          {understandingItems.map((item) => {
            const selected = answers.understood.includes(item);
            return (
              <button key={item} type="button" onClick={() => updateAnswers({ understood: selected ? answers.understood.filter((value) => value !== item) : [...answers.understood, item] })} className={['flex min-h-12 items-start gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition', selected ? 'border-primary-600 bg-primary-50 text-primary-900' : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-primary-200'].join(' ')}>
                <span className={['mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border text-xs', selected ? 'border-primary-600 bg-primary-600 text-white' : 'border-neutral-300 bg-white text-transparent'].join(' ')}>✓</span>
                <span>{item}</span>
              </button>
            );
          })}
        </div>
        {attemptedSave && answers.understood.length === 0 && <p className="mt-3 text-sm font-semibold text-red-600">Pilih minimal satu konsep.</p>}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ReflectionChoice title="Apa yang paling menarik?" options={objectLabels.length > 0 ? objectLabels : [comicModule.metadata.title]} value={answers.interesting} onChange={(interesting) => updateAnswers({ interesting })} />
        <ReflectionChoice title="Bagian mana yang masih terasa sulit?" options={difficultItems} value={answers.difficult} onChange={(difficult) => updateAnswers({ difficult })} />
      </section>

      <section className="rounded-[24px] bg-white p-5 shadow-sm">
        <label htmlFor="reflection-daily-use" className="text-lg font-black text-neutral-900">Bagaimana konsep ini digunakan sehari-hari?</label>
        <p className="mt-2 text-sm text-neutral-500">Tuliskan satu contoh dari rumah, sekolah, atau lingkunganmu.</p>
        <textarea id="reflection-daily-use" value={answers.dailyUse} onChange={(event) => updateAnswers({ dailyUse: event.target.value })} rows={5} className="mt-4 min-h-[140px] w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-900 outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100" placeholder="Contoh: ..." />
        <p className="mt-2 text-xs text-neutral-500">{answers.dailyUse.trim().length} / {MIN_DAILY_USE_LENGTH} karakter</p>
        {attemptedSave && answers.dailyUse.trim().length < MIN_DAILY_USE_LENGTH && <p className="mt-2 text-sm font-semibold text-red-600">Tuliskan minimal {MIN_DAILY_USE_LENGTH} karakter.</p>}
      </section>

      <button type="button" onClick={handleSave} disabled={isSaving || isSaved} className={['min-h-14 w-full rounded-2xl px-5 py-3 text-sm font-black uppercase tracking-[0.12em] transition', isSaving || isSaved ? 'bg-neutral-200 text-neutral-500' : 'bg-primary-600 text-white hover:bg-primary-700'].join(' ')}>
        {isSaving ? 'Menyimpan refleksi...' : isSaved ? 'Refleksi tersimpan' : 'Simpan Refleksi'}
      </button>

      {isSaved && <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 text-sm leading-relaxed text-emerald-900"><p className="font-black">Refleksimu sudah tersimpan.</p><p className="mt-1">Kamu sudah menghubungkan isi komik dengan pengalamanmu sendiri.</p></div>}
      {saveError && <div className="rounded-[20px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">{saveError}</div>}

      {isSaved && <button type="button" onClick={handleContinue} className="min-h-14 w-full rounded-2xl bg-secondary-500 px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-secondary-600">Lanjut ke Learning Result</button>}
    </div>
  );
}

function ReflectionChoice({ title, options, value, onChange }: { title: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <section className="rounded-[24px] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-neutral-900">{title}</h2>
      <div className="mt-4 grid gap-2">
        {options.map((option) => (
          <button key={option} type="button" onClick={() => onChange(option)} className={['min-h-11 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition', value === option ? 'border-primary-600 bg-primary-50 text-primary-900' : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-primary-200'].join(' ')}>{option}</button>
        ))}
      </div>
    </section>
  );
}
