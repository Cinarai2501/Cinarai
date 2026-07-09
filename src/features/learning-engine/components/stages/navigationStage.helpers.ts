export function resolvePreviewImagePath(title: string, fallback = '/images/navigation/default.svg'): string {
  const normalized = title.toLowerCase();

  if (normalized.includes('kubus')) return '/images/navigation/kubus-preview.svg';
  if (normalized.includes('balok')) return '/images/navigation/balok-preview.svg';
  if (normalized.includes('limas')) return '/images/navigation/limas-preview.svg';
  if (normalized.includes('prisma')) return '/images/navigation/prisma-preview.svg';
  if (normalized.includes('kerucut')) return '/images/navigation/kerucut-preview.svg';
  if (normalized.includes('tabung')) return '/images/navigation/tabung.svg';

  return fallback;
}
