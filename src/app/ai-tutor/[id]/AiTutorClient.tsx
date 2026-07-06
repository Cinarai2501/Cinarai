'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getFirestoreDocument, queryFirestoreCollection } from '@/services/firestore';
import { fetchComicById } from '@/services/comicFirestoreService';
import { generateTutorResponse } from '@/lib/ai';
import type { Comic } from '@/types/comic';
import type { IdentificationAnswerDocument, ReflectionDocument } from '@/types/firestore';

interface AiTutorClientProps {
  comicId: number;
}

interface ChatMessage {
  id: number;
  role: 'assistant' | 'user';
  content: string;
}

interface TutorSessionMemory {
  moduleId: number;
  messages: ChatMessage[];
}

const starterMessages: ChatMessage[] = [
  {
    id: 1,
    role: 'assistant',
    content: 'Halo! Aku adalah AI Tutor. Saya akan membantu kamu memahami konteks belajar dari observasi dan identifikasi yang sudah kamu isi.',
  },
];

export default function AiTutorClient({ comicId }: AiTutorClientProps) {
  const { user, loading: authLoading } = useAuth();
  const [comic, setComic] = useState<Comic | null>(null);
  const [reflection, setReflection] = useState<ReflectionDocument | null>(null);
  const [identificationAnswers, setIdentificationAnswers] = useState<IdentificationAnswerDocument[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isResponding, setIsResponding] = useState(false);
  const [sessionMemory, setSessionMemory] = useState<TutorSessionMemory | null>(null);

  const isObservationComplete = useMemo(() => {
    const answers = reflection?.jawaban;
    if (!answers) return false;

    return ['bangunRuang', 'alasan', 'bagianMenarik', 'hubunganMatematika'].every((key) => {
      const value = answers[key];
      return typeof value === 'string' && value.trim().length > 0;
    });
  }, [reflection]);

  useEffect(() => {
    let isMounted = true;

    const loadContext = async () => {
      setIsLoading(true);

      try {
        const [comicData, reflectionData] = await Promise.all([
          fetchComicById(comicId),
          user?.uid ? getFirestoreDocument('reflection', `${user.uid}_${comicId}_observasi`) : Promise.resolve(null),
        ]);

        if (!isMounted) return;

        setComic(comicData);
        setReflection(reflectionData as ReflectionDocument | null);

        if (user?.uid) {
          const answers = await queryFirestoreCollection('identification_answers', {
            filters: [
              { field: 'userId', operator: '==', value: user.uid },
              { field: 'comicId', operator: '==', value: comicId },
            ],
            orderByField: 'step',
            orderDirection: 'asc',
          });
          if (isMounted) {
            setIdentificationAnswers(answers as IdentificationAnswerDocument[]);
          }
        } else {
          setIdentificationAnswers([]);
        }
      } catch (error) {
        console.error('[AiTutor] gagal memuat konteks Firestore', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadContext();

    return () => {
      isMounted = false;
    };
  }, [comicId, user?.uid]);

  useEffect(() => {
    if (!comic) {
      setSessionMemory(null);
      setMessages(starterMessages);
      return;
    }

    const existingSession = sessionMemory?.moduleId === comicId ? sessionMemory : null;
    if (existingSession) {
      setMessages(existingSession.messages);
    } else {
      setSessionMemory({ moduleId: comicId, messages: starterMessages });
      setMessages(starterMessages);
    }
  }, [comic, comicId, sessionMemory]);

  const summaryItems = useMemo(
    () => [
      { label: 'Nama Modul', value: comic?.title ?? 'Memuat...' },
      { label: 'Status Observasi', value: isObservationComplete ? 'Selesai' : 'Belum selesai' },
      { label: 'Identifikasi', value: identificationAnswers.length > 0 ? `${identificationAnswers.length} bagian` : 'Belum ada' },
    ],
    [comic, identificationAnswers.length, isObservationComplete],
  );

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || !isObservationComplete || isResponding || !comic) return;

    const userMessage: ChatMessage = { id: Date.now(), role: 'user', content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setSessionMemory({ moduleId: comicId, messages: nextMessages });
    setDraft('');
    setIsResponding(true);

    try {
      const response = await generateTutorResponse({
        moduleName: comic.title,
        identification: identificationAnswers.map((answer) => ({
          step: answer.step,
          selectedAnswer: answer.selectedAnswer,
          note: answer.note,
          reason: answer.reason,
        })),
        objectInfo: {
          location: comic.lokasi,
          classLevel: comic.kelas,
          synopsis: comic.synopsis,
          learningTargets: comic.learningTargets,
        },
        observationAnswers: reflection?.jawaban ?? {},
        question: trimmed,
        sessionHistory: nextMessages.map(({ role, content }) => ({ role, content })),
      });

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.answer,
      };
      const updatedMessages = [...nextMessages, assistantMessage];
      setMessages(updatedMessages);
      setSessionMemory({ moduleId: comicId, messages: updatedMessages });
    } catch (error) {
      console.error('[AiTutor] gagal memanggil AI service', error);
      const fallbackMessage: ChatMessage = {
        id: Date.now() + 2,
        role: 'assistant',
        content: 'Maaf, saya sedang tidak bisa merespons saat ini. Coba lagi sebentar lagi.',
      };
      const updatedMessages = [...nextMessages, fallbackMessage];
      setMessages(updatedMessages);
      setSessionMemory({ moduleId: comicId, messages: updatedMessages });
    } finally {
      setIsResponding(false);
    }
  };

  if (!comic) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-neutral-50 px-4 py-6 text-center sm:px-6">
        <span className="text-5xl">📭</span>
        <div>
          <p className="text-base font-black text-neutral-800">Komik Tidak Ditemukan</p>
          <p className="mt-1 text-sm text-neutral-500 leading-relaxed">
            Komik dengan ID {comicId} tidak ditemukan.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="mt-2 inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-primary-600 px-5 py-3 text-base font-semibold text-white"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#f0f7ff]" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <header className="flex-shrink-0 border-b border-neutral-100 bg-white shadow-sm" style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}>
        <div className="mx-auto flex w-full max-w-[1400px] items-center gap-3 px-3 py-3 sm:px-4 md:px-6 md:py-4 lg:px-8">
          <Link
            href={`/comic/${comicId}/learn`}
            aria-label="Kembali ke pembelajaran"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">AI Tutor</p>
            <h1 className="truncate text-base font-black leading-tight text-neutral-800 md:text-lg">
              {comic.title}
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#f0f7ff]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-3 sm:px-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
          <section className="rounded-[24px] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600">Konteks Belajar</p>
                <h2 className="mt-1 text-xl font-black text-neutral-900">Data pembelajaran dari observasi dan identifikasi</h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                  Halaman ini menampilkan konteks belajar dari Firestore agar kamu bisa melanjutkan pembelajaran dengan lebih terarah.
                </p>
              </div>
              <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${isObservationComplete ? 'bg-accent-50 text-accent-700' : 'bg-amber-50 text-amber-700'}`}>
                {isObservationComplete ? 'Konteks siap' : 'Selesaikan observasi dulu'}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {summaryItems.map((item) => (
                <div key={item.label} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-neutral-800">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <h3 className="text-sm font-black uppercase tracking-[0.15em] text-neutral-500">Jawaban Observasi</h3>
                {reflection?.jawaban ? (
                  <div className="mt-3 space-y-2 text-sm text-neutral-700">
                    {Object.entries(reflection.jawaban).map(([key, value]) => (
                      <div key={key} className="rounded-xl border border-neutral-200 bg-white p-3">
                        <p className="font-semibold text-neutral-800">{key}</p>
                        <p className="mt-1 text-neutral-600">{value || '—'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-neutral-500">Belum ada jawaban observasi yang tersimpan.</p>
                )}
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <h3 className="text-sm font-black uppercase tracking-[0.15em] text-neutral-500">Identifikasi</h3>
                {identificationAnswers.length > 0 ? (
                  <div className="mt-3 space-y-2 text-sm text-neutral-700">
                    {identificationAnswers.map((answer) => (
                      <div key={`${answer.userId}-${answer.step}`} className="rounded-xl border border-neutral-200 bg-white p-3">
                        <p className="font-semibold text-neutral-800">Langkah {answer.step}</p>
                        <p className="mt-1">Jawaban: {answer.selectedAnswer || '—'}</p>
                        <p className="mt-1">Catatan: {answer.note || '—'}</p>
                        <p className="mt-1">Alasan: {answer.reason || '—'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-neutral-500">Belum ada jawaban identifikasi yang tersimpan.</p>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <h3 className="text-sm font-black uppercase tracking-[0.15em] text-neutral-500">Informasi Objek</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-neutral-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400">Lokasi</p>
                  <p className="mt-1 text-sm font-semibold text-neutral-800">{comic.lokasi}</p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400">Kelas</p>
                  <p className="mt-1 text-sm font-semibold text-neutral-800">{comic.kelas}</p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-3 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400">Sinopsis</p>
                  <p className="mt-1 text-sm text-neutral-700">{comic.synopsis}</p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-3 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400">Target Belajar</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
                    {comic.learningTargets.map((target) => (
                      <li key={target}>{target}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="flex min-h-[480px] flex-col overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-sm">
              <div className="border-b border-neutral-100 px-4 py-4 sm:px-5">
                <h3 className="text-lg font-black text-neutral-900">Chat AI</h3>
                <p className="mt-1 text-sm text-neutral-500">Ajukan pertanyaan seputar objek dan konsep matematika.</p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-neutral-50 px-4 py-4 sm:px-5">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        message.role === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'border border-neutral-200 bg-white text-neutral-700'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {!isObservationComplete && !authLoading && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    Selesaikan observasi terlebih dahulu agar konteks belajar bisa ditampilkan dengan lengkap.
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-100 bg-white px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={3}
                    placeholder={isObservationComplete ? 'Tuliskan pertanyaanmu...' : 'Selesaikan observasi terlebih dahulu'}
                    disabled={!isObservationComplete || isLoading || authLoading || isResponding}
                    className="min-h-[96px] flex-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!isObservationComplete || isLoading || authLoading || isResponding}
                    className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
                  >
                    {isResponding ? 'Memproses...' : 'Kirim'}
                  </button>
                </div>
              </div>
            </div>

            <aside className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-secondary-100 text-lg">🕘</div>
                <div>
                  <h3 className="text-lg font-black text-neutral-900">Riwayat Percakapan</h3>
                  <p className="text-sm text-neutral-500">Daftar pertanyaan yang sudah kamu ajukan.</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {messages.filter((message) => message.role === 'user').length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-500">
                    Belum ada pertanyaan yang dikirim.
                  </div>
                ) : (
                  messages
                    .filter((message) => message.role === 'user')
                    .map((message) => (
                      <div key={message.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                        <p className="text-sm font-semibold text-neutral-800">{message.content}</p>
                      </div>
                    ))
                )}
              </div>
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
}
