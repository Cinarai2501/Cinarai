import qr13 from '@/features/comics/comic-2/assets/qr/13-objek-1.jpeg';
import qr15 from '@/features/comics/comic-2/assets/qr/15-objek-2.jpeg';
import qr17 from '@/features/comics/comic-2/assets/qr/17-objek-3.jpeg';
import qr18 from '@/features/comics/comic-2/assets/qr/18-objek-4.jpeg';

const qrAssets: Record<string, string> = {
  Umpang: qr15.src,
  'Bale Agung': qr13.src,
  'Candi Angka': qr17.src,
  Mensir: qr13.src,
  'Relief Lingkaran': qr18.src,
  'Ornamen Belah Ketupat': qr17.src,
  Persegi: qr13.src,
  'Persegi Panjang': qr15.src,
  Segitiga: qr17.src,
  'Belah Ketupat': qr18.src,
};

function normalizeObjectTitle(value: string): string {
  return value.trim().toLowerCase();
}

export function getComic2QrAssetForObject(objectTitle: string): string | undefined {
  const normalizedTitle = normalizeObjectTitle(objectTitle);
  if (!normalizedTitle) {
    return undefined;
  }

  const exactMatch = qrAssets[objectTitle];
  if (exactMatch) {
    return exactMatch;
  }

  const fallbackMatch = Object.entries(qrAssets).find(([title]) => normalizeObjectTitle(title) === normalizedTitle);
  return fallbackMatch?.[1];
}
