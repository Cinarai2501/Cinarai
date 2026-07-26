"use client";

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ObjectAITutor } from '@/features/learning-engine/components/stages/ObjectAITutor';
import { resolveObjectDetailContent } from '@/features/learning-engine/components/stages/navigationStageContent';
import type { ComicAssetEntry } from '@/services/comic-assets/types';

export default function Comic3ObjectDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const decoded = decodeURIComponent(id);
  const comicId = Number(searchParams.get('comicId') ?? '3');
  const [showHighlight, setShowHighlight] = useState(false);

  const { object: obj } = useMemo(() => resolveObjectDetailContent(comicId, decoded), [comicId, decoded]);
  const imageSrc = showHighlight ? obj?.highlightImage ?? obj?.image ?? obj?.navImage ?? obj?.objectImage ?? '/images/navigation/default.svg' : obj?.image ?? obj?.navImage ?? obj?.objectImage ?? '/images/navigation/default.svg';
  const characteristics = (obj?.characteristics ?? []) as string[];
  const observationQuestion = obj?.observationQuestion ?? 'Perhatikan objek ini secara saksama.';

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

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 p-6">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-2xl font-black text-neutral-900">{obj.title}</h1>

        <div className="mt-6 rounded-[24px] border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="rounded-full bg-sky-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700 shadow-sm">Mode Observasi</div>

          {/* TODO: Placeholder sementara. Akan diganti menggunakan hasil crop panel komik setelah seluruh aset Comic 3 selesai. */}
          <div className="mt-6 overflow-hidden rounded-[20px] border border-neutral-200 bg-neutral-50 p-4">
            <Image
              src={imageSrc}
              alt={obj.title}
              width={900}
              height={540}
              quality={100}
              priority
              unoptimized
              className="mx-auto h-auto w-full max-w-[680px] object-contain"
            />
          </div>

          <div className="mt-6 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setShowHighlight((current) => !current)}
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
            >
              {showHighlight ? 'Tampilkan Normal' : 'Tampilkan Highlight'}
            </button>
          </div>

          <div className="mt-6 space-y-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-700">Nama Bangun Datar</p>
              <h2 className="mt-3 text-2xl font-black text-neutral-900">{obj.title}</h2>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-700">Deskripsi singkat</p>
              <p className="mt-2 text-base leading-relaxed text-neutral-700">{obj.description}</p>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-700">Ciri-ciri</p>
              <div className="mt-3 space-y-2">
                {characteristics.length > 0 ? (
                  <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-neutral-700">
                    {characteristics.map((item: string) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm leading-relaxed text-neutral-700">Coba amati objek ini dan temukan ciri-ciri bangun datar tersebut.</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-700">Pertanyaan Pemantik</p>
              <p className="mt-2 text-base leading-relaxed text-neutral-700">{observationQuestion}</p>
            </div>
          </div>

          <div className="mt-6">
            <ObjectAITutor
              objectId={obj.id}
              objectName={obj.title}
              provider={obj.provider}
              comicPage={obj.page}
              modelUrl={obj.modelUrl}
              entry={obj as unknown as ComicAssetEntry}
              initialPrompt={obj.aiPrompt}
              comicId={comicId}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => router.push(`/comic/${comicId}/learn`)}
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-primary-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-700"
            >
              Lanjut
            </button>
            <button
              onClick={() => router.back()}
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-bold text-neutral-900 transition hover:bg-neutral-50"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
