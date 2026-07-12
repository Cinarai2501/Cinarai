'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [visibleTutorCount, setVisibleTutorCount] = useState(0);

  const selectedOptionIds = useMemo(() => item.selectedOptionIds ?? [], [item.selectedOptionIds]);
  const selectedShapes = useMemo(() => item.options.filter((option) => selectedOptionIds.includes(option.id)).map((option) => option.text), [item.options, selectedOptionIds]);
  const correctOptionIds = useMemo(() => item.options.filter((option) => option.correct).map((option) => option.id), [item.options]);
  const correctOptionTexts = useMemo(() => item.options.filter((option) => option.correct).map((option) => option.text), [item.options]);
  const hasSelection = selectedOptionIds.length > 0;
  const isCorrect = selectedOptionIds.length === correctOptionIds.length
    && correctOptionIds.every((optionId) => selectedOptionIds.includes(optionId))
    && selectedOptionIds.every((optionId) => correctOptionIds.includes(optionId));

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

  useEffect(() => {
    if (!isChecked) return;
    setVisibleTutorCount(0);
  }, [selectedOptionIds, isChecked]);

  const isTutorComplete = isChecked && visibleTutorCount >= tutorExplanations.length;

  return (
    <div className="flex flex-col gap-4 rounded-[28px] border border-neutral-200 bg-white p-4 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.28)] sm:p-6">
      <div className="rounded-[22px] border border-primary-100 bg-primary-50/70 p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary-700">IDENTIFICATION</p>
        <p id={`question-${item.id}`} className="mt-2 text-base font-black leading-relaxed text-neutral-900">
          {item.question}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {item.options.map((option) => {
          const selected = selectedOptionIds.includes(option.id);
          return (
            <ShapeOptionCard
              key={option.id}
              label={option.text}
              selected={selected}
              onToggle={() => selectOption(item.id, option.id)}
            />
          );
        })}
      </div>

      {!isChecked && (
        <button
          type="button"
          disabled={!hasSelection}
          onClick={() => onCheck?.()}
          className={[
            'w-full rounded-2xl py-5 px-6 text-lg font-black uppercase tracking-[0.1em] transition duration-200',
            hasSelection
              ? 'bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98] shadow-lg shadow-primary-200'
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed',
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

                  <div className="mt-3 grid gap-2 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3 text-sm text-neutral-700 sm:grid-cols-2">
                    <p><span className="font-black text-neutral-900">Jumlah sisi:</span> {entry.faces}</p>
                    <p><span className="font-black text-neutral-900">Jumlah rusuk:</span> {entry.edges}</p>
                    <p><span className="font-black text-neutral-900">Jumlah titik sudut:</span> {entry.vertices}</p>
                    <p><span className="font-black text-neutral-900">Rumus luas permukaan:</span> {entry.surfaceFormula}</p>
                    <p className="sm:col-span-2"><span className="font-black text-neutral-900">Rumus volume:</span> {entry.volumeFormula}</p>
                  </div>

                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-neutral-700">
                    {entry.characteristics.map((characteristic) => (
                      <li key={`${entry.name}-${characteristic}`}>{characteristic}</li>
                    ))}
                  </ul>

                  <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                    <span className="font-black text-neutral-900">Lokasi bangun ruang pada Candi Jawi:</span> {entry.templeLocation}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-700">
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
              className="w-full rounded-2xl bg-primary-600 px-6 py-5 text-lg font-black uppercase tracking-[0.1em] text-white transition duration-200 hover:bg-primary-700 active:scale-[0.98] shadow-lg shadow-primary-200"
            >
              LANJUT
            </button>
          )}
        </div>
      )}
    </div>
  );
}
