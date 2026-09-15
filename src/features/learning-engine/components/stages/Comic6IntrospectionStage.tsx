'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getCurrentUser } from '@/lib/firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { useSnackbar } from '@/context/SnackbarContext';
import { saveReflectionDocument } from '@/services/reflection';
import { loadComicProgress, saveComicProgress } from '@/services/comicProgress';
import { useLearningEngine } from '../../hooks/useLearningEngine';

type ReflectionState = {
  learnedShapes: string[];
  favoriteShape: string;
  rememberedCharacteristics: string[];
  masjidConnections: string[];
  feeling: string;
  difficultShape: string;
  reflectionText: string;
};

const SHAPES = ['Kubus', 'Balok', 'Tabung', 'Kerucut', 'Setengah bola'];
const SHAPE_CHARACTERISTICS: Record<string, string[]> = {
  Kubus: ['Memiliki 6 sisi berbentuk persegi', 'Memiliki 12 rusuk sama panjang', 'Memiliki 8 titik sudut'],
  Balok: ['Memiliki 6 sisi', 'Memiliki 12 rusuk', 'Memiliki 8 titik sudut'],
  Tabung: ['Memiliki 3 sisi', 'Memiliki 2 rusuk', 'Memiliki sisi berbentuk lingkaran'],
  Kerucut: ['Memiliki titik puncak', 'Memiliki sisi lengkung', 'Memiliki alas berbentuk lingkaran'],
  'Setengah bola': ['Memiliki sisi lengkung', 'Tidak memiliki titik sudut'],
};
const CONNECTIONS = [
  'Menara - Tabung',
  'Kubah - Kerucut dan Setengah bola',
  'Ruang utama - Balok',
  'Tempat wudhu - Kubus',
];
const FEELINGS = ['😊 Sangat senang', '🙂 Senang', '😐 Masih bingung'];
const DIFFICULTIES = [...SHAPES, 'Saya sudah cukup paham'];
const EMPTY_STATE: ReflectionState = {
  learnedShapes: [],
  favoriteShape: '',
  rememberedCharacteristics: [],
  masjidConnections: [],
  feeling: '',
  difficultShape: '',
  reflectionText: '',
};

function isReflectionComplete(state: ReflectionState) {
  return state.learnedShapes.length > 0
    && state.favoriteShape.length > 0
    && state.rememberedCharacteristics.length > 0
    && state.masjidConnections.length > 0
    && state.feeling.length > 0
    && state.difficultShape.length > 0;
}

export default function Comic6IntrospectionStage() {
  const { comic, setCanAdvance, completeAndAdvance } = useLearningEngine();
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<ReflectionState>(EMPTY_STATE);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasHydratedProgress, setHasHydratedProgress] = useState(false);

  const characteristics = useMemo(() => SHAPE_CHARACTERISTICS[answers.favoriteShape] ?? [], [answers.favoriteShape]);
  const isComplete = isReflectionComplete(answers);

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
          learnedShapes: Array.isArray(saved.understood) ? saved.understood : [],
          favoriteShape: saved.favoriteShape ?? saved.interesting ?? '',
          rememberedCharacteristics: Array.isArray(saved.rememberedCharacteristics) ? saved.rememberedCharacteristics : [],
          masjidConnections: Array.isArray(saved.masjidConnections) ? saved.masjidConnections : [],
          feeling: saved.feeling ?? '',
          difficultShape: saved.difficultShape ?? saved.difficult ?? '',
          reflectionText: saved.reflectionText ?? saved.reflection ?? '',
        });
        setIsSaved(saved.saved === true);
      }
      setHasHydratedProgress(true);
    }).catch((error) => {
      console.error('[Comic6IntrospectionStage] gagal memuat progress refleksi', error);
      setHasHydratedProgress(true);
    });

    return () => {
      active = false;
    };
  }, [comic.id, user?.uid]);

  useEffect(() => {
    setCanAdvance(isSaved);
  }, [isSaved, setCanAdvance]);

  useEffect(() => {
    if (!user?.uid || !hasHydratedProgress) return;
    void saveComicProgress(user.uid, comic.id, {
      stageData: {
        introspection: {
          understood: answers.learnedShapes,
          interesting: answers.favoriteShape,
          favoriteShape: answers.favoriteShape,
          rememberedCharacteristics: answers.rememberedCharacteristics,
          masjidConnections: answers.masjidConnections,
          feeling: answers.feeling,
          difficult: answers.difficultShape,
          difficultShape: answers.difficultShape,
          reflection: answers.reflectionText,
          reflectionText: answers.reflectionText,
          saved: isSaved,
        },
      },
    });
  }, [answers, comic.id, hasHydratedProgress, isSaved, user?.uid]);

  const updateAnswers = (patch: Partial<ReflectionState>) => {
    setAnswers((current) => ({ ...current, ...patch }));
    setIsSaved(false);
    setSaveError(null);
  };

  const toggle = (key: 'learnedShapes' | 'rememberedCharacteristics' | 'masjidConnections', value: string) => {
    const current = answers[key];
    updateAnswers({ [key]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value] });
  };

  const nextStep = () => {
    if (step === 0 && answers.learnedShapes.length === 0) return;
    if (step === 1 && (!answers.favoriteShape || answers.rememberedCharacteristics.length === 0)) return;
    if (step === 2 && answers.masjidConnections.length === 0) return;
    if (step === 3 && !answers.feeling) return;
    if (step < 4) setStep((current) => current + 1);
  };

  const saveAndFinish = async () => {
    if (!isComplete || isSaving) return;
    const uid = getCurrentUser()?.uid ?? user?.uid;
    if (!uid) {
      showSnackbar('Silakan masuk terlebih dahulu untuk menyimpan refleksi.', 'error');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    const reflectionText = [
      `Bangun yang dipelajari: ${answers.learnedShapes.join(', ')}`,
      `Bangun yang paling diingat: ${answers.favoriteShape}`,
      `Ciri yang diingat: ${answers.rememberedCharacteristics.join(', ')}`,
      `Hubungan dengan Masjid Al-Akbar: ${answers.masjidConnections.join('; ')}`,
      `Perasaan: ${answers.feeling}`,
      `Bagian yang masih ingin dipelajari: ${answers.difficultShape}`,
      answers.reflectionText.trim() ? `Hal yang disukai: ${answers.reflectionText.trim()}` : '',
    ].filter(Boolean).join('\n');

    try {
      await saveReflectionDocument({
        userId: uid,
        comicId: comic.id,
        checklist: answers.learnedShapes,
        confidence: null,
        reflectionText,
        stage: 'introspection',
        status: 'completed',
      });
      setIsSaved(true);
      showSnackbar('Refleksi berhasil disimpan.', 'success');
      await completeAndAdvance('Introspection');
    } catch (error) {
      console.error('[Comic6IntrospectionStage] gagal menyimpan refleksi', error);
      setSaveError('Refleksi belum dapat disimpan. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const stepContent = [
    <ReflectionList key="learned" title="Hari ini kamu belajar tentang apa?" helper="Pilih bangun ruang yang kamu pelajari hari ini." values={SHAPES} selected={answers.learnedShapes} onToggle={(value) => toggle('learnedShapes', value)} multiple />,
    <div key="remembered" className="space-y-4"><ReflectionList title="Bangun ruang mana yang paling kamu ingat?" values={SHAPES} selected={[answers.favoriteShape]} onToggle={(value) => updateAnswers({ favoriteShape: value, rememberedCharacteristics: [] })} /><p className="text-sm font-bold text-primary-800">Apa yang kamu ingat tentang bangun ini?</p><ReflectionList title="Pilih ciri yang kamu ingat" values={characteristics} selected={answers.rememberedCharacteristics} onToggle={(value) => toggle('rememberedCharacteristics', value)} multiple /></div>,
    <ReflectionList key="masjid" title="Bangun ruang apa yang kamu temukan di Masjid Al-Akbar?" helper="Pilih hubungan yang masih kamu ingat." values={CONNECTIONS} selected={answers.masjidConnections} onToggle={(value) => toggle('masjidConnections', value)} multiple />,
    <ReflectionList key="feeling" title="Bagaimana perasaanmu setelah belajar bangun ruang di Masjid Al-Akbar?" values={FEELINGS} selected={[answers.feeling]} onToggle={(value) => updateAnswers({ feeling: value })} />,
    <div key="difficult" className="space-y-4"><ReflectionList title="Bagian mana yang masih ingin kamu pelajari lagi?" values={DIFFICULTIES} selected={[answers.difficultShape]} onToggle={(value) => updateAnswers({ difficultShape: value })} />{answers.difficultShape && answers.difficultShape !== 'Saya sudah cukup paham' ? <div className="rounded-2xl bg-primary-50 p-4 text-sm leading-relaxed text-primary-900"><p>Tidak apa-apa. Kamu bisa mempelajarinya lagi.</p><Link className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-primary-600 px-4 py-2 font-black text-white" href={`/ai-tutor/${comic.id}`}>Tanya AI Tutor</Link></div> : null}<label htmlFor="comic6-reflection-text" className="block text-sm font-black text-neutral-800">Hal apa yang paling kamu sukai?</label><textarea id="comic6-reflection-text" value={answers.reflectionText} onChange={(event) => updateAnswers({ reflectionText: event.target.value })} rows={3} placeholder="Tulis jawabanmu di sini... (boleh dilewati)" className="w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" /></div>,
  ][step];

  return <div className="flex min-w-0 flex-col gap-4 px-1 py-1">
    <section className="rounded-[24px] border border-primary-100 bg-primary-50/70 px-5 py-6 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary-700">Refleksi diri</p>
      <div className="mt-2 flex items-start justify-between gap-3"><div><h1 className="text-2xl font-black leading-tight text-neutral-950 sm:text-3xl">INTROSPEKSI</h1><p className="mt-2 text-sm font-bold leading-relaxed text-primary-900">Yuk, ingat kembali apa yang sudah kamu pelajari!</p></div><span className="rounded-full bg-white px-3 py-2 text-sm font-black text-primary-700">{Math.min(step + 1, 5)}/5</span></div>
      <p className="mt-3 text-sm leading-relaxed text-neutral-700">Kamu sudah menjelajahi Masjid Al-Akbar dan menemukan berbagai bangun ruang. Sekarang, mari kita lihat kembali apa yang sudah kamu pelajari.</p>
    </section>
    <section className="rounded-[24px] bg-white p-5 shadow-sm">{stepContent}<div className="mt-5 flex gap-3">{step > 0 ? <button type="button" onClick={() => setStep((current) => current - 1)} className="min-h-12 flex-1 rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-black text-neutral-700">Kembali</button> : null}{step < 4 ? <button type="button" onClick={nextStep} className="min-h-12 flex-1 rounded-2xl bg-primary-600 px-4 py-3 text-sm font-black text-white">Lanjut</button> : <button type="button" onClick={() => void saveAndFinish()} disabled={!isComplete || isSaving || isSaved} className="min-h-12 flex-1 rounded-2xl bg-primary-600 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-300">{isSaving ? 'Menyimpan...' : isSaved ? 'Refleksi tersimpan' : 'Simpan Refleksi'}</button>}</div>{saveError ? <p className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{saveError}</p> : null}{isSaved ? <p className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">Refleksimu sudah tersimpan. Hebat!</p> : null}</section>
  </div>;
}

function ReflectionList({ title, helper, values, selected, onToggle, multiple = false }: { title: string; helper?: string; values: string[]; selected: string[]; onToggle: (value: string) => void; multiple?: boolean }) {
  return <div><h2 className="text-lg font-black leading-relaxed text-neutral-900">{title}</h2>{helper ? <p className="mt-2 text-sm text-neutral-600">{helper}</p> : null}<div className="mt-4 grid gap-3">{values.map((value) => { const isSelected = selected.includes(value); return <button key={value} type="button" onClick={() => onToggle(value)} className={['min-h-12 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition', isSelected ? 'border-primary-600 bg-primary-50 text-primary-900' : 'border-neutral-200 bg-neutral-50 text-neutral-800 hover:border-primary-300'].join(' ')}><span className="mr-3 inline-flex h-5 w-5 items-center justify-center rounded-md border text-xs">{isSelected ? '✓' : multiple ? '' : '○'}</span>{value}</button>; })}</div></div>;
}
