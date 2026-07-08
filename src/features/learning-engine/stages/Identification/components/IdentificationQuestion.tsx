'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { IdentificationItem } from '../types';
import { useIdentificationContext } from '../context/IdentificationContext';
import IdentificationOptionGrid from './IdentificationOptionGrid';
import IdentificationFeedback from './IdentificationFeedback';

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
  const { selectOption, state } = useIdentificationContext();
  const [imgError, setImgError] = useState(false);

  const hasSelection = item.selectedOptionId !== null;
  const isCorrect = item.selectedOptionId === item.correctOptionId;
  const selectedOption = item.options.find((o) => o.id === item.selectedOptionId) ?? null;
  const correctOption = item.options.find((o) => o.id === item.correctOptionId) ?? null;
  const totalItems = state.items.length;

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-neutral-200 bg-white p-5 shadow-lg shadow-neutral-100 sm:p-6">
      {/* Gambar objek */}
      <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50">
        <div className="relative aspect-[16/10] w-full bg-neutral-100">
          {imgError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-100">
              <svg className="h-12 w-12 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v8l3-3m0 0l3 3m-3-3V4" />
              </svg>
              <p className="text-sm font-semibold text-neutral-400">Gagal memuat gambar — {item.imageAlt}</p>
            </div>
          ) : (
            <>
              <Image
                src={item.image}
                alt={item.imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 640px"
                priority={item.targetIndex === 0}
                onError={() => setImgError(true)}
              />

              {/* Overlay edukatif: outline, panah, label — rendered by component */}
              <div className="absolute inset-0 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                  {/* Simple overlays per type */}
                  {item.overlayType === 'body' && (
                    <g>
                      <rect x="30" y="18" width="40" height="26" fill="none" stroke="#ffb86b" strokeWidth="1.5" rx="2" />
                      <path d="M70 22 L85 12" stroke="#ffb86b" strokeWidth="1.2" fill="none" markerEnd="url(#arrow)" />
                      <rect x="74" y="6" width="22" height="8" rx="2" fill="#ffb86b" opacity="0.95" />
                      <text x="85" y="11" fontSize="6" fontWeight="700" fill="#1f2937" textAnchor="middle">Balok</text>
                    </g>
                  )}
                  {item.overlayType === 'kaki' && (
                    <g>
                      <rect x="28" y="36" width="44" height="14" fill="none" stroke="#7ee787" strokeWidth="1.5" rx="1" />
                      <path d="M45 34 L55 26" stroke="#7ee787" strokeWidth="1.2" fill="none" />
                      <rect x="18" y="18" width="28" height="8" rx="2" fill="#7ee787" opacity="0.95" />
                      <text x="32" y="24" fontSize="5" fontWeight="700" fill="#064e3b">Kubus</text>
                    </g>
                  )}
                  {item.overlayType === 'puncak' && (
                    <g>
                      <path d="M50 6 L60 26 L40 26 Z" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
                      <path d="M62 20 L78 12" stroke="#60a5fa" strokeWidth="1.2" />
                      <rect x="72" y="6" width="24" height="8" rx="2" fill="#60a5fa" opacity="0.95" />
                      <text x="84" y="11" fontSize="5.5" fontWeight="700" fill="#0f172a">Kerucut</text>
                    </g>
                  )}
                  {item.overlayType === 'atap' && (
                    <g>
                      <path d="M30 14 L70 14 L50 34 Z" fill="none" stroke="#f472b6" strokeWidth="1.5" />
                      <path d="M72 18 L86 12" stroke="#f472b6" strokeWidth="1.2" />
                      <rect x="74" y="6" width="28" height="8" rx="2" fill="#f472b6" opacity="0.95" />
                      <text x="88" y="11" fontSize="5" fontWeight="700" fill="#5b1055">Limas</text>
                    </g>
                  )}
                  {item.overlayType === 'dinding' && (
                    <g>
                      <rect x="20" y="18" width="60" height="28" fill="none" stroke="#f97316" strokeWidth="1.5" />
                      <path d="M82 22 L94 14" stroke="#f97316" strokeWidth="1.2" />
                      <rect x="86" y="6" width="28" height="8" rx="2" fill="#f97316" opacity="0.95" />
                      <text x="100" y="11" fontSize="5" fontWeight="700" fill="#7c2d12">Prisma</text>
                    </g>
                  )}
                  <defs>
                    <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <path d="M0 0 L6 3 L0 6 z" fill="#ffb86b" />
                    </marker>
                  </defs>
                </svg>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Nomor soal + pertanyaan */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-base font-black text-white">
          {item.targetIndex + 1}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
            Soal {item.targetIndex + 1} dari {totalItems}
          </p>
          <p className="mt-1 text-base font-black leading-snug text-neutral-900 sm:text-lg">
            {item.question}
          </p>
        </div>
        {isChecked && (
          <span
            className={[
              'flex-shrink-0 rounded-full px-3 py-1.5 text-sm font-black',
              isCorrect ? 'bg-accent-100 text-accent-700' : 'bg-error-100 text-error-700',
            ].join(' ')}
          >
            {isCorrect ? '✓ Benar' : '✗ Kurang Tepat'}
          </span>
        )}
      </div>

      {/* Pilihan jawaban */}
      <div className="space-y-3">
        <IdentificationOptionGrid
          options={item.options}
          selectedOptionId={item.selectedOptionId}
          correctOptionId={isChecked ? item.correctOptionId : null}
          isAnswered={isChecked}
          disabled={isChecked}
          onSelect={(optionId) => selectOption(item.id, optionId)}
        />

        {!isChecked && onCheck && (
          <button
            type="button"
            disabled={!hasSelection}
            onClick={onCheck}
            className={[
              'w-full rounded-2xl py-4 text-base font-black transition duration-200',
              hasSelection
                ? 'bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98]'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed',
            ].join(' ')}
          >
            CEK JAWABAN
          </button>
        )}

        {isChecked && (
          <IdentificationFeedback
            isCorrect={isCorrect}
            selectedOptionText={selectedOption?.text ?? 'Belum dijawab'}
            correctOptionText={correctOption?.text ?? '-'}
            explanation={item.explanation}
            showCorrectOption={!isCorrect}
          />
        )}
      </div>
    </div>
  );
}
