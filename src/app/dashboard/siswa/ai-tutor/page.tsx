'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import DashboardPage from '@/components/dashboard/DashboardPage';
import { useAuth } from '@/hooks/useAuth';
import { firestore } from '@/lib/firebase/client';

type Message = {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  listItems?: string[];
  followUp?: string;
  time: string;
};

type AiChatResponse = {
  answer?: string;
  error?: string;
};

type StoredMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date | Timestamp;
};

type ChatHistoryItem = {
  id: string;
  title: string;
  lastMessage: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  messages: StoredMessage[];
};

const QUICK_QUESTIONS = [
  'Apa itu kubus?',
  'Rumus balok?',
  'Ciri prisma?',
  'Diagonal ruang?',
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    sender: 'bot',
    text: 'Halo! 👋\nAku AI Tutor CINARAI.\nAku siap membantumu belajar tentang bangun ruang, bangun datar, rumus, ciri-ciri, dan materi komik CINARAI.\nAda yang ingin kamu tanyakan?',
    time: '09:30',
  },
];

const makeChatTitle = (question: string) => {
  let title = question.trim().replace(/[?!.,]+$/g, '').replace(/^bagaimana cara menghitung\s+/i, 'Rumus ');
  if (title.length > 48) {
    title = `${title.slice(0, 45).replace(/\s+\S*$/, '')}…`;
  }
  return title.charAt(0).toLocaleUpperCase('id-ID') + title.slice(1);
};

const asDate = (value: Date | Timestamp) => value instanceof Timestamp ? value.toDate() : value;

const formatChatDate = (value: Date | Timestamp) => {
  const date = asDate(value);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (left: Date, right: Date) => left.toDateString() === right.toDateString();
  const dayLabel = sameDay(date, today)
    ? 'Hari ini'
    : sameDay(date, yesterday)
      ? 'Kemarin'
      : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  return `${dayLabel} • ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
};

export default function DashboardSiswaAiTutorPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<ChatHistoryItem | null>(null);
  const [inputText, setInputText] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getChatCollection = (uid: string) => collection(firestore, 'users', uid, 'aiTutorChats');

  const loadChatHistory = useCallback(async () => {
    if (!user?.uid) {
      setChatHistory([]);
      return;
    }

    setIsLoadingHistory(true);
    try {
      const chatsQuery = query(getChatCollection(user.uid), orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(chatsQuery);
      setChatHistory(snapshot.docs.map((chatDoc) => ({
        id: chatDoc.id,
        ...chatDoc.data(),
      })) as ChatHistoryItem[]);
    } catch (error) {
      console.error('[DashboardAiTutor] gagal memuat riwayat', error);
      setErrorMessage('Riwayat chat belum dapat dimuat. Coba lagi sebentar.');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    setActiveChatId(null);
    setMessages(INITIAL_MESSAGES);
    setChatHistory([]);
    setShowHistory(false);
    void loadChatHistory();
  }, [loadChatHistory]);

  const startNewChat = async () => {
    if (!user?.uid || isResponding || isSaving) return;

    setIsSaving(true);
    try {
      const chatRef = doc(getChatCollection(user.uid));
      const now = new Date();
      await setDoc(chatRef, {
        title: 'Chat Baru',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: '',
        messages: [],
      });
      setActiveChatId(chatRef.id);
      setMessages(INITIAL_MESSAGES);
      setInputText('');
      setErrorMessage(null);
      setShowHistory(false);
      setChatHistory((previous) => [{
        id: chatRef.id,
        title: 'Chat Baru',
        lastMessage: '',
        createdAt: now,
        updatedAt: now,
        messages: [],
      }, ...previous]);
    } catch (error) {
      console.error('[DashboardAiTutor] gagal membuat chat baru', error);
      setErrorMessage('Chat baru belum dapat dibuat. Coba lagi sebentar.');
    } finally {
      setIsSaving(false);
    }
  };

  const openChat = async (chat: ChatHistoryItem) => {
    if (!user?.uid || isResponding || isLoadingChat) return;

    setIsLoadingChat(true);
    try {
      const chatSnapshot = await getDoc(doc(getChatCollection(user.uid), chat.id));
      if (!chatSnapshot.exists()) {
        setChatHistory((previous) => previous.filter((item) => item.id !== chat.id));
        setErrorMessage('Percakapan ini sudah tidak tersedia.');
        return;
      }

      const storedMessages = (chatSnapshot.data().messages ?? []) as StoredMessage[];
      setActiveChatId(chat.id);
      setMessages(storedMessages.length > 0 ? storedMessages.map((message, index) => {
        const timestamp = message.timestamp instanceof Timestamp
          ? message.timestamp.toDate()
          : new Date(message.timestamp);
        return {
          id: `${timestamp.getTime()}-${index}`,
          sender: message.role === 'user' ? 'user' : 'bot',
          text: message.content,
          time: timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };
      }) : INITIAL_MESSAGES);
      setShowHistory(false);
      setErrorMessage(null);
    } catch (error) {
      console.error('[DashboardAiTutor] gagal membuka percakapan', error);
      setErrorMessage('Percakapan belum dapat dibuka. Coba lagi sebentar.');
    } finally {
      setIsLoadingChat(false);
    }
  };

  const deleteChat = async () => {
    if (!user?.uid || !chatToDelete || isSaving) return;

    setIsSaving(true);
    try {
      await deleteDoc(doc(getChatCollection(user.uid), chatToDelete.id));
      setChatHistory((previous) => previous.filter((chat) => chat.id !== chatToDelete.id));
      if (activeChatId === chatToDelete.id) {
        setActiveChatId(null);
        setMessages(INITIAL_MESSAGES);
      }
      setChatToDelete(null);
    } catch (error) {
      console.error('[DashboardAiTutor] gagal menghapus percakapan', error);
      setErrorMessage('Percakapan belum dapat dihapus. Coba lagi sebentar.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredChatHistory = chatHistory.filter((chat) => {
    const search = searchQuery.trim().toLocaleLowerCase('id-ID');
    return !search || `${chat.title} ${chat.lastMessage}`.toLocaleLowerCase('id-ID').includes(search);
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend ?? inputText;
    if (!text.trim() || isResponding) return;
    if (!user?.uid) {
      setErrorMessage('Masuk ke akunmu untuk menyimpan percakapan.');
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const storedUserMessage: StoredMessage = {
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setErrorMessage(null);
    setIsResponding(true);

    try {
      setIsSaving(true);
      const currentChat = chatHistory.find((chat) => chat.id === activeChatId);
      const chatTitle = !activeChatId || currentChat?.messages.length === 0
        ? makeChatTitle(text.trim())
        : currentChat?.title ?? makeChatTitle(text.trim());
      const chatRef = activeChatId
        ? doc(getChatCollection(user.uid), activeChatId)
        : doc(getChatCollection(user.uid));

      if (activeChatId) {
        await updateDoc(chatRef, {
          title: chatTitle,
          messages: arrayUnion(storedUserMessage),
          lastMessage: text.trim(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(chatRef, {
          title: chatTitle,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: text.trim(),
          messages: [storedUserMessage],
        });
      }
      setActiveChatId(chatRef.id);
      setChatHistory((previous) => {
        const existing = previous.find((chat) => chat.id === chatRef.id);
        const nextChat: ChatHistoryItem = {
          id: chatRef.id,
          title: chatTitle,
          lastMessage: text.trim(),
          createdAt: existing?.createdAt ?? new Date(),
          updatedAt: new Date(),
          messages: [...(existing?.messages ?? []), storedUserMessage],
        };
        return [nextChat, ...previous.filter((chat) => chat.id !== chatRef.id)];
      });
      setIsSaving(false);

      const history = [...messages, userMsg].slice(-20).map((message) => ({
        role: message.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: message.text,
      }));
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text.trim(),
          context: {
            moduleName: 'CINARAI',
            comicTitle: 'CINARAI',
            learningStage: 'Tutor',
            objectInfo: {
              location: 'Materi pembelajaran CINARAI',
              classLevel: 'SD',
              synopsis: 'Tutor matematika dan critical numeracy untuk materi pembelajaran CINARAI.',
              learningTargets: ['Numerasi', 'Geometri', 'Pemecahan masalah'],
            },
            identification: [],
            observationAnswers: {},
            sessionHistory: history,
          },
        }),
      });
      const payload = (await response.json()) as AiChatResponse;
      const answer = payload.answer?.trim();
      if (!response.ok || !answer) {
        throw new Error(payload.error ?? 'Tutor AI tidak mengembalikan jawaban.');
      }
      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        sender: 'bot',
        text: answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const storedAssistantMessage: StoredMessage = {
        role: 'assistant',
        content: answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsSaving(true);
      try {
        await updateDoc(chatRef, {
          messages: arrayUnion(storedAssistantMessage),
          lastMessage: answer,
          updatedAt: serverTimestamp(),
        });
        setChatHistory((previous) => previous.map((chat) => chat.id === chatRef.id ? {
          ...chat,
          lastMessage: answer,
          updatedAt: new Date(),
          messages: [...chat.messages, storedAssistantMessage],
        } : chat));
      } catch (error) {
        console.error('[DashboardAiTutor] gagal menyimpan jawaban', error);
        setErrorMessage('Jawaban diterima, tetapi belum dapat disimpan ke riwayat.');
      } finally {
        setIsSaving(false);
      }
    } catch (error) {
      console.error('[DashboardAiTutor] request failed', error);
      setInputText(text.trim());
      setErrorMessage(error instanceof Error && error.message.includes('permission')
        ? 'Pesan belum tersimpan. Periksa koneksi akunmu lalu coba lagi.'
        : 'Maaf, Tutor AI sedang mengalami gangguan. Coba kirim pertanyaan lagi.');
    } finally {
      setIsSaving(false);
      setIsResponding(false);
    }
  };

  return (
    <DashboardPage
      title="AI Tutor CINARAI"
      subtitle="Siap membantumu belajar kapan saja!"
      gradientFrom="#623CEA"
      gradientTo="#7550F1"
      headerAction={
        <button
          type="button"
          onClick={() => {
            setShowHistory(true);
            void loadChatHistory();
          }}
          disabled={isResponding || isLoadingHistory}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/45 bg-white/15 px-3.5 text-[13px] font-bold text-white transition-colors hover:bg-white/25 active:bg-white/30 disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l3 2" />
          </svg>
          Riwayat Chat
        </button>
      }
      className="flex h-[calc(100dvh-86px-env(safe-area-inset-bottom))] min-h-0 flex-col overflow-hidden"
      contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
      rightContent={
        <div className="flex items-center gap-3">
          <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full bg-white/20 p-0.5 ring-2 ring-white/50 shadow-md backdrop-blur-sm">
            <div className="relative h-full w-full overflow-hidden rounded-full">
              <Image
                src="/images/ai/RobotAI.png"
                alt=""
                fill
                sizes="68px"
                className="object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== '/images/ai/RobotAI.png') {
                    target.src = '/images/ai/RobotAI.png';
                  }
                }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowInfoModal(true)}
            className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-white text-white transition-colors hover:bg-white/10 active:bg-white/20"
            aria-label="Info Batasan AI"
          >
            <svg viewBox="0 0 24 24" className="h-[14px] w-[14px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>
        </div>
      }
    >

      {showHistory ? (
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden px-1">
          <div className="flex items-center justify-between gap-3 pb-3">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm"
                aria-label="Kembali ke chat"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <h2 className="truncate text-lg font-extrabold text-slate-800">Riwayat Chat</h2>
            </div>
            <button
              type="button"
              onClick={() => void startNewChat()}
              disabled={isSaving || isResponding}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#623CEA] px-4 text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-60"
            >
              <span className="text-lg leading-none" aria-hidden="true">+</span>
              Chat Baru
            </button>
          </div>

          <label className="mb-3 flex min-h-12 items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari percakapan"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              aria-label="Cari percakapan"
            />
          </label>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pb-3">
            {isLoadingHistory ? (
              <p className="py-8 text-center text-sm font-medium text-slate-500">Memuat riwayat...</p>
            ) : filteredChatHistory.length === 0 ? (
              <p className="py-8 text-center text-sm font-medium text-slate-500">
                {chatHistory.length === 0 ? 'Belum ada riwayat percakapan.' : 'Percakapan tidak ditemukan.'}
              </p>
            ) : filteredChatHistory.map((chat) => (
              <div key={chat.id} className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white p-2.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => void openChat(chat)}
                  disabled={isLoadingChat || isResponding}
                  className="min-w-0 flex-1 rounded-xl px-2 py-2 text-left transition-colors hover:bg-slate-50 disabled:opacity-60"
                >
                  <span className="block truncate text-[14px] font-bold text-slate-800">{chat.title || 'Chat Baru'}</span>
                  <span
                    className="mt-1 block text-[13px] leading-snug text-slate-500"
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {chat.lastMessage || 'Belum ada pesan'}
                  </span>
                  <span className="mt-1.5 block text-[11px] font-medium text-slate-400">{formatChatDate(chat.updatedAt)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChatToDelete(chat)}
                  disabled={isSaving}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60"
                  aria-label={`Hapus percakapan ${chat.title || 'Chat Baru'}`}
                  title="Hapus percakapan"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="m19 6-1 14H6L5 6" />
                    <path d="M10 11v5M14 11v5" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5 pb-3">
          <div className="space-y-4">
            <div className="flex justify-center">
              <span className="rounded-full bg-slate-200/60 px-3 py-1 text-[11px] font-semibold text-slate-500">
                Hari ini
              </span>
            </div>

            {messages.map((msg) => {
          if (msg.sender === 'user') {
            return (
              <div key={msg.id} className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="max-w-[88%] rounded-[18px] rounded-br-md bg-[#845EF7] px-3.5 py-2.5 text-white shadow-[0_4px_12px_rgba(132,94,247,0.18)]">
                  <p className="break-words text-[14px] font-medium leading-relaxed">{msg.text}</p>
                  <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-white/80">
                    <span>{msg.time}</span>
                    <svg viewBox="0 0 24 24" className="h-[12px] w-[12px]" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className="flex justify-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_8px_24px_rgba(37,99,235,0.08)]">
                <Image
                  src="/images/ai/RobotAI.png"
                  alt=""
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== '/images/ai/RobotAI.png') {
                      target.src = '/images/ai/RobotAI.png';
                    }
                  }}
                />
              </div>
              <div className="max-w-[88%] rounded-[18px] rounded-tl-md border border-slate-100 bg-white px-3.5 py-2.5 text-neutral-800 shadow-[0_8px_24px_rgba(37,99,235,0.06)]">
                <div className="break-words whitespace-pre-line text-[14px] font-medium leading-relaxed text-neutral-800">
                  {msg.text}
                </div>
                
                {msg.listItems && (
                  <ul className="mt-3 space-y-2 pl-2 text-[14px] font-medium leading-relaxed text-neutral-700">
                    {msg.listItems.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <span className="text-[#623CEA] font-bold mt-1 text-[8px]">⚫</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {msg.followUp && (
                  <p className="mt-2.5 text-[15px] font-semibold text-[#623CEA]">
                    {msg.followUp}
                  </p>
                )}

                <div className="mt-2 text-right text-[10px] font-medium text-slate-400">
                  {msg.time}
                </div>
              </div>
            </div>
          );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="shrink-0 pt-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_QUESTIONS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => void handleSend(chip)}
                disabled={isResponding}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#D5C2FE] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#623CEA] shadow-[0_2px_8px_rgba(98,60,234,0.08)] transition-all hover:bg-indigo-50 active:scale-95 disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] text-[#A78BFA]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2 2h14a2 2 0 0 1 2 2z" />
                </svg>
                {chip}
              </button>
            ))}
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200/70 bg-[#f8faff] pt-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
          className="box-border flex min-h-[58px] w-full items-center gap-2 rounded-[22px] border border-slate-100 bg-white p-1.5 shadow-[0_8px_24px_rgba(37,99,235,0.10)]"
        >
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3F0FF] text-[#623CEA] transition-colors hover:bg-indigo-100 active:scale-95"
            aria-label="Lampiran"
          >
            <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ketik pertanyaanmu di sini..."
            disabled={isResponding}
            className="min-w-0 flex-1 bg-transparent px-1.5 text-[14px] font-medium text-neutral-800 placeholder-slate-400 outline-none transition-all focus:ring-0"
          />
          <button
            type="submit"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#845EF7] text-white shadow-md transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Kirim pesan"
            disabled={isResponding || !inputText.trim()}
          >
            <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
        {isResponding ? <p className="mt-2 text-center text-xs font-semibold text-slate-500">AI Tutor sedang berpikir...</p> : null}
        {errorMessage ? <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-center text-xs font-semibold text-rose-700">{errorMessage}</p> : null}
        </div>
      </div>
      )}

      {/* Info Modal */}
      {chatToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-5 backdrop-blur-sm" role="presentation">
          <div className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-5 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="delete-chat-title">
            <div>
              <h3 id="delete-chat-title" className="text-lg font-extrabold text-slate-900">Hapus percakapan?</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">Percakapan ini akan dihapus dan tidak dapat dikembalikan.</p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setChatToDelete(null)}
                className="min-h-11 rounded-full px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void deleteChat()}
                disabled={isSaving}
                className="min-h-11 rounded-full bg-rose-600 px-5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-5 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-[0_16px_40px_rgba(37,99,235,0.10)] space-y-4 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-500">
                <svg viewBox="0 0 24 24" className="h-[24px] w-[24px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <h3 className="text-[16px] font-bold">Batasan AI Tutor</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition-colors"
                aria-label="Tutup"
              >
                <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <div className="text-[14px] font-medium leading-relaxed text-slate-600 space-y-3">
              <p>AI hanya menjawab topik berikut:</p>
              <ul className="space-y-1.5 pl-2">
                {['Bangun ruang', 'Bangun datar', 'Rumus', 'Ciri-ciri', 'Identifikasi bentuk', 'Materi semua komik CINARAI', 'Numerasi', 'Geometri', 'Materi pembelajaran aplikasi'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="h-[16px] w-[16px] text-emerald-500" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 rounded-xl bg-rose-50 p-3 text-rose-700">
                <p className="text-[13px] italic">&quot;Jika bertanya di luar topik, AI akan menjawab: Maaf, AI Tutor CINARAI hanya membantu pembelajaran materi yang tersedia pada aplikasi.&quot;</p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setShowInfoModal(false)}
              className="mt-2 w-full rounded-full bg-[#623CEA] py-3 text-[15px] font-bold text-white transition-colors hover:bg-indigo-700 active:scale-95"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </DashboardPage>
  );
}
