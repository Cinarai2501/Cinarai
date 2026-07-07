'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { serverTimestamp } from 'firebase/firestore';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import { useComicMetadata } from '@/services/comic-assets/useComicMetadata';
import { useSnackbar } from '@/context/SnackbarContext';
import { useAuth } from '@/hooks/useAuth';
import { mergeFirestoreDocument } from '@/services/firestore';
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

function buildViewerPath(entry: ComicAssetEntry, comicId: number): string {
  const params = new URLSearchParams();
  params.set('url', entry.url);
  params.set('title', entry.title);
  params.set('comicId', String(comicId));
  params.set('page', String(entry.page));
  return `/viewer/3d?${params.toString()}`;
}

// ── Asset row ──────────────────────────────────────────────────────────────────

function AssetRow({ entry, onOpen }: { entry: ComicAssetEntry; onOpen?: (entry: ComicAssetEntry) => void }) {
  const hasValidUrl = isValidUrl(entry.url);
  const canOpen = Boolean(onOpen) && hasValidUrl;
  const title = entry.title?.trim() || 'Model 3D';

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-4">
      <div className="min-w-0">
        <p className="text-base font-black text-neutral-900">{title}</p>
        <p className="text-sm text-neutral-500">Halaman {entry.page}</p>
      </div>
      <button
        type="button"
        onClick={() => { if (canOpen) onOpen?.(entry); }}
        disabled={!canOpen}
        className={`flex min-h-[48px] w-full min-w-0 items-center justify-center rounded-2xl border px-4 text-base font-semibold touch-manipulation transition ${
          canOpen
            ? 'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100'
            : 'border-primary-200 bg-primary-50 text-primary-700 disabled:opacity-60'
        }`}
      >
        {entry.buttonLabel}
      </button>
    </div>
  );
}

// ── Observasi slide ────────────────────────────────────────────────────────────

const bangunRuangOptions = ['Kubus', 'Balok', 'Prisma', 'Limas', 'Tabung', 'Kerucut', 'Bola'];

interface ObservasiFormState {
  bangunRuang: string;
  alasan: string;
  bagianMenarik: string;
  hubunganMatematika: string;
}

interface ObservasiSlideProps {
  comicId: number;
  lokasi: string;
  onSaved: () => void;
}

function ObservasiSlide({ comicId, lokasi, onSaved }: ObservasiSlideProps) {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [formData, setFormData] = useState<ObservasiFormState>({
    bangunRuang: '',
    alasan: '',
    bagianMenarik: '',
    hubunganMatematika: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');

  const isComplete = Object.values(formData).every((v) => v.trim().length > 0);

  const handleChange = (field: keyof ObservasiFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSave = async () => {
    if (!isComplete) { setError('Semua pertanyaan wajib diisi.'); return; }
    if (!user) { setError('Silakan masuk terlebih dahulu.'); return; }

    setIsSaving(true);
    setError('');
    try {
      const docId = `${user.uid}_${comicId}_observasi`;
      await mergeFirestoreDocument('reflection', docId, {
        studentId: user.uid,
        userId: user.uid,
        moduleId: String(comicId),
        jawaban: { ...formData },
        timestamp: serverTimestamp(),
        status: 'completed',
        prompt: 'Observasi',
        response: JSON.stringify(formData),
        submittedAt: serverTimestamp(),
      });
      setIsSaved(true);
      showSnackbar('Observasi berhasil disimpan ✓', 'success');
      onSaved();
    } catch (err) {
      console.error('[NavigationStage] Gagal menyimpan observasi', err);
      setError('Gagal menyimpan. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
        <p className="text-sm font-semibold text-neutral-500">Lokasi</p>
        <p className="mt-0.5 text-base font-black text-neutral-900">{lokasi}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-neutral-700" htmlFor="nav-bangun-ruang">
            1. Bangun ruang apa yang paling dominan?
          </label>
          <select
            id="nav-bangun-ruang"
            value={formData.bangunRuang}
            onChange={(e) => handleChange('bangunRuang', e.target.value)}
            disabled={isSaved}
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:bg-neutral-50 disabled:text-neutral-500"
          >
            <option value="">Pilih bangun ruang</option>
            {bangunRuangOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-700" htmlFor="nav-alasan">
            2. Mengapa kamu memilih jawaban tersebut?
          </label>
          <textarea
            id="nav-alasan"
            rows={3}
            value={formData.alasan}
            onChange={(e) => handleChange('alasan', e.target.value)}
            disabled={isSaved}
            placeholder="Jelaskan alasanmu..."
            className="mt-2 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:bg-neutral-50 disabled:text-neutral-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-700" htmlFor="nav-bagian-menarik">
            3. Bagian objek mana yang paling menarik?
          </label>
          <textarea
            id="nav-bagian-menarik"
            rows={3}
            value={formData.bagianMenarik}
            onChange={(e) => handleChange('bagianMenarik', e.target.value)}
            disabled={isSaved}
            placeholder="Tuliskan bagian yang paling menarik..."
            className="mt-2 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:bg-neutral-50 disabled:text-neutral-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-700" htmlFor="nav-hubungan">
            4. Apa hubungan objek dengan materi matematika?
          </label>
          <textarea
            id="nav-hubungan"
            rows={3}
            value={formData.hubunganMatematika}
            onChange={(e) => handleChange('hubunganMatematika', e.target.value)}
            disabled={isSaved}
            placeholder="Hubungkan dengan konsep matematika..."
            className="mt-2 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:bg-neutral-50 disabled:text-neutral-500"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-2xl border border-error-200 bg-error-50 px-4 py-3 text-sm font-semibold text-error-700">
          {error}
        </p>
      )}

      {isSaved ? (
        <div className="rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm font-semibold text-accent-700">
          ✓ Observasi tersimpan. Tekan <strong>Lanjut</strong> untuk melanjutkan.
        </div>
      ) : (
        <button
          type="button"
          onClick={handleSave}
          disabled={!isComplete || isSaving}
          className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-primary-600 px-4 text-base font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Menyimpan...
            </>
          ) : (
            '💾 Simpan Observasi'
          )}
        </button>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

type SlideKey = 'model3d' | 'observasi';

interface Slide {
  key: SlideKey;
  icon: string;
  label: string;
}

export default function NavigationStage() {
  const { comic, setCanAdvance, registerSlideNav, unregisterSlideNav } = useLearningEngine();
  const { showSnackbar } = useSnackbar();
  const metadata = useComicMetadata(comic.id);
  const { model3D } = metadata.assets;

  const [slideIndex, setSlideIndex] = useState(0);
  const [observasiSaved, setObservasiSaved] = useState(false);

  const slides = useMemo<Slide[]>(() => {
    const result: Slide[] = [];
    if (model3D.length > 0) result.push({ key: 'model3d', icon: '🧊', label: 'Model 3D' });
    result.push({ key: 'observasi', icon: '📝', label: 'Observasi' });
    return result;
  }, [model3D]);

  const totalSlides = slides.length;
  const safeIndex = Math.min(slideIndex, totalSlides - 1);
  const currentSlide = slides[safeIndex];

  // canAdvance: on observasi slide, require saved; on other slides, always true
  const canAdvanceSlide = currentSlide?.key === 'observasi' ? observasiSaved : true;

  useEffect(() => {
    setCanAdvance(canAdvanceSlide);
  }, [canAdvanceSlide, setCanAdvance]);

  const goNext = useCallback(() => setSlideIndex((i) => Math.min(i + 1, totalSlides - 1)), [totalSlides]);
  const goPrev = useCallback(() => setSlideIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    registerSlideNav({
      slideIndex: safeIndex,
      totalSlides,
      canGoNext: safeIndex < totalSlides - 1,
      canGoPrev: safeIndex > 0,
      goNext,
      goPrev,
    });
  }, [safeIndex, totalSlides, goNext, goPrev, registerSlideNav]);

  useEffect(() => () => unregisterSlideNav(), [unregisterSlideNav]);

  function handleOpenModel3D(entry: ComicAssetEntry) {
    if (!isValidUrl(entry.url)) {
      showSnackbar('Model 3D belum tersedia.', 'info');
      return;
    }
    window.open(buildViewerPath(entry, comic.id), '_blank', 'noopener,noreferrer');
  }

  const showSlideProgress = totalSlides > 1;

  return (
    <div className="flex min-w-0 flex-col gap-3 overflow-x-hidden px-1 py-1 animate-fade-in-up sm:gap-4 sm:px-2">

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-2xl text-white shadow-sm">
            🧭
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-neutral-900">Navigasi Interaktif</h2>
            <p className="truncate text-base text-neutral-500">{comic.lokasi}</p>
          </div>
        </div>
      </div>

      {showSlideProgress && (
        <div className="flex items-center justify-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSlideIndex(i)}
              aria-label={s.label}
              className={[
                'h-2 rounded-full transition-all',
                i === safeIndex ? 'w-6 bg-primary-600' : 'w-2 bg-neutral-300',
              ].join(' ')}
            />
          ))}
        </div>
      )}

      {/* Slide header */}
      <div className="flex items-center gap-3 px-1">
        <span className="text-2xl">{currentSlide?.icon}</span>
        <h3 className="text-lg font-black text-neutral-900">{currentSlide?.label}</h3>
        {showSlideProgress && (
          <span className="ml-auto text-sm font-bold text-neutral-400">
            {safeIndex + 1} / {totalSlides}
          </span>
        )}
      </div>

      {/* Slide content */}
      {currentSlide?.key === 'model3d' && (
        <div className="flex flex-col gap-3">
          {model3D.map((entry) => (
            <AssetRow key={`${entry.page}-${entry.url}`} entry={entry} onOpen={handleOpenModel3D} />
          ))}
          <div className="rounded-2xl border border-primary-100 bg-primary-50/80 p-4 shadow-sm">
            <p className="text-sm font-semibold text-primary-800">
              Sudah melihat model 3D? Lanjutkan ke slide berikutnya untuk mencatat observasimu.
            </p>
          </div>
        </div>
      )}

      {currentSlide?.key === 'observasi' && (
        <ObservasiSlide
          comicId={comic.id}
          lokasi={comic.lokasi}
          onSaved={() => setObservasiSaved(true)}
        />
      )}

    </div>
  );
}
