import { getComic1IdentificationAssetForObject } from '@/features/comics/comic-1/content/identificationAssetRegistry';
import persegiIcon from '@/features/comics/comic-2/assets/identification/persegi.svg';
import persegiPanjangIcon from '@/features/comics/comic-2/assets/identification/persegi-panjang.svg';
import segitigaSamaSisiIcon from '@/features/comics/comic-2/assets/identification/segitiga-sama-sisi.svg';
import segitigaSamaKakiIcon from '@/features/comics/comic-2/assets/identification/segitiga-sama-kaki.svg';
import lingkaranIcon from '@/features/comics/comic-2/assets/identification/lingkaran.svg';
import belahKetupatIcon from '@/features/comics/comic-2/assets/identification/belah-ketupat.svg';

const COMIC2_ICON_MAP: Record<string, string> = {
  persegi: persegiIcon.src,
  'persegi panjang': persegiPanjangIcon.src,
  'segitiga sama sisi': segitigaSamaSisiIcon.src,
  'segitiga sama kaki': segitigaSamaKakiIcon.src,
  lingkaran: lingkaranIcon.src,
  'belah ketupat': belahKetupatIcon.src,
};

import persegiComic3Icon from '@/features/comics/comic-3/assets/identification/persegi.svg';
import persegiPanjangComic3Icon from '@/features/comics/comic-3/assets/identification/persegi-panjang.svg';
import segitigaComic3Icon from '@/features/comics/comic-3/assets/identification/segitiga.svg';
import trapesiumComic3Icon from '@/features/comics/comic-3/assets/identification/trapesium.svg';
import belahKetupatComic3Icon from '@/features/comics/comic-3/assets/identification/belah-ketupat.svg';
import lingkaranComic3Icon from '@/features/comics/comic-3/assets/identification/lingkaran.svg';

const COMIC3_ICON_MAP: Record<string, string> = {
  persegi: persegiComic3Icon.src,
  'persegi panjang': persegiPanjangComic3Icon.src,
  segitiga: segitigaComic3Icon.src,
  trapesium: trapesiumComic3Icon.src,
  'belah ketupat': belahKetupatComic3Icon.src,
  lingkaran: lingkaranComic3Icon.src,
};

const COMIC4_ICON_MAP: Record<string, string> = {
  persegi: '/images/identification/comic-4/persegi.svg',
  segitiga: '/images/identification/comic-4/segitiga.svg',
  lingkaran: '/images/identification/comic-4/lingkaran.svg',
};

const COMIC5_ICON_MAP: Record<string, string> = {
  lingkaran: '/images/identification/comic-5/lingkaran.svg',
  persegi: '/images/identification/comic-5/persegi.svg',
  segitiga: '/images/identification/comic-5/segitiga.svg',
};

export function resolveIdentificationOptionAsset(comicId: number, label: string, fallbackSrc: string): string {
  const normalizedLabel = label.trim().toLowerCase();

  if (comicId === 1) {
    const asset = getComic1IdentificationAssetForObject(label);
    if (asset) return asset;
  }

  if (comicId === 2) {
    return COMIC2_ICON_MAP[normalizedLabel] ?? fallbackSrc;
  }

  if (comicId === 3) {
    return COMIC3_ICON_MAP[normalizedLabel] ?? fallbackSrc;
  }

  if (comicId === 4) {
    return COMIC4_ICON_MAP[normalizedLabel] ?? fallbackSrc;
  }

  if (comicId === 5) {
    return COMIC5_ICON_MAP[normalizedLabel] ?? fallbackSrc;
  }

  return fallbackSrc;
}
