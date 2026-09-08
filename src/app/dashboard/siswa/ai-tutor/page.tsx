'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import DashboardPage from '@/components/dashboard/DashboardPage';

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

export default function DashboardSiswaAiTutorPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend ?? inputText;
    if (!text.trim() || isResponding) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setErrorMessage(null);
    setIsResponding(true);

    try {
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
      setMessages((prev) => [...prev, {
        id: `${Date.now()}-assistant`,
        sender: 'bot',
        text: answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch (error) {
      console.error('[DashboardAiTutor] request failed', error);
      setInputText(text.trim());
      setErrorMessage('Maaf, Tutor AI sedang mengalami gangguan. Coba kirim pertanyaan lagi.');
    } finally {
      setIsResponding(false);
    }
  };

  return (
    <DashboardPage
      title="AI Tutor CINARAI"
      subtitle="Siap membantumu belajar kapan saja!"
      gradientFrom="#623CEA"
      gradientTo="#7550F1"
      className="flex h-[100dvh] min-h-0 flex-col overflow-hidden pb-[calc(88px+env(safe-area-inset-bottom))]"
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
            <div className="border-t border-slate-200/70 pt-3">
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
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    {chip}
                  </button>
                ))}
              </div>
            </div>
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

      {/* Info Modal */}
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
