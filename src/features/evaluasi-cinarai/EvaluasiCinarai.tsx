'use client';

import { serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { loadCinaraiEvaluationProgress, saveCinaraiEvaluationProgress } from '@/services/comicProgress';
import type {
  CinaraiChallengeId,
  CinaraiEvaluationAnswers,
  CinaraiEvaluationProgress,
} from '@/types/evaluation';
import { CHALLENGES, getEvaluationScore, isChallengeComplete } from './evaluationModel';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type Option = { value: string; label: string };

const skills = [
  'Mengidentifikasi informasi',
  'Merepresentasikan',
  'Menggunakan strategi',
  'Menghitung',
  'Mengevaluasi',
  'Menginterpretasi',
  'Mengambil keputusan',
  'Memberikan alasan',
];

const relevantInformationOptions = [
  { value: 'length', label: 'Panjang model' },
  { value: 'width', label: 'Lebar model' },
  { value: 'height', label: 'Tinggi model' },
  { value: 'color', label: 'Warna model' },
  { value: 'table', label: 'Ukuran meja' },
];

const aiActionOptions: Option[] = [
  { value: 'A', label: 'Mengikuti AI karena AI pasti benar.' },
  { value: 'B', label: 'Mengganti jawaban sendiri menjadi 620 cm³.' },
  { value: 'C', label: 'Memeriksa data, rumus, dan menghitung kembali.' },
  { value: 'D', label: 'Mengabaikan AI tanpa melakukan pemeriksaan.' },
];

const initialProgress: CinaraiEvaluationProgress = {
  currentChallenge: 1,
  answers: { challenge8: { steps: ['', '', ''] } },
  completed: false,
};

function restoreProgress(stored?: Partial<CinaraiEvaluationProgress>): CinaraiEvaluationProgress {
  if (!stored) return initialProgress;
  const currentChallenge = Number.isInteger(stored.currentChallenge)
    ? Math.min(CHALLENGES.length, Math.max(1, stored.currentChallenge ?? 1))
    : 1;
  return {
    ...initialProgress,
    ...stored,
    currentChallenge,
    answers: {
      ...initialProgress.answers,
      ...stored.answers,
      challenge8: {
        steps: ['', '', ''],
        ...stored.answers?.challenge8,
      },
    },
    completed: stored.completed === true,
  };
}

function mergeAnswer<K extends CinaraiChallengeId>(
  answers: CinaraiEvaluationAnswers,
  id: K,
  patch: Partial<NonNullable<CinaraiEvaluationAnswers[K]>>
): CinaraiEvaluationAnswers {
  return { ...answers, [id]: { ...answers[id], ...patch } } as CinaraiEvaluationAnswers;
}

export default function EvaluasiCinarai() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState<CinaraiEvaluationProgress>(initialProgress);
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [message, setMessage] = useState('');
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const progressRef = useRef(progress);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    setHydratedUserId(null);
    setLoadFailed(false);
    void loadCinaraiEvaluationProgress(user.uid)
      .then((stored) => {
        if (!active) return;
        const restored = restoreProgress(stored ?? undefined);
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

  const persistProgress = useCallback((value: CinaraiEvaluationProgress) => {
    if (!user?.uid) return Promise.reject(new Error('Login diperlukan untuk menyimpan evaluasi.'));
    setSaveState('saving');
    const write = saveQueueRef.current
      .catch(() => undefined)
      .then(() => saveCinaraiEvaluationProgress(user.uid, value));
    saveQueueRef.current = write;
    return write.then(() => setSaveState('saved')).catch((error: unknown) => {
      setSaveState('error');
      throw error;
    });
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || hydratedUserId !== user.uid || loadFailed || progress.completed) return;
    const timeout = window.setTimeout(() => {
      void persistProgress(progress).catch(() => undefined);
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [hydratedUserId, loadFailed, persistProgress, progress, user?.uid]);

  const updateProgress = (update: (current: CinaraiEvaluationProgress) => CinaraiEvaluationProgress) => {
    setProgress((current) => {
      const next = update(current);
      progressRef.current = next;
      return next;
    });
  };

  const updateAnswer = <K extends CinaraiChallengeId>(
    id: K,
    patch: Partial<NonNullable<CinaraiEvaluationAnswers[K]>>
  ) => updateProgress((current) => ({
    ...current,
    answers: mergeAnswer(current.answers, id, patch),
  }));

  const saveOnBlur = () => {
    if (!user?.uid || hydratedUserId !== user.uid || loadFailed || progressRef.current.completed) return;
    void persistProgress(progressRef.current).catch(() => undefined);
  };

  const moveToChallenge = async (challengeNumber: number) => {
    const current = progressRef.current;
    const currentId = CHALLENGES[current.currentChallenge - 1].id;
    if (challengeNumber > current.currentChallenge && !isChallengeComplete(currentId, current.answers)) {
      setMessage('Lengkapi bagian ini agar jawabanmu tersimpan dengan baik sebelum melanjutkan.');
      document.getElementById('current-challenge')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setMessage('');
    const next = { ...current, currentChallenge: challengeNumber };
    try {
      await persistProgress(next);
      progressRef.current = next;
      setProgress(next);
    } catch {
      setMessage('Jawaban belum tersimpan. Periksa koneksi lalu coba lagi.');
    }
  };

  const finishEvaluation = async () => {
    const current = progressRef.current;
    const incomplete = CHALLENGES.find(({ id }) => !isChallengeComplete(id, current.answers));
    if (incomplete) {
      const challengeNumber = CHALLENGES.findIndex(({ id }) => id === incomplete.id) + 1;
      setMessage('Lengkapi bagian yang masih kosong agar evaluasimu dapat dikirim.');
      if (challengeNumber !== current.currentChallenge) await moveToChallenge(challengeNumber);
      else document.getElementById('current-challenge')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const submitted: CinaraiEvaluationProgress = {
      ...current,
      completed: true,
      submittedAt: serverTimestamp(),
      grading: { status: 'pending', rubricVersion: 'cinarai-0-4-v1' },
    };
    setMessage('');
    try {
      await persistProgress(submitted);
      progressRef.current = submitted;
      setProgress(submitted);
    } catch {
      setMessage('Evaluasi belum berhasil dikirim. Jawabanmu tetap tersimpan sebagai draft; periksa koneksi lalu coba lagi.');
    }
  };

  if (authLoading || (user?.uid && hydratedUserId !== user.uid)) {
    return <main className="px-4 py-10 text-center text-sm font-semibold text-[#536782]" aria-live="polite">Memuat evaluasimu...</main>;
  }

  if (!user?.uid) {
    return <main className="px-4 py-12 text-center"><p className="font-extrabold text-[#102F5B]">Masuk untuk mengikuti Evaluasi CINARAI.</p><Link href="/auth/login" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1685EE] px-4 text-sm font-bold text-white">Masuk</Link></main>;
  }

  if (loadFailed) {
    return <main className="px-4 py-12 text-center"><p className="font-extrabold text-[#102F5B]">Evaluasimu belum dapat dimuat.</p><p className="mx-auto mt-2 max-w-sm text-sm text-[#536782]">Periksa koneksi lalu muat ulang agar jawaban tersimpan tidak tertimpa.</p><button type="button" onClick={() => window.location.reload()} className="mt-4 min-h-11 rounded-xl bg-[#1685EE] px-4 text-sm font-bold text-white">Muat ulang</button></main>;
  }

  if (progress.completed) {
    return <EvaluationResult progress={progress} onHome={() => router.push('/dashboard/siswa/home')} />;
  }

  const challenge = CHALLENGES[progress.currentChallenge - 1];
  const saveLabel = saveState === 'saving' ? 'Menyimpan...' : saveState === 'saved' ? 'Tersimpan' : saveState === 'error' ? 'Belum tersimpan' : 'Autosave aktif';

  return (
    <main className="min-h-[calc(100dvh-88px)] bg-[#F5F9FF] px-4 pb-[calc(110px+env(safe-area-inset-bottom))] pt-3 text-[#102F5B] sm:px-5">
      <div className="mx-auto w-full max-w-[760px]">
        <header className="mb-4">
          <Link href="/dashboard/siswa/home" className="inline-flex min-h-10 items-center gap-2 px-1 text-sm font-bold text-[#1685EE]">← Kembali ke Home</Link>
          <div className="mt-2 rounded-[20px] bg-[#FFDDEB] p-4 sm:p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#B72862]">EVALUASI CINARAI</p>
            <h1 className="mt-1 text-xl font-extrabold leading-tight sm:text-2xl">Tantangan Akhir: Buktikan Kemampuan Numerasi Kritismu!</h1>
            <p className="mt-2 text-xs font-semibold text-[#536782]">Critical Numeracy with AR &amp; AI</p>
            <p className="mt-3 text-sm leading-relaxed text-[#304864]">Kamu telah menyelesaikan perjalanan CINARAI. Sekarang gunakan semua kemampuanmu untuk menyelesaikan tantangan akhir. Baca informasi dengan teliti, gunakan matematika, periksa bukti, dan jangan terburu-buru mengambil kesimpulan.</p>
          </div>
        </header>

        <section className="mb-4 rounded-[18px] border border-[#DCE8F4] bg-white p-4" aria-labelledby="evaluation-skills-title">
          <h2 id="evaluation-skills-title" className="text-sm font-extrabold">Kemampuan yang digunakan</h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs font-semibold text-[#536782]">
            {skills.map((skill, index) => <span key={skill} className="inline-flex items-center gap-2"><span className="rounded-lg bg-[#F1F6FC] px-2 py-1.5">{skill}</span>{index < skills.length - 1 && <span aria-hidden="true" className="text-[#D83272]">→</span>}</span>)}
          </div>
        </section>

        <section className="mb-3 rounded-[16px] border border-[#DCE8F4] bg-white px-4 py-3" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-extrabold">Tantangan {progress.currentChallenge} dari {CHALLENGES.length}</p>
            <span className="text-xs font-semibold text-[#536782]">{progress.currentChallenge} / {CHALLENGES.length}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E7EDF5]" role="progressbar" aria-label="Progress Evaluasi CINARAI" aria-valuemin={1} aria-valuemax={CHALLENGES.length} aria-valuenow={progress.currentChallenge}>
            <div className="h-full rounded-full bg-[#D83272] transition-[width]" style={{ width: `${(progress.currentChallenge / CHALLENGES.length) * 100}%` }} />
          </div>
          <p className="mt-1 text-[10px] font-semibold text-[#71819A]">{saveLabel}</p>
        </section>

        <section id="current-challenge" className="scroll-mt-4 rounded-[18px] border border-[#DCE8F4] bg-white p-4 shadow-[0_6px_18px_rgba(32,83,143,0.06)] sm:p-5" aria-labelledby="challenge-title">
          <h2 id="challenge-title" className="mb-4 flex items-start gap-2 text-base font-extrabold leading-snug sm:text-lg">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#FFDDEB] text-sm text-[#B72862]">{progress.currentChallenge}</span>
            <span>{challenge.letter}. Tantangan {progress.currentChallenge} — {challenge.title}</span>
          </h2>
          <div className="space-y-4" onBlurCapture={saveOnBlur}>{renderChallenge(progress.currentChallenge, progress.answers, updateAnswer)}</div>
        </section>

        {progress.currentChallenge === CHALLENGES.length && (
          <section className="mt-4 rounded-[18px] border border-[#DCE8F4] bg-white p-4" aria-labelledby="review-answers-title">
            <h2 id="review-answers-title" className="text-sm font-extrabold">Periksa kembali jawabanmu</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#536782]">Pilih tantangan untuk meninjau atau memperbaiki jawaban sebelum dikirim.</p>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {CHALLENGES.map((item, index) => <button key={item.id} type="button" onClick={() => void moveToChallenge(index + 1)} disabled={saveState === 'saving'} aria-label={`Tinjau Tantangan ${index + 1}`} className={`min-h-10 rounded-lg border text-sm font-extrabold disabled:opacity-50 ${index + 1 === progress.currentChallenge ? 'border-[#D83272] bg-[#FFF0F5] text-[#B72862]' : 'border-[#DCE8F4] bg-white text-[#536782]'}`}>{index + 1}</button>)}
            </div>
          </section>
        )}

        {message && <p role="alert" className="mt-3 rounded-xl bg-[#FFF8E6] p-3 text-sm font-semibold leading-relaxed text-[#76540B]">{message}</p>}

        <nav className="mt-4 flex gap-3" aria-label="Navigasi tantangan">
          <button type="button" onClick={() => void moveToChallenge(progress.currentChallenge - 1)} disabled={progress.currentChallenge === 1 || saveState === 'saving'} className="min-h-12 flex-1 rounded-xl border border-[#C7D8E9] bg-white px-4 text-sm font-extrabold text-[#24527B] disabled:cursor-not-allowed disabled:opacity-40">Sebelumnya</button>
          {progress.currentChallenge < CHALLENGES.length ? (
            <button type="button" onClick={() => void moveToChallenge(progress.currentChallenge + 1)} disabled={saveState === 'saving'} className="min-h-12 flex-1 rounded-xl bg-[#D83272] px-4 text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(216,50,114,0.18)] disabled:cursor-wait disabled:opacity-60">Berikutnya</button>
          ) : (
            <button type="button" onClick={() => void finishEvaluation()} disabled={saveState === 'saving'} className="min-h-12 flex-1 rounded-xl bg-[#D83272] px-4 text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(216,50,114,0.18)] disabled:cursor-wait disabled:opacity-60">SELESAIKAN EVALUASI</button>
          )}
        </nav>
      </div>
    </main>
  );
}

function renderChallenge(
  currentChallenge: number,
  answers: CinaraiEvaluationAnswers,
  updateAnswer: <K extends CinaraiChallengeId>(id: K, patch: Partial<NonNullable<CinaraiEvaluationAnswers[K]>>) => void
) {
  return <ChallengeFields currentChallenge={currentChallenge} answers={answers} updateAnswer={updateAnswer} />;
}

function ChallengeFields({
  currentChallenge,
  answers,
  updateAnswer,
}: {
  currentChallenge: number;
  answers: CinaraiEvaluationAnswers;
  updateAnswer: <K extends CinaraiChallengeId>(id: K, patch: Partial<NonNullable<CinaraiEvaluationAnswers[K]>>) => void;
}) {
  switch (currentChallenge) {
    case 1:
      return <>
        <Prompt>“Sebuah model bagian Candi Jawi direpresentasikan sebagai balok dengan panjang 12 cm, lebar 8 cm, dan tinggi 10 cm. Model tersebut berwarna abu-abu dan diletakkan di atas meja berukuran 100 × 60 cm.”</Prompt>
        <fieldset><legend className="text-sm font-bold">Jika kamu ingin menentukan volume model, informasi mana yang diperlukan?</legend><CheckboxOptions options={relevantInformationOptions} selected={answers.challenge1?.selectedInformation ?? []} onChange={(value, checked) => {
          const selected = answers.challenge1?.selectedInformation ?? [];
          updateAnswer('challenge1', { selectedInformation: checked ? [...selected.filter((item) => item !== value), value] : selected.filter((item) => item !== value) });
        }} /></fieldset>
        <TextArea label="Jelaskan mengapa kamu memilih informasi tersebut." value={answers.challenge1?.explanation ?? ''} onChange={(value) => updateAnswer('challenge1', { explanation: value })} />
      </>;
    case 2:
      return <>
        <Prompt>“Bagian tengah model Candi Jawi memiliki tiga pasang sisi berhadapan yang sama besar dan memiliki ukuran panjang, lebar, dan tinggi yang berbeda.”</Prompt>
        <div className="grid gap-2 sm:grid-cols-2"><Statement title="Aris">“Bentuk ini adalah kubus karena terlihat seperti kotak.”</Statement><Statement title="Ara">“Kita harus memeriksa sifat-sifatnya sebelum menentukan bentuknya.”</Statement></div>
        <RadioOptions label="Siapa yang memberikan alasan lebih sesuai dengan cara berpikir matematis?" value={answers.challenge2?.reasonedSpeaker ?? ''} options={[{ value: 'Aris', label: 'Aris' }, { value: 'Ara', label: 'Ara' }]} onChange={(value) => updateAnswer('challenge2', { reasonedSpeaker: value })} />
        <TextInput label="Bangun ruang apa yang paling tepat digunakan sebagai model?" value={answers.challenge2?.modelShape ?? ''} onChange={(value) => updateAnswer('challenge2', { modelShape: value })} />
        <TextArea label="Tuliskan bukti matematis yang mendukung jawabanmu." value={answers.challenge2?.evidence ?? ''} onChange={(value) => updateAnswer('challenge2', { evidence: value })} />
      </>;
    case 3:
      return <>
        <Prompt>“Sebuah miniatur bagian Candi Jawi dimodelkan sebagai balok dengan panjang 15 cm, lebar 8 cm, dan tinggi 6 cm.”</Prompt>
        <p className="text-sm font-bold">Hitung volume bagian tersebut.</p>
        <TextInput label="Rumus:" value={answers.challenge3?.formula ?? ''} onChange={(value) => updateAnswer('challenge3', { formula: value })} />
        <TextArea label="Proses perhitungan:" value={answers.challenge3?.calculation ?? ''} onChange={(value) => updateAnswer('challenge3', { calculation: value })} rows={5} />
        <TextInput label="Hasil:" value={answers.challenge3?.result ?? ''} onChange={(value) => updateAnswer('challenge3', { result: value })} />
        <TextArea label="Bagaimana kamu memastikan bahwa perhitunganmu benar?" value={answers.challenge3?.verification ?? ''} onChange={(value) => updateAnswer('challenge3', { verification: value })} />
      </>;
    case 4:
      return <>
        <div className="grid gap-2 sm:grid-cols-2"><Statement title="Aris">V = 15 × 8 × 6 = 720 cm³</Statement><Statement title="Ara">V = 15 + 8 + 6 = 29 cm³</Statement></div>
        <TextInput label="Strategi siapa yang tepat?" value={answers.challenge4?.strategy ?? ''} onChange={(value) => updateAnswer('challenge4', { strategy: value })} />
        <TextArea label="Di mana letak kesalahan pada strategi yang tidak tepat?" value={answers.challenge4?.error ?? ''} onChange={(value) => updateAnswer('challenge4', { error: value })} />
        <TextArea label="Bagaimana kamu membuktikannya?" value={answers.challenge4?.proof ?? ''} onChange={(value) => updateAnswer('challenge4', { proof: value })} />
      </>;
    case 5:
      return <>
        <Prompt>“Seorang siswa bertanya kepada AI: ‘Berapa volume balok dengan panjang 15 cm, lebar 8 cm, dan tinggi 6 cm?’ AI memberikan jawaban: ‘Volume balok tersebut adalah 620 cm³.’”</Prompt>
        <RadioOptions label="Apa tindakan terbaik? Jawaban:" value={answers.challenge5?.bestAction ?? ''} options={aiActionOptions} onChange={(value) => updateAnswer('challenge5', { bestAction: value })} />
        <TextArea label="Jelaskan alasanmu." value={answers.challenge5?.reason ?? ''} onChange={(value) => updateAnswer('challenge5', { reason: value })} />
        <TextArea label="Lakukan pemeriksaanmu sendiri. Tuliskan proses pemeriksaan." value={answers.challenge5?.verification ?? ''} onChange={(value) => updateAnswer('challenge5', { verification: value })} rows={5} />
        <RadioOptions label="Setelah diperiksa, bagaimana keputusanmu terhadap jawaban AI?" value={answers.challenge5?.decision ?? ''} options={['Diterima', 'Ditolak', 'Belum dapat ditentukan'].map((value) => ({ value, label: value }))} onChange={(value) => updateAnswer('challenge5', { decision: value })} />
        <TextArea label="Bukti:" value={answers.challenge5?.evidence ?? ''} onChange={(value) => updateAnswer('challenge5', { evidence: value })} />
      </>;
    case 6:
      return <>
        <Prompt>“Seorang siswa berkata: ‘Karena bagian puncak Candi Jawi terlihat seperti limas, berarti bentuk aslinya pasti merupakan limas sempurna.’”</Prompt>
        <RadioOptions label="Apakah kesimpulan tersebut sudah tepat?" value={answers.challenge6?.conclusion ?? ''} options={['Tepat', 'Belum tentu tepat'].map((value) => ({ value, label: value }))} onChange={(value) => updateAnswer('challenge6', { conclusion: value })} />
        <TextArea label="Jelaskan alasanmu." value={answers.challenge6?.reason ?? ''} onChange={(value) => updateAnswer('challenge6', { reason: value })} />
        <TextArea label="Apa yang perlu diperiksa sebelum membuat kesimpulan?" value={answers.challenge6?.checks ?? ''} onChange={(value) => updateAnswer('challenge6', { checks: value })} />
      </>;
    case 7:
      return <>
        <Statement title="Klaim A">“Bangun tersebut adalah balok karena sekilas terlihat seperti kotak.”</Statement>
        <Statement title="Klaim B">“Bangun tersebut dapat dimodelkan sebagai balok karena memiliki tiga pasang sisi berhadapan dan panjang, lebar, serta tingginya dapat berbeda.”</Statement>
        <RadioOptions label="Klaim mana yang memiliki bukti matematis lebih kuat?" value={answers.challenge7?.claim ?? ''} options={[{ value: 'Klaim A', label: 'Klaim A' }, { value: 'Klaim B', label: 'Klaim B' }]} onChange={(value) => updateAnswer('challenge7', { claim: value })} />
        <TextArea label="Mengapa?" value={answers.challenge7?.why ?? ''} onChange={(value) => updateAnswer('challenge7', { why: value })} />
        <TextArea label="Bukti apa yang digunakan dalam klaim tersebut?" value={answers.challenge7?.evidence ?? ''} onChange={(value) => updateAnswer('challenge7', { evidence: value })} />
      </>;
    case 8: {
      const steps = answers.challenge8?.steps ?? ['', '', ''];
      return <>
        <Prompt>“Setelah belajar menggunakan Candi Jawi, kamu mengamati sebuah bangunan budaya lain. Bagian bawah menyerupai balok, atap menyerupai prisma, dan bagian puncak menyerupai limas.”</Prompt>
        <p className="text-sm font-bold leading-relaxed">Bagaimana kamu akan memastikan bahwa dugaan tersebut masuk akal? Tuliskan minimal tiga langkah.</p>
        {steps.map((step, index) => <TextArea key={index} label={`Langkah ${index + 1}`} value={step} onChange={(value) => updateAnswer('challenge8', { steps: steps.map((item, stepIndex) => stepIndex === index ? value : item) })} rows={2} />)}
        <button type="button" onClick={() => updateAnswer('challenge8', { steps: [...steps, ''] })} className="min-h-10 rounded-lg border border-[#C7D8E9] px-3 text-sm font-bold text-[#24527B]">+ Tambah langkah</button>
        <TextArea label="Jika hasil pengamatan berbeda dengan informasi dari AI, apa yang akan kamu lakukan?" value={answers.challenge8?.aiDifferenceAction ?? ''} onChange={(value) => updateAnswer('challenge8', { aiDifferenceAction: value })} />
      </>;
    }
    case 9:
      return <>
        <div className="grid gap-3 sm:grid-cols-2">
          <Statement title="Rancangan A"><ul className="list-disc space-y-1 pl-5"><li>Menggunakan 3 bangun ruang</li><li>Ukuran tidak dicantumkan</li><li>Tidak ada perhitungan</li><li>Dipilih karena “terlihat bagus”</li><li>Mengikuti seluruh saran AI</li></ul></Statement>
          <Statement title="Rancangan B"><ul className="list-disc space-y-1 pl-5"><li>Menggunakan 3 bangun ruang</li><li>Ukuran dicantumkan</li><li>Terdapat perhitungan volume</li><li>Pemilihan bentuk disertai alasan matematis</li><li>Memeriksa saran AI sebelum digunakan</li></ul></Statement>
        </div>
        <RadioOptions label="Rancangan mana yang lebih dapat dipertanggungjawabkan secara matematis?" value={answers.challenge9?.designChoice ?? ''} options={['Rancangan A', 'Rancangan B'].map((value) => ({ value, label: value }))} onChange={(value) => updateAnswer('challenge9', { designChoice: value })} />
        <p className="text-sm font-bold">Gunakan minimal 3 bukti dari tabel.</p>
        <TextArea label="Bukti 1" value={answers.challenge9?.evidence1 ?? ''} onChange={(value) => updateAnswer('challenge9', { evidence1: value })} rows={2} />
        <TextArea label="Bukti 2" value={answers.challenge9?.evidence2 ?? ''} onChange={(value) => updateAnswer('challenge9', { evidence2: value })} rows={2} />
        <TextArea label="Bukti 3" value={answers.challenge9?.evidence3 ?? ''} onChange={(value) => updateAnswer('challenge9', { evidence3: value })} rows={2} />
        <TextArea label="Kesimpulan" value={answers.challenge9?.conclusion ?? ''} onChange={(value) => updateAnswer('challenge9', { conclusion: value })} rows={5} />
      </>;
    case 10:
      return <>
        <Prompt>«“Teknologi dapat membantu kita melihat dan memperoleh informasi, tetapi keputusan matematis harus didukung oleh bukti.”»</Prompt>
        <p className="text-sm font-bold leading-relaxed">Berdasarkan seluruh perjalanan CINARAI, jelaskan maksud pernyataan tersebut. Jawabanmu mencakup:</p>
        <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-[#536782]"><li>Peran AR</li><li>Peran AI</li><li>Peran matematika</li><li>Peran bukti</li><li>Peran keputusan siswa</li></ol>
        <TextArea label="Jawabanmu:" value={answers.challenge10?.integratedExplanation ?? ''} onChange={(value) => updateAnswer('challenge10', { integratedExplanation: value })} rows={9} />
      </>;
  }
  return null;
}

function EvaluationResult({ progress, onHome }: { progress: CinaraiEvaluationProgress; onHome: () => void }) {
  const scores = progress.grading?.challengeScores ?? {};
  const totalScore = getEvaluationScore(scores);
  const strengths = CHALLENGES.filter(({ id }) => (scores[id] ?? -1) >= 3);
  const growthAreas = CHALLENGES.filter(({ id }) => (scores[id] ?? 5) <= 2);
  const graded = progress.grading?.status === 'graded' && totalScore !== null;
  return (
    <main className="min-h-[calc(100dvh-88px)] bg-[#F5F9FF] px-4 pb-[calc(110px+env(safe-area-inset-bottom))] pt-5 text-[#102F5B]">
      <section className="mx-auto max-w-[620px] rounded-[20px] border border-[#BFE7CF] bg-white p-5 shadow-[0_8px_24px_rgba(32,83,143,0.07)] sm:p-7" aria-labelledby="evaluation-result-title">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-[#DDF5E6] text-xl font-black text-[#2D8051]" aria-hidden="true">✓</div>
        <p className="mt-4 text-[11px] font-black uppercase tracking-[0.12em] text-[#2D8051]">Evaluasi CINARAI Selesai</p>
        <h1 id="evaluation-result-title" className="mt-1 text-xl font-extrabold">Jawabanmu sudah tersimpan.</h1>
        {graded ? <>
          <p className="mt-4 rounded-xl bg-[#EFF9F2] p-4 text-lg font-extrabold text-[#245B3C]">Hasil rubric: {totalScore} / 40</p>
          <div className="mt-4 space-y-3">
            <ResultGroup title="Bagian yang sudah kuat" challenges={strengths.map(({ title, letter }) => `${letter}. ${title}`)} emptyText="Semua tantangan sudah ditinjau guru." />
            <ResultGroup title="Bagian yang masih dapat dikembangkan" challenges={growthAreas.map(({ title, letter }) => `${letter}. ${title}`)} emptyText="Belum ada area yang ditandai untuk dikembangkan." />
          </div>
        </> : <div className="mt-4 rounded-xl bg-[#FFF8E6] p-4 text-sm leading-relaxed text-[#76540B]">
          <p className="font-extrabold">Status: Menunggu penilaian guru.</p>
          <p className="mt-1">Guru akan meninjau jawaban berdasarkan proses matematika, bukti, alasan, dan interpretasi dengan rubric CINARAI.</p>
        </div>}
        <p className="mt-4 text-sm leading-relaxed text-[#536782]">Jawabanmu tetap tersimpan. Tidak ada peringkat antarsiswa.</p>
        <button type="button" onClick={onHome} className="mt-5 min-h-12 w-full rounded-xl bg-[#1685EE] px-4 text-sm font-extrabold text-white">KEMBALI KE HOME</button>
      </section>
    </main>
  );
}

function ResultGroup({ title, challenges, emptyText }: { title: string; challenges: string[]; emptyText: string }) {
  return <section className="rounded-xl border border-[#DCE8F4] bg-[#F8FBFF] p-3"><h2 className="text-sm font-extrabold">{title}</h2>{challenges.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#536782]">{challenges.map((challenge) => <li key={challenge}>{challenge}</li>)}</ul> : <p className="mt-1 text-sm text-[#536782]">{emptyText}</p>}</section>;
}

function Prompt({ children }: { children: ReactNode }) {
  return <blockquote className="border-l-4 border-[#D83272] bg-[#FFF5F8] px-3 py-3 text-sm leading-relaxed text-[#4A3A43]">{children}</blockquote>;
}

function Statement({ title, children }: { title: string; children: ReactNode }) {
  return <div className="rounded-xl border border-[#E7EDF5] bg-[#F8FBFF] p-3"><p className="text-xs font-black uppercase text-[#B72862]">{title}</p><div className="mt-1 text-sm leading-relaxed text-[#536782]">{children}</div></div>;
}

function TextArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return <label className="block text-sm font-bold leading-relaxed">{label}<textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-[104px] w-full resize-y rounded-xl border border-[#C7D8E9] bg-white px-3 py-3 text-base font-normal leading-relaxed text-[#102F5B] outline-none focus:border-[#D83272] focus:ring-4 focus:ring-[#D83272]/10" /></label>;
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-bold leading-relaxed">{label}<input type="text" value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#C7D8E9] bg-white px-3 text-base font-normal text-[#102F5B] outline-none focus:border-[#D83272] focus:ring-4 focus:ring-[#D83272]/10" /></label>;
}

function RadioOptions({ label, value, options, onChange }: { label: string; value: string; options: Option[]; onChange: (value: string) => void }) {
  return <fieldset><legend className="text-sm font-bold leading-relaxed">{label}</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{options.map((option) => <label key={option.value} className="flex min-h-12 items-start gap-3 rounded-xl border border-[#DCE8F4] px-3 py-3 text-sm leading-snug text-[#536782]"><input type="radio" name={`evaluation-${label}`} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#D83272]" /><span>{option.label}</span></label>)}</div></fieldset>;
}

function CheckboxOptions({ options, selected, onChange }: { options: Option[]; selected: string[]; onChange: (value: string, checked: boolean) => void }) {
  return <div className="mt-2 grid gap-2 sm:grid-cols-2">{options.map((option) => <label key={option.value} className="flex min-h-12 items-center gap-3 rounded-xl border border-[#DCE8F4] px-3 py-3 text-sm leading-snug text-[#536782]"><input type="checkbox" checked={selected.includes(option.value)} onChange={(event) => onChange(option.value, event.target.checked)} className="h-5 w-5 shrink-0 accent-[#D83272]" /><span>{option.label}</span></label>)}</div>;
}