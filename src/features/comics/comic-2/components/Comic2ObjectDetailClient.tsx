"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { QrModal } from "@/features/learning-engine/components/stages/QrModal";
import {
  resolveModelActionUrl,
  resolveObjectDetailContent,
} from "@/features/learning-engine/components/stages/navigationStageContent";

export default function Comic2ObjectDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const decoded = decodeURIComponent(id);
  const comicId = Number(searchParams.get("comicId") ?? "2");

  const { object: obj, qrImage, modelUrl } = useMemo(
    () => resolveObjectDetailContent(comicId, decoded),
    [comicId, decoded]
  );

  const [isQrOpen, setIsQrOpen] = useState(false);

  if (!obj) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <p className="text-lg font-black text-neutral-900">
            Objek tidak ditemukan
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary-600 px-5 py-2 text-sm font-bold text-white"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const handleOpenModel = () => {
    const url = modelUrl || resolveModelActionUrl(obj);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleTutupViewer = () => {
    router.push(`/comic/${comicId}/learn`);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
        {/* Judul */}
        <h1 className="text-2xl font-black text-neutral-900 sm:text-3xl">
          {obj.title}
        </h1>

        {/* Card konten */}
        <div className="mt-4 rounded-[20px] border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
          {/* Gambar */}
          {obj.navImage ? (
            <div className="mb-5 overflow-hidden rounded-[16px] border border-neutral-200 bg-neutral-50">
              <Image
                src={obj.navImage}
                alt={obj.title}
                width={800}
                height={480}
                quality={90}
                priority
                unoptimized
                className="h-auto w-full object-cover"
              />
            </div>
          ) : null}

          <div className="space-y-4">
            {/* Bangun datar */}
            <div className="rounded-[14px] border border-primary-100 bg-primary-50/70 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary-600">
                Bangun Datar
              </p>
              <p className="mt-1 text-base font-black text-neutral-900">
                {obj.shapeName ?? "—"}
              </p>
            </div>

            {/* Deskripsi singkat */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-500">
                Deskripsi Singkat
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-700">
                {obj.description}
              </p>
            </div>

            {/* Penjelasan sederhana */}
            {obj.aiPrompt ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-500">
                  Penjelasan Sederhana
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-700">
                  {obj.aiPrompt}
                </p>
              </div>
            ) : null}

            {/* Hubungan dengan simetri */}
            {obj.symmetryConnection ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-500">
                  Hubungan dengan Simetri
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-700">
                  {obj.symmetryConnection}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Tombol aksi — urutan tetap: Model 3D → QR → Tutup */}
        <div className="mt-4 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleOpenModel}
            className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-primary-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700 active:scale-[0.98]"
          >
            Lihat Model 3D
          </button>

          <button
            type="button"
            onClick={() => setIsQrOpen(true)}
            className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-bold text-neutral-900 transition-colors hover:bg-neutral-50 active:scale-[0.98]"
          >
            Lihat QR
          </button>

          <button
            type="button"
            onClick={handleTutupViewer}
            className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-bold text-neutral-900 transition-colors hover:bg-neutral-50 active:scale-[0.98]"
          >
            Tutup Viewer
          </button>
        </div>
      </div>

      <QrModal
        isOpen={isQrOpen && Boolean(qrImage)}
        qrSrc={qrImage ?? ""}
        onClose={() => setIsQrOpen(false)}
        title={obj.title}
        description={`Scan QR Code berikut untuk membuka ${obj.title} menggunakan perangkat lain.`}
      />
    </div>
  );
}
