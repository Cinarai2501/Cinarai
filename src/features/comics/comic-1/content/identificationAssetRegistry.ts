import balokIcon from '@/features/comics/comic-1/assets/identification/Balok.png';
import kubusIcon from '@/features/comics/comic-1/assets/identification/Kubus.png';
import kerucutIcon from '@/features/comics/comic-1/assets/identification/Kerucut.png';
import prismaIcon from '@/features/comics/comic-1/assets/identification/Prismasegiempat.png';
import limasIcon from '@/features/comics/comic-1/assets/identification/Limassegiempat.png';

function normalizeObjectTitle(objectTitle: string): string {
  return objectTitle.trim().toLowerCase();
}

const COMIC1_IDENTIFICATION_ASSET_MAP: Record<string, string> = {
  balok: balokIcon.src,
  kubus: kubusIcon.src,
  kerucut: kerucutIcon.src,
  'prisma segi empat': prismaIcon.src,
  'limas segi empat': limasIcon.src,
};

export function getComic1IdentificationAssetForObject(objectTitle: string): string | undefined {
  return COMIC1_IDENTIFICATION_ASSET_MAP[normalizeObjectTitle(objectTitle)];
}
