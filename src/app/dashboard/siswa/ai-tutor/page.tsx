'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { addDoc, collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { buildSuggestedQuestions, getConversationTitle, groupConversationHistoryByPeriod } from '@/lib/ai/tutorUi';

type ChatRole = 'assistant' | 'user';

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
};

type ConversationItem = {
  id: string;
  title: string;
  updatedAt: string;
};

const QUICK_QUESTIONS = [
  'Apa itu kubus?',
  'Apa perbedaan kubus dan balok?',
  'Bantu memahami Komik 1',
  'Contoh bangun ruang di rumah',
];

const WELCOME_COPY = {
  title: 'Halo 👋\nAku AI Tutor CINARAI',
  description: 'Aku siap menemanimu belajar matematika lewat komik CINARAI. Kamu bisa bertanya tentang kubus, balok, bangun datar, rumus, contoh soal, atau materi komik.',
};

function formatTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function DashboardSiswaAiTutorPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    let isCancelled = false;
    const loadConversations = async () => {
      setLoadingHistory(true);
      try {
        const queryRef = query(collection(firestore, 'conversations'), where('userId', '==', user.uid));
        const snapshot = await getDocs(queryRef);
        const loadedConversations = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data() as { title?: string; updatedAt?: string };
            return {
              id: docSnap.id,
              title: data.title ?? 'Percakapan',
              updatedAt: data.updatedAt ?? new Date().toISOString(),
            } satisfies ConversationItem;
          })
          .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());

        if (!isCancelled) {
          setConversations(loadedConversations);
        }
      } catch (loadError) {
        console.error('[ai-tutor] failed to load conversations', loadError);
      } finally {
        if (!isCancelled) {
          setLoadingHistory(false);
        }
      }
    };

    void loadConversations();
    return () => {
      isCancelled = true;
    };
  }, [user?.uid]);

  const historyGroups = useMemo(() => groupConversationHistoryByPeriod(conversations), [conversations]);
  const latestUserQuestion = messages.filter((message) => message.role === 'user').at(-1)?.content ?? '';
  const suggestedQuestions = useMemo(() => buildSuggestedQuestions(latestUserQuestion), [latestUserQuestion]);
  const showWelcome = !activeConversationId && messages.length === 0;

  const refreshConversationList = (conversationId: string, title: string) => {
    setConversations((previous) => {
      const existing = previous.find((conversation) => conversation.id === conversationId);
      const updatedAt = new Date().toISOString();
      const next = [
        { id: conversationId, title, updatedAt },
        ...previous.filter((conversation) => conversation.id !== conversationId),
      ];

      if (existing) {
        return next;
      }

      return next.slice(0, 10);
    });
  };

  const openConversation = async (conversationId: string) => {
    if (!user?.uid) {
      return;
    }

    setHistoryOpen(false);
    setIsTyping(false);
    setErrorText(null);
    setActiveConversationId(conversationId);

    try {
      const queryRef = query(collection(firestore, 'messages'), where('conversationId', '==', conversationId));
      const snapshot = await getDocs(queryRef);
      const loadedMessages = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data() as { role?: ChatRole; content?: string; timestamp?: string };
          return {
            id: docSnap.id,
            role: data.role === 'assistant' ? 'assistant' : 'user',
            content: data.content ?? '',
            timestamp: data.timestamp ?? new Date().toISOString(),
          } satisfies ChatMessage;
        })
        .sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime());

      setMessages(loadedMessages);
    } catch (loadError) {
      console.error('[ai-tutor] failed to load conversation messages', loadError);
      setErrorText('Riwayat percakapan tidak bisa dibuka saat ini.');
    }
  };

  const startNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInputText('');
    setErrorText(null);
    setHistoryOpen(false);
  };

  const handleSend = async (textToSend?: string) => {
    const rawText = (textToSend ?? inputText).trim();
    if (!rawText) {
      return;
    }

    setErrorText(null);
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: rawText,
      timestamp: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    if (!textToSend) {
      setInputText('');
    }

    const conversationTitle = getConversationTitle(rawText);
    let conversationId = activeConversationId;

    if (!conversationId && user?.uid) {
      const createdConversation = await addDoc(collection(firestore, 'conversations'), {
        userId: user.uid,
        title: conversationTitle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      conversationId = createdConversation.id;
      setActiveConversationId(conversationId);
      refreshConversationList(conversationId, conversationTitle);
    }

    if (conversationId && user?.uid) {
      await addDoc(collection(firestore, 'messages'), {
        conversationId,
        role: 'user',
        content: rawText,
        timestamp: userMessage.timestamp,
      });
      await updateDoc(doc(firestore, 'conversations', conversationId), {
        title: conversationTitle,
        updatedAt: new Date().toISOString(),
      });
      refreshConversationList(conversationId, conversationTitle);
    }

    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: rawText,
          context: {
            moduleName: 'Matematika SD',
            identification: [],
            objectInfo: {
              location: 'Kelas 2',
              classLevel: 'SD',
              synopsis: 'Belajar matematika melalui komik CINARAI',
              learningTargets: ['Memahami bangun ruang', 'Mengaitkan materi dengan kehidupan sehari-hari'],
            },
            observationAnswers: {},
            sessionHistory: nextMessages.map((message) => ({ role: message.role, content: message.content })),
            comicTitle: 'Komik CINARAI',
            pageLabel: 'AI Tutor',
            objectName: 'Matematika',
            learningStage: 'Pendampingan',
          },
        }),
      });

      const payload = (await response.json()) as { answer?: string; error?: string };
      const assistantText = payload.answer?.trim() || 'Boleh, kita pelajari bersama ya. Saya akan bantu dengan contoh sederhana dan satu pertanyaan kecil supaya kamu semakin paham.';
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: assistantText,
        timestamp: new Date().toISOString(),
      };

      setMessages((previous) => [...previous, assistantMessage]);

      if (conversationId && user?.uid) {
        await addDoc(collection(firestore, 'messages'), {
          conversationId,
          role: 'assistant',
          content: assistantText,
          timestamp: assistantMessage.timestamp,
        });
        await updateDoc(doc(firestore, 'conversations', conversationId), {
          updatedAt: new Date().toISOString(),
        });
        refreshConversationList(conversationId, conversationTitle);
      }
    } catch (requestError) {
      console.error('[ai-tutor] request failed', requestError);
      setMessages((previous) => [
        ...previous,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: 'Aku sedang mempersiapkan jawaban yang lebih ramah. Coba lagi sebentar ya.',
          timestamp: new Date().toISOString(),
        },
      ]);
      setErrorText('AI Tutor sedang sibuk. Coba sebentar lagi.');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F6F8FF_0%,#F9FAFF_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-40 pt-4 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-[#6D5CF6] via-[#865FF6] to-[#5B63F3] p-4 text-white shadow-[0_20px_50px_rgba(92,96,243,0.18)] sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 p-1 shadow-inner">
                <Image src="/images/ai/RobotAI.png" alt="AI Tutor" width={56} height={56} className="rounded-2xl object-cover" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">AI Tutor CINARAI</p>
                <h1 className="text-lg font-black sm:text-xl">Guru pendamping belajar</h1>
                <p className="mt-1 text-sm text-white/85">🟢 Online · Siap membantu belajar</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="rounded-full border border-white/30 bg-white/15 px-3 py-2 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/20"
              >
                History
              </button>
              <button
                type="button"
                onClick={startNewConversation}
                className="rounded-full border border-white/30 bg-white/15 px-3 py-2 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/20"
              >
                Chat Baru
              </button>
            </div>
          </div>
        </header>

        <main className="mt-4 flex-1">
          {showWelcome ? (
            <section className="rounded-[28px] border border-slate-200/80 bg-white/80 p-5 shadow-[0_15px_40px_rgba(15,23,42,0.06)] backdrop-blur sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex min-h-[180px] items-center justify-center rounded-[24px] bg-gradient-to-br from-[#F6F2FF] to-[#EEF5FF] p-4 sm:w-[220px]">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white p-2 shadow-lg">
                    <Image src="/images/ai/RobotAI.png" alt="Avatar AI Tutor" width={90} height={90} className="rounded-full object-cover" />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="whitespace-pre-line text-2xl font-black text-slate-900 sm:text-[28px]">{WELCOME_COPY.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-[15px]">{WELCOME_COPY.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {QUICK_QUESTIONS.map((question) => (
                      <button
                        key={question}
                        type="button"
                        onClick={() => void handleSend(question)}
                        className="rounded-full border border-[#D9CDFE] bg-[#F7F3FF] px-3 py-2 text-sm font-semibold text-[#5F44E0] transition hover:bg-[#EEE8FF]"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-[28px] border border-slate-200/80 bg-white/80 p-3 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur sm:p-4">
              <div className="flex items-center justify-between rounded-[20px] bg-slate-50 px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                <span>{activeConversationId ? 'Percakapan aktif' : 'Mulai belajar'}</span>
                {loadingHistory ? <span>Memuat riwayat…</span> : null}
              </div>

              <div className="mt-3 space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[88%] rounded-[24px] px-4 py-3 shadow-[0_10px_26px_rgba(15,23,42,0.06)] sm:max-w-[80%] ${message.role === 'user' ? 'bg-gradient-to-br from-[#6D5CF6] to-[#8C7BFF] text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>
                      <div className="whitespace-pre-line text-[14px] leading-7 sm:text-[15px]">
                        {message.role === 'assistant' ? message.content.replace(/\n{3,}/g, '\n\n') : message.content}
                      </div>
                      <div className={`mt-2 text-[11px] ${message.role === 'user' ? 'text-white/80' : 'text-slate-400'}`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping ? (
                  <div className="flex justify-start">
                    <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_26px_rgba(15,23,42,0.06)]">
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <span className="text-lg leading-none">•••</span>
                        <span>AI sedang menyiapkan jawaban...</span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {errorText ? (
                  <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {errorText}
                  </div>
                ) : null}

                {suggestedQuestions.length > 0 && !isTyping ? (
                  <div className="rounded-[24px] border border-slate-200 bg-[#F8FAFF] px-3 py-3">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-slate-500">Pertanyaan lanjutan</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {suggestedQuestions.map((question) => (
                        <button
                          key={question}
                          type="button"
                          onClick={() => void handleSend(question)}
                          className="rounded-full border border-[#D9CDFE] bg-white px-3 py-2 text-sm font-semibold text-[#5F44E0] transition hover:bg-[#F2EBFF]"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div ref={messagesEndRef} />
              </div>
            </section>
          )}
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:px-4">
        <div className="mx-auto flex max-w-5xl items-end gap-2">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSend();
            }}
            className="flex flex-1 items-center gap-2 rounded-[24px] border border-slate-200 bg-[#F8FAFF] px-2 py-2 shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
          >
            <button type="button" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#6D5CF6] shadow-sm" aria-label="Lampiran">
              <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              placeholder="Tanya tentang kubus, balok, atau komik…"
              className="min-h-[44px] flex-1 bg-transparent px-1 text-[14px] font-medium text-slate-800 outline-none placeholder:text-slate-400"
            />
            <button type="submit" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6D5CF6] text-white shadow-md transition hover:scale-[1.02]" aria-label="Kirim pesan">
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {historyOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-xl rounded-[28px] bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Riwayat belajar</p>
                <h3 className="text-lg font-black text-slate-900">Percakapan sebelumnya</h3>
              </div>
              <button type="button" onClick={() => setHistoryOpen(false)} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100">
                ✕
              </button>
            </div>

            <div className="mt-4 max-h-[70vh] space-y-4 overflow-y-auto">
              {Object.entries(historyGroups).map(([groupLabel, items]) => {
                if (!items.length) {
                  return null;
                }

                return (
                  <div key={groupLabel}>
                    <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.24em] text-slate-400">{groupLabel}</p>
                    <div className="space-y-2">
                      {items.map((conversation) => (
                        <button
                          key={conversation.id}
                          type="button"
                          onClick={() => void openConversation(conversation.id)}
                          className="flex w-full items-center justify-between rounded-[20px] border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:border-[#CFC8FF] hover:bg-[#F8F5FF]"
                        >
                          <span className="text-sm font-semibold text-slate-800">{conversation.title}</span>
                          <span className="text-xs text-slate-400">{formatTime(conversation.updatedAt)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
