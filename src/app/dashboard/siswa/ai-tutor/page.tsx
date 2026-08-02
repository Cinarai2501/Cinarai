'use client';

import { useState } from 'react';

type Message = {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  listItems?: string[];
  followUp?: string;
  time: string;
};

const SUGGESTION_CHIPS = [
  'Apa itu persegi?',
  'Ciri-ciri lingkaran?',
  'Rumus luas persegi panjang?',
  'Contoh bangun datar di kehidupan sehari-hari',
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    sender: 'bot',
    text: 'Hai! 👋\nAku AI Tutor CINARAI.\nAku siap membantumu belajar tentang bangun ruang, bangun datar, rumus, ciri-ciri, dan materi di komik.\nAda yang ingin kamu tanyakan?',
    time: '09:20',
  },
  {
    id: '2',
    sender: 'user',
    text: 'Apa ciri-ciri segitiga sama kaki?',
    time: '09:21',
  },
  {
    id: '3',
    sender: 'bot',
    text: 'Segitiga sama kaki memiliki:',
    listItems: [
      'Dua sisi sama panjang',
      'Dua sudut sama besar',
      'Satu sisi alas',
    ],
    followUp: 'Ingin lihat contoh gambarnya?',
    time: '09:31',
  },
];

export default function DashboardSiswaAiTutorPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);

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

      const lower = text.toLowerCase();
      if (lower.includes('persegi') && !lower.includes('panjang')) {
        botResponseText = 'Persegi adalah bangun datar yang memiliki:';
        items = ['4 sisi sama panjang', '4 sudut siku-siku (90°)', '2 diagonal sama panjang dan tegak lurus'];
      } else if (lower.includes('lingkaran')) {
        botResponseText = 'Ciri-ciri lingkaran meliputi:';
        items = ['Memiliki 1 titik pusat', 'Memiliki simetri lipat dan putar tak terhingga', 'Jarak dari titik pusat ke semua tepi selalu sama (jari-jari)'];
      } else if (lower.includes('persegi panjang')) {
        botResponseText = 'Rumus luas persegi panjang:';
        items = ['Luas = Panjang × Lebar (L = p × l)', 'Keliling = 2 × (Panjang + Lebar)'];
      } else if (lower.includes('contoh')) {
        botResponseText = 'Contoh bangun datar di sekitar kita:';
        items = ['Buku & Papan Tulis (Persegi Panjang)', 'Uang Koin & Jam Dinding (Lingkaran)', 'Atap Rumah (Segitiga)'];
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botResponseText,
        listItems: items,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 600);
  };

  return (
    <div className="mx-auto max-w-[1200px] bg-[#F5F8FD] px-3 pb-28 sm:px-6 lg:px-8 space-y-4">
      {/* 1. Header Bar AI Tutor */}
      <section className="rounded-3xl bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-[48px] w-[48px] items-center justify-center rounded-2xl bg-[#E0F2FE] text-[#1D93FF] shadow-sm">
            <svg viewBox="0 0 24 24" className="h-[26px] w-[26px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4" />
              <line x1="8" y1="16" x2="8.01" y2="16" />
              <line x1="16" y1="16" x2="16.01" y2="16" />
            </svg>
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-[#1E293B]">AI Tutor CINARAI</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
              <span className="text-[12px] font-medium text-[#22C55E]">Online</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowInfoModal(true)}
          className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-slate-50 text-[#64748B] hover:bg-slate-100 transition"
          aria-label="Info AI Tutor"
        >
          <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </button>
      </section>

      {/* 2. Chat Container */}
      <div className="space-y-4 pt-1">
        {messages.map((msg) => {
          if (msg.sender === 'user') {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[80%] rounded-3xl rounded-br-none bg-[#1D93FF] p-4 text-white shadow-sm">
                  <p className="text-[14px] leading-relaxed">{msg.text}</p>
                  <div className="mt-1.5 flex items-center justify-end gap-1 text-[11px] text-white/80">
                    <span>{msg.time}</span>
                    <span>✓</span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className="flex justify-start">
              <div className="max-w-[85%] rounded-3xl rounded-tl-none bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] border border-slate-100 text-[#1E293B]">
                <p className="text-[14px] leading-relaxed whitespace-pre-line">{msg.text}</p>
                
                {msg.listItems && (
                  <ul className="mt-2 space-y-1 pl-1 text-[14px] leading-relaxed text-[#334155]">
                    {msg.listItems.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-[#1D93FF] font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {msg.followUp && (
                  <p className="mt-2.5 text-[14px] font-medium text-[#1D93FF]">
                    {msg.followUp}
                  </p>
                )}

                <div className="mt-2 text-right text-[11px] font-medium text-[#94A3B8]">
                  {msg.time}
                </div>
              </div>
            </div>
          );
        })}

        {/* Suggestion Chips */}
        <div className="flex flex-wrap gap-2 pt-2">
          {SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleSend(chip)}
              className="rounded-full bg-[#E0F2FE] px-4 py-2 text-[13px] font-semibold text-[#0284C7] transition hover:bg-[#BAE6FD] active:scale-95 shadow-sm"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Input Bar & Send Button */}
      <div className="sticky bottom-20 z-30 pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 rounded-full bg-white p-2 shadow-[0_12px_36px_rgba(15,23,42,0.12)] border border-slate-100"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Tanya sesuatu..."
            className="flex-1 bg-transparent px-4 text-[14px] text-[#1E293B] placeholder-[#94A3B8] outline-none"
          />
          <button
            type="submit"
            className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-[#1D93FF] text-white shadow-md transition hover:bg-[#0F5FB5] active:scale-95"
            aria-label="Kirim pesan"
          >
            <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>

      {/* 4. AI Tutor Description Card */}
      <div className="rounded-3xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] border border-slate-100">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#9333EA]">
          AI TUTOR
        </h2>
        <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-[#64748B]">
          Tempat siswa bertanya dan berdiskusi dengan AI. AI hanya menjawab topik yang <strong className="text-[#1E293B]">relevan dengan pembelajaran</strong> di aplikasi.
        </p>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1E293B]">Tentang AI Tutor</h3>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="rounded-full p-1 text-[#94A3B8] hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-[#64748B] leading-relaxed">
              AI Tutor CINARAI membantu siswa memahami materi bangun datar, bangun ruang, rumus, dan ciri-ciri geometris secara interaktif.
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="rounded-xl bg-[#1D93FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F5FB5]"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
