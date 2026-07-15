import { Suspense } from 'react';
import GuruReportClient from './GuruReportClient';

export default function GuruReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f0f7ff] px-4 py-10">
          <div className="w-full max-w-2xl rounded-[28px] bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-black text-neutral-900">Memuat laporan guru...</p>
          </div>
        </div>
      }
    >
      <GuruReportClient />
    </Suspense>
  );
}
