'use client';

import { useState, useRef, useEffect } from 'react';

type Message = {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  listItems?: string[];
  followUp?: string;
  time: string;
};

const QUICK_QUESTIONS = [
  'Apa itu kubus?',
  'Apa ciri prisma?',
  'Apa itu limas?',
  'Apa rumus balok?',
  'Apa diagonal ruang?',
  'Lainnya',
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    sender: 'bot',
    text: 'Halo! 👋\nAku AI Tutor CINARAI.\nAku siap membantumu belajar tentang bangun ruang, bangun datar, rumus, ciri-ciri, dan materi komik CINARAI.\nAda yang ingin kamu tanyakan?',
    time: '09:30',
  },
  {
    id: '2',
    sender: 'user',
    text: 'Apa itu kubus?',
    time: '09:31',
  },
  {
    id: '3',
    sender: 'bot',
    text: 'Kubus adalah bangun ruang yang memiliki 6 sisi berbentuk persegi yang kongruen.\n\nCiri-ciri kubus:',
    listItems: [
      '6 sisi berbentuk persegi',
      '12 rusuk yang sama panjang',
      '8 titik sudut',
      'Semua sudutnya siku-siku (90°)',
    ],
    time: '09:31',
  },
];

export default function DashboardSiswaAiTutorPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (textToSend?: string) => {
    const text = textToSend ?? inputText;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    // Simulate AI Tutor response
    setTimeout(() => {
      let botResponseText = 'Aku siap membantu! Mari kita bahas konsep geometris dan matematika dari materi komik CINARAI.';
      let items: string[] | undefined = undefined;
      let followUp: string | undefined = undefined;

      const lower = text.toLowerCase();
      if (lower.includes('kubus')) {
        botResponseText = 'Rumus volume kubus adalah:\n\nV = s × s × s\n\nKeterangan:\nV = Volume\ns = Panjang rusuk kubus';
      } else if (lower.includes('persegi') && !lower.includes('panjang')) {
        botResponseText = 'Persegi adalah bangun datar yang memiliki:';
        items = ['4 sisi sama panjang', '4 sudut siku-siku (90°)', '2 diagonal sama panjang dan tegak lurus'];
      } else if (lower.includes('lingkaran')) {
        botResponseText = 'Ciri-ciri lingkaran meliputi:';
        items = ['Memiliki 1 titik pusat', 'Memiliki simetri lipat dan putar tak terhingga', 'Jarak dari titik pusat ke semua tepi selalu sama (jari-jari)'];
      } else if (lower.includes('luar topik') || lower.includes('game') || lower.includes('film')) {
        botResponseText = 'Maaf, AI Tutor CINARAI hanya membantu pembelajaran materi yang tersedia pada aplikasi.';
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botResponseText,
        listItems: items,
        followUp: followUp,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 600);
  };

  return (
    <div className="mx-auto min-h-screen max-w-[1200px] bg-[#F8FAFC] pb-[88px] text-neutral-900">
      {/* 1. HEADER */}
      <section className="sticky top-0 z-40 w-full overflow-hidden rounded-b-[32px] bg-gradient-to-br from-[#4F46E5] to-[#6D5DF6] px-5 pb-6 pt-[max(24px,env(safe-area-inset-top))] text-white shadow-md">
        <div className="flex items-start gap-4">
          <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-2xl bg-white/20 p-2 shadow-inner ring-[2px] ring-white/50 backdrop-blur-sm">
            <svg viewBox="0 0 24 24" className="h-full w-full text-white" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4" />
              <line x1="8" y1="16" x2="8.01" y2="16" />
              <line x1="16" y1="16" x2="16.01" y2="16" />
            </svg>
          </div>
          <div className="flex-1 pt-1">
            <h1 className="text-[20px] font-bold leading-tight">AI Tutor CINARAI</h1>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
              <span className="text-[13px] font-medium">Online</span>
            </div>
            <p className="mt-2 text-[13px] font-medium leading-relaxed text-white/90">
              Siap membantumu belajar kapan saja!
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowInfoModal(true)}
            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 active:bg-white/20 transition-colors"
            aria-label="Info Batasan AI"
          >
            <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>
        </div>
      </section>

      {/* 2. CHAT AREA */}
      <div className="px-5 pt-6 pb-2 space-y-5">
        <div className="flex justify-center">
          <span className="rounded-full bg-slate-200/60 px-4 py-1 text-[12px] font-semibold text-slate-500">
            Hari ini
          </span>
        </div>

        {messages.map((msg) => {
          if (msg.sender === 'user') {
            return (
              <div key={msg.id} className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="max-w-[75%] rounded-2xl rounded-br-md bg-gradient-to-r from-indigo-500 to-purple-500 p-3 text-white shadow-sm">
                  <p className="text-[15px] font-medium leading-relaxed">{msg.text}</p>
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
              <div className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[#4F46E5] ring-2 ring-white">
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <circle cx="12" cy="5" r="2" />
                  <path d="M12 7v4" />
                </svg>
              </div>
              <div className="max-w-[80%] rounded-2xl rounded-tl-md bg-[#F4F3FF] p-4 border border-[#E5E7EB] shadow-sm text-neutral-800">
                <div className="text-[15px] font-medium leading-relaxed whitespace-pre-line text-neutral-800">
                  {msg.text}
                </div>
                
                {msg.listItems && (
                  <ul className="mt-2 space-y-1.5 pl-1.5 text-[14px] font-medium leading-relaxed text-neutral-700">
                    {msg.listItems.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-[#4F46E5] font-bold mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {msg.followUp && (
                  <p className="mt-2.5 text-[15px] font-semibold text-[#4F46E5]">
                    {msg.followUp}
                  </p>
                )}

                <div className="mt-1.5 text-right text-[10px] font-medium text-slate-400">
                  {msg.time}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. PERTANYAAN CEPAT */}
      <div className="px-5 pt-2 pb-6 animate-in fade-in duration-500">
        <h3 className="mb-3 text-[14px] font-bold text-[#4F46E5]">
          Pertanyaan Cepat
        </h3>
        <div className="flex flex-wrap gap-2.5">
          {QUICK_QUESTIONS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleSend(chip)}
              className="flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-[14px] font-medium text-indigo-700 shadow-sm transition-all hover:bg-indigo-50 active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* 4. INPUT BAR */}
      <div 
        className="fixed left-0 right-0 z-30 mx-auto w-full max-w-[480px] px-5"
        style={{ bottom: 'calc(84px + env(safe-area-inset-bottom))' }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex h-[56px] w-full items-center gap-3 rounded-full bg-white p-1.5 shadow-[0_12px_40px_rgba(79,70,229,0.15)] border border-slate-100"
        >
          <button
            type="button"
            className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition-colors hover:bg-indigo-100 active:scale-95"
            aria-label="Lampiran"
          >
            <svg viewBox="0 0 24 24" className="h-[24px] w-[24px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ketik pertanyaanmu di sini..."
            className="flex-1 bg-transparent px-2 text-[15px] font-medium text-neutral-800 placeholder-slate-400 outline-none transition-all focus:ring-0"
          />
          <button
            type="submit"
            className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md transition-transform hover:scale-105 active:scale-95"
            aria-label="Kirim pesan"
          >
            <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-5 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-300">
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
                <p className="text-[13px] italic">"Jika bertanya di luar topik, AI akan menjawab: Maaf, AI Tutor CINARAI hanya membantu pembelajaran materi yang tersedia pada aplikasi."</p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setShowInfoModal(false)}
              className="mt-2 w-full rounded-full bg-[#4F46E5] py-3 text-[15px] font-bold text-white transition-colors hover:bg-indigo-700 active:scale-95"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
