'use client';

import dynamic from 'next/dynamic';

const PdfViewer = dynamic(() => import('@/components/pdf/PdfViewer'), { ssr: false });

export default function DebugPdfPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <div className="mx-auto h-[calc(100dvh-2rem)] max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <PdfViewer pdfPath="/comics/komik-1/comic.pdf" />
      </div>
    </main>
  );
}
