'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { getComic1IdentificationAssetForObject } from '@/features/comics/comic-1/content/identificationAssetRegistry';
import persegiIcon from '@/features/comics/comic-2/assets/identification/icons/persegi.svg';
import persegiPanjangIcon from '@/features/comics/comic-2/assets/identification/icons/persegi-panjang.svg';
import segitigaSisiIcon from '@/features/comics/comic-2/assets/identification/icons/segitiga-sama-sisi.svg';
import segitigaKakiIcon from '@/features/comics/comic-2/assets/identification/icons/segitiga-sama-kaki.svg';
import lingkaranIcon from '@/features/comics/comic-2/assets/identification/icons/lingkaran.svg';
import belahKetupatIcon from '@/features/comics/comic-2/assets/identification/icons/belah-ketupat.svg';

interface ShapeOptionCardProps {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

export default function ShapeOptionCard({ label, selected, disabled = false, onToggle }: ShapeOptionCardProps) {
  const iconSrc = useMemo(() => {
    const normalizedLabel = label.trim().toLowerCase();
    const comic1Asset = getComic1IdentificationAssetForObject(normalizedLabel);
    if (comic1Asset) {
      return comic1Asset;
    }

    const iconMap: Record<string, string> = {
      persegi: persegiIcon.src,
      'persegi panjang': persegiPanjangIcon.src,
      'segitiga sama sisi': segitigaSisiIcon.src,
      'segitiga sama kaki': segitigaKakiIcon.src,
      lingkaran: lingkaranIcon.src,
      'belah ketupat': belahKetupatIcon.src,
    };

    return iconMap[normalizedLabel] ?? persegiIcon.src;
  }, [label]);

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={[
        'flex w-full min-h-[72px] items-center gap-3 rounded-[20px] border px-3 py-2.5 text-left shadow-sm transition-all duration-200 active:scale-[0.98] sm:gap-4 sm:px-4',
        selected
          ? 'border-primary-500 bg-primary-50 shadow-primary-100'
          : 'border-neutral-200 bg-white hover:border-primary-300 hover:bg-primary-50',
        disabled ? 'cursor-default opacity-85' : 'cursor-pointer',
      ].join(' ')}
    >
      <div className={[
        'flex h-[48px] w-[48px] flex-shrink-0 items-center justify-center overflow-hidden rounded-[16px] p-1 sm:h-[56px] sm:w-[56px]',
        selected ? 'bg-white' : 'bg-primary-50/80',
      ].join(' ')}>
        <Image src={iconSrc} alt={label} width={56} height={56} className="h-[44px] w-[44px] object-contain sm:h-[52px] sm:w-[52px]" />
      </div>

      <span className="flex-1 text-[15px] font-black uppercase tracking-[0.14em] text-neutral-800 sm:text-base">
        {label}
      </span>

      <span
        className={[
          'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200',
          selected
            ? 'border-primary-600 bg-primary-600'
            : 'border-neutral-300 bg-white hover:border-primary-400',
        ].join(' ')}
      >
        {selected && (
          <svg
            className="h-4 w-4 text-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
    </button>
  );
}

