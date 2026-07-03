import Link from "next/link";
import { getAllComics } from "@/lib/comicRepository";

export default function LearningJourney() {
  const comics = getAllComics();

  return (
    <section className="rounded-base border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <p className="text-sm font-semibold text-neutral-500">Learning Journey</p>
        <h2 className="mt-1 text-xl font-bold text-neutral-950">Timeline komik</h2>
      </div>

      <div className="space-y-0">
        {comics.map((comic, index) => {
          const isComingSoon = comic.availability === "COMING_SOON";
          const isLast = index === comics.length - 1;

          return (
            <article className="relative flex gap-4" key={comic.id}>
              {/* Timeline marker */}
              <div className="flex w-10 flex-col items-center">
                <div
                  className={`z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${
                    isComingSoon
                      ? "border-neutral-300 bg-neutral-100 text-neutral-400"
                      : "border-primary-600 bg-white text-primary-700"
                  }`}
                >
                  {index + 1}
                </div>
                {!isLast && (
                  <div className="flex min-h-12 flex-1 flex-col items-center justify-center py-2">
                    <div className="h-full w-px bg-neutral-200" />
                    <span className="text-sm font-bold text-neutral-300">↓</span>
                  </div>
                )}
              </div>

              {/* Card */}
              <div
                className={`mb-4 flex-1 rounded-base border p-4 ${
                  isComingSoon
                    ? "border-neutral-200 bg-neutral-50"
                    : "border-primary-200 bg-primary-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-bold ${isComingSoon ? "text-neutral-400" : "text-neutral-900"}`}>
                        {comic.title}
                      </h3>
                      {isComingSoon && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                          Sedang Dikembangkan
                        </span>
                      )}
                    </div>
                    <p className={`mt-0.5 text-sm ${isComingSoon ? "text-neutral-400" : "text-neutral-500"}`}>
                      {comic.subtitle} · Kelas {comic.kelas}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  {isComingSoon ? (
                    <button
                      disabled
                      className="rounded-lg bg-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-400 cursor-not-allowed"
                    >
                      Masuk
                    </button>
                  ) : (
                    <Link
                      href={`/comic/${comic.id}`}
                      className="inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                    >
                      Masuk
                    </Link>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
