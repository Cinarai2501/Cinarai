'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { loadComicProgress, saveComicProgress, type ComicProgressStageData } from '@/services/comicProgress';

type AnalysisProgress = NonNullable<ComicProgressStageData['analysisProblem']>;
type Finding = AnalysisProgress['findings'][number];
type ShapeEvidence = AnalysisProgress['shapeEvidence'][string];

const emptyFinding = (): Finding => ({
  part: '',
  initialGuess: '',
  arFinding: '',
  aiInformation: '',
  provisionalConclusion: '',
});

const shapeNames = ['Kubus', 'Balok', 'Prisma', 'Limas', 'Kerucut'];
const checklistItems = [
  ['understandProblem', 'Saya memahami masalah yang harus diselesaikan.'],
  ['relevantInformation', 'Saya menggunakan informasi yang relevan.'],
  ['arEvidence', 'Saya menggunakan bukti dari eksplorasi AR.'],
  ['verifyAi', 'Saya memeriksa informasi yang diperoleh dari AI.'],
  ['mathConcept', 'Saya menggunakan konsep matematika yang tepat.'],
  ['checkCalculation', 'Saya memeriksa kembali perhitungan saya.'],
  ['explainReasoning', 'Saya dapat menjelaskan alasan jawaban saya.'],
  ['notVisualGuess', 'Saya tidak hanya menebak berdasarkan kemiripan visual.'],
] as const;

const initialProgress: AnalysisProgress = {
  openedActivities: [],
  findings: [emptyFinding()],
  shapeEvidence: Object.fromEntries(shapeNames.map((name) => [name, {
    sidesOrBase: '', sideCount: '', edgeCount: '', vertexCount: '', templePart: '',
  }])) as AnalysisProgress['shapeEvidence'],
  answers: {},
  choices: {},
  checklist: {},
  completed: false,
};

function restoreProgress(stored: Partial<AnalysisProgress> | undefined): AnalysisProgress {
  if (!stored) return initialProgress;
  return {
    ...initialProgress,
    ...stored,
    openedActivities: Array.isArray(stored.openedActivities) ? stored.openedActivities : [],
    findings: Array.isArray(stored.findings) && stored.findings.length
      ? stored.findings.map((finding) => ({ ...emptyFinding(), ...finding }))
      : [emptyFinding()],
    shapeEvidence: Object.fromEntries(shapeNames.map((name) => [name, {
      ...initialProgress.shapeEvidence[name],
      ...stored.shapeEvidence?.[name],
    }])) as AnalysisProgress['shapeEvidence'],
    answers: stored.answers ?? {},
    choices: stored.choices ?? {},
    checklist: stored.checklist ?? {},
    completed: stored.completed === true,
  };
}

export default function AnalysisProblem() {
  const { user } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState<AnalysisProgress>(initialProgress);
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    const userId = user?.uid;
    if (!userId) return;

    let active = true;
    setHydratedUserId(null);
    setLoadFailed(false);
    void loadComicProgress(userId, 1)
      .then((document) => {
        if (!active) return;
        setProgress(restoreProgress(document?.stageData?.analysisProblem));
      })
      .catch(() => {
        if (active) {
          setLoadFailed(true);
          setSaveState('error');
        }
      })
      .finally(() => {
        if (active) setHydratedUserId(userId);
      });

    return () => {
      active = false;
    };
  }, [user?.uid]);

  const persistProgress = useCallback((value: AnalysisProgress) => {
    const userId = user?.uid;
    if (!userId) return Promise.reject(new Error('Login diperlukan untuk menyimpan jawaban.'));

    setSaveState('saving');
    const write = saveQueueRef.current
      .catch(() => undefined)
      .then(() => saveComicProgress(userId, 1, { stageData: { analysisProblem: value } }));
    saveQueueRef.current = write;

    return write.then(() => {
      setSaveState('saved');
    }).catch((error: unknown) => {
      setSaveState('error');
      throw error;
    });
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || hydratedUserId !== user.uid || loadFailed) return;
    const timeout = window.setTimeout(() => {
      void persistProgress(progress).catch(() => undefined);
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [hydratedUserId, loadFailed, persistProgress, progress, user?.uid]);

  useEffect(() => {
    if (hydratedUserId !== user?.uid || loadFailed) return;
    const sections = document.querySelectorAll<HTMLElement>('[data-analysis-activity]');
    const observer = new IntersectionObserver((entries) => {
      const visibleNumbers = entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => Number((entry.target as HTMLElement).dataset.analysisActivity))
        .filter(Number.isFinite);
      if (!visibleNumbers.length) return;
      setProgress((current) => {
        const openedActivities = Array.from(new Set([...current.openedActivities, ...visibleNumbers])).sort((a, b) => a - b);
        if (openedActivities.length === current.openedActivities.length) return current;
        return { ...current, openedActivities };
      });
    }, { threshold: 0.15 });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [hydratedUserId, loadFailed, user?.uid]);

  const updateAnswer = (key: string, value: string) => {
    setProgress((current) => ({ ...current, answers: { ...current.answers, [key]: value } }));
  };

  const updateChoice = (key: string, value: string) => {
    setProgress((current) => ({ ...current, choices: { ...current.choices, [key]: value } }));
  };

  const updateFinding = (index: number, key: keyof Finding, value: string) => {
    setProgress((current) => ({
      ...current,
      findings: current.findings.map((finding, rowIndex) => rowIndex === index ? { ...finding, [key]: value } : finding),
    }));
  };

  const updateShapeEvidence = (shape: string, key: keyof ShapeEvidence, value: string) => {
    setProgress((current) => ({
      ...current,
      shapeEvidence: { ...current.shapeEvidence, [shape]: { ...current.shapeEvidence[shape], [key]: value } },
    }));
  };

  const updateChecklist = (key: string, checked: boolean) => {
    setProgress((current) => ({ ...current, checklist: { ...current.checklist, [key]: checked } }));
  };

  const handleReturnHome = async () => {
    try {
      await persistProgress(progress);
      router.push('/dashboard/siswa/home');
    } catch {
      return;
    }
  };

  const handleContinue = async () => {
    const completed = { ...progress, completed: true };
    setProgress(completed);
    try {
      await persistProgress(completed);
      router.push('/comic/1/learn?stage=Application');
    } catch {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  };

  if (hydratedUserId !== user?.uid || !user?.uid) {
    return <main className="min-h-[60dvh] px-4 py-10 text-center text-sm font-semibold text-[#536782]" aria-live="polite">Memuat aktivitas dan jawabanmu...</main>;
  }

  if (loadFailed) {
    return (
      <main className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-5 text-center">
        <p className="text-base font-extrabold text-[#102F5B]">Jawabanmu belum dapat dimuat.</p>
        <p className="max-w-sm text-sm leading-relaxed text-[#536782]">Periksa koneksi internet, lalu muat ulang agar jawaban yang tersimpan tidak tertimpa.</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-2 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1685EE] px-4 text-sm font-bold text-white">Muat ulang</button>
      </main>
    );
  }

  const saveLabel = saveState === 'saving'
    ? 'Menyimpan jawaban...'
    : saveState === 'saved'
      ? 'Jawaban tersimpan'
      : saveState === 'error'
        ? 'Belum tersimpan. Periksa koneksi lalu coba lagi.'
        : 'Jawaban tersimpan otomatis';

  return (
    <main className="min-h-[calc(100dvh-88px)] bg-[#F5F9FF] px-4 pb-[calc(108px+env(safe-area-inset-bottom))] pt-4 text-[#102F5B] sm:px-5">
      <div className="mx-auto w-full max-w-[760px]">
        <header className="mb-4">
          <button type="button" onClick={handleReturnHome} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-bold text-[#1685EE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2D83E8]/30">
            <span aria-hidden="true" className="text-xl">←</span> Kembali
          </button>
          <div className="mt-2 rounded-[20px] bg-[#DDF5E6] p-4 sm:p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#2D8051]">TAHAP 4</p>
            <h1 className="mt-1 text-[22px] font-extrabold leading-tight">ANALISIS &amp; PEMECAHAN MASALAH</h1>
            <p className="mt-1 text-xs font-semibold text-[#536782]">CINARAI – Critical Numeracy with AR &amp; AI</p>
            <p className="mt-3 inline-flex rounded-full bg-white/75 px-3 py-1.5 text-xs font-bold text-[#102F5B]">Pecahkan Misteri Candi Jawi!</p>
          </div>
          <div className="mt-3 flex items-center gap-3" aria-live="polite">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#DCE6F1]" role="progressbar" aria-label="Aktivitas yang sudah dibuka" aria-valuemin={0} aria-valuemax={9} aria-valuenow={progress.openedActivities.length}>
              <div className="h-full rounded-full bg-[#0DBF7E] transition-[width]" style={{ width: `${(progress.openedActivities.length / 9) * 100}%` }} />
            </div>
            <span className="shrink-0 text-[11px] font-bold text-[#536782]">{progress.openedActivities.length}/9 aktivitas</span>
          </div>
          <p className="mt-1 min-h-4 text-[10px] font-semibold text-[#71819A]" aria-live="polite">{saveLabel}</p>
        </header>

        <section className="rounded-[18px] border border-[#DCE8F4] bg-white p-4 shadow-[0_6px_18px_rgba(32,83,143,0.06)]" aria-labelledby="analysis-goal">
          <h2 id="analysis-goal" className="text-sm font-extrabold">Tujuan Tahap</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#536782]">Menganalisis bukti hasil eksplorasi AR dan informasi yang diperoleh dengan bantuan AI, menghubungkannya dengan konsep bangun ruang, memilih strategi matematika yang tepat, melakukan perhitungan, mengevaluasi kesalahan, serta menyusun kesimpulan berbasis bukti.</p>
        </section>

        <section className="mt-4 rounded-[18px] border border-[#DCE8F4] bg-white p-4 shadow-[0_6px_18px_rgba(32,83,143,0.06)]">
          <h2 className="text-sm font-extrabold">Saatnya Menggunakan Bukti</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#536782]">Kamu telah membuat dugaan awal, mengeksplorasi Candi Jawi melalui komik AR, dan menggali informasi dengan bantuan AI. Sekarang saatnya mengolah semua informasi tersebut. Ingat, memiliki banyak informasi belum berarti masalah sudah terpecahkan.</p>
          <div className="mt-4 rounded-[16px] bg-[#102F5B] p-4 text-white">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#A9D8FF]">MISI UTAMA</p>
            <p className="mt-2 text-base font-extrabold leading-snug">Bangun ruang apa saja yang dapat digunakan untuk merepresentasikan bagian-bagian Candi Jawi, dan bukti matematis apa yang mendukung kesimpulanmu?</p>
          </div>
        </section>

        <ActivitySection number={1} title="Periksa Kembali Temuanmu">
          <p className="text-sm leading-relaxed text-[#536782]">Bandingkan dugaan awal, temuan dari AR, dan informasi yang kamu peroleh dari AI.</p>
          <div className="mt-3 hidden overflow-x-auto rounded-xl border border-[#DCE8F4] md:block">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-[#EEF7FF] text-[#24527B]"><tr>{['Bagian Candi', 'Dugaan Awal', 'Temuan AR', 'Informasi dari AI', 'Kesimpulan Sementara'].map((label) => <th key={label} className="p-2 font-extrabold">{label}</th>)}</tr></thead>
              <tbody>{progress.findings.map((finding, index) => <tr key={index} className="border-t border-[#DCE8F4]">{(['part', 'initialGuess', 'arFinding', 'aiInformation', 'provisionalConclusion'] as const).map((key) => <td key={key} className="p-2"><input aria-label={`${['Bagian Candi', 'Dugaan Awal', 'Temuan AR', 'Informasi dari AI', 'Kesimpulan Sementara'][['part', 'initialGuess', 'arFinding', 'aiInformation', 'provisionalConclusion'].indexOf(key)]}, baris ${index + 1}`} value={finding[key]} onChange={(event) => updateFinding(index, key, event.target.value)} className="min-h-11 w-full min-w-[125px] rounded-lg border border-[#C7D8E9] px-2 text-sm outline-none focus:border-[#1685EE] focus:ring-4 focus:ring-[#1685EE]/15" /></td>)}</tr>)}</tbody>
            </table>
          </div>
          <div className="mt-3 space-y-3 md:hidden">
            {progress.findings.map((finding, index) => <div key={index} className="rounded-xl border border-[#DCE8F4] bg-[#F8FBFF] p-3"><p className="mb-2 text-xs font-extrabold text-[#24527B]">Bagian {index + 1}</p><div className="space-y-3"><LabeledInput label="Bagian Candi" value={finding.part} onChange={(value) => updateFinding(index, 'part', value)} /><LabeledInput label="Dugaan Awal" value={finding.initialGuess} onChange={(value) => updateFinding(index, 'initialGuess', value)} /><LabeledInput label="Temuan AR" value={finding.arFinding} onChange={(value) => updateFinding(index, 'arFinding', value)} /><LabeledInput label="Informasi dari AI" value={finding.aiInformation} onChange={(value) => updateFinding(index, 'aiInformation', value)} /><LabeledInput label="Kesimpulan Sementara" value={finding.provisionalConclusion} onChange={(value) => updateFinding(index, 'provisionalConclusion', value)} /></div></div>)}
          </div>
          <button type="button" onClick={() => setProgress((current) => ({ ...current, findings: [...current.findings, emptyFinding()] }))} className="mt-3 min-h-11 rounded-xl border border-[#B8DDFB] px-3 text-sm font-bold text-[#1685EE]">+ Tambah bagian Candi</button>
          <ChoiceAnswer name="initialGuesses" label="Apakah semua dugaan awalmu benar?" value={progress.choices.initialGuesses ?? ''} onChange={(value) => updateChoice('initialGuesses', value)} options={[{ value: 'yes', label: 'Ya' }, { value: 'some', label: 'Sebagian' }, { value: 'no', label: 'Tidak' }]} />
          <TextArea label="Temuan apa yang membuatmu mengubah atau mempertahankan dugaan?" value={progress.answers.findingReflection ?? ''} onChange={(value) => updateAnswer('findingReflection', value)} />
          <p className="rounded-xl bg-[#E9F7EF] p-3 text-sm leading-relaxed text-[#286443]">Mengubah jawaban setelah memperoleh bukti baru bukan berarti gagal. Itu merupakan bagian dari proses berpikir kritis.</p>
        </ActivitySection>

        <ActivitySection number={2} title="Kelompokkan Bukti Matematis">
          <p className="text-sm leading-relaxed text-[#536782]">Jangan hanya melihat kemiripan bentuk. Gunakan karakteristik matematis sebagai bukti.</p>
          <div className="mt-3 hidden overflow-x-auto rounded-xl border border-[#DCE8F4] md:block">
            <table className="w-full min-w-[780px] text-left text-xs">
              <thead className="bg-[#EEF7FF] text-[#24527B]"><tr>{['Bangun Ruang', 'Bentuk Sisi/Alas', 'Jumlah Sisi', 'Jumlah Rusuk', 'Titik Sudut', 'Bagian Candi'].map((label) => <th key={label} className="p-2 font-extrabold">{label}</th>)}</tr></thead>
              <tbody>{shapeNames.map((shape) => <tr key={shape} className="border-t border-[#DCE8F4]"><th className="p-2 font-extrabold">{shape}</th>{(['sidesOrBase', 'sideCount', 'edgeCount', 'vertexCount', 'templePart'] as const).map((key) => <td key={key} className="p-2"><input aria-label={`${shape}, ${key}`} value={progress.shapeEvidence[shape][key]} onChange={(event) => updateShapeEvidence(shape, key, event.target.value)} className="min-h-11 w-full min-w-[110px] rounded-lg border border-[#C7D8E9] px-2 text-sm outline-none focus:border-[#1685EE] focus:ring-4 focus:ring-[#1685EE]/15" /></td>)}</tr>)}</tbody>
            </table>
          </div>
          <div className="mt-3 space-y-3 md:hidden">{shapeNames.map((shape) => <ShapeEvidenceCard key={shape} shape={shape} value={progress.shapeEvidence[shape]} onChange={(key, value) => updateShapeEvidence(shape, key, value)} />)}</div>
        </ActivitySection>

        <ActivitySection number={3} title="Uji Kekuatan Bukti">
          <div className="grid gap-3 sm:grid-cols-2">
            <blockquote className="rounded-xl border border-[#F1D78B] bg-[#FFF8E6] p-3 text-sm leading-relaxed text-[#76540B]"><span className="mb-1 block text-[11px] font-black uppercase tracking-[0.1em]">Pendapat Aris</span>“Bagian itu kubus karena kelihatannya seperti kotak.”</blockquote>
            <blockquote className="rounded-xl border border-[#B8DDFB] bg-[#EEF7FF] p-3 text-sm leading-relaxed text-[#24527B]"><span className="mb-1 block text-[11px] font-black uppercase tracking-[0.1em]">Pendapat Ara</span>“Saya perlu melihat karakteristik sisi, rusuk, dan titik sudutnya sebelum menyimpulkan bahwa bentuk tersebut merupakan kubus.”</blockquote>
          </div>
          <ChoiceAnswer name="strongerEvidence" label="Pendapat mana yang didukung bukti matematis lebih kuat?" value={progress.choices.strongerEvidence ?? ''} onChange={(value) => updateChoice('strongerEvidence', value)} options={[{ value: 'aris', label: 'Aris' }, { value: 'ara', label: 'Ara' }, { value: 'same', label: 'Keduanya sama' }]} />
          <TextArea label="Jelaskan alasanmu." value={progress.answers.evidenceReason ?? ''} onChange={(value) => updateAnswer('evidenceReason', value)} />
          <Principle> Kemiripan visual dapat menjadi dugaan awal, tetapi kesimpulan matematika membutuhkan bukti.</Principle>
        </ActivitySection>

        <ActivitySection number={4} title="Pecahkan Masalah Numerasi">
          <p className="rounded-xl bg-[#EEF7FF] p-3 text-sm leading-relaxed text-[#24527B]">Dalam model AR, salah satu bagian Candi Jawi direpresentasikan sebagai balok dengan ukuran panjang 8 satuan, lebar 6 satuan, dan tinggi 5 satuan.</p>
          <blockquote className="rounded-xl border border-[#DCE8F4] bg-white p-3 text-sm leading-relaxed text-[#536782]">Kak Najwa mengatakan: “Jika bagian tersebut dianggap sebagai balok, volumenya adalah 240 satuan kubik.”</blockquote>
          <ChoiceAnswer name="najwaStatement" label="Apakah pernyataan Kak Najwa benar?" value={progress.choices.najwaStatement ?? ''} onChange={(value) => updateChoice('najwaStatement', value)} options={[{ value: 'true', label: 'Benar' }, { value: 'false', label: 'Salah' }, { value: 'unknown', label: 'Belum dapat ditentukan' }]} />
          <TextArea label="Rumus" value={progress.answers.volumeFormula ?? ''} onChange={(value) => updateAnswer('volumeFormula', value)} rows={2} />
          <TextArea label="Perhitungan" value={progress.answers.volumeCalculation ?? ''} onChange={(value) => updateAnswer('volumeCalculation', value)} rows={5} />
          <TextArea label="Kesimpulan" value={progress.answers.volumeConclusion ?? ''} onChange={(value) => updateAnswer('volumeConclusion', value)} rows={3} />
        </ActivitySection>

        <ActivitySection number={5} title="Jangan Langsung Percaya pada AI">
          <blockquote className="rounded-xl border border-[#E6D9FF] bg-[#F5F0FF] p-3 text-sm leading-relaxed text-[#513D78]"><span className="mb-1 block text-[11px] font-black uppercase tracking-[0.1em]">Jawaban AI</span>“Volume balok tersebut adalah 190 satuan kubik.”</blockquote>
          <ChoiceAnswer name="aiResponse" label="Apa yang sebaiknya kamu lakukan?" value={progress.choices.aiResponse ?? ''} onChange={(value) => updateChoice('aiResponse', value)} options={[
            { value: 'trust-ai', label: 'Mengikuti jawaban AI karena AI pasti benar.' },
            { value: 'trust-self', label: 'Mengikuti hasil hitung sendiri tanpa memeriksa kembali.' },
            { value: 'verify', label: 'Memeriksa kembali data, rumus, proses perhitungan, dan jawaban AI.' },
            { value: 'favorite', label: 'Memilih jawaban yang paling disukai.' },
          ]} />
          <TextArea label="Jelaskan alasan pilihanmu." value={progress.answers.aiEvaluationReason ?? ''} onChange={(value) => updateAnswer('aiEvaluationReason', value)} />
          <p className="rounded-xl bg-[#FFF4D7] p-3 text-sm leading-relaxed text-[#76540B]">Informasi dari AI dapat membantu, tetapi tetap perlu diperiksa dan diverifikasi.</p>
        </ActivitySection>

        <ActivitySection number={6} title="Bandingkan Dua Strategi">
          <div className="grid gap-3 sm:grid-cols-2">
            <blockquote className="rounded-xl border border-[#B8DDFB] bg-[#EEF7FF] p-3 text-sm leading-relaxed text-[#24527B]"><span className="mb-1 block text-[11px] font-black uppercase tracking-[0.1em]">Aris</span>Volume = panjang × lebar × tinggi = 8 × 6 × 5 = 240 satuan³</blockquote>
            <blockquote className="rounded-xl border border-[#F1D78B] bg-[#FFF8E6] p-3 text-sm leading-relaxed text-[#76540B]"><span className="mb-1 block text-[11px] font-black uppercase tracking-[0.1em]">Ara</span>Volume = panjang + lebar + tinggi = 8 + 6 + 5 = 19 satuan³</blockquote>
          </div>
          <TextArea label="Strategi mana yang tepat? Mengapa?" value={progress.answers.strategyChoice ?? ''} onChange={(value) => updateAnswer('strategyChoice', value)} />
          <TextArea label="Apa kesalahan pada strategi yang tidak tepat?" value={progress.answers.strategyError ?? ''} onChange={(value) => updateAnswer('strategyError', value)} />
          <TextArea label="Bagaimana kamu membuktikannya?" value={progress.answers.strategyProof ?? ''} onChange={(value) => updateAnswer('strategyProof', value)} />
        </ActivitySection>

        <ActivitySection number={7} title="Hubungkan dengan Konteks Candi Jawi">
          <p className="text-sm leading-relaxed text-[#536782]">Bangun ruang matematika merupakan model ideal. Bagian arsitektur Candi Jawi dapat direpresentasikan dengan bangun ruang tertentu berdasarkan karakteristik yang diamati.</p>
          <ChoiceAnswer name="idealShape" label="Apakah bagian Candi Jawi yang kamu amati benar-benar merupakan bangun ruang ideal yang sempurna?" value={progress.choices.idealShape ?? ''} onChange={(value) => updateChoice('idealShape', value)} options={[{ value: 'yes', label: 'Ya' }, { value: 'no', label: 'Tidak' }, { value: 'close', label: 'Mendekati bentuk tersebut' }]} />
          <TextArea label="Jelaskan alasanmu berdasarkan bukti." value={progress.answers.modelReason ?? ''} onChange={(value) => updateAnswer('modelReason', value)} />
        </ActivitySection>

        <ActivitySection number={8} title="Buat Keputusan Akhir: Klaim – Bukti – Alasan">
          <p className="text-sm leading-relaxed text-[#536782]">Susun kesimpulanmu menggunakan pola berikut.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[16px] border border-[#B8DDFB] bg-[#EEF7FF] p-3"><p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#2D83E8]">KLAIM</p><TextArea label="Bagian Candi Jawi tersebut dapat direpresentasikan sebagai..." value={progress.answers.claim ?? ''} onChange={(value) => updateAnswer('claim', value)} rows={4} /></div>
            <div className="rounded-[16px] border border-[#BFE7CF] bg-[#EFF9F2] p-3"><p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#2D8051]">BUKTI</p><TextArea label="Saya menemukan bahwa..." value={progress.answers.evidence ?? ''} onChange={(value) => updateAnswer('evidence', value)} rows={4} /><TextArea label="Bukti kedua (jika diperlukan)" value={progress.answers.evidenceSecond ?? ''} onChange={(value) => updateAnswer('evidenceSecond', value)} rows={3} /></div>
            <div className="rounded-[16px] border border-[#F1D78B] bg-[#FFF8E6] p-3"><p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#A77A12]">ALASAN</p><TextArea label="Bukti tersebut mendukung jawaban saya karena..." value={progress.answers.reason ?? ''} onChange={(value) => updateAnswer('reason', value)} rows={4} /></div>
          </div>
        </ActivitySection>

        <ActivitySection number={9} title="Cek Kualitas Solusimu">
          <fieldset>
            <legend className="text-sm leading-relaxed text-[#536782]">Periksa kembali proses dan jawabanmu.</legend>
            <div className="mt-3 space-y-2">{checklistItems.map(([key, label]) => <label key={key} className="flex min-h-12 items-center gap-3 rounded-xl border border-[#DCE8F4] bg-white px-3 py-2 text-sm leading-snug text-[#536782]"><input type="checkbox" checked={progress.checklist[key] === true} onChange={(event) => updateChecklist(key, event.target.checked)} className="h-5 w-5 shrink-0 accent-[#1685EE]" />{label}</label>)}</div>
          </fieldset>
        </ActivitySection>

        <section className="mt-4 rounded-[18px] border border-[#BFE7CF] bg-[#EFF9F2] p-4" aria-labelledby="mystery-solved">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#2D8051]">Misteri Terpecahkan!</p>
          <h2 id="mystery-solved" className="mt-1 text-lg font-extrabold">Penalaranmu sudah membawa bukti menjadi solusi.</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#426650]">Kamu telah menggunakan pengamatan, teknologi, informasi, perhitungan, bukti, dan penalaran untuk menyelesaikan masalah. Selanjutnya, gunakan pengetahuan tersebut untuk menghasilkan solusi atau karya baru.</p>
          <button type="button" onClick={handleContinue} disabled={saveState === 'saving'} className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#1685EE] px-4 text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(22,133,238,0.2)] transition hover:bg-[#1479d4] disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2D83E8]/30">
            LANJUT KE TAHAP 5 – KREASI SOLUSI <span aria-hidden="true" className="ml-2 text-lg">›</span>
          </button>
        </section>
      </div>
    </main>
  );
}

function ActivitySection({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <section data-analysis-activity={number} className="mt-4 rounded-[18px] border border-[#DCE8F4] bg-white p-4 shadow-[0_6px_18px_rgba(32,83,143,0.06)]" aria-labelledby={`activity-${number}`}>
      <h2 id={`activity-${number}`} className="mb-3 flex items-start gap-2 text-base font-extrabold leading-snug"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#DDF5E6] text-sm text-[#2D8051]">{number}</span><span>{number}. {title}</span></h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-xs font-bold text-[#536782]">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-[#C7D8E9] bg-white px-3 text-sm font-normal text-[#102F5B] outline-none focus:border-[#1685EE] focus:ring-4 focus:ring-[#1685EE]/15" /></label>;
}

function TextArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return <label className="block text-sm font-bold text-[#102F5B]">{label}<textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full resize-y rounded-xl border border-[#C7D8E9] bg-white px-3 py-2 text-sm font-normal leading-relaxed text-[#102F5B] outline-none focus:border-[#1685EE] focus:ring-4 focus:ring-[#1685EE]/15" /></label>;
}

function ChoiceAnswer({ name, label, value, onChange, options }: { name: string; label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <fieldset>
      <legend className="text-sm font-bold leading-relaxed text-[#102F5B]">{label}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">{options.map((option) => <label key={option.value} className="flex min-h-11 items-start gap-3 rounded-xl border border-[#DCE8F4] px-3 py-2 text-sm leading-snug text-[#536782]"><input type="radio" name={`analysis-${name}`} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#1685EE]" /><span>{option.label}</span></label>)}</div>
    </fieldset>
  );
}

function ShapeEvidenceCard({ shape, value, onChange }: { shape: string; value: ShapeEvidence; onChange: (key: keyof ShapeEvidence, value: string) => void }) {
  return (
    <div className="rounded-xl border border-[#DCE8F4] bg-[#F8FBFF] p-3">
      <h3 className="mb-2 text-sm font-extrabold text-[#24527B]">{shape}</h3>
      <div className="space-y-3"><LabeledInput label="Bentuk sisi/alas" value={value.sidesOrBase} onChange={(text) => onChange('sidesOrBase', text)} /><LabeledInput label="Jumlah sisi" value={value.sideCount} onChange={(text) => onChange('sideCount', text)} /><LabeledInput label="Jumlah rusuk" value={value.edgeCount} onChange={(text) => onChange('edgeCount', text)} /><LabeledInput label="Titik sudut" value={value.vertexCount} onChange={(text) => onChange('vertexCount', text)} /><LabeledInput label="Bagian Candi" value={value.templePart} onChange={(text) => onChange('templePart', text)} /></div>
    </div>
  );
}

function Principle({ children }: { children: ReactNode }) {
  return <div className="rounded-[16px] bg-[#DDF5E6] p-4"><p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#2D8051]">Prinsip CINARAI</p><p className="mt-1 text-sm font-extrabold leading-relaxed text-[#245B3C]">{children}</p></div>;
}