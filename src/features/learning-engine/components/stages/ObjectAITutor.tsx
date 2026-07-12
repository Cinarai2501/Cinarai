'use client';

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
  'Dimana letaknya?',
  'Ada di halaman komik berapa?',
];

function createInitialMessage(objectName: string, initialPrompt?: string): ChatMessage {
  return {
    id: 1,
    role: 'assistant',
    content: initialPrompt || `Aku adalah AI Tutor CINARAI. Aku akan membantu menjelaskan ${objectName} dengan bahasa sederhana dan sesuai dengan Candi Jawi.`,
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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const shapeKnowledge = useMemo(() => getShapeKnowledgeEntry(objectName), [objectName]);
  const knowledgeText = useMemo(() => knowledge ?? buildShapeKnowledgeContext(shapeKnowledge), [knowledge, shapeKnowledge]);

  useEffect(() => {
    setMessages([createInitialMessage(objectName, initialPrompt)]);
    setDraft('');
    setAiError(null);
  }, [objectId, objectName, initialPrompt]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [objectId]);

  const handleSend = async (rawText?: string) => {
    const trimmed = (rawText ?? draft).trim();
    if (!trimmed || isResponding) return;

    const userMessage: ChatMessage = { id: Date.now(), role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setDraft('');
    setIsResponding(true);
    setAiError(null);

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
              location: entry?.title ? `Candi Jawi (${entry.title})` : 'Candi Jawi',
              classLevel: 'SD',
              synopsis: initialPrompt ?? 'Mengamati bentuk geometri pada Candi Jawi',
              learningTargets: ['Mengamati bangun ruang', 'Menghubungkan bentuk dengan struktur candi'],
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
            learningGoal: 'Memahami bentuk, ciri, dan letak bangun ruang pada Candi Jawi',
            numeracyConcept: 'bangun ruang, sisi, rusuk, titik sudut, rumus',
            cultureConcept: 'hubungan bentuk geometri dengan arsitektur Candi Jawi',
            knowledgeContext: knowledgeText,
          },
        }),
      });

      const payload = await response.json() as { answer?: string; error?: string };
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
    <div className="mt-4 rounded-[24px] border border-primary-100 bg-primary-50/70 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm">
          <img src="/images/ai/robot.svg" alt="AI Tutor" className="h-8 w-8" />
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary-700">AI Tutor</p>
          <p className="text-sm font-black text-neutral-900">{objectName}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[92%] rounded-[18px] px-4 py-3 text-sm leading-relaxed shadow-sm ${message.role === 'user' ? 'bg-primary-600 text-white' : 'bg-white text-neutral-800'}`}>
              {message.content}
            </div>
          </div>
        ))}

        {isResponding && (
          <div className="flex items-center gap-2 px-1">
            <div className="h-2.5 w-2.5 rounded-full bg-neutral-400 animate-bounce" />
            <div className="h-2.5 w-2.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="h-2.5 w-2.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {QUICK_QUESTIONS.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => void handleSend(question)}
              disabled={isResponding}
              className="rounded-full border border-primary-200 bg-white px-3 py-2 text-xs font-semibold text-primary-700 transition hover:bg-primary-50 disabled:opacity-50 active:scale-95"
            >
              {question}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Tanya tentang objek ini..."
            rows={3}
            className="flex-1 resize-none rounded-[20px] border-2 border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-primary-300 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={isResponding || !draft.trim()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white transition hover:bg-primary-700 disabled:opacity-50 active:scale-95"
          >
            ➤
          </button>
        </div>

        {aiError && <p className="rounded-[12px] bg-error-50 px-3 py-2 text-xs text-error-600">{aiError}</p>}
      </div>
    </div>
  );
}
