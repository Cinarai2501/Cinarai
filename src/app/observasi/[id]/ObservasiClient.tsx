'use client';

import { useState } from 'react';
import Link from 'next/link';
import { serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getComicById } from '@/lib/comicRepository';
import { mergeFirestoreDocument } from '@/services/firestore';
import { useSnackbar } from '@/context/SnackbarContext';
import RobotMascot from '@/components/ai/RobotMascot';

interface ObservasiClientProps {
  comicId: number;
}

interface ObservasiFormState {
  bangunRuang: string;
  alasan: string;
  bagianMenarik: string;
  hubunganMatematika: string;
}

const bangunRuangOptions = ['Kubus', 'Balok', 'Prisma', 'Limas', 'Tabung', 'Kerucut', 'Bola'];

export default function ObservasiClient({ comicId }: ObservasiClientProps) {
  const comic = getComicById(comicId);
  const router = useRouter();
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [formData, setFormData] = useState<ObservasiFormState>({
    bangunRuang: '',
    alasan: '',
    bagianMenarik: '',
    hubunganMatematika: '',
  });
  const [savedNotice, setSavedNotice] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isFormComplete = Object.values(formData).every((value) => value.trim().length > 0);

  const handleChange = (field: keyof ObservasiFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSavedNotice(false);
    setErrorMessage('');
    if (isSaved) {
      setIsSaved(false);
    }
  };

  const handleSave = async () => {
    if (!isFormComplete) {
      setErrorMessage('Semua pertanyaan wajib diisi sebelum menyimpan.');
      setSavedNotice(false);
      return;
    }

    if (!user) {
      setErrorMessage('Silakan masuk terlebih dahulu untuk menyimpan observasi.');
      setSavedNotice(false);
      return;
    }

    setIsSubmitting(true);
    setIsLoading(true);
    setErrorMessage('');

    try {
      const docId = `${user.uid}_${comicId}_observasi`;
      await mergeFirestoreDocument('reflection', docId, {
        studentId: user.uid,
        userId: user.uid,
        moduleId: String(comicId),
        jawaban: {
          bangunRuang: formData.bangunRuang,
          alasan: formData.alasan,
          bagianMenarik: formData.bagianMenarik,
          hubunganMatematika: formData.hubunganMatematika,
        },
        timestamp: serverTimestamp(),
        status: 'completed',
        prompt: 'Observasi',
        response: JSON.stringify({
          bangunRuang: formData.bangunRuang,
          alasan: formData.alasan,
          bagianMenarik: formData.bagianMenarik,
          hubunganMatematika: formData.hubunganMatematika,
        }),
        submittedAt: serverTimestamp(),
      });

      setSavedNotice(true);
      setIsSaved(true);
      showSnackbar('Observasi berhasil disimpan.', 'success');
    } catch (error) {
      console.error('[Observasi] Gagal menyimpan jawaban observasi', error);
      setErrorMessage('Gagal menyimpan observasi. Silakan coba lagi.');
      setSavedNotice(false);
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  if (!comic) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-neutral-50 px-4 py-6 text-center sm:px-6">
        <span className="text-5xl">📭</span>
        <div>
          <p className="text-base font-black text-neutral-800">Komik Tidak Ditemukan</p>
          <p className="mt-1 text-sm text-neutral-500 leading-relaxed">
            Komik dengan ID {comicId} tidak ditemukan.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="mt-2 inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-primary-600 px-5 py-3 text-base font-semibold text-white"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-dvh flex-col bg-[#f0f7ff]"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <header
        className="flex-shrink-0 border-b border-neutral-100 bg-white shadow-sm"
        style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}
      >
        <div className="mx-auto flex w-full max-w-[1400px] items-center gap-3 px-3 py-3 sm:px-4 md:px-6 md:py-4 lg:px-8">
          <Link
            href={`/comic/${comicId}/learn`}
            aria-label="Kembali ke pembelajaran"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Observasi</p>
            <h1 className="truncate text-base font-black leading-tight text-neutral-800 md:text-lg">
              {comic.title}
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#f0f7ff]">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-3 pb-24 pt-3 sm:px-4 md:max-w-3xl md:px-6 md:pb-28 md:pt-5 lg:px-8 lg:pb-32 lg:pt-6">
          <div className="rounded-[24px] bg-white px-4 py-6 text-center shadow-sm sm:px-6 sm:py-8 animate-fade-in-up">
            <div className="mb-4 text-3xl sm:text-5xl">🔭</div>
            <h2 className="text-xl font-black leading-snug text-neutral-900 sm:text-2xl">Observasi</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500 sm:text-base">
              Amati dan catat temuanmu di{' '}
              <span className="font-black text-primary-600">{comic.lokasi}</span>!
            </p>
          </div>

          <div className="rounded-[24px] bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5 animate-fade-in-up">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1.5 text-sm font-bold text-primary-700">
                📍 {comic.lokasi}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 px-3 py-1.5 text-sm font-bold text-secondary-700">
                📚 Kelas {comic.kelas}
              </span>
            </div>
            <h3 className="text-lg font-black leading-snug text-neutral-950 sm:text-xl">{comic.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500 sm:text-base">{comic.subtitle}</p>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-sm animate-fade-in-up">
            <div className="flex items-start gap-3 border-b border-neutral-100 px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-2xl">
                📝
              </div>
              <div>
                <h3 className="text-lg font-black text-neutral-900">Judul Observasi</h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                  Catat hasil pengamatanmu dengan singkat dan jelas.
                </p>
              </div>
            </div>

            <div className="px-4 py-4 sm:px-5 sm:py-5">
              <div className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700" htmlFor="bangun-ruang">
                      1. Bangun ruang apa yang paling dominan?
                    </label>
                    <select
                      id="bangun-ruang"
                      value={formData.bangunRuang}
                      onChange={(e) => handleChange('bangunRuang', e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    >
                      <option value="">Pilih bangun ruang</option>
                      {bangunRuangOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700" htmlFor="alasan">
                      2. Mengapa kamu memilih jawaban tersebut?
                    </label>
                    <textarea
                      id="alasan"
                      rows={4}
                      value={formData.alasan}
                      onChange={(e) => handleChange('alasan', e.target.value)}
                      placeholder="Jelaskan alasanmu..."
                      className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700" htmlFor="bagian-menarik">
                      3. Bagian objek mana yang paling menarik?
                    </label>
                    <textarea
                      id="bagian-menarik"
                      rows={4}
                      value={formData.bagianMenarik}
                      onChange={(e) => handleChange('bagianMenarik', e.target.value)}
                      placeholder="Tuliskan bagian yang paling menarik..."
                      className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700" htmlFor="hubungan-matematika">
                      4. Apa hubungan objek dengan materi matematika?
                    </label>
                    <textarea
                      id="hubungan-matematika"
                      rows={4}
                      value={formData.hubunganMatematika}
                      onChange={(e) => handleChange('hubunganMatematika', e.target.value)}
                      placeholder="Hubungkan dengan konsep matematika..."
                      className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="mx-4 mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 sm:mx-5">
                {errorMessage}
              </div>
            )}

            {savedNotice && (
              <div className="mx-4 mt-4 rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm font-semibold text-accent-700 sm:mx-5">
                ✓ Observasi berhasil disimpan.
              </div>
            )}

            {isLoading && (
              <div className="mx-4 mt-4 flex items-center gap-2 rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-700 sm:mx-5">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
                Menyimpan observasi...
              </div>
            )}

            <div className="sticky bottom-0 z-10 mt-6 border-t border-neutral-100 bg-white/95 px-4 py-4 backdrop-blur sm:px-5 sm:py-5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!isFormComplete || isSubmitting}
                  className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-2xl bg-primary-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-primary-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
                >
                  {isSubmitting ? 'Menyimpan...' : '💾 Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/comic/${comicId}/learn`)}
                  disabled={!isSaved}
                  className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-base font-semibold text-neutral-700 shadow-sm transition-all hover:border-primary-300 hover:text-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400"
                >
                  <div className="flex items-center gap-3">
                    <RobotMascot variant="mobile" />
                    <span>Lanjut ke AI Tutor</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
