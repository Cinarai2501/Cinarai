"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from 'next/image';
import { ObjectAITutor } from '@/features/learning-engine/components/stages/ObjectAITutor';
import type { ComicAssetEntry } from '@/services/comic-assets/types';
import { resolveObjectDetailContent } from '@/features/learning-engine/components/stages/navigationStageContent';

export default function ObjectDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const decoded = decodeURIComponent(id);
  const comicId = Number(searchParams.get('comicId') ?? '1');
  const { object: obj, qrImage } = useMemo(() => resolveObjectDetailContent(comicId, decoded), [comicId, decoded]);
  const [isQrOpen, setIsQrOpen] = useState(false);

  if (!obj) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <p className="text-lg font-black">Objek tidak ditemukan</p>
          <button onClick={() => router.back()} className="mt-4 inline-flex rounded-lg bg-primary-600 px-4 py-2 text-white">Kembali</button>
        </div>
      </div>
    );
  }

  const handleOpenModel = () => {
    const url = obj.modelUrl || obj.embedUrl || '';
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 p-6">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-2xl font-black text-neutral-900">{obj.title}</h1>

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          {obj.navImage ? (
            <div className="mb-4 text-center">
              <Image
                src={obj.navImage}
                alt={obj.title}
                width={800}
                height={480}
                quality={100}
                priority
                unoptimized
                className="mx-auto rounded-xl object-cover"
                style={{ maxWidth: '100%' }}
              />
            </div>
          ) : null}

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-700">Deskripsi</p>
            <p className="mt-3 text-base leading-relaxed text-neutral-700">{obj.aiPrompt}</p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button onClick={handleOpenModel} className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-700">
              Lihat Model 3D
            </button>
            <button onClick={() => setIsQrOpen(true)} className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-900 transition hover:bg-neutral-50">
              Lihat QR
            </button>
            <button onClick={() => router.push(`/comic/${comicId}/learn`)} className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-900 transition hover:bg-neutral-50">
              Tutup Viewer
            </button>
          </div>
        </div>

        <ObjectAITutor
          objectId={obj.id}
          objectName={obj.title}
          provider={obj.provider}
          comicPage={obj.page}
          modelUrl={obj.modelUrl}
          entry={obj as unknown as ComicAssetEntry}
          initialPrompt={obj.aiPrompt}
        />
      </div>

      {isQrOpen && qrImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600">QR Code</p>
                <h2 className="mt-1 text-xl font-black text-neutral-900">{obj.title}</h2>
              </div>
              <button onClick={() => setIsQrOpen(false)} className="rounded-full border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700">Tutup</button>
            </div>

            <div className="mt-5 flex flex-col items-center gap-4">
              <Image src={qrImage} alt={`QR ${obj.title}`} width={360} height={360} className="rounded-2xl bg-white p-3 object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
