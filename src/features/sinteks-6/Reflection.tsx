'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getComicProgress, loadComicProgress, saveComicProgress, type ComicProgressStageData } from '@/services/comicProgress';
import { completeStage } from '@/features/learning-engine/services/learningEngineService';

type ReflectionProgress = NonNullable<NonNullable<ComicProgressStageData['introspection']>['sinteks6']>;
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const strategyOptions = [
  ['observe', 'Mengamati objek dengan teliti'],
  ['important-information', 'Menentukan informasi yang penting'],
  ['guess', 'Membuat dugaan'],
  ['ar', 'Menggunakan AR'],
  ['ai', 'Menggali informasi dengan AI'],
  ['compare', 'Membandingkan beberapa informasi'],
  ['calculate', 'Melakukan perhitungan'],
  ['check', 'Memeriksa kembali jawaban'],
  ['discuss', 'Berdiskusi dengan teman'],
  ['other', 'Strategi lainnya'],
] as const;

const arOptions = [
  ['shape', 'Melihat bentuk bangun ruang'],
  ['culture', 'Menghubungkan bentuk matematika dengan Candi Jawi'],
  ['compare', 'Membandingkan bentuk'],
  ['hypothesis', 'Memeriksa dugaan'],
  ['viewpoint', 'Memahami objek dari sudut pandang berbeda'],
  ['other', 'Lainnya'],
] as const;

const aiActionOptions = [
  ['replace', 'Langsung mengganti jawaban saya'],
  ['dismiss', 'Langsung menganggap AI salah'],
  ['verify', 'Memeriksa data dan perhitungan'],
  ['compare', 'Membandingkan dengan sumber atau bukti lain'],
  ['ask', 'Meminta alasan atau penjelasan lebih lanjut'],
  ['other', 'Pilihan lainnya'],
] as const;

const skillItems = [
  ['problem', 'Mengenali masalah'],
  ['information', 'Memilih informasi penting'],
  ['shapes', 'Mengenali bangun ruang'],
  ['evidence', 'Menggunakan bukti'],
  ['numeracy', 'Memecahkan masalah numerasi'],
  ['calculation', 'Memeriksa perhitungan'],
  ['ai', 'Mengevaluasi informasi AI'],
  ['reasoning', 'Menjelaskan alasan'],
  ['culture', 'Menghubungkan matematika dengan budaya'],
] as const;

const assessmentLevels = ['Masih Belajar', 'Mulai Bisa', 'Bisa', 'Sangat Yakin'];

const initialProgress: ReflectionProgress = {
  openedActivities: [],
  answers: {},
  selections: {},
  selfAssessment: {},
  completed: false,
};

function restoreProgress(stored?: Partial<ReflectionProgress>): ReflectionProgress {
  if (!stored) return initialProgress;
  return {
    ...initialProgress,
    ...stored,
    openedActivities: Array.isArray(stored.openedActivities) ? stored.openedActivities : [],
    answers: stored.answers ?? {},
    selections: Object.fromEntries(Object.entries(stored.selections ?? {}).map(([key, value]) => [key, Array.isArray(value) ? value : []])),
    selfAssessment: stored.selfAssessment ?? {},
    completed: stored.completed === true,
  };
}

function isFilled(progress: ReflectionProgress, keys: string[]) {
  return keys.every((key) => Boolean(progress.answers[key]?.trim()));
}

function firstIncompleteActivity(progress: ReflectionProgress): number | null {
  const complete = [
    isFilled(progress, ['beforeLearning', 'nowUnderstand', 'changeReason', 'initialGuess'])
      && (progress.answers.initialGuess !== 'Ada' || isFilled(progress, ['guessChangeReason'])),
    (progress.selections.strategies?.length ?? 0) > 0
      && isFilled(progress, ['mostHelpfulStrategy', 'strategyReason'])
      && (!progress.selections.strategies.includes('other') || isFilled(progress, ['strategyOther'])),
    isFilled(progress, ['difficulty', 'difficultyCause', 'improvementAction', 'futureSimilar']),
    (progress.selections.arBenefits?.length ?? 0) > 0
      && isFilled(progress, ['arUnderstood', 'withoutAr', 'withoutArHow'])
      && (!progress.selections.arBenefits.includes('other') || isFilled(progress, ['arOther'])),
    isFilled(progress, ['aiHelps', 'aiCaution', 'aiCheck', 'aiActionReason'])
      && (progress.selections.aiActions?.length ?? 0) > 0
      && (!progress.selections.aiActions.includes('other') || isFilled(progress, ['otherAiAction'])),
    isFilled(progress, ['humanTechnologyAgreement', 'humanTechnologyReason']),
    isFilled(progress, ['mathCultureConnection', 'candiExample', 'otherCultureBuilding', 'cultureExploration']),
    isFilled(progress, ['transferFirst', 'transferThen', 'transferVerify']),
    skillItems.every(([key]) => Boolean(progress.selfAssessment[key])),
    isFilled(progress, ['masteredSkill', 'improveSkill', 'nextPlan']),
    isFilled(progress, ['finalFound', 'finalRealized', 'finalNext']),
  ];
  const missing = complete.findIndex((isComplete) => !isComplete);
  return missing === -1 ? null : missing === 10 ? 11 : missing + 1;
}

export default function Reflection() {
  const { user } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState<ReflectionProgress>(initialProgress);
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [completionAttempted, setCompletionAttempted] = useState(false);
  const [completionError, setCompletionError] = useState('');
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const progressRef = useRef(progress);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    setHydratedUserId(null);
    setLoadFailed(false);
    void loadComicProgress(user.uid, 1)
      .then((document) => {
        if (!active) return;
        const restored = restoreProgress(document?.stageData?.introspection?.sinteks6);
        progressRef.current = restored;
        setProgress(restored);
      })
      .catch(() => {
        if (active) {
          setLoadFailed(true);
          setSaveState('error');
        }
      })
      .finally(() => {
        if (active) setHydratedUserId(user.uid);
      });
    return () => { active = false; };
  }, [user?.uid]);

  const persistProgress = useCallback((value: ReflectionProgress) => {
    if (!user?.uid) return Promise.reject(new Error('Login diperlukan untuk menyimpan refleksi.'));
    setSaveState('saving');
    const write = saveQueueRef.current
      .catch(() => undefined)
      .then(() => saveComicProgress(user.uid, 1, { stageData: { introspection: { sinteks6: value } } }));
    saveQueueRef.current = write;
    return write.then(() => setSaveState('saved')).catch((error: unknown) => {
      setSaveState('error');
      throw error;
    });
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || hydratedUserId !== user.uid || loadFailed) return;
    const timeout = window.setTimeout(() => {
      void persistProgress(progress).catch(() => undefined);
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [hydratedUserId, loadFailed, persistProgress, progress, user?.uid]);

  useEffect(() => {
    if (hydratedUserId !== user?.uid || loadFailed) return;
    const sections = document.querySelectorAll<HTMLElement>('[data-reflection-activity]');
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => Number((entry.target as HTMLElement).dataset.reflectionActivity))
        .filter(Number.isFinite);
      if (!visible.length) return;
      setProgress((current) => {
        const openedActivities = Array.from(new Set([...current.openedActivities, ...visible])).sort((a, b) => a - b);
        if (openedActivities.length === current.openedActivities.length) return current;
        const next = { ...current, openedActivities };
        progressRef.current = next;
        return next;
      });
    }, { threshold: 0.15 });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [hydratedUserId, loadFailed, user?.uid]);

  const updateProgress = (update: (current: ReflectionProgress) => ReflectionProgress) => {
    setProgress((current) => {
      const next = update(current);
      progressRef.current = next;
      return next;
    });
  };

  const updateAnswer = (key: string, value: string) => updateProgress((current) => ({
    ...current,
    answers: { ...current.answers, [key]: value },
  }));

  const updateSelection = (group: string, value: string, checked: boolean) => updateProgress((current) => {
    const selected = current.selections[group] ?? [];
    return {
      ...current,
      selections: {
        ...current.selections,
        [group]: checked ? [...selected.filter((item) => item !== value), value] : selected.filter((item) => item !== value),
      },
    };
  });

  const updateSelfAssessment = (skill: string, value: string) => updateProgress((current) => ({
    ...current,
    selfAssessment: { ...current.selfAssessment, [skill]: value },
  }));

  const handleReturnHome = async () => {
    try {
      await persistProgress(progressRef.current);
      router.push('/dashboard/siswa/home');
    } catch {
      setCompletionError('Refleksi belum tersimpan. Periksa koneksi, lalu coba lagi sebelum meninggalkan halaman.');
    }
  };

  const handleComplete = async () => {
    setCompletionAttempted(true);
    setCompletionError('');
    const missingActivity = firstIncompleteActivity(progressRef.current);
    if (missingActivity !== null) {
      setCompletionError('Lengkapi bagian ini agar perjalanan refleksimu lebih lengkap.');
      document.getElementById(`reflection-activity-${missingActivity}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!user?.uid) {
      setCompletionError('Masuk ke akunmu untuk menyimpan dan menyelesaikan refleksi.');
      return;
    }

    setSaveState('saving');
    try {
      await saveQueueRef.current.catch(() => undefined);
      const currentProgress = await getComicProgress(user.uid, 1);
      const completed = { ...progressRef.current, completed: true };
      await completeStage(user.uid, currentProgress, 'Introspection', {
        stageData: { introspection: { sinteks6: completed } },
      });
      progressRef.current = completed;
      setProgress(completed);
      setSaveState('saved');
      setCompletionError('');
    } catch (error) {
      setSaveState('error');
      setCompletionError(error instanceof Error && error.message.includes('permission')
        ? 'Refleksi tersimpan, tetapi status tahap belum dapat diperbarui. Periksa koneksi akunmu lalu coba lagi.'
        : 'Refleksi belum dapat diselesaikan. Jawabanmu tetap tersedia di halaman ini; periksa koneksi lalu coba lagi.');
    }
  };

  const saveLabel = saveState === 'saving'
    ? 'Menyimpan refleksi...'
    : saveState === 'saved'
      ? 'Refleksi tersimpan'
      : saveState === 'error'
        ? 'Belum tersimpan. Periksa koneksi lalu coba lagi.'
        : 'Refleksi tersimpan otomatis';

  if (hydratedUserId !== user?.uid || !user?.uid) {
    return <main className="min-h-[60dvh] px-4 py-10 text-center text-sm font-semibold text-[#536782]" aria-live="polite">Memuat refleksimu...</main>;
  }

  if (loadFailed) {
    return <main className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-5 text-center"><p className="text-base font-extrabold text-[#102F5B]">Refleksimu belum dapat dimuat.</p><p className="max-w-sm text-sm leading-relaxed text-[#536782]">Periksa koneksi internet, lalu muat ulang agar jawaban tersimpan tidak tertimpa.</p><button type="button" onClick={() => window.location.reload()} className="mt-2 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1685EE] px-4 text-sm font-bold text-white">Muat ulang</button></main>;
  }

  return (
    <main className="min-h-[calc(100dvh-88px)] bg-[#F5F9FF] px-4 pb-[calc(108px+env(safe-area-inset-bottom))] pt-4 text-[#102F5B] sm:px-5">
      <div className="mx-auto w-full max-w-[760px]">
        <header className="mb-4">
          <button type="button" onClick={handleReturnHome} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-bold text-[#1685EE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2D83E8]/30"><span aria-hidden="true" className="text-xl">←</span> Kembali</button>
          <div className="mt-2 rounded-[20px] bg-[#FFE4D6] p-4 sm:p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#E7622A]">TAHAP 6</p>
            <h1 className="mt-1 text-[22px] font-extrabold leading-tight">REFLEKSI</h1>
            <p className="mt-1 text-xs font-semibold text-[#536782]">CINARAI – Critical Numeracy with AR &amp; AI</p>
            <p className="mt-2 text-sm font-bold text-[#102F5B]">Lihat Kembali Perjalananmu!</p>
          </div>
          <div className="mt-3 flex items-center gap-3" aria-live="polite">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#DCE6F1]" role="progressbar" aria-label="Aktivitas refleksi yang dibuka" aria-valuemin={0} aria-valuemax={10} aria-valuenow={progress.openedActivities.length}><div className="h-full rounded-full bg-[#0DBF7E] transition-[width]" style={{ width: `${(progress.openedActivities.length / 10) * 100}%` }} /></div>
            <span className="shrink-0 text-[11px] font-bold text-[#536782]">{progress.openedActivities.length}/10 aktivitas</span>
          </div>
          <p className="mt-1 min-h-4 text-[10px] font-semibold text-[#71819A]" aria-live="polite">{saveLabel}</p>
        </header>

        <section className="rounded-[18px] border border-[#DCE8F4] bg-white p-4 shadow-[0_6px_18px_rgba(32,83,143,0.06)]" aria-labelledby="reflection-goal">
          <h2 id="reflection-goal" className="text-sm font-extrabold">Tujuan Tahap</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#536782]">Merefleksikan perubahan pemahaman, strategi berpikir, kesalahan dan perbaikannya, pemanfaatan AR dan AI secara kritis, hubungan matematika dengan budaya, serta kemampuan menerapkan strategi belajar pada konteks baru.</p>
        </section>

        <section className="mt-4 rounded-[18px] border border-[#DCE8F4] bg-white p-4 shadow-[0_6px_18px_rgba(32,83,143,0.06)]">
          <h2 className="text-base font-extrabold">Petualangan Hampir Selesai...</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#536782]">Kamu telah mengenali masalah, mengeksplorasi Candi Jawi melalui AR, menggali informasi dengan AI, menganalisis dan memecahkan masalah, serta menciptakan solusi. Sekarang waktunya melihat kembali perjalananmu.</p>
          <div className="mt-4 rounded-[16px] bg-[#102F5B] p-4 text-white"><p className="text-sm font-extrabold leading-relaxed">Bukan hanya &quot;Apa yang sudah saya pelajari?&quot;, tetapi juga &quot;Bagaimana cara saya berpikir dan mengapa saya mengambil keputusan tersebut?&quot;</p></div>
        </section>

        <ActivitySection number={1} title="Apa yang Berubah dari Pemahamanmu?">
          <TextArea label="Sebelum belajar, saya berpikir bahwa..." value={progress.answers.beforeLearning ?? ''} onChange={(value) => updateAnswer('beforeLearning', value)} />
          <TextArea label="Sekarang saya memahami bahwa..." value={progress.answers.nowUnderstand ?? ''} onChange={(value) => updateAnswer('nowUnderstand', value)} />
          <TextArea label="Hal yang membuat pemahaman saya berubah adalah..." value={progress.answers.changeReason ?? ''} onChange={(value) => updateAnswer('changeReason', value)} />
          <ChoiceAnswer name="initial-guess" label="Apakah ada dugaan awalmu yang ternyata kurang tepat?" value={progress.answers.initialGuess ?? ''} onChange={(value) => updateAnswer('initialGuess', value)} options={['Ada', 'Tidak ada', 'Saya belum yakin']} />
          <TextArea label="Jika ada, apa yang membuatmu mengubahnya?" value={progress.answers.guessChangeReason ?? ''} onChange={(value) => updateAnswer('guessChangeReason', value)} />
          <p className="rounded-xl bg-[#EEF7FF] p-3 text-sm leading-relaxed text-[#24527B]">Refleksi ini bukan untuk menentukan benar atau salah, tetapi untuk melihat perubahan pemahamanmu.</p>
        </ActivitySection>

        <ActivitySection number={2} title="Bagaimana Cara Kamu Berpikir?">
          <fieldset><legend className="text-sm font-bold leading-relaxed text-[#102F5B]">Ketika menghadapi masalah matematika dalam petualangan Candi Jawi, strategi apa yang paling membantumu?</legend><CheckboxOptions options={strategyOptions} selected={progress.selections.strategies ?? []} onChange={(value, checked) => updateSelection('strategies', value, checked)} /></fieldset>
          {progress.selections.strategies?.includes('other') && <TextArea label="Strategi lainnya:" value={progress.answers.strategyOther ?? ''} onChange={(value) => updateAnswer('strategyOther', value)} rows={2} />}
          <TextArea label="Strategi yang paling membantu saya adalah..." value={progress.answers.mostHelpfulStrategy ?? ''} onChange={(value) => updateAnswer('mostHelpfulStrategy', value)} />
          <TextArea label="Mengapa strategi tersebut efektif?" value={progress.answers.strategyReason ?? ''} onChange={(value) => updateAnswer('strategyReason', value)} />
        </ActivitySection>

        <ActivitySection number={3} title="Dari Kesalahan, Aku Belajar">
          <TextArea label="Kesalahan atau kesulitan yang saya alami:" value={progress.answers.difficulty ?? ''} onChange={(value) => updateAnswer('difficulty', value)} />
          <TextArea label="Mengapa hal tersebut terjadi?" value={progress.answers.difficultyCause ?? ''} onChange={(value) => updateAnswer('difficultyCause', value)} />
          <TextArea label="Apa yang saya lakukan untuk memperbaikinya?" value={progress.answers.improvementAction ?? ''} onChange={(value) => updateAnswer('improvementAction', value)} />
          <TextArea label="Jika menghadapi masalah serupa, saya akan..." value={progress.answers.futureSimilar ?? ''} onChange={(value) => updateAnswer('futureSimilar', value)} />
          <div className="rounded-[16px] bg-[#DDF5E6] p-4"><p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#2D8051]">Prinsip Refleksi</p><p className="mt-1 text-sm font-extrabold leading-relaxed text-[#245B3C]">Kesalahan dapat menjadi sumber belajar ketika kita mengetahui penyebabnya dan cara memperbaikinya.</p></div>
        </ActivitySection>

        <ActivitySection number={4} title="Apa yang AR Bantu Kamu Pahami?">
          <p className="text-sm leading-relaxed text-[#536782]">AR membantu mengeksplorasi bentuk yang tidak selalu mudah dikenali melalui pengamatan biasa. Namun, pengamatan dan penalaranmu tetap penting.</p>
          <fieldset><legend className="text-sm font-bold text-[#102F5B]">Apa yang AR bantu kamu pahami?</legend><CheckboxOptions options={arOptions} selected={progress.selections.arBenefits ?? []} onChange={(value, checked) => updateSelection('arBenefits', value, checked)} /></fieldset>
          {progress.selections.arBenefits?.includes('other') && <TextArea label="Hal lainnya:" value={progress.answers.arOther ?? ''} onChange={(value) => updateAnswer('arOther', value)} rows={2} />}
          <TextArea label="Hal yang dapat saya pahami lebih baik setelah menggunakan AR adalah..." value={progress.answers.arUnderstood ?? ''} onChange={(value) => updateAnswer('arUnderstood', value)} />
          <ChoiceAnswer name="without-ar" label="Apakah tanpa AR kamu tetap dapat memecahkan sebagian masalah?" value={progress.answers.withoutAr ?? ''} onChange={(value) => updateAnswer('withoutAr', value)} options={['Ya', 'Tidak', 'Mungkin']} />
          <TextArea label="Jelaskan bagaimana caranya." value={progress.answers.withoutArHow ?? ''} onChange={(value) => updateAnswer('withoutArHow', value)} />
        </ActivitySection>

        <ActivitySection number={5} title="Apa yang Kamu Pelajari dari AI?">
          <TextArea label="AI membantu saya untuk..." value={progress.answers.aiHelps ?? ''} onChange={(value) => updateAnswer('aiHelps', value)} />
          <TextArea label="Tetapi saya tidak boleh langsung mempercayai AI karena..." value={progress.answers.aiCaution ?? ''} onChange={(value) => updateAnswer('aiCaution', value)} />
          <TextArea label="Cara saya memeriksa jawaban AI adalah..." value={progress.answers.aiCheck ?? ''} onChange={(value) => updateAnswer('aiCheck', value)} />
          <fieldset><legend className="text-sm font-bold leading-relaxed text-[#102F5B]">Jika jawabanmu berbeda dengan AI, apa yang akan kamu lakukan?</legend><CheckboxOptions options={aiActionOptions} selected={progress.selections.aiActions ?? []} onChange={(value, checked) => updateSelection('aiActions', value, checked)} /></fieldset>
          {progress.selections.aiActions?.includes('other') && <TextArea label="Pilihan lainnya:" value={progress.answers.otherAiAction ?? ''} onChange={(value) => updateAnswer('otherAiAction', value)} rows={2} />}
          <TextArea label="Jelaskan alasanmu." value={progress.answers.aiActionReason ?? ''} onChange={(value) => updateAnswer('aiActionReason', value)} />
          <p className="rounded-xl bg-[#EEF7FF] p-3 text-sm leading-relaxed text-[#24527B]">Informasi AI perlu diperiksa dengan data, perhitungan, sumber, atau bukti lain. AI tidak selalu benar maupun selalu salah.</p>
        </ActivitySection>

        <ActivitySection number={6} title="Manusia atau Teknologi?">
          <blockquote className="rounded-xl border border-[#F1D78B] bg-[#FFF8E6] p-3 text-sm leading-relaxed text-[#76540B]">«&quot;Karena sudah ada AR dan AI, kita tidak perlu berpikir terlalu keras untuk belajar matematika.&quot;»</blockquote>
          <ChoiceAnswer name="human-or-technology" label="Apakah kamu setuju?" value={progress.answers.humanTechnologyAgreement ?? ''} onChange={(value) => updateAnswer('humanTechnologyAgreement', value)} options={['Setuju', 'Tidak setuju', 'Sebagian setuju']} />
          <TextArea label="Jelaskan alasanmu berdasarkan pengalaman menggunakan CINARAI." value={progress.answers.humanTechnologyReason ?? ''} onChange={(value) => updateAnswer('humanTechnologyReason', value)} rows={5} />
        </ActivitySection>

        <ActivitySection number={7} title="Matematika dan Budaya">
          <TextArea label="Saya menemukan bahwa matematika dan budaya berhubungan karena..." value={progress.answers.mathCultureConnection ?? ''} onChange={(value) => updateAnswer('mathCultureConnection', value)} />
          <TextArea label="Contoh matematika yang saya temukan pada Candi Jawi adalah..." value={progress.answers.candiExample ?? ''} onChange={(value) => updateAnswer('candiExample', value)} />
          <ChoiceAnswer name="other-culture" label="Apakah bangunan atau benda budaya lain juga menyimpan ide matematika?" value={progress.answers.otherCultureBuilding ?? ''} onChange={(value) => updateAnswer('otherCultureBuilding', value)} options={['Ya', 'Tidak', 'Belum tahu']} />
          <TextArea label="Berikan satu contoh yang ingin kamu eksplorasi." value={progress.answers.cultureExploration ?? ''} onChange={(value) => updateAnswer('cultureExploration', value)} />
          <p className="rounded-xl bg-[#FFF8E6] p-3 text-center text-sm font-extrabold text-[#76540B]">Matematika ↔ Budaya ↔ Candi Jawi</p>
        </ActivitySection>

        <ActivitySection number={8} title="Bisakah Kamu Menggunakannya di Tempat Lain?">
          <p className="text-sm leading-relaxed text-[#536782]">Bayangkan kamu melihat masjid, rumah adat, monumen, museum, atau bangunan lain. Apa yang akan kamu lakukan untuk menemukan matematikanya?</p>
          <TextArea label="Pertama, saya akan..." value={progress.answers.transferFirst ?? ''} onChange={(value) => updateAnswer('transferFirst', value)} />
          <TextArea label="Kemudian, saya akan..." value={progress.answers.transferThen ?? ''} onChange={(value) => updateAnswer('transferThen', value)} />
          <TextArea label="Saya akan memastikan jawaban saya dengan..." value={progress.answers.transferVerify ?? ''} onChange={(value) => updateAnswer('transferVerify', value)} />
        </ActivitySection>

        <ActivitySection number={9} title="Nilai Perkembangan Dirimu">
          <p className="text-sm leading-relaxed text-[#536782]">Pilih satu tingkat yang paling menggambarkan kemampuanmu saat ini.</p>
          <div className="space-y-3">{skillItems.map(([key, label]) => <fieldset key={key} className="rounded-xl border border-[#DCE8F4] bg-[#F8FBFF] p-3"><legend className="px-1 text-sm font-extrabold text-[#24527B]">{label}</legend><div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">{assessmentLevels.map((level) => <label key={level} className="flex min-h-11 items-center gap-2 rounded-lg border border-[#DCE8F4] bg-white px-2 py-2 text-xs font-semibold text-[#536782]"><input type="radio" name={`assessment-${key}`} value={level} checked={progress.selfAssessment[key] === level} onChange={() => updateSelfAssessment(key, level)} className="h-4 w-4 shrink-0 accent-[#1685EE]" />{level}</label>)}</div></fieldset>)}</div>
        </ActivitySection>

        <ActivitySection number={10} title="Target Belajarku Berikutnya">
          <TextArea label="Satu kemampuan yang sudah saya kuasai:" value={progress.answers.masteredSkill ?? ''} onChange={(value) => updateAnswer('masteredSkill', value)} />
          <TextArea label="Satu kemampuan yang masih perlu saya tingkatkan:" value={progress.answers.improveSkill ?? ''} onChange={(value) => updateAnswer('improveSkill', value)} />
          <TextArea label="Agar menjadi lebih baik, saya akan:" value={progress.answers.nextPlan ?? ''} onChange={(value) => updateAnswer('nextPlan', value)} />
        </ActivitySection>

        <section id="reflection-activity-11" className="mt-4 rounded-[18px] border border-[#DCE8F4] bg-white p-4 shadow-[0_6px_18px_rgba(32,83,143,0.06)]" aria-labelledby="final-reflection-title">
          <h2 id="final-reflection-title" className="mb-3 text-base font-extrabold">Refleksi Akhir CINARAI</h2>
          <div className="space-y-3"><TextArea label="Saya menemukan..." value={progress.answers.finalFound ?? ''} onChange={(value) => updateAnswer('finalFound', value)} /><TextArea label="Saya menyadari..." value={progress.answers.finalRealized ?? ''} onChange={(value) => updateAnswer('finalRealized', value)} /><TextArea label="Selanjutnya saya akan..." value={progress.answers.finalNext ?? ''} onChange={(value) => updateAnswer('finalNext', value)} /></div>
          <div className="mt-4 rounded-[16px] bg-[#DDF5E6] p-4"><p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#2D8051]">Pesan CINARAI</p><p className="mt-1 text-sm font-extrabold leading-relaxed text-[#245B3C]">Teknologi dapat membantu kita melihat, mencari, dan mengeksplorasi. Namun, memahami informasi, memeriksa bukti, memberikan alasan, dan mengambil keputusan tetap membutuhkan pemikiran kita sendiri.</p></div>
        </section>

        <section className="mt-4 rounded-[18px] border border-[#BFE7CF] bg-[#EFF9F2] p-4" aria-labelledby="reflection-complete-title">
          {progress.completed ? <><p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#2D8051]">Perjalanan Refleksi Selesai</p><h2 id="reflection-complete-title" className="mt-1 text-lg font-extrabold">Refleksimu sudah tersimpan.</h2><p className="mt-2 text-sm leading-relaxed text-[#426650]">Tahap 6 telah ditandai selesai. Jawabanmu tetap tersimpan dan dapat dibaca kembali.</p><button type="button" onClick={() => router.push('/dashboard/siswa/home')} className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[#2D8051] px-4 text-sm font-extrabold text-[#245B3C]">KEMBALI KE HOME</button></> : <><p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#2D8051]">Refleksi Akhir CINARAI</p><h2 id="reflection-complete-title" className="mt-1 text-lg font-extrabold">Selesaikan perjalanan refleksimu.</h2><p className="mt-2 text-sm leading-relaxed text-[#426650]">Jawabanmu akan disimpan dan Tahap 6 ditandai selesai.</p><button type="button" onClick={() => void handleComplete()} disabled={saveState === 'saving'} className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#1685EE] px-4 text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(22,133,238,0.2)] transition hover:bg-[#1479d4] disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2D83E8]/30">SELESAIKAN REFLEKSI</button></>}
          {completionError && <p role={completionAttempted ? 'alert' : 'status'} className="mt-3 rounded-xl bg-white p-3 text-sm font-semibold leading-relaxed text-[#536782]">{completionError}</p>}
          {progress.completed && saveState === 'saved' && <p role="status" className="mt-3 rounded-xl bg-white p-3 text-sm font-semibold text-[#245B3C]">Refleksi berhasil disimpan dan progress Tahap 6 diperbarui.</p>}
        </section>
      </div>
    </main>
  );
}

function ActivitySection({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return <section data-reflection-activity={number} id={`reflection-activity-${number}`} className="mt-4 rounded-[18px] border border-[#DCE8F4] bg-white p-4 shadow-[0_6px_18px_rgba(32,83,143,0.06)]" aria-labelledby={`reflection-activity-title-${number}`}><h2 id={`reflection-activity-title-${number}`} className="mb-3 flex items-start gap-2 text-base font-extrabold leading-snug"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#FFE4D6] text-sm text-[#E7622A]">{number}</span><span>{number}. {title}</span></h2><div className="space-y-3">{children}</div></section>;
}

function TextArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return <label className="block text-sm font-bold text-[#102F5B]">{label}<textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-[96px] w-full resize-y rounded-xl border border-[#C7D8E9] bg-white px-3 py-3 text-sm font-normal leading-relaxed text-[#102F5B] outline-none focus:border-[#1685EE] focus:ring-4 focus:ring-[#1685EE]/15" /></label>;
}

function ChoiceAnswer({ name, label, value, onChange, options }: { name: string; label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <fieldset><legend className="text-sm font-bold leading-relaxed text-[#102F5B]">{label}</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{options.map((option) => <label key={option} className="flex min-h-11 items-start gap-3 rounded-xl border border-[#DCE8F4] px-3 py-2 text-sm leading-snug text-[#536782]"><input type="radio" name={`sinteks6-${name}`} value={option} checked={value === option} onChange={() => onChange(option)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#1685EE]" /><span>{option}</span></label>)}</div></fieldset>;
}

function CheckboxOptions({ options, selected, onChange }: { options: readonly (readonly [string, string])[]; selected: string[]; onChange: (value: string, checked: boolean) => void }) {
  return <div className="mt-2 grid gap-2 sm:grid-cols-2">{options.map(([value, label]) => <label key={value} className="flex min-h-11 items-start gap-3 rounded-xl border border-[#DCE8F4] px-3 py-2 text-sm leading-snug text-[#536782]"><input type="checkbox" checked={selected.includes(value)} onChange={(event) => onChange(value, event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#1685EE]" /><span>{label}</span></label>)}</div>;
}