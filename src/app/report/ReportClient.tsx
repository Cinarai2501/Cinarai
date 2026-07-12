'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { firestore } from '@/lib/firebase/client';
import { getComicById } from '@/lib/comicRepository';
import type { Comic } from '@/types/comic';
import type { ComicProgressDocument } from '@/types/firestore';
import { loadComicModule } from '@/features/comics';

export default function ReportClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [comic, setComic] = useState<Comic | null>(null);
  const [progressDoc, setProgressDoc] = useState<ComicProgressDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setIsLoading(false);
      return;
    }

    const comicIdParam = searchParams.get('comicId');
    const comicId = Number(comicIdParam ?? '0');
    const comicData = getComicById(comicId);
    setComic(comicData ?? null);

    const ref = doc(firestore, 'users', user.uid, 'progress', `comic-${comicId}`);
    void getDoc(ref)
      .then((snap) => {
        if (!snap.exists()) {
          setProgressDoc(null);
          return;
        }

        const data = snap.data() as ComicProgressDocument;
        setProgressDoc(data);
      })
      .catch(() => {
        setProgressDoc(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [loading, searchParams, user]);

  const introspection = useMemo(() => progressDoc?.introspection, [progressDoc]);
  const checklist = introspection?.checklist ?? [];
  const reflectionText = introspection?.reflectionText ?? '';
  const confidence = introspection?.confidence ?? null;
  const aiReflection = introspection?.aiReflection && typeof introspection.aiReflection !== 'string'
    ? introspection.aiReflection
    : null;
  const reportReady = Boolean(introspection?.completed);
  const comicModule = useMemo(
    () => loadComicModule(comic?.id ?? 0),
    [comic?.id],
  );
  const learnedShapes = useMemo(
    () => comicModule.report.learnedShapes.map((shape) => ({ id: shape, title: shape })),
    [comicModule.report.learnedShapes],
  );

  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f7ff] px-4 py-10">
        <div className="w-full max-w-2xl rounded-[28px] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          <p className="text-lg font-black text-neutral-900">Menyiapkan laporan belajar...</p>
          <p className="mt-2 text-sm text-neutral-500">Sedang mengambil data refleksi dari progress belajar kamu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f7ff] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div className="rounded-[32px] bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 px-6 py-8 text-white shadow-lg sm:px-8">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-primary-100">Laporan Belajar</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">Ringkasan perjalananmu</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-primary-100 sm:text-base">
            {comicModule.report.summary || (comic?.title ? `Kamu telah menyelesaikan refleksi untuk ${comic.title}.` : 'Laporan ini merangkum hasil refleksi dan pemahamanmu.')}
          </p>
        </div>

        {!reportReady ? (
          <div className="rounded-[28px] bg-white p-6 shadow-sm">
            <p className="text-lg font-black text-neutral-900">Refleksi belum tersedia</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Laporan belajar baru bisa dilihat setelah kamu menyelesaikan Introspection dan menyimpan refleksi.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-bold text-white"
              >
                Kembali
              </button>
              <Link
                href="/dashboard"
                className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-700"
              >
                Ke Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-[28px] bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.3em] text-primary-600">Refleksi</p>
                  <h2 className="mt-1 text-xl font-black text-neutral-900">Apa yang kamu rasakan?</h2>
                </div>
                <div className="rounded-full bg-primary-50 px-3 py-1 text-sm font-bold text-primary-700">
                  {confidence ? `${confidence}/5` : 'Belum ada rating'}
                </div>
              </div>

              <div className="mt-5 rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-sm font-semibold text-neutral-600">Pernyataan yang kamu centang</p>
                <ul className="mt-3 space-y-2">
                  {checklist.length > 0 ? checklist.map((item, index) => (
                    <li key={`${item.prompt}-${index}`} className="flex items-start gap-2 text-sm text-neutral-700">
                      <span className={item.checked ? 'text-emerald-600' : 'text-neutral-400'}>{item.checked ? '✓' : '•'}</span>
                      <span>{item.prompt}</span>
                    </li>
                  )) : (
                    <li className="text-sm text-neutral-500">Belum ada checklist yang tersimpan.</li>
                  )}
                </ul>
              </div>

              <div className="mt-5 rounded-[24px] border border-neutral-200 bg-white p-4">
                <p className="text-sm font-semibold text-neutral-600">Wawasan pribadi</p>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
                  {reflectionText || 'Belum ada tulisan refleksi yang tersimpan.'}
                </p>
              </div>

              {aiReflection && (
                <div className="mt-5 rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-sm font-semibold text-neutral-600">Refleksi AI</p>
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Apresiasi</p>
                      <p className="mt-2 text-sm leading-relaxed text-neutral-700">{aiReflection.appreciation}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Yang perlu ditingkatkan</p>
                      <p className="mt-2 text-sm leading-relaxed text-neutral-700">{aiReflection.needsImprovement}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Saran belajar</p>
                      <p className="mt-2 text-sm leading-relaxed text-neutral-700">{aiReflection.suggestion}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[28px] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-neutral-900">Bangun ruang yang dipelajari</h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                Ringkasan ini memakai data yang sama dari komik sebagai sumber utama untuk identifikasi dan navigasi.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {learnedShapes.map((shape) => (
                  <span key={shape.id} className="rounded-full border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-700">
                    {shape.title}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-neutral-900">Langkah berikutnya</h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                Kamu sudah menyelesaikan Introspection. Kamu bisa kembali ke dashboard untuk melanjutkan komik lain atau mengulang pembelajaran ini.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="rounded-2xl bg-primary-600 px-4 py-3 text-sm font-bold text-white"
                >
                  Kembali ke Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-700"
                >
                  Kembali ke Refleksi
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
