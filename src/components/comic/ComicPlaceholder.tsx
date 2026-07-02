import Link from 'next/link';

interface ComicPlaceholderProps {
  comicNumber: number;
}

export default function ComicPlaceholder({
  comicNumber,
}: ComicPlaceholderProps): React.ReactNode {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 text-neutral-900 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-xl items-center">
        <div className="w-full rounded-base border border-neutral-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-secondary-600">
            CINARAI
          </p>
          <h1 className="mt-3 text-2xl font-bold text-neutral-950">
            Komik {comicNumber}
          </h1>
          <p className="mt-3 text-lg font-semibold text-primary-700">
            Coming Soon
          </p>

          <Link
            className="mt-8 inline-flex min-h-touch items-center justify-center rounded-base bg-primary-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-primary-700 hover:no-underline"
            href="/dashboard"
          >
            Kembali
          </Link>
        </div>
      </section>
    </main>
  );
}
