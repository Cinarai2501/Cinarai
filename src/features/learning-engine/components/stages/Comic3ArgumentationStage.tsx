'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ObjectAITutor } from '@/features/learning-engine/components/stages/ObjectAITutor';
import type { ArgumentationLearningObject } from '@/features/learning-engine/stages/Argumentation/data/argumentationQuestions';
import { packageContent as comic3Package } from '@/features/comics/comic-3/content/packageContent';

type FeedbackLevel = 'SANGAT_BAIK' | 'HAMPIR_BENAR' | 'PERLU_PERBAIKAN';

interface AiFeedback {
  level: FeedbackLevel;
  score: number;
  feedback: string;
}

interface Comic3ArgumentationStageProps {
  question: ArgumentationLearningObject;
  onSubmitFeedback: (feedback: AiFeedback) => void;
  onAnswerChange: (value: string) => void;
  onNext: () => void;
  feedback: AiFeedback | null;
  comicTitle: string;
  classLevel: string;
  currentIndex: number;
  totalItems: number;
}

export default function Comic3ArgumentationStage({
  question,
  onSubmitFeedback,
  onAnswerChange,
  onNext,
  feedback,
  currentIndex,
  totalItems,
}: Comic3ArgumentationStageProps) {
  const [step, setStep] = useState<'select-shape' | 'select-reasons' | 'feedback'>(
    'select-shape',
  );
  const [selectedShape, setSelectedShape] = useState<string>('');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  useEffect(() => {
    // reset when question changes
    setStep('select-shape');
    setSelectedShape('');
    setSelectedReasons([]);
  }, [question]);

  const shapeOptions = useMemo(() => {
    // derive shape options from Comic 3 learningObjects titles
    return (comic3Package.learningObjects ?? []).map((item) => item.title);
  }, []);

  const reasonOptions = useMemo(() => {
    // find matching learningObject by title or shapeName/shapeKey to get characteristics
    const title = question.objectName ?? '';
    const byTitle = (comic3Package.learningObjects ?? []).find((item) => item.title === title || item.id === question.id || item.image === question.image || item.page === (question as any).page);
    if (byTitle && Array.isArray((byTitle as any).characteristics)) return (byTitle as any).characteristics as string[];
    // fallback: try match by shape name
    const byShape = (comic3Package.learningObjects ?? []).find((item) => item.title === question.solid || item.shapeName === question.solid || item.id === question.id);
    if (byShape && Array.isArray((byShape as any).characteristics)) return (byShape as any).characteristics as string[];
    return [] as string[];
  }, [question]);

  const handleToggleReason = useCallback((reason: string) => {
    setSelectedReasons((prev) => (prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]));
  }, []);

  const handleSubmit = useCallback(() => {
    // Produce simple feedback from configuration
    const expected = question.solid ?? question.objectName ?? '';
    const chosen = selectedShape;
    let level: FeedbackLevel = 'PERLU_PERBAIKAN';
    let score = 2;
    let fb = `Kamu memilih ${chosen}. `;

    if (chosen && chosen.toLowerCase().trim() === expected?.toLowerCase().trim()) {
      level = 'SANGAT_BAIK';
      score = 5;
      fb += question.aiFeedback ?? question.explanation ?? 'Alasanmu sesuai dengan data.';
    } else {
      level = 'PERLU_PERBAIKAN';
      score = 2;
      fb += question.explanation ?? 'Periksa kembali ciri-ciri bangun datar yang tepat.';
    }

    if (selectedReasons.length > 0) {
      fb += ` Pilihan alasanmu: ${selectedReasons.join(', ')}.`;
    }

    const payload: AiFeedback = { level, score, feedback: fb };
    onSubmitFeedback(payload);
    setStep('feedback');
  }, [question, selectedReasons, selectedShape, onSubmitFeedback]);

  return (
    <div className="flex flex-col gap-5">
      <header className="rounded-[20px] bg-gradient-to-br from-secondary-400 to-secondary-600 px-4 py-5 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/80">Argumentation</p>
        <h2 className="mt-1 text-lg font-black text-white">Jelaskan alasanmu</h2>
        <p className="mt-2 text-sm text-white/90">Objek {currentIndex + 1} dari {totalItems}</p>
      </header>

      <div className="rounded-[20px] bg-white p-5 shadow-sm">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-700">Pertanyaan</p>
            <p className="mt-2 text-base leading-relaxed text-neutral-900">Bentuk apakah gambar ini?</p>
          </div>

          <div className="overflow-hidden rounded-[12px] border border-neutral-200 bg-neutral-50 p-3 text-center">
            <Image src={question.image} alt={question.objectName} width={800} height={480} className="mx-auto h-auto w-full max-w-[440px] object-contain" />
          </div>

          {step === 'select-shape' && (
            <div className="space-y-3">
              {shapeOptions.map((shape) => (
                <label key={shape} className={`flex items-center gap-3 rounded-lg border p-3 ${selectedShape === shape ? 'border-primary-600 bg-primary-50' : 'border-neutral-200 bg-white'}`}>
                  <input type="radio" name="comic3-shape" checked={selectedShape === shape} onChange={() => { setSelectedShape(shape); onAnswerChange(shape); }} />
                  <span className="font-semibold">{shape}</span>
                </label>
              ))}

              <div className="flex gap-3">
                <button type="button" onClick={() => { /* go back handled by parent slide nav */ }} className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-900">Kembali</button>
                <button type="button" onClick={() => { if (selectedShape) setStep('select-reasons'); }} disabled={!selectedShape} className="inline-flex items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 text-sm font-bold text-white">Jawab</button>
              </div>
            </div>
          )}

          {step === 'select-reasons' && (
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-700">Mengapa kamu memilih jawaban tersebut?</p>
              {reasonOptions.length > 0 ? (
                <div className="space-y-2">
                  {reasonOptions.map((r: string) => (
                    <label key={r} className="flex items-center gap-3 rounded-lg border p-3">
                      <input type="checkbox" checked={selectedReasons.includes(r)} onChange={() => handleToggleReason(r)} />
                      <span className="text-sm">{r}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-700">Tidak ada pilihan alasan tersedia untuk objek ini.</p>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep('select-shape')} className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-900">Kembali</button>
                <button type="button" onClick={handleSubmit} disabled={selectedReasons.length === 0} className="inline-flex items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 text-sm font-bold text-white">Kirim</button>
              </div>
            </div>
          )}

          {step === 'feedback' && feedback && (
            <div className="space-y-4">
              <div className="rounded-[16px] border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-sm font-semibold">Umpan balik</p>
                <p className="mt-2 text-base leading-relaxed text-neutral-900">{feedback.feedback}</p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => { setStep('select-shape'); }} className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-900">Kembali</button>
                <button type="button" onClick={() => { onNext(); }} className="inline-flex items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 text-sm font-bold text-white">Lanjut Objek Berikutnya</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <ObjectAITutor objectId={question.id} objectName={question.objectName} provider="" comicPage={0} entry={{} as any} initialPrompt={undefined} comicId={3} />
      </div>
    </div>
  );
}
