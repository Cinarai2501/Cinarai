import { getComicModule } from '@/features/comics';
import { getComic1QrAssetForObject } from '@/features/comics/comic-1/content/qrAssetRegistry';
import { getComic2QrAssetForObject } from '@/features/comics/comic-2/content/qrAssetRegistry';

export function resolveNavigationStageContent(comicId: number) {
  const comicModule = getComicModule(comicId);
  const objects = comicModule.navigation.learningObjects.slice(0, 5);
  const heroModelEntry = comicModule.navigation.model3D.find((entry) => entry.title === 'Persegi' || entry.title === 'Candi Jawi' || entry.title === comicModule.metadata.title);
  const heroQrImage = comicId === 2
    ? getComic2QrAssetForObject(heroModelEntry?.title ?? 'Persegi')
    : getComic1QrAssetForObject(heroModelEntry?.title ?? 'Candi Jawi');

  return {
    comicModule,
    objects,
    heroModelEntry,
    heroQrImage,
  };
}

export function resolveObjectDetailContent(comicId: number, objectId: string) {
  const comicModule = getComicModule(comicId);
  const object = comicModule.navigation.learningObjects.find((item) => item.id === objectId);
  const qrImage = comicId === 2
    ? getComic2QrAssetForObject(object?.title ?? '')
    : getComic1QrAssetForObject(object?.title ?? '');

  return {
    comicModule,
    object,
    qrImage,
  };
}
