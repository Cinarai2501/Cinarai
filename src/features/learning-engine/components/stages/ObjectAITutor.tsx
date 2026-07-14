'use client';

import { AnimatePresence, motion } from 'framer-motion';
import RobotMascot from '@/components/ai/RobotMascot';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComicAssetEntry } from '@/services/comic-assets/types';
import { getShapeKnowledgeEntry, buildShapeKnowledgeContext } from '@/features/learning-engine/stages/Identification/services/shapeKnowledge';

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
}

const QUICK_QUESTIONS = [
  'Apa cirinya?',
  'Apa rumusnya?',
  'Ada dimana?',
  'Berapa sisi?',
  'Berapa rusuk?',
  'Berapa titik sudut?',
];

function createInitialMessage(objectName: string, initialPrompt?: string): ChatMessage {
  return {
    id: 1,
    role: 'assistant',
    content:
      initialPrompt ||
      `Halo! Aku adalah AI Tutor CINARAI. Aku akan membantu menjelaskan ${objectName} dengan bahasa sederhana dan sesuai dengan isi komik saat ini.`,
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
  initialPrompt,
}: ObjectAITutorProps) {
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
    const text = `${initialPrompt ?? ''} ${knowledgeText}`.toLowerCase();
    return text.includes('simetri') || text.includes('pencerminan') || text.includes('seimbang') || text.includes('garis');
  }, [initialPrompt, knowledgeText]);
  const locationLabel = useMemo(() => {
    const text = `${initialPrompt ?? ''} ${knowledgeText}`.toLowerCase();
    if (text.includes('candi penataran')) return 'Candi Penataran';
    if (text.includes('candi')) return 'Candi';
    return 'komik saat ini';
  }, [initialPrompt, knowledgeText]);
  const contextSynopsis = useMemo(() => {
    if (initialPrompt) return initialPrompt;
    if (isSymmetryContext) {
      return 'Mengamati simetri, garis simetri, dan keseimbangan bentuk pada bangunan.';
    }
    return 'Mengamati bentuk dan pola pada komik ini.';
  }, [initialPrompt, isSymmetryContext]);
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
    setMessages([createInitialMessage(objectName, initialPrompt)]);
    setDraft('');
    setAiError(null);
  }, [objectId, objectName, initialPrompt]);

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
            moduleName: 'CINARAI Navigation',
            identification: [],
            objectInfo: {
              location: entry?.title ? `${locationLabel} (${entry.title})` : locationLabel,
              classLevel: 'SD',
              synopsis: contextSynopsis,
              learningTargets: isSymmetryContext
                ? ['Mengamati simetri', 'Menghubungkan bentuk dengan pola candi']
                : ['Mengamati bangun ruang', 'Menghubungkan bentuk dengan struktur candi'],
            },
            observationAnswers: {},
            sessionHistory: [],
            comicTitle: 'CINARAI',
            pageLabel: comicPage ? `Halaman ${comicPage}` : undefined,
            objectName,
            learningStage: 'Navigation',
            objectDescription: entry?.description,
            arProvider: provider,
            modelUrl,
            learningGoal,
            numeracyConcept: isSymmetryContext
              ? 'simetri, garis simetri, keseimbangan, pencerminan'
              : 'bangun ruang, sisi, rusuk, titik sudut, rumus',
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

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            type="button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_20px_40px_rgba(15,23,42,0.18)] outline-none"
            aria-label="Buka AI Tutor"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-600 shadow-sm">
              <RobotMascot variant="fab" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
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
              className="fixed left-0 right-0 bottom-0 z-50 mx-auto w-full max-w-2xl rounded-t-[24px] bg-white shadow-[0_-24px_60px_rgba(15,23,42,0.20)]"
              style={{ height: '70vh' }}
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.28 }}
            >
              <div className="flex h-full flex-col overflow-hidden rounded-t-[24px]">
                <div className="border-b border-neutral-200 bg-white px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary-50 shadow-sm">
                      <RobotMascot variant="desktop" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-black text-neutral-900">RobotAI</p>
                      <p className="mt-1 text-sm text-neutral-500">Tanyakan apa saja tentang {objectName}</p>
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

                <div className="flex-1 overflow-hidden">
                  <div ref={messagesRef} className="h-full overflow-y-auto px-4 py-4 sm:px-5">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.18 }}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {message.role === 'assistant' ? (
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                <RobotMascot variant="mobile" />
                              </div>
                              <div className="max-w-[80%] rounded-[20px] bg-[#F4F7FB] px-4 py-3 text-sm leading-relaxed text-neutral-900 shadow-sm">
                                {message.content}
                              </div>
                            </div>
                          ) : (
                            <div className="max-w-[80%] rounded-[20px] bg-primary-600 px-4 py-3 text-sm leading-relaxed text-white shadow-sm">
                              {message.content}
                            </div>
                          )}
                        </motion.div>
                      ))}

                      {isResponding && (
                        <div className="flex items-center gap-2 px-1">
                          <div className="h-2.5 w-2.5 rounded-full bg-neutral-400 animate-bounce" />
                          <div className="h-2.5 w-2.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="h-2.5 w-2.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-neutral-200 bg-white px-4 py-4 sm:px-5">
                    <div className="mb-3 flex flex-wrap gap-2">
                      {QUICK_QUESTIONS.map((question) => (
                        <button
                          key={question}
                          type="button"
                          onClick={() => void handleSend(question)}
                          disabled={isResponding}
                          className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50 active:scale-95"
                        >
                          {question}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-end gap-3">
                      <textarea
                        ref={textareaRef}
                        value={draft}
                        onChange={(event) => handleDraftChange(event.target.value)}
                        placeholder={`Tanyakan tentang ${objectName}...`}
                        rows={1}
                        className="min-h-[44px] max-h-[112px] w-full resize-none overflow-hidden rounded-full border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-primary-300 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => void handleSend()}
                        disabled={isResponding || !draft.trim()}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white transition hover:bg-primary-700 disabled:opacity-50 active:scale-95"
                        aria-label="Kirim pesan AI Tutor"
                      >
                        ➤
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
