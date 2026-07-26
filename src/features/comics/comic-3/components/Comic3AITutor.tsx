'use client';

import { AnimatePresence, motion } from 'framer-motion';
import RobotMascot from '@/components/ai/RobotMascot';
import { useState } from 'react';
import type { ComicAssetEntry } from '@/services/comic-assets/types';

interface Comic3AITutorProps {
  objectId: string;
  objectName: string;
  entry?: ComicAssetEntry | null;
}

export default function Comic3AITutor({ objectId, objectName, entry }: Comic3AITutorProps) {
  const [open, setOpen] = useState(false);

  const description = entry?.description
    ? `${entry.description} Pada gambar ini, perhatikan bagian yang diberi highlight.`
    : `Kita sedang mengamati ${objectName}. Perhatikan bagian yang diberi highlight.`;

  const characteristics = (entry?.characteristics ?? []) as string[];

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            key="comic3-fab"
            className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            aria-label="Buka AI Tutor"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600">
              <RobotMascot variant="fab" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="comic3-backdrop"
              className="fixed inset-0 z-40 bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            <motion.div
              key="comic3-sheet"
              className="fixed left-0 right-0 bottom-0 z-50 mx-auto w-full max-w-2xl rounded-t-2xl bg-white shadow-2xl"
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
            >
              <div className="flex h-full flex-col gap-4 rounded-t-2xl px-5 py-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary-50">
                    <RobotMascot variant="desktop" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-black text-neutral-900">AI Tutor</p>
                    <p className="mt-1 text-sm text-neutral-600">Halo 👋 Saya akan membantu kamu mengamati benda ini.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700"
                    aria-label="Tutup"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <p className="text-sm font-semibold text-primary-700">Tentang objek</p>
                  <p className="mt-2 text-base text-neutral-700">{description}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-primary-700">Cara mengamati</p>
                  <ul className="mt-2 space-y-2 text-sm text-neutral-700">
                    <li>Perhatikan bentuk yang diberi highlight.</li>
                    <li>Coba bandingkan sisi, sudut, dan pola di sekitarnya.</li>
                    <li>Gunakan jari untuk menunjuk bagian yang menurutmu penting.</li>
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-semibold text-primary-700">Ciri-ciri singkat</p>
                  <div className="mt-2 space-y-2 text-sm text-neutral-700">
                    {characteristics.length > 0 ? (
                      characteristics.map((c) => (
                        <p key={c}>- {c}. {`Contohnya: ${c}`} </p>
                      ))
                    ) : (
                      <p>Objek ini memiliki beberapa ciri khas yang mudah dikenali, coba perhatikan sisi dan sudutnya.</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-primary-700">Pertanyaan pemantik</p>
                  <p className="mt-2 text-base text-neutral-700">Coba amati bagian yang diberi highlight. Menurutmu, mengapa bagian tersebut disebut {objectName.toLowerCase()}?</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
