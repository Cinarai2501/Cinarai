"use client";

import { useMemo, useState } from "react";
import Image from 'next/image';
import { useRouter } from "next/navigation";
import { packageContent } from '@/features/comics/comic-1/content/packageContent';
import { getComic1QrAssetForObject } from '@/features/comics/comic-1/content/qrAssetRegistry';

export default function NavigationStage() {
  const router = useRouter();

  // Use packageContent as single source of truth for object list
  const objects = useMemo(() => packageContent.learningObjects.slice(0, 5), []);

  const candiEntry = packageContent.model3D.find((entry) => entry.title === 'Candi Jawi');
  const candiEmbed = candiEntry?.embedUrl ?? candiEntry?.arUrl ?? '';
  const candiQrImage = getComic1QrAssetForObject('Candi Jawi');
  const candiFullscreenUrl = candiEntry?.arUrl ?? candiEntry?.embedUrl ?? '';
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  return (
    <div className="flex min-w-0 flex-col gap-6 px-4 py-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-black text-neutral-900">NAVIGASI AR & AI</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-600">Gunakan tampilan ini untuk menavigasi objek Candi Jawi. Tekan Explore untuk membuka halaman detail objek yang berisi AI Tutor dan opsi model/QR.</p>
      </div>

      <section className="overflow-hidden rounded-[20px] border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          <h2 className="text-lg font-black text-neutral-900">Model 3D Candi Jawi</h2>
          <p className="text-sm text-neutral-600">Model utama Candi Jawi tampil di atas agar siswa langsung melihat struktur utama sebelum masuk ke objek bangun ruang.</p>
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

      {isQrModalOpen && candiQrImage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-[24px] border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600">QR Code</p>
                <h3 className="mt-1 text-xl font-black text-neutral-900">Candi Jawi</h3>
              </div>
              <button type="button" onClick={() => setIsQrModalOpen(false)} className="rounded-full border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700">Tutup</button>
            </div>
            <div className="mt-5 flex justify-center">
              <Image src={candiQrImage} alt="QR Candi Jawi" width={320} height={320} className="rounded-2xl border border-neutral-200 bg-white p-3 object-contain" />
            </div>
          </div>
        </div>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Daftar Objek</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {objects.map((obj) => (
            <div key={obj.id} className="flex h-full flex-col justify-between rounded-[16px] border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="space-y-2">
                <h3 className="text-base font-black text-neutral-900">{obj.title}</h3>
                <p className="text-sm leading-relaxed text-neutral-600">{obj.description}</p>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/viewer/object/${encodeURIComponent(obj.id)}`)}
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
