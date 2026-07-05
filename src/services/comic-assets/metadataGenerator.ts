import type { ClassifiedQr, ComicAssetEntry, ComicAssetGroup, ComicMetadata } from './types';

// ── Comic titles ───────────────────────────────────────────────────────────────

const COMIC_TITLES: Record<number, string> = {
  1: 'Petualangan Bangun Ruang Candi Jawi',
  2: 'Petualangan Simetri Candi Penataran',
  3: 'Petualangan di Rumah Gajah Mungkur',
  4: 'Petualangan di Jembatan Merah',
  5: 'Serunya Belajar Bangun Datar di Keraton Sumenep',
};

// ── Label map ─────────────────────────────────────────────────────────────────

const BUTTON_LABELS = {
  MODEL_3D: 'Lihat Model 3D',
  VIDEO: 'Tonton Video',
  QUIZ: 'Mulai Kuis',
  WEBSITE: 'Buka Link',
} as const;

// ── Core ──────────────────────────────────────────────────────────────────────

function toEntry(qr: ClassifiedQr): ComicAssetEntry | null {
  if (qr.category === 'UNKNOWN') return null;

  const provider = qr.category === 'MODEL_3D' ? 'sketchfab' : qr.category === 'VIDEO' ? 'video' : qr.category === 'QUIZ' ? 'quiz' : 'website';
  const qrUrl = qr.category === 'MODEL_3D'
    ? qr.page === 5
      ? '/qr/komik-1/page-5.png'
      : qr.page === 13
        ? '/qr/komik-1/page-13.png'
        : qr.page === 16
          ? '/qr/komik-1/page-16.png'
          : undefined
    : undefined;

  return {
    page: qr.page,
    title: qr.title?.trim() || 'Model 3D',
    buttonLabel: BUTTON_LABELS[qr.category],
    provider,
    url: qr.value,
    qrUrl,
  };
}

export function generateComicMetadata(
  comicId: number,
  pageCount: number,
  classifiedQrList: ClassifiedQr[]
): ComicMetadata {
  const assets: ComicAssetGroup = { model3D: [], quiz: [], video: [], website: [] };

  for (const qr of classifiedQrList) {
    const entry = toEntry(qr);
    if (!entry) continue;
    if (qr.category === 'MODEL_3D') assets.model3D.push(entry);
    else if (qr.category === 'QUIZ') assets.quiz.push(entry);
    else if (qr.category === 'VIDEO') assets.video.push(entry);
    else if (qr.category === 'WEBSITE') assets.website.push(entry);
  }

  return {
    comicId,
    title: COMIC_TITLES[comicId] ?? `Komik ${comicId}`,
    pageCount,
    assets,
  };
}

export function generateAllMetadata(
  comics: { comicId: number; pageCount: number; classifiedQrList: ClassifiedQr[] }[]
): ComicMetadata[] {
  return comics.map((c) => generateComicMetadata(c.comicId, c.pageCount, c.classifiedQrList));
}
