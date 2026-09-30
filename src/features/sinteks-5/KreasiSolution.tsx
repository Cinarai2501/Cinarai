'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { loadComicProgress, saveComicProgress, type ComicProgressStageData } from '@/services/comicProgress';
import DrawingCanvas from '@/features/quiz/komik-6/components/DrawingCanvas';

type KreasiProgress = NonNullable<ComicProgressStageData['kreasiSolusi']>;
type PartPosition = 'bottom' | 'middle' | 'top' | 'other';
type PartDetail = KreasiProgress['partDetails'][string];
type Improvement = KreasiProgress['improvements'][string];
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const partLabels: Record<PartPosition, string> = {
  bottom: 'Bagian bawah',
  middle: 'Bagian tengah',
  top: 'Bagian atas',
  other: 'Bagian lainnya',
};

const shapes = ['Kubus', 'Balok', 'Prisma', 'Limas', 'Kerucut'];
const improvementRows = [
  ['shape', 'Bentuk'],
  ['size', 'Ukuran'],
  ['arrangement', 'Susunan bangun ruang'],
  ['calculation', 'Perhitungan'],
] as const;
const qualityItems = [
  ['threeShapes', 'Saya menggunakan minimal tiga bangun ruang.'],
  ['shapeReason', 'Saya dapat menjelaskan alasan pemilihan bentuk.'],
  ['logicalSize', 'Saya menentukan ukuran secara logis.'],
  ['mathCalculation', 'Saya menggunakan perhitungan matematika.'],
  ['checkResult', 'Saya memeriksa apakah hasil perhitungan masuk akal.'],
  ['evaluateAi', 'Saya mengevaluasi saran AI sebelum menggunakannya.'],
  ['evidenceRevision', 'Saya memperbaiki rancangan berdasarkan bukti.'],
  ['templeConnection', 'Karya saya tetap menunjukkan hubungan dengan Candi Jawi.'],
  ['defendSolution', 'Saya dapat mempertahankan solusi dengan alasan matematis.'],
] as const;

const emptyPart = (): PartDetail => ({ shape: '', reason: '', size: '' });
const emptyImprovement = (): Improvement => ({ initial: '', revision: '', reason: '' });

const initialProgress: KreasiProgress = {
  openedActivities: [],
  answers: {},
  selectedShapes: [],
  partDetails: Object.fromEntries(Object.keys(partLabels).map((key) => [key, emptyPart()])),
  dimensions: { length: '', width: '', height: '' },
  proportionChoice: '',
  sketchDataUrl: '',
  volume: { shape: '', dimensions: '', formula: '', calculation: '', result: '' },
  volumePlausible: '',
  aiResponse: '',
  aiDecision: '',
  aiAccepted: '',
  aiRejected: '',
  aiReason: '',
  improvements: Object.fromEntries(improvementRows.map(([key]) => [key, emptyImprovement()])),
  checklist: {},
  completed: false,
};

function restoreProgress(stored?: Partial<KreasiProgress>): KreasiProgress {
  if (!stored) return initialProgress;
  return {
    ...initialProgress,
    ...stored,
    openedActivities: Array.isArray(stored.openedActivities) ? stored.openedActivities : [],
    answers: stored.answers ?? {},
    selectedShapes: Array.isArray(stored.selectedShapes) ? stored.selectedShapes : [],
    partDetails: Object.fromEntries(Object.keys(partLabels).map((key) => [
      key,
      { ...emptyPart(), ...stored.partDetails?.[key] },
    ])),
    dimensions: { ...initialProgress.dimensions, ...stored.dimensions },
    volume: { ...initialProgress.volume, ...stored.volume },
    improvements: Object.fromEntries(improvementRows.map(([key]) => [
      key,
      { ...emptyImprovement(), ...stored.improvements?.[key] },
    ])),
    checklist: stored.checklist ?? {},
    completed: stored.completed === true,
  };
}

export default function KreasiSolution() {
  const { user } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState<KreasiProgress>(initialProgress);
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [completionAttempted, setCompletionAttempted] = useState(false);
  const progressRef = useRef(progress);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    setHydratedUserId(null);
    setLoadFailed(false);
    void loadComicProgress(user.uid, 1)
      .then((document) => {
        if (!active) return;
        const restored = restoreProgress(document?.stageData?.kreasiSolusi);
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

  const persistProgress = useCallback((value: KreasiProgress) => {
    if (!user?.uid) return Promise.reject(new Error('Login diperlukan untuk menyimpan jawaban.'));
    setSaveState('saving');
    const write = saveQueueRef.current
      .catch(() => undefined)
      .then(() => saveComicProgress(user.uid, 1, { stageData: { kreasiSolusi: value } }));
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
    }, 600);
    return () => window.clearTimeout(timeout);
  }, [hydratedUserId, loadFailed, persistProgress, progress, user?.uid]);

  useEffect(() => {
    if (hydratedUserId !== user?.uid || loadFailed) return;
    const sections = document.querySelectorAll<HTMLElement>('[data-creation-activity]');
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => Number((entry.target as HTMLElement).dataset.creationActivity))
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

  const updateProgress = (update: (current: KreasiProgress) => KreasiProgress) => {
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

  const updatePart = (part: PartPosition, key: keyof PartDetail, value: string) => updateProgress((current) => ({
    ...current,
    partDetails: { ...current.partDetails, [part]: { ...current.partDetails[part], [key]: value } },
  }));

  const updateImprovement = (category: string, key: keyof Improvement, value: string) => updateProgress((current) => ({
    ...current,
    improvements: { ...current.improvements, [category]: { ...current.improvements[category], [key]: value } },
  }));

  const handleReturnHome = async () => {
    try {
      await persistProgress(progressRef.current);
      router.push('/dashboard/siswa/home');
    } catch {
      return;
    }
  };

  const askAiTutor = async () => {
    const selected = progressRef.current.selectedShapes;
    if (selected.length < 3) {
      setAiError('Pilih minimal 3 bangun ruang sebelum meminta masukan AI.');
      return;
    }
    setAiLoading(true);
    setAiError('');
    const question = `Saya merancang miniatur yang terinspirasi Candi Jawi menggunakan ${selected[0]}, ${selected[1]}, dan ${selected[2]}. Menurutmu, bagian apa yang perlu saya periksa agar rancangan saya lebih tepat secara matematis?`;
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          context: {
            moduleName: 'Sinteks 5 – Kreasi Solusi',
            comicTitle: 'Candi Jawi',
            learningStage: 'Kreasi Solusi',
            objectInfo: {
              location: 'Candi Jawi',
              classLevel: 'SD',
              synopsis: 'Siswa merancang miniatur terinspirasi Candi Jawi dengan kombinasi bangun ruang, ukuran matematis, dan alasan budaya.',
              learningTargets: ['Bangun ruang', 'Ukuran dan volume', 'Penalaran matematis', 'Budaya Candi Jawi'],
            },
            identification: selected,
            observationAnswers: {},
            knowledgeContext: 'Berikan masukan berupa hal yang perlu diperiksa, bukan rancangan jadi. Jangan mengubah rancangan siswa atau memilihkan ukuran dan bentuk. Dorong siswa memeriksa bukti, proporsi, perhitungan, fungsi bagian, dan hubungan dengan Candi Jawi. Keputusan tetap pada siswa.',
          },
        }),
      });
      const payload = await response.json() as { answer?: string; error?: string };
      if (!response.ok || !payload.answer?.trim()) throw new Error(payload.error ?? 'Masukan AI belum tersedia.');
      updateProgress((current) => ({ ...current, aiResponse: payload.answer!.trim() }));
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Masukan AI belum tersedia. Coba lagi.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleContinue = async () => {
    setCompletionAttempted(true);
    if (progressRef.current.selectedShapes.length < 3) {
      document.getElementById('creation-activity-2')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const completed = { ...progressRef.current, completed: true };
    progressRef.current = completed;
    setProgress(completed);
    try {
      await persistProgress(completed);
      router.push('/comic/1/learn?stage=Introspection');
    } catch {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  };

  const saveLabel = saveState === 'saving'
    ? 'Menyimpan jawaban...'
    : saveState === 'saved'
      ? 'Jawaban tersimpan'
      : saveState === 'error'
        ? 'Belum tersimpan. Periksa koneksi lalu coba lagi.'
        : 'Jawaban tersimpan otomatis';

  if (hydratedUserId !== user?.uid || !user?.uid) {
    return <main className="min-h-[60dvh] px-4 py-10 text-center text-sm font-semibold text-[#536782]" aria-live="polite">Memuat aktivitas dan jawabanmu...</main>;
  }

  if (loadFailed) {
    return <main className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-5 text-center"><p className="text-base font-extrabold text-[#102F5B]">Jawabanmu belum dapat dimuat.</p><p className="max-w-sm text-sm leading-relaxed text-[#536782]">Periksa koneksi internet, lalu muat ulang agar jawaban yang tersimpan tidak tertimpa.</p><button type="button" onClick={() => window.location.reload()} className="mt-2 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1685EE] px-4 text-sm font-bold text-white">Muat ulang</button></main>;
  }

  return (
    <main className="min-h-[calc(100dvh-88px)] bg-[#F5F9FF] px-4 pb-[calc(108px+env(safe-area-inset-bottom))] pt-4 text-[#102F5B] sm:px-5">
      <div className="mx-auto w-full max-w-[760px]">
        <header className="mb-4">
          <button type="button" onClick={handleReturnHome} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-bold text-[#1685EE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2D83E8]/30"><span aria-hidden="true" className="text-xl">←</span> Kembali</button>
          <div className="mt-2 rounded-[20px] bg-[#EAE1FF] p-4 sm:p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7548D8]">TAHAP 5</p>
            <h1 className="mt-1 text-[22px] font-extrabold leading-tight">KREASI SOLUSI</h1>
            <p className="mt-1 text-xs font-semibold text-[#536782]">CINARAI – Critical Numeracy with AR &amp; AI</p>
            <p className="mt-2 text-sm font-bold text-[#102F5B]">Dari Candi Jawi, Ciptakan Karyamu!</p>
          </div>
          <div className="mt-3 flex items-center gap-3" aria-live="polite">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#DCE6F1]" role="progressbar" aria-label="Aktivitas yang sudah dibuka" aria-valuemin={0} aria-valuemax={10} aria-valuenow={progress.openedActivities.length}><div className="h-full rounded-full bg-[#0DBF7E] transition-[width]" style={{ width: `${(progress.openedActivities.length / 10) * 100}%` }} /></div>
            <span className="shrink-0 text-[11px] font-bold text-[#536782]">{progress.openedActivities.length}/10 aktivitas</span>
          </div>
          <p className="mt-1 min-h-4 text-[10px] font-semibold text-[#71819A]" aria-live="polite">{saveLabel}</p>
        </header>

        <section className="rounded-[18px] border border-[#DCE8F4] bg-white p-4 shadow-[0_6px_18px_rgba(32,83,143,0.06)]" aria-labelledby="creation-goal">
          <h2 id="creation-goal" className="text-sm font-extrabold">Tujuan Tahap</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#536782]">Menggunakan hasil analisis untuk merancang solusi atau produk matematis yang terinspirasi Candi Jawi, menerapkan konsep bangun ruang dan ukuran, memanfaatkan AI sebagai mitra pemberi masukan, mengevaluasi saran, memperbaiki rancangan, serta mempertahankan solusi dengan alasan matematis.</p>
        </section>

        <section className="mt-4 rounded-[18px] border border-[#DCE8F4] bg-white p-4 shadow-[0_6px_18px_rgba(32,83,143,0.06)]">
          <h2 className="text-base font-extrabold">Saatnya Menjadi Perancang!</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#536782]">Kamu telah berhasil mengidentifikasi dan menganalisis berbagai bentuk bangun ruang pada Candi Jawi. Sekarang kamu tidak lagi hanya menemukan dan menganalisis matematika, tetapi menggunakan matematika untuk menciptakan sebuah solusi.</p>
          <div className="mt-4 rounded-[16px] bg-[#102F5B] p-4 text-white"><p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#A9D8FF]">MISI UTAMA</p><p className="mt-2 text-base font-extrabold leading-snug">Bagaimana kamu dapat merancang sebuah model bangunan yang terinspirasi Candi Jawi dengan menggunakan kombinasi bangun ruang secara tepat?</p></div>
        </section>

        <section className="mt-4 rounded-[18px] border border-[#F1D78B] bg-[#FFF8E6] p-4" aria-labelledby="creation-mission">
          <h2 id="creation-mission" className="text-base font-extrabold text-[#76540B]">Misi Kreasi</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#76540B]">Bayangkan sekolahmu akan mengadakan Pameran Matematika dan Budaya. Kelasmu mendapat tugas membuat rancangan miniatur bangunan yang terinspirasi Candi Jawi.</p>
          <p className="mt-3 rounded-xl bg-white/70 p-3 text-sm leading-relaxed text-[#76540B]">Gunakan pengamatan dan bukti kontekstual dari eksplorasi AR pada tahap sebelumnya sebagai bahan untuk merancang.</p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#76540B]">
            {['Terinspirasi dari bentuk Candi Jawi.', 'Menggunakan sedikitnya 3 jenis bangun ruang.', 'Memiliki ukuran yang dapat dijelaskan secara matematis.', 'Menggunakan bentuk secara masuk akal sesuai fungsinya.', 'Disertai alasan pemilihan bentuk.', 'Menunjukkan hubungan matematika dan budaya.'].map((requirement) => <li key={requirement} className="flex gap-2"><span aria-hidden="true" className="font-black text-[#2D8051]">✓</span><span>{requirement}</span></li>)}
          </ul>
        </section>

        <ActivitySection number={1} title="Tentukan Ide Solusimu">
          <TextArea label="Nama rancangan:" value={progress.answers.designName ?? ''} onChange={(value) => updateAnswer('designName', value)} rows={2} />
          <TextArea label="Apa yang akan kamu buat?" value={progress.answers.solutionIdea ?? ''} onChange={(value) => updateAnswer('solutionIdea', value)} />
          <TextArea label="Bagian Candi Jawi apa yang menginspirasimu?" value={progress.answers.inspirationPart ?? ''} onChange={(value) => updateAnswer('inspirationPart', value)} />
          <TextArea label="Mengapa kamu memilih bagian tersebut?" value={progress.answers.inspirationReason ?? ''} onChange={(value) => updateAnswer('inspirationReason', value)} />
        </ActivitySection>

        <ActivitySection number={2} title="Pilih Bangun Ruang" id="creation-activity-2">
          <fieldset>
            <legend className="text-sm leading-relaxed text-[#536782]">Pilih sedikitnya tiga bangun ruang yang akan digunakan:</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">{shapes.map((shape) => <label key={shape} className="flex min-h-12 items-center gap-3 rounded-xl border border-[#DCE8F4] px-3 py-2 text-sm font-semibold text-[#536782]"><input type="checkbox" checked={progress.selectedShapes.includes(shape)} onChange={(event) => updateProgress((current) => ({ ...current, selectedShapes: event.target.checked ? [...current.selectedShapes, shape] : current.selectedShapes.filter((item) => item !== shape) }))} className="h-5 w-5 accent-[#1685EE]" />{shape}</label>)}</div>
          </fieldset>
          {progress.selectedShapes.length < 3 && <p role="status" className="rounded-xl bg-[#EEF7FF] p-3 text-sm font-semibold text-[#24527B]">Pilih minimal 3 bangun ruang untuk melanjutkan misi.</p>}
          <div className="hidden overflow-x-auto rounded-xl border border-[#DCE8F4] md:block">
            <table className="w-full min-w-[720px] text-left text-xs"><thead className="bg-[#EEF7FF] text-[#24527B]"><tr>{['Bagian Rancangan', 'Bangun Ruang', 'Alasan Pemilihan', 'Ukuran yang Dibutuhkan'].map((heading) => <th key={heading} className="p-2 font-extrabold">{heading}</th>)}</tr></thead><tbody>{(Object.keys(partLabels) as PartPosition[]).map((part) => <tr key={part} className="border-t border-[#DCE8F4]"><th className="p-2 font-extrabold">{partLabels[part]}</th><td className="p-2"><input aria-label={`${partLabels[part]}: Bangun Ruang`} value={progress.partDetails[part].shape} onChange={(event) => updatePart(part, 'shape', event.target.value)} className="min-h-11 w-full min-w-[120px] rounded-lg border border-[#C7D8E9] px-2 text-sm outline-none focus:border-[#1685EE] focus:ring-4 focus:ring-[#1685EE]/15" /></td><td className="p-2"><input aria-label={`${partLabels[part]}: Alasan Pemilihan`} value={progress.partDetails[part].reason} onChange={(event) => updatePart(part, 'reason', event.target.value)} className="min-h-11 w-full min-w-[170px] rounded-lg border border-[#C7D8E9] px-2 text-sm outline-none focus:border-[#1685EE] focus:ring-4 focus:ring-[#1685EE]/15" /></td><td className="p-2"><input aria-label={`${partLabels[part]}: Ukuran yang Dibutuhkan`} value={progress.partDetails[part].size} onChange={(event) => updatePart(part, 'size', event.target.value)} className="min-h-11 w-full min-w-[150px] rounded-lg border border-[#C7D8E9] px-2 text-sm outline-none focus:border-[#1685EE] focus:ring-4 focus:ring-[#1685EE]/15" /></td></tr>)}</tbody></table>
          </div>
          <div className="space-y-3 md:hidden">{(Object.keys(partLabels) as PartPosition[]).map((part) => <div key={part} className="rounded-xl border border-[#DCE8F4] bg-[#F8FBFF] p-3"><h3 className="mb-2 text-sm font-extrabold text-[#24527B]">{partLabels[part]}</h3><div className="space-y-3"><LabeledInput label="Bangun Ruang" value={progress.partDetails[part].shape} onChange={(value) => updatePart(part, 'shape', value)} /><LabeledInput label="Alasan Pemilihan" value={progress.partDetails[part].reason} onChange={(value) => updatePart(part, 'reason', value)} /><LabeledInput label="Ukuran yang Dibutuhkan" value={progress.partDetails[part].size} onChange={(value) => updatePart(part, 'size', value)} /></div></div>)}</div>
        </ActivitySection>

        <ActivitySection number={3} title="Tentukan Ukuran">
          <div className="grid gap-3 sm:grid-cols-3">
            <PositiveNumberInput label="Panjang model" value={progress.dimensions.length} onChange={(value) => updateProgress((current) => ({ ...current, dimensions: { ...current.dimensions, length: value } }))} />
            <PositiveNumberInput label="Lebar model" value={progress.dimensions.width} onChange={(value) => updateProgress((current) => ({ ...current, dimensions: { ...current.dimensions, width: value } }))} />
            <PositiveNumberInput label="Tinggi model" value={progress.dimensions.height} onChange={(value) => updateProgress((current) => ({ ...current, dimensions: { ...current.dimensions, height: value } }))} />
          </div>
          <TextArea label="Mengapa kamu memilih ukuran tersebut?" value={progress.answers.dimensionReason ?? ''} onChange={(value) => updateAnswer('dimensionReason', value)} />
          <ChoiceAnswer name="proportion" label="Apakah ukuran setiap bagian sudah proporsional?" value={progress.proportionChoice} onChange={(value) => updateProgress((current) => ({ ...current, proportionChoice: value }))} options={['Ya', 'Belum', 'Perlu diperbaiki']} />
          <TextArea label="Bagaimana kamu mengetahuinya?" value={progress.answers.proportionReason ?? ''} onChange={(value) => updateAnswer('proportionReason', value)} />
        </ActivitySection>

        <ActivitySection number={4} title="Buat Sketsa Solusimu">
          <p className="text-sm leading-relaxed text-[#536782]">Gambarkan rancanganmu. Berikan label pada:</p>
          <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-[#536782]"><li>bangun ruang yang digunakan,</li><li>ukuran setiap bagian,</li><li>bagian yang terinspirasi Candi Jawi.</li></ol>
          <DrawingCanvas initialImage={progress.sketchDataUrl} onChange={(sketchDataUrl) => updateProgress((current) => ({ ...current, sketchDataUrl }))} />
          <p className="text-xs font-semibold text-[#71819A]">Sketsa disimpan bersama progress belajarmu.</p>
        </ActivitySection>

        <ActivitySection number={5} title="Uji Rancanganmu">
          <p className="text-sm leading-relaxed text-[#536782]">Pilih salah satu bagian rancangan yang dapat dihitung volumenya.</p>
          <LabeledInput label="Bangun ruang yang dipilih:" value={progress.volume.shape} onChange={(value) => updateProgress((current) => ({ ...current, volume: { ...current.volume, shape: value } }))} />
          <LabeledInput label="Ukuran:" value={progress.volume.dimensions} onChange={(value) => updateProgress((current) => ({ ...current, volume: { ...current.volume, dimensions: value } }))} />
          <LabeledInput label="Rumus yang digunakan:" value={progress.volume.formula} onChange={(value) => updateProgress((current) => ({ ...current, volume: { ...current.volume, formula: value } }))} />
          <TextArea label="Perhitungan:" value={progress.volume.calculation} onChange={(value) => updateProgress((current) => ({ ...current, volume: { ...current.volume, calculation: value } }))} rows={5} />
          <PositiveNumberInput label="Volume" suffix="cm³" value={progress.volume.result} onChange={(value) => updateProgress((current) => ({ ...current, volume: { ...current.volume, result: value } }))} />
          <ChoiceAnswer name="volume-plausibility" label="Apakah hasil perhitungan masuk akal jika dibandingkan dengan ukuran modelmu?" value={progress.volumePlausible} onChange={(value) => updateProgress((current) => ({ ...current, volumePlausible: value }))} options={['Ya', 'Tidak', 'Saya perlu memeriksa kembali']} />
          <TextArea label="Jelaskan alasanmu." value={progress.answers.volumeReason ?? ''} onChange={(value) => updateAnswer('volumeReason', value)} />
        </ActivitySection>

        <ActivitySection number={6} title="Gunakan AI sebagai Mitra Berpikir">
          <p className="text-sm leading-relaxed text-[#536782]">Pertanyaan yang dapat kamu berikan kepada AI:</p>
          <blockquote className="rounded-xl border border-[#B8DDFB] bg-[#EEF7FF] p-3 text-sm leading-relaxed text-[#24527B]">«&quot;Saya merancang miniatur yang terinspirasi Candi Jawi menggunakan ______, ______, dan ______. Menurutmu, bagian apa yang perlu saya periksa agar rancangan saya lebih tepat secara matematis?&quot;»</blockquote>
          <button type="button" onClick={() => void askAiTutor()} disabled={aiLoading} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1685EE] px-4 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">{aiLoading ? 'Meminta masukan...' : 'Minta masukan AI Tutor'}</button>
          {aiError && <p role="alert" className="text-sm font-semibold text-[#9B3B29]">{aiError}</p>}
          {progress.aiResponse && <div className="rounded-xl border border-[#DCE8F4] bg-[#F8FBFF] p-3"><p className="text-xs font-extrabold uppercase text-[#24527B]">Masukan AI Tutor</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#536782]">{progress.aiResponse}</p></div>}
          <TextArea label="Catat saran AI:" value={progress.answers.aiNotes ?? ''} onChange={(value) => updateAnswer('aiNotes', value)} />
          <ChoiceAnswer name="ai-decision" label="Apakah semua saran AI akan kamu gunakan?" value={progress.aiDecision} onChange={(value) => updateProgress((current) => ({ ...current, aiDecision: value }))} options={['Ya', 'Tidak', 'Sebagian']} />
          <TextArea label="Saran AI yang saya gunakan:" value={progress.aiAccepted} onChange={(value) => updateProgress((current) => ({ ...current, aiAccepted: value }))} />
          <TextArea label="Saran AI yang tidak saya gunakan:" value={progress.aiRejected} onChange={(value) => updateProgress((current) => ({ ...current, aiRejected: value }))} />
          <TextArea label="Alasan saya:" value={progress.aiReason} onChange={(value) => updateProgress((current) => ({ ...current, aiReason: value }))} />
          <div className="rounded-[16px] bg-[#DDF5E6] p-4"><p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#2D8051]">Prinsip CINARAI</p><p className="mt-1 text-sm font-extrabold leading-relaxed text-[#245B3C]">AI dapat memberikan saran. Kamu yang menentukan keputusan.</p></div>
        </ActivitySection>

        <ActivitySection number={7} title="Perbaiki Solusimu">
          <p className="text-sm leading-relaxed text-[#536782]">Perubahan didasarkan pada evaluasi dan bukti, bukan sekadar mengganti desain secara acak.</p>
          <div className="hidden overflow-x-auto rounded-xl border border-[#DCE8F4] md:block"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-[#EEF7FF] text-[#24527B]"><tr>{['Yang Diperiksa', 'Rancangan Awal', 'Perbaikan', 'Alasan Perbaikan'].map((heading) => <th key={heading} className="p-2 font-extrabold">{heading}</th>)}</tr></thead><tbody>{improvementRows.map(([key, label]) => <tr key={key} className="border-t border-[#DCE8F4]"><th className="p-2 font-extrabold">{label}</th>{(['initial', 'revision', 'reason'] as const).map((field) => <td key={field} className="p-2"><input aria-label={`${label}: ${field}`} value={progress.improvements[key][field]} onChange={(event) => updateImprovement(key, field, event.target.value)} className="min-h-11 w-full min-w-[150px] rounded-lg border border-[#C7D8E9] px-2 text-sm outline-none focus:border-[#1685EE] focus:ring-4 focus:ring-[#1685EE]/15" /></td>)}</tr>)}</tbody></table></div>
          <div className="space-y-3 md:hidden">{improvementRows.map(([key, label]) => <div key={key} className="rounded-xl border border-[#DCE8F4] bg-[#F8FBFF] p-3"><h3 className="mb-2 text-sm font-extrabold text-[#24527B]">{label}</h3><div className="space-y-3"><LabeledInput label="Rancangan Awal" value={progress.improvements[key].initial} onChange={(value) => updateImprovement(key, 'initial', value)} /><LabeledInput label="Perbaikan" value={progress.improvements[key].revision} onChange={(value) => updateImprovement(key, 'revision', value)} /><LabeledInput label="Alasan Perbaikan" value={progress.improvements[key].reason} onChange={(value) => updateImprovement(key, 'reason', value)} /></div></div>)}</div>
          <TextArea label="Apa perubahan terpenting yang kamu lakukan?" value={progress.answers.keyChange ?? ''} onChange={(value) => updateAnswer('keyChange', value)} />
          <TextArea label="Mengapa perubahan tersebut membuat solusi lebih baik?" value={progress.answers.changeReason ?? ''} onChange={(value) => updateAnswer('changeReason', value)} />
        </ActivitySection>

        <ActivitySection number={8} title="Jaga Hubungan dengan Budaya">
          <TextArea label="Bagian mana dari rancanganmu yang menunjukkan inspirasi Candi Jawi?" value={progress.answers.culturalInspiration ?? ''} onChange={(value) => updateAnswer('culturalInspiration', value)} />
          <TextArea label="Apa hubungan antara bentuk matematika yang kamu gunakan dengan arsitektur Candi Jawi?" value={progress.answers.mathCultureConnection ?? ''} onChange={(value) => updateAnswer('mathCultureConnection', value)} />
          <div className="rounded-xl bg-[#FFF8E6] p-3 text-center text-sm font-extrabold text-[#76540B]">Matematika ↔ Bangun Ruang ↔ Candi Jawi ↔ Budaya</div>
        </ActivitySection>

        <ActivitySection number={9} title="Pertahankan Solusimu">
          <p className="text-sm leading-relaxed text-[#536782]">Presentasikan hasil rancanganmu menggunakan pola:</p>
          <p className="rounded-xl bg-[#EEF7FF] p-3 text-center text-sm font-black text-[#24527B]">SOLUSI → BUKTI → ALASAN → MANFAAT</p>
          <ArgumentInput heading="SOLUSI" label="Solusi saya: Saya merancang __________________." value={progress.answers.defenseSolution ?? ''} onChange={(value) => updateAnswer('defenseSolution', value)} />
          <ArgumentInput heading="BUKTI MATEMATIS" label="Rancangan saya menggunakan __________________." value={progress.answers.defenseEvidence ?? ''} onChange={(value) => updateAnswer('defenseEvidence', value)} />
          <ArgumentInput heading="ALASAN" label="Saya memilih bentuk dan ukuran tersebut karena __________________." value={progress.answers.defenseReason ?? ''} onChange={(value) => updateAnswer('defenseReason', value)} />
          <ArgumentInput heading="HUBUNGAN DENGAN CANDI JAWI" label="Rancangan ini terinspirasi oleh __________________." value={progress.answers.defenseCulture ?? ''} onChange={(value) => updateAnswer('defenseCulture', value)} />
          <ArgumentInput heading="MANFAAT" label="Rancangan ini dapat digunakan untuk __________________." value={progress.answers.defenseBenefit ?? ''} onChange={(value) => updateAnswer('defenseBenefit', value)} />
        </ActivitySection>

        <ActivitySection number={10} title="Cek Kualitas Karyamu">
          <fieldset><legend className="text-sm leading-relaxed text-[#536782]">Periksa karyamu. Checklist ini merupakan penilaian dirimu sendiri.</legend><div className="mt-3 space-y-2">{qualityItems.map(([key, label]) => <label key={key} className="flex min-h-12 items-center gap-3 rounded-xl border border-[#DCE8F4] bg-white px-3 py-2 text-sm leading-snug text-[#536782]"><input type="checkbox" checked={progress.checklist[key] === true} onChange={(event) => updateProgress((current) => ({ ...current, checklist: { ...current.checklist, [key]: event.target.checked } }))} className="h-5 w-5 shrink-0 accent-[#1685EE]" />{label}</label>)}</div></fieldset>
        </ActivitySection>

        <section className="mt-4 rounded-[18px] border border-[#BFE7CF] bg-[#EFF9F2] p-4" aria-labelledby="creation-complete">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#2D8051]">Kreasi Berhasil!</p>
          <h2 id="creation-complete" className="mt-1 text-lg font-extrabold">Kreasi Berhasil!</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#426650]">Kamu tidak hanya berhasil menemukan matematika pada Candi Jawi. Kamu telah menggunakan budaya, matematika, AR, AI, dan penalaran untuk menghasilkan sebuah solusi baru.</p>
          {completionAttempted && progress.selectedShapes.length < 3 && <p role="status" className="mt-3 text-sm font-semibold text-[#24527B]">Pilih minimal 3 bangun ruang untuk melanjutkan misi.</p>}
          <button type="button" onClick={() => void handleContinue()} disabled={saveState === 'saving'} className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#1685EE] px-4 text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(22,133,238,0.2)] transition hover:bg-[#1479d4] disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2D83E8]/30">LANJUT KE TAHAP 6 – REFLEKSI <span aria-hidden="true" className="ml-2 text-lg">›</span></button>
        </section>
      </div>
    </main>
  );
}

function ActivitySection({ number, title, id, children }: { number: number; title: string; id?: string; children: ReactNode }) {
  return <section id={id} data-creation-activity={number} className="mt-4 rounded-[18px] border border-[#DCE8F4] bg-white p-4 shadow-[0_6px_18px_rgba(32,83,143,0.06)]" aria-labelledby={`creation-activity-title-${number}`}><h2 id={`creation-activity-title-${number}`} className="mb-3 flex items-start gap-2 text-base font-extrabold leading-snug"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#EAE1FF] text-sm text-[#7548D8]">{number}</span><span>{number}. {title}</span></h2><div className="space-y-3">{children}</div></section>;
}

function TextArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return <label className="block text-sm font-bold text-[#102F5B]">{label}<textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-[96px] w-full resize-y rounded-xl border border-[#C7D8E9] bg-white px-3 py-3 text-sm font-normal leading-relaxed text-[#102F5B] outline-none focus:border-[#1685EE] focus:ring-4 focus:ring-[#1685EE]/15" /></label>;
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-bold text-[#102F5B]">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-[#C7D8E9] bg-white px-3 text-sm font-normal text-[#102F5B] outline-none focus:border-[#1685EE] focus:ring-4 focus:ring-[#1685EE]/15" /></label>;
}

function PositiveNumberInput({ label, value, onChange, suffix }: { label: string; value: string; onChange: (value: string) => void; suffix?: string }) {
  const isInvalid = value !== '' && (!Number.isFinite(Number(value)) || Number(value) <= 0);
  return <label className="block text-sm font-bold text-[#102F5B]">{label}<div className="mt-2 flex min-h-11 items-center rounded-xl border border-[#C7D8E9] bg-white pr-3 focus-within:border-[#1685EE] focus-within:ring-4 focus-within:ring-[#1685EE]/15"><input type="number" min="0.01" step="any" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-xl bg-transparent px-3 text-sm font-normal text-[#102F5B] outline-none" />{suffix && <span className="text-sm font-semibold text-[#71819A]">{suffix}</span>}</div>{isInvalid && <span role="status" className="mt-1 block text-xs font-semibold text-[#9B3B29]">Masukkan angka lebih dari 0.</span>}</label>;
}

function ChoiceAnswer({ name, label, value, onChange, options }: { name: string; label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <fieldset><legend className="text-sm font-bold leading-relaxed text-[#102F5B]">{label}</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{options.map((option) => <label key={option} className="flex min-h-11 items-start gap-3 rounded-xl border border-[#DCE8F4] px-3 py-2 text-sm leading-snug text-[#536782]"><input type="radio" name={`kreasi-${name}`} value={option} checked={value === option} onChange={() => onChange(option)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#1685EE]" /><span>{option}</span></label>)}</div></fieldset>;
}

function ArgumentInput({ heading, label, value, onChange }: { heading: string; label: string; value: string; onChange: (value: string) => void }) {
  return <div className="rounded-xl border border-[#DCE8F4] bg-[#F8FBFF] p-3"><p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#24527B]">{heading}</p><TextArea label={label} value={value} onChange={onChange} rows={2} /></div>;
}