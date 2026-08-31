'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ComicPageClientProps {
  comicId: number;
}

export default function ComicPageClient({ comicId }: ComicPageClientProps) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/comic/${comicId}/cover`);
  }, [comicId, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f0f7ff]">
      <div className="text-center px-6">
        <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin mx-auto" />
        <p className="mt-3 text-sm font-semibold text-primary-600">Mempersiapkan halaman komik...</p>
      </div>
    </main>
  );
}

