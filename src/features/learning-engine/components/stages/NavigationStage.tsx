"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { packageContent } from '@/features/comics/comic-1/content/packageContent';
import { COMIC_QR_DATA } from '@/data/comicQrData';

export default function NavigationStage() {
  const router = useRouter();

  // Use packageContent as single source of truth for object list
  const objects = useMemo(() => packageContent.learningObjects.slice(0, 5), []);

  // Sketchfab embed for full Candi Jawi (from COMIC_QR_DATA)
  const candiEntry = COMIC_QR_DATA[1]?.qrList?.[0];
  const candiEmbed = candiEntry?.qrUrl ?? '';

  return (
    <div className="flex min-w-0 flex-col gap-6 px-4 py-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-black text-neutral-900">NAVIGASI AR & AI</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-600">Gunakan tampilan ini untuk menavigasi objek Candi Jawi. Tekan Explore untuk membuka halaman detail objek yang berisi AI Tutor dan opsi model/QR.</p>
      </div>

      {candiEmbed ? (
        <section className="overflow-hidden rounded-[20px] bg-white shadow-sm">
          <div className="relative aspect-[16/9] w-full">
            <iframe
              src={candiEmbed}
              title="Candi Jawi"
              className="absolute inset-0 h-full w-full border-0"
              allow="fullscreen"
            />
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Daftar Objek</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {objects.map((obj) => (
            <div key={obj.id} className="rounded-[12px] border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-neutral-900">{obj.title}</h3>
                  <p className="mt-1 text-sm text-neutral-500">Komik {packageContent.metadata.comicId} • Halaman {obj.page}</p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => router.push(`/viewer/object/${encodeURIComponent(obj.id)}`)}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-primary-600 px-3 py-2 text-sm font-bold text-white"
                  >
                    Explore
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
