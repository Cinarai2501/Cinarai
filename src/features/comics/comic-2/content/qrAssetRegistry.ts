import { packageContent } from '@/features/comics/comic-2/content/packageContent';

const qrAssetMap = new Map<string, string>([
  ['balaiagung', 'balaiagung.png'],
  ['candiangka', 'candiangka.png'],
  ['candiinduk', 'candiinduk.png'],
  ['pendopo', 'pendopo.png'],
  ['reliefcandi', 'reliefcandi.png'],
  ['umpang', 'umpang.png'],
]);

export function getComic2QrAssetForObject(objectId: string): string | undefined {
  if (!objectId) {
    return undefined;
  }

  const object = packageContent.learningObjects.find((item) => item.id === objectId);
  return object?.qrImage;
}

export function resolveComic2ObjectByScanValue(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  const directMatch = packageContent.learningObjects.find((item) => item.id.toLowerCase() === normalized || item.title.toLowerCase() === normalized || item.id.toLowerCase().includes(normalized));

  if (directMatch) {
    return directMatch;
  }

  const scanKey = normalized
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '')
    .replace(/^(qr|kode|object|objek)/, '');

  const qrFileMatch = qrAssetMap.get(scanKey);
  if (!qrFileMatch) {
    return undefined;
  }

  return packageContent.learningObjects.find((item) => item.id.toLowerCase().includes(scanKey) || item.title.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '').includes(scanKey));
}
