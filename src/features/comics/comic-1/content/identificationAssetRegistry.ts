import balokIcon from '@/features/comics/comic-1/assets/identification/Balok.png';
import kubusIcon from '@/features/comics/comic-1/assets/identification/Kubus.png';
import kerucutIcon from '@/features/comics/comic-1/assets/identification/Kerucut.png';
import prismaIcon from '@/features/comics/comic-1/assets/identification/Prismasegiempat.png';
import limasIcon from '@/features/comics/comic-1/assets/identification/Limassegiempat.png';

const COMIC1_IDENTIFICATION_ASSET_MAP: Record<string, string> = {
  Balok: balokIcon.src,
  Kubus: kubusIcon.src,
  Kerucut: kerucutIcon.src,
  'Prisma Segi Empat': prismaIcon.src,
  'Limas Segi Empat': limasIcon.src,
};

export function getComic1IdentificationAssetForObject(objectTitle: string): string | undefined {
  const normalized = objectTitle.trim();
  return COMIC1_IDENTIFICATION_ASSET_MAP[normalized];
}
