'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { renderPdfPageToBlobUrl } from '@/lib/comic-image';
import { useLearningEngine } from '../../../hooks/useLearningEngine';
import type { IdentificationItem } from '../types';
import { useIdentificationContext } from '../context/IdentificationContext';
import IdentificationFeedback from './IdentificationFeedback';
import ShapeOptionCard from './ui/ShapeOptionCard';
import { buildIdentificationTutorExplanations } from '../services/identificationService';

interface IdentificationQuestionProps {
  item: IdentificationItem;
  isChecked: boolean;
  onCheck?: () => void;
}

export default function IdentificationQuestion({
  item,
  isChecked,
  onCheck,
}: IdentificationQuestionProps) {
  const { selectOption } = useIdentificationContext();
  const { setCanAdvance, nextStage } = useLearningEngine();
  const [imgError, setImgError] = useState(false);
  const [renderedImageSrc, setRenderedImageSrc] = useState<string | null>(null);
  const [visibleTutorCount, setVisibleTutorCount] = useState(0);

  const effectiveImageSrc = renderedImageSrc ?? item.image;
  const hasImage = Boolean(effectiveImageSrc) && !imgError;
  const selectedOptionIds = useMemo(() => item.selectedOptionIds ?? (item.selectedOptionId ? [item.selectedOptionId] : []), [item.selectedOptionIds, item.selectedOptionId]);
  const selectedShapes = useMemo(() => item.options.filter((option) => selectedOptionIds.includes(option.id)).map((option) => option.text), [item.options, selectedOptionIds]);
  const correctOptionTexts = useMemo(() => item.options.filter((option) => option.correct).map((option) => option.text), [item.options]);
  const hasSelection = selectedOptionIds.length > 0;
  const isCorrect = selectedOptionIds.length === correctOptionTexts.length && correctOptionTexts.every((text) => selectedShapes.includes(text));

  useEffect(() => {
    let isActive = true;

    async function tryRenderPdfPage() {
      if (!item.sourcePdfPath || !item.sourcePage || renderedImageSrc) return;
      try {
        const blobUrl = await renderPdfPageToBlobUrl(item.sourcePdfPath, item.sourcePage);
        if (isActive) setRenderedImageSrc(blobUrl);
      } catch {
        if (isActive) setImgError(false);
      }
    }

    void tryRenderPdfPage();

    return () => {
      isActive = false;
    };
  }, [item.sourcePdfPath, item.sourcePage, renderedImageSrc]);

  const tutorExplanations = useMemo(() => buildIdentificationTutorExplanations(selectedShapes), [selectedShapes]);

  useEffect(() => {
    if (!isChecked) {
      setVisibleTutorCount(0);
      setCanAdvance(false);
      return;
    }

    if (tutorExplanations.length === 0) {
      setVisibleTutorCount(0);
      setCanAdvance(true);
      return;
    }

    setVisibleTutorCount(0);
    const timers = tutorExplanations.map((_, index) =>
      window.setTimeout(() => {
        setVisibleTutorCount((current) => (index + 1 > current ? index + 1 : current));
        if (index === tutorExplanations.length - 1) {
          setCanAdvance(true);
        }
      }, 220 + index * 500),
    );

    return () => {
      timers.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [isChecked, setCanAdvance, tutorExplanations]);

  const handleCheck = () => {
    if (onCheck) onCheck();
  };

  const isTutorComplete = isChecked && visibleTutorCount >= tutorExplanations.length;

  return (
    <div className="flex flex-col gap-4 rounded-[28px] border border-neutral-200 bg-white p-4 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.28)] sm:p-6">
      <figure className="overflow-hidden rounded-[24px] border border-neutral-100" aria-label={`Gambar observasi: ${item.imageAlt}`}>
        <div className="relative w-full" style={{ aspectRatio: '16/10' }}>
          {hasImage ? (
            <>
              <Image
                src={effectiveImageSrc}
                alt={item.imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
                priority={item.targetIndex === 0}
                loading={item.targetIndex === 0 ? undefined : 'lazy'}
                aria-describedby={`question-${item.id}`}
                onError={() => setImgError(true)}
              />
              {item.highlight && (
                <Image
                  src={item.highlight}
                  alt=""
                  fill
                  className="pointer-events-none object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
                  aria-hidden="true"
                />
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-primary-50 px-6 text-center" role="img" aria-label={item.imageAlt}>
              <span className="text-5xl">🏛️</span>
              <p className="text-sm font-bold leading-snug text-primary-700">{item.imageAlt}</p>
              <p className="text-xs text-primary-400">Amati bagian candi yang terlihat pada foto</p>
            </div>
          )}
        </div>
      </figure>

      <div className="rounded-[22px] border border-primary-100 bg-primary-50/70 p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary-700">IDENTIFICATION</p>
        <p id={`question-${item.id}`} className="mt-2 text-base font-black leading-relaxed text-neutral-900">
          Apa saja bangun ruang yang kamu temukan di Candi Jawi?
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {item.options.map((option) => {
          const selected = selectedOptionIds.includes(option.id);
          return (
            <ShapeOptionCard
              key={option.id}
              label={option.text}
              icon={option.text === 'Kubus' ? '🧊' : option.text === 'Balok' ? '📦' : option.text === 'Limas' ? '🔺' : option.text === 'Prisma' ? '🏗️' : option.text === 'Kerucut' ? '🍦' : option.text === 'Tabung' ? '🧪' : option.text === 'Bola' ? '⚽' : '🧩'}
              selected={selected}
              disabled={isChecked}
              onToggle={() => selectOption(item.id, option.id)}
            />
          );
        })}
      </div>

      {!isChecked && (
        <button
          type="button"
          disabled={!hasSelection}
          onClick={handleCheck}
          className={[
            'w-full rounded-2xl py-4 text-base font-black transition duration-200',
            hasSelection ? 'bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98]' : 'bg-neutral-100 text-neutral-400 cursor-not-allowed',
          ].join(' ')}
        >
          CEK JAWABAN
        </button>
      )}

      {isChecked && (
        <div className="space-y-3">
          <IdentificationFeedback
            isCorrect={isCorrect}
            selectedOptionText={selectedShapes.join(', ') || 'Belum dijawab'}
            correctOptionText={correctOptionTexts.join(', ') || '-'}
            explanation={item.explanation}
            showCorrectOption={!isCorrect}
          />
          <div className="rounded-[22px] border border-accent-200 bg-accent-50/80 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-accent-700">AI Tutor</p>
            <div className="mt-3 space-y-3">
              {tutorExplanations.slice(0, visibleTutorCount).map((entry, index) => (
                <div
                  key={`${entry.name}-${index}`}
                  className="animate-fade-in-up rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">{entry.icon}</span>
                      <div>
                        <p className="text-sm font-black text-accent-700">{entry.name}</p>
                        <p className="mt-1 text-[11px] font-black uppercase tracking-[0.25em] text-accent-600">{entry.statusLabel}</p>
                      </div>
                    </div>
                    <span className={['inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.25em]', entry.foundInTemple ? 'bg-accent-100 text-accent-700' : 'bg-error-100 text-error-700'].join(' ')}>
                      {entry.badgeLabel}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-neutral-700">{entry.definition}</p>

                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-neutral-700">
                    {entry.characteristics.map((characteristic) => (
                      <li key={`${entry.name}-${characteristic}`}>{characteristic}</li>
                    ))}
                  </ul>

                  <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                    <span className="font-black text-neutral-900">Penjelasan:</span> {entry.explanation}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                    <span className="font-black text-neutral-900">Hubungan dengan komik:</span> {entry.comicReference}
                  </p>

                  <div className="mt-3 rounded-2xl border border-primary-100 bg-primary-50/70 p-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.25em] text-primary-700">Refleksi</p>
                    <p className="mt-1 text-sm font-semibold text-neutral-800">{entry.reflectionQuestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {isTutorComplete && (
            <button
              type="button"
              onClick={() => void nextStage()}
              className="w-full rounded-2xl bg-primary-600 px-4 py-4 text-base font-black text-white transition duration-200 hover:bg-primary-700 active:scale-[0.98]"
            >
              LANJUT
            </button>
          )}
        </div>
      )}
    </div>
  );
}
