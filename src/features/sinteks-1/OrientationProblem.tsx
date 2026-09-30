'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { loadComicProgress, saveComicProgress } from '@/services/comicProgress';

type OrientationProgress = {
  openedActivities: number[];
  answers: Record<string, string>;
  choices: Record<string, string>;
  hypothesisStatus: '' | 'yakin' | 'cukup-yakin' | 'belum-yakin';
  selectedInformation: string[];
  informationOther: string;
  readyForAr: boolean;
};

type ChoiceOption = { value: string; label: string };

const initialProgress: OrientationProgress = {
  openedActivities: [],
  answers: {},
  choices: {},
  hypothesisStatus: '',
  selectedInformation: [],
  informationOther: '',
  readyForAr: false,
};

const informationOptions = [
  'Bentuk sisi',
  'Jumlah sisi',
  'Jumlah rusuk',
  'Jumlah titik sudut',
  'Ukuran bagian bangunan',
  'Posisi bagian pada candi',
  'Warna bangunan',
  'Informasi lain',
];

export default function OrientationProblem() {
  const { user } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState<OrientationProgress>(initialProgress);
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const progressRef = useRef(progress);
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
        const stored = document?.stageData?.orientation;
        const restored: OrientationProgress = {
          ...initialProgress,
          ...stored,
          openedActivities: Array.isArray(stored?.openedActivities) ? stored.openedActivities : [],
          answers: stored?.answers ?? {},
          choices: stored?.choices ?? {},
          selectedInformation: Array.isArray(stored?.selectedInformation) ? stored.selectedInformation : [],
        };
        progressRef.current = restored;
        setProgress(restored);
      })
      .catch(() => {
        if (active) {
          setSaveState('error');
          setLoadFailed(true);
        }
      })
      .finally(() => {
        if (active) setHydratedUserId(userId);
      });

    return () => {
      active = false;
    };
  }, [user?.uid]);

  const persistProgress = useCallback((value: OrientationProgress) => {
    const userId = user?.uid;
    if (!userId) return Promise.reject(new Error('Login diperlukan untuk menyimpan jawaban.'));

    setSaveState('saving');
    const write = saveQueueRef.current
      .catch(() => undefined)
      .then(() => saveComicProgress(userId, 1, { stageData: { orientation: value } }));
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
    const sections = document.querySelectorAll<HTMLElement>('[data-activity]');
    const observer = new IntersectionObserver((entries) => {
      const visibleNumbers = entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => Number((entry.target as HTMLElement).dataset.activity))
        .filter(Number.isFinite);
      if (!visibleNumbers.length) return;
      setProgress((current) => {
        const openedActivities = Array.from(new Set([...current.openedActivities, ...visibleNumbers])).sort((a, b) => a - b);
        if (openedActivities.length === current.openedActivities.length) return current;
        const next = { ...current, openedActivities };
        progressRef.current = next;
        return next;
      });
    }, { threshold: 0.15 });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [hydratedUserId, loadFailed, user?.uid]);

  const updateAnswer = (key: string, value: string) => {
    setProgress((current) => {
      const next = { ...current, answers: { ...current.answers, [key]: value } };
      progressRef.current = next;
      return next;
    });
  };

  const updateChoice = (key: string, value: string) => {
    setProgress((current) => {
      const next = { ...current, choices: { ...current.choices, [key]: value } };
      progressRef.current = next;
      return next;
    });
  };

  const handleStartAr = async () => {
    const next = { ...progressRef.current, readyForAr: true };
    progressRef.current = next;
    setProgress(next);
    try {
      await persistProgress(next);
      router.push('/comic/1/learn?stage=Navigation');
    } catch {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  };

  const handleReturnHome = async () => {
    try {
      await persistProgress(progressRef.current);
      router.push('/dashboard/siswa/home');
    } catch {
      return;
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
    return (
      <main className="min-h-[60dvh] px-4 py-10 text-center text-sm font-semibold text-[#536782]" aria-live="polite">
        Memuat aktivitas dan jawabanmu...
      </main>
    );
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

  return (
    <main className="min-h-[calc(100dvh-88px)] bg-[#F5F9FF] px-4 pb-6 pt-4 text-[#102F5B] sm:px-5">
      <div className="mx-auto w-full max-w-[560px]">
        <header className="mb-4">
          <button type="button" onClick={handleReturnHome} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-bold text-[#1685EE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2D83E8]/30">
            <span aria-hidden="true" className="text-xl">←</span> Kembali
          </button>
          <div className="mt-3 rounded-[20px] bg-[#DCEEFF] p-4 sm:p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#2D83E8]">TAHAP 1</p>
            <h1 className="mt-1 text-[22px] font-extrabold leading-tight">ORIENTASI MASALAH</h1>
            <p className="mt-1 text-xs font-semibold text-[#536782]">CINARAI – Critical Numeracy with AR &amp; AI</p>
            <p className="mt-3 inline-flex rounded-full bg-white/75 px-3 py-1.5 text-xs font-bold text-[#102F5B]">Misteri Bangun Ruang Candi Jawi</p>
          </div>
          <div className="mt-3 flex items-center gap-3" aria-live="polite">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#DCE6F1]" role="progressbar" aria-label="Aktivitas yang sudah dibuka" aria-valuemin={0} aria-valuemax={7} aria-valuenow={progress.openedActivities.length}>
              <div className="h-full rounded-full bg-[#0DBF7E] transition-[width]" style={{ width: `${(progress.openedActivities.length / 7) * 100}%` }} />
            </div>
            <span className="shrink-0 text-[11px] font-bold text-[#536782]">{progress.openedActivities.length}/7 aktivitas</span>
          </div>
        </header>

        <section className="rounded-[18px] border border-[#DCE8F4] bg-white p-4 shadow-[0_6px_18px_rgba(32,83,143,0.06)]" aria-labelledby="goal-title">
          <h2 id="goal-title" className="text-sm font-extrabold">Tujuan Tahap</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#536782]">Mengorientasikan siswa pada masalah kontekstual, mengaktifkan pengetahuan awal, membangun dugaan, mengidentifikasi informasi yang dibutuhkan, serta menyiapkan siswa mengumpulkan bukti melalui eksplorasi komik berbasis Augmented Reality (AR).</p>
        </section>

        <section className="mt-4 rounded-[18px] border border-[#DCE8F4] bg-white p-4 shadow-[0_6px_18px_rgba(32,83,143,0.06)]">
          <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#1685EE]">Ayo Memulai Petualangan!</p>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#536782]">
            <p>Aris dan Ara sedang berkunjung ke Candi Jawi bersama Kak Najwa. Awalnya mereka mengira kunjungan tersebut hanya akan menjadi kegiatan jalan-jalan dan mendengarkan penjelasan. Ternyata Kak Najwa mengajak mereka melakukan petualangan matematika.</p>
            <p>Aris merasa ragu karena menurutnya matematika sulit. Ara pun masih bingung membedakan beberapa bentuk bangun ruang. Kak Najwa kemudian menunjukkan bahwa bangunan Candi Jawi menyimpan berbagai bentuk matematika yang dapat ditemukan melalui pengamatan.</p>
            <p>Namun, bentuk-bentuk tersebut tidak semuanya mudah terlihat.</p>
          </div>
          <p className="mt-4 rounded-xl bg-[#FFF4D7] p-3 text-sm font-extrabold leading-relaxed text-[#76540B]">Bisakah kamu membantu Aris dan Ara memecahkan misterinya?</p>
        </section>

        <section className="mt-4 rounded-[18px] bg-[#102F5B] p-4 text-white shadow-[0_8px_20px_rgba(16,47,91,0.15)]">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#A9D8FF]">Misi CINARAI</p>
          <h2 className="mt-2 text-lg font-extrabold leading-snug">Bagaimana kita dapat menemukan dan mengenali bangun ruang yang tersembunyi pada bagian-bagian Candi Jawi?</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/85">Untuk menjawabnya, kamu tidak boleh sekadar menebak. Gunakan pengamatan, informasi, penalaran, dan bukti untuk mempertahankan jawabanmu.</p>
        </section>

        <ActivitySection number={1} title="Amati Masalahnya">
          <TextAnswer label="Apa yang menarik perhatianmu dari bentuk bangunan Candi Jawi?" value={progress.answers.observation ?? ''} onChange={(value) => updateAnswer('observation', value)} />
          <ChoiceAnswer name="sameShape" label="Apakah semua bagian Candi Jawi memiliki bentuk yang sama?" value={progress.choices.sameShape ?? ''} onChange={(value) => updateChoice('sameShape', value)} options={[{ value: 'yes', label: 'Ya' }, { value: 'no', label: 'Tidak' }, { value: 'unsure', label: 'Belum yakin' }]} />
          <TextAnswer label="Tuliskan alasanmu." value={progress.answers.observationReason ?? ''} onChange={(value) => updateAnswer('observationReason', value)} />
        </ActivitySection>

        <ActivitySection number={2} title="Apa yang Sudah Kamu Ketahui?">
          <p className="text-sm leading-relaxed text-[#536782]">Sebelum menggunakan teknologi, gunakan pengetahuan yang sudah kamu miliki tentang bangun ruang.</p>
          <TextAnswer label="Apa yang sudah kamu ketahui tentang bangun ruang?" value={progress.answers.priorKnowledge ?? ''} onChange={(value) => updateAnswer('priorKnowledge', value)} />
          <TextAnswer label="Ciri apa yang biasanya kamu gunakan untuk mengenali sebuah bangun ruang?" value={progress.answers.recognitionFeatures ?? ''} onChange={(value) => updateAnswer('recognitionFeatures', value)} />
        </ActivitySection>

        <ActivitySection number={3} title="Temukan Masalahnya">
          <p className="text-sm leading-relaxed text-[#536782]">Sekarang posisikan dirimu sebagai anggota tim Aris dan Ara.</p>
          <TextAnswer label="Menurutmu, apa sebenarnya masalah yang harus kalian selesaikan?" value={progress.answers.problem ?? ''} onChange={(value) => updateAnswer('problem', value)} />
          <p className="rounded-xl border-l-4 border-[#E4A72D] bg-[#FFF7E5] p-3 text-sm leading-relaxed text-[#76540B]">Jangan hanya menulis “mencari bangun ruang”. Pikirkan bagaimana kamu dapat memastikan bahwa suatu bagian Candi Jawi benar-benar menyerupai bangun ruang tertentu.</p>
        </ActivitySection>

        <ActivitySection number={4} title="Buat Dugaan Awal">
          <p className="text-sm leading-relaxed text-[#536782]">Seorang pemecah masalah yang baik berani membuat dugaan, tetapi juga bersedia mengubah dugaan ketika menemukan bukti baru.</p>
          <TextAnswer label="Bangun ruang apa yang mungkin dapat ditemukan pada arsitektur Candi Jawi?" value={progress.answers.hypothesisShape ?? ''} onChange={(value) => updateAnswer('hypothesisShape', value)} />
          <TextAnswer label="Bagian mana dari Candi Jawi yang membuatmu berpikir demikian?" value={progress.answers.hypothesisPart ?? ''} onChange={(value) => updateAnswer('hypothesisPart', value)} />
          <TextAnswer label="Mengapa kamu menduga demikian?" value={progress.answers.hypothesisReason ?? ''} onChange={(value) => updateAnswer('hypothesisReason', value)} />
          <ChoiceAnswer name="hypothesisStatus" label="Status dugaan:" value={progress.hypothesisStatus} onChange={(value) => {
            const next = { ...progressRef.current, hypothesisStatus: value as OrientationProgress['hypothesisStatus'] };
            progressRef.current = next;
            setProgress(next);
          }} options={[{ value: 'yakin', label: 'Saya yakin' }, { value: 'cukup-yakin', label: 'Saya cukup yakin' }, { value: 'belum-yakin', label: 'Saya belum yakin' }]} />
          <p className="rounded-xl bg-[#E9F7EF] p-3 text-sm leading-relaxed text-[#286443]">Tidak masalah jika dugaanmu belum tepat. Pada tahap berikutnya kamu akan mencari bukti.</p>
        </ActivitySection>

        <ActivitySection number={5} title="Informasi Apa yang Kamu Butuhkan?">
          <p className="text-sm leading-relaxed text-[#536782]">Dugaan saja belum cukup. Agar dapat menentukan suatu bentuk bangun ruang dengan tepat, kamu membutuhkan informasi yang relevan.</p>
          <fieldset>
            <legend className="text-sm font-bold text-[#102F5B]">Pilih informasi yang kamu butuhkan.</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {informationOptions.map((option) => (
                <label key={option} className="flex min-h-11 items-center gap-3 rounded-xl border border-[#DCE8F4] px-3 py-2 text-sm text-[#536782]">
                  <input type="checkbox" checked={progress.selectedInformation.includes(option)} onChange={(event) => {
                    setProgress((current) => {
                      const selectedInformation = event.target.checked
                        ? [...current.selectedInformation, option]
                        : current.selectedInformation.filter((item) => item !== option);
                      const next = { ...current, selectedInformation };
                      progressRef.current = next;
                      return next;
                    });
                  }} className="h-5 w-5 accent-[#1685EE]" />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>
          {progress.selectedInformation.includes('Informasi lain') && (
            <label className="block text-sm font-bold text-[#102F5B]">
              Informasi lain
              <input value={progress.informationOther} onChange={(event) => {
                const next = { ...progressRef.current, informationOther: event.target.value };
                progressRef.current = next;
                setProgress(next);
              }} className="mt-2 min-h-12 w-full rounded-xl border border-[#C7D8E9] bg-white px-3 text-sm font-normal text-[#102F5B] outline-none focus:border-[#1685EE] focus:ring-4 focus:ring-[#1685EE]/15" />
            </label>
          )}
          <ChoiceAnswer name="informationImportance" label="Apakah semua informasi tersebut sama pentingnya untuk mengenali bangun ruang?" value={progress.choices.informationImportance ?? ''} onChange={(value) => updateChoice('informationImportance', value)} options={[{ value: 'yes', label: 'Ya' }, { value: 'no', label: 'Tidak' }, { value: 'unsure', label: 'Belum yakin' }]} />
          <TextAnswer label="Informasi mana yang paling kamu perlukan? Mengapa?" value={progress.answers.priorityInformation ?? ''} onChange={(value) => updateAnswer('priorityInformation', value)} />
        </ActivitySection>

        <ActivitySection number={6} title="Bedakan Fakta dan Dugaan">
          <div className="grid gap-3 sm:grid-cols-2">
            <blockquote className="rounded-xl border border-[#B8DDFB] bg-[#EEF7FF] p-3 text-sm leading-relaxed text-[#24527B]"><span className="mb-1 block text-[11px] font-black uppercase tracking-[0.1em]">Pernyataan A</span>“Pada bangunan Candi Jawi terdapat bagian-bagian dengan bentuk yang berbeda.”</blockquote>
            <blockquote className="rounded-xl border border-[#F1D78B] bg-[#FFF8E6] p-3 text-sm leading-relaxed text-[#76540B]"><span className="mb-1 block text-[11px] font-black uppercase tracking-[0.1em]">Pernyataan B</span>“Bagian tersebut pasti berbentuk kubus.”</blockquote>
          </div>
          <TextAnswer label="Manakah yang merupakan hasil pengamatan dan manakah yang masih berupa dugaan?" value={progress.answers.factOrAssumption ?? ''} onChange={(value) => updateAnswer('factOrAssumption', value)} />
          <TextAnswer label="Apa yang harus dilakukan agar sebuah dugaan dapat diterima sebagai jawaban?" value={progress.answers.evidenceNeeded ?? ''} onChange={(value) => updateAnswer('evidenceNeeded', value)} />
          <div className="rounded-[16px] bg-[#DDF5E6] p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#2D8051]">Prinsip CINARAI</p>
            <p className="mt-1 text-sm font-extrabold leading-relaxed text-[#245B3C]">Jawaban yang baik tidak hanya benar, tetapi harus didukung oleh informasi, alasan, dan bukti.</p>
          </div>
        </ActivitySection>

        <ActivitySection number={7} title="Adakah Informasi yang Belum Kita Miliki?">
          <p className="text-sm leading-relaxed text-[#536782]">Kamu sudah mengamati Candi Jawi, mengenali masalah, menggunakan pengetahuan awal, membuat dugaan, dan menentukan informasi yang dibutuhkan.</p>
          <ChoiceAnswer name="imageEnough" label="Apakah pengamatan dari gambar dua dimensi saja cukup untuk memastikan bentuk bangun ruang pada Candi Jawi?" value={progress.choices.imageEnough ?? ''} onChange={(value) => updateChoice('imageEnough', value)} options={[{ value: 'sufficient', label: 'Cukup' }, { value: 'insufficient', label: 'Belum cukup' }, { value: 'unsure', label: 'Saya belum yakin' }]} />
          <TextAnswer label="Mengapa?" value={progress.answers.imageObservationReason ?? ''} onChange={(value) => updateAnswer('imageObservationReason', value)} />
        </ActivitySection>

        <section className="mt-4 rounded-[18px] border border-[#C7D8E9] bg-white p-4 shadow-[0_6px_18px_rgba(32,83,143,0.06)]">
          <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#1685EE]">Misteri Belum Terpecahkan!</p>
          <p className="mt-2 text-sm leading-relaxed text-[#536782]">Kak Najwa membawa sebuah perangkat yang memungkinkan Aris dan Ara melihat bagian Candi Jawi dengan cara yang berbeda. Melalui komik CINARAI, teknologi AR akan membantu menampilkan dan mengeksplorasi bentuk yang sebelumnya sulit dikenali hanya melalui pengamatan biasa.</p>
          <p className="mt-3 rounded-xl bg-[#FFF4D7] p-3 text-sm font-extrabold leading-relaxed text-[#76540B]">Dugaanmu belum selesai diuji. Kita membutuhkan bukti visual yang lebih kuat.</p>
        </section>

        <section className="mt-4 rounded-[18px] bg-[#DCEEFF] p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#2D83E8]">Misi Berikutnya – Eksplorasi dengan AR</p>
          <p className="mt-2 text-sm leading-relaxed text-[#536782]">Gunakan Komik AR CINARAI untuk mengeksplorasi bagian-bagian Candi Jawi.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <EvidenceTarget title="APA?" text="Bangun ruang apa yang kamu temukan?" />
            <EvidenceTarget title="DI MANA?" text="Pada bagian mana dari Candi Jawi kamu menemukannya?" />
            <EvidenceTarget title="APA BUKTINYA?" text="Ciri apa yang membuatmu yakin terhadap jawaban tersebut?" />
          </div>
          <p className="mt-4 rounded-xl bg-[#102F5B] px-3 py-4 text-center text-base font-black leading-snug text-white">JANGAN HANYA MELIHAT. KUMPULKAN BUKTI!</p>
          <button type="button" onClick={handleStartAr} disabled={saveState === 'saving'} className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1685EE] px-4 py-3 text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(22,133,238,0.2)] transition hover:bg-[#1479d4] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2D83E8]/30">
            → MULAI EKSPLORASI AR
          </button>
        </section>

        <div className="mt-3 min-h-5 text-center text-xs font-semibold text-[#667895]" role="status" aria-live="polite">{saveLabel}</div>
      </div>
    </main>
  );
}

function ActivitySection({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section data-activity={number} className="mt-4 scroll-mt-4 rounded-[18px] border border-[#DCE8F4] bg-white p-4 shadow-[0_6px_18px_rgba(32,83,143,0.06)]" aria-labelledby={`activity-${number}`}>
      <h2 id={`activity-${number}`} className="text-base font-extrabold leading-snug">{number}. {title}</h2>
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
}

function TextAnswer({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = useId();
  return (
    <label htmlFor={id} className="block text-sm font-bold leading-relaxed text-[#102F5B]">
      {label}
      <textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="mt-2 min-h-[104px] w-full resize-y rounded-xl border border-[#C7D8E9] bg-white px-3 py-3 text-base font-normal leading-relaxed text-[#102F5B] outline-none placeholder:text-[#8A9BB0] focus:border-[#1685EE] focus:ring-4 focus:ring-[#1685EE]/15" />
    </label>
  );
}

function ChoiceAnswer({ name, label, value, onChange, options }: { name: string; label: string; value: string; onChange: (value: string) => void; options: ChoiceOption[] }) {
  return (
    <fieldset>
      <legend className="text-sm font-bold leading-relaxed text-[#102F5B]">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${value === option.value ? 'border-[#1685EE] bg-[#EEF7FF] text-[#145A9E]' : 'border-[#DCE8F4] bg-white text-[#536782]'}`}>
            <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} className="h-4 w-4 accent-[#1685EE]" />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function EvidenceTarget({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-[#C7D8E9] bg-white p-3">
      <p className="text-[11px] font-black tracking-[0.08em] text-[#1685EE]">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-[#536782]">{text}</p>
    </div>
  );
}