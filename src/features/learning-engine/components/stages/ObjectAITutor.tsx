'use client';

import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import RobotMascot from '@/components/ai/RobotMascot';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { ComicAssetEntry } from '@/services/comic-assets/types';
import { getShapeKnowledgeEntry, buildShapeKnowledgeContext } from '@/features/learning-engine/stages/Identification/services/shapeKnowledge';
import { packageContent as comic3Package } from '@/features/comics/comic-3/content/packageContent';

interface ChatMessage {
  id: number;
  role: 'assistant' | 'user';
  content: string;
}

interface ObjectAITutorProps {
  objectId: string;
  objectName: string;
  provider?: string;
  comicPage?: number;
  knowledge?: string;
  modelUrl?: string;
  entry?: ComicAssetEntry | null;
  initialPrompt?: string;
  comicId?: number;
}


const COMIC2_OUT_OF_SCOPE_PATTERN = /rumus|luas|keliling|kubus|balok|prisma|limas|kerucut|tabung|bangun ruang|rusuk|titik sudut/i;

function createInitialMessage(objectName: string): ChatMessage {
  return {
    id: 1,
    role: 'assistant',
    content: `Halo 👋\nAku akan membantu kamu mengamati ${objectName}.\nApa yang kamu lihat pada gambar ini?`,
  };
}

export function ObjectAITutor({
  objectId,
  objectName,
  provider,
  comicPage,
  knowledge,
  modelUrl,
  entry,
  initialPrompt: _initialPrompt,
  comicId,
}: ObjectAITutorProps) {
  // Guard khusus comic-2: batasi tutor AI ke cakupan Candi Penataran dan hindari topik yang tidak relevan.
  // Comic-1 tetap memakai daftar pertanyaan dan konteks default yang lama.
  const isComic2 = comicId === 2;
  const isComic3 = comicId === 3;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const shapeKnowledge = useMemo(() => getShapeKnowledgeEntry(objectName), [objectName]);
  const knowledgeText = useMemo(() => knowledge ?? buildShapeKnowledgeContext(shapeKnowledge), [knowledge, shapeKnowledge]);
  const isSymmetryContext = useMemo(() => {
    const text = `${knowledgeText}`.toLowerCase();
    return text.includes('simetri') || text.includes('pencerminan') || text.includes('seimbang') || text.includes('garis');
  }, [knowledgeText]);
  const locationLabel = useMemo(() => {
    const text = `${knowledgeText}`.toLowerCase();
    if (text.includes('candi penataran')) return 'Candi Penataran';
    if (text.includes('candi')) return 'Candi';
    return 'komik saat ini';
  }, [knowledgeText]);
  const contextSynopsis = useMemo(() => {
    if (isSymmetryContext) {
      return 'Mengamati simetri, garis simetri, dan keseimbangan bentuk pada bangunan.';
    }
    return 'Mengamati bentuk dan pola pada komik ini.';
  }, [isSymmetryContext]);
  const learningGoal = useMemo(() => {
    if (isSymmetryContext) {
      return 'Memahami simetri, garis simetri, dan keseimbangan bentuk pada Candi Penataran';
    }
    return 'Memahami bentuk, ciri, dan letak objek pada komik ini';
  }, [isSymmetryContext]);
  const cultureConcept = useMemo(() => {
    if (isSymmetryContext) {
      return 'hubungan simetri dengan pola dan arsitektur Candi Penataran';
    }
    return 'hubungan bentuk visual dengan konteks komik';
  }, [isSymmetryContext]);

  useEffect(() => {
    setMessages(isComic3 ? [] : [createInitialMessage(objectName)]);
    setDraft('');
    setAiError(null);
  }, [objectId, objectName, isComic3]);

  useEffect(() => {
    if (!isOpen) return;
    textareaRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const container = messagesRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, isOpen]);

  const handleTextareaResize = (element: HTMLTextAreaElement | null) => {
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 112)}px`;
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    handleTextareaResize(textareaRef.current);
  };

  const handleSend = async (rawText?: string) => {
    const trimmed = (rawText ?? draft).trim();
    if (!trimmed || isResponding) return;

    if (isComic2 && COMIC2_OUT_OF_SCOPE_PATTERN.test(trimmed)) {
      const redirectMessage = 'Kita fokus membahas bangun datar yang ada pada Candi Penataran. Coba tanyakan tentang bentuk, ciri, atau hubungan objek dengan simetri.';
      const userMessage: ChatMessage = { id: Date.now(), role: 'user', content: trimmed };
      setMessages((prev) => [...prev, userMessage, { id: Date.now() + 1, role: 'assistant', content: redirectMessage }]);
      setDraft('');
      setAiError(null);
      return;
    }

    const userMessage: ChatMessage = { id: Date.now(), role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setDraft('');
    setAiError(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsResponding(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          context: {
            // inject comic-3 specific initial prompt if provided via initialPrompt
            // initialPrompt is already used in createInitialMessage; here we keep existing context
            moduleName: 'CINARAI Navigation',
            identification: [],
            objectInfo: {
              location: entry?.title ? `${locationLabel} (${entry.title})` : locationLabel,
              classLevel: 'SD',
              synopsis: contextSynopsis,
              learningTargets: isSymmetryContext
                ? ['Mengamati bangun datar', 'Menghubungkan bentuk dengan pola candi']
                : ['Mengamati bangun datar', 'Menghubungkan bentuk dengan struktur candi'],
            },
            observationAnswers: {},
            sessionHistory: [],
            comicTitle: comicId === 3 ? (comic3Package?.metadata?.title ?? 'CINARAI') : 'CINARAI',
            pageLabel: comicPage ? `Halaman ${comicPage}` : undefined,
            objectName,
            learningStage: 'Navigation',
            objectDescription: entry?.description,
            arProvider: provider,
            modelUrl,
            learningGoal,
            numeracyConcept: isSymmetryContext
              ? 'bangun datar, simetri, garis simetri, keseimbangan, pencerminan'
              : 'bangun datar, bentuk, sisi, pola, simetri',
            cultureConcept,
            knowledgeContext: knowledgeText,
          },
        }),
      });

      const payload = (await response.json()) as { answer?: string; error?: string };
      const assistantAnswer = payload.answer?.trim() || 'Maaf, saya belum bisa memberikan penjelasan untuk objek ini.';

      if (!response.ok || !payload.answer) {
        throw new Error(payload.error ?? 'AI response was not available.');
      }

      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', content: assistantAnswer }]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setAiError(msg);
      setMessages((prev) => [...prev, { id: Date.now() + 2, role: 'assistant', content: `Maaf, terjadi kesalahan saat menghubungi layanan AI: ${msg}` }]);
    } finally {
      setIsResponding(false);
    }
  };

  const compactCard = isComic3;
  const showFloatingButton = !isOpen && !compactCard;
  const showSheet = isOpen;

  const handleSheetDragEnd = (_event: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 800) {
      setIsOpen(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showFloatingButton && (
          <motion.button
            type="button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_20px_40px_rgba(15,23,42,0.18)] outline-none"
            aria-label="Buka AI Tutor"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 shadow-sm">
              <RobotMascot variant="fab" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {compactCard && !isOpen && (
          <motion.div
            key="compact-card"
            className="mx-auto mt-6 w-full max-w-2xl rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_24px_48px_rgba(15,23,42,0.08)]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-50">
                <RobotMascot variant="desktop" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-black text-neutral-900">AI Tutor</p>
                <p className="mt-1 text-sm text-neutral-600">Halo 👋 Aku siap membantu mengamati bangun datar ini.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              Mulai Belajar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSheet && (
          <>
            <motion.div
              key="chatbackdrop"
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              key="chatsheet"
              className="fixed left-0 right-0 bottom-0 z-50 mx-auto w-full max-w-2xl rounded-t-[32px] bg-white shadow-[0_-24px_60px_rgba(15,23,42,0.18)]"
              style={{ height: '68vh' }}
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.28 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={handleSheetDragEnd}
            >
              <div className="flex h-full flex-col overflow-hidden rounded-t-[32px]">
                <div className="mx-auto mt-3 h-1.5 w-16 rounded-full bg-neutral-200" />
                <div className="border-b border-neutral-200 bg-white px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary-50 shadow-sm">
                      <RobotMascot variant="desktop" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-black text-neutral-900">AI Tutor</p>
                      <p className="mt-1 text-sm text-neutral-500">Area Percakapan</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200 active:scale-95"
                      aria-label="Tutup AI Tutor"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="flex flex-1 flex-col overflow-hidden px-5 py-4">
                  <div ref={messagesRef} className="flex-1 overflow-y-auto pr-1">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.18 }}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className="max-w-[80%]">
                            <div className={`mb-1 text-[10px] font-semibold uppercase tracking-[0.32em] ${message.role === 'assistant' ? 'text-neutral-500' : 'text-primary-100'}`}>
                              {message.role === 'assistant' ? 'AI' : 'Siswa'}
                            </div>
                            <div className={`rounded-[24px] px-4 py-3 text-base leading-relaxed shadow-sm ${
                              message.role === 'assistant'
                                ? 'bg-sky-100 text-slate-900'
                                : 'bg-white text-slate-900 border border-neutral-200'
                            }`} style={{ whiteSpace: 'pre-wrap' }}>
                              {message.content}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {isResponding && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-neutral-400 animate-bounce" />
                      <div className="h-2.5 w-2.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="h-2.5 w-2.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <span className="text-sm text-neutral-500">AI Tutor sedang berpikir...</span>
                    </div>
                  )}

                  <div className="mt-4 border-t border-neutral-200 pt-4">
                    <div className="flex items-end gap-3">
                      <textarea
                        ref={textareaRef}
                        value={draft}
                        onChange={(event) => handleDraftChange(event.target.value)}
                        onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            void handleSend();
                          }
                        }}
                        placeholder="Tulis pertanyaanmu..."
                        rows={1}
                        className="min-h-[48px] max-h-[112px] w-full resize-none overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-300 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => void handleSend()}
                        disabled={isResponding || !draft.trim()}
                        className="inline-flex h-12 min-w-[84px] items-center justify-center rounded-full bg-primary-600 px-4 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Kirim pesan AI Tutor"
                      >
                        Kirim
                      </button>
                    </div>
                    {aiError ? (
                      <p className="mt-3 rounded-2xl bg-error-50 px-3 py-2 text-xs text-error-700">{aiError}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
