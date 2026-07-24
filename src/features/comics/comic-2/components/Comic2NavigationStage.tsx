"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { loadComicProgress, saveComicProgress } from "@/services/comicProgress";
import { useLearningEngine } from "@/features/learning-engine/hooks/useLearningEngine";
import { packageContent } from "../content/packageContent";
import { Comic2QrScannerModal } from "./Comic2QrScannerModal";

const COMIC_ID = 2;

export default function Comic2NavigationStage() {
  const router = useRouter();
  const { user } = useAuth();
  const { comic } = useLearningEngine();

  const objects = packageContent.learningObjects;

  const [objectVisited, setObjectVisited] = useState<string[]>([]);
  const [openedObjects, setOpenedObjects] = useState<string[]>([]);
  const [hasHydratedProgress, setHasHydratedProgress] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Hydrate progress from Firestore
  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    void (async () => {
      try {
        const doc = await loadComicProgress(user.uid, COMIC_ID);
        if (!active) return;
        const stageData = doc?.stageData?.navigation;
        if (stageData) {
          if (Array.isArray(stageData.objectVisited)) setObjectVisited(stageData.objectVisited);
          if (Array.isArray(stageData.openedObjects)) setOpenedObjects(stageData.openedObjects);
        }
        setHasHydratedProgress(true);
      } catch (err) {
        console.error("[Comic2NavigationStage] gagal memuat progress", err);
      }
    })();
    return () => { active = false; };
  }, [user?.uid]);

  // Persist progress to Firestore
  useEffect(() => {
    if (!user?.uid || !hasHydratedProgress) return;
    void saveComicProgress(user.uid, COMIC_ID, {
      stageData: { navigation: { objectVisited, openedObjects } },
    });
  }, [hasHydratedProgress, objectVisited, openedObjects, user?.uid]);

  const handleExplore = (objectId: string) => {
    setObjectVisited((prev) => Array.from(new Set([...prev, objectId])));
    setOpenedObjects((prev) => Array.from(new Set([...prev, objectId])));
    router.push(`/viewer/object/${encodeURIComponent(objectId)}?comicId=${comic.id}`);
  };

  const handleObjectResolved = (object: (typeof packageContent.learningObjects)[number]) => {
    const objectId = object.id;
    setObjectVisited((prev) => Array.from(new Set([...prev, objectId])));
    setOpenedObjects((prev) => Array.from(new Set([...prev, objectId])));
    setIsScannerOpen(false);
    router.push(`/viewer/object/${encodeURIComponent(objectId)}?comicId=${comic.id}`);
  };

  return (
    <div className="flex min-w-0 flex-col gap-4 px-4 py-4 sm:gap-6 sm:py-6">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary-600">
          CINARAI Navigation
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-neutral-900 sm:text-3xl">
              Jelajahi objek Candi Penataran
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-neutral-600">
              Pilih objek yang muncul pada komik. Setiap kartu menghubungkan bangun datar,
              penjelasan sederhana, dan AI Tutor yang fokus pada Candi Penataran.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-700"
          >
            Pindai QR
          </button>
        </div>
      </div>

      <Comic2QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onObjectResolved={handleObjectResolved}
      />

      {/* Object list */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-black text-neutral-900">Daftar Objek</h2>
          <span className="rounded-full bg-primary-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-700">
            {objects.length} objek
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {objects.map((obj) => {
            const isOpened = openedObjects.includes(obj.id);
            return (
              <div
                key={obj.id}
                className={[
                  "flex h-full flex-col justify-between rounded-[18px] border bg-white p-3 shadow-sm transition-all",
                  isOpened
                    ? "border-primary-300 bg-primary-50/70 shadow-primary-100"
                    : "border-neutral-200",
                ].join(" ")}
              >
                <div className="space-y-2">
                  {obj.navImage ? (
                    <div className="relative mb-2 h-36 overflow-hidden rounded-[14px] border border-neutral-200 bg-neutral-50">
                      <Image
                        src={obj.navImage}
                        alt={obj.title}
                        width={600}
                        height={400}
                        quality={90}
                        priority
                        unoptimized
                        className="h-full w-full rounded-[14px] object-cover"
                      />
                    </div>
                  ) : null}

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-black text-neutral-900">{obj.title}</h3>
                      {obj.shapeName ? (
                        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-700">
                          {obj.shapeName}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-neutral-600">{obj.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleExplore(obj.id)}
                  className="mt-3 inline-flex min-h-[40px] items-center justify-center rounded-lg bg-primary-600 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-700 active:scale-[0.98]"
                >
                  Explore
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
