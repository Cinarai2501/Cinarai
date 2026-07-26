"use client";

import { useEffect, useMemo, useState } from "react";
import Image from 'next/image';
import { useRouter } from "next/navigation";
import { useAuth } from '@/hooks/useAuth';
import { loadComicProgress, saveComicProgress } from '@/services/comicProgress';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import { resolveNavigationStageContent } from './navigationStageContent';
import { QrModal } from './QrModal';

export default function NavigationStage() {
  const router = useRouter();
  const { user } = useAuth();
  const { comic, comicModule } = useLearningEngine();

  const navigationContent = useMemo(() => resolveNavigationStageContent(comic.id), [comic.id]);
  const { objects, heroModelEntry, heroQrImage } = navigationContent;

  const navigationAssets = comicModule.navigationAssets ?? {
    has3DModel: true,
    hasQRCode: true,
    hasExplore: true,
    hasAITutor: true,
  };

  const candiEntry = heroModelEntry;
  const candiEmbed = navigationAssets.has3DModel && candiEntry && 'embedUrl' in candiEntry ? candiEntry.embedUrl ?? '' : '';
  const candiQrImage = navigationAssets.hasQRCode ? heroQrImage : '';
  const candiFullscreenUrl = navigationAssets.has3DModel && candiEntry && 'arUrl' in candiEntry
    ? candiEntry.arUrl ?? candiEntry.embedUrl ?? ''
    : candiEntry && 'embedUrl' in candiEntry
      ? candiEntry.embedUrl ?? ''
      : '';

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [objectVisited, setObjectVisited] = useState<string[]>([]);
  const [openedObjects, setOpenedObjects] = useState<string[]>([]);
  const [hasHydratedProgress, setHasHydratedProgress] = useState(false);

  useEffect(() => {
    if (!user?.uid || !hasHydratedProgress) return;
    void saveComicProgress(user.uid, comic.id, {
      stageData: {
        navigation: {
          objectVisited,
          openedObjects,
        },
      },
    });
  }, [comic.id, hasHydratedProgress, objectVisited, openedObjects, user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    void (async () => {
      try {
        const document = await loadComicProgress(user.uid, comic.id);
        if (!active) return;
        const stageData = document?.stageData?.navigation;
        if (stageData) {
          if (Array.isArray(stageData.objectVisited)) {
            setObjectVisited(stageData.objectVisited);
          }
          if (Array.isArray(stageData.openedObjects)) {
            setOpenedObjects(stageData.openedObjects);
          }
        }
        setHasHydratedProgress(true);
      } catch (error) {
        console.error('[NavigationStage] gagal memuat progress', error);
      }
    })();
    return () => {
      active = false;
    };
  }, [comic.id, user?.uid]);

  const isComic3FallbackNavigation = comicModule.navigationAssets?.has3DModel === false && comicModule.navigationAssets?.hasQRCode === false;

  return (
    <div className="flex min-w-0 flex-col gap-4 px-4 py-4 sm:gap-6 sm:py-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-black text-neutral-900">NAVIGASI AR & AI</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-600">Gunakan tampilan ini untuk menavigasi objek pembelajaran yang sesuai dengan komik yang sedang dibuka. Tekan Explore untuk membuka halaman detail objek yang berisi AI Tutor dan opsi model/QR.</p>
      </div>

      {isComic3FallbackNavigation ? (
        <section className="overflow-hidden rounded-[20px] border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="space-y-3">
            <h2 className="text-lg font-black text-neutral-900">Informasi Pembelajaran</h2>
            <p className="text-sm text-neutral-600">Komik ini menggunakan AI Tutor dan fitur Explore sebagai media pembelajaran. Model 3D dan QR Code tidak tersedia pada materi ini.</p>
          </div>
        </section>
      ) : (
        <section className="overflow-hidden rounded-[20px] border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="space-y-3">
            <h2 className="text-lg font-black text-neutral-900">Model 3D Candi Jawi</h2>
            <p className="text-sm text-neutral-600">Scan QR Code berikut untuk membuka Model 3D Candi Jawi menggunakan perangkat lain.</p>
          </div>
          {candiEmbed ? (
            <div className="mt-4 overflow-hidden rounded-[16px] border border-neutral-200">
              <div className="relative aspect-[16/9] w-full">
                <iframe
                  src={candiEmbed}
                  title="Candi Jawi"
                  className="absolute inset-0 h-full w-full border-0"
                  allow="fullscreen"
                />
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                if (candiFullscreenUrl) {
                  window.open(candiFullscreenUrl, '_blank', 'noopener,noreferrer');
                }
              }}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white"
            >
              Buka Fullscreen
            </button>
            {candiQrImage ? (
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-bold text-neutral-900"
              >
                Lihat QR
              </button>
            ) : null}
          </div>
        </section>
      )}

      <QrModal
        isOpen={isQrModalOpen && Boolean(candiQrImage)}
        qrSrc={candiQrImage ?? ''}
        onClose={() => setIsQrModalOpen(false)}
        title="Model 3D Candi Jawi"
        description="Scan QR Code berikut untuk membuka Model 3D Candi Jawi menggunakan perangkat lain."
      />

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Daftar Objek</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {objects.map((obj) => (
            <div key={obj.id} className="flex h-full flex-col justify-between rounded-[16px] border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="space-y-2">
                {obj.navImage ? (
                  <div className="relative mb-3 h-28 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                    <Image
                      src={obj.navImage}
                      alt={obj.title}
                      width={600}
                      height={600}
                      quality={100}
                      priority
                      unoptimized
                      className="h-full w-full object-cover rounded-xl"
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                ) : null}
                <h3 className="text-base font-black text-neutral-900">{obj.title}</h3>
                <p className="text-sm leading-relaxed text-neutral-600">{obj.description}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setObjectVisited((prev) => Array.from(new Set([...prev, obj.id])));
                  setOpenedObjects((prev) => Array.from(new Set([...prev, obj.id])));
                  router.push(`/viewer/object/${encodeURIComponent(obj.id)}?comicId=${comic.id}`);
                }}
                className="mt-4 inline-flex min-h-[40px] items-center justify-center rounded-lg bg-primary-600 px-3 py-2 text-sm font-bold text-white"
              >
                Explore
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
