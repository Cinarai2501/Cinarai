'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { serverTimestamp } from 'firebase/firestore';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import { useComicMetadata } from '@/services/comic-assets/useComicMetadata';
import { useSnackbar } from '@/context/SnackbarContext';
import { useAuth } from '@/hooks/useAuth';
import { mergeFirestoreDocument } from '@/services/firestore';
import { generateTutorResponse } from '@/lib/ai';
import type { ComicAssetEntry } from '@/services/comic-assets/types';

function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function getObjectDisplayName(entry: ComicAssetEntry | null | undefined): string {
  const rawName = entry?.title?.trim();
  if (rawName) return rawName;
  return 'Kubus';
}

const bangunRuangOptions = ['Kubus', 'Balok', 'Prisma', 'Limas', 'Tabung', 'Kerucut', 'Bola'];

function getQuickQuestions(objectName: string): string[] {
  const normalized = objectName.toLowerCase();
  if (normalized.includes('kubus')) {
    return [
      'Apa nama bangun ruang ini?',
      'Berapa jumlah sisinya?',
      'Berapa jumlah rusuknya?',
      'Berapa titik sudutnya?',
      'Mengapa bagian bawah Candi Jawi berbentuk kubus?',
    ];
  }
  if (normalized.includes('balok')) {
    return [
      'Apa nama bangun ruang ini?',
      'Berapa jumlah sisi balok ini?',
      'Apa perbedaan balok dan kubus?',
      'Bagaimana bentuk rusuk pada balok?',
    ];
  }
  if (normalized.includes('kerucut')) {
    return [
      'Apa nama bangun ruang ini?',
      'Apa ciri khas alas kerucut?',
      'Apa perbedaan kerucut dan tabung?',
      'Mengapa bentuk atap candi mirip kerucut?',
    ];
  }
  if (normalized.includes('tabung')) {
    return [
      'Apa nama bangun ruang ini?',
      'Apa bentuk alas dan tutup tabung?',
      'Berapa jumlah rusuk tabung?',
      'Mengapa struktur ini sering muncul pada bangunan?',
    ];
  }
  return [
    'Apa nama bangun ruang ini?',
    'Berapa jumlah rusuknya?',
    'Bagaimana bentuk sisi-sisinya?',
    'Apa kaitannya dengan Candi Jawi?',
  ];
}

interface ObservasiFormState {
  bangunRuang: string;
  alasan: string;
  bagianMenarik: string;
  hubunganMatematika: string;
}

interface ChatMessage {
  id: number;
  role: 'assistant' | 'user';
  content: string;
}

const starterMessages: ChatMessage[] = [
  {
    id: 1,
    role: 'assistant',
    content: 'Halo! Aku siap membantu kamu mengamati objek ini dan mengaitkannya dengan bangun ruang di Candi Jawi.',
  },
];

export default function NavigationStage() {
  const { comic, setCanAdvance, unregisterSlideNav, nextStage } = useLearningEngine();
  const { showSnackbar } = useSnackbar();
  const { user } = useAuth();
  const metadata = useComicMetadata(comic.id);
  const { model3D } = metadata.assets;
  const primaryEntry = model3D[0] ?? null;
  const activeObjectName = useMemo(() => getObjectDisplayName(primaryEntry), [primaryEntry]);
  const quickQuestions = useMemo(() => getQuickQuestions(activeObjectName), [activeObjectName]);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const [formData, setFormData] = useState<ObservasiFormState>({
    bangunRuang: '',
    alasan: '',
    bagianMenarik: '',
    hubunganMatematika: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [draft, setDraft] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [hasOpenedAr, setHasOpenedAr] = useState(false);
  const [hasAskedAi, setHasAskedAi] = useState(false);

  const isObservationComplete = Object.values(formData).every((value) => value.trim().length > 0);
  const canAdvanceToArgumentation = hasOpenedAr && hasAskedAi;

  useEffect(() => {
    const candidates = [
      `/images/navigation/komik-${comic.id}-ar.png`,
      `/images/navigation/komik-${comic.id}-ar.jpg`,
      `/images/navigation/komik-${comic.id}-ar.webp`,
    ];

    let isMounted = true;
    let settled = false;

    const tryLoad = (src: string) => {
      if (settled) return;
      const image = new window.Image();
      image.onload = () => {
        if (!isMounted) return;
        settled = true;
        setPreviewSrc(src);
      };
      image.onerror = () => {
        if (!isMounted) return;
        if (src === candidates[candidates.length - 1]) {
          settled = true;
          setPreviewSrc(null);
        }
      };
      image.src = src;
    };

    candidates.forEach((candidate) => tryLoad(candidate));

    return () => {
      isMounted = false;
    };
  }, [comic.id]);

  useEffect(() => {
    setCanAdvance(canAdvanceToArgumentation);
    return () => {
      unregisterSlideNav();
    };
  }, [canAdvanceToArgumentation, setCanAdvance, unregisterSlideNav]);

  const handleChange = (field: keyof ObservasiFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
    setIsSaved(false);
  };

  const handleSave = async () => {
    if (!isObservationComplete) {
      setError('Semua pertanyaan observasi wajib diisi.');
      return;
    }
    if (!user) {
      setError('Silakan masuk terlebih dahulu.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const docId = `${user.uid}_${comic.id}_observasi`;
      await mergeFirestoreDocument('reflection', docId, {
        studentId: user.uid,
        userId: user.uid,
        moduleId: String(comic.id),
        jawaban: { ...formData },
        timestamp: serverTimestamp(),
        status: 'completed',
        prompt: 'Observasi',
        response: JSON.stringify(formData),
        submittedAt: serverTimestamp(),
      });
      setIsSaved(true);
      showSnackbar('Observasi berhasil disimpan ✓', 'success');
    } catch (err) {
      console.error('[NavigationStage] Gagal menyimpan observasi', err);
      setError('Gagal menyimpan. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = useCallback(async (rawText?: string) => {
    const trimmed = (rawText ?? draft).trim();
    if (!trimmed || isResponding || !comic) return;

    const userMessage: ChatMessage = { id: Date.now(), role: 'user', content: trimmed };
    const nextMessages = [...messages, userMessage];
    setHasAskedAi(true);
    const historyForPrompt = nextMessages.map(({ role, content }) => ({ role, content }));

    setMessages(nextMessages);
    setDraft('');
    setIsResponding(true);

    try {
      const response = await generateTutorResponse({
        moduleName: comic.title,
        identification: [],
        objectInfo: {
          location: comic.lokasi,
          classLevel: comic.kelas,
          synopsis: comic.synopsis,
          learningTargets: comic.learningTargets,
        },
        observationAnswers: { ...formData },
        question: trimmed,
        sessionHistory: historyForPrompt,
        comicTitle: comic.title,
        pageLabel: primaryEntry ? `Halaman ${primaryEntry.page}` : undefined,
        objectName: activeObjectName,
        learningStage: 'Navigation',
      });

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.answer,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('[NavigationStage] Gagal memanggil AI', error);
      const fallbackMessage: ChatMessage = {
        id: Date.now() + 2,
        role: 'assistant',
        content: 'Maaf, saya sedang tidak bisa merespons saat ini. Coba lagi sebentar lagi.',
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsResponding(false);
    }
  }, [activeObjectName, comic, draft, formData, isResponding, messages, primaryEntry]);

  function handleOpenAr(entry: ComicAssetEntry) {
    if (!isValidUrl(entry.url)) {
      showSnackbar('Link AR belum tersedia.', 'info');
      return;
    }
    setHasOpenedAr(true);
    window.open(entry.url, '_blank', 'noopener,noreferrer');
  }

  function handleContinueToArgumentation() {
    if (!canAdvanceToArgumentation) {
      showSnackbar('Silakan eksplorasi objek AR dan diskusikan hasil pengamatanmu dengan AI sebelum melanjutkan.', 'info');
      return;
    }
    void nextStage();
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 overflow-x-hidden px-1 py-1 animate-fade-in-up sm:gap-5 sm:px-2">
      <header className="rounded-[24px] bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4 py-4 shadow-sm sm:px-5 sm:py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-2xl text-white shadow-sm">
            🧭
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary-600">Navigation (AR + AI)</p>
            <h2 className="mt-1 text-lg font-black text-neutral-900 sm:text-xl">Eksplorasi objek 3D dan tanyakan hasil pengamatanmu kepada AI.</h2>
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col gap-4 rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
            <div className="overflow-hidden rounded-[18px] border border-neutral-200 bg-white">
              {previewSrc ? (
                <img
                  src={previewSrc}
                  alt={`Tampilan ${activeObjectName} dalam AR`}
                  className="h-56 w-full object-cover sm:h-72"
                />
              ) : (
                <div className="flex h-56 flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4 text-center sm:h-72">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-2xl text-primary-700">
                    📷
                  </div>
                  <div>
                    <p className="text-base font-black text-neutral-900">Preview AR belum tersedia.</p>
                    <p className="mt-1 text-sm text-neutral-600">Screenshot asli untuk komik ini belum tersedia, tetapi pengalaman AR tetap bisa dibuka.</p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-neutral-400">Eksplorasi AR</p>
              <h3 className="mt-1 text-xl font-black text-neutral-900">{activeObjectName}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                Bangun ruang yang ditemukan pada Candi Jawi.
              </p>
            </div>
            <button
              type="button"
              onClick={() => primaryEntry && handleOpenAr(primaryEntry)}
              disabled={!primaryEntry || !isValidUrl(primaryEntry.url)}
              className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              Lihat AR Interaktif
            </button>
          </div>

          <div className="rounded-[20px] border border-primary-100 bg-primary-50/80 p-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔍</span>
              <h4 className="text-base font-black text-neutral-900">Panduan Observasi</h4>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-neutral-700">
              <li>✓ Putar objek</li>
              <li>✓ Perbesar objek</li>
              <li>✓ Amati bentuk bangun ruang</li>
              <li>✓ Identifikasi sisi</li>
              <li>✓ Identifikasi rusuk</li>
              <li>✓ Identifikasi titik sudut</li>
              <li>✓ Diskusikan hasil pengamatan dengan AI</li>
            </ul>
          </div>

          <div className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <h4 className="text-base font-black text-neutral-900">Status Eksplorasi</h4>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-neutral-700">
              <li className="flex items-center gap-2">{hasOpenedAr ? '☑' : '☐'} <span>Melihat Preview</span></li>
              <li className="flex items-center gap-2">{hasOpenedAr ? '☑' : '☐'} <span>Membuka AR</span></li>
              <li className="flex items-center gap-2">{hasAskedAi ? '☑' : '☐'} <span>Bertanya ke AI</span></li>
              <li className="flex items-center gap-2">{canAdvanceToArgumentation ? '☑' : '☐'} <span>Siap ke Argumentation</span></li>
            </ul>
            <button
              type="button"
              onClick={handleContinueToArgumentation}
              disabled={!canAdvanceToArgumentation}
              className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              Lanjut ke Argumentation
            </button>
            {!canAdvanceToArgumentation && (
              <p className="mt-3 text-sm text-neutral-600">
                Silakan eksplorasi objek AR dan diskusikan hasil pengamatanmu dengan AI sebelum melanjutkan.
              </p>
            )}
          </div>

          <div className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">📝</span>
              <h4 className="text-base font-black text-neutral-900">Catat hasil pengamatan</h4>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700" htmlFor="nav-bangun-ruang">
                  Bangun ruang apa yang paling dominan?
                </label>
                <select
                  id="nav-bangun-ruang"
                  value={formData.bangunRuang}
                  onChange={(event) => handleChange('bangunRuang', event.target.value)}
                  disabled={isSaved}
                  className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:bg-neutral-50 disabled:text-neutral-500"
                >
                  <option value="">Pilih bangun ruang</option>
                  {bangunRuangOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700" htmlFor="nav-alasan">
                  Mengapa kamu memilih jawaban tersebut?
                </label>
                <textarea
                  id="nav-alasan"
                  rows={3}
                  value={formData.alasan}
                  onChange={(event) => handleChange('alasan', event.target.value)}
                  disabled={isSaved}
                  placeholder="Jelaskan alasanmu..."
                  className="mt-2 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:bg-neutral-50 disabled:text-neutral-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700" htmlFor="nav-bagian-menarik">
                  Bagian objek mana yang paling menarik?
                </label>
                <textarea
                  id="nav-bagian-menarik"
                  rows={3}
                  value={formData.bagianMenarik}
                  onChange={(event) => handleChange('bagianMenarik', event.target.value)}
                  disabled={isSaved}
                  placeholder="Tuliskan bagian yang paling menarik..."
                  className="mt-2 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:bg-neutral-50 disabled:text-neutral-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700" htmlFor="nav-hubungan">
                  Apa hubungan objek dengan materi matematika?
                </label>
                <textarea
                  id="nav-hubungan"
                  rows={3}
                  value={formData.hubunganMatematika}
                  onChange={(event) => handleChange('hubunganMatematika', event.target.value)}
                  disabled={isSaved}
                  placeholder="Hubungkan dengan konsep matematika..."
                  className="mt-2 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:bg-neutral-50 disabled:text-neutral-500"
                />
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-2xl border border-error-200 bg-error-50 px-4 py-3 text-sm font-semibold text-error-700">
                {error}
              </p>
            )}

            {isSaved ? (
              <div className="mt-4 rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm font-semibold text-accent-700">
                ✓ Observasi tersimpan. Kamu sudah siap melanjutkan ke tahap Argumentation.
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={!isObservationComplete || isSaving}
                className="mt-4 flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-primary-600 px-4 text-base font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Observasi'}
              </button>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <div>
                <h3 className="text-base font-black text-neutral-900">AI Assistant</h3>
                <p className="text-sm text-neutral-500">Diskusikan apa yang kamu temukan berdasarkan hasil observasi.</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {quickQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => void handleSend(question)}
                  disabled={isResponding}
                  className="rounded-full border border-primary-200 bg-white px-3 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {question}
                </button>
              ))}
            </div>

            <div className="mt-4 flex min-h-[320px] flex-col overflow-hidden rounded-[18px] border border-neutral-200 bg-white">
              <div className="flex-1 space-y-3 overflow-y-auto bg-neutral-50 px-3 py-3 sm:px-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed shadow-sm ${message.role === 'user' ? 'bg-primary-600 text-white' : 'border border-neutral-200 bg-white text-neutral-700'}`}>
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-neutral-100 bg-white px-3 py-3 sm:px-4">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={3}
                  placeholder="Tanyakan apa yang kamu temukan pada objek ini..."
                  disabled={isResponding}
                  className="min-h-[96px] w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={isResponding || !draft.trim()}
                  className="mt-3 inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                  {isResponding ? 'Memproses...' : 'Kirim pertanyaan'}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
