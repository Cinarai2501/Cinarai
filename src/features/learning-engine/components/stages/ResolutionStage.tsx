'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import { RESOLUTION_MISSIONS, type ResolutionMission } from './resolutionStage.helpers';

function getTutorFallback(mission: ResolutionMission, isCorrect: boolean, attempt: number = 0): string {
  if (isCorrect) {
    return [
      '✨ Selamat! Jawabanmu benar!',
      '',
      'Aku bangga dengan kamu. Mari kita lihat bagaimana cara mengerjakannya:',
      '',
      `📚 Bangun yang kita gunakan: ${mission.shape}`,
      '',
      `📏 Rumusnya adalah: ${mission.formula}`,
      '',
      `📌 Jadi hasilnya adalah: ${mission.answer}`,
      '',
      `🏛️ Hubungan dengan Candi Jawi: ${mission.context}`,
      '',
      'Kamu sudah memahami konsep yang penting. Sangat bagus! 👏',
    ].join('\n');
  }

  // Untuk jawaban salah - attempt pertama: berikan petunjuk tanpa jawaban langsung
  if (attempt === 0 || attempt === 1) {
    return [
      '💡 Hmm, jawaban itu belum tepat. Jangan khawatir!',
      '',
      'Mari kita periksa bersama-sama:',
      '',
      `🔍 Bangun yang sedang kita hitung adalah: ${mission.shape}`,
      '',
      `📏 Rumus yang kita pakai: ${mission.formula.split('=')[0].trim()}`,
      '',
      'Coba perhatikan langkah-langkahnya lebih teliti. Masukkan angka dengan hati-hati.',
      '',
      'Ingat: Kesalahan adalah guru terbaik. Ayo coba lagi! 💪',
    ].join('\n');
  }

  // Untuk attempt kedua: lebih detail guidance
  if (attempt === 2) {
    return [
      '🤔 Mari kita coba pendekatan lain:',
      '',
      `Langkah 1: Identifikasi bangunnya - ${mission.shape}`,
      '',
      `Langkah 2: Gunakan rumus: ${mission.formula.split('=')[0].trim()}`,
      '',
      `Langkah 3: Masukkan nilai-nilainya dengan teliti`,
      '',
      `Langkah 4: Hitung hasilnya: ${mission.formula}`,
      '',
      'Aku yakin kamu bisa! Coba lagi dengan keyakinan penuh! 🌟',
    ].join('\n');
  }

  // Untuk attempt ketiga ke atas
  return [
    '📖 Mari kita lihat penjelasan lengkapnya:',
    '',
    `Bangun: ${mission.shape}`,
    `Rumus: ${mission.formula}`,
    `Hasil: ${mission.answer}`,
    '',
    'Belajarlah dari pengalaman ini. Kamu akan lebih mahir seiring waktu! 🚀',
  ].join('\n');
}

export default function ResolutionStage() {
  const { comic, setCanAdvance, nextStage } = useLearningEngine();
  const [misiStarted, setMisiStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedUpToIndex, setCompletedUpToIndex] = useState(-1); // Track progress yang ditampilkan
  const [selected, setSelected] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const currentMission = RESOLUTION_MISSIONS[currentIndex];
  const displayedProgress = useMemo(
    () => `${Math.min(completedUpToIndex + 2, RESOLUTION_MISSIONS.length)}/${RESOLUTION_MISSIONS.length}`,
    [completedUpToIndex]
  );

  useEffect(() => {
    setCanAdvance(false);
  }, [misiStarted, setCanAdvance]);

  // Reset state ketika berpindah soal
  useEffect(() => {
    if (!misiStarted) return;
    setSelected(null);
  }, [currentIndex, misiStarted]);

  const handleAdvanceToNextMission = () => {
    if (currentIndex === RESOLUTION_MISSIONS.length - 1) {
      // Ini soal terakhir, mark sebagai finished
      setIsFinished(true);
      setCompletedUpToIndex(currentIndex);
      setCanAdvance(true);
      return;
    }

    // Bukan soal terakhir, lanjut ke soal berikutnya
    setCompletedUpToIndex(currentIndex);
    setIsTransitioning(true);
    window.setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setIsTransitioning(false);
    }, 220);
  };

  if (!misiStarted) {
    return <ResolutionCover comic={comic} onStart={() => setMisiStarted(true)} />;
  }

  if (isFinished) {
    return <CompletionPage onContinue={() => void nextStage()} />;
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      <header className="rounded-[24px] bg-gradient-to-br from-primary-600 to-primary-700 px-4 py-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <span className="text-lg font-black text-white">6</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/70">Resolution</p>
            <h2 className="mt-0.5 text-base font-black text-white sm:text-lg">Misi Numerasi Candi Jawi</h2>
          </div>
        </div>
      </header>

      <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
        <div className="border-b border-neutral-100 bg-primary-50 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary-500">Tantangan Numerasi</p>
              <h3 className="mt-1 text-lg font-black text-neutral-900">{currentMission.title}</h3>
            </div>
            <div className="rounded-full bg-white px-3 py-1 text-sm font-black text-primary-700 shadow-sm">
              {displayedProgress}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            {RESOLUTION_MISSIONS.map((_, index) => (
              <span
                key={index}
                className={['h-2.5 w-2.5 rounded-full', index <= completedUpToIndex ? 'bg-accent-500' : index === currentIndex ? 'bg-primary-600' : 'bg-neutral-200'].join(' ')}
              />
            ))}
          </div>
        </div>

        <MissionCard
          mission={currentMission}
          missionIndex={currentIndex}
          totalMissions={RESOLUTION_MISSIONS.length}
          selected={selected}
          onSelect={setSelected}
          onReadyToAdvance={handleAdvanceToNextMission}
          isTransitioning={isTransitioning}
        />
      </div>
    </div>
  );
}

function CompletionPage({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="overflow-hidden rounded-[24px] bg-white px-5 py-6 shadow-sm">
      <div className="flex justify-center text-5xl">🎉</div>
      <h3 className="mt-4 text-center text-xl font-black text-neutral-900">Selamat!</h3>
      <p className="mt-2 text-center text-sm leading-relaxed text-neutral-700">
        Kamu telah menyelesaikan seluruh tantangan numerasi Candi Jawi.
      </p>
      <div className="mt-6 rounded-[20px] border border-accent-200 bg-accent-50 px-4 py-4 text-sm text-accent-700">
        Kamu telah menemukan pola volume dari bangun ruang yang ada pada bagian-bagian Candi Jawi.
      </div>
      <button
        type="button"
        onClick={onContinue}
        className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-primary-700"
      >
        <span>🎉</span>
        Saya Sudah Menyelesaikan Resolution
      </button>
    </div>
  );
}

function MissionCard({
  mission,
  missionIndex,
  totalMissions,
  selected,
  onSelect,
  onReadyToAdvance,
  isTransitioning,
}: {
  mission: ResolutionMission;
  missionIndex: number;
  totalMissions: number;
  selected: string | null;
  onSelect: (key: string) => void;
  onReadyToAdvance: () => void;
  isTransitioning: boolean;
}) {
  const { setCanAdvance } = useLearningEngine();
  const [attempts, setAttempts] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [tutorMessage, setTutorMessage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const aiPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTutorMessage(null);
    setTypedText('');
    setIsTyping(false);
    setIsSolved(false);
    setAttempts(0);
    setAnswerFeedback(null);
  }, [mission.id]);

  const handleSubmitAnswer = async () => {
    if (!selected || isSolved || isSubmitting) return;
    setIsSubmitting(true);
    setTutorMessage(null);
    setTypedText('');
    setIsTyping(true);
    setAnswerFeedback(null);

    try {
      const response = await fetch('/api/ai/resolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected, attempt: attempts, missionId: mission.id }),
      });
      const data = await response.json();
      const answerIsCorrect = Boolean(data.correct);
      const fallbackText = getTutorFallback(mission, answerIsCorrect, attempts);
      const aiText = typeof data.explanation === 'string' && data.explanation.trim()
        ? data.explanation
        : fallbackText;

      if (answerIsCorrect) {
        setIsSolved(true);
        setAnswerFeedback('correct');
        setTutorMessage(aiText);
        setCanAdvance(false); // JANGAN auto advance - tunggu user menekan tombol
      } else {
        const nextAttempt = attempts + 1;
        setAttempts(nextAttempt);
        setAnswerFeedback('incorrect');
        setTutorMessage(aiText);
        // Untuk jawaban salah: siswa tetap di soal yang sama, pilihan tetap aktif
      }
    } catch {
      const fallbackText = getTutorFallback(mission, false, attempts);
      setTutorMessage(fallbackText);
      setAnswerFeedback('incorrect');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Typing animation
  useEffect(() => {
    if (!tutorMessage) {
      setTypedText('');
      setIsTyping(false);
      return;
    }

    setTypedText('');
    setIsTyping(true);
    const fullText = tutorMessage;
    let currentIndex = 0;
    const typingTimer = window.setInterval(() => {
      currentIndex += 1;
      setTypedText(fullText.slice(0, currentIndex));
      if (currentIndex >= fullText.length) {
        window.clearInterval(typingTimer);
        setIsTyping(false);
      }
    }, 18);

    return () => window.clearInterval(typingTimer);
  }, [tutorMessage]);

  const handleSpeak = () => {
    if (!('speechSynthesis' in window) || !typedText) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(typedText);
    utterance.lang = 'id-ID';
    utterance.rate = 0.95;
    setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const scrollAiPanelToTop = () => {
    if (aiPanelRef.current) {
      aiPanelRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isReadyToAdvance = isSolved && !isTyping && tutorMessage !== null;

  return (
    <div className={['transition-all duration-200', isTransitioning ? 'translate-x-4 opacity-0' : 'translate-x-0 opacity-100'].join(' ')}>
      <div className="flex flex-col gap-4 px-5 py-5">
        <div className="rounded-[20px] border border-primary-100 bg-primary-50 px-4 py-4">
          <p className="text-sm leading-relaxed text-neutral-700 sm:text-base">
            Bagian: <span className="font-black text-primary-700">{mission.part}</span>
          </p>
          <p className="mt-1 text-sm leading-relaxed text-neutral-700 sm:text-base">
            Bangun: <span className="font-black text-primary-700">{mission.shape}</span>
          </p>
          <p className="mt-3 text-base font-bold leading-relaxed text-neutral-800">{mission.prompt}</p>
        </div>

        <div className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-4">
          <div className="flex items-center justify-center overflow-hidden rounded-[16px] border border-neutral-200 bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mission.illustration}
              alt={`Ilustrasi ${mission.shape}`}
              className="h-44 w-full max-w-[240px] object-contain"
            />
          </div>
          <p className="mt-3 text-center text-sm font-black text-neutral-700">{mission.shape}</p>
        </div>

        <div className="flex flex-col gap-3">
          {mission.options.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              disabled={isSolved}
              className={[
                'flex min-h-[52px] w-full items-center gap-4 rounded-2xl border-2 px-4 py-3 text-left transition active:scale-[0.98]',
                isSolved && selected !== key ? 'opacity-60 cursor-not-allowed' : '',
                selected === key
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 bg-white hover:border-primary-200 hover:bg-primary-50/50'
              ].join(' ')}
            >
              <span
                className={[
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-black',
                  selected === key ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600'
                ].join(' ')}
              >
                {key}
              </span>
              <span
                className={[
                  'text-base font-bold',
                  selected === key ? 'text-primary-700' : 'text-neutral-800'
                ].join(' ')}
              >
                {label}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void handleSubmitAnswer()}
          disabled={!selected || isSolved || isSubmitting}
          className="inline-flex min-h-[46px] w-full items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Mengirim...' : 'Kirim Jawaban'}
        </button>

        {/* Feedback untuk jawaban */}
        {answerFeedback === 'correct' && !isTyping && (
          <div className="rounded-[20px] border-2 border-accent-300 bg-accent-50 px-4 py-4 flex items-center gap-3 animate-pulse">
            <span className="text-3xl">✅</span>
            <div>
              <p className="font-black text-accent-700">Jawaban Benar!</p>
              <p className="text-sm text-accent-600">Bagus sekali! Mari kita pelajari bersama-sama.</p>
            </div>
          </div>
        )}

        {answerFeedback === 'incorrect' && (
          <div className="rounded-[20px] border-2 border-amber-300 bg-amber-50 px-4 py-4 flex items-center gap-3">
            <span className="text-3xl">💡</span>
            <div>
              <p className="font-black text-amber-700">Mari Coba Lagi</p>
              <p className="text-sm text-amber-600">AI Guru sedang memberikan petunjuk di bawah.</p>
            </div>
          </div>
        )}

        {/* AI Tutor Panel */}
        <div ref={aiPanelRef} className="rounded-[20px] border border-primary-100 bg-gradient-to-b from-[#F5FBFF] to-white p-4 shadow-sm overflow-y-auto max-h-96">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-lg text-white">🤖</div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-primary-600">AI Tutor</p>
              <p className="text-sm font-black text-neutral-800">Guru Matematika Candi Jawi</p>
            </div>
          </div>

          <div className="mt-3 rounded-[16px] border border-primary-100 bg-white/90 p-3 text-sm leading-relaxed text-neutral-700 min-h-[100px]">
            {tutorMessage ? (
              <>
                <p className="whitespace-pre-wrap">{typedText}</p>
                {isTyping && <span className="ml-1 animate-pulse">|</span>}
              </>
            ) : (
              <p className="text-neutral-500">
                Saya akan membimbingmu langkah demi langkah untuk memahami {mission.shape.toLowerCase()} dan menghubungkannya dengan Candi Jawi.
              </p>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2 justify-end">
            {tutorMessage && (
              <button
                type="button"
                onClick={scrollAiPanelToTop}
                className="inline-flex items-center justify-center rounded-full border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-100 transition"
              >
                📖 Baca Lagi
              </button>
            )}
            <button
              type="button"
              onClick={handleSpeak}
              disabled={!typedText || isTyping}
              className="inline-flex items-center justify-center rounded-full border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-100 transition disabled:opacity-60"
            >
              {isSpeaking ? '🔊 Mendengar...' : '🔊 Dengarkan'}
            </button>
          </div>
        </div>

        {/* Tombol untuk melanjutkan */}
        {isReadyToAdvance && (
          <button
            type="button"
            onClick={onReadyToAdvance}
            className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent-500 to-accent-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:from-accent-600 hover:to-accent-700 active:scale-[0.98] animate-pulse"
          >
            {missionIndex === totalMissions - 1 ? (
              <>
                <span>🎉</span>
                Saya Sudah Menyelesaikan Resolution
              </>
            ) : (
              <>
                <span>→</span>
                Saya Sudah Paham, Lanjut
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function ResolutionCover({ comic, onStart }: { comic: { title: string; lokasi: string; kelas: string; cover: string }; onStart: () => void }) {
  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">

      {/* Hero image */}
      <div className="-mx-3 sm:mx-0">
        <div className="relative overflow-hidden sm:rounded-[24px]" style={{ aspectRatio: '16/9' }}>
          <Image
            src={comic.cover}
            alt={`Cover ${comic.title}`}
            fill
            className="object-cover object-top"
            priority
            sizes="(max-width: 640px) 100vw, 672px"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 via-primary-800/40 to-transparent" />

          {/* Text overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-end px-5 pb-6 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <span className="text-3xl">🏛️</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-lg sm:text-4xl">
              RESOLUTION
            </h1>
            <p className="mt-1 text-base font-black text-secondary-300 drop-shadow sm:text-lg">
              Misi Bangun Ruang
            </p>
          </div>
        </div>
      </div>

      {/* Description card */}
      <div className="rounded-[24px] bg-white px-5 py-5 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1.5 text-sm font-bold text-primary-700">
            📍 {comic.lokasi}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 px-3 py-1.5 text-sm font-bold text-secondary-700">
            📚 Kelas {comic.kelas}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-neutral-600 sm:text-base">
          Sekarang saatnya menggunakan pengetahuanmu untuk menyelesaikan tantangan matematika
          berdasarkan bagian-bagian Candi Jawi.
        </p>
      </div>

      {/* What you will do */}
      <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-5 py-4">
          <h3 className="text-base font-black text-neutral-700">🎯 Yang Akan Kamu Lakukan</h3>
        </div>
        <ul className="flex flex-col gap-3 px-5 py-4">
          {[
            { emoji: '🔍', text: 'Membaca soal tantangan berdasarkan bagian Candi Jawi.' },
            { emoji: '🧮', text: 'Menghitung menggunakan rumus bangun ruang yang sudah kamu pelajari.' },
            { emoji: '✅', text: 'Menyelesaikan misi dan melanjutkan perjalanan belajarmu.' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3 rounded-2xl bg-primary-50 p-3 sm:p-4">
              <span className="flex-shrink-0 text-xl">{item.emoji}</span>
              <p className="text-sm leading-relaxed text-neutral-700 sm:text-base">{item.text}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onStart}
        className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[20px] bg-primary-600 px-6 py-4 text-base font-black text-white shadow-[0_4px_16px_rgba(24,117,204,0.35)] transition hover:bg-primary-700 active:scale-[0.98]"
      >
        <span>🚀</span>
        Mulai Misi
      </button>

    </div>
  );
}
