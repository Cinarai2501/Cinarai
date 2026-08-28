export interface ComicObservationImage {
  imageSrc: string;
  sourcePdfPath: string | null;
  sourcePage: number;
}
const GENERATED_IMAGE_BASE = '/comics/generated';

export function resolveComicObservationImage({
  slug,
  pdfPath,
  page,
  generatedBase = GENERATED_IMAGE_BASE,
}: {
  slug: string;
  pdfPath: string | null;
  page?: number | null;
  generatedBase?: string;
}): ComicObservationImage {
  const safePage = typeof page === 'number' && page > 0 ? page : 1;
  return {
    imageSrc: `${generatedBase}/${slug}/page-${safePage}.png`,
    sourcePdfPath: pdfPath ?? null,
    sourcePage: safePage,
  };
}
export function buildObservationOverlaySvg({
  label,
  description,
}: {
  label: string;
  description: string;
}): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
      <rect width="1600" height="1000" fill="transparent" />
      <rect x="80" y="80" width="1440" height="840" rx="36" fill="transparent" stroke="#f59e0b" stroke-width="10" />
      <line x1="180" y1="840" x2="520" y2="840" stroke="#f59e0b" stroke-width="10" stroke-linecap="round" />
      <line x1="1180" y1="220" x2="1380" y2="220" stroke="#f59e0b" stroke-width="10" stroke-linecap="round" />
      <circle cx="310" cy="300" r="95" fill="transparent" stroke="#f59e0b" stroke-width="10" />
      <rect x="860" y="240" width="260" height="220" rx="24" fill="transparent" stroke="#f59e0b" stroke-width="10" />
      <path d="M1060 610 L1360 740" stroke="#f59e0b" stroke-width="10" stroke-linecap="round" />
      <rect x="220" y="720" width="360" height="120" rx="24" fill="#ffffff" fill-opacity="0.88" />
      <text x="260" y="780" font-family="Arial, sans-serif" font-size="48" font-weight="700" fill="#0f172a">${label}</text>
      <text x="260" y="830" font-family="Arial, sans-serif" font-size="24" font-weight="500" fill="#334155">${description}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

