'use client';

/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import RobotMascot from '@/components/ai/RobotMascot';
import type { ComicAssetEntry } from '@/services/comic-assets/types';

interface ChatMessage {
  id: number;
  role: 'assistant' | 'user';
  content: string;
}

interface FloatingAITutorProps {
  messages: ChatMessage[];
  draft: string;
  isResponding: boolean;
  aiError: string | null;
  quickQuestions: string[];
  activeEntry: ComicAssetEntry | null;
  activeObjectName?: string;
  onSendMessage: (text?: string) => Promise<void>;
  onDraftChange: (text: string) => void;
}

export function FloatingAITutor({
  messages,
  draft,
  isResponding,
  aiError,
  quickQuestions,
  activeEntry,
  activeObjectName,
  onSendMessage,
  onDraftChange,
}: FloatingAITutorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const objectSubtitle = [
    activeEntry?.page ? `Halaman ${activeEntry.page}` : null,
    activeEntry?.provider ? `Provider: ${activeEntry.provider}` : null,
    activeEntry?.description ? activeEntry.description : null,
  ].filter(Boolean).join(' • ');

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="fixed bottom-6 right-4 z-50 flex h-15 w-15 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-[0_20px_40px_rgba(59,130,246,0.25)] transition-transform duration-300 hover:scale-[1.04] active:scale-95"
        title="AI Tutor"
      >
        <span className="absolute inset-0 animate-pulse rounded-full bg-primary-500/20" />
        <div className="relative">
          <RobotMascot variant="fab" />
        </div>
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 z-40 w-[calc(100vw-32px)] max-w-[380px] animate-[slide-up_250ms_ease-out] rounded-[20px] bg-white shadow-[0_28px_60px_rgba(15,23,42,0.16)] sm:right-6" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          <div className="flex h-full flex-col overflow-hidden rounded-[20px]">
            <div className="bg-gradient-to-r from-primary-50 to-white px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm">
                    <RobotMascot variant="desktop" />
                  </div>
                  <div>
                    <p className="text-base font-black text-neutral-900">{activeObjectName ?? 'AI Tutor'}</p>
                    <p className="text-xs text-neutral-600">{objectSubtitle || 'Tekan untuk tanya'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200 active:scale-95"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {activeEntry ? (
                <div className="space-y-3">
                  <div className="rounded-[16px] border border-primary-100 bg-primary-50/70 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary-700">Objek aktif</p>
                    <p className="mt-1 text-sm font-bold text-neutral-900">{activeObjectName ?? activeEntry.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-600">{objectSubtitle || 'Amati bentuk, pola, dan hubungan matematikanya.'}</p>
                  </div>
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' ? (
                        <div className="flex items-start gap-3">
                          <RobotMascot variant="inline" className="mt-1" />
                          <div className="max-w-[80%] rounded-[18px] px-4 py-3 text-sm leading-relaxed shadow-sm bg-neutral-100 text-neutral-800">
                            {msg.content}
                          </div>
                        </div>
                      ) : (
                        <div className="max-w-[80%] rounded-[18px] px-4 py-3 text-sm leading-relaxed shadow-sm bg-primary-600 text-white">
                          {msg.content}
                        </div>
                      )}
                    </div>
                  ))}

                  {isResponding && (
                    <div className="flex items-center gap-2 px-1">
                      <div className="h-2.5 w-2.5 rounded-full bg-neutral-400 animate-bounce" />
                      <div className="h-2.5 w-2.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="h-2.5 w-2.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center px-2 text-center text-sm text-neutral-600">
                  Pilih objek untuk mulai bertanya.
                </div>
              )}
            </div>

            {activeEntry && (
              <div className="border-t border-neutral-100 bg-white p-4 sm:p-5">
                <div className="space-y-3">
                  {quickQuestions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {quickQuestions.slice(0, 2).map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => void onSendMessage(q)}
                          disabled={isResponding}
                          className="rounded-full border border-primary-200 bg-white px-3 py-2 text-xs font-semibold text-primary-700 transition hover:bg-primary-50 disabled:opacity-50 active:scale-95"
                        >
                          {q.length > 18 ? `${q.slice(0, 15)}…` : q}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <textarea
                      value={draft}
                      onChange={(e) => onDraftChange(e.target.value)}
                      placeholder="Tanya AI Tutor..."
                      rows={2}
                      className="flex-1 resize-none rounded-[20px] border-2 border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-primary-300 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => void onSendMessage()}
                      disabled={isResponding || !draft.trim()}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white transition hover:bg-primary-700 disabled:opacity-50 active:scale-95 min-h-[48px]"
                    >
                      ➤
                    </button>
                  </div>

                  {aiError && (
                    <p className="text-xs text-error-600 bg-error-50 rounded-[12px] px-3 py-2">{aiError}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
